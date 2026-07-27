// Phase 1.3 (ticket 014) will migrate this to the personas table; consumers
// should only import via the Persona type.
export type PersonaRole = "student" | "club" | "corporate";
export interface Persona {
  id: string;
  name: string;
  role: PersonaRole;
  institution: string;
  scenario: string;
  heroFlag: true;
}
export const HERO_PERSONAS: readonly Persona[] = [
  { id: "tasnim", name: "Tasnim Hossain", role: "student",
    institution: "BRAC University",
    scenario: "Final-year CS student looking for ML internships in Dhaka.",
    heroFlag: true },
  { id: "nsu-robotics", name: "NSU Robotics Club", role: "club",
    institution: "North South University",
    scenario: "Engineering club seeking sponsors for an inter-university robotics showdown.",
    heroFlag: true },
  { id: "bkash", name: "bKash People Team", role: "corporate",
    institution: "bKash Limited",
    scenario: "Hiring data and ML interns; sponsoring STEM outreach events.",
    heroFlag: true },
] as const;