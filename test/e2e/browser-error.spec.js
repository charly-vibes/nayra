import { test, expect } from '@playwright/test';

test.describe('Browser Error UI', () => {
  test('no error screen shown in supported browser', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#timeline-canvas');
    const alert = page.locator('[role="alert"]');
    await expect(alert).toHaveCount(0);
  });

  test('error screen appears when BigInt is unavailable', async ({ page }) => {
    await page.addInitScript(() => {
      // Simulate unsupported browser by hiding BigInt before app loads
      Object.defineProperty(window, 'BigInt', { value: undefined, configurable: true });
    });
    await page.goto('/');
    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/bigint/i);
  });

  test('error screen includes upgrade suggestion with browser names', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'BigInt', { value: undefined, configurable: true });
    });
    await page.goto('/');
    const alert = page.locator('[role="alert"]');
    await expect(alert).toContainText(/chrome|firefox|safari/i);
    await expect(alert).toContainText(/upgrade|update|modern/i);
  });

  test('error screen has accessible heading', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'BigInt', { value: undefined, configurable: true });
    });
    await page.goto('/');
    const heading = page.locator('[role="alert"] h2, [role="alert"] h1');
    await expect(heading).toBeVisible();
  });
});
