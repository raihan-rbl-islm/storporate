import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/lib/server/db";
import {
  eventRegistrations,
  events,
  invitations,
  jobs,
  posts,
} from "@/lib/server/db/schema";
import { getCurrentPersona } from "@/lib/server/personas/current";
import {
  getClubFixtures,
  getCorporateFixtures,
  getStudentFixtures,
} from "@/lib/server/personas/lookup";
import type { CorporateFixture, StudentFixture, ClubFixture } from "@/data/personas";
import type { CorporateStudentMatchInput } from "@/lib/server/matching/corporate-student-matches";
import type { CorporateClubMatchInput } from "@/lib/server/matching/corporate-club-matches";
import { rankCorporateMatchesFor } from "@/lib/server/matching/student-matches";
import { rankClubMatchesFor } from "@/lib/server/matching/club-matches";
import { rankStudentsForCorporate } from "@/lib/server/matching/corporate-student-matches";
import { rankClubsForCorporate } from "@/lib/server/matching/corporate-club-matches";
import { getPreparedMatchesFor } from "@/lib/server/matching/prepared";
import { getTopCandidatesForCorporate } from "@/lib/server/matching/jobs-for-corporate";
import { getTopSponsorsForClub } from "@/lib/server/matching/sponsors-for-event";

/**
 * Per-role dashboard overview objects.
 *
 * Each role gets a discriminated shape (`kind: "student" | "club" | "corporate"`)
 * containing:
 *  - live counts from the DB (jobs posted, events, posts, registrations,
 *    invitations sent, etc.)
 *  - top matches from the deterministic in-memory scorer
 *  - DB-backed suggestions (top job candidates, sponsors per event) — these
 *    are pre-resolved here so the page renders in a single render pass.
 *
 * Failures from any one source are isolated: a count that throws becomes 0,
 * a matcher that throws falls back to the prepared fixture, and DB-backed
 * panels become empty. The page should always render — never 500 — so the
 * user always lands on a usable dashboard.
 *
 * The function is server-only. The sidebar and the dashboard body both call
 * it in the same request, so the DB work is shared via React's request
 * memoization.
 */

export type AnyOverview =
  | StudentOverview
  | ClubOverview
  | CorporateOverview;

export interface StudentOverview {
  kind: "student";
  totalMatches: number;
  registeredEvents: number;
  invitationsSent: number;
  topMatches: ReturnType<typeof rankCorporateMatchesFor>;
  usedPreparedFallback: boolean;
}

export interface ClubOverview {
  kind: "club";
  totalMatches: number;
  eventsOwned: number;
  postsOwned: number;
  invitationsSent: number;
  topMatches: ReturnType<typeof rankClubMatchesFor>;
  usedPreparedFallback: boolean;
  sponsorsForEvents: Awaited<ReturnType<typeof getTopSponsorsForClub>>;
}

export interface CorporateOverview {
  kind: "corporate";
  openJobs: number;
  eventsOwned: number;
  postsOwned: number;
  invitationsSent: number;
  topStudents: ReturnType<typeof rankStudentsForCorporate>;
  topClubs: ReturnType<typeof rankClubsForCorporate>;
  usedPreparedFallbackStudents: boolean;
  usedPreparedFallbackClubs: boolean;
  topJobCandidates: Awaited<ReturnType<typeof getTopCandidatesForCorporate>>;
}

async function safeCount(
  query: Promise<{ length: number } | unknown[]>,
): Promise<number> {
  try {
    const r = await query;
    if (Array.isArray(r)) return r.length;
    if (r && typeof r === "object" && "length" in r) {
      return Number((r as { length: unknown }).length) || 0;
    }
    return 0;
  } catch (err) {
    console.error("[overview] count failed:", err);
    return 0;
  }
}

export async function getStudentOverview(
  studentId: string,
  student: Parameters<typeof rankCorporateMatchesFor>[0],
): Promise<StudentOverview> {
  // Live rows satisfy `StudentMatchInput` (structural), but the prepared
  // fallback expects a `StudentFixture`. The matchers take the
  // structural shape; the prepared helper takes the full fixture —
  // share the same row at runtime via a single cast.
  const studentFixture = student as unknown as StudentFixture;
  const [registeredEvents, invitationsSent, topMatchesRaw] =
    await Promise.all([
      safeCount(
        db
          .select({ id: eventRegistrations.id })
          .from(eventRegistrations)
          .where(eq(eventRegistrations.studentId, studentId)),
      ),
      safeCount(
        db
          .select({ id: invitations.id })
          .from(invitations)
          .where(eq(invitations.fromId, studentId)),
      ),
      // Matcher is pure / synchronous; wrap the whole call so any
      // exception becomes a prepared-fallback.
      Promise.resolve().then(() => {
        try {
          return {
            matches: rankCorporateMatchesFor(
              student,
              getCorporateFixtures(),
            ),
            fallback: false as const,
          };
        } catch (err) {
          console.error(
            "[overview] student matcher threw, using prepared:",
            err,
          );
          return {
            matches: getPreparedMatchesFor(
              "student-corporate",
              studentFixture,
            ),
            fallback: true as const,
          };
        }
      }),
    ]);

  return {
    kind: "student",
    totalMatches: topMatchesRaw.matches.length,
    registeredEvents,
    invitationsSent,
    topMatches: topMatchesRaw.matches,
    usedPreparedFallback: topMatchesRaw.fallback,
  };
}

