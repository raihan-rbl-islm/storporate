import { test, expect } from "@playwright/test";

test("landing: renders Storporate", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Storporate" })).toBeVisible();
});
