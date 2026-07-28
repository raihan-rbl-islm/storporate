"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/server/db";
import {
  students,
  clubs,
  corporates,
  studentExperiences,
  studentAchievements,
  studentActivities,
} from "@/lib/server/db/schema";
import { getCurrentPersona } from "@/lib/server/personas/current";
import {
  matchRelevantSchemaForRole,
  type StudentMatchRelevantInput,
  type ClubMatchRelevantInput,
  type CorporateMatchRelevantInput,
} from "@/lib/server/personas/schemas";
import type { FormState } from "@/components/onboarding/onboarding-form";
// NOTE: do NOT re-export `FormState` from a "use server" module.
// Turbopack's "use server" boundary treats every `export` (including
// `export type`) as a runtime export, and the resulting module fails
// to compile when the re-exported type can't be resolved at runtime.
// Client form components must import `FormState` from
// `@/components/onboarding/onboarding-form` directly.

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

// ---------------------------------------------------------------------------
// Phase 8.2: student sub-resource server actions.
//
// All seven create/update/delete actions plus `reorderExperience` below
// follow the same pattern:
//   1. Resolve the current persona; require `kind === "student"`.
//   2. Validate the FormData with a Zod schema scoped to the resource.
//   3. Insert / update / delete against the relevant table.
//   4. revalidatePath the edit page so the listing rerenders.
//
// Actions return the shared `FormState` (error/success). Delete and
// reorder intentionally return `void` — they are non-form actions invoked
// from button onClick handlers, not `useActionState`.
// ---------------------------------------------------------------------------

async function requireStudentId(): Promise<
  { ok: true; studentId: string } | { ok: false; state: FormState }
> {
  const current = await getCurrentPersona();
  if (!current) {
    return {
      ok: false,
      state: {
        status: "error",
        errors: {},
        formMessage: "Session expired. Please pick a persona again.",
      },
    };
  }
  if (current.kind !== "student") {
    return {
      ok: false,
      state: {
        status: "error",
        errors: {},
        formMessage: "Only students can manage experience entries.",
      },
    };
  }
  return { ok: true, studentId: current.row.id };
}

function revalidateEdit(): void {
  revalidatePath("/dashboard/profile/edit");
  // Also revalidate the dashboard so the completeness meter updates.
  revalidatePath("/dashboard/student");
}

const experienceSchema = z.object({
  kind: z.enum(["work", "research", "volunteer", "project"]),
  title: z.string().transform((s) => s.trim()).pipe(z.string().min(1, "Required")),
  organization: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, "Required")),
  location: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
});

const achievementSchema = z.object({
  kind: z.enum(["award", "publication", "talk", "certification", "competition"]),
  title: z.string().transform((s) => s.trim()).pipe(z.string().min(1, "Required")),
  issuer: z.string(),
  date: z.string(),
  url: z.string(),
  description: z.string(),
});

const activitySchema = z.object({
  kind: z.enum(["club", "society", "mentorship", "volunteering", "other"]),
  role: z.string().transform((s) => s.trim()).pipe(z.string().min(1, "Required")),
  organization: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, "Required")),
  startDate: z.string(),
  endDate: z.string(),
});

// ---- Experiences ----

export async function createExperience(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const guard = await requireStudentId();
  if (!guard.ok) return guard.state;

  const tags = getList(formData, "tags");
  const parsed = experienceSchema.safeParse({
    kind: getString(formData, "kind"),
    title: getString(formData, "title"),
    organization: getString(formData, "organization"),
    location: getString(formData, "location"),
    startDate: getString(formData, "start_date"),
    endDate: getString(formData, "end_date"),
    description: getString(formData, "description"),
    tags,
  });
  if (!parsed.success) {
    return {
      status: "error",
      errors: projectZodErrors(parsed.error.issues),
      formMessage: "Please fix the highlighted fields.",
    };
  }

  // Append at the end — sort_order defaults to 0, but we want a stable
  // monotonic ordering so newly-added rows land at the bottom. Read the
  // current max sortOrder for this student.
  const existing = await db
    .select({ sortOrder: studentExperiences.sortOrder })
    .from(studentExperiences)
    .where(eq(studentExperiences.studentId, guard.studentId));
  const nextSort = existing.length > 0
    ? Math.max(...existing.map((r) => r.sortOrder)) + 1
    : 0;

  await db.insert(studentExperiences).values({
    studentId: guard.studentId,
    kind: parsed.data.kind,
    title: parsed.data.title,
    organization: parsed.data.organization,
    location: parsed.data.location,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
    description: parsed.data.description,
    tags: parsed.data.tags,
    sortOrder: nextSort,
  });
  revalidateEdit();
  return { status: "success", message: "Experience added." };
}

