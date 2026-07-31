import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  Calendar,
  Check,
  ChevronRight,
  Inbox,
  Newspaper,
  PencilLine,
  Send,
  Sparkles,
  Users,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyFixtureState } from "@/components/matches/empty-fixture-state";
import { MatchCard } from "@/components/matches/match-card";
import { PreparedResultsBanner } from "@/components/matches/prepared-results-banner";
import { Disclaimer } from "@/components/personas/disclaimer";
import { HeroCallout } from "@/components/hero/hero-callout";
import { CollaborationSignals } from "@/components/dashboard/collaboration-signals";
import { ProfileCompletenessMeter } from "@/components/profile/profile-completeness-meter";
import { StatTile } from "@/components/dashboard/stat-tile";
import {
  QuickActionGrid,
  type QuickAction,
} from "@/components/dashboard/quick-actions";
import { getStudentOverview } from "@/lib/server/dashboard/overview";
import {
  getCurrentPersona,
  hasOnboarded,
} from "@/lib/server/personas/current";
import {
  rankCorporateMatchesFor,
  toDisplayMatchPercent,
} from "@/lib/server/matching/student-matches";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { NewsfeedList } from "@/components/newsfeed/newsfeed-list";

/**
 * Static, no-network rendering of the "Top opportunities" panel.
 *
 * All matcher data has been pre-computed by `getStudentOverview` (a
 * single server-side round trip). The dashboard renders fully on first
 * paint — no Suspense flash, no LoadingPanel — so the student sees real
 * numbers immediately.
 */
