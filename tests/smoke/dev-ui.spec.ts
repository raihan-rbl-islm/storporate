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

const viewports = [360, 768, 1440] as const;

for (const width of viewports) {
  test(`dev-ui: no horizontal overflow at ${width}px`, async ({ page }) => {
    const errors = await captureErrors(page);
    await page.setViewportSize({
      width,
      height: Math.round(Math.max(800, width * 0.7)),
    });
    await page.goto("/dev/ui");

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth, "no horizontal overflow").toBeLessThanOrEqual(
      clientWidth,
    );

    await expect(page.locator('[data-slot="card"]').first()).toBeVisible();
    await expect(page.locator('[data-slot="input"]').first()).toBeVisible();
    await expect(page.locator('[data-slot="badge"]').first()).toBeVisible();

    expect(errors, `console errors: ${JSON.stringify(errors)}`).toEqual([]);
  });
}

test("dev-ui: respects prefers-reduced-motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/dev/ui");

  // The Loader2 spinner has motion-safe:animate-spin motion-reduce:animate-none.
  // Tailwind v4 may emit the literal class with a colon, so we use a substring
  // match to be robust against CSS-optimizer rewrites.
  const spinner = page.locator('[class*="motion-safe:animate-spin"]').first();
  await expect(spinner).toBeAttached();

  const { animationDuration, animationName } = await spinner.evaluate((el) => {
    const cs = window.getComputedStyle(el);
    return {
      animationDuration: cs.animationDuration,
      animationName: cs.animationName,
    };
  });

  // Under prefers-reduced-motion: reduce, the motion-safe: variant must be a
  // no-op: either no animation duration is set (0s/none) or the browser
  // collapses it to ~0ms. The motion-reduce: variant forces animation-name: none.
  const durationIsZeroLike =
    animationDuration === "0s" ||
    animationDuration === "none" ||
    animationDuration === "0.001ms";
  const nameIsNone = animationName === "none";

  expect(
    durationIsZeroLike || nameIsNone,
    `expected reduced-motion to neutralize the spinner animation, got duration="${animationDuration}" name="${animationName}"`,
  ).toBeTruthy();
});
