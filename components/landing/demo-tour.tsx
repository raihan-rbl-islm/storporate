import Link from "next/link";
import { Play, Users, Sparkles, Send } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TourStop {
  id: "matches" | "drafts" | "outreach";
  label: string;
  caption: string;
  icon: React.ReactNode;
  mock: React.ReactNode;
}

function MockMatches() {
  return (
    <div className="space-y-3">
      {[
        {
          name: "bKash · Data & ML Intern",
          meta: "Hybrid · Dhaka · 6 months",
          score: 92,
        },
        {
          name: "Pathao · Backend Engineer",
          meta: "On-site · Dhaka · Full-time",
          score: 84,
        },
        {
          name: "Sheba.xyz · Product Intern",
          meta: "Hybrid · Dhaka · 3 months",
          score: 78,
        },
      ].map((m) => (
        <div
          key={m.name}
          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/80 p-3"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{m.name}</p>
            <p className="text-muted-foreground text-xs">{m.meta}</p>
          </div>
          <span className="text-primary shrink-0 text-sm font-semibold tabular-nums">
            {m.score}%
          </span>
        </div>
      ))}
    </div>
  );
}

function MockDrafts() {
  return (
    <div className="rounded-lg border border-border bg-card/80 p-4">
      <p className="text-muted-foreground text-xs uppercase tracking-wider">
        Draft email
      </p>
      <p className="mt-2 text-sm font-medium">Subject: Application — ML Intern</p>
      <div className="text-muted-foreground mt-3 space-y-2 text-xs leading-relaxed">
        <p>Hi bKash People Team,</p>
        <p>
          I&apos;m Tasnim, a final-year CS student at BRAC University. Your ML
          Intern role lines up closely with the projects I&apos;ve shipped in
          PyTorch — happy to share details if useful.
        </p>
        <p>— Tasnim</p>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
        <span className="text-muted-foreground text-xs">Draft · not sent</span>
        <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-medium">
          Ready to review
        </span>
      </div>
    </div>
  );
}

function MockOutreach() {
  return (
    <div className="space-y-3">
      {[
        { who: "bKash · ML Intern", status: "Interest sent", tone: "primary" },
        { who: "NSU Robotics Club", status: "Pitch drafted", tone: "accent" },
        { who: "Pathao · Sponsorship", status: "Viewed", tone: "muted" },
      ].map((row) => (
        <div
          key={row.who}
          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/80 p-3"
        >
          <p className="truncate text-sm font-medium">{row.who}</p>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
              row.tone === "primary" && "bg-primary/10 text-primary",
              row.tone === "accent" && "bg-accent/15 text-accent-foreground/80",
              row.tone === "muted" && "bg-muted text-muted-foreground",
            )}
          >
            {row.status}
          </span>
        </div>
      ))}
    </div>
  );
}

const TOUR_STOPS: readonly TourStop[] = [
  {
    id: "matches",
    label: "Ranked matches",
    caption: "Every opportunity scored 0–100 with a clear rationale.",
    icon: <Users aria-hidden="true" className="size-4" />,
    mock: <MockMatches />,
  },
  {
    id: "drafts",
    label: "Tailored drafts",
    caption: "Pre-written emails you can review and edit before sending.",
    icon: <Sparkles aria-hidden="true" className="size-4" />,
    mock: <MockDrafts />,
  },
  {
    id: "outreach",
    label: "Outreach signals",
    caption: "Track interest signals, drafts, and views in one timeline.",
    icon: <Send aria-hidden="true" className="size-4" />,
    mock: <MockOutreach />,
  },
] as const;

export function DemoTour() {
  return (
    <section
      id="tour"
      aria-labelledby="tour-heading"
      className="bg-muted/30 relative overflow-hidden border-y border-border/60"
      data-testid="demo-tour"
    >
      {/* Decorative gradient */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-accent/10"
      />

      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 sm:py-28 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        {/* Left — pitch + CTA */}
        <div className="flex flex-col gap-6">
          <p className="text-primary text-sm font-medium">Quick tour</p>
          <h2
            id="tour-heading"
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            See the whole loop in 60 seconds
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            The Demo ships with prepared personas so you can step through the
            matching, drafting, and outreach surfaces without signing up. It&apos;s
            the fastest way to feel what Storporate actually does.
          </p>

          <ol className="space-y-4">
            {TOUR_STOPS.map((stop, idx) => (
              <li
                key={stop.id}
                className="tour-step flex items-start gap-4 rounded-lg border border-transparent p-2 transition-colors hover:border-border/60 hover:bg-card/40"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <span
                  aria-hidden="true"
                  className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-lg"
                >
                  {stop.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold">
                    {String(idx + 1).padStart(2, "0")} · {stop.label}
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {stop.caption}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/demo"
              className={cn(buttonVariants({ variant: "default", size: "lg" }), "group/tour")}
            >
              <Play aria-hidden="true" className="size-4 transition-transform group-hover/tour:scale-110" />
              Take a quick tour
            </Link>
            <Link
              href="/demo/google"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Or try with Google
            </Link>
          </div>
        </div>

        {/* Right — mock preview panel */}
        <div className="tour-preview relative overflow-hidden rounded-2xl border border-border bg-background p-6 shadow-xl sm:p-8">
          <div className="flex items-center gap-1.5 pb-4">
            <span aria-hidden="true" className="size-2.5 rounded-full bg-destructive/40" />
            <span aria-hidden="true" className="size-2.5 rounded-full bg-accent/40" />
            <span aria-hidden="true" className="size-2.5 rounded-full bg-primary/40" />
            <span className="text-muted-foreground ml-2 text-xs">
              app.storporate.bd / demo
            </span>
          </div>

          <div className="tour-tabs flex flex-wrap gap-2 border-b border-border/60 pb-4">
            {TOUR_STOPS.map((stop, idx) => (
              <span
                key={stop.id}
                className={cn(
                  "tour-tab inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
                  idx === 0
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {stop.icon}
                {stop.label}
              </span>
            ))}
          </div>

          <div className="tour-mock mt-5">
            {TOUR_STOPS[0].mock}
          </div>

          <p className="text-muted-foreground mt-5 text-[10px]">
            Demo preview · prepared personas, real matcher
          </p>
        </div>
      </div>
    </section>
  );
}

export default DemoTour;