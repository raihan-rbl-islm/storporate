import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, AlertTriangle } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyFixtureState } from "@/components/matches/empty-fixture-state";
import { MatchCard } from "@/components/matches/match-card";
import { Disclaimer } from "@/components/personas/disclaimer";
import { getCorporateFixtures } from "@/lib/server/personas/lookup";
import {
  getCurrentPersona,
  hasOnboarded,
} from "@/lib/server/personas/current";
import { rankCorporateMatchesFor } from "@/lib/server/matching/student-matches";

export default async function StudentDashboardPage() {
  const current = await getCurrentPersona();
  if (!current || current.kind !== "student") redirect("/dashboard");
  const student = current.row;
  const matches = rankCorporateMatchesFor(student, await getCorporateFixtures()).slice(0, 3);
  const ready = hasOnboarded(student);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {student.fullName}
        </h1>
        <p className="text-muted-foreground text-base">
          Student · {student.studyProgram} · {student.university}
        </p>
      </header>

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

      <div className="flex justify-end">
        <Link
          href="/dashboard/matches"
          className={buttonVariants({ variant: "outline", size: "sm" })}
          prefetch={false}
        >
          View all matches
        </Link>
      </div>

      <Disclaimer />
    </div>
  );
}
