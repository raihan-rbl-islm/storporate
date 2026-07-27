export type SignalStatus = "active" | "completed";

export interface CollaborationSignal {
  id: string;
  kind: "student-corporate" | "club-corporate";
  /** Persona ID of the student or club. */
  personaId: string;
  /** Corporate fixture ID. */
  corporateId: string;
  status: SignalStatus;
  /** ISO date string. Stays static so the demo is reproducible. */
  asOf: string;
  /** Short factual summary. No quotes, no testimonials. */
  summary: string;
}

/**
 * Static Demo signals. NOT a live feed — every entry is a prepared
 * fixture, identical on every render. Always labeled as Demo data on
 * the surface that renders them.
 *
 * IDs reference real persona fixtures from `data/personas.ts`. If a
 * referenced persona is removed or renamed, remove the signal here.
 */
// Persona + corporate IDs reference `data/personas.ts` directly. The IDs
// below were verified against the fixture on plan creation: `tasnim`,
// `rumi-ahmed`, `sadia-karim` exist as students; `brac-debate`,
// `nsu-robotics`, `buet-mars-rover` exist as clubs; `bkash`,
// `grameenphone`, `unilever-bd` exist as corporates.
export const studentSignals: readonly CollaborationSignal[] = [
  {
    id: "sig-s-001",
    kind: "student-corporate",
    personaId: "tasnim",
    corporateId: "bkash",
    status: "active",
    asOf: "2026-07-25",
    summary: "Tasnim opened an inquiry with bKash · ML Intern.",
  },
  {
    id: "sig-s-002",
    kind: "student-corporate",
    personaId: "rumi-ahmed",
    corporateId: "grameenphone",
    status: "completed",
    asOf: "2026-07-12",
    summary: "Rumi completed a Backend Engineering project with Grameenphone.",
  },
  {
    id: "sig-s-003",
    kind: "student-corporate",
    personaId: "sadia-karim",
    corporateId: "unilever-bd",
    status: "active",
    asOf: "2026-07-20",
    summary: "Sadia started a Sustainability Intern track at Unilever Bangladesh.",
  },
];

export const clubSignals: readonly CollaborationSignal[] = [
  {
    id: "sig-c-001",
    kind: "club-corporate",
    personaId: "brac-debate",
    corporateId: "bkash",
    status: "active",
    asOf: "2026-07-18",
    summary: "BRAC University Debate Club opened a sponsorship conversation with bKash.",
  },
  {
    id: "sig-c-002",
    kind: "club-corporate",
    personaId: "nsu-robotics",
    corporateId: "grameenphone",
    status: "completed",
    asOf: "2026-07-05",
    summary: "NSU Robotics Club wrapped a hackathon sponsored by Grameenphone.",
  },
  {
    id: "sig-c-003",
    kind: "club-corporate",
    personaId: "buet-mars-rover",
    corporateId: "unilever-bd",
    status: "active",
    asOf: "2026-07-22",
    summary: "BUET Mars Rover Team invited Unilever Bangladesh to its upcoming showcase.",
  },
];

export const corporateSignals: readonly CollaborationSignal[] = [
  {
    id: "sig-co-001",
    kind: "student-corporate",
    personaId: "tasnim",
    corporateId: "bkash",
    status: "active",
    asOf: "2026-07-25",
    summary: "Tasnim opened an inquiry about bKash · ML Intern.",
  },
  {
    id: "sig-co-002",
    kind: "club-corporate",
    personaId: "brac-debate",
    corporateId: "bkash",
    status: "active",
    asOf: "2026-07-18",
    summary: "BRAC University Debate Club opened a sponsorship conversation.",
  },
  {
    id: "sig-co-003",
    kind: "student-corporate",
    personaId: "rumi-ahmed",
    corporateId: "grameenphone",
    status: "completed",
    asOf: "2026-07-12",
    summary: "Rumi completed a Backend Engineering project with Grameenphone.",
  },
];
