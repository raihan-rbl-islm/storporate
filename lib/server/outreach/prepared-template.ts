/**
 * "Prepared template" builders for the personalized outreach actions.
 *
 * These are intentionally simpler than the personalized templates
 * (student-application-template / club-sponsorship-pitch-template) so the
 * fallback is unambiguously "no personalization". They are used by the
 * Server Actions only when the personalized builder throws — at which
 * point the user is told (via the panel banner) that the prepared
 * template is a starting point, not a finished personalized draft.
 *
 * The prepared templates intentionally avoid:
 *   - matched-skill language
 *   - mission-token callouts
 *   - category alignment claims
 *
 * because those facts were unavailable (that's what triggered the
 * fallback). The body is honest about being an "inquiry" rather than a
 * "tailored application".
 */

export interface PreparedStudentApplication {
  subject: string;
  greeting: string;
  body: string;
  closing: string;
  fullText: string;
}

export interface PreparedStudentInput {
  corporate: { organizationName: string };
  student: { fullName: string; university: string };
}

export function buildPreparedStudentApplication(
  input: PreparedStudentInput,
): PreparedStudentApplication {
  const org = input.corporate.organizationName;
  const subject = `Inquiry about opportunities at ${org}`;
  const greeting = `Dear ${org} team,`;
  const body = `My name is ${input.student.fullName}, and I am a student at ${input.student.university}. I am writing to inquire about opportunities at ${org}. I would welcome the chance to learn more about how I might contribute to your team.`;
  const closing = `Best regards,\n${input.student.fullName}`;
  return {
    subject,
    greeting,
    body,
    closing,
    fullText: `${subject}\n\n${greeting}\n\n${body}\n\n${closing}`,
  };
}

export interface PreparedClubSponsorshipPitch {
  subject: string;
  greeting: string;
  body: string;
  closing: string;
  fullText: string;
}

export interface PreparedClubInput {
  corporate: { organizationName: string };
  club: { clubName: string; university: string };
}

export function buildPreparedClubSponsorshipPitch(
  input: PreparedClubInput,
): PreparedClubSponsorshipPitch {
  const org = input.corporate.organizationName;
  const subject = `Sponsorship inquiry from ${input.club.clubName}`;
  const greeting = `Dear ${org} partnerships team,`;
  const body = `I am writing on behalf of ${input.club.clubName}, a student-led organization at ${input.club.university}. We are exploring sponsors whose priorities align with our community, and ${org}'s work stood out. Would a brief introduction call in the next two weeks be feasible?`;
  const closing = `Best regards,\n${input.club.clubName}`;
  return {
    subject,
    greeting,
    body,
    closing,
    fullText: `${subject}\n\n${greeting}\n\n${body}\n\n${closing}`,
  };
}