import "server-only";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/lib/server/db";
import { students, clubs, corporates } from "@/lib/server/db/schema";
// Reuse P1.3's PersonaRole as the single source of truth. `data/personas.ts`
// already exports `PersonaRole = "student" | "club" | "corporate"`. Re-declaring
// it here would create two nominally-different types that look interchangeable
// but break strict-mode assignability.
export type { PersonaRole } from "@/data/personas";
import type { PersonaRole } from "@/data/personas";

export const VALID_ROLES = ["student", "club", "corporate"] as const;

export type CurrentPersona =
  | { kind: "student"; row: typeof students.$inferSelect; role: "student" }
  | { kind: "club"; row: typeof clubs.$inferSelect; role: "club" }
  | {
      kind: "corporate";
      row: typeof corporates.$inferSelect;
      role: "corporate";
    };

function readCookie(
  jar: Awaited<ReturnType<typeof cookies>>,
  name: string,
): string | null {
  const c = jar.get(name);
  return c && typeof c.value === "string" && c.value.length > 0
    ? c.value
    : null;
}

export async function getCurrentPersona(): Promise<CurrentPersona | null> {
  const jar = await cookies();
  const roleCookie = readCookie(jar, "role");
  const personaIdCookie = readCookie(jar, "personaId");
  if (
    !roleCookie ||
    !personaIdCookie ||
    !(VALID_ROLES as readonly string[]).includes(roleCookie)
  ) {
    return null;
  }
  const role = roleCookie as PersonaRole;
  if (role === "student") {
    const [row] = await db
      .select()
      .from(students)
      .where(eq(students.id, personaIdCookie))
      .limit(1);
    return row ? { kind: "student", row, role } : null;
  }
  if (role === "club") {
    const [row] = await db
      .select()
      .from(clubs)
      .where(eq(clubs.id, personaIdCookie))
      .limit(1);
    return row ? { kind: "club", row, role } : null;
  }
  const [row] = await db
    .select()
    .from(corporates)
    .where(eq(corporates.id, personaIdCookie))
    .limit(1);
  return row ? { kind: "corporate", row, role } : null;
}

/**
 * Returns true when the persona row's `updatedAt` indicates the user has
 * saved edits at least once.
 *
 * Note: we deliberately use strict `>` and do NOT tolerate clock skew.
 * Sub-second drift between `defaultNow()` calls in Postgres is bounded by
 * microseconds (well below JS `Date` millisecond resolution), so a strict
 * inequality is the correct gate. Postgres evaluating `defaultNow()` for
 * two distinct columns can technically produce equal timestamps — the row
 * is "fresh" and the user is treated as needing onboarding.
 */
export function hasOnboarded(row: {
  createdAt: Date;
  updatedAt: Date;
}): boolean {
  return row.updatedAt.getTime() > row.createdAt.getTime();
}