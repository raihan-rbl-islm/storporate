import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { withRateLimit } from "@/lib/ratelimit";

/**
 * Dev-only route that exercises the reusable rate-limit helper. Uses the
 * helper's default policy (10 requests / 10s, sliding window) so manual
 * excess is trivial to demonstrate.
 *
 * Identifier source: `x-forwarded-for` when present, otherwise the literal
 * string `"anonymous"`. The reason this fallback is sane for the demo is
 * that in dev, all curl calls from this machine share one bucket — which is
 * exactly what we want when proving "10 succeed, 11+ returns 429."
 */
export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  const identifier = forwardedFor?.split(",")[0]?.trim() || "anonymous";

  const result = await withRateLimit({ identifier });

  if (!result.success) {
    return NextResponse.json(
      {
        error: "rate_limited",
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        retryAfter: result.retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(result.retryAfter),
        },
      },
    );
  }

  return NextResponse.json({
    ok: true,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    degraded: "degraded" in result ? result.degraded : undefined,
  });
}
