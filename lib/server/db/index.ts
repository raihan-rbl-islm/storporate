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
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop) {
    const target = getDb() as unknown as Record<string | symbol, unknown>;
    const value = target[prop];
    return typeof value === "function"
      ? (value as (...a: unknown[]) => unknown).bind(target)
      : value;
  },
});
