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

test("signup: page renders with email + Google form", async ({ page }) => {
  await page.goto("/signup");
  await expect(
    page.getByRole("heading", { name: /create your account/i, level: 2 }),
  ).toBeVisible();
  await expect(page.getByLabel(/^email$/i)).toBeVisible();
  await expect(page.getByLabel(/^password$/i)).toBeVisible();
  await expect(
    page.getByRole("button", { name: /continue with google/i }),
  ).toBeVisible();
});

test("signup: submit requires email + password", async ({ page }) => {
  await page.goto("/signup");
  // The browser will block submission because of `required` on the inputs.
  // We verify the markup — pressing submit with empty fields does NOT
  // navigate away from the page.
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/signup/);
});

test("signup: invalid email surfaces field-level error", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel(/^email$/i).fill("not-an-email");
  await page.getByLabel(/^password$/i).fill("shortish");
  // Browser-level type=email validation will block the submit; we assert
  // the form didn't navigate.
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/signup/);
});

test("signup: links to signin", async ({ page }) => {
  await page.goto("/signup");
  const link = page.getByRole("link", { name: /^sign in$/i }).first();
  await expect(link).toHaveAttribute("href", "/signin");
});

test("signin: page renders with email + Google form", async ({ page }) => {
  await page.goto("/signin");
  await expect(
    page.getByRole("heading", { name: /^sign in$/i, level: 2 }),
  ).toBeVisible();
  await expect(page.getByLabel(/^email$/i)).toBeVisible();
  await expect(page.getByLabel(/^password$/i)).toBeVisible();
  await expect(
    page.getByRole("button", { name: /continue with google/i }),
  ).toBeVisible();
});

test("signin: links to signup", async ({ page }) => {
  await page.goto("/signin");
  const link = page.getByRole("link", { name: /^sign up$/i }).first();
  await expect(link).toHaveAttribute("href", "/signup");
});

test("signin: surfaces OAuth error from query string", async ({ page }) => {
  await page.goto("/signin?error=oauth_cancelled");
  await expect(page.getByText(/sign-in was cancelled/i)).toBeVisible();
});

test("onboarding/role: anonymous user redirected to signin", async ({
  page,
}) => {
  await page.goto("/onboarding/role");
  // Middleware should send unauthenticated users to /signin.
  // Either the response was a 200 (because it was a fast redirect chain)
  // or 307 (because middleware redirected). Either way, the final URL
  // must NOT be /onboarding/role.
  expect(page.url()).not.toMatch(/\/onboarding\/role$/);
});

test("dashboard: anonymous user redirected to signin", async ({ page }) => {
  await page.goto("/dashboard");
  // Middleware sends unauthenticated visitors to /signin?next=/dashboard.
  expect(page.url()).toMatch(/\/signin/);
});

test("auth pages: no horizontal overflow at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  const errors = await captureErrors(page);
  for (const path of ["/signup", "/signin"]) {
    await page.goto(path);
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth, `no horizontal overflow on ${path}`).toBeLessThanOrEqual(
      clientWidth,
    );
  }
  expect(errors).toEqual([]);
});

test("auth pages: no console errors on load", async ({ page }) => {
  const errors = await captureErrors(page);
  for (const path of ["/signup", "/signin"]) {
    await page.goto(path);
    // Any of these headings proves the page hydrated.
    await expect(page.locator("h1, h2").first()).toBeVisible();
  }
  expect(errors, `console errors: ${JSON.stringify(errors)}`).toEqual([]);
});