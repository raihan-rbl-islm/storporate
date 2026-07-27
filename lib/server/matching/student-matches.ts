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

  const ranked: RankedMatch[] = [];

  for (const corporate of corporates) {
    let score = 0;
    const reasons: string[] = [];

    const talentNeedsSet = new Set(
      (corporate.talentNeeds ?? []).map((s) => s.trim().toLowerCase()),
    );
    const descriptionLower = (corporate.description ?? "").toLowerCase();

    // Skills: +2 per unique normalized skill present in talentNeeds.
    for (const norm of skills.set) {
      if (talentNeedsSet.has(norm)) {
        score += SKILL_WEIGHT;
        if (reasons.length < MAX_REASONS) {
          reasons.push(
            `Matches your skills: ${skills.display.get(norm) ?? norm}`,
          );
        }
      }
    }

    // Interests: +3 per unique normalized interest in talentNeeds OR in
    // description.toLowerCase(). Substring match keeps punctuation /
    // casing tolerant; the normalized interest itself is the unit.
    const descriptionContains = (norm: string): boolean => {
      if (norm.length === 0) return false;
      return descriptionLower.includes(norm);
    };

    for (const norm of interests.set) {
      const hit =
        talentNeedsSet.has(norm) || descriptionContains(norm);
      if (hit) {
        score += INTEREST_WEIGHT;
        if (reasons.length < MAX_REASONS) {
          reasons.push(
            `Aligns with your interest in ${
              interests.display.get(norm) ?? norm
            }`,
          );
        }
      }
    }

    if (corporate.collaborationIntent === "hiring" ||
        corporate.collaborationIntent === "both") {
      score += HIRING_INTENT_BONUS;
    }

    ranked.push({
      corporate,
      score,
      topReasons: reasons.slice(0, MAX_REASONS),
    });
  }

  // Sort: score desc; tie → corporate.id asc.
  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.corporate.id.localeCompare(b.corporate.id);
  });

  return ranked;
}
