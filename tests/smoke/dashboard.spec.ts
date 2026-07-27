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
  role: string,
  personaId: string,
) {
  await context.addCookies([
    {
      name: "role",
      value: role,
      url: "http://localhost:3000",
      httpOnly: true,
      sameSite: "Lax",
      path: "/",
    },
    {
      name: "personaId",
      value: personaId,
      url: "http://localhost:3000",
      httpOnly: true,
      sameSite: "Lax",
      path: "/",
    },
  ]);
}

test("dashboard: redirects to /demo when no role cookie", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/demo/);
});

test("dashboard: renders placeholder for Tasnim when role=student + personaId=tasnim", async ({
  page,
  context,
}) => {
  await setRoleCookies(context, "student", "tasnim");
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: /Dashboard for Tasnim Hossain/ }),
  ).toBeVisible();
});

test("dashboard: malformed personaId cookie falls back to first hero persona", async ({
  page,
  context,
}) => {
  await setRoleCookies(context, "student", "does-not-exist");
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: /Dashboard for Tasnim Hossain/ }),
  ).toBeVisible();
});

test("dashboard: switching role updates the visible role badge within one click", async ({
  page,
  context,
}) => {
  await setRoleCookies(context, "student", "tasnim");
  await page.goto("/dashboard");
  await expect(page.getByTestId("role-badge")).toHaveText(/Student/);

  // Open the dropdown and click the Club item.
  await page.getByRole("button", { name: /switch role/i }).click();
  await page.getByRole("menuitem", { name: /Club/ }).click();

  await expect(page.getByTestId("role-badge")).toHaveText(/Club/);
});

test("dashboard: role switcher keyboard operable", async ({
  page,
  context,
}) => {
  await setRoleCookies(context, "student", "tasnim");
  await page.goto("/dashboard");

  const trigger = page.getByRole("button", { name: /switch role/i });
  await trigger.focus();
  await page.keyboard.press("Enter"); // open
  await page.keyboard.press("ArrowDown"); // move focus to first item
  await page.keyboard.press("ArrowDown"); // move to second item (Club)
  await page.keyboard.press("Enter"); // select
  await expect(page.getByTestId("role-badge")).toHaveText(/Club/);
});

test("dashboard: placeholder links render with phase labels", async ({
  page,
  context,
}) => {
  await setRoleCookies(context, "student", "tasnim");
  await page.goto("/dashboard");
  await expect(
    page.getByRole("link", { name: /lands in Phase 3/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /lands in Phase 2/i }),
  ).toBeVisible();
});

test("dashboard: no console errors on load", async ({
  page,
  context,
}) => {
  const errors = await captureErrors(page);
  await setRoleCookies(context, "student", "tasnim");
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: /Dashboard for Tasnim Hossain/ }),
  ).toBeVisible();
  expect(errors, `console errors: ${JSON.stringify(errors)}`).toEqual([]);
});

test("dashboard: no console errors after role switch", async ({
  page,
  context,
}) => {
  const errors = await captureErrors(page);
  await setRoleCookies(context, "student", "tasnim");
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /switch role/i }).click();
  await page.getByRole("menuitem", { name: /Club/ }).click();
  await expect(page.getByTestId("role-badge")).toHaveText(/Club/);
  expect(errors, `console errors: ${JSON.stringify(errors)}`).toEqual([]);
});

const viewports = [360, 768, 1440] as const;
for (const width of viewports) {
  test(`dashboard: no horizontal overflow at ${width}px`, async ({
    page,
    context,
  }) => {
    const errors = await captureErrors(page);
    await setRoleCookies(context, "student", "tasnim");
    await page.setViewportSize({
      width,
      height: Math.round(Math.max(800, width * 0.7)),
    });
    await page.goto("/dashboard");
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

test("demo: continue-as-persona sets role cookie and redirects to dashboard", async ({
  page,
  context,
}) => {
  await page.goto("/demo");
  await page
    .locator('form:has(input[value="tasnim"])')
    .getByRole("button", { name: /continue as tasnim/i })
    .click();
  await expect(page).toHaveURL(/\/dashboard/);
  const cookies = await context.cookies();
  const role = cookies.find((c) => c.name === "role");
  expect(role?.value).toBe("student");
});
