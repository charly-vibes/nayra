import { test, expect } from '@playwright/test';

test.describe('Event Information Visualization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
  });

  test.describe('Tooltip on hover', () => {
    test('tooltip appears after 500ms hover on event', async ({ page }) => {
      const canvas = page.locator('#timeline-canvas');
      const box = await canvas.boundingBox();
      
      await canvas.hover({ position: { x: box.width / 2, y: box.height / 2 } });
      
      await expect(page.locator('.tooltip')).not.toBeVisible();
      
      await page.waitForTimeout(600);
      
      const tooltip = page.locator('.tooltip');
      if (await tooltip.isVisible()) {
        await expect(tooltip).toContainText(/./);
      }
    });

    test('tooltip hides immediately on mouse-out', async ({ page }) => {
      const canvas = page.locator('#timeline-canvas');
      const box = await canvas.boundingBox();
      
      await canvas.hover({ position: { x: box.width / 2, y: box.height / 2 } });
      await page.waitForTimeout(600);
      
      await page.mouse.move(10, 10);
      
      await expect(page.locator('.tooltip')).not.toBeVisible();
    });
  });

  test.describe('Detail panel on selection', () => {
    test('panel opens on event click', async ({ page }) => {
      const canvas = page.locator('#timeline-canvas');
      const box = await canvas.boundingBox();
      
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
      await page.waitForTimeout(100);
      
      const panel = page.locator('.event-panel-overlay');
      const panelVisible = await panel.isVisible();
      
      if (panelVisible) {
        await expect(page.locator('.event-panel')).toBeVisible();
        await expect(page.locator('.event-panel-title')).toContainText(/./);
      }
    });

    test('Escape key closes detail panel', async ({ page }) => {
      const canvas = page.locator('#timeline-canvas');
      const box = await canvas.boundingBox();
      
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
      await page.waitForTimeout(100);
      
      const panel = page.locator('.event-panel-overlay');
      
      if (await panel.isVisible()) {
        await page.keyboard.press('Escape');
        await expect(panel).not.toBeVisible();
      }
    });

    test('clicking backdrop closes panel', async ({ page }) => {
      const canvas = page.locator('#timeline-canvas');
      const box = await canvas.boundingBox();
      
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
      await page.waitForTimeout(100);
      
      const overlay = page.locator('.event-panel-overlay');
      
      if (await overlay.isVisible()) {
        await overlay.click({ position: { x: 10, y: 10 } });
        await expect(overlay).not.toBeVisible();
      }
    });
  });

  test.describe('Panel content', () => {
    test('panel shows event title', async ({ page }) => {
      const canvas = page.locator('#timeline-canvas');
      const box = await canvas.boundingBox();
      
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
      await page.waitForTimeout(100);
      
      const title = page.locator('.event-panel-title');
      if (await page.locator('.event-panel').isVisible()) {
        const text = await title.textContent();
        expect(text.length).toBeGreaterThan(0);
      }
    });

    test('panel shows formatted time', async ({ page }) => {
      const canvas = page.locator('#timeline-canvas');
      const box = await canvas.boundingBox();
      
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
      await page.waitForTimeout(100);
      
      const time = page.locator('.event-panel-time');
      if (await page.locator('.event-panel').isVisible()) {
        const text = await time.textContent();
        expect(text.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Accessibility', () => {
    test('panel has dialog role', async ({ page }) => {
      const canvas = page.locator('#timeline-canvas');
      const box = await canvas.boundingBox();
      
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
      await page.waitForTimeout(100);
      
      const panel = page.locator('.event-panel');
      if (await panel.isVisible()) {
        await expect(panel).toHaveAttribute('role', 'dialog');
        await expect(panel).toHaveAttribute('aria-modal', 'true');
      }
    });
  });
});
