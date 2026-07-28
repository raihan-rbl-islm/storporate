"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/lib/server/db";
import { jobs, corporates } from "@/lib/server/db/schema";
import { getCurrentPersona } from "@/lib/server/personas/current";
import { withRateLimit } from "@/lib/ratelimit";
import { slugify } from "@/lib/server/util/slugify";
import { jobComposer } from "@/lib/server/embeddings/composers";
import { attachEmbedding } from "@/lib/server/embeddings/persist";

export type JobFormState =
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
    const path =
      Array.isArray(issue.path) && issue.path.length > 0
        ? String(issue.path[0])
        : "_form";
    if (!out[path]) out[path] = issue.message ?? "Invalid value";
  }
  return out;
}

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

const baseJobSchema = z.object({
  title: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(3, "Title must be at least 3 characters")),
  description: z.string(),
  employmentType: z.enum(
    ["internship", "full-time", "contract", "research"],
    {
      message: "Pick an employment type",
    },
  ),
  locationLabel: z.string(),
  isRemote: z.any().transform((v) => v === "on" || v === "true"),
  startsOn: z
    .string()
    .refine(
      (v) => v === "" || monthRegex.test(v),
      { message: "Use YYYY-MM format or leave empty" },
    ),
  endsOn: z
    .string()
    .refine(
      (v) => v === "" || monthRegex.test(v),
      { message: "Use YYYY-MM format or leave empty" },
    ),
  applyUrl: z.string(),
  applyEmail: z.string(),
  skills: z.array(z.string()),
});

