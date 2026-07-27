import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Lazy Postgres client.
 *
 * Why lazy: any module that imports `@/lib/server/db` (Server Components,
 * the seed script, the lookup helper) would otherwise crash at module load
 * if DATABASE_URL is unset — including `next build` static collection
 * when env loading races the import. We mirror the lazy pattern from
 * `lib/supabase/server.ts`: read env on first call, NOT on import.
 *
 * Calling `db.select(...)` triggers the lazy connect on first real use.
 * The cache survives across calls within the same process.
 *
 * Concurrency: the synchronous initializer is safe because Node runs
 * JavaScript on a single thread. Two concurrent `db.select()` calls that
 * race the first invocation will both enter `getDb()`; the first one runs
 * the synchronous setup (`postgres(url, …)` + `drizzle(…)`) to completion
 * before yielding, and the second one finds `_db` already set. We do NOT
 * convert this to a Promise-backed initializer because every existing
 * call-site uses `db.select()` synchronously and reshaping that would
 * require touching the schema, the lookup helper, and the seed script —
 * churn with no security gain. The init is kept synchronous for exactly
 * that reason; if a future call-site ever needs to `await db.connect()`,
 * we should add a separate `connectDb()` helper rather than rewrite
 * this Proxy.
 */
let _client: ReturnType<typeof postgres> | null = null;
let _db: PostgresJsDatabase<typeof schema> | null = null;

function getDb(): PostgresJsDatabase<typeof schema> {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  _client = postgres(url, { prepare: false });
  _db = drizzle(_client, { schema });
  return _db;
}

// Proxy so call-sites can keep doing `db.select()...` unchanged.
// We bind methods to the lazily resolved target so Drizzle's internal
// `this` references resolve to the actual driver instance.
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop) {
    const target = getDb() as unknown as Record<string | symbol, unknown>;
    const value = target[prop];
    return typeof value === "function"
      ? (value as (...a: unknown[]) => unknown).bind(target)
      : value;
  },
});