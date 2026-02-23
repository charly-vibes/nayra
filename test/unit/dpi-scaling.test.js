/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { applyDpiScaling, getLogicalSize, getDevicePixelRatio } from '../../src/rendering/dpi-scaling.js';

describe('dpi-scaling', () => {
  let canvas, ctx;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.style.width = '800px';
    canvas.style.height = '600px';
    // getBoundingClientRect returns zeros in jsdom; we override it
    canvas.getBoundingClientRect = () => ({ width: 800, height: 600, top: 0, left: 0, right: 800, bottom: 600 });
    // jsdom doesn't implement canvas 2D context — use a minimal mock
    ctx = { setTransform: () => {} };
    document.body.appendChild(canvas);
  });

  afterEach(() => {
    document.body.removeChild(canvas);
  });

  describe('getDevicePixelRatio()', () => {
    it('returns window.devicePixelRatio when set', () => {
      Object.defineProperty(window, 'devicePixelRatio', { value: 2, configurable: true });
      expect(getDevicePixelRatio()).toBe(2);
    });

    it('returns 1 when devicePixelRatio is not defined', () => {
      Object.defineProperty(window, 'devicePixelRatio', { value: undefined, configurable: true });
      expect(getDevicePixelRatio()).toBe(1);
    });

    it('returns 3 for 3x displays', () => {
      Object.defineProperty(window, 'devicePixelRatio', { value: 3, configurable: true });
      expect(getDevicePixelRatio()).toBe(3);
    });
  });

  describe('applyDpiScaling()', () => {
    it('sets canvas.width to logical width * dpr', () => {
      Object.defineProperty(window, 'devicePixelRatio', { value: 2, configurable: true });
      applyDpiScaling(canvas, ctx);
      expect(canvas.width).toBe(800 * 2);
    });

    it('sets canvas.height to logical height * dpr', () => {
      Object.defineProperty(window, 'devicePixelRatio', { value: 2, configurable: true });
      applyDpiScaling(canvas, ctx);
      expect(canvas.height).toBe(600 * 2);
    });

    it('returns logical rect dimensions', () => {
      Object.defineProperty(window, 'devicePixelRatio', { value: 2, configurable: true });
      const rect = applyDpiScaling(canvas, ctx);
      expect(rect.width).toBe(800);
      expect(rect.height).toBe(600);
    });

    it('works correctly at 1x (standard display)', () => {
      Object.defineProperty(window, 'devicePixelRatio', { value: 1, configurable: true });
      applyDpiScaling(canvas, ctx);
      expect(canvas.width).toBe(800);
      expect(canvas.height).toBe(600);
    });

    it('works correctly at 3x (high-DPI display)', () => {
      Object.defineProperty(window, 'devicePixelRatio', { value: 3, configurable: true });
      applyDpiScaling(canvas, ctx);
      expect(canvas.width).toBe(800 * 3);
      expect(canvas.height).toBe(600 * 3);
    });
  });

  describe('getLogicalSize(canvas)', () => {
    it('returns logical width as canvas.width / dpr', () => {
      Object.defineProperty(window, 'devicePixelRatio', { value: 2, configurable: true });
      canvas.width = 1600;
      canvas.height = 1200;
      const size = getLogicalSize(canvas);
      expect(size.width).toBe(800);
      expect(size.height).toBe(600);
    });

    it('handles dpr=1 (width equals canvas.width)', () => {
      Object.defineProperty(window, 'devicePixelRatio', { value: 1, configurable: true });
      canvas.width = 800;
      canvas.height = 600;
      const size = getLogicalSize(canvas);
      expect(size.width).toBe(800);
      expect(size.height).toBe(600);
    });
  });
});
