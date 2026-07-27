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

test("demo: renders three persona cards by name", async ({ page }) => {
  await page.goto("/demo");
  await expect(
    page.getByRole("heading", { name: "Tasnim Hossain" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "NSU Robotics Club" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "bKash People Team" }),
  ).toBeVisible();
});

test("demo: explainer visible", async ({ page }) => {
  await page.goto("/demo");
  await expect(
    page.getByText(/prepared profiles and matches/i),
  ).toBeVisible();
});

test("demo: continue-with-google button is visible and posts to /demo/google", async ({
  page,
}) => {
  await page.goto("/demo");
  const form = page.locator('form[action="/demo/google"]');
  await expect(form).toBeAttached();
  const button = page.getByRole("button", { name: /continue with google/i });
  await expect(button).toBeVisible();
  const action = await form.getAttribute("action");
  expect(action).toBe("/demo/google");
});

const viewports = [360, 768, 1440] as const;

for (const width of viewports) {
  test(`demo: no horizontal overflow at ${width}px`, async ({ page }) => {
    const errors = await captureErrors(page);
    await page.setViewportSize({
      width,
      height: Math.round(Math.max(800, width * 0.7)),
    });
    await page.goto("/demo");

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

test("demo: no console errors on load", async ({ page }) => {
  const errors = await captureErrors(page);
  await page.goto("/demo");
  await expect(
    page.getByRole("heading", { name: "Open the demo", level: 1 }),
  ).toBeVisible();
  expect(errors, `console errors: ${JSON.stringify(errors)}`).toEqual([]);
});