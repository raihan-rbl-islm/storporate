import { test, expect } from "@playwright/test";

test("landing: renders Storporate", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Storporate" })).toBeVisible();
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
