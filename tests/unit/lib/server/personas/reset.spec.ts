import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/server/db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

import { db } from "@/lib/server/db";
import { resetPersonaToFixture } from "@/lib/server/personas/reset";
import { students } from "@/lib/server/db/schema";
import { PERSONA_FIXTURE } from "@/data/personas";

describe("resetPersonaToFixture", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns changed:false when personaId is not in the fixture", async () => {
    const out = await resetPersonaToFixture("student", "unknown-id");
    expect(out).toEqual({ changed: false });
    expect(db.update).not.toHaveBeenCalled();
  });

  it("returns changed:true when row differs from fixture and bumps updatedAt", async () => {
    const fixture = PERSONA_FIXTURE.students.find((p) => p.id === "tasnim")!;
    const editedRow = {
      id: "tasnim",
      fullName: fixture.fullName,
      university: fixture.university,
      studyProgram: fixture.studyProgram,
      expectedGraduation: fixture.expectedGraduation,
      location: "Chattogram", // edited
      bio: fixture.bio,
      skills: fixture.skills,
      careerInterests: fixture.careerInterests,
      heroFlag: fixture.heroFlag,
      fixtureDisclaimerRequired: fixture.fixtureDisclaimerRequired,
      createdAt: new Date("2025-01-01T00:00:00Z"),
      updatedAt: new Date("2025-01-02T00:00:00Z"),
    };
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: () => ({ where: () => ({ limit: async () => [editedRow] }) }),
    });
    const setMock = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({ set: setMock });
    const out = await resetPersonaToFixture("student", "tasnim");
    expect(out).toEqual({ changed: true });
    expect(db.update).toHaveBeenCalledTimes(1);
    const setArg = (db.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const setValues = setMock.mock.calls[0][0];
    expect(setArg).toBe(students);
    expect(setValues).toMatchObject({ location: fixture.location });
    expect(setValues.updatedAt).toBeInstanceOf(Date);
  });

  it("returns changed:false and skips update when row already matches fixture", async () => {
    const fixture = PERSONA_FIXTURE.students.find((p) => p.id === "tasnim")!;
    const matchingRow = {
      id: "tasnim",
      fullName: fixture.fullName,
      university: fixture.university,
      studyProgram: fixture.studyProgram,
      expectedGraduation: fixture.expectedGraduation,
      location: fixture.location,
      bio: fixture.bio,
      skills: fixture.skills,
      careerInterests: fixture.careerInterests,
      heroFlag: fixture.heroFlag,
      fixtureDisclaimerRequired: fixture.fixtureDisclaimerRequired,
      createdAt: new Date("2025-01-01T00:00:00Z"),
      updatedAt: new Date("2025-01-01T00:00:00Z"),
    };
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: () => ({ where: () => ({ limit: async () => [matchingRow] }) }),
    });
    const out = await resetPersonaToFixture("student", "tasnim");
    expect(out).toEqual({ changed: false });
    expect(db.update).not.toHaveBeenCalled();
  });

  it("returns changed:false when row is missing from the DB", async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: () => ({ where: () => ({ limit: async () => [] }) }),
    });
    const out = await resetPersonaToFixture("student", "tasnim");
    expect(out).toEqual({ changed: false });
    expect(db.update).not.toHaveBeenCalled();
  });

  it("also resets club and corporate personas via the same path", async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: () => ({ where: () => ({ limit: async () => [] }) }),
    });
    expect(await resetPersonaToFixture("club", "nsu-robotics")).toEqual({
      changed: false,
    });
    expect(await resetPersonaToFixture("corporate", "bkash")).toEqual({
      changed: false,
    });
  });
});
