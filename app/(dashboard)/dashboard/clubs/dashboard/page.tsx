import Link from "next/link";
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
import { MatchCard } from "@/components/matches/match-card";
import { Disclaimer } from "@/components/personas/disclaimer";
import { CollaborationSignals } from "@/components/dashboard/collaboration-signals";
import { getCorporateFixtures } from "@/lib/server/personas/lookup";
import {
  getCurrentPersona,
  hasOnboarded,
} from "@/lib/server/personas/current";
import { rankClubMatchesFor } from "@/lib/server/matching/club-matches";

export default async function ClubDashboardPage() {
  const current = await getCurrentPersona();
  if (!current || current.kind !== "club") redirect("/dashboard");
  const club = current.row;
  const matches = rankClubMatchesFor(
    club,
    await getCorporateFixtures(),
  ).slice(0, 3);
  const ready = hasOnboarded(club);

  return (
    <DashboardLayout
      role="club"
      title={club.clubName}
      subtitle={`Club · ${club.university} · ${club.location}`}
    >
      <h2 className="text-3xl font-semibold tracking-tight">
        {club.clubName}
      </h2>

      <Card data-testid="club-profile-readiness">
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
              : "Add categories and a mission so your sponsors reflect your events."}
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
        aria-labelledby="top-sponsors-heading"
        className="flex flex-col gap-3"
      >
        <h2
          id="top-sponsors-heading"
          className="text-xl font-semibold tracking-tight"
        >
          Top sponsors
        </h2>
        {matches.length === 0 ? (
          <EmptyFixtureState
            title="No corporate sponsors are available"
            description="Reload the page, or pick a different demo persona."
            reloadHref="/dashboard/clubs/dashboard"
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {matches.map((m) => (
              <li key={m.corporate.id}>
                <MatchCard
                  match={{
                    direction: "club-to-corporate",
                    id: m.corporate.id,
                    title: m.corporate.organizationName,
                    subtitle: `${m.corporate.industry} · ${m.corporate.location}`,
                    score: m.score,
                    topReasons: m.topReasons,
                    rationaleHref: `/dashboard/clubs/matches/${m.corporate.id}`,
                    scoreTestId: "club-match-score",
                  }}
                  emptyReasonFallback="Review the match signals above when shortlisting sponsors."
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex justify-end">
        <Link
          href="/dashboard/clubs/matches"
          className={buttonVariants({ variant: "outline", size: "sm" })}
          prefetch={false}
        >
          View all sponsors
        </Link>
      </div>

      <CollaborationSignals role="club" />

      <Disclaimer />
    </DashboardLayout>
  );
}
