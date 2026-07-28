import {
  pgTable,
  boolean,
  serial,
  text,
  timestamp,
  customType,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * pgvector is not exported from drizzle-orm/pg-core. We register a custom
 * Postgres type that emits `vector(N)` columns and round-trips a JS number[]
 * through pgvector's bracket-literal wire format.
 *
 * IMPORTANT: the `toDriver` here covers typed inserts via
 * `db.insert(table).values({ embedding: arr })`. Raw `sql` template literals
 * that interpolate an array directly will NOT be reformatted — see the
 * `toVectorLiteral` helper in `scripts/verify-pgvector.ts` for the correct
 * stringification when using raw SQL.
 */
const vector = (dim: number) =>
  customType<{ data: number[]; driverData: string }>({
    dataType() {
      return `vector(${dim})`;
    },
    toDriver(v: number[]) {
      return `[${v.join(",")}]`;
    },
    fromDriver(s: string) {
      return s
        .replace(/[\[\]]/g, "")
        .split(",")
        .map(Number);
    },
  });

/**
 * Dimensions: 768 is the standard Matryoshka Representation Learning (MRL)
 * truncation option for `gemini-embedding-001` (the current Gemini embedding
 * model — `text-embedding-004` is being deprecated 2026-01-14). 768 is also
 * what most Supabase+Gemini pgvector guides standardize on. Locking this in
 * here so Phase 3 product tables use the same dimension. Changing a vector
 * column's dimension later requires a real migration, not a config edit.
 */
export const healthCheck = pgTable("health_check", {
  id: serial("id").primaryKey(),
  embedding: vector(768)("embedding").notNull(),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ----------------------------------------------------------------------
// Phase 7: real users
//
// One row per Supabase-authenticated account. `authUserId` mirrors
// `auth.users.id` (a Supabase-managed uuid) so we never store or display
// the user's email here — the source of truth for email lives in
// auth.users and we always read it back via `supabase.auth.getUser()`.
//
// `role` is nullable until the user completes role-selection onboarding;
// `personaId` then points at the matching row in `students`, `clubs`,
// or `corporates`. We use a single text column here (rather than three
// nullable FKs) so the role is authoritative and we can wire the correct
// relationship at query time.
//
// `onboardedAt` flips to a non-null timestamp the moment the user submits
// the role-specific minimum-required-fields form. Before that, the user
// is authenticated but not yet allowed onto the dashboard.
//
// All FKs to persona tables are intentionally logical (string ids) rather
// than declared REFERENCES — the same convention the rest of the schema
// uses for persona <-> interest tables.
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    authUserId: text("auth_user_id").notNull(),
    role: text("role"),
    personaId: text("persona_id"),
    displayName: text("display_name").notNull().default(""),
    onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    uniqAuthUser: uniqueIndex("users_auth_user_id_uniq").on(t.authUserId),
  }),
);

// ----------------------------------------------------------------------
// Persona schema (Phase 1.3)
//
// Three tables back the Demo personas and the eventual onboarding /
// matching flow. They are intentionally minimal here; Phase 2 adds
// nullable profile columns, Phase 3 adds `profile_embedding vector(768)`
// for similarity search.
//
// Conventions (mirrored from health_check above):
//   - snake_case column names, camelCase TS keys
//   - every column .notNull() unless truly optional
//   - timestamps use { withTimezone: true } and .defaultNow()
//   - heroFlag distinguishes the 3 demo anchors from the 20 variety
//     personas (so the malformed-cookie fallback can resolve them
//     deterministically: order by heroFlag desc, createdAt asc)