function isUrlOrEmail(input: string): boolean {
  if (!input) return true;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) return true;
  try {
    const u = new URL(input);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

async function ensureUniqueSlug(
  title: string,
  ignoreJobId?: string,
): Promise<string> {
  const base = slugify(title) || `job-${Date.now().toString(36)}`;
  const candidates = [base];
  for (let i = 2; i <= 50; i += 1) candidates.push(`${base}-${i}`);
  const rows = await db
    .select({ id: jobs.id, slug: jobs.slug })
    .from(jobs)
    .where(inArray(jobs.slug, candidates));
  const taken = new Set(
    rows.filter((r) => r.id !== ignoreJobId).map((r) => r.slug),
  );
  for (const c of candidates) {
    if (!taken.has(c)) return c;
  }
  return `${base}-${Date.now().toString(36)}`;
}

async function embedForJob(
  row: {
    title: string;
    description: string;
    employmentType: string;
    skills: string[];
    locationLabel: string;
  },
  employerName: string,
) {
  // The `jobComposer` does not include owner-name; we want it in the
  // embed text so company context shows up in similarity search. We
  // concatenate it once and feed the assembled string through a tiny
  // inline composer-style wrapper, but to keep this self-contained we
  // just hand-roll it: build the string the way `jobComposer` would,
  // then prefix with the org name.
  const flat = [
    row.title,
    row.description,
    row.employmentType,
    ...row.skills,
    row.locationLabel,
    employerName ? `at ${employerName}` : "",
  ]
    .filter((p) => typeof p === "string" && p.length > 0)
    .join(". ");

  return attachEmbedding(() => flat)(row);
}

/**
 * Create a job owned by the current corporate persona.
 */
export async function createJob(
  previousOrFormData: JobFormState | FormData,
  maybeFormData?: FormData,
): Promise<JobFormState> {
  const formData =
    previousOrFormData instanceof FormData
      ? previousOrFormData
      : maybeFormData;
  if (!formData) {
    return {
      status: "error",
      fieldErrors: {},
      formMessage: "Job form data is missing.",
    };
  }
  const current = await getCurrentPersona();
  if (!current || current.kind !== "corporate") {
    return {
      status: "error",
      fieldErrors: {},
      formMessage: "Only companies can post jobs.",
    };
  }

  const rl = await withRateLimit({
    identifier: `create-job:${current.row.id}`,
    limit: 10,
    window: "60 s",
    prefix: "storporate:rl:create-job",
  });
  if (rl.status === "limited") {
    return {
      status: "error",
      fieldErrors: {},
      formMessage: "You're posting jobs too quickly. Please slow down.",
    };
  }

  const parsed = baseJobSchema.safeParse({
    title: trim(formData.get("title")),
    description: trim(formData.get("description")),
    employmentType: String(formData.get("employmentType") ?? "").trim(),
    locationLabel: trim(formData.get("locationLabel")),
    isRemote: formData.get("isRemote") === "on" || formData.get("isRemote") === "true",
    startsOn: String(formData.get("startsOn") ?? "").trim(),
    endsOn: String(formData.get("endsOn") ?? "").trim(),
    applyUrl: trim(formData.get("applyUrl")),
    applyEmail: trim(formData.get("applyEmail")),
    skills: getList(formData, "skills"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: projectZodErrors(parsed.error.issues),
      formMessage: "Please fix the highlighted fields.",
    };
  }

  if (!parsed.data.applyUrl && !parsed.data.applyEmail) {
    return {
      status: "error",
      fieldErrors: {
        applyUrl: "Add a URL or contact email",
      },
      formMessage: "Add a way for candidates to apply.",
    };
  }
  if (!isUrlOrEmail(parsed.data.applyUrl)) {
    return {
      status: "error",
      fieldErrors: { applyUrl: "Use a full https URL or email address" },
      formMessage: "Please fix the highlighted fields.",
    };
  }
  if (parsed.data.applyEmail && !isUrlOrEmail(parsed.data.applyEmail)) {
    return {
      status: "error",
      fieldErrors: { applyEmail: "Use a valid email address" },
      formMessage: "Please fix the highlighted fields.",
    };
  }

  const slug = await ensureUniqueSlug(parsed.data.title);

  const [corpRow] = await db
    .select({ organizationName: corporates.organizationName })
    .from(corporates)
    .where(eq(corporates.id, current.row.id))
    .limit(1);
  const employerName = corpRow?.organizationName ?? "";

  const withEmb = await embedForJob(
    {
      title: parsed.data.title,
      description: parsed.data.description,
      employmentType: parsed.data.employmentType,
      skills: parsed.data.skills,
      locationLabel: parsed.data.locationLabel,
    },
    employerName,
  );

  const [created] = await db
    .insert(jobs)
    .values({
      corporateId: current.row.id,
      title: parsed.data.title,
      slug,
      description: parsed.data.description,
      employmentType: parsed.data.employmentType,
      locationLabel: parsed.data.locationLabel,
      isRemote: parsed.data.isRemote,
      startsOn: parsed.data.startsOn,
      endsOn: parsed.data.endsOn,
      applyUrl: parsed.data.applyUrl,
      applyEmail: parsed.data.applyEmail,
      skills: parsed.data.skills,
      embedding: withEmb.embedding,
      needsEmbedding: withEmb.needsEmbedding,
      isOpen: true,
    })
    .returning({ id: jobs.id, slug: jobs.slug });

  revalidatePath("/", "layout");
  redirect(`/opportunities/${created.slug}`);
}

export async function updateJob(
  jobId: string,
  previousOrFormData: JobFormState | FormData,
  maybeFormData?: FormData,
): Promise<JobFormState> {
  const formData =
    previousOrFormData instanceof FormData
      ? previousOrFormData
      : maybeFormData;
  if (!formData) {
    return {
      status: "error",
      fieldErrors: {},
      formMessage: "Job form data is missing.",
    };
  }
  const current = await getCurrentPersona();
  if (!current || current.kind !== "corporate") {
    return {
      status: "error",
      fieldErrors: {},
      formMessage: "Only companies can edit jobs.",
    };
  }

  const rl = await withRateLimit({
    identifier: `update-job:${current.row.id}`,
    limit: 10,
    window: "60 s",
    prefix: "storporate:rl:update-job",
  });
  if (rl.status === "limited") {
    return {
      status: "error",
      fieldErrors: {},
      formMessage: "Too many edits. Please slow down.",
    };
  }

  const [existing] = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1);
  if (!existing || existing.corporateId !== current.row.id) {
    return {
      status: "error",
      fieldErrors: {},
      formMessage: "Job not found.",
    };
  }

  const parsed = baseJobSchema.safeParse({
    title: trim(formData.get("title")),
    description: trim(formData.get("description")),
    employmentType: String(formData.get("employmentType") ?? "").trim(),
    locationLabel: trim(formData.get("locationLabel")),
    isRemote: formData.get("isRemote") === "on" || formData.get("isRemote") === "true",
    startsOn: String(formData.get("startsOn") ?? "").trim(),
    endsOn: String(formData.get("endsOn") ?? "").trim(),
    applyUrl: trim(formData.get("applyUrl")),
    applyEmail: trim(formData.get("applyEmail")),
    skills: getList(formData, "skills"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: projectZodErrors(parsed.error.issues),
      formMessage: "Please fix the highlighted fields.",
    };
  }
  if (!parsed.data.applyUrl && !parsed.data.applyEmail) {
    return {
      status: "error",
      fieldErrors: { applyUrl: "Add a URL or contact email" },
      formMessage: "Add a way for candidates to apply.",
    };
  }
  if (!isUrlOrEmail(parsed.data.applyUrl)) {
    return {
      status: "error",
      fieldErrors: { applyUrl: "Use a full https URL or email address" },
      formMessage: "Please fix the highlighted fields.",
    };
  }
  if (parsed.data.applyEmail && !isUrlOrEmail(parsed.data.applyEmail)) {
    return {
      status: "error",
      fieldErrors: { applyEmail: "Use a valid email address" },
      formMessage: "Please fix the highlighted fields.",
    };
  }

  const slug =
    parsed.data.title !== existing.title
      ? await ensureUniqueSlug(parsed.data.title, existing.id)
      : existing.slug;

  const [corpRow] = await db
    .select({ organizationName: corporates.organizationName })
    .from(corporates)
    .where(eq(corporates.id, current.row.id))
    .limit(1);
  const employerName = corpRow?.organizationName ?? "";

  const withEmb = await embedForJob(
    {
      title: parsed.data.title,
      description: parsed.data.description,
      employmentType: parsed.data.employmentType,
      skills: parsed.data.skills,
      locationLabel: parsed.data.locationLabel,
    },
    employerName,
  );

  await db
    .update(jobs)
    .set({
      title: parsed.data.title,
      slug,
      description: parsed.data.description,
      employmentType: parsed.data.employmentType,
      locationLabel: parsed.data.locationLabel,
      isRemote: parsed.data.isRemote,
      startsOn: parsed.data.startsOn,
      endsOn: parsed.data.endsOn,
      applyUrl: parsed.data.applyUrl,
      applyEmail: parsed.data.applyEmail,
      skills: parsed.data.skills,
      embedding: withEmb.embedding,
      needsEmbedding: withEmb.needsEmbedding,
    })
    .where(eq(jobs.id, jobId));

  revalidatePath(`/opportunities/${slug}`);
  revalidatePath(`/opportunities/${slug}/manage`);
  revalidatePath(`/opportunities/${slug}/candidates`);
  revalidatePath("/", "layout");
  return { status: "success", message: "Job updated." };
}

export async function deleteJob(jobId: string): Promise<void> {
  const current = await getCurrentPersona();
  if (!current || current.kind !== "corporate") {
    throw new Error("Only companies can delete jobs.");
  }

  const rl = await withRateLimit({
    identifier: `delete-job:${current.row.id}`,
    limit: 10,
    window: "60 s",
    prefix: "storporate:rl:delete-job",
  });
  if (rl.status === "limited") {
    throw new Error("Too many attempts. Please slow down.");
  }

  const [existing] = await db
    .select({
      id: jobs.id,
      slug: jobs.slug,
      corporateId: jobs.corporateId,
    })
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1);
  if (!existing || existing.corporateId !== current.row.id) {
    throw new Error("Job not found.");
  }
  await db.delete(jobs).where(eq(jobs.id, jobId));
  revalidatePath("/", "layout");
  redirect("/dashboard/corporate/dashboard");
}

export async function closeJob(jobId: string): Promise<void> {
  const current = await getCurrentPersona();
  if (!current || current.kind !== "corporate") {
    throw new Error("Only companies can close jobs.");
  }

  const rl = await withRateLimit({
    identifier: `close-job:${current.row.id}`,
    limit: 10,
    window: "60 s",
    prefix: "storporate:rl:close-job",
  });
  if (rl.status === "limited") {
    throw new Error("Too many attempts. Please slow down.");
  }

  const [existing] = await db
    .select({ id: jobs.id, slug: jobs.slug, corporateId: jobs.corporateId })
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1);
  if (!existing || existing.corporateId !== current.row.id) {
    throw new Error("Job not found.");
  }
  await db.update(jobs).set({ isOpen: false }).where(eq(jobs.id, jobId));
  revalidatePath(`/opportunities/${existing.slug}`);
  revalidatePath(`/opportunities/${existing.slug}/manage`);
  revalidatePath(`/opportunities/${existing.slug}/candidates`);
  revalidatePath("/", "layout");
}

