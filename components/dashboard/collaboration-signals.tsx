import { Briefcase, Handshake, CircleCheck, CircleDot } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  studentSignals,
  clubSignals,
  corporateSignals,
  type CollaborationSignal,
} from "@/data/demo-signals";
import {
  getStudentFixtures,
  getClubFixtures,
  getCorporateFixtures,
} from "@/lib/server/personas/lookup";

export interface CollaborationSignalsProps {
  role: "student" | "club" | "corporate";
}

const ROLE_HEADING: Record<CollaborationSignalsProps["role"], string> = {
  student: "Recent activity",
  club: "Recent activity",
  corporate: "Recent activity",
};

const ROLE_DESCRIPTION: Record<CollaborationSignalsProps["role"], string> = {
  student:
    "Prepared Demo signals — not a live feed. Each entry references a persona in this Demo.",
  club:
    "Prepared Demo signals — not a live feed. Each entry references a persona in this Demo.",
  corporate:
    "Prepared Demo signals — not a live feed. Each entry references a persona in this Demo.",
};

function pickSet(role: CollaborationSignalsProps["role"]): readonly CollaborationSignal[] {
  if (role === "student") return studentSignals;
  if (role === "club") return clubSignals;
  return corporateSignals;
}

function relativeTime(asOf: string): string {
  const then = new Date(asOf).getTime();
  const now = Date.now();
  const days = Math.max(0, Math.floor((now - then) / (1000 * 60 * 60 * 24)));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

export async function CollaborationSignals({ role }: CollaborationSignalsProps) {
  const signals = pickSet(role);
  const students = getStudentFixtures();
  const clubs = getClubFixtures();
  const corporates = getCorporateFixtures();

  // Enrich with persona names. Look up by id; fall back to a placeholder
  // if the referenced persona does not exist in the current fixture.
  const enriched = signals.map((s) => {
    const corporate = corporates.find((c) => c.id === s.corporateId);
    let label: string;
    if (s.kind === "student-corporate") {
      const student = students.find((p) => p.id === s.personaId);
      label = `${student?.fullName ?? "Demo student"} → ${corporate?.organizationName ?? "Demo organization"}`;
    } else {
      const club = clubs.find((c) => c.id === s.personaId);
      label = `${club?.clubName ?? "Demo club"} → ${corporate?.organizationName ?? "Demo organization"}`;
    }
    return { signal: s, label };
  });

  return (
    <section aria-labelledby="signals-heading" className="flex flex-col gap-3" data-testid="collaboration-signals">
      <header className="flex flex-col gap-1">
        <h2 id="signals-heading" className="text-xl font-semibold tracking-tight">
          {ROLE_HEADING[role]}
        </h2>
        <p className="text-muted-foreground text-sm">{ROLE_DESCRIPTION[role]}</p>
      </header>
      <ul className="flex flex-col gap-2">
        {enriched.map(({ signal, label }) => (
          <li key={signal.id}>
            <Card size="sm" className="flex flex-row items-start gap-3 p-3">
              {signal.kind === "student-corporate" ? (
                <Briefcase aria-hidden="true" className="text-muted-foreground mt-1 size-4 shrink-0" />
              ) : (
                <Handshake aria-hidden="true" className="text-muted-foreground mt-1 size-4 shrink-0" />
              )}
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{label}</p>
                  <Badge
                    variant={signal.status === "completed" ? "secondary" : "outline"}
                    className="shrink-0"
                  >
                    {signal.status === "completed" ? (
                      <>
                        <CircleCheck aria-hidden="true" className="size-3" />
                        Completed
                      </>
                    ) : (
                      <>
                        <CircleDot aria-hidden="true" className="size-3" />
                        Active
                      </>
                    )}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs">
                  {signal.summary} · {relativeTime(signal.asOf)}
                </p>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}