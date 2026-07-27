import { test, expect, type Page } from "@playwright/test";

interface CapturedError {
  type: "console" | "pageerror";
  text: string;
}

async function captureErrors(page: Page): Promise<CapturedError[]> {
  const errors: CapturedError[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push({ type: "console", text: msg.text() });
    }
  });
  page.on("pageerror", (err) => {
    errors.push({ type: "pageerror", text: err.message });
  });
  return errors;
}

test("landing: renders Storporate", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Storporate", level: 1 }),
  ).toBeVisible();
});

test("landing: hero flourish respects prefers-reduced-motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const beams = page.locator('[data-testid="beams"]').first();
  await expect(beams).toBeAttached();
  // Target the actual animated child (the outer wrapper has no animation
  // applied, so reading its computed animation-duration would return the
  // default 0s and pass for the wrong reason).
  const drift = page.locator('[data-testid="beams-drift"]').first();
  await expect(drift).toBeAttached();
  const animationDuration = await drift.evaluate(
    (el) => getComputedStyle(el).animationDuration,
  );
  // We deliberately avoid a regex here: Chrome may serialize `0.001ms` as
  // `1e-06s`, and any regex trying to match both "near-zero" forms tends to
  // be either too lax (matches "12s") or too strict (rejects "1e-06s").
  // A numeric parse is simpler and unambiguous.
  const numericPart = parseFloat(animationDuration);
  const isMs = animationDuration.endsWith("ms");
  const valueMs = isMs ? numericPart : numericPart * 1000;
  expect(
    valueMs,
    `expected reduced-motion to collapse animation-duration near zero, got ${animationDuration}`,
  ).toBeLessThan(1);
});

test("landing: value-prop H2 visible", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Who Storporate is for", level: 2 }),
  ).toBeVisible();
});

test("landing: three role cards present by title", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Students", level: 3 }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "University clubs", level: 3 }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Companies", level: 3 }),
  ).toBeVisible();
});

test("landing: trust section heading visible", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "How compatibility works", level: 2 }),
  ).toBeVisible();
});

test("landing: demo CTAs stub-link to /demo routes", async ({ page }) => {
  await page.goto("/");
  const tryBtn = page.getByRole("link", { name: /try the demo/i }).first();
  const googleBtn = page
    .getByRole("link", { name: /continue with google/i })
    .first();
  await expect(tryBtn).toHaveAttribute("href", "/demo");
  await expect(googleBtn).toHaveAttribute("href", "/demo/google");
});

test("landing: keyboard tab order reaches primary CTA first", async ({
  page,
}) => {
  await page.goto("/");
  // Focus the body explicitly so the first Tab moves focus into the document.
  await page.evaluate(() => document.body.focus());
  // Tab through the first 5 focusable elements.
  const focusedTags: string[] = [];
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("Tab");
    const tag = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return "<none>";
      return `${el.tagName.toLowerCase()}${el.getAttribute("aria-label") ? `[aria-label="${el.getAttribute("aria-label")}"]` : ""}${el.textContent ? `[text="${el.textContent.trim().slice(0, 30)}"]` : ""}`;
    });
    focusedTags.push(tag);
  }
  // The primary CTA must be in the first 5 focused elements.
  const primary = focusedTags.find((t) =>
    t.toLowerCase().includes("try the demo"),
  );
  expect(
    primary,
    `expected primary CTA in first 5 tab stops; got: ${JSON.stringify(focusedTags)}`,
  ).toBeTruthy();
});

test("landing: stub-status notice is visible", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(
    page.getByText(
      "Demo routes open in the next sub-phase — clicking lands on a temporary placeholder.",
    ),
  ).toBeVisible();
});

test("landing: stub-status notice visible at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  await expect(
    page.getByText(
      "Demo routes open in the next sub-phase — clicking lands on a temporary placeholder.",
    ),
  ).toBeVisible();
});

test("landing: no console errors on load", async ({ page }) => {
  const errors = await captureErrors(page);
  await page.goto("/");
  // Wait for the H1 to be visible to ensure hydration has finished.
  // Note: we deliberately do NOT use waitForLoadState("networkidle") —
  // the production build's HMR/sourcemap streams can keep the network
  // active past Playwright's 30s default timeout, causing false-positive
  // test failures. page.goto already waits for the load event, and the
  // H1 visibility check confirms the page is interactive.
  await expect(
    page.getByRole("heading", { name: "Storporate", level: 1 }),
  ).toBeVisible();
  expect(errors, `console errors: ${JSON.stringify(errors)}`).toEqual([]);
});

const viewports = [360, 768, 1440] as const;

for (const width of viewports) {
  test(`landing: no horizontal overflow at ${width}px`, async ({ page }) => {
    const errors = await captureErrors(page);
    await page.setViewportSize({
      width,
      height: Math.round(Math.max(800, width * 0.7)),
    });
    await page.goto("/");

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth, "no horizontal overflow").toBeLessThanOrEqual(
      clientWidth,
    );

    expect(errors, `console errors: ${JSON.stringify(errors)}`).toEqual([]);
  });
}
