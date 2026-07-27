export interface ClubSponsorshipPitchInput {
  club: {
    clubName: string;
    university: string;
    categories: readonly string[];
    sponsorshipNeeds: readonly string[];
  };
  corporate: {
    organizationName: string;
    industry: string;
  };
  /**
   * Reasons produced from scoreClubMatchBreakdown — no local rematching.
   * The template is a pure renderer of these reasons; it never derives
   * matched signals on its own.
   */
  reasons: readonly string[];
}

export interface ClubSponsorshipPitchDraft {
  subject: string;
  greeting: string;
  body: string;
  closing: string;
  fullText: string;
  generatedAtIso: string;
  kind: "club-sponsorship-pitch";
}

/**
 * Deterministic Club→Corporate pitch builder. No network calls, no LLM, no
 * invented facts. Interpolates only fields present on the input. The
 * `needs` line is empty when the club has no `sponsorshipNeeds` field —
 * we never invent.
 *
 * Per this plan's explicit constraint: NO invented attendance, reach,
 * budget, confirmed benefits, or prior partnerships. The template never
 * references these.
 */
export function buildClubSponsorshipPitchDraft(
  input: ClubSponsorshipPitchInput,
): ClubSponsorshipPitchDraft {
  const org = input.corporate.organizationName;
  const categories = input.club.categories.slice(0, 3);

  const subject = `Sponsorship inquiry — ${input.club.clubName} (${input.club.university})`;
  const greeting = `Dear ${org} partnerships team,`;

  const intro = `I am writing on behalf of ${input.club.clubName}, a ${categories.length > 0 ? categories.join(", ") : "student-led"} club at ${input.club.university}. We are exploring sponsors whose priorities align with our community, and ${org}'s work stood out.`;
  const alignment =
    input.reasons.length > 0
      ? `A few points that connect us to ${org}: ${input.reasons.slice(0, 2).join("; ")}.`
      : `We see a natural fit with ${org}'s work in ${input.corporate.industry} and would value the chance to discuss it further.`;
  const needs =
    input.club.sponsorshipNeeds.length > 0
      ? `Specific support we are exploring: ${input.club.sponsorshipNeeds.slice(0, 3).join("; ")}.`
      : "";
  const nextStep = `Would a 20-minute introduction call in the next two weeks be feasible? I can share more about our upcoming events and where ${org}'s support would have the most impact.`;
  const sign = `Best regards,\n${input.club.clubName}`;

  const body = [intro, alignment, needs, nextStep]
    .filter((p) => p.length > 0)
    .join("\n\n");

  return {
    subject,
    greeting,
    body,
    closing: sign,
    fullText: `${subject}\n\n${greeting}\n\n${body}\n\n${sign}`,
    generatedAtIso: new Date().toISOString(),
    kind: "club-sponsorship-pitch",
  };
}