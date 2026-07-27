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

test("landing: no console errors on load", async ({ page }) => {
  const errors = await captureErrors(page);
  await page.goto("/");
  // give hydration a tick
  await page.waitForLoadState("networkidle");
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
