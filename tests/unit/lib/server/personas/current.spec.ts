import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/server/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

import { cookies } from "next/headers";
import { db } from "@/lib/server/db";
import { students } from "@/lib/server/db/schema";
import { getCurrentPersona } from "@/lib/server/personas/current";

describe("getCurrentPersona", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns null when role cookie is missing", async () => {
    (cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      get: (name: string) =>
        name === "personaId" ? { value: "tasnim" } : undefined,
    });
    expect(await getCurrentPersona()).toBeNull();
  });

  it("returns null when personaId cookie is missing", async () => {
    (cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      get: (name: string) =>
        name === "role" ? { value: "student" } : undefined,
    });
    expect(await getCurrentPersona()).toBeNull();
  });

  it("returns null when role cookie is not in the allow-list", async () => {
    (cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      get: (name: string) =>
        name === "role"
          ? { value: "admin" }
          : name === "personaId"
            ? { value: "tasnim" }
            : undefined,
    });
    expect(await getCurrentPersona()).toBeNull();
  });

  it("returns the student row when valid cookies are present", async () => {
    (cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      get: (name: string) =>
        name === "role"
          ? { value: "student" }
          : name === "personaId"
            ? { value: "tasnim" }
            : undefined,
    });
    const row = {
      id: "tasnim",
      fullName: "Tasnim Hossain",
      university: "BRAC University",
      bio: "Final-year CS student looking for ML internships in Dhaka.",
      heroFlag: true,
      fixtureDisclaimerRequired: true,
      createdAt: new Date("2025-01-01T00:00:00Z"),
      updatedAt: new Date("2025-01-01T00:00:00Z"),
    };
    const selectMock = db.select as ReturnType<typeof vi.fn>;
    const fromMock = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: async () => [row],
      }),
    });
    selectMock.mockReturnValueOnce({ from: fromMock });
    const result = await getCurrentPersona();
    expect(result).toEqual({ kind: "student", row, role: "student" });
    expect(selectMock).toHaveBeenCalledTimes(1);
    // Verify we hit the students table specifically.
    const fromCall = selectMock.mock.results[0].value.from;
    expect(fromCall).toHaveBeenCalled();
    expect(fromCall.mock.calls[0][0]).toBe(students);
  });
});
