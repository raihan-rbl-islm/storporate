import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/server/db";
import { corporates, jobs } from "@/lib/server/db/schema";
import { getCurrentPersona } from "@/lib/server/personas/current";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  internship: "Internship",
  "full-time": "Full-time",
  contract: "Contract",
  research: "Research",
};

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function JobDetailPage({ params }: Props) {
  const { slug } = await params;

  const [jobRow] = await db
    .select()
    .from(jobs)
    .where(eq(jobs.slug, slug))
    .limit(1);
  if (!jobRow) notFound();

  const [corpRow] = await db
    .select({
      id: corporates.id,
      organizationName: corporates.organizationName,
      industry: corporates.industry,
    })
    .from(corporates)
    .where(eq(corporates.id, jobRow.corporateId))
    .limit(1);

  const viewer = await getCurrentPersona();
  if (!viewer) {
    redirect(`/signin?next=/opportunities/${slug}`);
  }

  const isOwner =
    viewer.kind === "corporate" && viewer.row.id === jobRow.corporateId;

  const applyHref = jobRow.applyUrl
    ? jobRow.applyUrl
    : jobRow.applyEmail
      ? `mailto:${jobRow.applyEmail}`
      : "";

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-8 md:py-12">
      <header className="pb-8 border-b border-border/50 flex flex-wrap items-center justify-between gap-6">
        <div className="grid gap-3">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <span className="bg-muted px-2 py-1 rounded-md text-foreground">
              {corpRow?.organizationName ?? "Unknown company"}
            </span>
            {corpRow?.industry ? (
              <>
                <span>·</span>
                <span>{corpRow.industry}</span>
              </>
            ) : null}
          </p>
          <h1 className="text-4xl font-bold tracking-tight">{jobRow.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="font-medium">
              {TYPE_LABEL[jobRow.employmentType] ?? jobRow.employmentType}
            </Badge>
            <Badge variant={jobRow.isOpen ? "default" : "secondary"} className="font-medium">
              {jobRow.isOpen ? "Open Role" : "Closed"}
            </Badge>
          </div>
        </div>
        {isOwner ? (
          <Button
            variant="outline"
            render={
              <Link href={`/opportunities/${jobRow.slug}/manage`}>Manage Role</Link>
            }
          />
        ) : null}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 mt-8 md:mt-12">
        
        {/* Left Pane (Wide): Content & Action */}
        <div className="md:col-span-2 flex flex-col gap-10">
          {jobRow.description ? (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">About this role</h2>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-base leading-relaxed">
                  {jobRow.description}
                </p>
              </div>
            </section>
          ) : null}

          <section className="bg-muted/30 border border-border/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4">
            <h3 className="text-lg font-semibold">Interested in this role?</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {!isOwner && viewer.kind !== "corporate" 
                ? "Submit your application or signal your interest directly to the recruiter."
                : "Candidates will see instructions here to apply."}
            </p>
            <div className="mt-2">
              {applyHref ? (
                <Button
                  render={
                    <a
                      href={applyHref}
                      target={applyHref.startsWith("http") ? "_blank" : undefined}
                      rel={applyHref.startsWith("http") ? "noopener noreferrer" : undefined}
                    >
                      Apply now
                    </a>
                  }
                />
              ) : (
                <Button variant="outline" disabled>
                  Sign in to apply
                </Button>
              )}
            </div>
          </section>
        </div>

        {/* Right Pane (Narrow): Metadata */}
        <div className="flex flex-col gap-10">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">Details</h2>
            <ul className="grid gap-4 text-sm">
              <li className="grid gap-1">
                <span className="font-semibold">Location</span>
                <span className="text-muted-foreground">
                  {jobRow.isRemote ? "Remote" : jobRow.locationLabel || "TBA"}
                  {jobRow.isRemote && jobRow.locationLabel ? ` · ${jobRow.locationLabel}` : ""}
                </span>
              </li>
              {jobRow.startsOn ? (
                <li className="grid gap-1">
                  <span className="font-semibold">Starts</span>
                  <span className="text-muted-foreground">{jobRow.startsOn}</span>
                </li>
              ) : null}
              {jobRow.endsOn ? (
                <li className="grid gap-1">
                  <span className="font-semibold">Apply by</span>
                  <span className="text-muted-foreground">{jobRow.endsOn}</span>
                </li>
              ) : null}
            </ul>
          </section>

          {jobRow.skills.length > 0 ? (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">Preferred Skills</h2>
              <ul className="flex flex-wrap gap-2">
                {jobRow.skills.map((s, i) => (
                  <li key={`${s}-${i}`}>
                    <Badge variant="secondary" className="font-medium">{s}</Badge>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}