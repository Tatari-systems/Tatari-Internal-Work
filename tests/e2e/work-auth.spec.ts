import { test, expect } from "@playwright/test";

test("work opens without Google sign in while OAuth is paused", async ({
  page,
}) => {
  await page.goto("/work");
  await expect(page).toHaveURL(/\/work/);
  await expect(page.getByRole("heading", { name: "My work" })).toBeVisible();

  await page.goto("/work/inbox");
  await expect(
    page.getByRole("heading", { name: "Unassigned" }),
  ).toBeVisible();
  await expect(page.getByText("Stand up weekly ops review")).toBeVisible();

  await page.goto("/work/projects/operations");
  await expect(page.getByRole("heading", { name: "Operations" })).toBeVisible();
  await expect(page.getByText("Stand up weekly ops review")).toBeVisible();
});
