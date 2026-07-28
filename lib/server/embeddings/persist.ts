/**
 * Phase 8: attach an embedding to a row before persisting.
 *
 * The shape returned by `attachEmbedding` matches the DB column layout:
 * `embedding` is a `number[]` when Gemini succeeded, or `null` when it
 * didn't. `needsEmbedding` is `true` whenever we either didn't run the
 * embed call or ran it and failed — so the next `recompute-embeddings`
 * cron run retries it.
 */
import { embedText } from "./gemini";

type Embedded<T> = T & {
  embedding: number[] | null;
  needsEmbedding: boolean;
};

export function attachEmbedding<T>(
  compose: (row: T) => string,
): (row: T) => Promise<Embedded<T>> {
  return async (row: T): Promise<Embedded<T>> => {
    try {
      const vec = await embedText(compose(row));
      if (vec && vec.length > 0) {
        return {
          ...row,
          embedding: vec,
          needsEmbedding: false,
        };
      }
    } catch {
      // Fall through to the "needs retry" branch below.
    }
    return {
      ...row,
      embedding: null,
      needsEmbedding: true,
    };
  };
}
