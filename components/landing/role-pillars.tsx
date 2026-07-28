import { GraduationCap, Landmark, Building2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Pillar {
  id: string;
  icon: React.ReactNode;
  title: string;
  pitch: string;
  bullets: readonly string[];
}

const PILLARS: readonly Pillar[] = [
  {
    id: "students",
    icon: <GraduationCap aria-hidden="true" className="size-5" />,
    title: "For students",
    pitch:
      "Find internships and graduate roles at companies whose hiring priorities match your skills, interests, and graduation timeline.",
    bullets: [
      "Ranked matches with a clear rationale",
      "Draft application emails tailored to each role",
      "Try prepared personas without signing up",
    ],
  },
  {
    id: "clubs",
    icon: <Landmark aria-hidden="true" className="size-5" />,
    title: "For university clubs",
    pitch:
      "Reach companies whose sponsorship priorities match your event type, scale, and impact area.",
    bullets: [
      "Match with sponsors aligned to your event theme",
      "Draft sponsorship pitches with your event details",
      "Track interest signals sent to your shortlist",
    ],
  },
  {
    id: "companies",
    icon: <Building2 aria-hidden="true" className="size-5" />,
    title: "For companies",
    pitch:
      "Discover students and clubs whose skills, interests, and contexts align with your hiring and sponsorship goals.",
    bullets: [
      "Browse ranked candidates with skill overlap",
      "Express interest with one click",
      "Browse a prepared corporate perspective first",
    ],
  },
] as const;

export function RolePillars() {
  return (
    <section
      id="students"
      aria-labelledby="pillars-heading"
      className="mx-auto max-w-6xl px-6 py-20 sm:py-28"
      data-testid="role-pillars"
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2
          id="pillars-heading"
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          Built for every seat at the table
        </h2>
        <p className="text-muted-foreground mt-4 text-base leading-relaxed">
          Three roles, one marketplace. Each gets a tailored surface tuned to
          what they actually do next.
        </p>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {PILLARS.map((p, idx) => (
          <Card
            key={p.id}
            id={p.id === "clubs" ? "clubs" : p.id === "companies" ? "companies" : undefined}
            className={cn(
              "pillar-card group/pillar border-border/60 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md",
            )}
            style={{ animationDelay: `${idx * 120}ms` }}
          >
            <CardHeader>
              <span
                aria-hidden="true"
                className="bg-primary/10 text-primary group-hover/pillar:bg-primary group-hover/pillar:text-primary-foreground grid size-10 place-items-center rounded-xl transition-colors"
              >
                {p.icon}
              </span>
              <CardTitle>
                <h3 className="text-lg font-medium">{p.title}</h3>
              </CardTitle>
              <CardDescription className="leading-relaxed">
                {p.pitch}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-muted-foreground space-y-2 text-sm">
                {p.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <span
                      aria-hidden="true"
                      className="bg-primary mt-1.5 size-1.5 shrink-0 rounded-full"
                    />
                    {b}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default RolePillars;