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

async function setRoleCookies(
  context: import("@playwright/test").BrowserContext,
) {
  await context.addCookies([
    {
      name: "role",
      value: "student",
      url: "http://localhost:3000",
      httpOnly: true,
      sameSite: "Lax",
      path: "/",
    },
    {
      name: "personaId",
      value: "tasnim",
      url: "http://localhost:3000",
      httpOnly: true,
      sameSite: "Lax",
      path: "/",
    },
  ]);
}

test("a11y: / has no console errors and renders all primary landmarks", async ({
  page,
}) => {
  const errors = await captureErrors(page);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Storporate", level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
  // Landmarks
  await expect(page.getByRole("main").first()).toBeVisible();
  expect(errors, `console errors: ${JSON.stringify(errors)}`).toEqual([]);
});

test("a11y: /demo has no console errors and renders primary H1 + persona cards", async ({
  page,
}) => {
  const errors = await captureErrors(page);
  await page.goto("/demo");
  await expect(
    page.getByRole("heading", { name: "Open the demo", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Prepared personas", level: 2 }),
  ).toBeVisible();
  // Each persona tile is a button — ensures they are keyboard focusable.
  const personaButtons = page.getByRole("button", {
    name: /Continue as /i,
  });
  expect(await personaButtons.count()).toBeGreaterThanOrEqual(3);
  expect(errors, `console errors: ${JSON.stringify(errors)}`).toEqual([]);
});

test("a11y: /dashboard has no console errors and renders role badge + switcher", async ({
  page,
  context,
}) => {
  const errors = await captureErrors(page);
  await setRoleCookies(context);
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: /Dashboard for / }),
  ).toBeVisible();
  await expect(page.getByTestId("role-badge")).toBeVisible();
  // The role switcher is a focusable button.
  await expect(
    page.getByRole("button", { name: /switch role/i }),
  ).toBeVisible();
  expect(errors, `console errors: ${JSON.stringify(errors)}`).toEqual([]);
});

test("a11y: /demo?error=oauth_cancelled has no console errors and renders the H1 + actions", async ({
  page,
}) => {
  const errors = await captureErrors(page);
  await page.goto("/demo?error=oauth_cancelled");
  await expect(
    page.getByRole("heading", { name: "Sign-in was cancelled" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /try with google again/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /pick a prepared persona/i }),
  ).toBeVisible();
  expect(errors, `console errors: ${JSON.stringify(errors)}`).toEqual([]);
});