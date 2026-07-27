import * as Sentry from "@sentry/nextjs";

/**
 * `@sentry/nextjs` requires the right config to load per runtime. We do not
 * bundle both into the client because they reference Node-only or
 * edge-only APIs respectively.
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
 * from server components, route handlers, server actions, and middleware
 * never reach Sentry even when `register` succeeds. Requires
 * `@sentry/nextjs >= 8.28.0` — pinned version (10.x) supports it.
 */
export const onRequestError = Sentry.captureRequestError;
