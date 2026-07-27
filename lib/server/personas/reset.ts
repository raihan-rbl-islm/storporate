import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/server/db";
import {
  students,
  clubs,
  corporates,
  outreachEvents,
} from "@/lib/server/db/schema";
import { PERSONA_FIXTURE } from "@/data/personas";
// Import PersonaRole from the canonical type module rather than from
// `@/lib/server/personas/current` to avoid a circular re-export between
// current.ts -> reset.ts -> current.ts.
import type { PersonaRole } from "@/data/personas";

type StudentRow = typeof students.$inferSelect;
type ClubRow = typeof clubs.$inferSelect;
type CorporateRow = typeof corporates.$inferSelect;

function eqShape<T extends Record<string, unknown>>(
  a: T,
  b: Partial<T>,
): boolean {
  for (const k of Object.keys(b)) {
    if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) return false;
  }
  return true;
}

export async function resetPersonaToFixture(
  role: PersonaRole,
  personaId: string,
): Promise<{ changed: boolean }> {
  if (role === "student") {
    const fixture = PERSONA_FIXTURE.students.find((p) => p.id === personaId);
    if (!fixture) return { changed: false };
    const [row] = await db
      .select()
      .from(students)
      .where(eq(students.id, personaId))
      .limit(1);
    if (!row) return { changed: false };
    const candidate = {
      fullName: fixture.fullName,
      university: fixture.university,
      studyProgram: fixture.studyProgram,
      expectedGraduation: fixture.expectedGraduation,
      location: fixture.location,
      bio: fixture.bio,
      skills: fixture.skills,
      careerInterests: fixture.careerInterests,
      heroFlag: fixture.heroFlag,
      fixtureDisclaimerRequired: fixture.fixtureDisclaimerRequired,
    } satisfies Partial<StudentRow>;
    // Note: heroFlag and fixtureDisclaimerRequired must be part of the
    // comparison even though they are usually equal to the fixture. If a
    // demo admin ever flips one of these via a separate code path, the
    // reset call must still bump updatedAt so Phase 3 cache invalidation
    // observes the change.
    if (eqShape(row, candidate)) return { changed: false };
    await db
      .update(students)
      .set({ ...candidate, updatedAt: new Date() })
      .where(eq(students.id, personaId));
    await clearOutreachEventsForPersona(personaId);
    return { changed: true };
  }
  if (role === "club") {
    const fixture = PERSONA_FIXTURE.clubs.find((p) => p.id === personaId);
    if (!fixture) return { changed: false };
    const [row] = await db
      .select()
      .from(clubs)
      .where(eq(clubs.id, personaId))
      .limit(1);
    if (!row) return { changed: false };
    const candidate = {
      clubName: fixture.clubName,
      university: fixture.university,
      categories: fixture.categories,
      mission: fixture.mission,
      audienceReachLabel: fixture.audienceReachLabel,
      eventFocus: fixture.eventFocus,
      sponsorshipNeeds: fixture.sponsorshipNeeds,
      location: fixture.location,
      contactRole: fixture.contactRole,
      heroFlag: fixture.heroFlag,
      fixtureDisclaimerRequired: fixture.fixtureDisclaimerRequired,
    } satisfies Partial<ClubRow>;
    // Hero-style flags MUST be in the equality check (see deviation 5):
    // changing them without bumping updatedAt would break Phase 3 cache
    // invalidation.
    if (eqShape(row, candidate)) return { changed: false };
    await db
      .update(clubs)
      .set({ ...candidate, updatedAt: new Date() })
      .where(eq(clubs.id, personaId));
    await clearOutreachEventsForPersona(personaId);
    return { changed: true };
  }
  const fixture = PERSONA_FIXTURE.corporates.find(
    (p) => p.id === personaId,
  );
  if (!fixture) return { changed: false };
  const [row] = await db
    .select()
    .from(corporates)
    .where(eq(corporates.id, personaId))
    .limit(1);
  if (!row) return { changed: false };
  const candidate = {
    organizationName: fixture.organizationName,
    industry: fixture.industry,
    location: fixture.location,
    description: fixture.description,
    talentNeeds: fixture.talentNeeds,
    sponsorshipInterests: fixture.sponsorshipInterests,
    csrFocus: fixture.csrFocus,
    budgetRange: fixture.budgetRange,
    collaborationIntent: fixture.collaborationIntent,
    heroFlag: fixture.heroFlag,
    fixtureDisclaimerRequired: fixture.fixtureDisclaimerRequired,
  } satisfies Partial<CorporateRow>;
  // Hero-style flags MUST be in the equality check (see deviation 5).
  if (eqShape(row, candidate)) return { changed: false };
  await db
    .update(corporates)
    .set({ ...candidate, updatedAt: new Date() })
    .where(eq(corporates.id, personaId));
  return { changed: true };
}

/**
 * Best-effort delete of any `outreach_events` rows belonging to the
 * given persona. Wrapped in try/catch so a delete failure (e.g. transient
 * DB error) never blocks the persona reset. Per Phase 5's plan, the
 * persona reset must succeed even if this cleanup fails.
 */
async function clearOutreachEventsForPersona(personaId: string): Promise<void> {
  try {
    await db
      .delete(outreachEvents)
      .where(eq(outreachEvents.personaId, personaId));
  } catch (err) {
    console.error(
      "[resetPersonaToFixture] outreach_events cleanup failed:",
      err,
    );
  }
}
