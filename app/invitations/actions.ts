"use server";

import { render } from "@react-email/components";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/server/db";
import {
  corporates,
  invitations,
  jobs,
  events,
} from "@/lib/server/db/schema";
import { getCurrentPersona } from "@/lib/server/personas/current";
import { getCurrentUser } from "@/lib/server/auth/current-user";
import { sendTransactionalEmail } from "@/lib/email/transport";
import InvitationEmail from "@/lib/email/templates/invitation-email";
import { withRateLimit } from "@/lib/ratelimit";

export type InvitationFormState =
  | { status: "idle" }
  | {
      status: "error";
      fieldErrors: Record<string, string>;
      formMessage: string;
    }
  | {
      status: "success";
      message: string;
      invitationId: string;
    };

const fromKindSchema = z.enum(["student", "club"]);
const toKindSchema = z.enum(["corporate"]);

/**
 * Form-state contract for `sendInvitation`. Accepts a `FormData` so
 * callers can wire it to a plain form, plus an optional structured
 * `args` object so client components that prefer props (the preview
 * pane in `RequestSponsorshipTrigger`) can pass typed values directly.
 */
export type SendInvitationInput =
  | FormData
  | {
      fromKind: "student" | "club";
      toKind: "corporate";
      toId: string;
      jobId?: string | null;
      eventId?: string | null;
      subject: string;
      body: string;
      kindOverride?: "student_to_company" | "club_to_company";
    };

/**
 * Coerce a discriminated input into a normalized object. We accept
 * either FormData or a plain object so the trigger components can
 * pass a structured value without manually populating FormData.
 */
function coerceInput(
  input: SendInvitationInput,
):
  | {
      ok: true;
      value: {
        fromKind: "student" | "club";
        toId: string;
        jobId: string | null;
        eventId: string | null;
        subject: string;
        body: string;
        kindOverride: "student_to_company" | "club_to_company" | null;
      };
    }
  | {
      ok: false;
      fieldErrors: Record<string, string>;
      formMessage: string;
    } {
  // Normalize FormData → object.
  let raw: Record<string, unknown>;
  if (input instanceof FormData) {
    raw = {
      fromKind: input.get("fromKind"),
      toKind: input.get("toKind"),
      toId: input.get("toId"),
      jobId: input.get("jobId") ?? "",
      eventId: input.get("eventId") ?? "",
      subject: input.get("subject"),
      body: input.get("body"),
      kindOverride: input.get("kindOverride") ?? "",
    };
  } else {
    raw = {
      fromKind: input.fromKind,
      toKind: "corporate",
      toId: input.toId,
      jobId: input.jobId ?? "",
      eventId: input.eventId ?? "",
      subject: input.subject,
      body: input.body,
      kindOverride: input.kindOverride ?? "",
    };
  }

  const parseResult = z
    .object({
      fromKind: fromKindSchema,
      toKind: toKindSchema,
      toId: z.string().min(1, "Recipient is required"),
      jobId: z.string().optional().default(""),
      eventId: z.string().optional().default(""),
      subject: z
        .string()
        .min(3, "Subject must be at least 3 characters")
        .max(200, "Subject is too long"),
      body: z
        .string()
        .min(10, "Add a short message (at least 10 characters)")
        .max(5000, "Message is too long"),
      kindOverride: z.string().optional().default(""),
    })
    .safeParse(raw);

  if (!parseResult.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parseResult.error.issues) {
      const key =
        Array.isArray(issue.path) && issue.path.length > 0
          ? String(issue.path[0])
          : "_form";
      if (!fieldErrors[key])
        fieldErrors[key] = issue.message ?? "Invalid value";
    }
    return {
      ok: false,
      fieldErrors,
      formMessage: "Please fix the highlighted fields.",
    };
  }

  let kindOverride: "student_to_company" | "club_to_company" | null = null;
  if (parseResult.data.kindOverride === "club_to_company") {
    kindOverride = "club_to_company";
  } else if (parseResult.data.kindOverride === "student_to_company") {
    kindOverride = "student_to_company";
  }

  return {
    ok: true,
    value: {
      fromKind: parseResult.data.fromKind,
      toId: parseResult.data.toId,
      jobId: parseResult.data.jobId || null,
      eventId: parseResult.data.eventId || null,
      subject: parseResult.data.subject.trim(),
      body: parseResult.data.body.trim(),
      kindOverride,
    },
  };
}

interface ResolvedEmails {
  senderEmail: string;
  senderName: string;
  recipientEmail: string;
  recipientName: string;
}

/**
 * Resolve sender + recipient email addresses and display names from the
 * caller + form values. Throws on miss; callers catch and return a
 * friendly FormState.
 */
