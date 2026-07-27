import { describe, expect, it, vi, beforeEach } from "vitest";

const { selectMock, fromMock, whereMock, orderByMock, limitMock } =
  vi.hoisted(() => ({
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
  it("returns a student row by id", async () => {
    chainReturning([
      {
        id: "tasnim",
        fullName: "Tasnim Hossain",
        heroFlag: true,
        fixtureDisclaimerRequired: true,
      },
    ]);
    const p = await getPersonaById("tasnim");
    expect(p).toEqual({
      id: "tasnim",
      name: "Tasnim Hossain",
      role: "student",
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
        heroFlag: true,
        fixtureDisclaimerRequired: true,
      },
    ]);
    const p = await getPersonaById("nsu-robotics");
    expect(p).toEqual({
      id: "nsu-robotics",
      name: "NSU Robotics Club",
      role: "club",
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
        heroFlag: true,
        fixtureDisclaimerRequired: true,
      },
    ]);
    const p = await getDefaultPersonaForRole("student");
    expect(p?.id).toBe("tasnim");
    expect(p?.role).toBe("student");
  });

  it("returns the first hero club", async () => {
    chainOrderedReturning([
      {
        id: "nsu-robotics",
        clubName: "NSU Robotics Club",
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
        heroFlag: true,
        fixtureDisclaimerRequired: true,
      },
    ]);
    const p = await getDefaultPersonaForRole("corporate");
    expect(p?.id).toBe("bkash");
  });
});

describe("getAllHeroPersonas", () => {
  it("returns one row per role from the DB", async () => {
    chainUnfilteredReturning([
      {
        id: "tasnim",
        fullName: "Tasnim Hossain",
        heroFlag: true,
        fixtureDisclaimerRequired: true,
      },
    ]);
    chainUnfilteredReturning([
      {
        id: "nsu-robotics",
        clubName: "NSU Robotics Club",
        heroFlag: true,
        fixtureDisclaimerRequired: true,
      },
    ]);
    chainUnfilteredReturning([
      {
        id: "bkash",
        organizationName: "bKash People Team",
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
  });
});
