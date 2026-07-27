import "server-only";
import { eq, desc, asc } from "drizzle-orm";
import { db } from "@/lib/server/db";
import { students, clubs, corporates } from "@/lib/server/db/schema";
import { HERO_PERSONAS, type PersonaRole } from "@/data/personas";

export type AnyPersona = {
  id: string;
  name: string;
  role: PersonaRole;
  heroFlag: boolean;
  fixtureDisclaimerRequired: boolean;
};

type CommonRow = {
  id: string;
  heroFlag: boolean;
  fixtureDisclaimerRequired: boolean;
};

function rowToPersona(
  row: CommonRow,
  role: PersonaRole,
  name: string,
): AnyPersona {
  return {
    id: row.id,
    name,
    role,
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
      fallback as unknown as CommonRow & { name: string },
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
  let row: CommonRow & Record<string, unknown> | undefined;
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
      fallback as unknown as CommonRow & { name: string },
      fallback.role,
      fallback.name,
    );
  }
  return null;
}

/** All hero personas (3 rows: one student, one club, one corporate). Used by
 *  /demo to render the persona catalog. Order: students, clubs, corporates. */
export async function getAllHeroPersonas(): Promise<AnyPersona[]> {
  const s = await db
    .select()
    .from(students)
    .where(eq(students.heroFlag, true));
  const c = await db.select().from(clubs).where(eq(clubs.heroFlag, true));
  const co = await db
    .select()
    .from(corporates)
    .where(eq(corporates.heroFlag, true));

  const fromDb = [
    ...s.map((r) => rowToPersona(r, "student", r.fullName)),
    ...c.map((r) => rowToPersona(r, "club", r.clubName)),
    ...co.map((r) => rowToPersona(r, "corporate", r.organizationName)),
  ];

  if (fromDb.length > 0) return fromDb;

  console.warn("[personas] no hero rows in DB, falling back to fixture");
  return HERO_PERSONAS.map((p) =>
    rowToPersona(
      p as unknown as CommonRow & { name: string },
      p.role,
      p.name,
    ),
  );
}
