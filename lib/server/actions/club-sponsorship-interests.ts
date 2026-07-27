"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { db } from "@/lib/server/db";
import { corporates, clubSponsorshipInterests } from "@/lib/server/db/schema";
import { getCurrentPersona } from "@/lib/server/personas/current";
import type { PersonaRole } from "@/data/personas";

export type SponsorshipInterestResult =
  | { status: "recorded"; createdAt: string }
  | { status: "duplicate" }
  | { status: "error"; reason: string };

function isPersonaRole(value: string | undefined): value is PersonaRole {
  return value === "student" || value === "club" || value === "corporate";
}

export async function submitClubSponsorshipInterest(formData: FormData): Promise<SponsorshipInterestResult> {
  const corporateId = formData.get("corporateId");
  if (typeof corporateId !== "string" || corporateId.length === 0) {
    return { status: "error", reason: "Missing target organization." };
  }

  const store = await cookies();
  const roleCookie = store.get("role")?.value;
  if (!isPersonaRole(roleCookie) || roleCookie !== "club") {
    return { status: "error", reason: "Sign in as a club to express interest." };
  }

  const current = await getCurrentPersona();
  if (!current || current.kind !== "club") {
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
    .select({ createdAt: clubSponsorshipInterests.createdAt })
    .from(clubSponsorshipInterests)
    .where(
      and(
        eq(clubSponsorshipInterests.clubId, current.row.id),
        eq(clubSponsorshipInterests.corporateId, corporateId),
      ),
    )
    .limit(1);
  if (existing) {
    return { status: "duplicate" };
  }

  try {
    const [inserted] = await db
      .insert(clubSponsorshipInterests)
      .values({ clubId: current.row.id, corporateId })
      .returning({ createdAt: clubSponsorshipInterests.createdAt });
    revalidatePath(`/dashboard/clubs/matches/${corporateId}`);
    revalidatePath("/dashboard/clubs/dashboard");
    return { status: "recorded", createdAt: inserted.createdAt.toISOString() };
  } catch (err) {
    // Most likely cause: a parallel request raced the duplicate pre-check.
    // Treat 23505 as "duplicate" rather than "error" so the UI stays calm.
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("23505")) {
      return { status: "duplicate" };
    }
    console.error("[submitClubSponsorshipInterest] insert failed:", err);
    return { status: "error", reason: "Couldn't record interest. Try again." };
  }
}

export async function getClubSponsorshipInterestStatus(
  corporateId: string,
): Promise<{ recorded: boolean; createdAt: string | null }> {
  const current = await getCurrentPersona();
  if (!current || current.kind !== "club") {
    return { recorded: false, createdAt: null };
  }
  const [row] = await db
    .select({ createdAt: clubSponsorshipInterests.createdAt })
    .from(clubSponsorshipInterests)
    .where(
      and(
        eq(clubSponsorshipInterests.clubId, current.row.id),
        eq(clubSponsorshipInterests.corporateId, corporateId),
      ),
    )
    .limit(1);
  return { recorded: Boolean(row), createdAt: row?.createdAt.toISOString() ?? null };
}