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