export async function updateExperience(
  id: string,
  formData: FormData,
): Promise<FormState> {
  const guard = await requireStudentId();
  if (!guard.ok) return guard.state;

  const tags = getList(formData, "tags");
  const parsed = experienceSchema.safeParse({
    kind: getString(formData, "kind"),
    title: getString(formData, "title"),
    organization: getString(formData, "organization"),
    location: getString(formData, "location"),
    startDate: getString(formData, "start_date"),
    endDate: getString(formData, "end_date"),
    description: getString(formData, "description"),
    tags,
  });
  if (!parsed.success) {
    return {
      status: "error",
      errors: projectZodErrors(parsed.error.issues),
      formMessage: "Please fix the highlighted fields.",
    };
  }

  await db
    .update(studentExperiences)
    .set({
      kind: parsed.data.kind,
      title: parsed.data.title,
      organization: parsed.data.organization,
      location: parsed.data.location,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      description: parsed.data.description,
      tags: parsed.data.tags,
    })
    .where(
      and(
        eq(studentExperiences.id, id),
        eq(studentExperiences.studentId, guard.studentId),
      ),
    );
  revalidateEdit();
  return { status: "success", message: "Experience updated." };
}

export async function deleteExperience(id: string): Promise<void> {
  const guard = await requireStudentId();
  if (!guard.ok) return;
  await db
    .delete(studentExperiences)
    .where(
      and(
        eq(studentExperiences.id, id),
        eq(studentExperiences.studentId, guard.studentId),
      ),
    );
  revalidateEdit();
}

export async function reorderExperience(orderedIds: string[]): Promise<void> {
  const guard = await requireStudentId();
  if (!guard.ok) return;
  // Use a transaction-style sequential update so every row ends up with a
  // sortOrder equal to its position in the array. Drizzle doesn't expose
  // `UPDATE ... FROM (VALUES ...)` here, so we run them one-by-one — fine
  // for the small N we expect (a handful of experiences per student).
  await Promise.all(
    orderedIds.map((id, idx) =>
      db
        .update(studentExperiences)
        .set({ sortOrder: idx })
        .where(
          and(
            eq(studentExperiences.id, id),
            eq(studentExperiences.studentId, guard.studentId),
          ),
        ),
    ),
  );
  revalidateEdit();
}

// ---- Achievements ----

