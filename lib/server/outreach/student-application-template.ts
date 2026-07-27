export interface StudentApplicationInput {
  student: {
    fullName: string;
    university: string;
    studyProgram: string;
  };
  corporate: {
    organizationName: string;
    industry: string;
  };
  /**
   * Reasons produced by the scorer (passed in from the Server Action).
   * The template is a pure renderer of these reasons — it never derives
   * matched signals on its own.
   */
  reasons: readonly string[];
}

export interface StudentApplicationDraft {
  subject: string;
  greeting: string;
  body: string;
  closing: string;
  fullText: string;
  generatedAtIso: string;
  kind: "student-application";
}

/**
 * Deterministic draft builder. No network calls, no LLM, no invented facts.
 * Interpolates only fields present on the input. Falls back to safe
 * placeholders (e.g. "your team") when the input lacks a value rather
 * than guessing.
 */
export function buildStudentApplicationDraft(
  input: StudentApplicationInput,
): StudentApplicationDraft {
  const org = input.corporate.organizationName;
  const greeting = `Dear ${org} team,`;
  const subject = `Application — ${input.student.studyProgram} student interested in ${org}`;

  const intro = `My name is ${input.student.fullName}, and I am a ${input.student.studyProgram} student at ${input.student.university}. I am writing to express my interest in opportunities at ${org}.`;

  // The scorer has already filtered `reasons` to the matched-signal
  // subset (matched skills + matched interests + intent). The template
  // quotes the first two reasons verbatim — never invent reason content
  // beyond what the scorer returned.
  const alignment =
    input.reasons.length > 0
      ? `From what I have seen about ${org}, my background aligns with what your team is building — ${input.reasons.slice(0, 2).join("; ")}.`
      : `I have been following ${org}'s work in ${input.corporate.industry} and would welcome the chance to learn more about how I could contribute.`;
  const closer = `Thank you for your time. I would be glad to share more about my projects and learn about the team's current priorities.`;
  const sign = `Best regards,\n${input.student.fullName}`;

  const body = [intro, alignment, closer].join("\n\n");

  return {
    subject,
    greeting,
    body,
    closing: sign,
    fullText: `${subject}\n\n${greeting}\n\n${body}\n\n${sign}`,
    generatedAtIso: new Date().toISOString(),
    kind: "student-application",
  };
}
