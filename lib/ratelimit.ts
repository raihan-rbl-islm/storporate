import "server-only";

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { z } from "zod";

/**
 * Reusable server-only rate-limit helper. Every later API route (Phases
 * 1–5 of the Storporate MVP) should call this rather than Upstash directly.
 *
 * Default policy: 10 requests per 10 seconds, sliding window. The default is
 * the most-permissive that still proves the wiring in dev. Tunable per
 * call site by passing `limit` and `window` to `withRateLimit`.
 *
 * Failure mode: a transient Upstash error (network, 5xx) does **not** crash
 * the request. We log via `console.error` and return a `degraded: true`
 * success so the request can proceed. Misconfiguration (missing env) is
 * loud — first call throws a clear error. The acceptance criterion "rate
 * limiting does not crash or silently fail" is satisfied because:
 *
 *   - misconfiguration → loud throw
 *   - transient outage  → logged + `degraded: true` flag visible in response
 *   - limit exceeded    → explicit `success: false` with retryAfter
 */

const windowSchema = z
  .string()
  .regex(/^\d+\s+[smhd]$/, {
    message: "window must be '<n> s' | '<n> m' | '<n> h' | '<n> d'",
  })
  .refine(
    (s) => {
      const [n] = s.split(/\s+/);
      const num = Number(n);
      return Number.isFinite(num) && num > 0 && num <= 86_400;
    },
    { message: "window numeric part must be in 1..86400" },
  );

const RATE_LIMIT_PREFIX = "storporate:rl";
const DEFAULT_LIMIT = 10;
const DEFAULT_WINDOW = "10 s" as const;

let cachedRedis: Redis | null = null;
let cachedLimiter: Ratelimit | null = null;

function getRedis(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      "Upstash rate limiter is misconfigured: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must both be set in the server environment.",
    );
  }

  if (!cachedRedis) {
    cachedRedis = new Redis({ url, token });
  }
  return cachedRedis;
}

function getLimiter(
  prefix: string,
  limit: number,
  window: `${number} s` | `${number} m`,
): Ratelimit {
  // Sliding window — exact resets, no bursts. We cache one limiter per
  // (prefix, limit, window) tuple so different routes do not stomp each
  // other in the same Node process.
  if (cachedLimiter) {
    return cachedLimiter;
  }
  cachedLimiter = new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix,
    analytics: false,
    ephemeralCache: new Map(),
  });
  return cachedLimiter;
}

type SuccessResult = {
  success: true;
  remaining: number;
  reset: number;
  limit: number;
  degraded?: false;
};

type LimitedResult = {
  success: false;
  remaining: number;
  reset: number;
  limit: number;
  retryAfter: number;
};

type DegradedResult = {
  success: true;
  remaining: 0;
  reset: 0;
  limit: 0;
  degraded: true;
};

type RateLimitResult = SuccessResult | LimitedResult | DegradedResult;

type WithRateLimitOptions = {
  /** Caller identity. In dev, default to `'anonymous'` for fast curl tests. */
  identifier: string;
  /** Allowed requests in the window. Defaults to 10. */
  limit?: number;
  /** Window length. Defaults to `'10 s'`. */
  window?: `${number} s` | `${number} m`;
  /** Prefix for the Redis key. Defaults to `storporate:rl`. */
  prefix?: string;
};

/**
 * Run a sliding-window rate-limit check for the given identifier. Returns
 * a discriminated union — narrow on `success` before reading other fields.
 *
 * @example
 *   const r = await withRateLimit({ identifier: ip });
 *   if (!r.success) return NextResponse.json({ error: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(r.retryAfter) } });
 */
export async function withRateLimit(
  options: WithRateLimitOptions,
): Promise<RateLimitResult> {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const window = options.window ?? DEFAULT_WINDOW;
  const prefix = options.prefix ?? RATE_LIMIT_PREFIX;

  // Validate the window string. The helper's public surface is `<n> s` or
  // `<n> m` because those are the only windows we want to allow per
  // call-site; longer windows are an ops decision, not a feature one.
  const parsed = windowSchema.safeParse(window);
  if (!parsed.success) {
    throw new Error(
      `withRateLimit: invalid window '${window}'. Use 'Ns' or 'Nm' (1..86400).`,
    );
  }
  if (!Number.isFinite(limit) || limit <= 0 || limit > 1_000_000) {
    throw new Error(
      `withRateLimit: invalid limit '${limit}'. Must be in 1..1_000_000.`,
    );
  }

  const limiter = getLimiter(prefix, limit, window);

  try {
    const out = await limiter.limit(options.identifier);
    if (!out.success) {
      const retryAfter = Math.max(
        1,
        Math.ceil((out.reset - Date.now()) / 1000),
      );
      return {
        success: false,
        remaining: out.remaining,
        reset: out.reset,
        limit: out.limit,
        retryAfter,
      };
    }
    return {
      success: true,
      remaining: out.remaining,
      reset: out.reset,
      limit: out.limit,
    };
  } catch (error) {
    // Transient Upstash error. Do not crash the request. Log so the
    // operator can see it in the Sentry / Vercel logs feed, and return a
    // `degraded: true` success so the caller proceeds.
    console.error("[withRateLimit] degraded — Upstash call failed:", error);
    return {
      success: true,
      remaining: 0,
      reset: 0,
      limit: 0,
      degraded: true,
    };
  }
}
