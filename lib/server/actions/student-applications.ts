"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { db } from "@/lib/server/db";
import { corporates, studentApplications } from "@/lib/server/db/schema";
import { getCurrentPersona } from "@/lib/server/personas/current";
import type { PersonaRole } from "@/data/personas";

export type ApplyResult =
  | { status: "applied"; createdAt: string }
  | { status: "duplicate" }
  | { status: "error"; reason: string };

function isPersonaRole(value: string | undefined): value is PersonaRole {
  return value === "student" || value === "club" || value === "corporate";
}

export async function submitStudentApply(formData: FormData): Promise<ApplyResult> {
  const corporateId = formData.get("corporateId");
  if (typeof corporateId !== "string" || corporateId.length === 0) {
    return { status: "error", reason: "Missing target organization." };
  }

  const store = await cookies();
  const roleCookie = store.get("role")?.value;
  if (!isPersonaRole(roleCookie) || roleCookie !== "student") {
    return { status: "error", reason: "Sign in as a student to apply." };
  }

  const current = await getCurrentPersona();
  if (!current || current.kind !== "student") {
    return { status: "error", reason: "Session expired. Pick a persona again." };
  }

  // Confirm the corporate exists. The match list already filtered to
  // real corporates, so this is a defense-in-depth check, not a UX gate.
  const [corporate] = await db
    .select({ id: corporates.id })
    .from(corporates)
    .where(eq(corporates.id, corporateId))
    .limit(1);
  if (!corporate) {
    return { status: "error", reason: "That organization is no longer listed." };
  }

  // Pre-check duplicate to avoid a needless INSERT round-trip and a
  // noisy Postgres 23505 in the error path.
  const [existing] = await db
    .select({ createdAt: studentApplications.createdAt })
    .from(studentApplications)
    .where(
      and(
        eq(studentApplications.studentId, current.row.id),
        eq(studentApplications.corporateId, corporateId),
      ),
    )
    .limit(1);
  if (existing) {
    return { status: "duplicate" };
  }

  try {
    const [inserted] = await db
      .insert(studentApplications)
      .values({ studentId: current.row.id, corporateId })
      .returning({ createdAt: studentApplications.createdAt });
    revalidatePath(`/dashboard/matches/${corporateId}`);
    revalidatePath("/dashboard/student");
    return { status: "applied", createdAt: inserted.createdAt.toISOString() };
  } catch (err) {
    // Most likely cause: a parallel request raced the duplicate pre-check.
    // Treat 23505 as "duplicate" rather than "error" so the UI stays calm.
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("23505")) {
      return { status: "duplicate" };
    }
    console.error("[submitStudentApply] insert failed:", err);
    return { status: "error", reason: "Couldn't apply. Try again." };
  }
}

export async function getStudentApplicationStatus(
  corporateId: string,
): Promise<{ applied: boolean; createdAt: string | null }> {
  const current = await getCurrentPersona();
  if (!current || current.kind !== "student") {
    return { applied: false, createdAt: null };
  }
  const [row] = await db
    .select({ createdAt: studentApplications.createdAt })
    .from(studentApplications)
    .where(
      and(
        eq(studentApplications.studentId, current.row.id),
        eq(studentApplications.corporateId, corporateId),
      ),
    )
    .limit(1);
  return { applied: Boolean(row), createdAt: row?.createdAt.toISOString() ?? null };
}