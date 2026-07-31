import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/server/db";
import { students, clubs, corporates } from "@/lib/server/db/schema";
import { users } from "@/lib/server/db/schema";
import { getServerSupabase } from "@/lib/supabase/server";
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



export async function getCurrentPersona(): Promise<CurrentPersona | null> {
  // Phase 7: real Supabase-authenticated users take precedence. If the
  // visitor has a Supabase session and a `users` row, resolve via the
  // `users` table instead of the demo cookies. This makes the existing
  // dashboard pages work for both demo personas AND real signed-in
  // users without changing any of the 14 call sites.
  //
  // The Supabase call is wrapped in a guard so callers (and unit tests)
  // without SUPABASE_URL set still get the legacy cookie-based result.
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    try {
      const supabase = await getServerSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const [u] = await db
          .select()
          .from(users)
          .where(eq(users.authUserId, user.id))
          .limit(1);
        if (
          u?.role &&
          u.personaId &&
          (VALID_ROLES as readonly string[]).includes(u.role)
        ) {
          const role = u.role as PersonaRole;
          const personaId = u.personaId;
          if (role === "student") {
            const [row] = await db
              .select()
              .from(students)
              .where(eq(students.id, personaId))
              .limit(1);
            if (row) return { kind: "student", row, role };
          } else if (role === "club") {
            const [row] = await db
              .select()
              .from(clubs)
              .where(eq(clubs.id, personaId))
              .limit(1);
            if (row) return { kind: "club", row, role };
          } else {
            const [row] = await db
              .select()
              .from(corporates)
              .where(eq(corporates.id, personaId))
              .limit(1);
            if (row) return { kind: "corporate", row, role };
          }
        }
      }
    } catch (err) {
      // Don't let a Supabase failure break the legacy cookie flow. The
      // most common cause here is a misconfigured project URL/key in
      // CI; logging once keeps the request going.
      console.error("[getCurrentPersona] Supabase check failed:", err);
    }
  }

  // Fall back to the legacy demo cookie flow.
  // Fall back to null if no valid Supabase user was found.
  return null;
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