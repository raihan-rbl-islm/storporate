import "server-only";
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 100% in development, 10% in production. Free-tier-friendly for a demo.
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Attach local variable values to stack frames so server-side issues are
  // readable in Sentry without source-map digging on the demo build.
  includeLocalVariables: true,

  sendDefaultPii: false,
});
