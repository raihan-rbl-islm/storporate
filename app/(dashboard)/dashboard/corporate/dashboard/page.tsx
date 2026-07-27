import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Check, AlertTriangle } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyFixtureState } from "@/components/matches/empty-fixture-state";
import { LoadingPanel } from "@/components/ui/loading-panel";
import { MatchCard } from "@/components/matches/match-card";
import { PreparedResultsBanner } from "@/components/matches/prepared-results-banner";
import { Disclaimer } from "@/components/personas/disclaimer";
import { CollaborationSignals } from "@/components/dashboard/collaboration-signals";
import {
  getCurrentPersona,
  hasOnboarded,
} from "@/lib/server/personas/current";
import {
  getClubFixtures,
  getStudentFixtures,
} from "@/lib/server/personas/lookup";
import type { CorporateFixture } from "@/lib/server/personas/lookup";
import { rankClubsForCorporate } from "@/lib/server/matching/corporate-club-matches";
import { rankStudentsForCorporate } from "@/lib/server/matching/corporate-student-matches";
import { getPreparedMatchesFor } from "@/lib/server/matching/prepared";

type Intent = "hiring" | "sponsorship" | "both" | "unknown";

function classify(intent: string | undefined): Intent {
  if (intent === "hiring" || intent === "sponsorship" || intent === "both") {
    return intent;
  }
  return "unknown";
}

async function TopStudentCandidates({
  corporate,
}: {
  corporate: CorporateFixture;
}) {
  let topStudents: ReturnType<typeof rankStudentsForCorporate> = [];
  let usedPreparedFallback = false;
  try {
    topStudents = rankStudentsForCorporate(
      corporate,
      await getStudentFixtures(),
    ).slice(0, 3);
  } catch (err) {
    console.error(
      "[corporate dashboard] student matcher threw, using prepared:",
      err,
    );
    topStudents = getPreparedMatchesFor("corporate-student", corporate);
    usedPreparedFallback = true;
  }

  if (topStudents.length === 0) {
    return (
      <EmptyFixtureState
        title="No student candidates are available"
        description="Reload the page, or pick a different demo persona."
        reloadHref="/dashboard/corporate/dashboard"
      />
    );
  }

  return (
    <>
      {usedPreparedFallback ? <PreparedResultsBanner /> : null}
      <ul className="flex flex-col gap-3">
        {topStudents.map((m) => (
          <li key={m.student.id}>
            <MatchCard
              match={{
                direction: "corporate-to-student",
                id: m.student.id,
                title: m.student.fullName,
                subtitle: `${m.student.studyProgram} · ${m.student.university}`,
                score: m.score,
                topReasons: m.topReasons,
                rationaleHref: `/dashboard/corporate/candidates/${m.student.id}`,
                scoreTestId: "candidate-score",
              }}
              emptyReasonFallback="Review the match signals above when shortlisting candidates."
            />
          </li>
        ))}
      </ul>
      <div className="flex justify-end">
        <Link
          href="/dashboard/corporate/candidates/students"
          className={buttonVariants({ variant: "outline", size: "sm" })}
          prefetch={false}
        >
          View all students
        </Link>
      </div>
    </>
  );
}

async function TopClubCandidates({
  corporate,
}: {
  corporate: CorporateFixture;
}) {
  let topClubs: ReturnType<typeof rankClubsForCorporate> = [];
  let usedPreparedFallback = false;
  try {
    topClubs = rankClubsForCorporate(
      corporate,
      await getClubFixtures(),
    ).slice(0, 3);
  } catch (err) {
    console.error(
      "[corporate dashboard] club matcher threw, using prepared:",
      err,
    );
    topClubs = getPreparedMatchesFor("corporate-club", corporate);
    usedPreparedFallback = true;
  }

  if (topClubs.length === 0) {
    return (
      <EmptyFixtureState
        title="No club candidates are available"
        description="Reload the page, or pick a different demo persona."
        reloadHref="/dashboard/corporate/dashboard"
      />
    );
  }

  return (
    <>
      {usedPreparedFallback ? <PreparedResultsBanner /> : null}
      <ul className="flex flex-col gap-3">
        {topClubs.map((m) => (
          <li key={m.club.id}>
            <MatchCard
              match={{
                direction: "corporate-to-club",
                id: m.club.id,
                title: m.club.clubName,
                subtitle: `${m.club.university} · ${m.club.location}`,
                score: m.score,
                topReasons: m.topReasons,
                rationaleHref: `/dashboard/corporate/candidates/${m.club.id}`,
                scoreTestId: "candidate-club-score",
              }}
              emptyReasonFallback="Review the match signals above when shortlisting clubs."
            />
          </li>
        ))}
      </ul>
      <div className="flex justify-end">
        <Link
          href="/dashboard/corporate/candidates/clubs"
          className={buttonVariants({ variant: "outline", size: "sm" })}
          prefetch={false}
        >
          View all clubs
        </Link>
      </div>
    </>
  );
}

export default async function CorporateDashboardPage() {
  const current = await getCurrentPersona();
  if (!current || current.kind !== "corporate") redirect("/dashboard");
  const corporate = current.row;
  const intent = classify(corporate.collaborationIntent);
  const ready = hasOnboarded(corporate);

  const showStudents =
    intent === "hiring" || intent === "both" || intent === "unknown";
  const showClubs =
    intent === "sponsorship" || intent === "both" || intent === "unknown";

  return (
    <DashboardLayout
      role="corporate"
      title={corporate.organizationName}
      subtitle={`Corporate · ${corporate.industry}`}
    >
      <h2 className="text-3xl font-semibold tracking-tight">
        {corporate.organizationName}
      </h2>

      <Card data-testid="corporate-profile-readiness">
        <CardHeader>
          <CardTitle>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              {ready ? (
                <Check
                  aria-hidden="true"
                  className="text-muted-foreground size-4"
                />
              ) : (
                <AlertTriangle
                  aria-hidden="true"
                  className="text-muted-foreground size-4"
                />
              )}
              {ready ? "Profile ready" : "Finish your profile"}
            </h2>
          </CardTitle>
          <CardDescription>
            {ready
              ? "Your profile is match-ready. Refine it anytime."
              : "Add talent needs and sponsorship interests so your candidates reflect your goals."}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Link
            href="/dashboard/profile/edit"
            className={buttonVariants({ variant: "outline", size: "sm" })}
            prefetch={false}
          >
            {ready ? "Edit profile" : "Finish profile"}
          </Link>
        </CardContent>
      </Card>

      {showStudents ? (
        <section
          aria-labelledby="top-students-heading"
          className="flex flex-col gap-3"
        >
          <h2
            id="top-students-heading"
            className="text-xl font-semibold tracking-tight"
          >
            Top student candidates
          </h2>
          <Suspense
            fallback={
              <LoadingPanel label="Loading student candidates" rows={3} />
            }
          >
            <TopStudentCandidates corporate={corporate} />
          </Suspense>
        </section>
      ) : null}

      {showClubs ? (
        <section
          aria-labelledby="top-clubs-heading"
          className="flex flex-col gap-3"
        >
          <h2
            id="top-clubs-heading"
            className="text-xl font-semibold tracking-tight"
          >
            Top club candidates
          </h2>
          <Suspense
            fallback={
              <LoadingPanel label="Loading club candidates" rows={3} />
            }
          >
            <TopClubCandidates corporate={corporate} />
          </Suspense>
        </section>
      ) : null}

      <CollaborationSignals role="corporate" />

      <Disclaimer />
    </DashboardLayout>
  );
}
