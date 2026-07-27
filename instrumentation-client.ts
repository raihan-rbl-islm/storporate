import * as Sentry from "@sentry/nextjs";

/**
 * Uncaught exceptions and unhandled promise rejections are captured by
 * SDK defaults in `@sentry/nextjs@10.x`; no extra options are required to
 * satisfy the "browser errors, server exceptions, and unhandled promise
 * rejections are captured" criterion. Replay and structured logs are
 * intentionally left disabled in this checkpoint — they would add bundle
 * weight without changing which signals are captured.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  sendDefaultPii: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
