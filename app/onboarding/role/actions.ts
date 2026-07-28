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
 * Sanitize a name string for storage. Trims, collapses whitespace,
 * strips control chars, caps length at 80. Returns "" if the result
 * would be empty so the caller can fall back to a default.
 */
function sanitizeName(input: string): string {
  return input
    .normalize("NFC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

/**
 * Best-effort fallback name derived from the email local-part. Used only
 * when the user submitted the form with the name field empty. We never
 * persist the raw email local-part because it usually looks like a
 * handle, not a name ("jane_doe99", "raihan.rbl.islm").
 */
function emailLocalPartToName(email: string | null): string {
  if (!email) return "";
  const local = email.split("@")[0] ?? "";
  if (!local) return "";
  return local
    .replace(/[._+\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((part) =>
      part.length === 0
        ? ""
        : (part[0]?.toUpperCase() ?? "") + part.slice(1).toLowerCase(),
    )
    .join(" ")
    .slice(0, 80);
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

  const nameRaw = formData.get("displayName");
  const nameFromForm =
    typeof nameRaw === "string" ? sanitizeName(nameRaw) : "";

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

  // Priority: explicit user input → sanitized email hint → generic.
  // Never persist the raw email local-part.
  const displayName =
    nameFromForm ||
    emailLocalPartToName(current.email) ||
    "Storporate member";

  await bindRoleToPersona({
    authUserId: current.authUserId,
    role: raw,
    displayName,
  });

  redirect("/onboarding/details");
}