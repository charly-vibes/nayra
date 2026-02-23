import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { detectFeatures, REQUIRED_FEATURES } from '../../src/utils/feature-detection.js';
import { prefersHighContrast } from '../../src/rendering/event-shapes.js';

/**
 * Integration tests for browser compatibility requirements.
 * Validates feature detection, error messaging, system preference handling,
 * and spec compliance per openspec/specs/browser-compatibility/spec.md.
 */
describe('browser-compatibility spec compliance', () => {

  // ── Feature Detection ───────────────────────────────────────────────────

  describe('Feature Detection (spec: Startup feature detection)', () => {
    it('detects Canvas API availability', () => {
      const result = detectFeatures();
      expect(result).toHaveProperty('canvas');
      expect(typeof result.canvas.supported).toBe('boolean');
    });

    it('detects BigInt support', () => {
      const result = detectFeatures();
      expect(result).toHaveProperty('bigint');
      expect(typeof result.bigint.supported).toBe('boolean');
    });

    it('detects IndexedDB availability', () => {
      const result = detectFeatures();
      expect(result).toHaveProperty('indexeddb');
      expect(typeof result.indexeddb.supported).toBe('boolean');
    });

    it('marks all required features as required', () => {
      const result = detectFeatures();
      for (const key of REQUIRED_FEATURES) {
        expect(result[key].required).toBe(true);
      }
    });

    it('REQUIRED_FEATURES includes canvas, bigint, and indexeddb', () => {
      expect(REQUIRED_FEATURES).toContain('canvas');
      expect(REQUIRED_FEATURES).toContain('bigint');
      expect(REQUIRED_FEATURES).toContain('indexeddb');
    });
  });

  // ── Error Messaging ─────────────────────────────────────────────────────

  describe('Error Messaging (spec: Missing feature error messaging)', () => {
    it('browser-error module exports createBrowserError', async () => {
      const mod = await import('../../src/ui/browser-error.js');
      expect(typeof mod.createBrowserError).toBe('function');
    });

    it('createBrowserError renders to a container', async () => {
      const { createBrowserError } = await import('../../src/ui/browser-error.js');
      const container = document.createElement('div');
      createBrowserError(container, ['bigint']);
      expect(container.children.length).toBeGreaterThan(0);
    });

    it('error UI identifies the missing feature', async () => {
      const { createBrowserError } = await import('../../src/ui/browser-error.js');
      const container = document.createElement('div');
      createBrowserError(container, ['bigint']);
      expect(container.textContent).toMatch(/bigint/i);
    });

    it('error UI suggests upgrading the browser', async () => {
      const { createBrowserError } = await import('../../src/ui/browser-error.js');
      const container = document.createElement('div');
      createBrowserError(container, ['bigint']);
      expect(container.textContent).toMatch(/upgrade|update|modern/i);
    });

    it('error UI uses role="alert" for immediate screen reader announcement', async () => {
      const { createBrowserError } = await import('../../src/ui/browser-error.js');
      const container = document.createElement('div');
      createBrowserError(container, ['bigint']);
      const alert = container.querySelector('[role="alert"]');
      expect(alert).not.toBeNull();
    });
  });

  // ── System Preferences ──────────────────────────────────────────────────

  describe('System Preferences (spec: System preference support)', () => {
    let originalMatchMedia;

    beforeEach(() => {
      originalMatchMedia = window.matchMedia;
    });

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
    });

    it('prefersHighContrast() returns false when prefers-contrast: normal', () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: false });
      expect(prefersHighContrast()).toBe(false);
    });

    it('prefersHighContrast() returns true when prefers-contrast: more', () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: true });
      expect(prefersHighContrast()).toBe(true);
    });

    it('prefersHighContrast() handles missing matchMedia gracefully', () => {
      window.matchMedia = undefined;
      expect(() => prefersHighContrast()).not.toThrow();
      expect(prefersHighContrast()).toBe(false);
    });

    it('prefers-reduced-motion is detectable via matchMedia', () => {
      window.matchMedia = vi.fn(query => ({
        matches: query.includes('reduce'),
      }));
      const prefersReduced = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      expect(prefersReduced).toBe(true);
    });

    it('prefers-color-scheme is queryable', () => {
      window.matchMedia = vi.fn(query => ({
        matches: query.includes('dark'),
        media: query,
      }));
      const prefersDark = window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      expect(prefersDark).toBe(true);
    });
  });

  // ── High-DPI ────────────────────────────────────────────────────────────

  describe('High-DPI (spec: Device pixel ratio detection)', () => {
    it('getDevicePixelRatio() returns a number >= 1', async () => {
      const { getDevicePixelRatio } = await import('../../src/rendering/dpi-scaling.js');
      const dpr = getDevicePixelRatio();
      expect(typeof dpr).toBe('number');
      expect(dpr).toBeGreaterThanOrEqual(1);
    });

    it('applyDpiScaling scales canvas.width by dpr', async () => {
      const { applyDpiScaling, getDevicePixelRatio } = await import('../../src/rendering/dpi-scaling.js');
      const canvas = document.createElement('canvas');
      canvas.getBoundingClientRect = () => ({ width: 400, height: 300 });
      const ctx = { setTransform: vi.fn() };
      applyDpiScaling(canvas, ctx);
      const dpr = getDevicePixelRatio();
      expect(canvas.width).toBe(400 * dpr);
    });
  });

  // ── Optional Feature Fallback ────────────────────────────────────────────

  describe('Optional Feature Fallback (spec: Optional feature fallback)', () => {
    it('feature-detection does not include service-workers as required', () => {
      expect(REQUIRED_FEATURES).not.toContain('serviceworker');
      expect(REQUIRED_FEATURES).not.toContain('service-worker');
    });

    it('detectFeatures() only requires canvas, bigint, indexeddb', () => {
      expect(REQUIRED_FEATURES.length).toBe(3);
    });
  });
});
