import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/server/db";
import { jobs } from "@/lib/server/db/schema";
import { getCurrentPersona } from "@/lib/server/personas/current";
import { getRankedStudentsByUniversity } from "@/lib/server/matching/students-by-university";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ university: string }>;
  searchParams: Promise<{ job?: string }>;
}

export default async function UniversityStudentsPage({
  params,
  searchParams,
}: Props) {
  const { university } = await params;
  const { job: jobId } = await searchParams;

  const viewer = await getCurrentPersona();
  if (!viewer) {
    redirect(`/signin?next=/students/${university}`);
  }
  // Corporate-only per Phase 8 plan § "/students/[university] URL scheme".
  if (viewer.kind !== "corporate") {
    notFound();
  }

  let jobTitle: string | null = null;
  if (jobId) {
    const [j] = await db
      .select({ id: jobs.id, title: jobs.title })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);
    if (j) jobTitle = j.title;
  }

  const ranked = await getRankedStudentsByUniversity(university, jobId, 200);

  const displayUniversity = university.replace(/-/g, " ");

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm text-muted-foreground">Students from</p>
          <h1 className="text-2xl font-semibold capitalize">
            {displayUniversity}
          </h1>
          {jobTitle ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Ranked against your role:{" "}
              <span className="font-medium text-foreground">{jobTitle}</span>
            </p>
          ) : null}
        </div>
      </header>

      {ranked.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              No students from {displayUniversity} have onboarded yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-3">
          {ranked.map((row, i) => {
            const s = row.student;
            const topSkill = s.skills[0];
            return (
              <li key={s.id}>
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="line-clamp-2">
                        <Link
                          href={`/profile/${s.id}`}
                          prefetch={false}
                          className="underline-offset-4 hover:underline"
                        >
                          {s.fullName}
                        </Link>
                      </CardTitle>
                      <Badge variant="secondary" className="shrink-0">
                        {Math.round(row.score * 100)}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      #{i + 1} · {s.university} · {s.studyProgram} ·{" "}
                      {s.expectedGraduation}
                    </p>
                  </CardHeader>
                  {topSkill ? (
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground">
                        Top skill:{" "}
                        <span className="text-foreground">{topSkill}</span>
                      </p>
                    </CardContent>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-8 flex justify-end">
        <Button
          variant="outline"
          render={<Link href={`/dashboard/corporate/dashboard`}>Dashboard</Link>}
        />
      </div>
    </main>
  );
}