export async function reopenJob(jobId: string): Promise<void> {
  const current = await getCurrentPersona();
  if (!current || current.kind !== "corporate") {
    throw new Error("Only companies can reopen jobs.");
  }

  const rl = await withRateLimit({
    identifier: `reopen-job:${current.row.id}`,
    limit: 10,
    window: "60 s",
    prefix: "storporate:rl:reopen-job",
  });
  if (rl.status === "limited") {
    throw new Error("Too many attempts. Please slow down.");
  }

  const [existing] = await db
    .select({ id: jobs.id, slug: jobs.slug, corporateId: jobs.corporateId })
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1);
  if (!existing || existing.corporateId !== current.row.id) {
    throw new Error("Job not found.");
  }
  await db.update(jobs).set({ isOpen: true }).where(eq(jobs.id, jobId));
  revalidatePath(`/opportunities/${existing.slug}`);
  revalidatePath(`/opportunities/${existing.slug}/manage`);
  revalidatePath(`/opportunities/${existing.slug}/candidates`);
  revalidatePath("/", "layout");
}

// Mark `jobComposer` as used. The live composer still feeds a few of our
// fallback paths during cold-start; the import above is wired in for
// future expansion (e.g. a `withOwnerName` wrapper that mirrors
// `eventComposer`).
void jobComposer;