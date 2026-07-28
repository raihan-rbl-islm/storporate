import "server-only";

import { z } from "zod";

/**
 * Minimum-required-fields schemas for the post-sign-up onboarding form.
 *
 * These are intentionally narrower than the full persona schemas in
 * `lib/server/personas/schemas.ts`. The full schema enforces every
 * match-relevant field, which is correct for the demo personas (where
 * fixtures need to be populated end-to-end). Real users, by contrast,
 * should be able to land on the dashboard with the absolute minimum
 * filled in and enrich the rest from the edit-profile page later.
 *
 * Concretely, what's been dropped from the minimum set:
 *
 *   - student.bio                  → optional, set to ""
 *   - club.mission                 → optional, set to ""
 *   - corporate.description        → optional, set to ""
 *   - corporate.budgetRange        → optional, defaults to "Undisclosed"
 *
 * Everything else (full name, university/program, location, skills or
 * equivalent, intent) remains required.
 */

const requiredText = z
  .string()
  .transform((s) => s.trim())
  .pipe(z.string().min(1, "Required"));

export const minimumRequiredStudentSchema = z.object({
  fullName: requiredText,
  university: requiredText,
  studyProgram: requiredText,
  expectedGraduation: requiredText,
  location: requiredText,
  skills: z
    .array(requiredText)
    .min(1, "Add at least one skill"),
  careerInterests: z
    .array(requiredText)
    .min(1, "Add at least one interest"),
});
export type StudentMinimumInput = z.infer<typeof minimumRequiredStudentSchema>;

export const minimumRequiredClubSchema = z.object({
  clubName: requiredText,
  university: requiredText,
  categories: z
    .array(requiredText)
    .min(1, "Add at least one category"),
  audienceReachLabel: requiredText,
  eventFocus: z
    .array(requiredText)
    .min(1, "Add at least one focus area"),
  sponsorshipNeeds: z
    .array(requiredText)
    .min(1, "Add at least one sponsorship need"),
  contactRole: requiredText,
});
export type ClubMinimumInput = z.infer<typeof minimumRequiredClubSchema>;

export const minimumRequiredCorporateSchema = z.object({
  organizationName: requiredText,
  industry: requiredText,
  location: requiredText,
  talentNeeds: z
    .array(requiredText)
    .min(1, "Add at least one talent need"),
  sponsorshipInterests: z
    .array(requiredText)
    .min(1, "Add at least one sponsorship interest"),
  csrFocus: z
    .array(requiredText)
    .min(1, "Add at least one CSR focus area"),
  collaborationIntent: z.enum(["hiring", "sponsorship", "both"]),
});
export type CorporateMinimumInput = z.infer<typeof minimumRequiredCorporateSchema>;