import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { withRateLimit } from "@/lib/ratelimit";

/**
 * Dev-only route that exercises the reusable rate-limit helper. Returns
 * 404 in production so the test route cannot be abused publicly.
 *
 * `x-forwarded-for` is split on commas so only the first (real-client) IP
 * is used; without that, a multi-hop proxy would let attackers stamp
 * unique identifiers and bypass the limiter.
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

  if (result.status === "limited") {
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

  if (result.status === "ok") {
    return NextResponse.json({
      ok: true,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    });
  }

  return NextResponse.json({
    ok: true,
    degraded: true,
  });
}
