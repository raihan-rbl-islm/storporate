/**
 * Phase 8: invitation email template.
 *
 * Used for both job-application invitations and event RSVPs from a
 * student/club to a corporate contact. The subject line includes the
 * sender's name so the recipient immediately knows who's reaching out.
 *
 * Rendered by react-email at request time — not pre-compiled — so the
 * caller can drop this into a Server Action without a build step.
 */
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Text,
} from "@react-email/components";

export const subject = "Storporate · {senderName} shared their details with you";

type InvitationEmailProps = {
  senderName: string;
  recipientName?: string;
  jobTitle?: string;
  eventTitle?: string;
  message: string;
  linkUrl: string;
  senderEmail: string;
};

export default function InvitationEmail({
  senderName,
  recipientName,
  jobTitle,
  eventTitle,
  message,
  linkUrl,
  senderEmail,
}: InvitationEmailProps) {
  const context = jobTitle
    ? `a role: ${jobTitle}`
    : eventTitle
      ? `an event: ${eventTitle}`
      : "an opportunity on Storporate";

  return (
    <Html>
      <Head />
      <Body
        style={{
          backgroundColor: "#f6f6f9",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          margin: 0,
          padding: 0,
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            margin: "32px auto",
            maxWidth: 560,
            padding: "32px 28px",
            borderRadius: 12,
          }}
        >
          <Heading
            style={{
              fontSize: 22,
              margin: "0 0 12px",
              color: "#111827",
            }}
          >
            {senderName} shared {context}
          </Heading>

          <Text style={{ color: "#374151", lineHeight: 1.5 }}>
            Hi {recipientName || "there"},
          </Text>

          <Text style={{ color: "#374151", lineHeight: 1.5 }}>{message}</Text>

          <Button
            href={linkUrl}
            style={{
              backgroundColor: "#4f46e5",
              color: "#ffffff",
              padding: "12px 20px",
              borderRadius: 8,
              textDecoration: "none",
              display: "inline-block",
              marginTop: 16,
            }}
          >
            View on Storporate
          </Button>

          <Hr style={{ margin: "28px 0", borderColor: "#e5e7eb" }} />

          <Text style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.5 }}>
            You can reply directly to{" "}
            <Link href={`mailto:${senderEmail}`} style={{ color: "#4f46e5" }}>
              {senderEmail}
            </Link>
            .
          </Text>

          <Text style={{ color: "#9ca3af", fontSize: 12, marginTop: 16 }}>
            Storporate · Connecting students, clubs, and corporates.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
