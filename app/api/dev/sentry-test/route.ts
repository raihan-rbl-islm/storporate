import { NextResponse } from "next/server";

/**
 * Dev-only route that throws on purpose so Sentry server-side error
 * capture is provable end-to-end. Returns 404 in production so the test
 * path cannot be probed publicly.
 *
 * Capture is delegated to the `onRequestError` hook in `instrumentation.ts`
 * — we do not call `Sentry.captureException` here on purpose, because the
 * goal is to exercise the request-scoped capture path that Next.js routes
 * use.
 */
export const dynamic = "force-dynamic";

export function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  throw new Error("storporate-sentry-dev-trigger");
}
