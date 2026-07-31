import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AlertCircle, GraduationCap, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingPanel } from "@/components/ui/loading-panel";
import { MotionWrapper } from "@/components/ui/motion-wrapper";
import { PreparedResultsBanner } from "@/components/matches/prepared-results-banner";

import {
  getCurrentPersona,
  hasOnboarded,
} from "@/lib/server/personas/current";
import {
  getCorporateFixtures,
  getStudentFixtures,
} from "@/lib/server/personas/lookup";
import type { CorporateFixture } from "@/data/personas";
import { rankStudentsForCorporate } from "@/lib/server/matching/corporate-student-matches";
import { getPreparedMatchesFor } from "@/lib/server/matching/prepared";

export const dynamic = "force-dynamic";

async function CandidatesList({ corporate }: { corporate: CorporateFixture }) {
  let matches: ReturnType<typeof rankStudentsForCorporate> = [];
  let usedPreparedFallback = false;
  try {
    matches = rankStudentsForCorporate(
      corporate,
      await getStudentFixtures(),
    );
  } catch (err) {
    console.error(
      "[corporate candidates/students] matcher threw, using prepared:",
      err,
    );
    matches = getPreparedMatchesFor("corporate-student", corporate);
    usedPreparedFallback = true;
  }

  if (matches.length === 0) {
    return (
      <Card data-testid="empty-fixture-state">
        <CardHeader>
          <CardTitle>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <AlertCircle
                aria-hidden="true"
                className="text-muted-foreground size-4"
              />
              The student catalog is empty
            </h2>
          </CardTitle>
          <CardDescription>
            No student fixtures are available to match against. This
            is a Demo data condition, not a profile issue: reload the
            page, or pick a different demo persona to see matches.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Link
            href="/dashboard/corporate/candidates/students"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Reload
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {usedPreparedFallback ? <PreparedResultsBanner /> : null}
      <ul className="grid gap-6">
      {matches.map(({ student, score, topReasons }, index) => (
        <li key={student.id}>
          <MotionWrapper index={index}>
            <Card className="shadow-md hover:shadow-lg transition-shadow bg-background/60 backdrop-blur-xl border-primary/10">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle>
                      <h2 className="flex items-center gap-2 text-lg font-semibold">
                        <GraduationCap
                          aria-hidden="true"
                          className="text-muted-foreground size-4"
                        />
                        {student.fullName}
                      </h2>
                    </CardTitle>
                    <CardDescription>
                      {student.studyProgram} · {student.university}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="default"
                    data-testid="candidate-score"
                    className="shrink-0 self-start whitespace-nowrap bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
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
                        <Badge variant="secondary" className="bg-muted/50">{reason}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Review the match signals above when shortlisting
                    candidates.
                  </p>
                )}
                <div className="pt-2">
                  <Link
                    href={`/dashboard/corporate/candidates/${student.id}`}
                    prefetch={false}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                  >
                    View rationale
                  </Link>
                </div>
              </CardContent>
            </Card>
          </MotionWrapper>
        </li>
      ))}
      </ul>
    </>
  );
}

export default async function CorporateStudentCandidatesPage() {
  const current = await getCurrentPersona();
  if (!current) redirect("/demo");
  if (current.kind !== "corporate") redirect("/dashboard");
  if (!hasOnboarded(current.row)) redirect("/onboarding");

  const corporate = current.row;
  const corporateFixture = getCorporateFixtures().find(
    (item) => item.id === corporate.id,
  ) ?? (corporate as unknown as CorporateFixture);

  return (
    <section
      aria-labelledby="candidates-heading"
      className="space-y-8"
      data-testid="corporate-candidates-page"
    >
      <header className="space-y-3">
        <p className="font-mono text-xs tracking-wide uppercase">
          Candidate students
        </p>
        <h1
          id="candidates-heading"
          className="text-3xl font-semibold tracking-tight"
        >
          Candidate students for {corporate.organizationName}
        </h1>
        <p className="text-muted-foreground max-w-2xl text-base leading-relaxed">
          Each card lists a score that reflects how closely your talent
          needs overlap with the student&apos;s stated skills and career
          interests. Higher scores indicate stronger alignment; these
          results are guidance only and do not guarantee an interview,
          offer, or sponsorship.
        </p>
      </header>

      <Suspense
        fallback={<LoadingPanel label="Loading student candidates" rows={5} />}
      >
        <CandidatesList corporate={corporateFixture} />
      </Suspense>
    </section>
  );
}