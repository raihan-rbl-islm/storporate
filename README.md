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
