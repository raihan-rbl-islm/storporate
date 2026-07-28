import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="grid gap-1">
          <p className="text-sm text-muted-foreground">
            at{" "}
            <span className="font-medium text-foreground">
              {corpRow?.organizationName ?? "Unknown company"}
            </span>
            {corpRow?.industry ? (
              <>
                {" · "}
                <span>{corpRow.industry}</span>
              </>
            ) : null}
          </p>
          <h1 className="text-2xl font-semibold">{jobRow.title}</h1>
        </div>
        {isOwner ? (
          <Button
            variant="outline"
            render={
              <Link href={`/opportunities/${jobRow.slug}/manage`}>Manage</Link>
            }
          />
        ) : null}
      </header>

      <Card>
        <CardContent className="grid gap-4 pt-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {TYPE_LABEL[jobRow.employmentType] ?? jobRow.employmentType}
            </Badge>
            {jobRow.isOpen ? (
              <Badge variant="outline">Open</Badge>
            ) : (
              <Badge variant="outline" className="text-destructive">
                Closed
              </Badge>
            )}
          </div>
          <p className="text-sm">
            <span className="font-medium">Location:</span>{" "}
            {jobRow.isRemote
              ? "Remote"
              : jobRow.locationLabel || "TBA"}
            {jobRow.isRemote && jobRow.locationLabel
              ? ` · ${jobRow.locationLabel}`
              : ""}
          </p>
          {jobRow.startsOn ? (
            <p className="text-sm">
              <span className="font-medium">Starts:</span> {jobRow.startsOn}
            </p>
          ) : null}
          {jobRow.endsOn ? (
            <p className="text-sm">
              <span className="font-medium">Apply by:</span> {jobRow.endsOn}
            </p>
          ) : null}
          {jobRow.skills.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {jobRow.skills.map((s, i) => (
                <li key={`${s}-${i}`}>
                  <Badge variant="outline">{s}</Badge>
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      {jobRow.description ? (
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-medium">About this role</h2>
          <Separator className="mb-4" />
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {jobRow.description}
          </p>
        </section>
      ) : null}

      <section className="mt-8 flex flex-wrap items-center gap-3">
        {applyHref ? (
          <Button
            render={
              <a
                href={applyHref}
                target={applyHref.startsWith("http") ? "_blank" : undefined}
                rel={
                  applyHref.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
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
        {!isOwner && viewer.kind !== "corporate" ? (
          <p className="text-xs text-muted-foreground">
            Sign in to share your interest with the recruiter.
          </p>
        ) : null}
      </section>
    </main>
  );
}