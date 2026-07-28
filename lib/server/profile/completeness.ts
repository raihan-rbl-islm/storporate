/**
 * Phase 8.2: profile-completeness scoring for student personas.
 *
 * `computeProfileCompleteness` is a pure function over a Student row +
 * counts of related sub-resources (experiences / achievements /
 * activities). It returns an integer 0..100. The score is intentionally
 * additive — never negative — and capped at 100 even if the rubric sums
 * to more. The breakdown is documented inline so we can tune it without
 * spelunking through the call sites.
 */

import type { students } from "@/lib/server/db/schema";

type StudentRow = typeof students.$inferSelect;

export interface CompletenessInputs {
  /** A single experience row counts as 1 presence. */
  experienceCount: number;
  achievementCount: number;
  activityCount: number;
}

const SCORE = {
  fullName: 5,
  university: 10,
  studyProgram: 10,
  expectedGraduation: 5,
  location: 5,
  bio: 10,
  /** Three or more skills counts as a fully-populated list. */
  skillsAtLeastThree: 15,
  careerInterestsAtLeastThree: 10,
  hasExperience: 10,
  hasAchievement: 10,
  hasActivity: 10,
} as const;

export function computeProfileCompleteness(
  student: StudentRow,
  inputs: CompletenessInputs = { experienceCount: 0, achievementCount: 0, activityCount: 0 },
): number {
  let score = 0;

  // Identity fields. The schema enforces these as NOT NULL with a
  // default of "" for some, so we treat "trimmed non-empty" as present.
  if (student.fullName.trim().length > 0) score += SCORE.fullName;
  if (student.university.trim().length > 0) score += SCORE.university;
  if (student.studyProgram.trim().length > 0) score += SCORE.studyProgram;
  if (student.expectedGraduation.trim().length > 0)
    score += SCORE.expectedGraduation;
  if (student.location.trim().length > 0) score += SCORE.location;
  if (student.bio.trim().length > 0) score += SCORE.bio;

  // List fields. Three items is the rubric threshold — fewer yields zero.
  const skillsCount = Array.isArray(student.skills) ? student.skills.length : 0;
  if (skillsCount >= 3) score += SCORE.skillsAtLeastThree;

  const interestsCount = Array.isArray(student.careerInterests)
    ? student.careerInterests.length
    : 0;
  if (interestsCount >= 3) score += SCORE.careerInterestsAtLeastThree;

  // Sub-resource presence. At least one row in each table.
  if (inputs.experienceCount > 0) score += SCORE.hasExperience;
  if (inputs.achievementCount > 0) score += SCORE.hasAchievement;
  if (inputs.activityCount > 0) score += SCORE.hasActivity;

  if (score > 100) score = 100;
  if (score < 0) score = 0;
  return score;
}

/**
 * Number of distinct sections the student still needs to fill in to reach
 * 100%. We surface this in the UI as a "X sections left to complete" line.
 *
 * The list is hand-curated — it intentionally does NOT mirror the score
 * breakdown one-to-one, because the score weights (e.g. 15 vs 10) are
 * about relative value, not completion steps.
 */
export function sectionsLeftToComplete(
  student: StudentRow,
  inputs: CompletenessInputs,
): string[] {
  const missing: string[] = [];
  if (student.fullName.trim().length === 0) missing.push("full name");
  if (student.university.trim().length === 0) missing.push("university");
  if (student.studyProgram.trim().length === 0)
    missing.push("study program");
  if (student.expectedGraduation.trim().length === 0)
    missing.push("expected graduation");
  if (student.location.trim().length === 0) missing.push("location");
  if (student.bio.trim().length === 0) missing.push("bio");
  if ((student.skills ?? []).length < 3) missing.push("at least 3 skills");
  if ((student.careerInterests ?? []).length < 3)
    missing.push("at least 3 career interests");
  if (inputs.experienceCount === 0) missing.push("an experience");
  if (inputs.achievementCount === 0) missing.push("an achievement");
  if (inputs.activityCount === 0) missing.push("an activity");
  return missing;
}
