import type { ClubFixture, StudentFixture } from "@/data/personas";
import type { CorporateClubBreakdown } from "@/lib/server/matching/corporate-club-matches";
import type { CorporateStudentBreakdown } from "@/lib/server/matching/corporate-student-matches";

import {
  ArrowLeft,
  Check,
  GraduationCap,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CorporateInterestButton } from "@/components/candidates/corporate-interest-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getCorporateInterestStatus,
} from "@/lib/server/actions/corporate-interests";
import { scoreClubCandidateBreakdown } from "@/lib/server/matching/corporate-club-matches";
import { scoreStudentCandidateBreakdown } from "@/lib/server/matching/corporate-student-matches";
import {
  getCurrentPersona,
  hasOnboarded,
} from "@/lib/server/personas/current";
import {
  getClubFixtures,
  getStudentFixtures,
} from "@/lib/server/personas/lookup";

interface PageProps {
  readonly params: Promise<{ candidateId: string }>;
}

type CandidateMatch =
  | {
      readonly kind: "student";
      readonly row: StudentFixture;
      readonly breakdown: CorporateStudentBreakdown;
    }
  | {
      readonly kind: "club";
      readonly row: ClubFixture;
      readonly breakdown: CorporateClubBreakdown;
    };

export default async function CandidateRationalePage({ params }: PageProps) {
  const { candidateId } = await params;

  const current = await getCurrentPersona();
  if (!current) redirect("/demo");
  if (current.kind !== "corporate") redirect("/dashboard");
  if (!hasOnboarded(current.row)) redirect("/onboarding");

  const corporate = current.row;

  // Look up the candidate in both fixture lists. The first match wins.
  // Fixtures use distinct id namespaces (students: tasnim, sakib, ...;
  // clubs: nsu-robotics, brac-debate, ...; corporates: bkash, ...) so a
  // student id will not collide with a club id.
  const students = getStudentFixtures();
  const clubs = getClubFixtures();

  const studentRow = students.find((s) => s.id === candidateId);
  const clubRow = clubs.find((c) => c.id === candidateId);

  // Discriminated narrowing via single ternary expression — TypeScript
  // narrows `candidate` to `CandidateMatch` because both branches return
  // a fully-typed `CandidateMatch` literal and `notFound()` is typed
  // as `never`. A `let candidate; if/else if/else` shape would leave
  // `candidate` possibly-undefined for the compiler.
  const candidate: CandidateMatch = studentRow
    ? {
        kind: "student",
        row: studentRow,
        breakdown: scoreStudentCandidateBreakdown(corporate, studentRow),
      }
    : clubRow
      ? {
          kind: "club",
          row: clubRow,
          breakdown: scoreClubCandidateBreakdown(corporate, clubRow),
        }
      : notFound();

  const backHref =
    candidate.kind === "student"
      ? "/dashboard/corporate/candidates/students"
      : "/dashboard/corporate/candidates/clubs";
  const displayName =
    candidate.kind === "student" ? candidate.row.fullName : candidate.row.clubName;
  // Defensive subtitle: skip empty fields so the separator never renders
  // standalone (e.g. " · "). Mirrors the merged student rationale
  // detail page at `app/(dashboard)/dashboard/matches/[corporateId]/page.tsx:75-78`.
  const subtitleParts =
    candidate.kind === "student"
      ? [candidate.row.studyProgram, candidate.row.university]
      : [candidate.row.university, candidate.row.location];
  const subtitle = subtitleParts.filter((p) => p.length > 0).join(" · ");

  // Read interest status for the action button. The action is gated to
  // corporate sessions only; reading for any other persona simply returns
  // `{ recorded: false }`, so the conditional render below is what hides
  // the affordance for non-corporate visitors.
  const interestStatus = await getCorporateInterestStatus(
    candidate.kind,
    candidate.row.id,
  );

  return (
    <section
      aria-labelledby="rationale-heading"
      className="mx-auto max-w-3xl space-y-8"
      data-testid="candidate-rationale-page"
    >
      <Link
        href={backHref}
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <ArrowLeft aria-hidden="true" className="mr-1 size-4" />
        Back to candidates
      </Link>

      <header className="space-y-3">
        <p className="font-mono text-sm text-muted-foreground">
          Match rationale
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-3">
            <h1
              id="rationale-heading"
              className="text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              <span className="flex items-center gap-2">
                {candidate.kind === "student" ? (
                  <GraduationCap
                    aria-hidden="true"
                    className="size-6 text-muted-foreground"
                  />
                ) : (
                  <Users
                    aria-hidden="true"
                    className="size-6 text-muted-foreground"
                  />
                )}
                {displayName}
              </span>
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground">
              {subtitle}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <Badge
              variant="default"
              data-testid="candidate-rationale-match-score"
              className="shrink-0 whitespace-nowrap"
            >
              <Sparkles aria-hidden="true" className="mr-1 size-3" />
              Score {candidate.breakdown.score}
            </Badge>
            <CorporateInterestButton
              candidateKind={candidate.kind}
              candidateId={candidate.row.id}
              initialStatus={
                interestStatus.recorded ? "recorded" : "idle"
              }
            />
          </div>
        </div>
      </header>

      <section aria-labelledby="why-matched" className="space-y-4">
        <h2
          id="why-matched"
          className="text-xl font-semibold tracking-tight"
        >
          Why this matched
        </h2>

        {candidate.kind === "student"
          ? (
            <StudentSignals
              matchedSkills={candidate.breakdown.matchedSkills}
              matchedInterests={candidate.breakdown.matchedInterests}
              hiringIntent={candidate.breakdown.hiringIntent}
            />
          )
          : (
            <ClubSignals
              matchedCategories={candidate.breakdown.matchedCategories}
              matchedMissionTokens={candidate.breakdown.matchedMissionTokens}
              sponsorshipIntent={candidate.breakdown.sponsorshipIntent}
            />
          )}
      </section>

      <section aria-labelledby="about" className="space-y-4">
        <h2 id="about" className="text-xl font-semibold tracking-tight">
          About this candidate
        </h2>
        <Card>
          <CardContent className="space-y-4 pt-6">
            {candidate.kind === "student" ? (
              <>
                <DetailList
                  title="Skills"
                  items={candidate.row.skills}
                />
                <DetailList
                  title="Career interests"
                  items={candidate.row.careerInterests}
                />
                <DetailList
                  title="University"
                  items={[candidate.row.university]}
                />
                <DetailList
                  title="Study program"
                  items={[candidate.row.studyProgram]}
                />
              </>
            ) : (
              <>
                <DetailList
                  title="Categories"
                  items={candidate.row.categories}
                />
                <DetailList
                  title="Mission"
                  items={[candidate.row.mission]}
                />
                <DetailList
                  title="University"
                  items={[candidate.row.university]}
                />
                <DetailList
                  title="Audience reach"
                  items={[candidate.row.audienceReachLabel]}
                />
                <DetailList
                  title="Event focus"
                  items={candidate.row.eventFocus}
                />
                <DetailList
                  title="Sponsorship needs"
                  items={candidate.row.sponsorshipNeeds}
                />
              </>
            )}
          </CardContent>
        </Card>
      </section>
    </section>
  );
}

