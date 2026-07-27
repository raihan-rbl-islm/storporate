import {
  pgTable,
  serial,
  text,
  timestamp,
  customType,
} from "drizzle-orm/pg-core";

/**
 * pgvector is not exported from drizzle-orm/pg-core. We register a custom
 * Postgres type that emits `vector(N)` columns and round-trips a JS number[]
 * through pgvector's bracket-literal wire format.
 *
 * IMPORTANT: the `toDriver` here covers typed inserts via
 * `db.insert(table).values({ embedding: arr })`. Raw `sql` template literals
 * that interpolate an array directly will NOT be reformatted — see the
 * `toVectorLiteral` helper in `scripts/verify-pgvector.ts` for the correct
 * stringification when using raw SQL.
 */
const vector = (dim: number) =>
  customType<{ data: number[]; driverData: string }>({
    dataType() {
      return `vector(${dim})`;
    },
    toDriver(v: number[]) {
      return `[${v.join(",")}]`;
    },
    fromDriver(s: string) {
      return s
        .replace(/[\[\]]/g, "")
        .split(",")
        .map(Number);
    },
  });

/**
 * Dimensions: 768 is the standard Matryoshka Representation Learning (MRL)
 * truncation option for `gemini-embedding-001` (the current Gemini embedding
 * model — `text-embedding-004` is being deprecated 2026-01-14). 768 is also
 * what most Supabase+Gemini pgvector guides standardize on. Locking this in
 * here so Phase 3 product tables use the same dimension. Changing a vector
 * column's dimension later requires a real migration, not a config edit.
 */
export const healthCheck = pgTable("health_check", {
  id: serial("id").primaryKey(),
  embedding: vector(768)("embedding").notNull(),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
