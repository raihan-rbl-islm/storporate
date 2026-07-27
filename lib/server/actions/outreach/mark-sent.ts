"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { db } from "@/lib/server/db";
import { corporates, outreachEvents } from "@/lib/server/db/schema";
import { getCurrentPersona } from "@/lib/server/personas/current";
import type { PersonaRole } from "@/data/personas";

export type MarkSentResult =
  | { status: "sent"; sentAtIso: string }
  | { status: "duplicate" }
  | { status: "error"; reason: string };

function isPersonaRole(value: string | undefined): value is PersonaRole {
  return value === "student" || value === "club" || value === "corporate";
}

type DraftKind = "student-application" | "club-sponsorship-pitch";

function expectedKindForRole(role: PersonaRole): DraftKind | null {
  if (role === "student") return "student-application";
  if (role === "club") return "club-sponsorship-pitch";
  return null;
}

/**
 * Records a local Demo "send" for the current persona's outreach draft to
 * the given corporate. This action does NOT call any email API, does NOT
 * open a `mailto:` link, and does NOT write to any external system — it
 * inserts a single row into `outreach_events` so the panel can rehydrate
 * a "sent (Demo simulation)" state on the next render.
 */
export async function markOutreachSent(
  formData: FormData,
): Promise<MarkSentResult> {
  const corporateId = formData.get("corporateId");
  if (typeof corporateId !== "string" || corporateId.length === 0) {
    return { status: "error", reason: "Missing target organization." };
  }
  const store = await cookies();
  const roleCookie = store.get("role")?.value;
  if (!isPersonaRole(roleCookie)) {
    return {
      status: "error",
      reason: "Pick a persona to record this Demo send.",
    };
  }
  const kind = expectedKindForRole(roleCookie);
  if (!kind) {
    return {
      status: "error",
      reason: "Corporate personas cannot send outreach drafts.",
    };
  }
  const current = await getCurrentPersona();
  if (!current) {
    return { status: "error", reason: "Session expired. Pick a persona again." };
  }
  if (current.kind !== roleCookie) {
    return { status: "error", reason: "Role mismatch. Refresh the page." };
  }

  const [corporate] = await db
    .select({ id: corporates.id })
    .from(corporates)
    .where(eq(corporates.id, corporateId))
    .limit(1);
  if (!corporate) {
    return { status: "error", reason: "That organization is no longer listed." };
  }

  // Pre-check duplicate to give a clean "duplicate" status without throwing.
  const [existing] = await db
    .select({ sentAt: outreachEvents.sentAt })
    .from(outreachEvents)
    .where(
      and(
        eq(outreachEvents.role, roleCookie),
        eq(outreachEvents.personaId, current.row.id),
        eq(outreachEvents.kind, kind),
        eq(outreachEvents.corporateId, corporateId),
      ),
    )
    .limit(1);
  if (existing) return { status: "duplicate" };

  try {
    const [inserted] = await db
      .insert(outreachEvents)
      .values({
        kind,
        role: roleCookie,
        personaId: current.row.id,
        corporateId,
      })
      .returning({ sentAt: outreachEvents.sentAt });
    revalidatePath(`/dashboard/matches/${corporateId}`);
    revalidatePath(`/dashboard/clubs/matches/${corporateId}`);
    return { status: "sent", sentAtIso: inserted.sentAt.toISOString() };
  } catch (err) {
    // Postgres unique-violation fallback: the pre-check above raced with a
    // concurrent insert. Treat it as a duplicate, not an error.
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("23505")) return { status: "duplicate" };
    console.error("[markOutreachSent] insert failed:", err);
    return {
      status: "error",
      reason: "Couldn't record the Demo send. Try again.",
    };
  }
}

/**
 * Removes all `outreach_events` rows belonging to the current persona.
 * Used by the panel's "Clear and start over" action and by the persona
 * reset flow. Returns the number of rows deleted so callers can log it
 * if they care; this is intentionally best-effort and silent on failure.
 */
export async function clearOutreachEventsForCurrentPersona(): Promise<{
  cleared: number;
}> {
  const current = await getCurrentPersona();
  if (!current) return { cleared: 0 };
  const deleted = await db
    .delete(outreachEvents)
    .where(eq(outreachEvents.personaId, current.row.id))
    .returning({ id: outreachEvents.id });
  return { cleared: deleted.length };
}