export async function getClubOverview(
  clubId: string,
  club: Parameters<typeof rankClubMatchesFor>[0],
): Promise<ClubOverview> {
  // Live rows satisfy `ClubMatchInput` (structural), but the prepared
  // fallback expects a `ClubFixture`. The matchers take the structural
  // shape; the prepared helper takes the full fixture — share the
  // same row at runtime via a single cast.
  const clubFixture = club as unknown as ClubFixture;
  const [eventsOwned, postsOwned, invitationsSent, sponsorsForEvents, top] =
    await Promise.all([
      safeCount(
        db
          .select({ id: events.id })
          .from(events)
          .where(
            and(eq(events.ownerKind, "club"), eq(events.ownerId, clubId)),
          ),
      ),
      safeCount(
        db
          .select({ id: posts.id })
          .from(posts)
          .where(and(eq(posts.ownerKind, "club"), eq(posts.ownerId, clubId))),
      ),
      safeCount(
        db
          .select({ id: invitations.id })
          .from(invitations)
          .where(eq(invitations.fromId, clubId)),
      ),
      getTopSponsorsForClub(clubId, 5).catch((err) => {
        console.error("[overview] sponsor aggregator threw:", err);
        return [] as Awaited<ReturnType<typeof getTopSponsorsForClub>>;
      }),
      Promise.resolve().then(() => {
        try {
          return {
            matches: rankClubMatchesFor(club, getCorporateFixtures()),
            fallback: false as const,
          };
        } catch (err) {
          console.error(
            "[overview] club matcher threw, using prepared:",
            err,
          );
          return {
            matches: getPreparedMatchesFor("club-corporate", clubFixture),
            fallback: true as const,
          };
        }
      }),
    ]);

  return {
    kind: "club",
    totalMatches: top.matches.length,
    eventsOwned,
    postsOwned,
    invitationsSent,
    topMatches: top.matches,
    usedPreparedFallback: top.fallback,
    sponsorsForEvents,
  };
}

export async function getCorporateOverview(
  corporateId: string,
  corporate: CorporateStudentMatchInput & CorporateClubMatchInput,
): Promise<CorporateOverview> {
  // The matchers accept structural inputs (CorporateStudentMatchInput
  // / CorporateClubMatchInput). Live rows satisfy both, so the single
  // `corporate` object is fine for the live path. The prepared
  // fallback for the corporate-side perspectives, however, requires
  // a CorporateFixture — look one up once outside the Promise.all so
  // both fallback branches share it.
  const corporateFixture =
    getCorporateFixtures().find((c) => c.id === corporateId) ??
    (corporate as unknown as CorporateFixture);

  const [
    openJobs,
    eventsOwned,
    postsOwned,
    invitationsSent,
    topStudentsRaw,
    topClubsRaw,
    topJobCandidates,
  ] = await Promise.all([
    safeCount(
      db
        .select({ id: jobs.id })
        .from(jobs)
        .where(and(eq(jobs.corporateId, corporateId), eq(jobs.isOpen, true))),
    ),
    safeCount(
      db
        .select({ id: events.id })
        .from(events)
        .where(
          and(
            eq(events.ownerKind, "corporate"),
            eq(events.ownerId, corporateId),
          ),
        ),
    ),
    safeCount(
      db
        .select({ id: posts.id })
        .from(posts)
        .where(
          and(
            eq(posts.ownerKind, "corporate"),
            eq(posts.ownerId, corporateId),
          ),
        ),
    ),
    safeCount(
      db
        .select({ id: invitations.id })
        .from(invitations)
        .where(eq(invitations.fromId, corporateId)),
    ),
    // Both matchers need a `getStudentFixtures()` / `getClubFixtures()` —
    // those are pure, so it's fine to call them inline.
    Promise.resolve().then(() => {
      try {
        return {
          matches: rankStudentsForCorporate(corporate, getStudentFixtures()),
          fallback: false as const,
        };
      } catch (err) {
        console.error(
          "[overview] corporate-student matcher threw, using prepared:",
          err,
        );
        return {
          matches: getPreparedMatchesFor(
            "corporate-student",
            corporateFixture,
          ),
          fallback: true as const,
        };
      }
    }),
    Promise.resolve().then(() => {
      try {
        return {
          matches: rankClubsForCorporate(corporate, getClubFixtures()),
          fallback: false as const,
        };
      } catch (err) {
        console.error(
          "[overview] corporate-club matcher threw, using prepared:",
          err,
        );
        return {
          matches: getPreparedMatchesFor("corporate-club", corporateFixture),
          fallback: true as const,
        };
      }
    }),
    getTopCandidatesForCorporate(corporateId, 5).catch((err) => {
      console.error(
        "[overview] job-candidate aggregator threw:",
        err,
      );
      return [] as Awaited<ReturnType<typeof getTopCandidatesForCorporate>>;
    }),
  ]);

  return {
    kind: "corporate",
    openJobs,
    eventsOwned,
    postsOwned,
    invitationsSent,
    topStudents: topStudentsRaw.matches,
    topClubs: topClubsRaw.matches,
    usedPreparedFallbackStudents: topStudentsRaw.fallback,
    usedPreparedFallbackClubs: topClubsRaw.fallback,
    topJobCandidates,
  };
}

/**
 * Convenience entry point used by the (dashboard) layout / sidebar
 * to resolve the overview object for whichever persona is currently
 * active. The dashboard pages call the role-specific helpers
 * directly so they can reuse the strongly-typed `student` /
 * `club` / `corporate` row they already have.
 */
export async function getOverviewForCurrentPersona(): Promise<AnyOverview | null> {
  const current = await getCurrentPersona();
  if (!current) return null;
  if (current.kind === "student") {
    return getStudentOverview(current.row.id, current.row);
  }
  if (current.kind === "club") {
    return getClubOverview(current.row.id, current.row);
  }
  return getCorporateOverview(current.row.id, current.row);
}