/**
 * Round-trip a vector through pgvector. Inserts three rows with
 * meaningfully different embeddings, runs a cosine-similarity query against
 * `a`, asserts that a ranks itself at ≈1.0 and an orthogonal vector
 * (c) ranks well below a similar one (b), then cleans up.
 *
 * Idempotency: deletes all rows from health_check before exiting, so
 * consecutive runs both leave the table empty.
 *
 * NOTE: This script only runs successfully against a database that has had
 * the schema applied via `npm run db:push`. Until that happens the table
 * `health_check` does not exist and the script will fail at insert/query.
 * Run static checks (lint, typecheck, format:check, build) without
 * DATABASE_URL; only run `npm run db:verify` once the schema is applied.
 */
import "dotenv/config"; // belt-and-braces; dotenv-cli already loaded .env.local
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { healthCheck } from "../lib/server/db/schema";

/**
 * postgres.js serializes a plain JS array using Postgres's native array
 * syntax (`{0.1,0,...}`), NOT pgvector's bracket syntax. Casting that to
 * `::vector` throws a type error. For raw `sql` queries we must stringify
 * to the bracket form first. (Typed `db.insert(...)` calls don't need this
 * because `vector(...).toDriver()` in the schema already does it.)
 */
const toVectorLiteral = (v: readonly number[]) => `[${v.join(",")}]`;

const DIM = 768;

function buildVector(strategy: "a" | "b" | "c"): number[] {
  const out = new Array<number>(DIM).fill(0);
  if (strategy === "a") {
    // Strong weight on dim 0, light weight on dim 1, zero elsewhere.
    out[0] = 1.0;
    out[1] = 0.1;
  } else if (strategy === "b") {
    // Same direction as `a`, with small noise. Should rank close to a.
    out[0] = 1.0;
    out[1] = 0.1;
    out[2] = 0.05;
    out[3] = 0.05;
  } else {
    // Orthogonal to `a`. Should rank far below both.
    out[DIM - 1] = 1.0;
  }
  return out;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const client = postgres(url, { prepare: false });
  const db = drizzle(client);

  const a = buildVector("a");
  const b = buildVector("b");
  const c = buildVector("c");

  // Always start clean so reruns are deterministic.
  await db.delete(healthCheck);

  await db.insert(healthCheck).values([
    { embedding: a, note: "a" },
    { embedding: b, note: "b" },
    { embedding: c, note: "c" },
  ]);

  const rows = await db.execute<{ note: string; similarity: number }>(sql`
    SELECT note, 1 - (embedding <=> ${toVectorLiteral(a)}::vector) AS similarity
    FROM health_check
    ORDER BY embedding <=> ${toVectorLiteral(a)}::vector
    LIMIT 3;
  `);

  console.log("verify-pgvector result:", rows);

  // Sanity-check the ranking. These thresholds are deliberately loose so
  // the script doesn't flake on floating-point noise.
  const simByNote = new Map<string, number>();
  for (const r of rows as unknown as Array<{
    note: string;
    similarity: number;
  }>) {
    simByNote.set(r.note, Number(r.similarity));
  }
  const simA = simByNote.get("a") ?? 0;
  const simB = simByNote.get("b") ?? 0;
  const simC = simByNote.get("c") ?? 0;
  if (!(simA > 0.99)) throw new Error(`expected sim(a,a) ≈ 1.0, got ${simA}`);
  if (!(simB > simC))
    throw new Error(`expected sim(a,b) > sim(a,c); got ${simB} vs ${simC}`);

  await db.delete(healthCheck);
  await client.end();
  console.log("verify-pgvector ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
