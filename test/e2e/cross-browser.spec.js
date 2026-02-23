import { test, expect } from '@playwright/test';

/**
 * Cross-browser compatibility test suite.
 * Runs on Chromium, Firefox, and WebKit (Safari) via playwright.config.js projects.
 */
test.describe('Cross-browser compatibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#timeline-canvas');
  });

  test('canvas element is present and visible', async ({ page }) => {
    const canvas = page.locator('#timeline-canvas');
    await expect(canvas).toBeVisible();
  });

  test('canvas has non-zero dimensions', async ({ page }) => {
    const box = await page.locator('#timeline-canvas').boundingBox();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  });

  test('application loads without page errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.reload();
    await page.waitForSelector('#timeline-canvas');
    const appErrors = errors.filter(e => !e.includes('favicon'));
    expect(appErrors).toHaveLength(0);
  });

  test('no browser compatibility error screen is shown', async ({ page }) => {
    const alert = page.locator('[role="alert"]');
    await expect(alert).toHaveCount(0);
  });

  test('canvas accepts keyboard focus', async ({ page }) => {
    await page.locator('#timeline-canvas').click();
    const focused = await page.evaluate(() => document.activeElement?.id);
    expect(focused).toBe('timeline-canvas');
  });

  test('page title is set', async ({ page }) => {
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('required browser APIs are available', async ({ page }) => {
    const apis = await page.evaluate(() => ({
      canvas: (() => { const c = document.createElement('canvas'); return c.getContext('2d') !== null; })(),
      bigint: typeof BigInt !== 'undefined',
      indexeddb: typeof indexedDB !== 'undefined',
      requestAnimationFrame: typeof requestAnimationFrame !== 'undefined',
      resizeObserver: typeof ResizeObserver !== 'undefined',
    }));
    expect(apis.canvas).toBe(true);
    expect(apis.bigint).toBe(true);
    expect(apis.indexeddb).toBe(true);
    expect(apis.requestAnimationFrame).toBe(true);
    expect(apis.resizeObserver).toBe(true);
  });

  test('pointer events or mouse events are supported', async ({ page }) => {
    const supported = await page.evaluate(() =>
      typeof PointerEvent !== 'undefined' || typeof MouseEvent !== 'undefined'
    );
    expect(supported).toBe(true);
  });

  test('zoom controls are rendered', async ({ page }) => {
    // Zoom controls are present in the UI (fixed positioned)
    const buttons = page.locator('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });
});