export async function createAchievement(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const guard = await requireStudentId();
  if (!guard.ok) return guard.state;

  const parsed = achievementSchema.safeParse({
    kind: getString(formData, "kind"),
    title: getString(formData, "title"),
    issuer: getString(formData, "issuer"),
    date: getString(formData, "date"),
    url: getString(formData, "url"),
    description: getString(formData, "description"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      errors: projectZodErrors(parsed.error.issues),
      formMessage: "Please fix the highlighted fields.",
    };
  }

  const existing = await db
    .select({ sortOrder: studentAchievements.sortOrder })
    .from(studentAchievements)
    .where(eq(studentAchievements.studentId, guard.studentId));
  const nextSort = existing.length > 0
    ? Math.max(...existing.map((r) => r.sortOrder)) + 1
    : 0;

  await db.insert(studentAchievements).values({
    studentId: guard.studentId,
    kind: parsed.data.kind,
    title: parsed.data.title,
    issuer: parsed.data.issuer,
    date: parsed.data.date,
    url: parsed.data.url,
    description: parsed.data.description,
    sortOrder: nextSort,
  });
  revalidateEdit();
  return { status: "success", message: "Achievement added." };
}

export async function updateAchievement(
  id: string,
  formData: FormData,
): Promise<FormState> {
  const guard = await requireStudentId();
  if (!guard.ok) return guard.state;

  const parsed = achievementSchema.safeParse({
    kind: getString(formData, "kind"),
    title: getString(formData, "title"),
    issuer: getString(formData, "issuer"),
    date: getString(formData, "date"),
    url: getString(formData, "url"),
    description: getString(formData, "description"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      errors: projectZodErrors(parsed.error.issues),
      formMessage: "Please fix the highlighted fields.",
    };
  }

  await db
    .update(studentAchievements)
    .set({
      kind: parsed.data.kind,
      title: parsed.data.title,
      issuer: parsed.data.issuer,
      date: parsed.data.date,
      url: parsed.data.url,
      description: parsed.data.description,
    })
    .where(
      and(
        eq(studentAchievements.id, id),
        eq(studentAchievements.studentId, guard.studentId),
      ),
    );
  revalidateEdit();
  return { status: "success", message: "Achievement updated." };
}

export async function deleteAchievement(id: string): Promise<void> {
  const guard = await requireStudentId();
  if (!guard.ok) return;
  await db
    .delete(studentAchievements)
    .where(
      and(
        eq(studentAchievements.id, id),
        eq(studentAchievements.studentId, guard.studentId),
      ),
    );
  revalidateEdit();
}

// ---- Activities ----

export async function createActivity(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const guard = await requireStudentId();
  if (!guard.ok) return guard.state;

  const parsed = activitySchema.safeParse({
    kind: getString(formData, "kind"),
    role: getString(formData, "role"),
    organization: getString(formData, "organization"),
    startDate: getString(formData, "start_date"),
    endDate: getString(formData, "end_date"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      errors: projectZodErrors(parsed.error.issues),
      formMessage: "Please fix the highlighted fields.",
    };
  }

  const existing = await db
    .select({ sortOrder: studentActivities.sortOrder })
    .from(studentActivities)
    .where(eq(studentActivities.studentId, guard.studentId));
  const nextSort = existing.length > 0
    ? Math.max(...existing.map((r) => r.sortOrder)) + 1
    : 0;

  await db.insert(studentActivities).values({
    studentId: guard.studentId,
    kind: parsed.data.kind,
    role: parsed.data.role,
    organization: parsed.data.organization,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
    sortOrder: nextSort,
  });
  revalidateEdit();
  return { status: "success", message: "Activity added." };
}

export async function updateActivity(
  id: string,
  formData: FormData,
): Promise<FormState> {
  const guard = await requireStudentId();
  if (!guard.ok) return guard.state;

  const parsed = activitySchema.safeParse({
    kind: getString(formData, "kind"),
    role: getString(formData, "role"),
    organization: getString(formData, "organization"),
    startDate: getString(formData, "start_date"),
    endDate: getString(formData, "end_date"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      errors: projectZodErrors(parsed.error.issues),
      formMessage: "Please fix the highlighted fields.",
    };
  }

  await db
    .update(studentActivities)
    .set({
      kind: parsed.data.kind,
      role: parsed.data.role,
      organization: parsed.data.organization,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
    })
    .where(
      and(
        eq(studentActivities.id, id),
        eq(studentActivities.studentId, guard.studentId),
      ),
    );
  revalidateEdit();
  return { status: "success", message: "Activity updated." };
}

export async function deleteActivity(id: string): Promise<void> {
  const guard = await requireStudentId();
  if (!guard.ok) return;
  await db
    .delete(studentActivities)
    .where(
      and(
        eq(studentActivities.id, id),
        eq(studentActivities.studentId, guard.studentId),
      ),
    );
  revalidateEdit();
}