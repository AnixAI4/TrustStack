import { expect, test, type Page } from "@playwright/test";

async function dismissSiteChrome(page: Page) {
  const acceptAll = page.getByRole("button", { name: "Accept all" });
  if (await acceptAll.isVisible().catch(() => false)) {
    await acceptAll.click();
  }
}

async function fillCurrentSection(page: Page) {
  const textInputs = page.locator('input[type="text"]');
  const textCount = await textInputs.count();
  for (let i = 0; i < textCount; i++) {
    const input = textInputs.nth(i);
    const value = await input.inputValue();
    if (!value.trim()) {
      await input.fill("TrustStack E2E Test Org");
    }
  }

  const selects = page.locator("select");
  const selectCount = await selects.count();
  for (let i = 0; i < selectCount; i++) {
    const select = selects.nth(i);
    const value = await select.inputValue();
    if (!value) {
      const options = select.locator("option");
      const optionCount = await options.count();
      for (let j = 1; j < optionCount; j++) {
        const optValue = await options.nth(j).getAttribute("value");
        if (optValue) {
          await select.selectOption(optValue);
          break;
        }
      }
    }
  }

  const yesButtons = page.getByRole("button", { name: "Yes", exact: true });
  const yesCount = await yesButtons.count();
  for (let i = 0; i < yesCount; i++) {
    await yesButtons.nth(i).click();
  }

  await page.waitForTimeout(500);
}

test.describe("DPDP Compass", () => {
  test.skip(
    !process.env.PLAYWRIGHT_STORAGE_STATE,
    "Requires PLAYWRIGHT_STORAGE_STATE for an authenticated Pilot account."
  );

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "dpdp-consent",
        JSON.stringify({
          v: "2025-06",
          ts: Date.now(),
          cats: {
            essential: true,
            functional: false,
            analytics: false,
            marketing: false,
          },
        })
      );
    });
  });

  test("completes a full assessment and shows results", async ({ page }) => {
    await page.goto("/trustdeck/assessment/new");
    await dismissSiteChrome(page);
    await expect(page).toHaveURL(/\/trustdeck\/assessment\/[a-f0-9-]+/, {
      timeout: 60_000,
    });

    await expect(
      page.getByRole("paragraph").filter({ hasText: /^Section \d+ of/ }).first()
    ).toBeVisible({ timeout: 60_000 });

    for (let step = 0; step < 12; step++) {
      await dismissSiteChrome(page);
      await fillCurrentSection(page);

      const submitButton = page.getByRole("button", {
        name: "Submit Assessment",
      });
      if (await submitButton.isVisible()) {
        await submitButton.click({ force: true });
        break;
      }

      const continueButton = page.getByRole("button", { name: "Continue" });
      await expect(continueButton).toBeVisible();
      await continueButton.scrollIntoViewIfNeeded();
      await continueButton.click({ force: true });
      await page.waitForTimeout(400);
    }

    await expect(page).toHaveURL(/\/trustdeck\/assessment\/results\/[a-f0-9-]+/, {
      timeout: 90_000,
    });

    await expect(page.getByRole("heading", { name: "DPDP Compass™ Report" })).toBeVisible({
      timeout: 30_000,
    });

    await expect(page.getByText("Maturity Level")).toBeVisible();
    await expect(page.getByText(/out of 100/i)).toBeVisible();
  });
});
