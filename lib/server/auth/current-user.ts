import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/server/db";
import {
  users,
  students,
  clubs,
  corporates,
} from "@/lib/server/db/schema";
import { getServerSupabase } from "@/lib/supabase/server";
import type { PersonaRole } from "@/data/personas";

export type AuthenticatedUser =
  | {
      kind: "needs-role";
      authUserId: string;
      email: string | null;
      displayName: string;
    }
  | {
      kind: "needs-onboarding";
      authUserId: string;
      email: string | null;
      displayName: string;
      role: PersonaRole;
      personaId: string;
    }
  | {
      kind: "ready";
      authUserId: string;
      email: string | null;
      displayName: string;
      role: PersonaRole;
      personaId: string;
    }
  | { kind: "anonymous" };

/**
 * Resolve the current authenticated Supabase user and look up the matching
 * `users` row.
 *
 * This is the source of truth for "who is the visitor" in the new auth
 * world. Three terminal kinds describe what the user needs next:
 *
 *   - `needs-role`     — authenticated but hasn't picked Student / Club / Corporate
 *   - `needs-onboarding` — picked a role but hasn't filled minimum required fields
 *   - `ready`          — fully onboarded, can land on /dashboard
 *   - `anonymous`      — no Supabase session
 *
 * Callers branch on `kind` to choose a redirect target.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser> {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { kind: "anonymous" };

  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.authUserId, user.id))
    .limit(1);

  const email = user.email ?? null;
  const displayName =
    row?.displayName?.trim() ||
    (email ? email.split("@")[0] : "") ||
    "Storporate member";

  if (!row || !row.role || !row.personaId) {
    return { kind: "needs-role", authUserId: user.id, email, displayName };
  }
  const role = row.role as PersonaRole;

  if (!row.onboardedAt) {
    return {
      kind: "needs-onboarding",
      authUserId: user.id,
      email,
      displayName,
      role,
      personaId: row.personaId,
    };
  }
  return {
    kind: "ready",
    authUserId: user.id,
    email,
    displayName,
    role,
    personaId: row.personaId,
  };
}

/**
 * Convenience: just the role/personaId when we know the user is `ready` or
 * `needs-onboarding`. Returns null for `anonymous` / `needs-role`.
 */
export async function getActivePersonaRef(): Promise<
  { role: PersonaRole; personaId: string; authUserId: string } | null
> {
  const u = await getCurrentUser();
  if (u.kind === "anonymous" || u.kind === "needs-role") return null;
  return { role: u.role, personaId: u.personaId, authUserId: u.authUserId };
}

/**
 * Verify a role/personaId pair points at a real persona row. Used right
 * after a user picks a role — if they pick "student" we create a row in
 * `students` and want to confirm the FK target is well-formed before
 * redirecting.
 */
export async function personaRowExists(
  role: PersonaRole,
  personaId: string,
): Promise<boolean> {
  if (role === "student") {
    const [row] = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.id, personaId))
      .limit(1);
    return Boolean(row);
  }
  if (role === "club") {
    const [row] = await db
      .select({ id: clubs.id })
      .from(clubs)
      .where(eq(clubs.id, personaId))
      .limit(1);
    return Boolean(row);
  }
  const [row] = await db
    .select({ id: corporates.id })
    .from(corporates)
    .where(eq(corporates.id, personaId))
    .limit(1);
  return Boolean(row);
}

/**
 * Read the auth row by id. Returns null when the row is absent so callers
 * can decide between "first sign-in" and "already a member".
 */
export async function findUserByAuthId(authUserId: string) {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.authUserId, authUserId))
    .limit(1);
  return row ?? null;
}

/**
 * Update-or-insert the auth row for a given Supabase user. Used right
 * after the callback exchanges the OAuth code, before we know the user's
 * role.
 */
export async function upsertUserOnSignIn(args: {
  authUserId: string;
  email: string | null;
  displayName: string;
}): Promise<void> {
  const existing = await findUserByAuthId(args.authUserId);
  if (existing) return; // never overwrite role / persona here
  await db.insert(users).values({
    authUserId: args.authUserId,
    displayName: args.displayName,
  });
}

