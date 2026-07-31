/**
 * Phase 8.4: ranked candidates for a specific job.
 *
 * Two paths:
 *  - cosine path (preferred): ORDER BY students.embedding <=> ${jobEmbedding}
 *  - fallback path (when job has no embedding, or every student lacks one):
 *    use `scoreJobForStudent` from `fallback-scorers.ts`
 *
 * Students who haven't "onboarded" are filtered out. We use the
 * "at least one experience/achievement/activity" signal rather than the
 * `users.onboardedAt` field — the spec is explicit that the row's own
 * profile density is the gating signal, not the auth-user timestamp.
 *
 * Returned shape: `{ student, score }` where `score` is in [0, 1]. Higher
 * is better. Caller code (the candidates page) projects a % badge.
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

export type RankedCandidate = {
  student: typeof students.$inferSelect;
  score: number;
};

export async function getRankedCandidatesForJob(
  jobId: string,
  limit = 50,
): Promise<RankedCandidate[]> {
  const [jobRow] = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1);
  if (!jobRow) return [];

  const jobForScore: JobForScoring = {
    skills: jobRow.skills ?? [],
    locationLabel: jobRow.locationLabel ?? "",
    isRemote: jobRow.isRemote ?? false,
    employmentType: jobRow.employmentType ?? "",
  };

  // Cosine path: pgvector ORDER BY <=> with $jobEmbedding.
  if (jobRow.embedding && jobRow.embedding.length > 0) {
    // Stringify the JS number[] into the bracket-literal wire format that
    // pgvector expects (see `scripts/verify-pgvector.ts`).
    const vectorLiteral = `[${jobRow.embedding.join(",")}]`;
    const raw = await db.execute<{
      id: string;
      full_name: string;
      university: string;
      study_program: string;
      expected_graduation: string;
      location: string;
      bio: string;
      skills: string[];
      career_interests: string[];
      hero_flag: boolean;
      fixture_disclaimer_required: boolean;
      embedding: string | null;
      needs_embedding: boolean;
      created_at: Date;
      updated_at: Date;
      onboarded: boolean;
      distance: number;
    }>(sql`
      SELECT s.*,
             (
               SELECT COUNT(*) FROM student_experiences se
               WHERE se.student_id = s.id
             ) +
             (
               SELECT COUNT(*) FROM student_achievements sa
               WHERE sa.student_id = s.id
             ) +
             (
               SELECT COUNT(*) FROM student_activities sac
               WHERE sac.student_id = s.id
             ) > 0 AS onboarded,
             (s.embedding <=> ${vectorLiteral}::vector) AS distance
      FROM students s
      WHERE s.needs_embedding = false
      ORDER BY s.embedding <=> ${vectorLiteral}::vector
      LIMIT ${limit}
    `);

    const rows = (raw as unknown as { rows?: unknown[] }).rows ?? raw;

    return (rows as Array<{
      id: string;
      full_name: string;
      university: string;
      study_program: string;
      expected_graduation: string;
      location: string;
      bio: string;
      contact_email: string;
      skills: string[];
      career_interests: string[];
      hero_flag: boolean;
      fixture_disclaimer_required: boolean;
      embedding: string | null;
      needs_embedding: boolean;
      created_at: Date;
      updated_at: Date;
      onboarded: boolean;
      distance: number;
    }>)
      .filter((r) => r.onboarded)
      .map((r) => ({
        student: {
          id: r.id,
          fullName: r.full_name,
          university: r.university,
          studyProgram: r.study_program,
          expectedGraduation: r.expected_graduation,
          location: r.location,
          bio: r.bio,
          contactEmail: r.contact_email,
          skills: r.skills,
          careerInterests: r.career_interests,
          heroFlag: r.hero_flag,
          fixtureDisclaimerRequired: r.fixture_disclaimer_required,
          embedding: null,
          needsEmbedding: r.needs_embedding,
          createdAt: new Date(r.created_at),
          updatedAt: new Date(r.updated_at),
        },
        // `employerName` is captured to keep the same closure shape as the
        // fallback path; we don't actually project it in this query.
        score: Math.max(0, Math.min(1, 1 - Number(r.distance))),
      }))
      .slice(0, limit);
  }

  // Fallback path: deterministic scorer.
  const allStudents = await db.select().from(students);
  const onboardedFlags = await Promise.all(
    allStudents.map(async (s) => {
      const [expCount] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(studentExperiences)
        .where(eq(studentExperiences.studentId, s.id));
      const [achCount] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(studentAchievements)
        .where(eq(studentAchievements.studentId, s.id));
      const [actCount] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(studentActivities)
        .where(eq(studentActivities.studentId, s.id));
      return {
        student: s,
        onboarded:
          (expCount?.n ?? 0) + (achCount?.n ?? 0) + (actCount?.n ?? 0) > 0,
      };
    }),
  );

  return onboardedFlags
    .filter((x) => x.onboarded)
    .map(({ student }) => {
      const studentForScore: StudentForScoring = {
        skills: student.skills ?? [],
        careerInterests: student.careerInterests ?? [],
        expectedGraduation: student.expectedGraduation ?? "",
        location: student.location ?? "",
      };
      return {
        student,
        score: scoreJobForStudent(jobForScore, studentForScore),
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.student.id.localeCompare(b.student.id);
    })
    .slice(0, limit);
}

/**
 * Aggregate the top N candidates across all open jobs owned by the given
 * corporate. Used by the corporate dashboard to surface a small "Top
 * candidates for your jobs" panel. We dedupe by student id and keep the
 * student's best score across the open jobs.
 */
export async function getTopCandidatesForCorporate(
  corporateId: string,
  limit = 5,
): Promise<RankedCandidate[]> {
  const openJobs = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(eq(jobs.corporateId, corporateId));

  const allResults = await Promise.all(
    openJobs.map((j) => getRankedCandidatesForJob(j.id, 50)),
  );

  const merged = new Map<string, RankedCandidate>();
  for (const list of allResults) {
    for (const r of list) {
      const existing = merged.get(r.student.id);
      if (!existing || r.score > existing.score) {
        merged.set(r.student.id, r);
      }
    }
  }

  return Array.from(merged.values())
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.student.id.localeCompare(b.student.id);
    })
    .slice(0, limit);
}