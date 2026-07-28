"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/lib/server/db";
import { corporates } from "@/lib/server/db/schema";
import { scoreMatchBreakdown } from "@/lib/server/matching/student-matches";
import { getCurrentPersona } from "@/lib/server/personas/current";
import { getCorporateFixtures } from "@/lib/server/personas/lookup";
import {
  buildStudentApplicationDraft,
  type StudentApplicationDraft,
} from "@/lib/server/outreach/student-application-template";
import { buildPreparedStudentApplication } from "@/lib/server/outreach/prepared-template";
import type { PersonaRole } from "@/data/personas";

export type StudentApplicationDraftResult =
  | { status: "ok"; draft: StudentApplicationDraft }
  | {
      status: "partial";
      draft: {
        subject: string;
        body: string;
        closing: string;
        fullText: string;
        generatedAtIso: string;
        kind: "student-application-prepared";
      };
    }
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
  const corporateFixture = getCorporateFixtures().find(
    (item) => item.id === corporate.id,
  ) ?? (corporate as unknown as import("@/data/personas").CorporateFixture);

  // Use the existing scorer breakdown as the only source of matched
  // signals. The action only formats the display strings; it does not
  // re-run or approximate the matching logic.
  const breakdown = scoreMatchBreakdown(current.row, corporateFixture);
  const reasons = [
    ...breakdown.matchedSkills.map((s) => `Matches your skills: ${s}`),
    ...breakdown.matchedInterests.map((i) => `Aligns with your interest in ${i}`),
  ].slice(0, 3);

  try {
    const draft = buildStudentApplicationDraft({
      student: {
        fullName: current.row.fullName,
        university: current.row.university,
        studyProgram: current.row.studyProgram,
      },
      corporate: {
        organizationName: corporateFixture.organizationName,
        industry: corporateFixture.industry,
      },
      reasons,
    });
    return { status: "ok", draft };
  } catch (err) {
    // Personalized builder threw — fall back to the prepared template. Log
    // server-side for observability; do not surface the error text to the
    // user (the prepared template is the honest UX).
    console.error(
      "[generateStudentApplicationDraft] personalized builder threw:",
      err,
    );
    try {
      const fallback = buildPreparedStudentApplication({
        corporate: { organizationName: corporateFixture.organizationName },
        student: {
          fullName: current.row.fullName,
          university: current.row.university,
        },
      });
      return {
        status: "partial",
        draft: {
          ...fallback,
          generatedAtIso: new Date().toISOString(),
          kind: "student-application-prepared",
        },
      };
    } catch (fallbackErr) {
      console.error(
        "[generateStudentApplicationDraft] prepared builder threw:",
        fallbackErr,
      );
      return {
        status: "error",
        reason: "Draft generation is unavailable right now. Please try again.",
      };
    }
  }
}
