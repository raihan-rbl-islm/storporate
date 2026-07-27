"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/lib/server/db";
import { corporates } from "@/lib/server/db/schema";
import { scoreMatchBreakdown } from "@/lib/server/matching/student-matches";
import { getCurrentPersona } from "@/lib/server/personas/current";
import {
  buildStudentApplicationDraft,
  type StudentApplicationDraft,
} from "@/lib/server/outreach/student-application-template";
import type { PersonaRole } from "@/data/personas";

export type StudentApplicationDraftResult =
  | { status: "ok"; draft: StudentApplicationDraft }
  | { status: "error"; reason: string };

function isPersonaRole(value: string | undefined): value is PersonaRole {
  return value === "student" || value === "club" || value === "corporate";
}

export async function generateStudentApplicationDraft(
  formData: FormData,
): Promise<StudentApplicationDraftResult> {
  const corporateId = formData.get("corporateId");
  if (typeof corporateId !== "string" || corporateId.length === 0) {
    return { status: "error", reason: "Missing target organization." };
  }
  const store = await cookies();
  const roleCookie = store.get("role")?.value;
  if (!isPersonaRole(roleCookie) || roleCookie !== "student") {
    return { status: "error", reason: "Sign in as a student to generate a draft." };
  }
  const current = await getCurrentPersona();
  if (!current || current.kind !== "student") {
    return { status: "error", reason: "Session expired. Pick a persona again." };
  }
  const [corporate] = await db
    .select()
    .from(corporates)
    .where(eq(corporates.id, corporateId))
    .limit(1);
  if (!corporate) {
    return { status: "error", reason: "That organization is no longer listed." };
  }

  // Use the existing scorer breakdown as the only source of matched
  // signals. The action only formats the display strings; it does not
  // re-run or approximate the matching logic.
  const breakdown = scoreMatchBreakdown(current.row, corporate);
  const reasons = [
    ...breakdown.matchedSkills.map((s) => `Matches your skills: ${s}`),
    ...breakdown.matchedInterests.map((i) => `Aligns with your interest in ${i}`),
  ].slice(0, 3);

  const draft = buildStudentApplicationDraft({
    student: {
      fullName: current.row.fullName,
      university: current.row.university,
      studyProgram: current.row.studyProgram,
    },
    corporate: {
      organizationName: corporate.organizationName,
      industry: corporate.industry,
    },
    reasons,
  });

  return { status: "ok", draft };
}
