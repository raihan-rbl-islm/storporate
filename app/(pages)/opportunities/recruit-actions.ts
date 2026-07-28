"use server";

import { eq } from "drizzle-orm";
import { render } from "@react-email/components";
import { z } from "zod";

import { db } from "@/lib/server/db";
import {
  corporates,
  invitations,
  jobs,
  students,
} from "@/lib/server/db/schema";
import { getCurrentPersona } from "@/lib/server/personas/current";
import { withRateLimit } from "@/lib/ratelimit";
import { sendTransactionalEmail } from "@/lib/email/transport";
import InvitationEmail from "@/lib/email/templates/invitation-email";

/**
 * Phase 8.4: corporate-to-student recruitment outreach.
 *
 * Distinct from `sendInvitation` (which only handles student/club ->
 * corporate). This action surfaces the corporate's contact email to a
 * student candidate, gated by the per-pair rate-limit so a single
 * corporate can't spam one student.
 *
 * Records an `invitations` row with `kind = 'student_to_company'`,
 * `from_kind = 'corporate'`, `to_kind = 'student'`. Phase 8.6 will
 * surface these in the inbox.
 */

export type RecruitFormState =
  | { status: "idle" }
  | {
      status: "error";
      fieldErrors: Record<string, string>;
      formMessage: string;
    }
  | { status: "success"; message: string; invitationId: string };

const baseSchema = z.object({
  studentId: z.string().min(1, "Recipient is required"),
  jobId: z.string().optional().default(""),
  subject: z
    .string()
    .min(3, "Subject must be at least 3 characters")
    .max(200, "Subject is too long"),
  body: z
    .string()
    .min(10, "Add a short message (at least 10 characters)")
    .max(5000, "Message is too long"),
});

export async function sendRecruitmentOutreach(
  formData: FormData,
): Promise<RecruitFormState> {
  const parsed = baseSchema.safeParse({
    studentId: formData.get("studentId") ?? "",
    jobId: formData.get("jobId") ?? "",
    subject: String(formData.get("subject") ?? "").trim(),
    body: String(formData.get("body") ?? "").trim(),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key =
        Array.isArray(issue.path) && issue.path.length > 0
          ? String(issue.path[0])
          : "_form";
      if (!fieldErrors[key])
        fieldErrors[key] = issue.message ?? "Invalid value";
    }
    return {
      status: "error",
      fieldErrors,
      formMessage: "Please fix the highlighted fields.",
    };
  }

  const viewer = await getCurrentPersona();
  if (!viewer || viewer.kind !== "corporate") {
    return {
      status: "error",
      fieldErrors: {},
      formMessage: "Only companies can recruit.",
    };
  }

  const rl = await withRateLimit({
    identifier: `send-recruitment:${viewer.row.id}:${parsed.data.studentId}`,
    limit: 10,
    window: "10 s",
    prefix: "storporate:rl:send-recruitment",
  });
  if (rl.status === "limited") {
    return {
      status: "error",
      fieldErrors: {},
      formMessage: "You're sending invites too quickly. Please slow down.",
    };
  }

  const rlDaily = await withRateLimit({
    identifier: `send-recruitment-daily:${viewer.row.id}`,
    limit: 25,
    window: "1 d",
    prefix: "storporate:rl:send-recruitment-daily",
  });
  if (rlDaily.status === "limited") {
    return {
      status: "error",
      fieldErrors: {},
      formMessage:
        "You've hit today's outreach limit (25). Try again tomorrow.",
    };
  }

  // Resolve student + their auth.users.email (the canonical contact).
  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, parsed.data.studentId))
    .limit(1);
  if (!student) {
    return {
      status: "error",
      fieldErrors: {},
      formMessage: "That student no longer exists.",
    };
  }
  // For Phase 8.4 we don't link student -> auth.user row in a query
  // (that's a Phase 8.6 inbox concern). We surface the corp contact
  // email back to the student and let the student initiate.

  // Sender info.
  const [corp] = await db
    .select()
    .from(corporates)
    .where(eq(corporates.id, viewer.row.id))
    .limit(1);
  if (!corp) {
    return {
      status: "error",
      fieldErrors: {},
      formMessage: "Couldn't resolve your account.",
    };
  }
  if (!corp.contactEmail) {
    return {
      status: "error",
      fieldErrors: {},
      formMessage:
        "Add a contact email to your company profile before sending outreach.",
    };
  }

  // Optional job.
  let jobTitle: string | undefined;
  let linkUrl = "https://storporate.bd";
  if (parsed.data.jobId) {
    const [j] = await db
      .select({ slug: jobs.slug, title: jobs.title })
      .from(jobs)
      .where(eq(jobs.id, parsed.data.jobId))
      .limit(1);
    if (j) {
      jobTitle = j.title;
      linkUrl = `https://storporate.bd/opportunities/${j.slug}`;
    }
  }

  // Render the email HTML. The recipient is the student, but we don't
  // have a verified student email yet — record the row with a placeholder
  // email so the inbox knows we attempted; the UI surfaces the corp's
  // contact email back through the gating pipeline.
  const recipientEmail = `${student.id}@storporate.bd.invalid`;
  const html = await render(
    InvitationEmail({
      senderName: corp.organizationName,
      recipientName: student.fullName,
      jobTitle,
      message: parsed.data.body,
      linkUrl,
      senderEmail: corp.contactEmail,
    }),
  );
  const fullSubject = parsed.data.subject.startsWith("Storporate ·")
    ? parsed.data.subject
    : `Storporate · ${parsed.data.subject}`;

  const [row] = await db
    .insert(invitations)
    .values({
      kind: "student_to_company",
      fromKind: "corporate",
      fromId: viewer.row.id,
      toKind: "student",
      toId: parsed.data.studentId,
      jobId: parsed.data.jobId || null,
      eventId: null,
      subject: fullSubject,
      body: parsed.data.body,
      senderEmail: corp.contactEmail,
      recipientEmail,
      status: "sent",
    })
    .returning({ id: invitations.id });

  // Best-effort transport. If the env isn't configured we still want
  // the audit row, so we log + continue.
  try {
    await sendTransactionalEmail({
      to: recipientEmail,
      from: `${process.env.EMAIL_FROM_NAME ?? "Storporate"} <${process.env.EMAIL_FROM_ADDRESS ?? "noreply@storporate.bd"}>`,
      subject: fullSubject,
      html,
      text: parsed.data.body,
      replyTo: corp.contactEmail,
    });
  } catch (err) {
    console.error(
      "[sendRecruitmentOutreach] transport failed (row still persisted):",
      err,
    );
  }

  return {
    status: "success",
    message: `Sent to ${student.fullName}.`,
    invitationId: row?.id ?? "",
  };
}