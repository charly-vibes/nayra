import { test, expect } from '@playwright/test';

/**
 * High-DPI / device pixel ratio tests.
 * The chromium-hidpi and webkit-hidpi projects in playwright.config.js run
 * these with deviceScaleFactor: 2 automatically.
 */
test.describe('High-DPI rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#timeline-canvas');
  });

  test('canvas backing-store is scaled by devicePixelRatio', async ({ page }) => {
    const { cssWidth, physicalWidth, dpr } = await page.evaluate(() => {
      const canvas = document.getElementById('timeline-canvas');
      const rect = canvas.getBoundingClientRect();
      return {
        cssWidth: rect.width,
        physicalWidth: canvas.width,
        dpr: window.devicePixelRatio,
      };
    });
    expect(physicalWidth).toBeCloseTo(cssWidth * dpr, 0);
  });

  test('canvas height backing-store is scaled by devicePixelRatio', async ({ page }) => {
    const { cssHeight, physicalHeight, dpr } = await page.evaluate(() => {
      const canvas = document.getElementById('timeline-canvas');
      const rect = canvas.getBoundingClientRect();
      return {
        cssHeight: rect.height,
        physicalHeight: canvas.height,
        dpr: window.devicePixelRatio,
      };
    });
    expect(physicalHeight).toBeCloseTo(cssHeight * dpr, 0);
  });

  test('canvas renders without errors at current DPR', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.reload();
    await page.waitForSelector('#timeline-canvas');
    expect(errors).toHaveLength(0);
  });

  test('canvas CSS dimensions match viewport', async ({ page }) => {
    const viewportSize = page.viewportSize();
    const box = await page.locator('#timeline-canvas').boundingBox();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
    expect(box.width).toBeLessThanOrEqual(viewportSize.width + 1);
    expect(box.height).toBeLessThanOrEqual(viewportSize.height + 1);
  });
});
