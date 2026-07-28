/**
 * Phase 8: Gemini embedding client.
 *
 * Calls the Gemini REST API directly via fetch (no SDK) so we can keep the
 * bundle small and so the API key only needs to exist at runtime, not at
 * build time. The endpoint, model name, and response shape are documented
 * here: https://ai.google.dev/api/embeddings
 *
 * Returns `null` on ANY error — callers treat null as "we couldn't embed
 * right now" and fall back to heuristic scorers. Never throws.
 */
export async function embedText(text: string): Promise<number[] | null> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001";

  // Defensive trim — Gemini's embedContent endpoint documents an 8k token
  // input window, but our DB stores a text column that's effectively
  // unbounded. 2048 chars is well within any sensible limit and keeps the
  // network payload bounded.
  const trimmed = text.slice(0, 2048);

  // `gemini-embedding-001` defaults to 3072-dim vectors, but our pgvector
  // columns are declared `vector(768)` (see lib/server/db/schema.ts).
  // Without `outputDimensionality: 768` the inserts fail with
  // "expected 768 dimensions, not 3072". 768 is the standard MRL
  // truncation size for this model.
  const outputDimensionality = 768;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text: trimmed }] },
        outputDimensionality,
      }),
    });

    if (!res.ok) return null;

    const json = (await res.json()) as {
      embedding?: { values?: number[] };
    };
    const values = json.embedding?.values;
    if (!Array.isArray(values) || values.length === 0) return null;
    return values;
  } catch {
    return null;
  }
}
