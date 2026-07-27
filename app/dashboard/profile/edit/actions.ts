"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/server/db";
import { students, clubs, corporates } from "@/lib/server/db/schema";
import { getCurrentPersona } from "@/lib/server/personas/current";
import {
  matchRelevantSchemaForRole,
  type StudentMatchRelevantInput,
  type ClubMatchRelevantInput,
  type CorporateMatchRelevantInput,
} from "@/lib/server/personas/schemas";
import type { FormState } from "@/components/onboarding/onboarding-form";

function getString(fd: FormData, name: string): string {
  const v = fd.get(name);
  return typeof v === "string" ? v : "";
}

function getList(fd: FormData, name: string): string[] {
  const committed = fd.getAll(`${name}[]`).map((v) => String(v));
  const draft = getString(fd, `${name}__draft`).trim();
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
    const path =
      Array.isArray(issue.path) && issue.path.length > 0
        ? String(issue.path[0])
        : "_form";
    if (!out[path]) out[path] = issue.message ?? "Invalid value";
  }
  return out;
}

export async function updateProfile(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const current = await getCurrentPersona();
  if (!current) {
    return {
      status: "error",
      formMessage: "Session expired. Please pick a persona again.",
      errors: {},
    };
  }
  if (current.kind === "student") {
    const payload: StudentMatchRelevantInput = {
      location: getString(formData, "location"),
      skills: getList(formData, "skills"),
      careerInterests: getList(formData, "careerInterests"),
    };
    const parsed = matchRelevantSchemaForRole("student").safeParse(payload);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return {
        status: "error",
        formMessage: first?.message
          ? `${first.message} (${first.path.join(".")})`
          : "Please fix the highlighted fields.",
        errors: projectZodErrors(parsed.error.issues),
      };
    }
    await db
      .update(students)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(students.id, current.row.id));
    revalidatePath("/", "layout");
    return {
      status: "success",
      message:
        "Match-relevant details saved. Future match results may be refreshed.",
    };
  }
  if (current.kind === "club") {
    const payload: ClubMatchRelevantInput = {
      categories: getList(formData, "categories"),
      eventFocus: getList(formData, "eventFocus"),
      sponsorshipNeeds: getList(formData, "sponsorshipNeeds"),
      location: getString(formData, "location"),
    };
    const parsed = matchRelevantSchemaForRole("club").safeParse(payload);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return {
        status: "error",
        formMessage: first?.message
          ? `${first.message} (${first.path.join(".")})`
          : "Please fix the highlighted fields.",
        errors: projectZodErrors(parsed.error.issues),
      };
    }
    await db
      .update(clubs)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(clubs.id, current.row.id));
    revalidatePath("/", "layout");
    return {
      status: "success",
      message:
        "Match-relevant details saved. Future match results may be refreshed.",
    };
  }
  const payload: CorporateMatchRelevantInput = {
    location: getString(formData, "location"),
    talentNeeds: getList(formData, "talentNeeds"),
    sponsorshipInterests: getList(formData, "sponsorshipInterests"),
    csrFocus: getList(formData, "csrFocus"),
    budgetRange: getString(formData, "budgetRange"),
    collaborationIntent:
      (getString(formData, "collaborationIntent") as
        | "hiring"
        | "sponsorship"
        | "both") || "hiring",
  };
  const parsed = matchRelevantSchemaForRole("corporate").safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      status: "error",
      formMessage: first?.message
        ? `${first.message} (${first.path.join(".")})`
        : "Please fix the highlighted fields.",
      errors: projectZodErrors(parsed.error.issues),
    };
  }
  await db
    .update(corporates)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(corporates.id, current.row.id));
  revalidatePath("/", "layout");
  return {
    status: "success",
    message:
      "Match-relevant details saved. Future match results may be refreshed.",
  };
}