import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { Button } from "@/components/ui/button";
import { db } from "@/lib/server/db";
import { jobs } from "@/lib/server/db/schema";
import { getCurrentPersona } from "@/lib/server/personas/current";
import { getRankedCandidatesForJob } from "@/lib/server/matching/jobs-for-corporate";
import { CandidateTable } from "@/components/jobs/candidate-table";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function JobCandidatesPage({ params }: Props) {
  const { slug } = await params;

  const viewer = await getCurrentPersona();
  if (!viewer) redirect(`/signin?next=/jobs/${slug}/candidates`);
  if (viewer.kind !== "corporate") {
    redirect(`/jobs/${slug}`);
  }

  const [jobRow] = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      slug: jobs.slug,
      corporateId: jobs.corporateId,
    })
    .from(jobs)
    .where(eq(jobs.slug, slug))
    .limit(1);
  if (!jobRow) notFound();
  if (jobRow.corporateId !== viewer.row.id) {
    redirect(`/jobs/${slug}`);
  }

  const ranked = await getRankedCandidatesForJob(jobRow.id, 50);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm text-muted-foreground">
            Candidates for{" "}
            <Link
              href={`/jobs/${jobRow.slug}`}
              prefetch={false}
              className="underline-offset-4 hover:underline"
            >
              {jobRow.title}
            </Link>
          </p>
          <h1 className="text-2xl font-semibold">
            Top {ranked.length} {ranked.length === 1 ? "student" : "students"}{" "}
            who match {jobRow.title}
          </h1>
        </div>
        <Button
          variant="outline"
          render={
            <Link href={`/jobs/${jobRow.slug}/manage`}>Back to manage</Link>
          }
        />
      </header>

      <CandidateTable jobId={jobRow.id} />
    </main>
  );
}