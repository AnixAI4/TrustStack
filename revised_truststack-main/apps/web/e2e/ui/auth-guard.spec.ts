import { expect, test } from "@playwright/test";

// Guards against the route-group bug that shipped four times in the old app (D-012).
test("/dashboard while signed out → 307 → /login", async ({ request, page }) => {
  const res = await request.get("/dashboard", { maxRedirects: 0 });
  expect(res.status()).toBe(307);
  expect(new URL(res.headers()["location"]!, "http://x").pathname).toBe("/login");

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login(\?|$)/);
  await expect(page.getByRole("heading", { name: "DPDP Compass" })).toBeVisible();
});
