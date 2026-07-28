"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/lib/server/db";
import { events, eventRegistrations } from "@/lib/server/db/schema";
import { getCurrentPersona } from "@/lib/server/personas/current";
import { withRateLimit } from "@/lib/ratelimit";
import { slugify } from "@/lib/server/util/slugify";
import { eventComposer } from "@/lib/server/embeddings/composers";
import { attachEmbedding } from "@/lib/server/embeddings/persist";
import { dhakaLocalInputToUtc } from "@/lib/datetime/dhaka";

export type EventFormState =
  | { status: "idle" }
  | {
      status: "error";
      fieldErrors: Record<string, string>;
      formMessage: string;
    }
  | { status: "success"; message: string };

export type RegistrationFormState =
  | { status: "idle" }
  | { status: "error"; formMessage: string }
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

/**
 * Convert a `datetime-local` value (interpreted as Asia/Dhaka wall-clock
 * time) to a UTC `Date`. Implemented in `lib/datetime/dhaka.ts` and
 * imported here.
 */

const baseEventSchema = z.object({
  title: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(3, "Title must be at least 3 characters")),
  description: z.string(),
  startsAt: z
    .string()
    .refine((v) => dhakaLocalInputToUtc(v) !== null, {
      message: "Start date and time required",
    }),
  endsAt: z.string().optional().default(""),
  venue: z.string(),
  locationLabel: z.string(),
  isVirtual: z.any().transform((v) => v === "on" || v === "true"),
  registrationUrl: z.string(),
  capacity: z
    .any()
    .transform((v) => {
      if (v === null || v === undefined || v === "") return null;
      if (typeof v === "number") return Number.isFinite(v) ? v : null;
      if (typeof v === "string") {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      }
      return null;
    })
    .refine(
      (n) =>
        n === null ||
        (typeof n === "number" &&
          Number.isInteger(n) &&
          n >= 1 &&
          n <= 100000),
      { message: "Capacity must be between 1 and 100000" },
    ),
  tags: z.array(z.string()),
});

function isUrlOrEmail(input: string): boolean {
  if (!input) return true; // optional
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
  ignoreEventId?: string,
): Promise<string> {
  const base = slugify(title) || `event-${Date.now().toString(36)}`;
  const candidates = [base];
  for (let i = 2; i <= 50; i += 1) candidates.push(`${base}-${i}`);
  const rows = await db
    .select({ id: events.id, slug: events.slug })
    .from(events)
    .where(inArray(events.slug, candidates));
  const taken = new Set(
    rows.filter((r) => r.id !== ignoreEventId).map((r) => r.slug),
  );
  for (const c of candidates) {
    if (!taken.has(c)) return c;
  }
  return `${base}-${Date.now().toString(36)}`;
}

function ownerKindFromPersona(p: NonNullable<Awaited<ReturnType<typeof getCurrentPersona>>>): "club" | "corporate" | null {
  if (p.kind === "club") return "club";
  if (p.kind === "corporate") return "corporate";
  return null;
}

/**
 * Create an event owned by the current club/corporate persona.
 */
