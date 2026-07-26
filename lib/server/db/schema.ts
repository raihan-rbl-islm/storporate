// Temporary stub schema so `drizzle-kit push` / `drizzle-kit check` resolve
// the schema file during Phase 1. Phase 2 replaces this with the real
// `health_check` table that exercises the pgvector extension.
const schema: Record<string, never> = {};

export default schema;
