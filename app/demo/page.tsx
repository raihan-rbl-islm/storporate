import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { HERO_PERSONAS } from "@/data/personas";
import { selectPersona } from "./actions";

export const metadata: Metadata = {
  title: "Demo entry · Storporate",
};

const ERROR_COPY: Record<
  string,
  { h1: string; intro: string; showRetry: boolean }
> = {
  oauth_cancelled: {
    h1: "Sign-in was cancelled",
    intro:
      "No problem — you didn't finish signing in. You can try again, or pick a prepared persona to skip sign-in entirely.",
    showRetry: true,
  },
  oauth_provider_error: {
    h1: "The sign-in service is temporarily unavailable",
    intro:
      "The Google sign-in service is having trouble. Try again in a moment, or pick a prepared persona to skip sign-in entirely.",
    showRetry: true,
  },
  missing_code: {
    h1: "We couldn't complete sign-in",
    intro:
      "Something went wrong with the sign-in link. Try again, or pick a prepared persona to skip sign-in entirely.",
    showRetry: true,
  },
  oauth_exchange_failed: {
    h1: "Sign-in didn't go through",
    intro:
      "Our sign-in handler couldn't verify your account. Try again, or pick a prepared persona to skip sign-in entirely.",
    showRetry: true,
  },
  oauth_start_failed: {
    h1: "Sign-in couldn't start",
    intro:
      "We couldn't kick off the sign-in flow. Try again, or pick a prepared persona to skip sign-in entirely.",
    showRetry: true,
  },
  no_role: {
    h1: "Pick a persona to continue",
    intro:
      "Signed in successfully, but we don't have a role for your account. Pick a prepared persona to land on a dashboard.",
    showRetry: false,
  },
  test_mode_disabled: {
    h1: "Test sign-in is off",
    intro:
      "The development sign-in shortcut isn't enabled in this environment. Click \"Continue with Google\" instead, or pick a prepared persona.",
    showRetry: false,
  },
  unknown_persona: {
    h1: "That persona doesn't exist",
    intro:
      "We couldn't find the persona you tried to select. Pick one of the cards below to continue.",
    showRetry: false,
  },
};

type SearchParams = Promise<{ error?: string }>;

export default async function DemoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error } = await searchParams;
  const errorCopy =
    error && Object.prototype.hasOwnProperty.call(ERROR_COPY, error)
      ? ERROR_COPY[error]
      : null;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
        {errorCopy ? (
          <section
            aria-labelledby="error-heading"
            className="flex flex-col gap-4"
          >
            <h1
              id="error-heading"
              className="text-4xl font-semibold tracking-tight"
            >
              {errorCopy.h1}
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              {errorCopy.intro}
            </p>
            <div className="flex flex-wrap gap-3">
              {errorCopy.showRetry && (
                <a
                  href="/demo"
                  className="inline-flex h-8 items-center justify-center rounded-lg border border-transparent bg-primary px-3 text-sm font-medium whitespace-nowrap text-primary-foreground transition-colors hover:bg-primary/80 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus:outline-none"
                >
                  Try with Google again
                </a>
              )}
              <a
                href="#personas"
                className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium whitespace-nowrap transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus:outline-none"
              >
                Pick a prepared persona
              </a>
            </div>
          </section>
        ) : (
          <>
            <h1 className="text-4xl font-semibold tracking-tight">
              Open the demo
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              Choose a prepared persona to step into that role, or sign in with
              Google. Personas ship with prepared profiles and matches so the
              demo lands on real-feeling context, not empty screens.
            </p>
          </>
        )}

        <h2 className="mt-4 text-2xl font-semibold" id="personas">
          Prepared personas
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {HERO_PERSONAS.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle>{p.name}</CardTitle>
                <CardDescription>{p.institution}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{p.scenario}</p>
                <form action={selectPersona} className="mt-4">
                  <input type="hidden" name="personaId" value={p.id} />
                  <Button type="submit" className="w-full">
                    Continue as {p.name}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>

        <div role="separator" className="my-8 border-t" />

        <h2 className="text-2xl font-semibold">Or sign in with Google</h2>
        {process.env.ENABLE_DEMO_AUTH_DEV_LOGIN === "true" ? (
          <form action="/demo/google/dev" method="post">
            <Button variant="outline" type="submit">
              Continue with Google
            </Button>
          </form>
        ) : (
          <form action="/demo/google" method="post">
            <Button variant="outline" type="submit">
              Continue with Google
            </Button>
          </form>
        )}

        <p className="text-muted-foreground mt-8 text-xs leading-relaxed">
          Prepared personas are fixtures for evaluation. Names and scenarios
          reference real organizations for scenario realism only — they do not
          imply partnership, endorsement, or audited employment data.
        </p>
      </div>
    </main>
  );
}
