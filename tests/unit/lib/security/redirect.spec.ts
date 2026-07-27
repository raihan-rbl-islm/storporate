import { describe, expect, it, beforeEach } from "vitest";
import {
  getCanonicalOrigin,
  safeRedirectPath,
  isSameOriginPost,
} from "@/lib/security/redirect";

const CANONICAL = new URL("https://app.storporate.example");

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_APP_URL;
});

describe("getCanonicalOrigin", () => {
  it("returns localhost when NEXT_PUBLIC_APP_URL is unset", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    const origin = getCanonicalOrigin();
    expect(origin.origin).toBe("http://localhost:3000");
  });

  it("returns the configured URL when NEXT_PUBLIC_APP_URL is set", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.storporate.example";
    const origin = getCanonicalOrigin();
    expect(origin.origin).toBe("https://app.storporate.example");
  });
});

describe("safeRedirectPath (open-redirect prevention)", () => {
  it("passes through simple relative paths on the canonical origin", () => {
    expect(safeRedirectPath("/dashboard", CANONICAL)).toBe("/dashboard");
    expect(safeRedirectPath("/dashboard/profile", CANONICAL)).toBe(
      "/dashboard/profile",
    );
    expect(safeRedirectPath("/dashboard?tab=matches", CANONICAL)).toBe(
      "/dashboard?tab=matches",
    );
  });

  it("falls back to '/' for null / undefined / empty input", () => {
    expect(safeRedirectPath(null, CANONICAL)).toBe("/");
    expect(safeRedirectPath(undefined, CANONICAL)).toBe("/");
    expect(safeRedirectPath("", CANONICAL)).toBe("/");
  });

  it("rejects absolute URLs to other origins", () => {
    expect(safeRedirectPath("https://evil.com/phish", CANONICAL)).toBe("/");
    expect(safeRedirectPath("http://evil.com/phish", CANONICAL)).toBe("/");
  });

  it("rejects protocol-relative URLs", () => {
    expect(safeRedirectPath("//evil.com/phish", CANONICAL)).toBe("/");
  });

  it("rejects javascript: and data: schemes", () => {
    expect(safeRedirectPath("javascript:alert(1)", CANONICAL)).toBe("/");
    expect(safeRedirectPath("data:text/html,<script>alert(1)</script>", CANONICAL)).toBe("/");
  });

  it("rejects URLs whose host differs from canonical even if they share a suffix", () => {
    // Classic IDN/lookalike or subdomain confusion vector. The next URL
    // here is an absolute URL to a sibling host; safeRedirectPath
    // normalizes it back to "/" rather than letting the user through to
    // the attacker.
    expect(
      safeRedirectPath("https://app.storporate.example.evil.com", CANONICAL),
    ).toBe("/");
  });

  it("rejects userinfo / @-tricks", () => {
    expect(safeRedirectPath("https://app.storporate.example@evil.com", CANONICAL)).toBe("/");
  });

  it("rejects control characters and CRLF (header-injection primitive)", () => {
    expect(safeRedirectPath("/dashboard\r\nSet-Cookie: bad=1", CANONICAL)).toBe("/");
    expect(safeRedirectPath("/dashboard\nLocation: //evil.com", CANONICAL)).toBe("/");
    expect(safeRedirectPath("/dashboard\x00", CANONICAL)).toBe("/");
  });

  it("rejects paths that don't start with /", () => {
    expect(safeRedirectPath("dashboard", CANONICAL)).toBe("/");
    expect(safeRedirectPath("./dashboard", CANONICAL)).toBe("/");
  });

  it("rejects backslash tricks", () => {
    expect(safeRedirectPath("/\\\\evil.com/x", CANONICAL)).toBe("/");
  });

  it("returns '/' for nonsense input", () => {
    expect(safeRedirectPath("not a url at all", CANONICAL)).toBe("/");
  });
});

describe("isSameOriginPost (OAuth POST CSRF)", () => {
  function headers(map: Record<string, string>) {
    return {
      get(name: string) {
        return map[name.toLowerCase()] ?? null;
      },
    };
  }

  it("accepts a same-origin POST", () => {
    expect(
      isSameOriginPost(
        headers({
          origin: "https://app.storporate.example",
          host: "app.storporate.example",
        }),
        CANONICAL,
      ),
    ).toBe(true);
  });

  it("accepts a same-origin POST over http (dev)", () => {
    expect(
      isSameOriginPost(
        headers({
          origin: "http://localhost:3000",
          host: "localhost:3000",
        }),
        new URL("http://localhost:3000"),
      ),
    ).toBe(true);
  });

  it("rejects a cross-origin POST", () => {
    expect(
      isSameOriginPost(
        headers({
          origin: "https://evil.com",
          host: "evil.com",
        }),
        CANONICAL,
      ),
    ).toBe(false);
  });

  it("rejects when Origin and Host disagree (CSRF signal)", () => {
    expect(
      isSameOriginPost(
        headers({
          origin: "https://evil.com",
          host: "app.storporate.example",
        }),
        CANONICAL,
      ),
    ).toBe(false);
  });

  it("rejects when Origin is missing", () => {
    expect(
      isSameOriginPost(
        headers({ host: "app.storporate.example" }),
        CANONICAL,
      ),
    ).toBe(false);
  });

  it("rejects when Host is missing", () => {
    expect(
      isSameOriginPost(
        headers({ origin: "https://app.storporate.example" }),
        CANONICAL,
      ),
    ).toBe(false);
  });

  it("rejects when same-origin headers don't match the canonical origin (defense-in-depth)", () => {
    // Simulates a deployment where someone forgot to set
    // NEXT_PUBLIC_APP_URL and a sibling host happens to match the
    // header semantics. Canonical pin catches this.
    expect(
      isSameOriginPost(
        headers({
          origin: "https://staging.storporate.example",
          host: "staging.storporate.example",
        }),
        CANONICAL,
      ),
    ).toBe(false);
  });
});