/**
 * Persist the role + persona binding. Called from the role-selection
 * server action. Idempotent: if the user already has the same role + a
 * matching persona row, returns the existing persona id.
 *
 * Creates a minimal persona row in the appropriate table using a
 * `text` id keyed off the Supabase auth user id so we have a stable
 * 1-to-1 link. The minimum-required-fields onboarding form then fills
 * the rest in.
 */
export async function bindRoleToPersona(args: {
  authUserId: string;
  role: PersonaRole;
  displayName: string;
}): Promise<string> {
  const existing = await findUserByAuthId(args.authUserId);
  if (existing?.personaId && existing.role === args.role) {
    return existing.personaId;
  }

  const personaId = `u_${args.authUserId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32)}`;

  if (existing) {
    // Update the binding and overwrite the persona row content (rare path
    // — only happens when a user changes their role selection before
    // completing onboarding).
    await db
      .update(users)
      .set({
        role: args.role,
        personaId,
        displayName: args.displayName,
        onboardedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.authUserId, args.authUserId));
  } else {
    // Race-safe insert: if another concurrent request already created
    // the row, swallow the unique-violation and fall through to the
    // existing-row path on the next call. The action's idempotency
    // guarantees a correct final state.
    try {
      await db.insert(users).values({
        authUserId: args.authUserId,
        role: args.role,
        personaId,
        displayName: args.displayName,
      });
    } catch (err) {
      // Postgres unique-violation on users_auth_user_id_uniq = 23505.
      // Anything else bubbles up.
      const code = (err as { code?: string } | null)?.code;
      if (code !== "23505") throw err;
      // Re-fetch and align with the existing row before continuing.
      const concurrent = await findUserByAuthId(args.authUserId);
      if (concurrent?.personaId && concurrent.role === args.role) {
        return concurrent.personaId;
      }
      // Different role was inserted by the concurrent request — let the
      // update path below take over.
    }
  }

  // Ensure a matching row exists in the per-role persona table. We
  // intentionally write minimal placeholders that the onboarding form
  // will overwrite. Anything marked .notNull() in the schema must be
  // supplied here.
  if (args.role === "student") {
    await db
      .insert(students)
      .values({
        id: personaId,
        fullName: args.displayName,
        university: "",
        studyProgram: "",
        expectedGraduation: "",
        location: "",
        bio: "",
        skills: [],
        careerInterests: [],
        fixtureDisclaimerRequired: false,
      })
      .onConflictDoNothing();
  } else if (args.role === "club") {
    await db
      .insert(clubs)
      .values({
        id: personaId,
        clubName: args.displayName,
        university: "",
        categories: [],
        mission: "",
        audienceReachLabel: "",
        eventFocus: [],
        sponsorshipNeeds: [],
        location: "",
        contactRole: "",
        fixtureDisclaimerRequired: false,
      })
      .onConflictDoNothing();
  } else {
    await db
      .insert(corporates)
      .values({
        id: personaId,
        organizationName: args.displayName,
        industry: "",
        location: "",
        description: "",
        talentNeeds: [],
        sponsorshipInterests: [],
        csrFocus: [],
        budgetRange: "Undisclosed",
        collaborationIntent: "hiring",
        fixtureDisclaimerRequired: false,
      })
      .onConflictDoNothing();
  }

  return personaId;
}

/**
 * Mark a user as fully onboarded. Idempotent.
 */
export async function markOnboarded(authUserId: string): Promise<void> {
  await db
    .update(users)
    .set({ onboardedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.authUserId, authUserId));
}

/**
 * Look up a persona row by id + role. Used by the new onboarding details
 * page. Returns the row or null.
 */
export async function getPersonaRowForUser(args: {
  role: PersonaRole;
  personaId: string;
}) {
  if (args.role === "student") {
    const [row] = await db
      .select()
      .from(students)
      .where(
        and(eq(students.id, args.personaId)),
      )
      .limit(1);
    return row ?? null;
  }
  if (args.role === "club") {
    const [row] = await db
      .select()
      .from(clubs)
      .where(and(eq(clubs.id, args.personaId)))
      .limit(1);
    return row ?? null;
  }
  const [row] = await db
    .select()
    .from(corporates)
    .where(and(eq(corporates.id, args.personaId)))
    .limit(1);
  return row ?? null;
}
