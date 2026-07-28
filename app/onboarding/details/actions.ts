"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  getCurrentUser,
  markOnboarded,
} from "@/lib/server/auth/current-user";
import { db } from "@/lib/server/db";
import { students, clubs, corporates } from "@/lib/server/db/schema";
import {
  minimumRequiredStudentSchema,
  minimumRequiredClubSchema,
  minimumRequiredCorporateSchema,
  type StudentMinimumInput,
  type ClubMinimumInput,
  type CorporateMinimumInput,
} from "@/lib/server/auth/onboarding-min";

import type { PersonaRole } from "@/data/personas";

export type DetailsFormState =
  | { status: "idle" }
  | {
      status: "error";
      fieldErrors: Record<string, string>;
      formMessage: string;
    }
  | { status: "success"; message: string };

function trim(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}
function getList(fd: FormData, name: string): string[] {
  const committed = fd.getAll(`${name}[]`).map((v) => String(v));
  const draft = trim(fd.get(`${name}__draft`));
  const fragments = draft.length > 0 ? draft.split(/\s+/) : [];
  const out = [...committed];
  const seen = new Set(committed.map((c) => c.toLowerCase()));
  for (const f of fragments) {
    const k = f.toLowerCase();
    if (!seen.has(k)) {
      out.push(f);
      seen.add(k);
    }
  }
  return out;
}

function projectZodErrors(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  issues: any[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const path = Array.isArray(issue.path) && issue.path.length > 0
      ? String(issue.path[0])
      : "_form";
    if (!out[path]) out[path] = issue.message ?? "Invalid value";
  }
  return out;
}

/**
 * Save the minimum required fields for the chosen role. Marks the user
 * onboarded on success and redirects to /dashboard.
 */
export async function submitMinimumProfile(
  _prev: DetailsFormState,
  formData: FormData,
): Promise<DetailsFormState> {
  const current = await getCurrentUser();
  if (current.kind === "anonymous" || current.kind === "needs-role") {
    return {
      status: "error",
      fieldErrors: {},
      formMessage: "Session expired. Please pick your role again.",
    };
  }

  const role: PersonaRole = current.role;
  const personaId = current.personaId;

  if (role === "student") {
    const payload: StudentMinimumInput = {
      fullName: trim(formData.get("fullName")),
      university: trim(formData.get("university")),
      studyProgram: trim(formData.get("studyProgram")),
      expectedGraduation: trim(formData.get("expectedGraduation")),
      location: trim(formData.get("location")),
      skills: getList(formData, "skills"),
      careerInterests: getList(formData, "careerInterests"),
    };
    const parsed = minimumRequiredStudentSchema.safeParse(payload);
    if (!parsed.success) {
      return {
        status: "error",
        fieldErrors: projectZodErrors(parsed.error.issues),
        formMessage: "Please fix the highlighted fields.",
      };
    }
    await db
      .update(students)
      .set({
        fullName: parsed.data.fullName,
        university: parsed.data.university,
        studyProgram: parsed.data.studyProgram,
        expectedGraduation: parsed.data.expectedGraduation,
        location: parsed.data.location,
        skills: parsed.data.skills,
        careerInterests: parsed.data.careerInterests,
        // bio is optional in the minimal set; preserve the existing value.
        updatedAt: new Date(),
      })
      .where(eq(students.id, personaId));
  } else if (role === "club") {
    const payload: ClubMinimumInput = {
      clubName: trim(formData.get("clubName")),
      university: trim(formData.get("university")),
      categories: getList(formData, "categories"),
      audienceReachLabel: trim(formData.get("audienceReachLabel")),
      eventFocus: getList(formData, "eventFocus"),
      sponsorshipNeeds: getList(formData, "sponsorshipNeeds"),
      contactRole: trim(formData.get("contactRole")),
    };
    const parsed = minimumRequiredClubSchema.safeParse(payload);
    if (!parsed.success) {
      return {
        status: "error",
        fieldErrors: projectZodErrors(parsed.error.issues),
        formMessage: "Please fix the highlighted fields.",
      };
    }
    await db
      .update(clubs)
      .set({
        clubName: parsed.data.clubName,
        university: parsed.data.university,
        categories: parsed.data.categories,
        audienceReachLabel: parsed.data.audienceReachLabel,
        eventFocus: parsed.data.eventFocus,
        sponsorshipNeeds: parsed.data.sponsorshipNeeds,
        contactRole: parsed.data.contactRole,
        updatedAt: new Date(),
      })
      .where(eq(clubs.id, personaId));
  } else {
    const payload: CorporateMinimumInput = {
      organizationName: trim(formData.get("organizationName")),
      industry: trim(formData.get("industry")),
      location: trim(formData.get("location")),
      talentNeeds: getList(formData, "talentNeeds"),
      sponsorshipInterests: getList(formData, "sponsorshipInterests"),
      csrFocus: getList(formData, "csrFocus"),
      collaborationIntent: (trim(formData.get("collaborationIntent")) ||
        "hiring") as CorporateMinimumInput["collaborationIntent"],
    };
    const parsed = minimumRequiredCorporateSchema.safeParse(payload);
    if (!parsed.success) {
      return {
        status: "error",
        fieldErrors: projectZodErrors(parsed.error.issues),
        formMessage: "Please fix the highlighted fields.",
      };
    }
    await db
      .update(corporates)
      .set({
        organizationName: parsed.data.organizationName,
        industry: parsed.data.industry,
        location: parsed.data.location,
        talentNeeds: parsed.data.talentNeeds,
        sponsorshipInterests: parsed.data.sponsorshipInterests,
        csrFocus: parsed.data.csrFocus,
        collaborationIntent: parsed.data.collaborationIntent,
        updatedAt: new Date(),
      })
      .where(eq(corporates.id, personaId));
  }

  await markOnboarded(current.authUserId);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}