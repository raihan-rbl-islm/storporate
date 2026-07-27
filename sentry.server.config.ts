import "server-only";
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  // Local variables are attached to stack frames on the Node runtime only —
  // the edge runtime does not support introspection — so this is set only
  // here.
  includeLocalVariables: true,
  sendDefaultPii: false,
});
