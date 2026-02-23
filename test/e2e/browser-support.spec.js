import { test, expect } from '@playwright/test';

test.describe('Browser Feature Detection', () => {
  test('application loads without feature detection errors in supported browser', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    await page.waitForSelector('#timeline-canvas');

    const featureErrors = errors.filter(e => e.includes('requires browser support'));
    expect(featureErrors).toHaveLength(0);
  });

  test('Canvas2D API is available', async ({ page }) => {
    await page.goto('/');
    const supported = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      return canvas.getContext('2d') !== null;
    });
    expect(supported).toBe(true);
  });

  test('BigInt is available', async ({ page }) => {
    await page.goto('/');
    const supported = await page.evaluate(() => typeof BigInt !== 'undefined');
    expect(supported).toBe(true);
  });

  test('IndexedDB is available', async ({ page }) => {
    await page.goto('/');
    const supported = await page.evaluate(() => typeof indexedDB !== 'undefined');
    expect(supported).toBe(true);
  });
});
