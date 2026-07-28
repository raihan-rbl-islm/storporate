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
import { HeroCallout } from "@/components/hero/hero-callout";
import { CollaborationSignals } from "@/components/dashboard/collaboration-signals";
import { getCorporateFixtures } from "@/lib/server/personas/lookup";
import { ProfileCompletenessMeter } from "@/components/profile/profile-completeness-meter";
import type { StudentFixture } from "@/data/personas";
import {
  getCurrentPersona,
  hasOnboarded,
} from "@/lib/server/personas/current";
import {
  rankCorporateMatchesFor,
  toDisplayMatchPercent,
} from "@/lib/server/matching/student-matches";
import { getPreparedMatchesFor } from "@/lib/server/matching/prepared";

async function HeroAndMatches({ student }: { student: StudentFixture }) {
  let matches: ReturnType<typeof rankCorporateMatchesFor> = [];
  let usedPreparedFallback = false;
  try {
    matches = rankCorporateMatchesFor(
      student,
      await getCorporateFixtures(),
    ).slice(0, 3);
  } catch (err) {
    console.error(
      "[student dashboard] matcher threw, using prepared:",
      err,
    );
    matches = getPreparedMatchesFor("student-corporate", student);
    usedPreparedFallback = true;
  }
  const heroTop = student.heroFlag && matches.length > 0 ? matches[0] : null;

  return (
    <>
      {usedPreparedFallback ? <PreparedResultsBanner /> : null}
      {heroTop ? (
        <HeroCallout
          personaName={student.fullName}
          topMatch={{
            corporateId: heroTop.corporate.id,
            corporateName: heroTop.corporate.organizationName,
            role: "Internship",
            scorePercent: toDisplayMatchPercent(heroTop.score),
          }}
        />
      ) : null}

      <section
        aria-labelledby="top-opportunities-heading"
        className="flex flex-col gap-3"
      >
        <h2
          id="top-opportunities-heading"
          className="text-xl font-semibold tracking-tight"
        >
          Top opportunities
        </h2>
        {matches.length === 0 ? (
          <EmptyFixtureState
            title="No corporate opportunities are available"
            description="Reload the page, or pick a different demo persona."
            reloadHref="/dashboard/student"
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {matches.map((m) => (
              <li key={m.corporate.id}>
                <MatchCard
                  match={{
                    direction: "student-to-corporate",
                    id: m.corporate.id,
                    title: m.corporate.organizationName,
                    subtitle: `${m.corporate.industry} · ${m.corporate.location}`,
                    score: m.score,
                    topReasons: m.topReasons,
                    rationaleHref: `/dashboard/matches/${m.corporate.id}`,
                    scoreTestId: "match-score",
                  }}
                  emptyReasonFallback="Review the match signals above when shortlisting organizations."
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export default async function StudentDashboardPage() {
  const current = await getCurrentPersona();
  if (!current || current.kind !== "student") redirect("/dashboard");
  const student = current.row;
  const ready = hasOnboarded(student);

  return (
    <DashboardLayout
      role="student"
      title={student.fullName}
      subtitle={`Student · ${student.studyProgram} · ${student.university}`}
    >
      <h2 className="text-3xl font-semibold tracking-tight">
        {student.fullName}
      </h2>

      <ProfileCompletenessMeter student={student} />

      <Card data-testid="student-profile-readiness">
        <CardHeader>
          <CardTitle>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              {ready ? (
                <Check aria-hidden="true" className="text-muted-foreground size-4" />
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
              : "Add skills and interests so your matches reflect your goals."}
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

      <Suspense
        fallback={
          <LoadingPanel label="Loading top opportunities" rows={3} />
        }
      >
        <HeroAndMatches student={student} />
      </Suspense>

      <div className="flex justify-end">
        <Link
          href="/dashboard/matches"
          className={buttonVariants({ variant: "outline", size: "sm" })}
          prefetch={false}
        >
          View all matches
        </Link>
      </div>

      <CollaborationSignals role="student" />

      <Disclaimer />
    </DashboardLayout>
  );
}