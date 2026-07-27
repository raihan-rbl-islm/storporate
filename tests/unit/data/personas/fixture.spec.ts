import { describe, expect, it } from "vitest";
import {
  PERSONA_FIXTURE,
  FIXTURE_DISCLAIMER,
  HERO_PERSONAS,
} from "@/data/personas";

describe("PERSONA_FIXTURE", () => {
  it("has 12 students", () => {
    expect(PERSONA_FIXTURE.students).toHaveLength(12);
  });

  it("has 6 clubs", () => {
    expect(PERSONA_FIXTURE.clubs).toHaveLength(6);
  });

  it("has 5 corporates", () => {
    expect(PERSONA_FIXTURE.corporates).toHaveLength(5);
  });

  it("preserves the hero trio as heroes", () => {
    const studentHeroes = PERSONA_FIXTURE.students.filter(
      (s) => s.heroFlag,
    );
    const clubHeroes = PERSONA_FIXTURE.clubs.filter((c) => c.heroFlag);
    const corporateHeroes = PERSONA_FIXTURE.corporates.filter(
      (c) => c.heroFlag,
    );
    expect(studentHeroes.map((s) => s.id)).toEqual(["tasnim"]);
    expect(clubHeroes.map((c) => c.id)).toEqual(["nsu-robotics"]);
    expect(corporateHeroes.map((c) => c.id)).toEqual(["bkash"]);
  });

  it("marks every persona fixture_disclaimer_required (all real orgs)", () => {
    for (const s of PERSONA_FIXTURE.students)
      expect(s.fixtureDisclaimerRequired).toBe(true);
    for (const c of PERSONA_FIXTURE.clubs)
      expect(c.fixtureDisclaimerRequired).toBe(true);
    for (const co of PERSONA_FIXTURE.corporates)
      expect(co.fixtureDisclaimerRequired).toBe(true);
  });

  it("has unique ids within each table", () => {
    const studentIds = PERSONA_FIXTURE.students.map((s) => s.id);
    const clubIds = PERSONA_FIXTURE.clubs.map((c) => c.id);
    const corporateIds = PERSONA_FIXTURE.corporates.map((c) => c.id);
    expect(new Set(studentIds).size).toBe(studentIds.length);
    expect(new Set(clubIds).size).toBe(clubIds.length);
    expect(new Set(corporateIds).size).toBe(corporateIds.length);
  });
});

describe("FIXTURE_DISCLAIMER", () => {
  it("matches the verbatim Appendix A string", () => {
    expect(FIXTURE_DISCLAIMER).toBe(
      "Personas and organizations are illustrative fixtures. Named universities and companies appear for scenario realism only and do not imply partnership, endorsement, or audited employment or sponsorship data.",
    );
  });
});

describe("HERO_PERSONAS (legacy fallback)", () => {
  it("contains the 3 hero entries with binding identities", () => {
    expect(HERO_PERSONAS.map((p) => p.id)).toEqual([
      "tasnim",
      "nsu-robotics",
      "bkash",
    ]);
    expect(HERO_PERSONAS[0].name).toBe("Tasnim Hossain");
    expect(HERO_PERSONAS[1].name).toBe("NSU Robotics Club");
    expect(HERO_PERSONAS[2].name).toBe("bKash People Team");
  });
});
