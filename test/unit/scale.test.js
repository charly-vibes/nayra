import { describe, it, expect } from 'vitest';
import { RationalScale } from '../../src/core/scale.js';
import { BILLION_YEARS, YEAR } from '../../src/core/time.js';

describe('RationalScale', () => {
  describe('construction', () => {
    it('creates scale with numerator and denominator', () => {
      const scale = new RationalScale(1n, 1000n);
      expect(scale.numerator).toBe(1n);
      expect(scale.denominator).toBe(1000n);
    });

    it('throws on zero denominator', () => {
      expect(() => new RationalScale(1n, 0n)).toThrow('Scale denominator cannot be zero');
    });

    it('creates from seconds per pixel', () => {
      const scale = RationalScale.fromSecondsPerPixel(1000);
      expect(scale.getSecondsPerPixel()).toBeCloseTo(1000, 0);
    });

    it('creates from pixels per second', () => {
      const scale = RationalScale.fromPixelsPerSecond(0.001);
      expect(scale.getPixelsPerSecond()).toBeCloseTo(0.001, 6);
    });
  });

  describe('timeToPx', () => {
    it('converts time delta to pixels', () => {
      const scale = RationalScale.fromPixelsPerSecond(1);
      expect(scale.timeToPx(100n)).toBeCloseTo(100, 0);
    });

    it('handles fractional results', () => {
      const scale = RationalScale.fromPixelsPerSecond(0.5);
      expect(scale.timeToPx(100n)).toBeCloseTo(50, 0);
    });

    it('handles deep time without precision loss', () => {
      const scale = RationalScale.fromSecondsPerPixel(Number(YEAR));
      const fourPointFiveBillionYears = 4n * BILLION_YEARS + (BILLION_YEARS / 2n);
      const px = scale.timeToPx(fourPointFiveBillionYears);
      expect(px).toBeCloseTo(4.5e9, -6);
    });
  });

  describe('pxToTime', () => {
    it('converts pixels to time delta', () => {
      const scale = RationalScale.fromPixelsPerSecond(1);
      expect(scale.pxToTime(100)).toBe(100n);
    });

    it('is inverse of timeToPx', () => {
      const scale = RationalScale.fromSecondsPerPixel(1000);
      const originalTime = 5000000n;
      const px = scale.timeToPx(originalTime);
      const recoveredTime = scale.pxToTime(px);
      expect(recoveredTime).toBe(originalTime);
    });
  });

  describe('zoom', () => {
    it('increases scale with factor > 1', () => {
      const scale = RationalScale.fromPixelsPerSecond(1);
      const zoomed = scale.zoom(2);
      expect(zoomed.getPixelsPerSecond()).toBeCloseTo(2, 0);
    });

    it('decreases scale with factor < 1', () => {
      const scale = RationalScale.fromPixelsPerSecond(2);
      const zoomed = scale.zoom(0.5);
      expect(zoomed.getPixelsPerSecond()).toBeCloseTo(1, 0);
    });

    it('throws on non-positive factor', () => {
      const scale = RationalScale.fromPixelsPerSecond(1);
      expect(() => scale.zoom(0)).toThrow('Zoom factor must be positive');
      expect(() => scale.zoom(-1)).toThrow('Zoom factor must be positive');
    });
  });

  describe('deep time precision', () => {
    it('maintains precision at 4.5Ga scale', () => {
      const scale = RationalScale.fromSecondsPerPixel(Number(BILLION_YEARS));
      const earthFormation = (9n * BILLION_YEARS) / 2n;
      const px = scale.timeToPx(earthFormation);
      expect(px).toBeGreaterThanOrEqual(4);
      expect(px).toBeLessThanOrEqual(5);
    });

    it('handles viewport-relative calculations at deep time', () => {
      const scale = RationalScale.fromSecondsPerPixel(1000);
      const viewportStart = 4n * BILLION_YEARS;
      const eventTime = viewportStart + 1000000n;
      const delta = eventTime - viewportStart;
      const px = scale.timeToPx(delta);
      expect(px).toBeCloseTo(1000, 0);
    });
  });
});
