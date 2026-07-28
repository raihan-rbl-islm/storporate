"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/lib/server/db";
import { posts } from "@/lib/server/db/schema";
import { getCurrentPersona } from "@/lib/server/personas/current";
import { withRateLimit } from "@/lib/ratelimit";
import { slugify } from "@/lib/server/util/slugify";
import { postComposer } from "@/lib/server/embeddings/composers";
import { attachEmbedding } from "@/lib/server/embeddings/persist";

export type PostFormState =
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

const basePostSchema = z.object({
  kind: z.enum(["journal", "news"], {
    message: "Choose journal or news",
  }),
  title: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(3, "Title must be at least 3 characters")),
  body: z.string(),
  tags: z.array(z.string()),
});

function ownerKindFromPersona(
  p: NonNullable<Awaited<ReturnType<typeof getCurrentPersona>>>,
): "club" | "corporate" | null {
  if (p.kind === "club") return "club";
  if (p.kind === "corporate") return "corporate";
  return null;
}

async function ensureUniqueSlug(
  title: string,
  ignorePostId?: string,
): Promise<string> {
  const base = slugify(title) || `post-${Date.now().toString(36)}`;
  const candidates = [base];
  for (let i = 2; i <= 50; i += 1) candidates.push(`${base}-${i}`);
  const rows = await db
    .select({ id: posts.id, slug: posts.slug })
    .from(posts)
    .where(inArray(posts.slug, candidates));
  const taken = new Set(
    rows.filter((r) => r.id !== ignorePostId).map((r) => r.slug),
  );
  for (const c of candidates) {
    if (!taken.has(c)) return c;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/**
 * Create a journal/news post owned by the current club/corporate persona.
 */
export async function createPost(
  previousOrFormData: PostFormState | FormData,
  maybeFormData?: FormData,
): Promise<PostFormState> {
  const formData =
    previousOrFormData instanceof FormData
      ? previousOrFormData
      : maybeFormData;
  if (!formData) {
    return {
      status: "error",
      fieldErrors: {},
      formMessage: "Post form data is missing.",
    };
  }
  const current = await getCurrentPersona();
  const ownerKind = current ? ownerKindFromPersona(current) : null;
  if (!current || !ownerKind) {
    return {
      status: "error",
      fieldErrors: {},
      formMessage: "Only clubs and companies can publish posts.",
    };
  }

  const rl = await withRateLimit({
    identifier: `create-post:${current.row.id}`,
    limit: 10,
    window: "60 s",
    prefix: "storporate:rl:create-post",
  });
  if (rl.status === "limited") {
    return {
      status: "error",
      fieldErrors: {},
      formMessage: "You're publishing too quickly. Please slow down.",
    };
  }

  const parsed = basePostSchema.safeParse({
    kind: String(formData.get("kind") ?? "").trim(),
    title: trim(formData.get("title")),
    body: trim(formData.get("body")),
    tags: getList(formData, "tags"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: projectZodErrors(parsed.error.issues),
      formMessage: "Please fix the highlighted fields.",
    };
  }

  const slug = await ensureUniqueSlug(parsed.data.title);
  const ownerName =
    current.kind === "club"
      ? current.row.clubName
      : current.kind === "corporate"
        ? current.row.organizationName
        : "";
  const withEmb = await attachEmbedding(postComposer)({
    title: parsed.data.title,
    body: parsed.data.body,
    kind: parsed.data.kind,
    tags: parsed.data.tags,
    ownerName,
  });

  const [created] = await db
    .insert(posts)
    .values({
      ownerKind,
      ownerId: current.row.id,
      kind: parsed.data.kind,
      title: parsed.data.title,
      slug,
      body: parsed.data.body,
      tags: parsed.data.tags,
      embedding: withEmb.embedding,
      needsEmbedding: withEmb.needsEmbedding,
    })
    .returning({ id: posts.id, slug: posts.slug });

  revalidatePath("/", "layout");
  revalidatePath("/newsfeed");
  redirect(`/posts/${created.slug}`);
}

/**
 * Update an existing post owned by the current persona.
 */
export async function updatePost(
  postId: string,
  previousOrFormData: PostFormState | FormData,
  maybeFormData?: FormData,
): Promise<PostFormState> {
  const formData =
    previousOrFormData instanceof FormData
      ? previousOrFormData
      : maybeFormData;
  if (!formData) {
    return {
      status: "error",
      fieldErrors: {},
      formMessage: "Post form data is missing.",
    };
  }
  const current = await getCurrentPersona();
  const ownerKind = current ? ownerKindFromPersona(current) : null;
  if (!current || !ownerKind) {
    return {
      status: "error",
      fieldErrors: {},
      formMessage: "Only clubs and companies can edit posts.",
    };
  }

  const rl = await withRateLimit({
    identifier: `update-post:${current.row.id}`,
    limit: 10,
    window: "60 s",
    prefix: "storporate:rl:update-post",
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
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);
  if (!existing || existing.ownerKind !== ownerKind || existing.ownerId !== current.row.id) {
    return {
      status: "error",
      fieldErrors: {},
      formMessage: "Post not found.",
    };
  }

  const parsed = basePostSchema.safeParse({
    kind: String(formData.get("kind") ?? "").trim(),
    title: trim(formData.get("title")),
    body: trim(formData.get("body")),
    tags: getList(formData, "tags"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: projectZodErrors(parsed.error.issues),
      formMessage: "Please fix the highlighted fields.",
    };
  }

  const slug =
    parsed.data.title !== existing.title
      ? await ensureUniqueSlug(parsed.data.title, existing.id)
      : existing.slug;

  const ownerName =
    current.kind === "club"
      ? current.row.clubName
      : current.kind === "corporate"
        ? current.row.organizationName
        : "";
  const withEmb = await attachEmbedding(postComposer)({
    title: parsed.data.title,
    body: parsed.data.body,
    kind: parsed.data.kind,
    tags: parsed.data.tags,
    ownerName,
  });

  await db
    .update(posts)
    .set({
      kind: parsed.data.kind,
      title: parsed.data.title,
      slug,
      body: parsed.data.body,
      tags: parsed.data.tags,
      embedding: withEmb.embedding,
      needsEmbedding: withEmb.needsEmbedding,
    })
    .where(eq(posts.id, postId));

  revalidatePath(`/posts/${slug}`);
  revalidatePath(`/posts/${slug}/manage`);
  revalidatePath("/", "layout");
  revalidatePath("/newsfeed");
  return { status: "success", message: "Post updated." };
}

/**
 * Hard delete a post. Owner-only.
 */
export async function deletePost(postId: string): Promise<void> {
  const current = await getCurrentPersona();
  const ownerKind = current ? ownerKindFromPersona(current) : null;
  if (!current || !ownerKind) {
    throw new Error("Only clubs and companies can delete posts.");
  }

  const rl = await withRateLimit({
    identifier: `delete-post:${current.row.id}`,
    limit: 10,
    window: "60 s",
    prefix: "storporate:rl:delete-post",
  });
  if (rl.status === "limited") {
    throw new Error("Too many attempts. Please slow down.");
  }

  const [existing] = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      ownerKind: posts.ownerKind,
      ownerId: posts.ownerId,
    })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);
  if (!existing || existing.ownerKind !== ownerKind || existing.ownerId !== current.row.id) {
    throw new Error("Post not found.");
  }
  await db.delete(posts).where(eq(posts.id, postId));
  revalidatePath("/", "layout");
  revalidatePath("/newsfeed");
  redirect("/dashboard");
}