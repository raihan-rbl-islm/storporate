import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { db } from "@/lib/server/db";
import { jobs } from "@/lib/server/db/schema";
import { getCurrentPersona } from "@/lib/server/personas/current";
import { CreateJobForm } from "@/app/(pages)/opportunities/new/create-job-form";
import {
  closeJob,
  deleteJob,
  reopenJob,
} from "@/app/(pages)/opportunities/actions";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ManageJobPage({ params }: Props) {
  const { slug } = await params;

  const viewer = await getCurrentPersona();
  if (!viewer) redirect(`/signin?next=/jobs/${slug}/manage`);
  if (viewer.kind !== "corporate") {
    redirect(`/jobs/${slug}`);
  }

  const [jobRow] = await db
    .select()
    .from(jobs)
    .where(eq(jobs.slug, slug))
    .limit(1);
  if (!jobRow) notFound();
  if (jobRow.corporateId !== viewer.row.id) {
    redirect(`/jobs/${slug}`);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const shareUrl = `${baseUrl}/jobs/${jobRow.slug}`;

  const jobId = jobRow.id;
  async function deleteAction() {
    "use server";
    await deleteJob(jobId);
  }
  async function closeAction() {
    "use server";
    await closeJob(jobId);
  }
  async function reopenAction() {
    "use server";
    await reopenJob(jobId);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm text-muted-foreground">Manage job</p>
          <h1 className="text-2xl font-semibold">{jobRow.title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            render={
              <Link href={`/jobs/${jobRow.slug}`}>View public page</Link>
            }
          />
          <Button
            variant="outline"
            render={
              <Link href={`/jobs/${jobRow.slug}/candidates`}>
                View candidates
              </Link>
            }
          />
        </div>
      </header>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Share</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p>
            Share this link with students so they can read and apply:{" "}
            <a
              href={shareUrl}
              className="break-all text-primary underline underline-offset-4 hover:no-underline"
            >
              {shareUrl}
            </a>
          </p>
          <p className="text-muted-foreground">
            Status:{" "}
            <span className="font-medium text-foreground">
              {jobRow.isOpen ? "Open" : "Closed"}
            </span>
          </p>
        </CardContent>
      </Card>

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-medium">Edit job details</h2>
        <Separator className="mb-4" />
        <CreateJobForm
          mode="edit"
          jobId={jobRow.id}
          submitLabel="Save changes"
          initialValue={{
            title: jobRow.title,
            description: jobRow.description,
            employmentType: jobRow.employmentType,
            locationLabel: jobRow.locationLabel,
            isRemote: jobRow.isRemote,
            startsOn: jobRow.startsOn,
            endsOn: jobRow.endsOn,
            applyUrl: jobRow.applyUrl,
            applyEmail: jobRow.applyEmail,
            skills: jobRow.skills,
          }}
        />
      </section>

      <section className="mb-12 flex flex-wrap gap-3">
        {jobRow.isOpen ? (
          <form action={closeAction}>
            <Button type="submit" variant="outline">
              Close applications
            </Button>
          </form>
        ) : (
          <form action={reopenAction}>
            <Button type="submit" variant="outline">
              Reopen applications
            </Button>
          </form>
        )}
        <form action={deleteAction}>
          <Button type="submit" variant="destructive">
            Delete job
          </Button>
        </form>
      </section>
    </main>
  );
}