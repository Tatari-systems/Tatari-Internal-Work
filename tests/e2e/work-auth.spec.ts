import { expect, test } from "@playwright/test";

test("unauthenticated work routes send people to sign in", async ({ page }) => {
  await page.goto("/work");
  await expect(page).toHaveURL(/\/login/);
  await expect(
    page.getByRole("heading", { name: "Sign in to Tatari" }),
  ).toBeVisible();
  await expect(page.getByLabel("Work email")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Create one" })).toBeVisible();
});

test("create account is available from sign in", async ({ page }) => {
  await page.goto("/signup");
  await expect(
    page.getByRole("heading", { name: "Create a Tatari account" }),
  ).toBeVisible();
  await expect(page.getByLabel("Name")).toBeVisible();
  await expect(page.getByLabel("Work email")).toBeVisible();
});
