import type { CorporateFixture } from "@/data/personas";

/**
 * Structural input for the Student→Corporate matcher.
 *
 * Only the two list-shaped columns of a student row are scored:
 *   - skills            (+2 per overlap with corporate.talentNeeds)
 *   - careerInterests   (+3 per overlap with talentNeeds or description)
 *
 * Empty / undefined arrays contribute zero and never throw; students
 * without either field receive score 0 from the algorithm itself (a
 * collaborationIntent boost may still apply).
 */
export interface StudentMatchInput {
  skills?: readonly string[];
  careerInterests?: readonly string[];
}

export interface RankedMatch {
  corporate: CorporateFixture;
  score: number;
  topReasons: readonly string[];
}

/**
 * Per-signal scoring breakdown for a single (student, corporate) pair.
 * `matchedSkills` and `matchedInterests` are display-cased student tokens
 * in input order, deduplicated. `score` is the raw integer sum
 * (`matchedSkills.length * SKILL_WEIGHT + matchedInterests.length *
 * INTEREST_WEIGHT + (hiringIntent ? HIRING_INTENT_BONUS : 0)`); never
 * rounded, never normalized.
 */
export interface MatchBreakdown {
  readonly score: number;
  readonly matchedSkills: readonly string[];
  readonly matchedInterests: readonly string[];
  readonly hiringIntent: boolean;
}

const MAX_REASONS = 3;
const SKILL_WEIGHT = 2;
const INTEREST_WEIGHT = 3;
const HIRING_INTENT_BONUS = 1;

/**
 * Trim, lowercase, dedup while preserving first-seen casing for display.
 * Returns `{ set, display }` so the scorer can match on the normalized key
 * but reason-chips use the surface-form the user typed.
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
 * Compute the per-signal breakdown for a single (student, corporate) pair.
 * Used by both `rankCorporateMatchesFor` (list page) and the public
 * `scoreMatchBreakdown` (rationale detail page) so the two stay in lockstep:
 * for any pair, `RankedMatch.score === computeBreakdown(...).score`.
 */
function computeBreakdown(
  student: StudentMatchInput,
  corporate: CorporateFixture,
  skills: { set: Set<string>; display: Map<string, string> },
  interests: { set: Set<string>; display: Map<string, string> },
): MatchBreakdown {
  const matchedSkills: string[] = [];
  const matchedInterests: string[] = [];

  const talentNeedsSet = new Set(
    (corporate.talentNeeds ?? []).map((s) => s.trim().toLowerCase()),
  );
  const descriptionLower = (corporate.description ?? "").toLowerCase();

  for (const norm of skills.set) {
    if (talentNeedsSet.has(norm)) {
      matchedSkills.push(skills.display.get(norm) ?? norm);
    }
  }

  for (const norm of interests.set) {
    const hit =
      talentNeedsSet.has(norm) ||
      (norm.length > 0 && descriptionLower.includes(norm));
    if (hit) {
      matchedInterests.push(interests.display.get(norm) ?? norm);
    }
  }

  const hiringIntent =
    corporate.collaborationIntent === "hiring" ||
    corporate.collaborationIntent === "both";

  let score =
    matchedSkills.length * SKILL_WEIGHT +
    matchedInterests.length * INTEREST_WEIGHT;
  if (hiringIntent) score += HIRING_INTENT_BONUS;

  return {
    score,
    matchedSkills,
    matchedInterests,
    hiringIntent,
  };
}

/**
 * Deterministic Student→Corporate scorer.
 *
 * Scoring rules (per corporate):
 *   - Skill overlap with talentNeeds          → +2 each (unique normalized)
 *   - Interest overlap with talentNeeds       → +3 each (unique normalized)
 *     or with description.toLowerCase()       → +3 each (unique normalized)
 *   - collaborationIntent ∈ {"hiring","both"} → +1
 *
 * Tie-break: corporate.id ascending. Empty/undefined inputs contribute
 * nothing and never throw. The top N=MAX_REASONS reasons (across both
 * skill and interest buckets) are returned in input order.
 */
export function rankCorporateMatchesFor(
  student: StudentMatchInput,
  corporates: readonly CorporateFixture[],
): readonly RankedMatch[] {
  const skills = normalizeList(student.skills);
  const interests = normalizeList(student.careerInterests);

  const ranked: RankedMatch[] = corporates.map((corporate) => {
    const breakdown = computeBreakdown(student, corporate, skills, interests);
    const reasons: string[] = [];
    for (const s of breakdown.matchedSkills) {
      if (reasons.length >= MAX_REASONS) break;
      reasons.push(`Matches your skills: ${s}`);
    }
    for (const i of breakdown.matchedInterests) {
      if (reasons.length >= MAX_REASONS) break;
      reasons.push(`Aligns with your interest in ${i}`);
    }
    return {
      corporate,
      score: breakdown.score,
      topReasons: reasons.slice(0, MAX_REASONS),
    };
  });

  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.corporate.id.localeCompare(b.corporate.id);
  });
  return ranked;
}

/**
 * Public per-pair scorer: returns the same breakdown the list page uses
 * to rank and badge each match. Consumed by the rationale detail page
 * (`/dashboard/matches/[corporateId]`) so its score badge and signal
 * blocks stay in lockstep with the list view.
 */
export function scoreMatchBreakdown(
  student: StudentMatchInput,
  corporate: CorporateFixture,
): MatchBreakdown {
  return computeBreakdown(
    student,
    corporate,
    normalizeList(student.skills),
    normalizeList(student.careerInterests),
  );
}
