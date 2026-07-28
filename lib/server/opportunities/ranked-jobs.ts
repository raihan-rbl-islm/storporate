import "server-only";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@/lib/server/db";
import { jobs, students, corporates } from "@/lib/server/db/schema";
import { ensureStudentEmbedding } from "@/lib/server/feed/embed-student";
import { scoreEventForStudent } from "@/lib/server/matching/fallback-scorers";

export type RankedJob = {
  item: typeof jobs.$inferSelect;
  score: number;
  corporateName: string;
};

type JobExecRow = {
  id: string;
  corporate_id: string;
  title: string;
  slug: string;
  description: string;
  employment_type: string;
  location_label: string;
  is_remote: boolean;
  starts_on: string;
  ends_on: string;
  apply_url: string;
  apply_email: string;
  skills: string[];
  embedding: string | null;
  needs_embedding: boolean;
  is_open: boolean;
  created_at: Date;
  distance: number;
};

function toVectorLiteral(v: number[]): string {
  return `[${v.join(",")}]`;
}

function mapJobRow(r: JobExecRow): typeof jobs.$inferSelect {
  return {
    id: r.id,
    corporateId: r.corporate_id,
    title: r.title,
    slug: r.slug,
    description: r.description,
    employmentType: r.employment_type,
    locationLabel: r.location_label,
    isRemote: r.is_remote,
    startsOn: r.starts_on,
    endsOn: r.ends_on,
    applyUrl: r.apply_url,
    applyEmail: r.apply_email,
    skills: r.skills,
    embedding: null,
    needsEmbedding: r.needs_embedding,
    isOpen: r.is_open,
    createdAt: r.created_at,
  };
}

export async function getRankedJobs(studentId?: string, limit = 50): Promise<RankedJob[]> {
  let rankedJobs: { item: typeof jobs.$inferSelect; score: number }[] = [];

  if (studentId) {
    const [student] = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
    
    if (student) {
      const studentEmbedding = await ensureStudentEmbedding(studentId);
      
      if (studentEmbedding && studentEmbedding.length > 0) {
        const emb = toVectorLiteral(studentEmbedding);
        const raw = await db.execute<JobExecRow>(sql`
          SELECT id,
                 corporate_id,
                 title,
                 slug,
                 description,
                 employment_type,
                 location_label,
                 is_remote,
                 starts_on,
                 ends_on,
                 apply_url,
                 apply_email,
                 skills,
                 embedding,
                 needs_embedding,
                 is_open,
                 created_at,
                 (embedding <=> ${emb}::vector) AS distance
          FROM jobs
          WHERE is_open = true
            AND needs_embedding = false
            AND embedding IS NOT NULL
          ORDER BY embedding <=> ${emb}::vector
          LIMIT ${limit}
        `);
        const r = raw as unknown as JobExecRow[];
        rankedJobs = r.map((x) => ({
          item: mapJobRow(x),
          score: 1 - Number(x.distance),
        }));
      } else {
        const rows = await db
          .select()
          .from(jobs)
          .where(and(eq(jobs.isOpen, true), eq(jobs.needsEmbedding, false)))
          .orderBy(desc(jobs.createdAt))
          .limit(limit);
        rankedJobs = rows.map((row) => ({
          item: row,
          score: scoreEventForStudent(
            { tags: row.skills },
            {
              skills: student.skills,
              careerInterests: student.careerInterests,
            },
          ),
        }));
      }
    }
  }

  // Fallback or non-student case
  if (rankedJobs.length === 0) {
    const rows = await db
      .select()
      .from(jobs)
      .where(eq(jobs.isOpen, true))
      .orderBy(desc(jobs.createdAt))
      .limit(limit);
    rankedJobs = rows.map((row) => ({
      item: row,
      score: 0,
    }));
  }

  // Sort strictly by score DESC
  rankedJobs.sort((a, b) => b.score - a.score);

  // Populate corporate names
  const results: RankedJob[] = [];
  const corpMap = new Map<string, string>();

  for (const r of rankedJobs) {
    let corpName = corpMap.get(r.item.corporateId);
    if (!corpName) {
      const [c] = await db.select({ organizationName: corporates.organizationName }).from(corporates).where(eq(corporates.id, r.item.corporateId)).limit(1);
      corpName = c?.organizationName ?? "Unknown Company";
      corpMap.set(r.item.corporateId, corpName);
    }
    results.push({
      item: r.item,
      score: r.score,
      corporateName: corpName,
    });
  }

  return results;
}
