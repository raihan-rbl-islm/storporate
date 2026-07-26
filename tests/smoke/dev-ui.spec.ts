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
  // Use a stable testid rather than a Tailwind class glob.
  const spinner = page.locator('[data-testid="spinner"]').first();
  await expect(spinner).toBeAttached();

  const styles = await spinner.evaluate((el) => {
    const cs = window.getComputedStyle(el);
    return {
      animationDuration: cs.animationDuration,
      animationName: cs.animationName,
    };
  });
  // Tailwind's motion-reduce:animate-none explicitly sets animation-name to none
  expect(
    styles.animationName,
    "motion-reduce should set animation-name: none",
  ).toBe("none");
  // The global kill-switch in globals.css sets animation-duration to 0.001ms (or 0s)
  const dur = styles.animationDuration;
  const durMs = dur.endsWith("ms") ? parseFloat(dur) : parseFloat(dur) * 1000;
  expect(
    durMs,
    "reduced-motion should collapse animation-duration near zero",
  ).toBeLessThan(1);
});
