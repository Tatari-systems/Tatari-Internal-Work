import { expect, test } from "@playwright/test";

test("unauthenticated outreach routes send people to sign in", async ({
  page,
}) => {
  await page.goto("/outreach");
  await expect(page).toHaveURL(/\/login/);
  await expect(
    page.getByRole("heading", { name: "Sign in to Tatari Internal" }),
  ).toBeVisible();
});

test("unauthenticated outreach detail also requires sign in", async ({
  page,
}) => {
  await page.goto("/outreach/acme-capital");
  await expect(page).toHaveURL(/\/login/);
});
