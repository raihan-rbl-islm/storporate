"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const VALID_ROLES = ["student", "club", "corporate"] as const;
type Role = (typeof VALID_ROLES)[number];

const FALLBACK_BY_ROLE: Record<Role, string> = {
  student: "tasnim",
  club: "nsu-robotics",
  corporate: "bkash",
};

export async function setRole(formData: FormData) {
  const role = formData.get("role");
  if (typeof role !== "string") return;
  if (!(VALID_ROLES as readonly string[]).includes(role)) return;
  const typedRole = role as Role;
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
  store.set("personaId", FALLBACK_BY_ROLE[typedRole], {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  revalidatePath("/", "layout");
}
