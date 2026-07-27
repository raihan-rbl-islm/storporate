import type { StudentFixture } from "@/data/personas";

/**
 * Structural input for the Corporate→Student matcher.
 *
 * Only the two list-shaped columns of a corporate row are scored:
 *   - talentNeeds        → matched against student.skills        (+2 each)
 *   - talentNeeds        → matched against student.careerInterests (+3 each)
 *
 * Empty / undefined arrays contribute zero and never throw. The
 * collaborationIntent field is used only to compute the hiringIntent
 * bonus; a corporate whose intent is "sponsorship" receives no bonus.
 */
export interface CorporateStudentMatchInput {
  // Mutable array types (not `readonly string[]`) so a Drizzle row's
  // `talentNeeds: string[]` (per `lib/server/db/schema.ts:121`) can be
  // passed directly without a cast.
  talentNeeds?: string[];
  // `collaborationIntent` is widened to `string` so a Drizzle row's
  // `text("collaboration_intent")` column (which infers as plain
  // `string`) can be passed directly without a cast. The runtime check
  // below only awards the hiring bonus when the value is one of the
  // known intent tokens; unknown values are treated as "no bonus".
  collaborationIntent?: string;
}

export interface RankedStudentCandidate {
  student: StudentFixture;
  score: number;
  topReasons: readonly string[];
}

const MAX_REASONS = 3;
const SKILL_WEIGHT = 2;
const INTEREST_WEIGHT = 3;
const HIRING_INTENT_BONUS = 1;

/**
 * Trim, lowercase, dedup while preserving first-seen casing for display.
 * Returns `{ set, display }` so the scorer can match on the normalized
 * key but reason-chips use the surface-form the user typed.
 */
function normalizeList(
  input: readonly string[] | undefined,
): { set: Set<string>; display: Map<string, string> } {
  const set = new Set<string>();
  const display = new Map<string, string>();
  if (!Array.isArray(input)) return { set, display };
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (trimmed.length === 0) continue;
    const key = trimmed.toLowerCase();
    if (set.has(key)) continue;
    set.add(key);
    if (!display.has(key)) display.set(key, trimmed);
  }
  return { set, display };
}

/**
 * Deterministic Corporate→Student scorer.
 *
 * Scoring rules (per student):
 *   - talentNeeds ∩ student.skills              → +2 each (unique normalized)
 *   - talentNeeds ∩ student.careerInterests     → +3 each (unique normalized)
 *   - collaborationIntent ∈ {"hiring","both"}   → +1
 *
 * Tie-break: student.id ascending. Empty / undefined inputs contribute
 * nothing and never throw. The top N=MAX_REASONS reasons are returned in
 * input order. This file is the corporate-direction counterpart of
 * `student-matches.ts` (which scores student→corporate) — same
 * weighting, same tie-break, mirrored direction.
 */
export function rankStudentsForCorporate(
  corporate: CorporateStudentMatchInput,
  students: readonly StudentFixture[],
): readonly RankedStudentCandidate[] {
  const needs = normalizeList(corporate.talentNeeds);

  const ranked: RankedStudentCandidate[] = students.map((student) => {
    const skills = normalizeList(student.skills);
    const interests = normalizeList(student.careerInterests);

    const matchedSkills: string[] = [];
    for (const norm of skills.set) {
      if (needs.set.has(norm)) {
        matchedSkills.push(skills.display.get(norm) ?? norm);
      }
    }

    const matchedInterests: string[] = [];
    for (const norm of interests.set) {
      if (needs.set.has(norm)) {
        matchedInterests.push(interests.display.get(norm) ?? norm);
      }
    }

    const hiringIntent =
      corporate.collaborationIntent === "hiring" ||
      corporate.collaborationIntent === "both";

    const score =
      matchedSkills.length * SKILL_WEIGHT +
      matchedInterests.length * INTEREST_WEIGHT +
      (hiringIntent ? HIRING_INTENT_BONUS : 0);

    const reasons: string[] = [];
    for (const s of matchedSkills) {
      if (reasons.length >= MAX_REASONS) break;
      reasons.push(`Matches your talent needs: ${s}`);
    }
    for (const i of matchedInterests) {
      if (reasons.length >= MAX_REASONS) break;
      reasons.push(`Aligns with their interest in ${i}`);
    }

    return {
      student,
      score,
      topReasons: reasons.slice(0, MAX_REASONS),
    };
  });

  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.student.id.localeCompare(b.student.id);
  });

  return ranked;
}