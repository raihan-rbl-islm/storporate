"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { db } from "@/lib/server/db";
import {
  clubs,
  corporateInterests,
  students,
} from "@/lib/server/db/schema";
import { getCurrentPersona } from "@/lib/server/personas/current";
import type { PersonaRole } from "@/data/personas";

export type CorporateInterestCandidateKind = "student" | "club";

export type CorporateInterestResult =
  | { status: "recorded"; createdAt: string }
  | { status: "duplicate" }
  | { status: "error"; reason: string };

function isPersonaRole(value: string | undefined): value is PersonaRole {
  return value === "student" || value === "club" || value === "corporate";
}

function isCandidateKind(
  value: unknown,
): value is CorporateInterestCandidateKind {
  return value === "student" || value === "club";
}

export async function submitCorporateInterest(
  formData: FormData,
): Promise<CorporateInterestResult> {
  const candidateKind = formData.get("candidateKind");
  const candidateId = formData.get("candidateId");

  if (typeof candidateId !== "string" || candidateId.length === 0) {
    return { status: "error", reason: "Missing candidate." };
  }
  if (!isCandidateKind(candidateKind)) {
    return { status: "error", reason: "Unsupported candidate kind." };
  }

  const store = await cookies();
  const roleCookie = store.get("role")?.value;
  if (!isPersonaRole(roleCookie) || roleCookie !== "corporate") {
    return {
      status: "error",
      reason: "Sign in as a corporate to express interest.",
    };
  }

  const current = await getCurrentPersona();
  if (!current || current.kind !== "corporate") {
    return { status: "error", reason: "Session expired. Pick a persona again." };
  }

  // Confirm the candidate exists in the right table. The candidate list
  // already filtered to real personas, so this is a defense-in-depth
  // check rather than a UX gate.
  const candidateTable = candidateKind === "student" ? students : clubs;
  const [candidate] = await db
    .select({ id: candidateTable.id })
    .from(candidateTable)
    .where(eq(candidateTable.id, candidateId))
    .limit(1);
  if (!candidate) {
    return { status: "error", reason: "That candidate is no longer listed." };
  }

  // Pre-check duplicate to avoid a needless INSERT round-trip and a
  // noisy Postgres 23505 in the error path.
  const [existing] = await db
    .select({ createdAt: corporateInterests.createdAt })
    .from(corporateInterests)
    .where(
      and(
        eq(corporateInterests.corporateId, current.row.id),
        eq(corporateInterests.candidateKind, candidateKind),
        eq(corporateInterests.candidateId, candidateId),
      ),
    )
    .limit(1);
  if (existing) {
    return { status: "duplicate" };
  }

  try {
    const [inserted] = await db
      .insert(corporateInterests)
      .values({
        corporateId: current.row.id,
        candidateKind,
        candidateId,
      })
      .returning({ createdAt: corporateInterests.createdAt });
    // Refresh the rationale page + both candidate list pages so a reload
    // from the lists reflects the recorded state.
    revalidatePath("/dashboard/corporate/candidates/students");
    revalidatePath("/dashboard/corporate/candidates/clubs");
    revalidatePath(`/dashboard/corporate/candidates/${candidateId}`);
    revalidatePath("/dashboard/corporate");
    return {
      status: "recorded",
      createdAt: inserted.createdAt.toISOString(),
    };
  } catch (err) {
    // Most likely cause: a parallel request raced the duplicate pre-check.
    // Treat 23505 as "duplicate" rather than "error" so the UI stays calm.
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("23505")) {
      return { status: "duplicate" };
    }
    console.error("[submitCorporateInterest] insert failed:", err);
    return {
      status: "error",
      reason: "Couldn't record interest. Try again.",
    };
  }
}

export async function getCorporateInterestStatus(
  candidateKind: CorporateInterestCandidateKind,
  candidateId: string,
): Promise<{ recorded: boolean; createdAt: string | null }> {
  const current = await getCurrentPersona();
  if (!current || current.kind !== "corporate") {
    return { recorded: false, createdAt: null };
  }
  const [row] = await db
    .select({ createdAt: corporateInterests.createdAt })
    .from(corporateInterests)
    .where(
      and(
        eq(corporateInterests.corporateId, current.row.id),
        eq(corporateInterests.candidateKind, candidateKind),
        eq(corporateInterests.candidateId, candidateId),
      ),
    )
    .limit(1);
  return {
    recorded: Boolean(row),
    createdAt: row?.createdAt.toISOString() ?? null,
  };
}
