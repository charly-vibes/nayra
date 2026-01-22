import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { YEAR } from '../../src/core/time.js';
import { RationalScale } from '../../src/core/scale.js';

describe('Input', () => {
  describe('jumpToToday', () => {
    it('calculates viewport start to center current time on screen', async () => {
      const { jumpToToday } = await import('../../src/interaction/input.js');

      const now = BigInt(Math.floor(Date.now() / 1000));
      const canvasWidth = 800;
      const defaultScale = RationalScale.fromSecondsPerPixel(Number(YEAR));

      const result = jumpToToday(canvasWidth, defaultScale);

      const halfWidthTime = defaultScale.pxToTime(canvasWidth / 2);
      const expectedStart = now - halfWidthTime;

      // Allow 1 second tolerance for test execution time
      const diff = result.viewportStart - expectedStart;
      expect(diff >= -1n && diff <= 1n).toBe(true);
    });

    it('returns the default scale', async () => {
      const { jumpToToday, DEFAULT_SCALE } = await import('../../src/interaction/input.js');

      const canvasWidth = 800;

      const result = jumpToToday(canvasWidth, DEFAULT_SCALE);

      expect(result.scale).toBe(DEFAULT_SCALE);
    });
  });

  describe('keyboard shortcuts', () => {
    it('Home key triggers jump to today', async () => {
      const { KEYBOARD_SHORTCUTS } = await import('../../src/interaction/input.js');

      expect(KEYBOARD_SHORTCUTS.Home).toBe('jumpToToday');
    });

    it('h key triggers jump to today', async () => {
      const { KEYBOARD_SHORTCUTS } = await import('../../src/interaction/input.js');

      expect(KEYBOARD_SHORTCUTS.h).toBe('jumpToToday');
    });

    it('/ key triggers search', async () => {
      const { KEYBOARD_SHORTCUTS } = await import('../../src/interaction/input.js');

      expect(KEYBOARD_SHORTCUTS['/']).toBe('openSearch');
    });
  });
});
