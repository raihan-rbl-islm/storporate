import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Check your email · Storporate",
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function CheckEmailPage({ searchParams }: PageProps) {
  const { email } = await searchParams;
  const masked = email ? maskEmail(email) : "your inbox";

  return (
    <main className="bg-background text-foreground grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div
          aria-hidden="true"
          className="bg-primary/10 text-primary mx-auto grid size-12 place-items-center rounded-2xl"
        >
          <MailCheck className="size-6" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          Check your email
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          We sent a verification link to{" "}
          <span className="text-foreground font-medium">{masked}</span>.
          Click the link to finish setting up your account.
        </p>
        <ul className="text-muted-foreground mt-6 space-y-2 text-left text-xs">
          <li>
            · The link expires in 24 hours — open it from the same browser
            you used to sign up.
          </li>
          <li>
            · Can&apos;t find it? Check spam, then{" "}
            <Link
              href="/signin"
              className="text-foreground underline underline-offset-4"
            >
              try signing in
            </Link>{" "}
            to resend.
          </li>
        </ul>
        <Link
          href="/"
          className="text-muted-foreground mt-6 inline-block text-xs underline underline-offset-4"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  const head = user.slice(0, Math.min(2, user.length));
  return `${head}${"•".repeat(Math.max(1, user.length - head.length))}@${domain}`;
}