function TopOpportunities({
  student,
  matches,
  usedPreparedFallback,
}: {
  student: Parameters<typeof rankCorporateMatchesFor>[0] & {
    fullName: string;
    heroFlag: boolean;
  };
  matches: ReturnType<typeof rankCorporateMatchesFor>;
  usedPreparedFallback: boolean;
}) {
  const heroTop =
    student.heroFlag && matches.length > 0 ? matches[0] : null;
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
        <div className="flex items-end justify-between gap-2">
          <h2
            id="top-opportunities-heading"
            className="text-xl font-semibold tracking-tight"
          >
            Top opportunities
          </h2>
          <Link
            href="/dashboard/matches"
            prefetch={false}
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "gap-1 text-xs",
            })}
            data-testid="student-view-all-matches"
          >
            View all
            <ChevronRight aria-hidden="true" className="size-3" />
          </Link>
        </div>
        {matches.length === 0 ? (
          <EmptyFixtureState
            title="No corporate opportunities are available"
            description="Reload the page, or pick a different demo persona."
            reloadHref="/dashboard/student"
          />
        ) : (
          <ul className="flex flex-col gap-3" data-testid="student-top-matches">
            {matches.slice(0, 3).map((m) => (
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

  // Single pass: resolve counts, matches, and any DB-backed panels in
  // parallel. The Promise.all lives inside the helpers, so calling the
  // role-specific fetcher once is all we need.
  const overview = await getStudentOverview(student.id, student);

  // Pre-compute the action set so the JSX stays readable.
  const actions: QuickAction[] = [
    {
      title: "Browse the newsfeed",
      description:
        "See new jobs, events, and posts from organizations you follow.",
      href: "/newsfeed",
      icon: <Newspaper aria-hidden="true" />,
      testId: "student-newsfeed-cta",
    },
    {
      title: "View all matches",
      description:
        "Every corporate matched against your skills and career interests.",
      href: "/dashboard/matches",
      icon: <Sparkles aria-hidden="true" />,
      testId: "student-view-all-matches-cta",
    },
    {
      title: "Edit your profile",
      description:
        ready
          ? "Refine skills, interests, and experiences to sharpen your matches."
          : "Add skills and interests so your matches reflect your goals.",
      href: "/dashboard/profile/edit",
      icon: <PencilLine aria-hidden="true" />,
      testId: "student-edit-profile-cta",
    },
    {
      title: "Outbox",
      description: "Track the applications and pitches you have sent.",
      href: "/inbox",
      icon: <Inbox aria-hidden="true" />,
      testId: "student-inbox-cta",
    },
  ];

  return (
    <DashboardLayout
      role="student"
      title={student.fullName}
      subtitle={`Student · ${student.studyProgram} · ${student.university}`}
    >
      {/* 1. TOP ROW: Core Metrics */}
      <section
        aria-labelledby="stats-heading"
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <h2 id="stats-heading" className="sr-only">Your dashboard at a glance</h2>
        <StatTile
          label="Matched corporates"
          value={overview.totalMatches}
          icon={<Building2 aria-hidden="true" />}
          hint={
            overview.totalMatches > 0
              ? "Ranked by skills + career interests"
              : "Add skills or interests to surface matches"
          }
          testId="student-stat-matches"
        />
        <StatTile
          label="Registered events"
          value={overview.registeredEvents}
          icon={<Calendar aria-hidden="true" />}
          hint="Events you've RSVP'd to"
          testId="student-stat-events"
        />
        <StatTile
          label="Outreach sent"
          value={overview.invitationsSent}
          icon={<Send aria-hidden="true" />}
          hint="Applications, RSVPs, and pitches"
          testId="student-stat-invitations"
        />
      </section>

      {/* 2. SPLIT LAYOUT: Main Content vs Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT PANE (2 columns): Active Data & Feeds */}
        <div className="lg:col-span-2 flex flex-col gap-10">
          <TopOpportunities
            student={student}
            matches={overview.topMatches}
            usedPreparedFallback={overview.usedPreparedFallback}
          />
          
          <section id="newsfeed" aria-labelledby="newsfeed-heading" className="flex flex-col gap-4">
            <div className="flex items-end justify-between gap-2">
              <h2 id="newsfeed-heading" className="text-xl font-bold tracking-tight">Your Feed</h2>
              <Link
                href="/newsfeed"
                prefetch={false}
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm",
                  className: "gap-1 text-xs",
                })}
              >
                View all
                <ChevronRight aria-hidden="true" className="size-3" />
              </Link>
            </div>
            <NewsfeedList studentId={student.id} filter="all" />
          </section>
        </div>

        {/* RIGHT PANE (1 column): Utilities & Quick Views */}
        <div className="flex flex-col gap-8">
          <Card data-testid="student-profile-readiness" className="bg-muted/30 border-primary/10 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle>
                <h3 className="flex items-center gap-2 text-base font-bold">
                  {ready ? (
                    <Check aria-hidden="true" className="text-primary size-4" />
                  ) : (
                    <AlertTriangle aria-hidden="true" className="text-destructive size-4" />
                  )}
                  {ready ? "Profile ready" : "Finish your profile"}
                </h3>
              </CardTitle>
              <CardDescription className="text-xs">
                {ready
                  ? "Your profile is match-ready. Refine it anytime."
                  : "Add skills and interests so your matches reflect your goals."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileCompletenessMeter student={student} />
              <Link
                href="/dashboard/profile/edit"
                className={buttonVariants({ variant: "outline", size: "sm", className: "mt-4 w-full" })}
                prefetch={false}
              >
                {ready ? "Edit profile" : "Finish profile"}
              </Link>
            </CardContent>
          </Card>

          <QuickActionGrid
            title="Quick actions"
            description="Jump straight to the surface you came for."
            actions={actions}
            testId="student-quick-actions"
          />

          <section id="registered-events" aria-labelledby="registered-events-heading" className="flex flex-col gap-4">
            <h2 id="registered-events-heading" className="text-sm font-bold tracking-tight uppercase text-muted-foreground">
              Registered events
            </h2>
            <RegisteredEventsList studentId={student.id} />
          </section>
        </div>
      </div>

      <CollaborationSignals role="student" />
      <Disclaimer />
    </DashboardLayout>
  );
}

/**
 * Reads the student's outgoing RSVPs so the dashboard surfaces what
 * the student has actually committed to, not just a count. Empty
 * state — never a loading state — so the page renders on first paint.
 */
async function RegisteredEventsList({ studentId }: { studentId: string }) {
  const { db } = await import("@/lib/server/db");
  const { eventRegistrations, events } = await import(
    "@/lib/server/db/schema"
  );
  const { eq, desc } = await import("drizzle-orm");
  const { formatInDhaka } = await import("@/lib/format/datetime");

  let rows: Array<{
    eventId: string;
    title: string;
    slug: string;
    startsAt: Date;
    locationLabel: string;
  }> = [];
  try {
    rows = await db
      .select({
        eventId: eventRegistrations.eventId,
        title: events.title,
        slug: events.slug,
        startsAt: events.startsAt,
        locationLabel: events.locationLabel,
      })
      .from(eventRegistrations)
      .innerJoin(events, eq(eventRegistrations.eventId, events.id))
      .where(eq(eventRegistrations.studentId, studentId))
      .orderBy(desc(events.startsAt))
      .limit(5);
  } catch (err) {
    console.error("[student dashboard] registrations query threw:", err);
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="grid gap-2 py-6 text-center">
          <Users
            aria-hidden="true"
            className="text-muted-foreground mx-auto size-6"
          />
          <p className="text-sm font-medium">No events registered yet</p>
          <p className="text-muted-foreground text-xs">
            Browse the{" "}
            <Link
              href="/newsfeed"
              prefetch={false}
              className="underline underline-offset-4"
            >
              newsfeed
            </Link>{" "}
            to find upcoming events and RSVP.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="flex flex-col gap-2" data-testid="student-registered-events">
      {rows.map((r) => (
        <li key={r.eventId}>
          <Card size="sm">
            <CardContent className="flex items-center justify-between gap-3 py-3">
              <div className="grid min-w-0">
                <Link
                  href={`/events/${r.slug}`}
                  prefetch={false}
                  className="truncate text-sm font-medium underline-offset-4 hover:underline"
                >
                  {r.title}
                </Link>
                <p className="text-muted-foreground text-xs">
                  {formatInDhaka(r.startsAt)}
                  {r.locationLabel ? ` · ${r.locationLabel}` : ""}
                </p>
              </div>
              <Badge variant="secondary">Registered</Badge>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
