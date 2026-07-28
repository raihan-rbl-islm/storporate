"use client";

import * as React from "react";
import { GraduationCap, Building2, Landmark, ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ScenarioMatch {
  name: string;
  context: string;
  score: number;
  reasons: readonly string[];
  action: string;
}

interface Scenario {
  id: "student" | "club" | "corporate";
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  pitch: string;
  match: ScenarioMatch;
}

const SCENARIOS: readonly Scenario[] = [
  {
    id: "student",
    label: "Student",
    shortLabel: "🎓 Student",
    icon: <GraduationCap aria-hidden="true" className="size-4" />,
    pitch:
      "Final-year CS student looking for ML internships in Dhaka.",
    match: {
      name: "bKash · Data & ML Intern",
      context: "Hybrid · Dhaka · 6 months",
      score: 92,
      reasons: [
        "ML coursework matches the team’s current projects",
        "Graduation timeline fits the 6-month internship",
        "Skills overlap on Python and PyTorch",
      ],
      action: "Draft application email",
    },
  },
  {
    id: "club",
    label: "Club",
    shortLabel: "🏛️ Club",
    icon: <Landmark aria-hidden="true" className="size-4" />,
    pitch:
      "Engineering club seeking sponsors for an inter-university robotics showdown.",
    match: {
      name: "bKash · STEM Outreach Sponsor",
      context: "Event sponsorship · 1,500 attendees",
      score: 88,
      reasons: [
        "Event audience overlaps bKash’s STEM outreach goals",
        "Scale matches their community-sponsorship tier",
        "Audience is engineering students — a key hiring funnel",
      ],
      action: "Draft sponsorship pitch",
    },
  },
  {
    id: "corporate",
    label: "Company",
    shortLabel: "🏢 Company",
    icon: <Building2 aria-hidden="true" className="size-4" />,
    pitch:
      "Hiring data and ML interns; sponsoring STEM outreach events.",
    match: {
      name: "Tasnim Hossain · BRAC University",
      context: "Final-year CS · Top match for ML Intern",
      score: 91,
      reasons: [
        "ML-heavy coursework aligns with the role",
        "Available for a 6-month hybrid internship",
        "Demonstrated PyTorch projects on profile",
      ],
      action: "Send interest signal",
    },
  },
] as const;

export function ScenarioPlayground() {
  const [activeId, setActiveId] = React.useState<Scenario["id"]>("student");

  const active = SCENARIOS.find((s) => s.id === activeId)!;

  return (
    <section
      aria-labelledby="playground-heading"
      className="bg-muted/30 border-y border-border/60"
      data-testid="scenario-playground"
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 sm:py-28 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        {/* Left column — intro + tab picker */}
        <div className="flex flex-col gap-6">
          <Badge variant="outline" className="w-fit border-accent/40 bg-accent/5 text-foreground">
            Try it
          </Badge>
          <h2
            id="playground-heading"
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            See it from any seat at the table
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            Toggle between the three roles Storporate serves. The match card
            on the right updates instantly — this is the same scoring surface
            every persona sees, just with different inputs.
          </p>

          <div
            role="tablist"
            aria-label="Choose a persona"
            className="flex flex-wrap gap-2"
          >
            {SCENARIOS.map((s) => {
              const isActive = s.id === activeId;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveId(s.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all",
                    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    isActive
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary/5",
                  )}
                >
                  {s.icon}
                  {s.label}
                </button>
              );
            })}
          </div>

          <p className="text-muted-foreground text-sm italic">
            “{active.pitch}”
          </p>
        </div>

        {/* Right column — animated match card */}
        <div
          key={activeId}
          className="scenario-card relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-8"
          aria-live="polite"
        >
          <div
            aria-hidden="true"
            className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
          />

          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs uppercase tracking-wider">
                Top match
              </p>
              <h3 className="text-foreground text-lg font-semibold">
                {active.match.name}
              </h3>
              <p className="text-muted-foreground text-sm">
                {active.match.context}
              </p>
            </div>

            {/* Score ring */}
            <ScoreRing score={active.match.score} />
          </div>

          <ul className="mt-6 space-y-2.5">
            {active.match.reasons.map((reason, i) => (
              <li
                key={reason}
                className="scenario-reason flex items-start gap-2 text-sm"
                style={{ animationDelay: `${120 + i * 120}ms` }}
              >
                <span
                  aria-hidden="true"
                  className="bg-primary mt-1.5 size-1.5 shrink-0 rounded-full"
                />
                <span className="text-foreground/90">{reason}</span>
              </li>
            ))}
          </ul>

          <div className="mt-7 flex items-center justify-between gap-3 border-t border-border/60 pt-5">
            <span className="text-muted-foreground text-xs">
              Demo preview · powered by the real matcher
            </span>
            <Button size="sm" className="group/btn">
              {active.match.action}
              <ArrowRight
                aria-hidden="true"
                className="size-3.5 transition-transform group-hover/btn:translate-x-0.5"
              />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

interface ScoreRingProps {
  score: number;
}

/**
 * Animated SVG score ring. Animates from 0 → score on mount via CSS.
 */
function ScoreRing({ score }: ScoreRingProps) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div
      className="relative size-16 shrink-0"
      aria-label={`Compatibility score ${score} out of 100`}
    >
      <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="5"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          className="score-ring-progress"
          style={{ "--target-offset": offset } as React.CSSProperties}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-base font-semibold tabular-nums">
        {score}
      </span>
    </div>
  );
}

export default ScenarioPlayground;