import "server-only";
import { z } from "zod";
// Import PersonaRole from the canonical type module rather than from
// `@/lib/server/personas/current` to avoid the circular re-export
// between current.ts -> reset.ts -> schemas.ts.
import type { PersonaRole } from "@/data/personas";

const requiredText = z.string().transform((s) => s.trim()).pipe(
  z.string().min(1, "Required"),
);
const optionalText = z.string();

export const studentSchema = z.object({
  fullName: requiredText,
  university: requiredText,
  studyProgram: requiredText,
  expectedGraduation: requiredText,
  location: requiredText,
  bio: optionalText,
  skills: z.array(requiredText).min(1, "Add at least one skill"),
  careerInterests: z
    .array(requiredText)
    .min(1, "Add at least one interest"),
});

export const clubSchema = z.object({
  clubName: requiredText,
  university: requiredText,
  categories: z.array(requiredText).min(1, "Add at least one category"),
  mission: optionalText,
  audienceReachLabel: requiredText,
  eventFocus: z.array(requiredText).min(1, "Add at least one focus area"),
  sponsorshipNeeds: z
    .array(requiredText)
    .min(1, "Add at least one sponsorship need"),
  location: requiredText,
  contactRole: requiredText,
});

export const corporateSchema = z.object({
  organizationName: requiredText,
  industry: requiredText,
  location: requiredText,
  description: optionalText,
  talentNeeds: z
    .array(requiredText)
    .min(1, "Add at least one talent need"),
  sponsorshipInterests: z
    .array(requiredText)
    .min(1, "Add at least one sponsorship interest"),
  csrFocus: z.array(requiredText).min(1, "Add at least one CSR focus area"),
  budgetRange: optionalText,
  collaborationIntent: z.enum(["hiring", "sponsorship", "both"]),
});

export type StudentFormInput = z.infer<typeof studentSchema>;
export type ClubFormInput = z.infer<typeof clubSchema>;
export type CorporateFormInput = z.infer<typeof corporateSchema>;

export function schemaForRole(
  role: PersonaRole,
):
  | typeof studentSchema
  | typeof clubSchema
  | typeof corporateSchema {
  switch (role) {
    case "student":
      return studentSchema;
    case "club":
      return clubSchema;
    case "corporate":
      return corporateSchema;
  }
}