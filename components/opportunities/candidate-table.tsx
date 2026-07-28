import Link from "next/link";
import { eq } from "drizzle-orm";

import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/server/db";
import { jobs } from "@/lib/server/db/schema";
import { getRankedCandidatesForJob } from "@/lib/server/matching/jobs-for-corporate";
import { SendInvitationTrigger } from "@/components/opportunities/send-invitation-trigger";

export interface CandidateTableProps {
  jobId: string;
}

export async function CandidateTable({ jobId }: CandidateTableProps) {
  const [jobRow] = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      slug: jobs.slug,
      corporateId: jobs.corporateId,
    })
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1);
  if (!jobRow) {
    return (
      <p className="text-sm text-muted-foreground">Job not found.</p>
    );
  }

  const ranked = await getRankedCandidatesForJob(jobId, 50);

  if (ranked.length === 0) {
    return (
      <div className="rounded-md border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        No matching students yet. Once students add experiences,
        achievements, or activities to their profiles they&apos;ll show up
        here.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Rank</th>
            <th className="px-3 py-2 text-left font-medium">Name</th>
            <th className="px-3 py-2 text-left font-medium">University</th>
            <th className="px-3 py-2 text-left font-medium">Match</th>
            <th className="px-3 py-2 text-left font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((row, i) => {
            const student = row.student;
            const slug = student.university
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]+/g, "");
            return (
              <tr
                key={student.id}
                className="border-t border-border align-top"
              >
                <td className="px-3 py-2 text-muted-foreground">
                  #{i + 1}
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={`/profile/${student.id}`}
                    prefetch={false}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {student.fullName}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {student.studyProgram} · {student.expectedGraduation}
                  </p>
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={`/students/${slug}?job=${jobRow.id}`}
                    prefetch={false}
                    className="text-foreground underline-offset-4 hover:underline"
                  >
                    {student.university}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <Badge variant="secondary">
                    {Math.round(row.score * 100)}%
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  <SendInvitationTrigger
                    jobId={jobRow.id}
                    corporateId={jobRow.corporateId}
                    studentId={student.id}
                    studentName={student.fullName}
                    jobTitle={jobRow.title}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default CandidateTable;