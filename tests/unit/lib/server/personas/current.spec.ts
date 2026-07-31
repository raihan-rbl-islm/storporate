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

  it("returns null when cookies are present (since demo flow is removed)", async () => {
    (cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      get: (name: string) =>
        name === "role"
          ? { value: "student" }
          : name === "personaId"
            ? { value: "tasnim" }
            : undefined,
    });
    
    const result = await getCurrentPersona();
    expect(result).toBeNull();
  });
});
