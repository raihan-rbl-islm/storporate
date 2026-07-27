"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/lib/server/db";
import { corporates } from "@/lib/server/db/schema";
import { scoreClubMatchBreakdown } from "@/lib/server/matching/club-matches";
import { getCurrentPersona } from "@/lib/server/personas/current";
import {
  buildClubSponsorshipPitchDraft,
  type ClubSponsorshipPitchDraft,
} from "@/lib/server/outreach/club-sponsorship-pitch-template";
import type { PersonaRole } from "@/data/personas";

export type ClubSponsorshipPitchDraftResult =
  | { status: "ok"; draft: ClubSponsorshipPitchDraft }
  | { status: "error"; reason: string };

function isPersonaRole(value: string | undefined): value is PersonaRole {
  return value === "student" || value === "club" || value === "corporate";
}

export async function generateClubSponsorshipPitch(
  formData: FormData,
): Promise<ClubSponsorshipPitchDraftResult> {
  const corporateId = formData.get("corporateId");
  if (typeof corporateId !== "string" || corporateId.length === 0) {
    return { status: "error", reason: "Missing target organization." };
  }
  const store = await cookies();
  const roleCookie = store.get("role")?.value;
  if (!isPersonaRole(roleCookie) || roleCookie !== "club") {
    return { status: "error", reason: "Sign in as a club to generate a draft." };
  }
  const current = await getCurrentPersona();
  if (!current || current.kind !== "club") {
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

  // Use the existing scorer breakdown as the only source of matched
  // signals. The action only formats the display strings; it does not
  // re-run or approximate the matching logic.
  const breakdown = scoreClubMatchBreakdown(current.row, corporate);
  const reasons = [
    ...breakdown.matchedCategories.map((c) => `Matches your category: ${c}`),
    ...breakdown.matchedMissionTokens.map((t) => `Aligns with your mission: ${t}`),
  ].slice(0, 3);

  const draft = buildClubSponsorshipPitchDraft({
    club: {
      clubName: current.row.clubName,
      university: current.row.university,
      categories: current.row.categories,
      sponsorshipNeeds: current.row.sponsorshipNeeds,
    },
    corporate: {
      organizationName: corporate.organizationName,
      industry: corporate.industry,
    },
    reasons,
  });

  return { status: "ok", draft };
}