export const students = pgTable("students", {
  id: text("id").primaryKey(),
  fullName: text("full_name").notNull(),
  university: text("university").notNull(),
  studyProgram: text("study_program").notNull(),
  expectedGraduation: text("expected_graduation").notNull(),
  location: text("location").notNull(),
  bio: text("bio").notNull().default(""),
  skills: text("skills").array().notNull(),
  careerInterests: text("career_interests").array().notNull(),
  heroFlag: boolean("hero_flag").notNull().default(false),
  fixtureDisclaimerRequired: boolean("fixture_disclaimer_required")
    .notNull()
    .default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const clubs = pgTable("clubs", {
  id: text("id").primaryKey(),
  clubName: text("club_name").notNull(),
  university: text("university").notNull(),
  categories: text("categories").array().notNull(),
  mission: text("mission").notNull().default(""),
  audienceReachLabel: text("audience_reach_label").notNull(),
  eventFocus: text("event_focus").array().notNull(),
  sponsorshipNeeds: text("sponsorship_needs").array().notNull(),
  location: text("location").notNull(),
  contactRole: text("contact_role").notNull(),
  heroFlag: boolean("hero_flag").notNull().default(false),
  fixtureDisclaimerRequired: boolean("fixture_disclaimer_required")
    .notNull()
    .default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const corporates = pgTable("corporates", {
  id: text("id").primaryKey(),
  organizationName: text("organization_name").notNull(),
  industry: text("industry").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull().default(""),
  talentNeeds: text("talent_needs").array().notNull(),
  sponsorshipInterests: text("sponsorship_interests").array().notNull(),
  csrFocus: text("csr_focus").array().notNull(),
  budgetRange: text("budget_range").notNull().default("Undisclosed"),
  collaborationIntent: text("collaboration_intent").notNull(),
  heroFlag: boolean("hero_flag").notNull().default(false),
  fixtureDisclaimerRequired: boolean("fixture_disclaimer_required")
    .notNull()
    .default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ----------------------------------------------------------------------
// Phase 4: student apply (a student expresses interest in a specific
// corporate match). One row per (student, corporate) pair, enforced at
// the DB level so a duplicate insert becomes a Postgres 23505 — caught
// and translated to a friendly "duplicate" status in the Server Action.
//
// `studentId` / `corporateId` mirror the persona table `id` columns
// (text, not serial) so the FK semantics match the rest of the schema
// even though we don't declare formal FKs (personas are fixtures; the
// canonical id comes from the cookie session).
export const studentApplications = pgTable(
  "student_applications",
  {
    id: serial("id").primaryKey(),
    studentId: text("student_id").notNull(),
    corporateId: text("corporate_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    uniqStudentCorporate: uniqueIndex(
      "student_applications_student_corporate_uniq",
    ).on(t.studentId, t.corporateId),
  }),
);

// ----------------------------------------------------------------------
// Phase 4: club sponsorship interest (a club expresses interest in a
// specific corporate sponsor). One row per (club, corporate) pair, enforced
// at the DB level so a duplicate insert becomes a Postgres 23505 — caught
// and translated to a friendly "duplicate" status in the Server Action.
//
// `clubId` / `corporateId` mirror the persona table `id` columns (text,
// not serial) so the FK semantics match the rest of the schema even though
// we don't declare formal FKs (personas are fixtures; the canonical id
// comes from the cookie session).
export const clubSponsorshipInterests = pgTable(
  "club_sponsorship_interests",
  {
    id: serial("id").primaryKey(),
    clubId: text("club_id").notNull(),
    corporateId: text("corporate_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    uniqClubCorporate: uniqueIndex(
      "club_sponsorship_interests_club_corporate_uniq",
    ).on(t.clubId, t.corporateId),
  }),
);

// ----------------------------------------------------------------------
// Phase 4: corporate interest (a corporate expresses interest in a
// specific student or club candidate). One row per
// (corporate, candidateKind, candidateId) triple — `candidateKind` is the
// discriminator (`'student' | 'club'`) and lives in the unique key so a
// corporate cannot accidentally record two interests in the same
// `candidateId` for two different kinds. A duplicate insert becomes a
// Postgres 23505 — caught and translated to a friendly "duplicate"
// status in the Server Action.
//
// `candidateKind` is `text` rather than a Postgres enum to keep this
// migration light (a future polish ticket can tighten the type).
export const corporateInterests = pgTable(
  "corporate_interests",
  {
    id: serial("id").primaryKey(),
    corporateId: text("corporate_id").notNull(),
    candidateKind: text("candidate_kind").notNull(),
    candidateId: text("candidate_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    uniqCorporateCandidate: uniqueIndex(
      "corporate_interests_corporate_candidate_uniq",
    ).on(t.corporateId, t.candidateKind, t.candidateId),
  }),
);

// ----------------------------------------------------------------------
// Phase 5: outreach_events (local Demo "send" state). One row per
// (role, personaId, kind, corporateId) tuple — enforced at the DB level so
// a duplicate insert becomes a Postgres 23505 and is translated to a
// friendly "duplicate" status in the Server Action.
//
// `kind` is the draft kind (`"student-application" | "club-sponsorship-pitch"`)
// and `role` is the persona role (`"student" | "club"`). Both are `text`
// rather than Postgres enums to keep migrations light. This table is
// PURELY local state: the Demo "Send" button never touches an email API
// or external recipient. Re-sending on the same rationale is blocked by
// the unique constraint.
export const outreachEvents = pgTable(
  "outreach_events",
  {
    id: serial("id").primaryKey(),
    kind: text("kind").notNull(),
    role: text("role").notNull(),
    personaId: text("persona_id").notNull(),
    corporateId: text("corporate_id").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    uniqPersonaCorporateKind: uniqueIndex(
      "outreach_events_persona_corporate_kind_uniq",
    ).on(t.role, t.personaId, t.kind, t.corporateId),
  }),
);
