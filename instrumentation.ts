import * as Sentry from "@sentry/nextjs";

/**
 * Server-side Sentry initialization for Next.js.
 *
 * `register` runs once per server runtime. We load the Sentry server or edge
 * config based on which runtime Next.js picked for this process. Edge runtimes
 * also need this hook so that requests handled in middleware/route handlers on
 * the edge are captured.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

/**
 * App Router hook for request-scoped server errors. Without this, errors
 * thrown from server components, route handlers, server actions, and
 * middleware are not forwarded to Sentry even though `register` succeeds.
 *
 * Requires @sentry/nextjs >= 8.28.0. The pinned version (10.x) supports it.
 */
export const onRequestError = Sentry.captureRequestError;
