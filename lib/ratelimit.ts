import "server-only";

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

/**
 * Reusable server-only rate-limit helper. Every later feature API route
 * should call this rather than touching Upstash directly.
 *
 * Default policy is 10 requests per 10 seconds, sliding window. Tunable per
 * call site via the `limit` and `window` options.
 *
 * Failure mode: misconfiguration (missing env vars) throws loudly on the
 * first call. Transient Upstash errors do not crash the request; we log to
 * stderr and return a `status: "degraded"` result so the caller can decide
 * whether to allow the request through. Over-limit requests get
 * `status: "limited"` with `retryAfter` seconds.
 */

const RATE_LIMIT_PREFIX = "storporate:rl";
const DEFAULT_LIMIT = 10;
const DEFAULT_WINDOW = "10 s" as const;

let cachedRedis: Redis | null = null;

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

type Window = `${number} s` | `${number} m` | `${number} h` | `${number} d`;

export type RateLimitResult =
  | {
      status: "ok";
      remaining: number;
      reset: number;
      limit: number;
    }
  | {
      status: "limited";
      remaining: number;
      reset: number;
      limit: number;
      retryAfter: number;
    }
  | { status: "degraded" };

type WithRateLimitOptions = {
  identifier: string;
  limit?: number;
  window?: Window;
  prefix?: string;
};

/**
 * Run a sliding-window rate-limit check for the given identifier. Returns
 * a discriminated union on `status` — narrow on `status === "limited"` to
 * reject, on `"degraded"` to log/observe upstream failure, otherwise the
 * request is permitted.
 *
 * @example
 *   const r = await withRateLimit({ identifier: ip });
 *   if (r.status === "limited") {
 *     return NextResponse.json({ error: 'rate_limited' }, {
 *       status: 429,
 *       headers: { 'Retry-After': String(r.retryAfter) },
 *     });
 *   }
 */
export async function withRateLimit(
  options: WithRateLimitOptions,
): Promise<RateLimitResult> {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const window = options.window ?? DEFAULT_WINDOW;
  const prefix = options.prefix ?? RATE_LIMIT_PREFIX;

  try {
    const limiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix,
      analytics: false,
    });

    const out = await limiter.limit(options.identifier);
    if (!out.success) {
      const retryAfter = Math.max(
        1,
        Math.ceil((out.reset - Date.now()) / 1000),
      );
      return {
        status: "limited",
        remaining: out.remaining,
        reset: out.reset,
        limit: out.limit,
        retryAfter,
      };
    }
    return {
      status: "ok",
      remaining: out.remaining,
      reset: out.reset,
      limit: out.limit,
    };
  } catch (error) {
    // Transient Upstash failure. Allow the request through so callers
    // degrade visibly without going down; surface `status: "degraded"` so
    // the operator can see it in logs.
    console.error("[withRateLimit] degraded — Upstash call failed:", error);
    return { status: "degraded" };
  }
}
