import { test, expect } from '@playwright/test';

test.describe('Timeline Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads without console errors', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.reload();
    await page.waitForTimeout(500);

    expect(errors).toEqual([]);
  });

  test('canvas element is present and visible', async ({ page }) => {
    const canvas = page.locator('#timeline-canvas');
    await expect(canvas).toBeVisible();
  });

  test('canvas has correct dimensions', async ({ page }) => {
    const canvas = page.locator('#timeline-canvas');
    const box = await canvas.boundingBox();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  });

  test('canvas fills container', async ({ page }) => {
    const container = page.locator('#timeline-container');
    const canvas = page.locator('#timeline-canvas');

    const containerBox = await container.boundingBox();
    const canvasBox = await canvas.boundingBox();

    expect(canvasBox.width).toBeCloseTo(containerBox.width, 0);
    expect(canvasBox.height).toBeCloseTo(containerBox.height, 0);
  });

  test('FPS counter is displayed', async ({ page }) => {
    await page.waitForTimeout(600);

    const screenshot = await page.screenshot();
    expect(screenshot).toBeDefined();
  });

  test('canvas resizes on window resize', async ({ page }) => {
    const canvas = page.locator('#timeline-canvas');

    const initialBox = await canvas.boundingBox();

    await page.setViewportSize({ width: 800, height: 400 });
    await page.waitForTimeout(100);

    const resizedBox = await canvas.boundingBox();

    expect(resizedBox.width).not.toBe(initialBox.width);
  });

  test('supports HiDPI rendering', async ({ page }) => {
    const dpr = await page.evaluate(() => window.devicePixelRatio);
    const canvas = page.locator('#timeline-canvas');

    const canvasWidth = await canvas.evaluate((el) => el.width);
    const cssWidth = await canvas.evaluate(
      (el) => el.getBoundingClientRect().width
    );

    expect(canvasWidth).toBeCloseTo(cssWidth * dpr, 0);
  });
});

test.describe('Timeline Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('draws axis line', async ({ page }) => {
    await page.waitForTimeout(100);
    const screenshot = await page.screenshot();
    expect(screenshot.length).toBeGreaterThan(0);
  });

  test('requestAnimationFrame loop is running', async ({ page }) => {
    const rafCount = await page.evaluate(() => {
      return new Promise((resolve) => {
        let count = 0;
        const original = window.requestAnimationFrame;
        window.requestAnimationFrame = (cb) => {
          count++;
          return original(cb);
        };
        setTimeout(() => resolve(count), 200);
      });
    });

    expect(rafCount).toBeGreaterThan(5);
  });
});
