/**
 * Phase 8.4: ranked sponsors for a specific event.
 *
 * Mirror of `jobs-for-corporate.ts`. The club (event owner) drives the
 * query: we look up the event, fetch its embedding, then ORDER BY
 * corporates.embedding <=> ${eventEmbedding}. Fallback path uses
 * `scoreCorporateForClub(club, corporate)`.
 */
import { eq, sql } from "drizzle-orm";

import { db } from "@/lib/server/db";
import {
  clubs,
  corporates,
  events,
} from "@/lib/server/db/schema";
import {
  scoreCorporateForClub,
  type ClubForScoring,
  type CorporateForScoring,
} from "@/lib/server/matching/fallback-scorers";

export type RankedSponsor = {
  corporate: typeof corporates.$inferSelect;
  score: number;
};

export async function getRankedSponsorsForEvent(
  eventId: string,
  limit = 25,
): Promise<RankedSponsor[]> {
  const [eventRow] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  if (!eventRow) return [];

  // The event's owner must be a club to look up `eventFocus`/`categories`
  // for the fallback scorer. If the owner is a corporate, we still rank
  // sponsors (cosine path) but the fallback degenerates to zero — there
  // is no club context to score against.
  let clubForScore: ClubForScoring | null = null;
  if (eventRow.ownerKind === "club") {
    const [clubRow] = await db
      .select()
      .from(clubs)
      .where(eq(clubs.id, eventRow.ownerId))
      .limit(1);
    if (clubRow) {
      clubForScore = {
        eventFocus: clubRow.eventFocus ?? [],
        categories: clubRow.categories ?? [],
      };
    }
  }

  // Cosine path.
  if (eventRow.embedding && eventRow.embedding.length > 0) {
    const vectorLiteral = `[${eventRow.embedding.join(",")}]`;
    const raw = await db.execute<{
      id: string;
      organization_name: string;
      industry: string;
      location: string;
      description: string;
      talent_needs: string[];
      sponsorship_interests: string[];
      csr_focus: string[];
      budget_range: string;
      collaboration_intent: string;
      hero_flag: boolean;
      fixture_disclaimer_required: boolean;
      contact_email: string;
      embedding: string | null;
      needs_embedding: boolean;
      created_at: Date;
      updated_at: Date;
      distance: number;
    }>(sql`
      SELECT *,
             (embedding <=> ${vectorLiteral}::vector) AS distance
      FROM corporates
      WHERE needs_embedding = false
      ORDER BY embedding <=> ${vectorLiteral}::vector
      LIMIT ${limit}
    `);

    const rows = (raw as unknown as { rows?: unknown[] }).rows ?? raw;

    return (rows as Array<{
      id: string;
      organization_name: string;
      industry: string;
      location: string;
      description: string;
      talent_needs: string[];
      sponsorship_interests: string[];
      csr_focus: string[];
      budget_range: string;
      collaboration_intent: string;
      hero_flag: boolean;
      fixture_disclaimer_required: boolean;
      contact_email: string;
      embedding: string | null;
      needs_embedding: boolean;
      created_at: Date;
      updated_at: Date;
      distance: number;
    }>).map((r) => ({
      corporate: {
        id: r.id,
        organizationName: r.organization_name,
        industry: r.industry,
        location: r.location,
        description: r.description,
        talentNeeds: r.talent_needs,
        sponsorshipInterests: r.sponsorship_interests,
        csrFocus: r.csr_focus,
        budgetRange: r.budget_range,
        collaborationIntent: r.collaboration_intent,
        heroFlag: r.hero_flag,
        fixtureDisclaimerRequired: r.fixture_disclaimer_required,
        contactEmail: r.contact_email,
        embedding: null,
        needsEmbedding: r.needs_embedding,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      },
      score: Math.max(0, Math.min(1, 1 - Number(r.distance))),
    }));
  }

  // Fallback path.
  const allCorporates = await db.select().from(corporates);
  return allCorporates
    .map((c) => {
      const corpForScore: CorporateForScoring = {
        sponsorshipInterests: c.sponsorshipInterests ?? [],
        csrFocus: c.csrFocus ?? [],
        budgetRange: c.budgetRange ?? "Undisclosed",
      };
      const score = clubForScore
        ? scoreCorporateForClub(clubForScore, corpForScore)
        : 0;
      return { corporate: c, score };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.corporate.id.localeCompare(b.corporate.id);
    })
    .slice(0, limit);
}

/**
 * Aggregate the top N sponsors across all events owned by the given
 * club. Used by the club dashboard to surface a small "Sponsors for
 * your events" panel.
 */
export async function getTopSponsorsForClub(
  clubId: string,
  limit = 5,
): Promise<RankedSponsor[]> {
  const clubEvents = await db
    .select({ id: events.id })
    .from(events)
    .where(eq(events.ownerId, clubId));

  const allResults = await Promise.all(
    clubEvents.map((e) => getRankedSponsorsForEvent(e.id, 25)),
  );

  const merged = new Map<string, RankedSponsor>();
  for (const list of allResults) {
    for (const r of list) {
      const existing = merged.get(r.corporate.id);
      if (!existing || r.score > existing.score) {
        merged.set(r.corporate.id, r);
      }
    }
  }

  return Array.from(merged.values())
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.corporate.id.localeCompare(b.corporate.id);
    })
    .slice(0, limit);
}