function StudentSignals({
  matchedSkills,
  matchedInterests,
  hiringIntent,
}: {
  readonly matchedSkills: readonly string[];
  readonly matchedInterests: readonly string[];
  readonly hiringIntent: boolean;
}) {
  if (
    matchedSkills.length === 0 &&
    matchedInterests.length === 0 &&
    !hiringIntent
  ) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <h3 className="text-base leading-snug font-medium">
              No specific signals
            </h3>
          </CardTitle>
          <CardDescription>
            This candidate was included on the list but did not share any
            specific skills, interests, or hiring intent with your
            corporate profile. Treat them as a baseline rather than a
            strong match.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        <SignalBlock
          label="Skills that overlap with your talent needs"
          weight={2}
          items={matchedSkills}
        />
        <SignalBlock
          label="Career interests that align with your focus"
          weight={3}
          items={matchedInterests}
        />
        {hiringIntent ? (
          <SignalBlock
            label="Open to hiring students"
            weight={1}
            items={["Open to hiring students"]}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

function ClubSignals({
  matchedCategories,
  matchedMissionTokens,
  sponsorshipIntent,
}: {
  readonly matchedCategories: readonly string[];
  readonly matchedMissionTokens: readonly string[];
  readonly sponsorshipIntent: boolean;
}) {
  if (
    matchedCategories.length === 0 &&
    matchedMissionTokens.length === 0 &&
    !sponsorshipIntent
  ) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <h3 className="text-base leading-snug font-medium">
              No specific signals
            </h3>
          </CardTitle>
          <CardDescription>
            This club was included on the list but did not share any
            specific categories, mission focus, or sponsorship intent
            with your corporate profile. Treat them as a baseline rather
            than a strong match.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        <SignalBlock
          label="Categories that align with your sponsorship focus"
          weight={2}
          items={matchedCategories}
        />
        <SignalBlock
          label="Mission focus that matches your CSR priorities"
          weight={3}
          items={matchedMissionTokens}
        />
        {sponsorshipIntent ? (
          <SignalBlock
            label="Open to sponsoring clubs"
            weight={1}
            items={["Open to sponsoring clubs"]}
          />
        ) : null}
      </CardContent>
    </Card>
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