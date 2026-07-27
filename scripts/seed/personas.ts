/**
 * Idempotent seed for the Phase 1.3 personas (12 students, 6 clubs, 5 corporates).
 *
 * Pattern mirrors scripts/verify-pgvector.ts: standalone postgres() + drizzle()
 * client, dotenv/config for belt-and-braces (db:seed is run via
 * `dotenv -e .env.local --` in package.json), `client.end()` in finally,
 * top-level .catch() to surface failures cleanly.
 *
 * Re-runs are safe: ON CONFLICT (id) DO UPDATE overwrites every column
 * except id, heroFlag, and createdAt. So iterating on the fixture is
 * cheap, and CI can run this on every push without unique-constraint
 * failures.
 *
 * Usage:
 *   npm run db:seed         # upsert rows
 *   npm run db:seed -- --dry-run  # print counts + sample rows, no writes
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { students, clubs, corporates } from "../../lib/server/db/schema";
import { PERSONA_FIXTURE } from "../../data/personas";

const dryRun = process.argv.includes("--dry-run");

async function main() {
  const started = Date.now();

  if (dryRun) {
    console.log(
      `[dry-run] would seed ${PERSONA_FIXTURE.students.length} students, ` +
        `${PERSONA_FIXTURE.clubs.length} clubs, ` +
        `${PERSONA_FIXTURE.corporates.length} corporates`,
    );
    console.log(
      "[dry-run] first student:",
      PERSONA_FIXTURE.students[0]?.fullName,
    );
    console.log("[dry-run] first club:", PERSONA_FIXTURE.clubs[0]?.clubName);
    console.log(
      "[dry-run] first corporate:",
      PERSONA_FIXTURE.corporates[0]?.organizationName,
    );
    return;
  }

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const client = postgres(url, { prepare: false });
  const db = drizzle(client);

  try {
    await db
      .insert(students)
      .values(PERSONA_FIXTURE.students)
      .onConflictDoUpdate({
        target: students.id,
        set: {
          fullName: students.fullName,
          university: students.university,
          studyProgram: students.studyProgram,
          expectedGraduation: students.expectedGraduation,
          location: students.location,
          bio: students.bio,
          skills: students.skills,
          careerInterests: students.careerInterests,
          fixtureDisclaimerRequired: students.fixtureDisclaimerRequired,
          updatedAt: students.updatedAt,
        },
      });

    await db
      .insert(clubs)
      .values(PERSONA_FIXTURE.clubs)
      .onConflictDoUpdate({
        target: clubs.id,
        set: {
          clubName: clubs.clubName,
          university: clubs.university,
          categories: clubs.categories,
          mission: clubs.mission,
          audienceReachLabel: clubs.audienceReachLabel,
          eventFocus: clubs.eventFocus,
          sponsorshipNeeds: clubs.sponsorshipNeeds,
          location: clubs.location,
          contactRole: clubs.contactRole,
          fixtureDisclaimerRequired: clubs.fixtureDisclaimerRequired,
          updatedAt: clubs.updatedAt,
        },
      });

    await db
      .insert(corporates)
      .values(PERSONA_FIXTURE.corporates)
      .onConflictDoUpdate({
        target: corporates.id,
        set: {
          organizationName: corporates.organizationName,
          industry: corporates.industry,
          location: corporates.location,
          description: corporates.description,
          talentNeeds: corporates.talentNeeds,
          sponsorshipInterests: corporates.sponsorshipInterests,
          csrFocus: corporates.csrFocus,
          budgetRange: corporates.budgetRange,
          collaborationIntent: corporates.collaborationIntent,
          fixtureDisclaimerRequired: corporates.fixtureDisclaimerRequired,
          updatedAt: corporates.updatedAt,
        },
      });

    console.log(
      `Seeded ${PERSONA_FIXTURE.students.length} students, ` +
        `${PERSONA_FIXTURE.clubs.length} clubs, ` +
        `${PERSONA_FIXTURE.corporates.length} corporates ` +
        `in ${Date.now() - started}ms`,
    );
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
