/**
 * Idempotent demo seed. Wipes + re-inserts:
 *   - 24 students, 10 clubs, 12 corporates (data/personas.ts)
 *   - Phase 8 fixtures (data/phase8-fixtures.ts):
 *       - student_experiences, student_achievements, student_activities
 *       - events, event_registrations
 *       - jobs
 *       - posts
 *       - invitations
 *
 * Stable ids are generated for Phase 8 rows so re-seeding is idempotent
 * — see `stableUuid` in data/phase8-fixtures.ts.
 *
 * Re-runs are safe. ON CONFLICT (id) DO UPDATE overwrites every column
 * except id, heroFlag, and createdAt where appropriate.
 *
 * Usage:
 *   npm run db:seed         # upsert rows
 *   npm run db:seed -- --dry-run  # print counts, no writes
 *   npm run db:seed -- --reset   # wipe Phase 8 rows first (events, etc.)
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import {
  students,
  clubs,
  corporates,
  studentExperiences,
  studentAchievements,
  studentActivities,
  events,
  eventRegistrations,
  jobs,
  posts,
  invitations,
} from "../../lib/server/db/schema";
import { PERSONA_FIXTURE } from "../../data/personas";
import {
  EXPERIENCE_FIXTURES,
  ACHIEVEMENT_FIXTURES,
  ACTIVITY_FIXTURES,
  EVENT_FIXTURES,
  EVENT_REGISTRATION_FIXTURES,
  JOB_FIXTURES,
  POST_FIXTURES,
  INVITATION_FIXTURES,
} from "../../data/phase8-fixtures";

const dryRun = process.argv.includes("--dry-run");
const reset = process.argv.includes("--reset");

async function main() {
  const started = Date.now();

  if (dryRun) {
    console.log(
      `[dry-run] would seed ${PERSONA_FIXTURE.students.length} students, ` +
        `${PERSONA_FIXTURE.clubs.length} clubs, ` +
        `${PERSONA_FIXTURE.corporates.length} corporates`,
    );
    console.log(
      `[dry-run] Phase 8: ${EXPERIENCE_FIXTURES.length} experiences, ` +
        `${ACHIEVEMENT_FIXTURES.length} achievements, ` +
        `${ACTIVITY_FIXTURES.length} activities, ` +
        `${EVENT_FIXTURES.length} events, ` +
        `${EVENT_REGISTRATION_FIXTURES.length} registrations, ` +
        `${JOB_FIXTURES.length} jobs, ` +
        `${POST_FIXTURES.length} posts, ` +
        `${INVITATION_FIXTURES.length} invitations`,
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
    console.log("[dry-run] first event:", EVENT_FIXTURES[0]?.title);
    return;
  }

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const client = postgres(url, { prepare: false });
  const db = drizzle(client);

  try {
    // ----------------------------------------------------------------
    // Personas (students, clubs, corporates)
    // ----------------------------------------------------------------
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
          contactEmail: clubs.contactEmail,
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
          contactEmail: corporates.contactEmail,
          fixtureDisclaimerRequired: corporates.fixtureDisclaimerRequired,
          updatedAt: corporates.updatedAt,
        },
      });

    // ----------------------------------------------------------------
    // Phase 8 fixtures
    // ----------------------------------------------------------------

    // Student sub-resources
    if (EXPERIENCE_FIXTURES.length > 0) {
      await db
        .insert(studentExperiences)
        .values(EXPERIENCE_FIXTURES)
        .onConflictDoUpdate({
          target: studentExperiences.id,
          set: {
            kind: studentExperiences.kind,
            title: studentExperiences.title,
            organization: studentExperiences.organization,
            location: studentExperiences.location,
            startDate: studentExperiences.startDate,
            endDate: studentExperiences.endDate,
            description: studentExperiences.description,
            tags: studentExperiences.tags,
            sortOrder: studentExperiences.sortOrder,
          },
        });
    }

    if (ACHIEVEMENT_FIXTURES.length > 0) {
      await db
        .insert(studentAchievements)
        .values(ACHIEVEMENT_FIXTURES)
        .onConflictDoUpdate({
          target: studentAchievements.id,
          set: {
            kind: studentAchievements.kind,
            title: studentAchievements.title,
            issuer: studentAchievements.issuer,
            date: studentAchievements.date,
            url: studentAchievements.url,
            description: studentAchievements.description,
            sortOrder: studentAchievements.sortOrder,
          },
        });
    }

    if (ACTIVITY_FIXTURES.length > 0) {
      await db
        .insert(studentActivities)
        .values(ACTIVITY_FIXTURES)
        .onConflictDoUpdate({
          target: studentActivities.id,
          set: {
            kind: studentActivities.kind,
            role: studentActivities.role,
            organization: studentActivities.organization,
            startDate: studentActivities.startDate,
            endDate: studentActivities.endDate,
            sortOrder: studentActivities.sortOrder,
          },
        });
    }

    // Events
    if (EVENT_FIXTURES.length > 0) {
      // --reset wipes all event-related rows before re-seeding.
      if (reset) {
        await db.execute(sql`
          TRUNCATE TABLE event_registrations, events RESTART IDENTITY CASCADE;
        `);
      }
      await db
        .insert(events)
        .values(
          EVENT_FIXTURES.map((e) => ({
            ...e,
            // Convert ISO strings to Date objects for Drizzle.
            startsAt: new Date(e.startsAt),
            endsAt: e.endsAt ? new Date(e.endsAt) : null,
            // Embeddings are filled by the nightly cron — leave null.
            embedding: null,
            needsEmbedding: true,
          })),
        )
        .onConflictDoUpdate({
          target: events.id,
          set: {
            title: events.title,
            slug: events.slug,
            description: events.description,
            startsAt: events.startsAt,
            endsAt: events.endsAt,
            venue: events.venue,
            locationLabel: events.locationLabel,
            isVirtual: events.isVirtual,
            registrationUrl: events.registrationUrl,
            capacity: events.capacity,
            tags: events.tags,
          },
        });
    }

    // Event registrations — insert with stable UUIDs derived from the
    // (eventId, studentId) pair so the UNIQUE constraint holds.
    if (EVENT_REGISTRATION_FIXTURES.length > 0) {
      // We need to resolve the actual event PKs (we use stable UUIDs in
      // the fixtures). The fixture's `eventId` already matches the seed
      // event id because both come from `stableUuid(NS, "evt:...")`.
      // Same for studentId (string PK).
      await db
        .insert(eventRegistrations)
        .values(
          EVENT_REGISTRATION_FIXTURES.map((r, idx) => ({
            // Stable synthetic UUID per registration row.
            id: stableRegistrationId(r.eventId, r.studentId, idx),
            eventId: r.eventId,
            studentId: r.studentId,
            motivation: r.motivation,
          })),
        )
        .onConflictDoNothing();
    }

    // Jobs
    if (JOB_FIXTURES.length > 0) {
      await db
        .insert(jobs)
        .values(
          JOB_FIXTURES.map((j) => ({
            ...j,
            embedding: null,
            needsEmbedding: true,
          })),
        )
        .onConflictDoUpdate({
          target: jobs.id,
          set: {
            title: jobs.title,
            slug: jobs.slug,
            description: jobs.description,
            employmentType: jobs.employmentType,
            locationLabel: jobs.locationLabel,
            isRemote: jobs.isRemote,
            startsOn: jobs.startsOn,
            endsOn: jobs.endsOn,
            applyUrl: jobs.applyUrl,
            applyEmail: jobs.applyEmail,
            skills: jobs.skills,
            isOpen: jobs.isOpen,
          },
        });
    }

    // Posts (journal / news)
    if (POST_FIXTURES.length > 0) {
      await db
        .insert(posts)
        .values(
          POST_FIXTURES.map((p) => ({
            ...p,
            // Convert ISO strings to Date objects for Drizzle.
            publishedAt: new Date(p.publishedAt),
            embedding: null,
            needsEmbedding: true,
          })),
        )
        .onConflictDoUpdate({
          target: posts.id,
          set: {
            title: posts.title,
            slug: posts.slug,
            body: posts.body,
            tags: posts.tags,
            publishedAt: posts.publishedAt,
          },
        });
    }

    // Invitations (outreach log) — also wipe on --reset
    if (reset) {
      await db.execute(sql`TRUNCATE TABLE invitations RESTART IDENTITY;`);
    }
    if (INVITATION_FIXTURES.length > 0) {
      await db
        .insert(invitations)
        .values(
          INVITATION_FIXTURES.map((inv) => ({
            ...inv,
            // Convert ISO strings to Date objects for Drizzle.
            sentAt: new Date(inv.sentAt),
          })),
        )
        .onConflictDoNothing();
    }

    // ----------------------------------------------------------------
    // Summary
    // ----------------------------------------------------------------
    const counts = await db.execute(sql`
      SELECT
        (SELECT COUNT(*) FROM students) AS students,
        (SELECT COUNT(*) FROM clubs) AS clubs,
        (SELECT COUNT(*) FROM corporates) AS corporates,
        (SELECT COUNT(*) FROM student_experiences) AS experiences,
        (SELECT COUNT(*) FROM student_achievements) AS achievements,
        (SELECT COUNT(*) FROM student_activities) AS activities,
        (SELECT COUNT(*) FROM events) AS events,
        (SELECT COUNT(*) FROM event_registrations) AS event_registrations,
        (SELECT COUNT(*) FROM jobs) AS jobs,
        (SELECT COUNT(*) FROM posts) AS posts,
        (SELECT COUNT(*) FROM invitations) AS invitations;
    `);
    const row = (counts as unknown as Array<Record<string, string>>)[0] ?? {};
    console.log("Seed complete:");
    for (const [k, v] of Object.entries(row)) {
      console.log(`  ${k.padEnd(20)} ${v}`);
    }
    console.log(`  duration               ${Date.now() - started}ms`);
  } finally {
    await client.end();
  }
}

// Stable UUID for a registration row, derived from (eventId, studentId)
// + a numeric index. Re-runs of the seed will produce the same id, and
// the UNIQUE constraint on (event_id, student_id) in eventRegistrations
// is the real source of idempotency for registrations — the id is just
// a deterministic placeholder.
import { createHash } from "node:crypto";
function stableRegistrationId(
  eventId: string,
  studentId: string,
  idx: number,
): string {
  const h = createHash("sha1")
    .update(`reg:${eventId}:${studentId}:${idx}`)
    .digest();
  const bytes = Buffer.from(h.subarray(0, 16));
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});