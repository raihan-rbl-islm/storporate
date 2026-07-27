import { test, expect } from "@playwright/test";

test("cookies: document.cookie does not contain role or personaId after persona select", async ({
  page,
  context,
}) => {
  await page.goto("/demo");
  await page
    .locator('form:has(input[value="tasnim"])')
    .getByRole("button", { name: /continue as tasnim/i })
    .click();
  await expect(page).toHaveURL(/\/dashboard/);

  // httpOnly: true — document.cookie must NOT expose the role/personaId
  // cookies to client JS. Next.js server actions set these, and the
  // browser will not include HttpOnly cookies in document.cookie.
  const docCookie = await page.evaluate(() => document.cookie);
  expect(docCookie).not.toMatch(/\brole=/);
  expect(docCookie).not.toMatch(/\bpersonaId=/);

  // But Playwright can read the raw Set-Cookie headers via the context,
  // so confirm the cookies were actually set server-side.
  const allCookies = await context.cookies();
  const roleCookie = allCookies.find((c) => c.name === "role");
  const personaIdCookie = allCookies.find((c) => c.name === "personaId");
  expect(roleCookie?.value).toBe("student");
  expect(personaIdCookie?.value).toBe("tasnim");
});