async function resolveEmails(args: {
  fromKind: "student" | "club";
  toId: string;
  jobId: string | null;
  eventId: string | null;
}): Promise<ResolvedEmails> {
  const current = await getCurrentPersona();
  if (!current) throw new Error("not_authed");

  // Sender.
  let senderEmail = "";
  let senderName = "";
  if (args.fromKind === "student") {
    if (current.kind !== "student") throw new Error("not_student");
    const auth = await getCurrentUser();
    senderEmail = (auth.kind === "anonymous" ? null : auth.email) ?? "";
    senderName = current.row.fullName;
  } else {
    if (current.kind !== "club") throw new Error("not_club");
    senderEmail = current.row.contactEmail ?? "";
    senderName = current.row.clubName;
  }

  // Recipient (always corporate).
  const [corp] = await db
    .select({
      id: corporates.id,
      organizationName: corporates.organizationName,
      contactEmail: corporates.contactEmail,
    })
    .from(corporates)
    .where(eq(corporates.id, args.toId))
    .limit(1);
  if (!corp) throw new Error("recipient_not_found");

  return {
    senderEmail: senderEmail.trim(),
    senderName: senderName.trim(),
    recipientEmail: (corp.contactEmail ?? "").trim(),
    recipientName: corp.organizationName,
  };
}

/**
 * Public entry point for the Send Invitation / Request Sponsorship
 * forms. Routes the structured FormState response so the client
 * component can render inline success/error without a dialog.
 */
export async function sendInvitation(
  input: SendInvitationInput,
): Promise<InvitationFormState> {
  const coerced = coerceInput(input);
  if (!coerced.ok) {
    return {
      status: "error",
      fieldErrors: coerced.fieldErrors,
      formMessage: coerced.formMessage,
    };
  }
  const { fromKind, toId, jobId, eventId, subject, body, kindOverride } =
    coerced.value;

  const viewer = await getCurrentPersona();
  if (!viewer) {
    return {
      status: "error",
      fieldErrors: {},
      formMessage: "Please sign in to send an invitation.",
    };
  }
  // Cross-check: `fromKind` must match the viewer's persona kind.
  if (
    (fromKind === "student" && viewer.kind !== "student") ||
    (fromKind === "club" && viewer.kind !== "club")
  ) {
    return {
      status: "error",
      fieldErrors: {},
      formMessage: "Your account can't send this kind of invitation.",
    };
  }

  const rl = await withRateLimit({
    identifier: `send-invitation:${viewer.row.id}:${toId}`,
    limit: 10,
    window: "10 s",
    prefix: "storporate:rl:send-invitation",
  });
  if (rl.status === "limited") {
    return {
      status: "error",
      fieldErrors: {},
      formMessage: "You're sending invites too quickly. Please slow down.",
    };
  }
  // Per-day cap (25), enforced by a second, independent limiter so
  // spamming many distinct recipients doesn't bypass the per-pair cap.
  const rlDaily = await withRateLimit({
    identifier: `send-invitation-daily:${viewer.row.id}`,
    limit: 25,
    window: "1 d",
    prefix: "storporate:rl:send-invitation-daily",
  });
  if (rlDaily.status === "limited") {
    return {
      status: "error",
      fieldErrors: {},
      formMessage: "You've hit today's invite limit (25). Try again tomorrow.",
    };
  }

  let resolved: ResolvedEmails;
  try {
    resolved = await resolveEmails({ fromKind, toId, jobId, eventId });
  } catch (err) {
    const reason = (err as Error).message;
    if (reason === "recipient_not_found") {
      return {
        status: "error",
        fieldErrors: {},
        formMessage: "That recipient no longer exists.",
      };
    }
    return {
      status: "error",
      fieldErrors: {},
      formMessage: "Couldn't resolve your account. Please sign out and back in.",
    };
  }
  if (!resolved.recipientEmail) {
    return {
      status: "error",
      fieldErrors: {},
      formMessage:
        "This company hasn't provided a contact email yet. Try again later.",
    };
  }
  if (!resolved.senderEmail) {
    return {
      status: "error",
      fieldErrors: {},
      formMessage:
        fromKind === "student"
          ? "We couldn't find your sign-in email. Update your account."
          : "Please add a contact email to your club profile before sending.",
    };
  }

  // Resolve optional deep links so the rendered email has real URLs.
  let linkUrl = "https://storporate.bd";
  let jobTitle: string | undefined;
  let eventTitle: string | undefined;
  if (jobId) {
    const [job] = await db
      .select({ slug: jobs.slug, title: jobs.title })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);
    if (job) {
      jobTitle = job.title;
      linkUrl = `https://storporate.bd/jobs/${job.slug}`;
    }
  } else if (eventId) {
    const [ev] = await db
      .select({ slug: events.slug, title: events.title })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);
    if (ev) {
      eventTitle = ev.title;
      linkUrl = `https://storporate.bd/events/${ev.slug}`;
    }
  }

  const kind: "student_to_company" | "club_to_company" =
    kindOverride ??
    (fromKind === "club" ? "club_to_company" : "student_to_company");

  // Build the react-email HTML eagerly so transport failures can still
  // record a row. We catch transport errors below and write status =
  // 'failed' — surfacing partial state in the inbox is more useful than
  // blowing up the form.
  const html = await render(
    InvitationEmail({
      senderName: resolved.senderName || "A Storporate member",
      recipientName: resolved.recipientName,
      jobTitle,
      eventTitle,
      message: body,
      linkUrl,
      senderEmail: resolved.senderEmail,
    }),
  );
  const text =
    `${resolved.senderName || "A Storporate member"} shared ` +
    (jobTitle
      ? `a role: ${jobTitle}`
      : eventTitle
        ? `an event: ${eventTitle}`
        : "an opportunity on Storporate") +
    `\n\n${body}\n\nView on Storporate: ${linkUrl}\n\n` +
    `Reply to: ${resolved.senderEmail}`;

  const fromAddress =
    process.env.EMAIL_FROM_ADDRESS ?? "noreply@storporate.bd";
  const fullSubject = subject.startsWith("Storporate ·")
    ? subject
    : `Storporate · ${subject}`;

  let status: "sent" | "failed" = "failed";
  try {
    await sendTransactionalEmail({
      to: resolved.recipientEmail,
      from: `${process.env.EMAIL_FROM_NAME ?? "Storporate"} <${fromAddress}>`,
      subject: fullSubject,
      html,
      text,
      replyTo: resolved.senderEmail,
    });
    status = "sent";
  } catch (err) {
    console.error("[sendInvitation] transport failed:", err);
  }

  const [row] = await db
    .insert(invitations)
    .values({
      kind,
      fromKind,
      fromId: viewer.row.id,
      toKind: "corporate",
      toId,
      jobId: kind === "student_to_company" && jobId ? jobId : null,
      eventId:
        kind === "club_to_company" && eventId
          ? eventId
          : kind === "student_to_company" && eventId
            ? eventId
            : null,
      subject: fullSubject,
      body,
      senderEmail: resolved.senderEmail,
      recipientEmail: resolved.recipientEmail,
      status,
    })
    .returning({ id: invitations.id });

  if (status === "failed") {
    return {
      status: "error",
      fieldErrors: {},
      formMessage:
        "We couldn't deliver your invitation right now. The recipient will still see your interest was recorded.",
    };
  }

  return {
    status: "success",
    message: `Sent to ${resolved.recipientName}.`,
    invitationId: row?.id ?? "",
  };
}

