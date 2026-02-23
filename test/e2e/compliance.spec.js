import { test, expect } from '@playwright/test';

/**
 * Spec compliance E2E tests for browser-compatibility requirements.
 */
test.describe('Browser compatibility spec compliance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#timeline-canvas');
  });

  test('prefers-reduced-motion is queryable', async ({ page }) => {
    const supported = await page.evaluate(
      () => typeof window.matchMedia === 'function'
    );
    expect(supported).toBe(true);
  });

  test('prefers-color-scheme media query is available', async ({ page }) => {
    const result = await page.evaluate(() => {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      return typeof mq.matches === 'boolean';
    });
    expect(result).toBe(true);
  });

  test('prefers-contrast media query is available', async ({ page }) => {
    const result = await page.evaluate(() => {
      const mq = window.matchMedia('(prefers-contrast: more)');
      return typeof mq.matches === 'boolean';
    });
    expect(result).toBe(true);
  });

  test('requestAnimationFrame is available', async ({ page }) => {
    const available = await page.evaluate(
      () => typeof requestAnimationFrame === 'function'
    );
    expect(available).toBe(true);
  });

  test('ResizeObserver is available', async ({ page }) => {
    const available = await page.evaluate(
      () => typeof ResizeObserver === 'function'
    );
    expect(available).toBe(true);
  });

  test('no feature-detection error screen on supported browser', async ({ page }) => {
    const alert = page.locator('[role="alert"]');
    await expect(alert).toHaveCount(0);
  });

  test('canvas backing-store matches devicePixelRatio', async ({ page }) => {
    const ok = await page.evaluate(() => {
      const canvas = document.getElementById('timeline-canvas');
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      return Math.abs(canvas.width - rect.width * dpr) < 2;
    });
    expect(ok).toBe(true);
  });
});
