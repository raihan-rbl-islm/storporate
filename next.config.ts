import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  serverExternalPackages: ["postgres", "drizzle-orm"],
};

// `org`, `project`, and `authToken` are read from env at build time so this
// file does not need to hard-code project-specific values per environment.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Resolve production stack traces to original code, not minified bundles.
  widenClientFileUpload: true,

  // Route Sentry events through our own domain so ad-blockers cannot drop
  // them. Excluded from middleware via the `(?!monitoring)` matcher when
  // middleware is added in a later checkpoint.
  tunnelRoute: "/monitoring",

  // Local output is noisy; CI keeps the full report. Source-map upload is
  // skipped automatically when `SENTRY_AUTH_TOKEN` is unset (the authToken
  // above becomes `undefined`).
  silent: !process.env.CI,
});
