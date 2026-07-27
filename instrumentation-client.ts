import * as Sentry from "@sentry/nextjs";

/**
 * Browser-side Sentry initialization. Loaded by Next.js automatically when
 * this file exists at the project root. We intentionally do not enable
 * session replay or logs in this checkpoint — both add bundle weight and the
 * demo's primary need is "errors land in Sentry."
 *
 * Uncaught exceptions and unhandled promise rejections are captured by
 * default in @sentry/nextjs@10.x via the SDK's global handlers; we do not
 * need to wire them ourselves. The "browser errors, server exceptions, and
 * unhandled promise rejections are captured" acceptance criterion is
 * satisfied by the SDK defaults plus the `onRequestError` hook in
 * `instrumentation.ts` (which captures server-side request errors).
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  sendDefaultPii: false,
});

/**
 * App Router navigation breadcrumbs. Wire the hook so client-side route
 * transitions show up as breadcrumbs in Sentry.
 */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
