"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  getDefaultPersonaForRole,
} from "@/lib/server/personas/lookup";
import { resetPersonaToFixture } from "@/lib/server/personas/reset";
import type { PersonaRole } from "@/data/personas";

const VALID_ROLES = ["student", "club", "corporate"] as const;

function isPersonaRole(value: string | undefined): value is PersonaRole {
  return (
    typeof value === "string" &&
    (VALID_ROLES as readonly string[]).includes(value)
  );
}

export async function setRole(formData: FormData) {
  const role = formData.get("role");
  if (typeof role !== "string") return;
  if (!isPersonaRole(role)) return;
  const typedRole = role;

  // Read OLD cookies BEFORE we overwrite them — `resetPersonaToFixture`
  // targets the persona the user is LEAVING, not the new one.
  const store = await cookies();
  const oldRole = store.get("role")?.value;
  const oldPersonaId = store.get("personaId")?.value;

  // httpOnly: true + sameSite=lax. CSRF defense is Next.js's built-in
  // Server Action Origin check — do not bypass by removing sameSite=lax.
  store.set("role", typedRole, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  // personaId re-picks a default persona of the new role.
  const defaultPersona = await getDefaultPersonaForRole(typedRole);
  if (defaultPersona) {
    store.set("personaId", defaultPersona.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  // Reset the OLD persona row to its fixture defaults. Wrap in try/catch
  // because a DB hiccup must not block the role switch — the user is already
  // committed to the new role; resetting the old row is a nice-to-have.
  if (oldRole && oldPersonaId && isPersonaRole(oldRole)) {
    try {
      await resetPersonaToFixture(oldRole, oldPersonaId);
    } catch (err) {
      console.error("[setRole] resetPersonaToFixture failed:", err);
    }
  }

  revalidatePath("/", "layout");
}