import {
  ArrowLeft,
  Building2,
  Check,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ApplyButton } from "@/components/matches/apply-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getStudentApplicationStatus } from "@/lib/server/actions/student-applications";
import { scoreMatchBreakdown } from "@/lib/server/matching/student-matches";
import {
  getCurrentPersona,
  hasOnboarded,
} from "@/lib/server/personas/current";
import { getCorporateFixtures } from "@/lib/server/personas/lookup";

interface PageProps {
  readonly params: Promise<{ corporateId: string }>;
}

export default async function MatchRationalePage({ params }: PageProps) {
  const { corporateId } = await params;

  const current = await getCurrentPersona();
  if (!current) redirect("/demo");
  if (current.kind !== "student") redirect("/dashboard");
  if (!hasOnboarded(current.row)) redirect("/onboarding");

  const student = current.row;
  const corporates = getCorporateFixtures();
  const corporate = corporates.find((c) => c.id === corporateId);
  if (!corporate) notFound();

  const breakdown = scoreMatchBreakdown(student, corporate);

  // Read whether THIS student has already applied to THIS corporate. We
  // gate the render on `current.kind === "student"`, so the read below
  // can't observe a non-student row — but the helper is still safe for
  // non-students and returns the "not applied" sentinel.
  const applicationStatus = await getStudentApplicationStatus(corporate.id);

  return (
    <section
      aria-labelledby="rationale-heading"
      className="mx-auto max-w-3xl space-y-8"
      data-testid="match-rationale-page"
    >
      <Link
        href="/dashboard/matches"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <ArrowLeft aria-hidden="true" className="mr-1 size-4" />
        Back to matches
      </Link>

      <header className="space-y-3">
        <p className="font-mono text-sm text-muted-foreground">
          Match rationale
        </p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              id="rationale-heading"
              className="text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              <span className="flex items-center gap-2">
                <Building2
                  aria-hidden="true"
                  className="size-6 text-muted-foreground"
                />
                {corporate.organizationName}
              </span>
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground">
              {corporate.industry}
              {corporate.location ? ` · ${corporate.location}` : ""}
            </p>
          </div>
          {current.kind === "student" ? (
            <ApplyButton
              corporateId={corporate.id}
              initialStatus={applicationStatus.applied ? "applied" : "idle"}
            />
          ) : null}
        </div>
        <Badge
          variant="default"
          data-testid="rationale-match-score"
          className="shrink-0 self-start whitespace-nowrap"
        >
          <Sparkles aria-hidden="true" className="mr-1 size-3" />
          Score {breakdown.score}
        </Badge>
      </header>

      <section aria-labelledby="why-matched" className="space-y-4">
        <h2
          id="why-matched"
          className="text-xl font-semibold tracking-tight"
        >
          Why this matched
        </h2>

        {breakdown.matchedSkills.length === 0 &&
        breakdown.matchedInterests.length === 0 &&
        !breakdown.hiringIntent ? (
          <Card>
            <CardHeader>
              <CardTitle>
                <h3 className="text-base leading-snug font-medium">
                  No specific signals
                </h3>
              </CardTitle>
              <CardDescription>
                This opportunity was included on the list but did not share
                any specific skills, interests, or hiring intent with your
                profile. Treat it as a baseline rather than a strong match.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Card>
            <CardContent className="space-y-5 pt-6">
              <SignalBlock
                label="Skills that overlap with their hiring needs"
                weight={2}
                items={breakdown.matchedSkills}
              />
              <SignalBlock
                label="Career interests that align with this organization"
                weight={3}
                items={breakdown.matchedInterests}
              />
              {breakdown.hiringIntent ? (
                <SignalBlock
                  label="Open to hiring students"
                  weight={1}
                  items={["Open to hiring students"]}
                />
              ) : null}
            </CardContent>
          </Card>
        )}
      </section>

      <section aria-labelledby="about" className="space-y-4">
        <h2 id="about" className="text-xl font-semibold tracking-tight">
          About this opportunity
        </h2>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <p className="whitespace-pre-line text-base leading-relaxed text-muted-foreground">
              {corporate.description}
            </p>
            <DetailList
              title="Hiring for"
              items={corporate.talentNeeds}
            />
            <DetailList
              title="Sponsorship interests"
              items={corporate.sponsorshipInterests}
            />
            <DetailList
              title="CSR focus"
              items={corporate.csrFocus}
            />
            <DetailList
              title="Indicative budget"
              items={[corporate.budgetRange]}
            />
            <DetailList
              title="Collaboration intent"
              items={[corporate.collaborationIntent]}
            />
          </CardContent>
        </Card>
      </section>
    </section>
  );
}

function SignalBlock({
  label,
  weight,
  items,
}: {
  readonly label: string;
  readonly weight: number;
  readonly items: readonly string[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">+{weight} pts</Badge>
        <h3 className="text-sm font-medium">{label}</h3>
      </div>
      <ul className="space-y-1 pl-1">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm">
            <Check
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-primary"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DetailList({
  title,
  items,
}: {
  readonly title: string;
  readonly items: readonly string[];
}) {
  // Hide the block entirely if there's nothing to show — a list with no
  // visible entries would render an empty `<ul>`.
  const visible = items.filter(
    (i) => typeof i === "string" && i.length > 0,
  );
  if (visible.length === 0) return null;
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-medium">{title}</h3>
      <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
        {visible.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}