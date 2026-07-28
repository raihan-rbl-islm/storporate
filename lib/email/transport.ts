/**
 * Phase 8: Resend-backed transactional email transport.
 *
 * Wraps the Resend SDK in a tiny surface so callers don't need to know
 * about the underlying library. The SDK is instantiated lazily on each
 * call (rather than at module load) so the absence of `RESEND_API_KEY`
 * in local dev doesn't crash import.
 *
 * Throws on failure so the calling Server Action can record an error
 * status in `invitations.status` for auditability.
 */
import { Resend } from "resend";

export type SendTransactionalEmailArgs = {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export async function sendTransactionalEmail(
  args: SendTransactionalEmailArgs,
): Promise<{ id: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    to: args.to,
    from: args.from,
    subject: args.subject,
    html: args.html,
    text: args.text,
    replyTo: args.replyTo,
  });

  if (error || !data?.id) {
    throw new Error(error?.message ?? "Resend send failed without id");
  }

  return { id: data.id };
}
