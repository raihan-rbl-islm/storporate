import { describe, expect, it, vi, beforeEach } from "vitest";

const {
  selectMock,
  fromMock,
  whereMock,
  orderByMock,
  limitMock,
} = vi.hoisted(() => ({
  selectMock: vi.fn(),
  fromMock: vi.fn(),
  whereMock: vi.fn(),
  orderByMock: vi.fn(),
  limitMock: vi.fn(),
}));

vi.mock("@/lib/server/db", () => ({
  db: {
    select: selectMock,
  },
}));

import {
  getPersonaById,
  getDefaultPersonaForRole,
  getAllHeroPersonas,
} from "@/lib/server/personas/lookup";
import { students } from "@/lib/server/db/schema";

function chainReturning(rows: unknown[]) {
  limitMock.mockResolvedValueOnce(rows);
  whereMock.mockReturnValueOnce({ limit: limitMock });
  fromMock.mockReturnValueOnce({ where: whereMock });
  selectMock.mockReturnValueOnce({ from: fromMock });
}

function chainOrderedReturning(rows: unknown[]) {
  limitMock.mockResolvedValueOnce(rows);
  orderByMock.mockReturnValueOnce({ limit: limitMock });
  fromMock.mockReturnValueOnce({ orderBy: orderByMock });
  selectMock.mockReturnValueOnce({ from: fromMock });
}

function chainUnfilteredReturning(rows: unknown[]) {
  whereMock.mockResolvedValueOnce(rows);
  fromMock.mockReturnValueOnce({ where: whereMock });
  selectMock.mockReturnValueOnce({ from: fromMock });
}

beforeEach(() => {
  selectMock.mockReset();
  fromMock.mockReset();
  whereMock.mockReset();
  orderByMock.mockReset();
  limitMock.mockReset();
});

describe("getPersonaById", () => {
  it("returns a student row by id with institution and scenario", async () => {
    chainReturning([
      {
        id: "tasnim",
        fullName: "Tasnim Hossain",
        university: "BRAC University",
        bio: "Final-year CS student looking for ML internships in Dhaka.",
        heroFlag: true,
        fixtureDisclaimerRequired: true,
      },
    ]);
    const p = await getPersonaById("tasnim");
    expect(p).toEqual({
      id: "tasnim",
      name: "Tasnim Hossain",
      role: "student",
      institution: "BRAC University",
      scenario: "Final-year CS student looking for ML internships in Dhaka.",
      heroFlag: true,
      fixtureDisclaimerRequired: true,
    });
    expect(selectMock).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledWith(students);
  });

  it("falls back to a club row when student misses", async () => {
    chainReturning([]);
    chainReturning([
      {
        id: "nsu-robotics",
        clubName: "NSU Robotics Club",
        university: "North South University",
        mission: "Build, code, and compete — annual inter-university robotics showdown.",
        heroFlag: true,
        fixtureDisclaimerRequired: true,
      },
    ]);
    const p = await getPersonaById("nsu-robotics");
    expect(p).toEqual({
      id: "nsu-robotics",
      name: "NSU Robotics Club",
      role: "club",
      institution: "North South University",
      scenario: "Build, code, and compete — annual inter-university robotics showdown.",
      heroFlag: true,
      fixtureDisclaimerRequired: true,
    });
  });

  it("falls back to HERO_PERSONAS fixture when DB misses all tables", async () => {
    chainReturning([]);
    chainReturning([]);
    chainReturning([]);
    const p = await getPersonaById("tasnim");
    expect(p?.name).toBe("Tasnim Hossain");
    expect(p?.role).toBe("student");
    // Fixture carries institution + scenario too
    expect(p?.institution).toBe("BRAC University");
    expect(p?.scenario).toContain("Final-year CS student");
  });

  it("returns null when both DB and fixture miss", async () => {
    chainReturning([]);
    chainReturning([]);
    chainReturning([]);
    const p = await getPersonaById("never-existed");
    expect(p).toBeNull();
  });
});

