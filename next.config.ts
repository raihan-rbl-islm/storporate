import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Keep the existing serverExternalPackages from Checkpoint 4. Sentry's
  // `withSentryConfig` wraps this object as-is; it only adds source-map
  // upload and instrumentation hooks.
  serverExternalPackages: ["postgres", "drizzle-orm"],
};

// Wrap with `withSentryConfig` so source maps are uploaded on production
// builds and instrumentation hooks are installed. Org, project, and
// authToken are read from the environment so this file stays portable across
// local / preview / production without code edits.
export default withSentryConfig(nextConfig, {
  // These values are placeholders read from the env at build time. The
  // Sentry plugin pulls from SENTRY_ORG / SENTRY_PROJECT / SENTRY_AUTH_TOKEN
  // when these options are undefined, so the file does not need a hard
  // organization or project slug committed to source control.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Upload a wider set of client source files so production stack traces
  // resolve to original code, not minified bundles.
  widenClientFileUpload: true,

  // Tunnel through our own domain so ad-blockers do not drop Sentry events.
  tunnelRoute: "/monitoring",

  // Quiet local output; CI logs the full report.
  silent: !process.env.CI,
  // Local builds where `SENTRY_AUTH_TOKEN` is unset simply skip source-map
  // upload — `authToken` above becomes `undefined`, and the SDK no-ops.
});
