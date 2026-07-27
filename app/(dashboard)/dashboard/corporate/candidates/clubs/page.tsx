import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle, Sparkles, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { rankClubsForCorporate } from "@/lib/server/matching/corporate-club-matches";
import {
  getCurrentPersona,
  hasOnboarded,
} from "@/lib/server/personas/current";
import { getClubFixtures } from "@/lib/server/personas/lookup";

export const dynamic = "force-dynamic";

export default async function CorporateClubCandidatesPage() {
  const current = await getCurrentPersona();
  if (!current) redirect("/demo");
  if (current.kind !== "corporate") redirect("/dashboard");
  if (!hasOnboarded(current.row)) redirect("/onboarding");

  const corporate = current.row;
  const clubs = getClubFixtures();
  const matches = rankClubsForCorporate(corporate, clubs);

  return (
    <section
      aria-labelledby="club-candidates-heading"
      className="space-y-8"
      data-testid="corporate-club-candidates-page"
    >
      <header className="space-y-3">
        <p className="font-mono text-xs tracking-wide uppercase">
          Candidate clubs
        </p>
        <h1
          id="club-candidates-heading"
          className="text-3xl font-semibold tracking-tight"
        >
          Candidate clubs for {corporate.organizationName}
        </h1>
        <p className="text-muted-foreground max-w-2xl text-base leading-relaxed">
          Each card lists a score that reflects how closely your sponsorship
          interests and CSR focus overlap with the club&apos;s stated categories
          and mission. Higher scores indicate stronger alignment; these results
          are guidance only and do not guarantee a sponsorship commitment.
        </p>
      </header>

      {matches.length === 0 ? (
        <Card data-testid="empty-fixture-state">
          <CardHeader>
            <CardTitle>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <AlertCircle
                  aria-hidden="true"
                  className="text-muted-foreground size-4"
                />
                The club catalog is empty
              </h2>
            </CardTitle>
            <CardDescription>
              No club fixtures are available to match against. This is a Demo
              data condition, not a profile issue: reload the page, or pick a
              different demo persona to see matches.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link
              href="/dashboard/corporate/candidates/clubs"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Reload
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-6">
          {matches.map(({ club, score, topReasons }) => (
            <li key={club.id}>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle>
                        <h2 className="flex items-center gap-2 text-lg font-semibold">
                          <Users
                            aria-hidden="true"
                            className="text-muted-foreground size-4"
                          />
                          {club.clubName}
                        </h2>
                      </CardTitle>
                      <CardDescription>
                        {club.university} · {club.location}
                      </CardDescription>
                    </div>
                    <Badge
                      variant="default"
                      data-testid="candidate-club-score"
                      className="shrink-0 self-start whitespace-nowrap"
                    >
                      <Sparkles
                        aria-hidden="true"
                        className="mr-1 size-3"
                      />
                      Score {score}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {topReasons.length > 0 ? (
                    <ul className="flex flex-wrap gap-2">
                      {topReasons.map((reason) => (
                        <li key={reason}>
                          <Badge variant="secondary">{reason}</Badge>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Review the match signals above when shortlisting clubs.
                    </p>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