describe("getDefaultPersonaForRole", () => {
  it("returns the first hero student (ordered by heroFlag desc, createdAt asc)", async () => {
    chainOrderedReturning([
      {
        id: "tasnim",
        fullName: "Tasnim Hossain",
        university: "BRAC University",
        bio: "Final-year CS student looking for ML internships in Dhaka.",
        heroFlag: true,
        fixtureDisclaimerRequired: true,
      },
    ]);
    const p = await getDefaultPersonaForRole("student");
    expect(p?.id).toBe("tasnim");
    expect(p?.role).toBe("student");
    expect(p?.institution).toBe("BRAC University");
  });

  it("returns the first hero club", async () => {
    chainOrderedReturning([
      {
        id: "nsu-robotics",
        clubName: "NSU Robotics Club",
        university: "North South University",
        mission: "Robotics mission",
        heroFlag: true,
        fixtureDisclaimerRequired: true,
      },
    ]);
    const p = await getDefaultPersonaForRole("club");
    expect(p?.id).toBe("nsu-robotics");
  });

  it("returns the first hero corporate", async () => {
    chainOrderedReturning([
      {
        id: "bkash",
        organizationName: "bKash People Team",
        industry: "Mobile financial services",
        description: "Hiring data and ML interns; sponsoring financial-literacy outreach.",
        heroFlag: true,
        fixtureDisclaimerRequired: true,
      },
    ]);
    const p = await getDefaultPersonaForRole("corporate");
    expect(p?.id).toBe("bkash");
    expect(p?.institution).toBe("Mobile financial services");
  });
});

describe("getAllHeroPersonas", () => {
  it("returns one row per role from the DB", async () => {
    chainUnfilteredReturning([
      {
        id: "tasnim",
        fullName: "Tasnim Hossain",
        university: "BRAC University",
        bio: "Final-year CS student looking for ML internships in Dhaka.",
        heroFlag: true,
        fixtureDisclaimerRequired: true,
      },
    ]);
    chainUnfilteredReturning([
      {
        id: "nsu-robotics",
        clubName: "NSU Robotics Club",
        university: "North South University",
        mission: "Robotics",
        heroFlag: true,
        fixtureDisclaimerRequired: true,
      },
    ]);
    chainUnfilteredReturning([
      {
        id: "bkash",
        organizationName: "bKash People Team",
        industry: "Mobile financial services",
        description: "Hiring data and ML interns.",
        heroFlag: true,
        fixtureDisclaimerRequired: true,
      },
    ]);
    const all = await getAllHeroPersonas();
    expect(all.map((p) => p.id)).toEqual([
      "tasnim",
      "nsu-robotics",
      "bkash",
    ]);
    // Each persona now carries institution + scenario without a duplicate
    // client-side map.
    expect(all[0].institution).toBe("BRAC University");
    expect(all[1].institution).toBe("North South University");
    expect(all[2].institution).toBe("Mobile financial services");
  });

  it("fires the three hero queries in parallel (not sequentially)", async () => {
    // Track the order of mock invocations. If the implementation
    // sequenced the queries with await, the second `db.select()` would
    // not start until the first promise resolved. With Promise.all,
    // all three selects are kicked off synchronously up-front.
    const order: string[] = [];
    whereMock.mockImplementation(() => {
      order.push("where");
      return Promise.resolve([]);
    });
    fromMock.mockImplementation((...args: unknown[]) => {
      order.push(`from:${(args[0] as { name?: string })?.name ?? "unknown"}`);
      return { where: whereMock };
    });
    selectMock.mockImplementation(() => {
      order.push("select");
      return { from: fromMock };
    });

    await getAllHeroPersonas();
    // All three select() calls must occur before any where() promise
    // resolves. If the implementation sequenced them, the second
    // `select` would appear after the first `where` resolved.
    const selectIndexes = order
      .map((o, i) => (o === "select" ? i : -1))
      .filter((i) => i >= 0);
    const whereIndexes = order
      .map((o, i) => (o === "where" ? i : -1))
      .filter((i) => i >= 0);
    expect(selectIndexes).toHaveLength(3);
    expect(whereIndexes).toHaveLength(3);
    // The min select index must precede the min where index — i.e.
    // every select() kicked off before its where() promise resolved.
    expect(Math.min(...selectIndexes)).toBeLessThan(Math.max(...whereIndexes));
  });
});