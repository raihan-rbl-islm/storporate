import { ClipboardList, Radar, Send } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Step {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const STEPS: readonly Step[] = [
  {
    number: "01",
    icon: <ClipboardList aria-hidden="true" className="size-5 text-primary" />,
    title: "Tell us who you are",
    description:
      "Pick your role — student, university club, or company — and share skills, interests, and what you're looking for. Takes about two minutes.",
  },
  {
    number: "02",
    icon: <Radar aria-hidden="true" className="size-5 text-primary" />,
    title: "See ranked matches",
    description:
      "Storporate ranks every opportunity by a 0–100 compatibility score, with a clear rationale for each. No black-box rankings.",
  },
  {
    number: "03",
    icon: <Send aria-hidden="true" className="size-5 text-primary" />,
    title: "Reach out with confidence",
    description:
      "Open a draft email tailored to the match, or send an interest signal — clubs to sponsors, students to roles, corporates to talent.",
  },
] as const;

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="mx-auto max-w-6xl px-6 py-20 sm:py-28"
      data-testid="how-it-works"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-primary text-sm font-medium">How it works</p>
        <h2
          id="how-heading"
          className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          Three steps from sign-up to first reach-out
        </h2>
        <p className="text-muted-foreground mt-4 text-base leading-relaxed">
          We keep the loop short so you can move from profile to a real
          conversation quickly — without losing the why behind every match.
        </p>
      </div>

      <ol className="mt-14 grid gap-6 md:grid-cols-3">
        {STEPS.map((step, idx) => (
          <li key={step.number} className="relative">
            <Card
              className={cn(
                "h-full border-border/60 transition-colors hover:border-primary/40",
              )}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="bg-primary/10 text-primary grid size-9 place-items-center rounded-lg"
                  >
                    {step.icon}
                  </span>
                  <span
                    aria-hidden="true"
                    className="text-muted-foreground/70 font-mono text-xs"
                  >
                    {step.number}
                  </span>
                </div>
                <CardTitle>
                  <h3 className="text-lg font-medium">{step.title}</h3>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="leading-relaxed">
                  {step.description}
                </CardDescription>
              </CardContent>
            </Card>

            {/* Connector arrow between cards on md+ */}
            {idx < STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className="text-muted-foreground/30 pointer-events-none absolute -right-3 top-1/2 hidden -translate-y-1/2 md:block"
              >
                →
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

export default HowItWorks;