export async function createEvent(
  previousOrFormData: EventFormState | FormData,
  maybeFormData?: FormData,
): Promise<EventFormState> {
  const formData =
    previousOrFormData instanceof FormData
      ? previousOrFormData
      : maybeFormData;
  if (!formData) {
    return {
      status: "error",
      fieldErrors: {},
      formMessage: "Event form data is missing.",
    };
  }
  const current = await getCurrentPersona();
  const ownerKind = current ? ownerKindFromPersona(current) : null;
  if (!current || !ownerKind) {
    return {
      status: "error",
      fieldErrors: {},
      formMessage: "Only clubs and companies can create events.",
    };
  }

  const rl = await withRateLimit({
    identifier: `create-event:${current.row.id}`,
    limit: 10,
    window: "60 s",
    prefix: "storporate:rl:create-event",
  });
  if (rl.status === "limited") {
    return {
      status: "error",
      fieldErrors: {},
      formMessage: "You're creating events too quickly. Please slow down.",
    };
  }

  const parsed = baseEventSchema.safeParse({
    title: trim(formData.get("title")),
    description: trim(formData.get("description")),
    startsAt: String(formData.get("startsAt") ?? "").trim(),
    endsAt: String(formData.get("endsAt") ?? "").trim(),
    venue: trim(formData.get("venue")),
    locationLabel: trim(formData.get("locationLabel")),
    isVirtual: formData.get("isVirtual") === "on" || formData.get("isVirtual") === "true",
    registrationUrl: trim(formData.get("registrationUrl")),
    capacity: formData.get("capacity"),
    tags: getList(formData, "tags"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: projectZodErrors(parsed.error.issues),
      formMessage: "Please fix the highlighted fields.",
    };
  }

  if (!isUrlOrEmail(parsed.data.registrationUrl)) {
    return {
      status: "error",
      fieldErrors: {
        registrationUrl: "Use a full https URL or email address",
      },
      formMessage: "Please fix the highlighted fields.",
    };
  }

  const startsAtUtc = dhakaLocalInputToUtc(parsed.data.startsAt);
  if (!startsAtUtc) {
    return {
      status: "error",
      fieldErrors: { startsAt: "Start date and time required" },
      formMessage: "Please fix the highlighted fields.",
    };
  }
  const endsAtUtc = parsed.data.endsAt
    ? dhakaLocalInputToUtc(parsed.data.endsAt)
    : null;

  const slug = await ensureUniqueSlug(parsed.data.title);
  const ownerName =
    current.kind === "club"
      ? current.row.clubName
      : current.row.organizationName;
  const withEmb = await attachEmbedding(eventComposer)({
    title: parsed.data.title,
    description: parsed.data.description,
    ownerName,
    tags: parsed.data.tags,
    venue: parsed.data.venue,
    locationLabel: parsed.data.locationLabel,
  });

  const [created] = await db
    .insert(events)
    .values({
      ownerKind,
      ownerId: current.row.id,
      title: parsed.data.title,
      slug,
      description: parsed.data.description,
      startsAt: startsAtUtc,
      endsAt: endsAtUtc,
      venue: parsed.data.venue,
      locationLabel: parsed.data.locationLabel,
      isVirtual: parsed.data.isVirtual,
      registrationUrl: parsed.data.registrationUrl,
      capacity: parsed.data.capacity,
      tags: parsed.data.tags,
      embedding: withEmb.embedding,
      needsEmbedding: withEmb.needsEmbedding,
    })
    .returning({ id: events.id, slug: events.slug });

  revalidatePath("/", "layout");
  redirect(`/events/${created.slug}`);
}

/**
 * Update an existing event owned by the current persona. Used by the
 * manage page.
 */
export async function updateEvent(
  eventId: string,
  previousOrFormData: EventFormState | FormData,
  maybeFormData?: FormData,
): Promise<EventFormState> {
  const formData =
    previousOrFormData instanceof FormData
      ? previousOrFormData
      : maybeFormData;
  if (!formData) {
    return {
      status: "error",
      fieldErrors: {},
      formMessage: "Event form data is missing.",
    };
  }
  const current = await getCurrentPersona();
  const ownerKind = current ? ownerKindFromPersona(current) : null;
  if (!current || !ownerKind) {
    return {
      status: "error",
      fieldErrors: {},
      formMessage: "Only clubs and companies can edit events.",
    };
  }

  const rl = await withRateLimit({
    identifier: `update-event:${current.row.id}`,
    limit: 10,
    window: "60 s",
    prefix: "storporate:rl:update-event",
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
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  if (!existing || existing.ownerKind !== ownerKind || existing.ownerId !== current.row.id) {
    return {
      status: "error",
      fieldErrors: {},
      formMessage: "Event not found.",
    };
  }

  const parsed = baseEventSchema.safeParse({
    title: trim(formData.get("title")),
    description: trim(formData.get("description")),
    startsAt: String(formData.get("startsAt") ?? "").trim(),
    endsAt: String(formData.get("endsAt") ?? "").trim(),
    venue: trim(formData.get("venue")),
    locationLabel: trim(formData.get("locationLabel")),
    isVirtual: formData.get("isVirtual") === "on" || formData.get("isVirtual") === "true",
    registrationUrl: trim(formData.get("registrationUrl")),
    capacity: formData.get("capacity"),
    tags: getList(formData, "tags"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: projectZodErrors(parsed.error.issues),
      formMessage: "Please fix the highlighted fields.",
    };
  }
  if (!isUrlOrEmail(parsed.data.registrationUrl)) {
    return {
      status: "error",
      fieldErrors: {
        registrationUrl: "Use a full https URL or email address",
      },
      formMessage: "Please fix the highlighted fields.",
    };
  }
  const startsAtUtc = dhakaLocalInputToUtc(parsed.data.startsAt);
  if (!startsAtUtc) {
    return {
      status: "error",
      fieldErrors: { startsAt: "Start date and time required" },
      formMessage: "Please fix the highlighted fields.",
    };
  }
  const endsAtUtc = parsed.data.endsAt
    ? dhakaLocalInputToUtc(parsed.data.endsAt)
    : null;

  const slug =
    parsed.data.title !== existing.title
      ? await ensureUniqueSlug(parsed.data.title, existing.id)
      : existing.slug;

  const ownerName =
    current.kind === "club"
      ? current.row.clubName
      : current.row.organizationName;
  const withEmb = await attachEmbedding(eventComposer)({
    title: parsed.data.title,
    description: parsed.data.description,
    ownerName,
    tags: parsed.data.tags,
    venue: parsed.data.venue,
    locationLabel: parsed.data.locationLabel,
  });

  await db
    .update(events)
    .set({
      title: parsed.data.title,
      slug,
      description: parsed.data.description,
      startsAt: startsAtUtc,
      endsAt: endsAtUtc,
      venue: parsed.data.venue,
      locationLabel: parsed.data.locationLabel,
      isVirtual: parsed.data.isVirtual,
      registrationUrl: parsed.data.registrationUrl,
      capacity: parsed.data.capacity,
      tags: parsed.data.tags,
      embedding: withEmb.embedding,
      needsEmbedding: withEmb.needsEmbedding,
    })
    .where(eq(events.id, eventId));

  revalidatePath(`/events/${slug}`);
  revalidatePath(`/events/${slug}/manage`);
  revalidatePath("/", "layout");
  return { status: "success", message: "Event updated." };
}

/**
 * Hard delete an event and (via ON DELETE CASCADE) its registrations.
 * Owner-only.
 */
export async function deleteEvent(eventId: string): Promise<void> {
  const current = await getCurrentPersona();
  const ownerKind = current ? ownerKindFromPersona(current) : null;
  if (!current || !ownerKind) {
    throw new Error("Only clubs and companies can delete events.");
  }

  const rl = await withRateLimit({
    identifier: `delete-event:${current.row.id}`,
    limit: 10,
    window: "60 s",
    prefix: "storporate:rl:delete-event",
  });
  if (rl.status === "limited") {
    throw new Error("Too many attempts. Please slow down.");
  }

  const [existing] = await db
    .select({ id: events.id, slug: events.slug, ownerKind: events.ownerKind, ownerId: events.ownerId })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  if (!existing || existing.ownerKind !== ownerKind || existing.ownerId !== current.row.id) {
    throw new Error("Event not found.");
  }
  await db.delete(events).where(eq(events.id, eventId));
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/**
 * Mark an event "closed" by zeroing capacity — registrations are blocked.
 * Soft stop: keeps existing registrations visible.
 */
export async function closeEvent(eventId: string): Promise<void> {
  const current = await getCurrentPersona();
  const ownerKind = current ? ownerKindFromPersona(current) : null;
  if (!current || !ownerKind) {
    throw new Error("Only clubs and companies can close events.");
  }

  const rl = await withRateLimit({
    identifier: `close-event:${current.row.id}`,
    limit: 10,
    window: "60 s",
    prefix: "storporate:rl:close-event",
  });
  if (rl.status === "limited") {
    throw new Error("Too many attempts. Please slow down.");
  }

  const [existing] = await db
    .select({ id: events.id, slug: events.slug, ownerKind: events.ownerKind, ownerId: events.ownerId, capacity: events.capacity })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  if (!existing || existing.ownerKind !== ownerKind || existing.ownerId !== current.row.id) {
    throw new Error("Event not found.");
  }
  await db
    .update(events)
    .set({ capacity: 0 })
    .where(eq(events.id, eventId));
  revalidatePath(`/events/${existing.slug}`);
  revalidatePath(`/events/${existing.slug}/manage`);
  revalidatePath("/", "layout");
}

export async function reopenEvent(eventId: string): Promise<void> {
  const current = await getCurrentPersona();
  const ownerKind = current ? ownerKindFromPersona(current) : null;
  if (!current || !ownerKind) {
    throw new Error("Only clubs and companies can reopen events.");
  }

  const rl = await withRateLimit({
    identifier: `reopen-event:${current.row.id}`,
    limit: 10,
    window: "60 s",
    prefix: "storporate:rl:reopen-event",
  });
  if (rl.status === "limited") {
    throw new Error("Too many attempts. Please slow down.");
  }

  const [existing] = await db
    .select({ id: events.id, slug: events.slug, ownerKind: events.ownerKind, ownerId: events.ownerId })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  if (!existing || existing.ownerKind !== ownerKind || existing.ownerId !== current.row.id) {
    throw new Error("Event not found.");
  }
  // "Reopen" = remove the cap so it's effectively unlimited.
  await db
    .update(events)
    .set({ capacity: null })
    .where(eq(events.id, eventId));
  revalidatePath(`/events/${existing.slug}`);
  revalidatePath(`/events/${existing.slug}/manage`);
  revalidatePath("/", "layout");
}

const motivationSchema = z
  .string()
  .max(1000, "Keep motivation under 1000 characters")
  .optional();

/**
 * Register the current student for an event. Capacity is enforced inside
 * a transaction (row-level lock + count + insert/update).
 */
export async function registerForEvent(
  eventId: string,
  motivation?: string,
): Promise<RegistrationFormState> {
  const current = await getCurrentPersona();
  if (!current || current.kind !== "student") {
    return { status: "error", formMessage: "Only students can register for events." };
  }

  const rl = await withRateLimit({
    identifier: `register-for-event:${current.row.id}`,
    limit: 20,
    window: "60 s",
    prefix: "storporate:rl:register-for-event",
  });
  if (rl.status === "limited") {
    return {
      status: "error",
      formMessage: "You're registering too quickly. Please slow down.",
    };
  }

  const parsedMotivation = motivationSchema.safeParse(motivation ?? "");
  if (!parsedMotivation.success) {
    return {
      status: "error",
      formMessage:
        parsedMotivation.error.issues[0]?.message ?? "Invalid motivation",
    };
  }

  return await db.transaction(async (tx) => {
    const [eventRow] = await tx
      .select({
        id: events.id,
        slug: events.slug,
        capacity: events.capacity,
        startsAt: events.startsAt,
      })
      .from(events)
      .where(eq(events.id, eventId))
      .for("update")
      .limit(1);
    if (!eventRow) {
      return { status: "error", formMessage: "Event not found." } as const;
    }
    if (eventRow.startsAt.getTime() <= Date.now()) {
      return {
        status: "error",
        formMessage: "This event has already started or passed.",
      } as const;
    }

    if (eventRow.capacity !== null && eventRow.capacity <= 0) {
      return {
        status: "error",
        formMessage: "Registration for this event is closed.",
      } as const;
    }

    const [{ count }] = (await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(eventRegistrations)
      .where(eq(eventRegistrations.eventId, eventId))) as Array<{ count: number }>;

    if (eventRow.capacity !== null && count >= eventRow.capacity) {
      return {
        status: "error",
        formMessage: "This event is full.",
      } as const;
    }

    await tx
      .insert(eventRegistrations)
      .values({
        eventId,
        studentId: current.row.id,
        motivation: parsedMotivation.data ?? "",
      })
      .onConflictDoUpdate({
        target: [eventRegistrations.eventId, eventRegistrations.studentId],
        set: {
          motivation: parsedMotivation.data ?? "",
          registeredAt: new Date(),
        },
      });

    revalidatePath(`/events/${eventRow.slug}`);
    revalidatePath(`/events/${eventRow.slug}/manage`);
    revalidatePath("/", "layout");
    return {
      status: "success",
      message: "You're registered.",
    } as const;
  });
}

/**
 * Remove the current student's registration for an event. No-op if they
 * were never registered.
 */
export async function unregisterFromEvent(eventId: string): Promise<void> {
  const current = await getCurrentPersona();
  if (!current || current.kind !== "student") {
    throw new Error("Only students can manage their registrations.");
  }

  const rl = await withRateLimit({
    identifier: `unregister-event:${current.row.id}`,
    limit: 20,
    window: "60 s",
    prefix: "storporate:rl:unregister-event",
  });
  if (rl.status === "limited") {
    throw new Error("Too many attempts. Please slow down.");
  }

  const [eventRow] = await db
    .select({ slug: events.slug })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  await db
    .delete(eventRegistrations)
    .where(
      and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.studentId, current.row.id),
      ),
    );
  if (eventRow) {
    revalidatePath(`/events/${eventRow.slug}`);
    revalidatePath(`/events/${eventRow.slug}/manage`);
  }
  revalidatePath("/", "layout");
}
