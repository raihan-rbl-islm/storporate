import { describe, it, expect, vi } from "vitest";

// `lib/ratelimit.ts` starts with `import "server-only";` which throws when
// loaded outside an RSC context. The unit test runs in plain Node via
// Vitest, so we stub `server-only` to a no-op. The stub keeps the
// production code unchanged — we're only neutralising the guard for the
// test harness.
vi.mock("server-only", () => ({}));

// Stub @upstash/redis so the helper under test never touches real env or
// network. The mock client exposes a `slidingWindow` factory whose returned
// limiter has a `limit(...)` method that resolves to a fixed success shape.
vi.mock("@upstash/redis", () => {
  class RedisMock {}
  return { Redis: RedisMock };
});

vi.mock("@upstash/ratelimit", () => {
  const limitMock = vi.fn(async () => ({
    success: true,
    limit: 10,
    remaining: 9,
    reset: Date.now() + 10_000,
  }));
  const slidingWindowMock = vi.fn(() => ({ limit: limitMock }));
  class RatelimitMock {
    constructor(...args: unknown[]) {
      void args;
    }
    static slidingWindow = slidingWindowMock;
    limit = limitMock;
  }
  return { Ratelimit: RatelimitMock };
});

import { withRateLimit } from "@/lib/ratelimit";

describe("withRateLimit", () => {
  it("returns the ok-shape when the upstream limiter reports success", async () => {
    // The helper lazy-inits Redis on first call; @upstash/redis is fully
    // mocked above so no real network is attempted. Upstash reads env on
    // first instantiation only — we set throwaway values so the lazy init
    // path executes; nothing leaves the test process.
    process.env.UPSTASH_REDIS_REST_URL ||= "http://test.invalid";
    process.env.UPSTASH_REDIS_REST_TOKEN ||= "test-token";

    const result = await withRateLimit({ identifier: "test:user" });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") {
      throw new Error(`expected ok status, got ${result.status}`);
    }
    expect(result.limit).toBe(10);
    expect(result.remaining).toBe(9);
    expect(typeof result.reset).toBe("number");
  });
});
