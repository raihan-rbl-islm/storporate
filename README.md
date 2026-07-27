# Storporate

Storporate is a Bangladesh-first academic–industry collaboration platform for students, university clubs, and corporate organizations.

## Local setup

1. Install [Node.js](https://nodejs.org/) and npm.
2. Install dependencies: `npm install`.
3. Copy `.env.example` to `.env.local` (values are added in later Phase 0 checkpoints).
4. Start the development server: `npm run dev`.
5. Open [http://localhost:3000](http://localhost:3000).

## Commands

| Command                | Purpose                                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| `npm run dev`          | Start the local development server                                                                 |
| `npm run build`        | Create a production build                                                                          |
| `npm run start`        | Run the production build                                                                           |
| `npm run lint`         | Check JavaScript and TypeScript with ESLint                                                        |
| `npm run typecheck`    | Check TypeScript without emitting files                                                            |
| `npm run format`       | Format the repository with Prettier                                                                |
| `npm run format:check` | Verify formatting without changing files                                                           |
| `npm run db:push`      | Apply the current Drizzle schema to the database (loads `.env.local`)                              |
| `npm run db:verify`    | Round-trip a pgvector value via `scripts/verify-pgvector.ts` (loads `.env.local`)                  |
| `npm run db:check`     | Verify the local Drizzle schema matches the database without applying changes (loads `.env.local`) |
| `npm run db:studio`    | Open Drizzle Studio against the database (loads `.env.local`)                                      |

## Database (Phase 0 Checkpoint 2)

The infrastructure tables (currently only `health_check`, used to verify pgvector is reachable) live on Supabase Postgres. To wire a fresh project:

1. Create a Supabase project at <https://supabase.com/dashboard>.
2. Copy the **Transaction** connection string from **Project Settings → Database → Connection string** into `DATABASE_URL` in `.env.local` (do **not** commit `.env.local`).
3. In the dashboard, open **Database → Extensions** and enable `vector` (pgvector).
4. From the repository root, run `npm run db:push` to apply the schema.
5. Run `npm run db:verify` to confirm pgvector round-trips a vector end-to-end.

The Drizzle schema lives in `lib/server/db/schema.ts`. Migrations are managed via `drizzle-kit push` (state-tracked, not file-tracked) — re-running `db:push` after a no-op schema change must print `No changes detected`. The single server-side entry point is `lib/server/db/index.ts` and is marked `import "server-only"` so it can never be bundled into the client.

## Error monitoring (Phase 0 Checkpoint 5)

Sentry captures browser errors, server-side request errors, and unhandled promise rejections. Configuration lives in:

- `sentry.server.config.ts` — Node.js server runtime init.
- `sentry.edge.config.ts` — Edge runtime init.
- `instrumentation.ts` — registers the right config per `NEXT_RUNTIME`; exports `onRequestError = Sentry.captureRequestError` so route handlers, server actions, server components, and middleware errors reach Sentry.
- `instrumentation-client.ts` — browser-side init; uncaught exceptions and unhandled rejections are captured by the SDK defaults.
- `next.config.ts` — wrapped with `withSentryConfig` so production builds upload source maps.

Required env vars in `.env.local`: `NEXT_PUBLIC_SENTRY_DSN`, plus `SENTRY_AUTH_TOKEN` (production source-map upload only — empty locally is fine). Vercel must hold the same two values in all environments.

To prove the wiring works locally, `GET /api/dev/sentry-test` throws an error that appears in the Sentry project's Issues feed within a minute or so. The route returns `404` when `NODE_ENV === "production"`.

## Rate limiting (Phase 0 Checkpoint 5)

A single reusable server-only helper lives at `lib/ratelimit.ts`. It uses `@upstash/ratelimit` against an Upstash Redis database. Every later feature API route should call this rather than touching Upstash directly.

**Default policy:** 10 requests per 10 seconds, sliding window. Tunable per call site.

**Required env vars in `.env.local`:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`. Vercel must hold the same two values.

**Usage:**

```ts
import { withRateLimit } from "@/lib/ratelimit";

const r = await withRateLimit({
  identifier: request.headers.get("x-forwarded-for") ?? "anonymous",
});
if (r.status === "limited") {
  return NextResponse.json(
    { error: "rate_limited", retryAfter: r.retryAfter },
    { status: 429, headers: { "Retry-After": String(r.retryAfter) } },
  );
}
if (r.status === "degraded") {
  // Upstash was unreachable; the request is allowed through. Log this
  // so the on-call can investigate.
}
```

The helper returns a union on `status`:

- `"ok"` — request is permitted; payload includes `limit`, `remaining`, `reset`.
- `"limited"` — request is over the limit; payload includes `retryAfter` seconds.
- `"degraded"` — Upstash was unreachable; the request is allowed through and the operator should investigate.

A misconfiguration (missing env vars) throws — it does not silently fail.

To prove the wiring works locally, hit `GET /api/dev/rate-limit-test` twelve times in quick succession; the first ten return `200`, the last two return `429` with a `Retry-After` header. The route returns `404` when `NODE_ENV === "production"`.

## Environment variables

Every configuration value the app needs lives in `.env.example` (tracked) — copy it to `.env.local` (ignored) and fill in real values for local development. Production secrets live in the Vercel project under Settings → Environment Variables (Production scope), marked Sensitive so the value is write-only.

See `.env.example` for the canonical list and per-variable descriptions.

## Project structure

```text
app/             Next.js routes and layouts
components/      Reusable interface components
lib/client/      Browser-only helpers
lib/server/      Server-only helpers
public/          Static files
scripts/seed/    Future persona and reference-data seed scripts
tests/smoke/     Future Playwright smoke tests
```

Implementation sequence and acceptance criteria live in `../storporate-backlog/storporate-execution-plan.md`.
