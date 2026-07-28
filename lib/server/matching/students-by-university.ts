/**
 * Phase 8.4: ranked students from a specific university.
 *
 * URL scheme: `/students/[university]` where `university` is a kebab-case
 * slug (e.g. `brac-university`). This module converts the slug back into
 * the canonical DB form (`university.replace('-', ' ')`) and matches with
 * `LOWER(university) = LOWER($1)` so casing variants land on the same
 * row.
 *
 * Two scoring paths:
 *  - When `jobId` is provided: cosine-similarity against the job's
 *    embedding (with the same fallback as
 *    `getRankedCandidatesForJob`).
 *  - Otherwise: a generic "profile quality" score — count of
 *    experiences + achievements + activities. Higher = better.
 */
import { eq, sql } from "drizzle-orm";

import { db } from "@/lib/server/db";
import {
  jobs,
  studentAchievements,
  studentActivities,
  studentExperiences,
  students,
} from "@/lib/server/db/schema";
import {
  scoreJobForStudent,
  type JobForScoring,
  type StudentForScoring,
} from "@/lib/server/matching/fallback-scorers";

export type RankedStudent = {
  student: typeof students.$inferSelect;
  score: number;
};

function universityFromSlug(slug: string): string {
  return slug.replace(/-/g, " ").trim();
}

/**
 * Returns ranked students matching `universitySlug`.
 *
 * @param universitySlug kebab-case URL param
 * @param jobId optional job id to score against (cosine path).
 */
export async function getRankedStudentsByUniversity(
  universitySlug: string,
  jobId?: string,
  limit = 100,
): Promise<RankedStudent[]> {
  const displayUniversity = universityFromSlug(universitySlug);

  // Job context (optional)
  let jobRow:
    | (typeof jobs.$inferSelect & { embedding: number[] | null })
    | null = null;
  if (jobId) {
    const [j] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    jobRow = j ?? null;
  }
  const jobForScore: JobForScoring | null = jobRow
    ? {
        skills: jobRow.skills ?? [],
        locationLabel: jobRow.locationLabel ?? "",
        isRemote: jobRow.isRemote ?? false,
        employmentType: jobRow.employmentType ?? "",
      }
    : null;

  // Base set of students from this university. We filter LOWER side on
  // both sides so casing variants don't trip us up.
  const baseStudents = await db
    .select()
    .from(students)
    .where(sql`LOWER(${students.university}) = LOWER(${displayUniversity})`);

  if (baseStudents.length === 0) return [];

  // Onboarded mask: a student counts as "onboarded" if they have at
  // least one experience/achievement/activity row.
  const onboardedIds = new Set<string>();
  for (const s of baseStudents) {
    const [exp] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(studentExperiences)
      .where(eq(studentExperiences.studentId, s.id));
    const [ach] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(studentAchievements)
      .where(eq(studentAchievements.studentId, s.id));
    const [act] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(studentActivities)
      .where(eq(studentActivities.studentId, s.id));
    const total = (exp?.n ?? 0) + (ach?.n ?? 0) + (act?.n ?? 0);
    if (total > 0) onboardedIds.add(s.id);
  }

  const onboardedStudents = baseStudents.filter((s) =>
    onboardedIds.has(s.id),
  );

  // Cosine path (jobId provided + job has an embedding).
  if (jobRow?.embedding && jobRow.embedding.length > 0 && jobForScore) {
    const vectorLiteral = `[${jobRow.embedding.join(",")}]`;
    const raw = await db.execute<{
      id: string;
      distance: number;
    }>(sql`
      SELECT id,
             (embedding <=> ${vectorLiteral}::vector) AS distance
      FROM students
      WHERE needs_embedding = false
      ORDER BY embedding <=> ${vectorLiteral}::vector
      LIMIT ${limit * 2}
    `);
    const rows = (raw as unknown as { rows?: unknown[] }).rows ?? raw;
    const rankedIds = (rows as Array<{ id: string; distance: number }>)
      .map((r) => ({ id: r.id, score: Math.max(0, Math.min(1, 1 - Number(r.distance))) }))
      .filter((r) =>
        onboardedStudents.some((s) => s.id === r.id),
      )
      .slice(0, limit);
    return rankedIds
      .map((r) => {
        const s = onboardedStudents.find((x) => x.id === r.id);
        if (!s) return null;
        return { student: s, score: r.score };
      })
      .filter((x): x is RankedStudent => x !== null);
  }

  // Fallback / generic path.
  // Build a profile-quality map: count of
  // experiences+achievements+activities per student id, then normalize
  // by the max seen (so scores land in [0, 1]).
  const counts = new Map<string, number>();
  for (const s of onboardedStudents) {
    const [exp] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(studentExperiences)
      .where(eq(studentExperiences.studentId, s.id));
    const [ach] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(studentAchievements)
      .where(eq(studentAchievements.studentId, s.id));
    const [act] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(studentActivities)
      .where(eq(studentActivities.studentId, s.id));
    counts.set(
      s.id,
      (exp?.n ?? 0) + (ach?.n ?? 0) + (act?.n ?? 0),
    );
  }
  const maxCount = Math.max(1, ...Array.from(counts.values()));

  return onboardedStudents
    .map((s) => {
      if (jobForScore) {
        const studentForScore: StudentForScoring = {
          skills: s.skills ?? [],
          careerInterests: s.careerInterests ?? [],
          expectedGraduation: s.expectedGraduation ?? "",
          location: s.location ?? "",
        };
        return {
          student: s,
          score: scoreJobForStudent(jobForScore, studentForScore),
        };
      }
      // Generic profile quality, normalized so the best-ranked student
      // hits 1.0.
      return { student: s, score: (counts.get(s.id) ?? 0) / maxCount };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.student.fullName.localeCompare(b.student.fullName);
    })
    .slice(0, limit);
}