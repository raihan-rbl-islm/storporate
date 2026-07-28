"use server";

import { redirect } from "next/navigation";

import { bindRoleToPersona, getCurrentUser } from "@/lib/server/auth/current-user";
import { withRateLimit } from "@/lib/ratelimit";
import type { PersonaRole } from "@/data/personas";

const VALID_ROLES = ["student", "club", "corporate"] as const;
function isPersonaRole(v: string): v is PersonaRole {
  return (VALID_ROLES as readonly string[]).includes(v);
}

/**
 * Persist the user's role selection and create the matching persona row.
 * Idempotent — re-clicking the same role is a no-op.
 *
 * Rate-limited per IP so an authenticated user can't spam the DB with
 * persona rows. Limit: 10 req / 10 s matches the rest of the app.
 */
export async function selectRole(formData: FormData): Promise<void> {
  const raw = formData.get("role");
  if (typeof raw !== "string" || !isPersonaRole(raw)) {
    throw new Error("Invalid role selection");
  }

  const rl = await withRateLimit({
    identifier: "role-pick",
    limit: 10,
    window: "10 s",
    prefix: "storporate:rl:role-pick",
  });
  if (rl.status === "limited") {
    throw new Error("Too many attempts. Please wait a moment.");
  }

  const current = await getCurrentUser();
  if (current.kind === "anonymous" || current.kind === "ready") {
    redirect("/signin");
  }

  await bindRoleToPersona({
    authUserId: current.authUserId,
    role: raw,
    displayName: current.displayName,
  });

  redirect("/onboarding/details");
}