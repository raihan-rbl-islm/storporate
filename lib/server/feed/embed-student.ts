import "server-only";
import { eq } from "drizzle-orm";

import { db } from "@/lib/server/db";
import { students } from "@/lib/server/db/schema";
import { embedText } from "@/lib/server/embeddings/gemini";
import { studentComposer } from "@/lib/server/embeddings/composers";

/**
 * Phase 8.5: lazily compute & persist a student's profile embedding.
 *
 * If the student row already has a non-null `embedding` (or the row is
 * missing entirely), this is a no-op. Otherwise we call `embedText`
 * against `studentComposer(student)` and write the result back to the
 * `students` table — flipping `needs_embedding` to `false` on success.
 *
 * On a Gemini failure we leave the row alone (keep
 * `needs_embedding = true`) so the next request, or a future cron run,
 * can retry. We never throw — callers always get a usable embedding
 * back, even if it's null.
 */
export async function ensureStudentEmbedding(
  studentId: string,
): Promise<number[] | null> {
  const [row] = await db
    .select({
      id: students.id,
      fullName: students.fullName,
      bio: students.bio,
      skills: students.skills,
      careerInterests: students.careerInterests,
      location: students.location,
      embedding: students.embedding,
    })
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);
  if (!row) return null;
  if (row.embedding && row.embedding.length > 0) return row.embedding;

  let vec: number[] | null = null;
  try {
    vec = await embedText(studentComposer(row));
  } catch {
    vec = null;
  }
  if (!vec) {
    // Don't overwrite an existing null with another null — keep
    // `needs_embedding = true` so the cron sweeper retries. Returning
    // null here tells the caller "we don't have an embedding right now".
    return null;
  }
  await db
    .update(students)
    .set({ embedding: vec, needsEmbedding: false })
    .where(eq(students.id, studentId));
  return vec;
}