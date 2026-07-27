"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  getDefaultPersonaForRole,
} from "@/lib/server/personas/lookup";
import type { PersonaRole } from "@/data/personas";

const VALID_ROLES = ["student", "club", "corporate"] as const;
type Role = (typeof VALID_ROLES)[number];

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
  const store = await cookies();
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
  revalidatePath("/", "layout");
}
