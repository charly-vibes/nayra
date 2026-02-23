import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { detectFeatures, REQUIRED_FEATURES } from '../../src/utils/feature-detection.js';

describe('feature-detection', () => {
  let originalCanvas, originalBigInt, originalIndexedDB;

  beforeEach(() => {
    originalCanvas = globalThis.HTMLCanvasElement;
    originalBigInt = globalThis.BigInt;
    originalIndexedDB = globalThis.indexedDB;
  });

  afterEach(() => {
    globalThis.HTMLCanvasElement = originalCanvas;
    globalThis.BigInt = originalBigInt;
    globalThis.indexedDB = originalIndexedDB;
  });

  describe('REQUIRED_FEATURES', () => {
    it('lists canvas, bigint, and indexeddb as required', () => {
      expect(REQUIRED_FEATURES).toContain('canvas');
      expect(REQUIRED_FEATURES).toContain('bigint');
      expect(REQUIRED_FEATURES).toContain('indexeddb');
    });
  });

  describe('detectFeatures()', () => {
    it('returns an object with supported property per feature', () => {
      const result = detectFeatures();
      expect(result).toHaveProperty('canvas');
      expect(result).toHaveProperty('bigint');
      expect(result).toHaveProperty('indexeddb');
    });

    it('reports canvas as supported when getContext returns a context', () => {
      globalThis.document = { createElement: () => ({ getContext: () => ({}) }) };
      const result = detectFeatures();
      expect(result.canvas.supported).toBe(true);
      delete globalThis.document;
    });

    it('reports canvas as unsupported when getContext returns null', () => {
      globalThis.document = { createElement: () => ({ getContext: () => null }) };
      const result = detectFeatures();
      expect(result.canvas.supported).toBe(false);
      delete globalThis.document;
    });

    it('reports bigint as supported when BigInt is defined', () => {
      globalThis.BigInt = function BigInt() {};
      const result = detectFeatures();
      expect(result.bigint.supported).toBe(true);
    });

    it('reports bigint as unsupported when BigInt is undefined', () => {
      globalThis.BigInt = undefined;
      const result = detectFeatures();
      expect(result.bigint.supported).toBe(false);
    });

    it('reports indexeddb as supported when indexedDB is available', () => {
      globalThis.indexedDB = { open: vi.fn() };
      const result = detectFeatures();
      expect(result.indexeddb.supported).toBe(true);
    });

    it('reports indexeddb as unsupported when indexedDB is undefined', () => {
      globalThis.indexedDB = undefined;
      const result = detectFeatures();
      expect(result.indexeddb.supported).toBe(false);
    });

    it('includes feature name in each result entry', () => {
      const result = detectFeatures();
      expect(result.canvas.name).toBe('canvas');
      expect(result.bigint.name).toBe('bigint');
      expect(result.indexeddb.name).toBe('indexeddb');
    });

    it('marks required features as required', () => {
      const result = detectFeatures();
      expect(result.canvas.required).toBe(true);
      expect(result.bigint.required).toBe(true);
      expect(result.indexeddb.required).toBe(true);
    });
  });

  describe('missing required features', () => {
    it('returns missing list when a required feature is absent', () => {
      globalThis.BigInt = undefined;
      const result = detectFeatures();
      const missing = Object.values(result).filter(f => f.required && !f.supported);
      expect(missing.length).toBeGreaterThan(0);
      expect(missing.some(f => f.name === 'bigint')).toBe(true);
    });

    it('returns no missing features when all are supported', () => {
      globalThis.indexedDB = { open: vi.fn() };
      globalThis.document = { createElement: () => ({ getContext: () => ({}) }) };
      const result = detectFeatures();
      const missing = Object.values(result).filter(f => f.required && !f.supported);
      expect(missing.length).toBe(0);
      delete globalThis.document;
    });
  });
});
