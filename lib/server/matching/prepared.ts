import type {
  ClubFixture,
  CorporateFixture,
  StudentFixture,
} from "@/data/personas";
import {
  getClubFixtures,
  getCorporateFixtures,
  getStudentFixtures,
} from "@/lib/server/personas/lookup";
import type { RankedMatch } from "./student-matches";
import type { RankedClubMatch } from "./club-matches";
import type { RankedStudentCandidate } from "./corporate-student-matches";
import type { RankedClubCandidate } from "./corporate-club-matches";

export type Perspective =
  | "student-corporate" // student → ranked corporates
  | "club-corporate" // club    → ranked corporates
  | "corporate-student" // corporate → ranked students
  | "corporate-club"; // corporate → ranked clubs

/**
 * Returns a small, scenario-consistent set of prepared matches for a
 * given perspective. Used as a fallback when the matcher throws an
 * error — the UI must display <PreparedResultsBanner> so the user
 * knows the results come from prepared scenario data.
 *
 * Returns the same shape as the corresponding `rank*` function
 * (raw integer `score`, plain `topReasons: readonly string[]`,
 * `source: "prepared"`). Hero persona (Tasnim) sees bKash first.
 */
export function getPreparedMatchesFor(
  perspective: "student-corporate",
  student: StudentFixture,
): readonly RankedMatch[];
export function getPreparedMatchesFor(
  perspective: "club-corporate",
  club: ClubFixture,
): readonly RankedClubMatch[];
export function getPreparedMatchesFor(
  perspective: "corporate-student",
  corporate: CorporateFixture,
): readonly RankedStudentCandidate[];
export function getPreparedMatchesFor(
  perspective: "corporate-club",
  corporate: CorporateFixture,
): readonly RankedClubCandidate[];
export function getPreparedMatchesFor(
  perspective: Perspective,
  persona: StudentFixture | ClubFixture | CorporateFixture,
):
  | readonly RankedMatch[]
  | readonly RankedClubMatch[]
  | readonly RankedStudentCandidate[]
  | readonly RankedClubCandidate[] {
  const corporates = getCorporateFixtures();

  if (perspective === "student-corporate") {
    const student = persona as StudentFixture;
    const byId = (id: string, fallbackIndex: number): CorporateFixture =>
      corporates.find((c) => c.id === id) ?? corporates[fallbackIndex];

    if (student.heroFlag) {
      // Hero path: bKash first, then Grameenphone, then Unilever Bangladesh.
      // Scores mirror the live scorer output (raw integer sums).
      return [
        {
          corporate: byId("bkash", 0),
          score: 8, // matches the live scorer for Tasnim → bKash
          topReasons: [
            "Matches your skills: Python",
            "Matches your skills: TensorFlow",
            "Aligns with your interest in machine learning",
          ],
          source: "prepared",
        },
        {
          corporate: byId("grameenphone", 1),
          score: 1,
          topReasons: ["Matches your skills: Python"],
          source: "prepared",
        },
        {
          corporate: byId("unilever-bd", 2),
          score: 0,
          topReasons: [],
          source: "prepared",
        },
      ];
    }
    // Generic path: top three corporates by stable fixture order.
    return corporates.slice(0, 3).map((corporate, idx) => ({
      corporate,
      score: idx === 0 ? 1 : 0,
      topReasons: [],
      source: "prepared" as const,
    }));
  }

  if (perspective === "club-corporate") {
    return corporates.slice(0, 3).map((corporate, idx) => ({
      corporate,
      score: idx === 0 ? 2 : 0,
      topReasons: [],
      source: "prepared" as const,
    }));
  }

  if (perspective === "corporate-student") {
    const students = getStudentFixtures();
    return students.slice(0, 3).map((student, idx) => ({
      student,
      score: idx === 0 ? 5 : 1,
      topReasons: [],
      source: "prepared" as const,
    }));
  }

  // corporate-club
  const clubs = getClubFixtures();
  return clubs.slice(0, 3).map((club, idx) => ({
    club,
    score: idx === 0 ? 3 : 0,
    topReasons: [],
    source: "prepared" as const,
  }));
}
