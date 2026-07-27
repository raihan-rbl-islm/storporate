import "server-only";
import { eq, desc, asc } from "drizzle-orm";
import { db } from "@/lib/server/db";
import { students, clubs, corporates } from "@/lib/server/db/schema";
import { HERO_PERSONAS, type PersonaRole } from "@/data/personas";

export type AnyPersona = {
  id: string;
  name: string;
  role: PersonaRole;
  /** Institution or organization the persona is anchored to. */
  institution: string;
  /** Short scenario blurb used on the /demo catalog card. */
  scenario: string;
  heroFlag: boolean;
  fixtureDisclaimerRequired: boolean;
};

type CommonRow = {
  id: string;
  heroFlag: boolean;
  fixtureDisclaimerRequired: boolean;
};

function defaultInstitution(role: PersonaRole): string {
  if (role === "corporate") return "Organization";
  return "University";
}

function defaultScenario(): string {
  return "Prepared scenario.";
}

/**
 * Map a row from one of the persona tables into an AnyPersona.
 *
 * `institution` and `scenario` come straight from the row's columns so
 * we don't have to maintain a parallel map keyed by id. When the row is
 * missing the column (e.g. a future table addition, or a fallback
 * fixture row), we provide sane defaults so /demo cards still render.
 */
function rowToPersona(
  row: CommonRow & Partial<Record<string, unknown>>,
  role: PersonaRole,
  name: string,
): AnyPersona {
  // Pick the first non-empty candidate per field. The order is role-aware
  // so the most informative column wins for each table:
  //   - students:  university (institution) + bio (scenario)
  //   - clubs:     university (institution) + mission (scenario)
  //   - corporates: industry (institution) + description (scenario)
  // The DB fallback path keeps these columns first so we don't have to
  // pass role-specific knowledge through the call site.
  const rawInstitution =
    row.university ?? row.industry ?? row.institution ?? null;
  const rawScenario =
    row.scenario ?? row.bio ?? row.description ?? row.mission ?? null;
  return {
    id: row.id,
    name,
    role,
    institution:
      typeof rawInstitution === "string" && rawInstitution.length > 0
        ? rawInstitution
        : defaultInstitution(role),
    scenario:
      typeof rawScenario === "string" && rawScenario.length > 0
        ? rawScenario
        : defaultScenario(),
    heroFlag: row.heroFlag,
    fixtureDisclaimerRequired: row.fixtureDisclaimerRequired,
  };
}

/** Resolve the persona matching the given id. Falls back to the in-memory
 *  HERO_PERSONAS array if the DB lookup misses (e.g. seed not run, stale
 *  cookie). Returns null if both miss. */
export async function getPersonaById(
  id: string,
): Promise<AnyPersona | null> {
  const [s] = await db
    .select()
    .from(students)
    .where(eq(students.id, id))
    .limit(1);
  if (s) return rowToPersona(s, "student", s.fullName);

  const [c] = await db
    .select()
    .from(clubs)
    .where(eq(clubs.id, id))
    .limit(1);
  if (c) return rowToPersona(c, "club", c.clubName);

  const [co] = await db
    .select()
    .from(corporates)
    .where(eq(corporates.id, id))
    .limit(1);
  if (co) return rowToPersona(co, "corporate", co.organizationName);

  const fallback = HERO_PERSONAS.find((p) => p.id === id);
  if (fallback) {
    console.warn(
      `[personas] no DB row for id="${id}", falling back to fixture`,
    );
    return rowToPersona(
      fallback as unknown as AnyPersona & CommonRow,
      fallback.role,
      fallback.name,
    );
  }
  return null;
}

/** Default persona for a role. Used by the role switcher when the cookie
 *  has a role but no personaId. Returns the first hero persona matching the
 *  role (heroFlag desc, createdAt asc). */
export async function getDefaultPersonaForRole(
  role: PersonaRole,
): Promise<AnyPersona | null> {
  let row: (CommonRow & Record<string, unknown>) | undefined;
  let nameCol: "fullName" | "clubName" | "organizationName" = "fullName";

  if (role === "student") {
    [row] = await db
      .select()
      .from(students)
      .orderBy(desc(students.heroFlag), asc(students.createdAt))
      .limit(1);
    nameCol = "fullName";
  } else if (role === "club") {
    [row] = await db
      .select()
      .from(clubs)
      .orderBy(desc(clubs.heroFlag), asc(clubs.createdAt))
      .limit(1);
    nameCol = "clubName";
  } else {
    [row] = await db
      .select()
      .from(corporates)
      .orderBy(desc(corporates.heroFlag), asc(corporates.createdAt))
      .limit(1);
    nameCol = "organizationName";
  }

  if (row) {
    return rowToPersona(row, role, String(row[nameCol] ?? ""));
  }

  console.warn(
    `[personas] DB empty for role="${role}", falling back to fixture`,
  );
  const fallback = HERO_PERSONAS.find((p) => p.role === role);
  if (fallback) {
    return rowToPersona(
      fallback as unknown as AnyPersona & CommonRow,
      fallback.role,
      fallback.name,
    );
  }
  return null;
}

/** All hero personas (3 rows: one student, one club, one corporate). Used by
 *  /demo to render the persona catalog. Order: students, clubs, corporates.
 *
 *  The three queries are independent — fire them concurrently so /demo
 *  pays one DB round-trip instead of three. */
export async function getAllHeroPersonas(): Promise<AnyPersona[]> {
  const [s, c, co] = await Promise.all([
    db.select().from(students).where(eq(students.heroFlag, true)),
    db.select().from(clubs).where(eq(clubs.heroFlag, true)),
    db.select().from(corporates).where(eq(corporates.heroFlag, true)),
  ]);

  const fromDb = [
    ...s.map((r) => rowToPersona(r, "student", r.fullName)),
    ...c.map((r) => rowToPersona(r, "club", r.clubName)),
    ...co.map((r) => rowToPersona(r, "corporate", r.organizationName)),
  ];

  if (fromDb.length > 0) return fromDb;

  console.warn("[personas] no hero rows in DB, falling back to fixture");
  return HERO_PERSONAS.map((p) =>
    rowToPersona(
      p as unknown as AnyPersona & CommonRow,
      p.role,
      p.name,
    ),
  );
}