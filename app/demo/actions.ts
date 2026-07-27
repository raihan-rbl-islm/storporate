"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAllHeroPersonas } from "@/lib/server/personas/lookup";

export async function selectPersona(formData: FormData) {
  const id = formData.get("personaId");
  if (typeof id !== "string") redirect("/demo?error=unknown_persona");
  const heroes = await getAllHeroPersonas();
  const persona = heroes.find((p) => p.id === id);
  if (!persona) redirect("/demo?error=unknown_persona");
  const store = await cookies();
  // httpOnly: true — the dashboard layout reads the cookie server-side;
  // JS never needs document.cookie access and exposing it would invite
  // tampering once Phase 4 surfaces dashboards.
  // sameSite: lax + Next.js built-in Server Actions CSRF (Origin header
  // check) is the cross-site defense layer.
  store.set("role", persona.role, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  store.set("personaId", persona.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/dashboard");
}