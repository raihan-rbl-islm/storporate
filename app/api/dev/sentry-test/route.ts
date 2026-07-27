import { NextResponse } from "next/server";

/**
 * Dev-only route that throws on purpose so we can prove Sentry server-side
 * error capture works end-to-end. In production this returns 404 — there is
 * no other branch, so a misconfigured production build cannot accidentally
 * expose test-only error behavior to the public.
 *
 * The thrown error is captured by `Sentry.captureRequestError` wired in
 * `instrumentation.ts` (the App Router `onRequestError` hook). We do not
 * call `Sentry.captureException` here on purpose — the goal is to exercise
 * the request-scoped capture path, which is the one Next.js routes use.
 */
export const dynamic = "force-dynamic";

export function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  throw new Error("storporate-sentry-dev-trigger");
}