/**
 * Build a stable, link-able preview string for the sponsorship form.
 * Returns the same HTML that `sendInvitation` would send, so clubs can
 * verify content before committing. Does NOT touch the DB or the
 * email transport — purely a render-only server helper.
 */
export async function previewInvitation(
  args: SendInvitationInput,
): Promise<{ ok: true; html: string; text: string } | { ok: false; reason: string }> {
  const coerced = coerceInput(args);
  if (!coerced.ok) {
    return { ok: false, reason: "validation" };
  }
  const { fromKind, toId, jobId, eventId, body } = coerced.value;

  const viewer = await getCurrentPersona();
  if (!viewer) return { ok: false, reason: "not_authed" };
  if (
    (fromKind === "student" && viewer.kind !== "student") ||
    (fromKind === "club" && viewer.kind !== "club")
  ) {
    return { ok: false, reason: "wrong_kind" };
  }

  const emails = await resolveEmails({ fromKind, toId, jobId, eventId });

  let linkUrl = "https://storporate.bd";
  let jobTitle: string | undefined;
  let eventTitle: string | undefined;
  if (jobId) {
    const [job] = await db
      .select({ slug: jobs.slug, title: jobs.title })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);
    if (job) {
      jobTitle = job.title;
      linkUrl = `https://storporate.bd/jobs/${job.slug}`;
    }
  } else if (eventId) {
    const [ev] = await db
      .select({ slug: events.slug, title: events.title })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);
    if (ev) {
      eventTitle = ev.title;
      linkUrl = `https://storporate.bd/events/${ev.slug}`;
    }
  }

  const html = await render(
    InvitationEmail({
      senderName: emails.senderName || "A Storporate member",
      recipientName: emails.recipientName,
      jobTitle,
      eventTitle,
      message: body,
      linkUrl,
      senderEmail: emails.senderEmail || "noreply@storporate.bd",
    }),
  );
  const text =
    `${emails.senderName || "A Storporate member"} shared ` +
    (jobTitle
      ? `a role: ${jobTitle}`
      : eventTitle
        ? `an event: ${eventTitle}`
        : "an opportunity on Storporate") +
    `\n\n${body}\n\nView on Storporate: ${linkUrl}\n\n` +
    `Reply to: ${emails.senderEmail}`;
  return { ok: true, html, text };
}