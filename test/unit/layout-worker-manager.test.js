import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  calculateLayout,
  initWorker,
  terminateWorker,
  getWorkerThreshold,
  isWorkerReady,
} from '../../src/layout/layout-worker-manager.js';

describe('Layout Worker Manager', () => {
  beforeEach(() => {
    // Clean up any existing worker
    terminateWorker();
  });

  afterEach(() => {
    terminateWorker();
  });

  describe('initWorker', () => {
    it('should initialize the worker successfully (browser) or gracefully fail (Node.js)', () => {
      const result = initWorker();

      // In browser environment, should succeed
      // In Node.js environment (tests), should fail gracefully
      if (typeof Worker !== 'undefined') {
        expect(result).toBe(true);
        expect(isWorkerReady()).toBe(true);
      } else {
        expect(result).toBe(false);
        expect(isWorkerReady()).toBe(false);
      }
    });

    it('should handle re-initialization', () => {
      initWorker();
      const result = initWorker();

      if (typeof Worker !== 'undefined') {
        expect(result).toBe(true);
      } else {
        expect(result).toBe(false);
      }
    });
  });

  describe('calculateLayout - synchronous path', () => {
    it('should calculate layout synchronously for small datasets', async () => {
      const events = [
        { id: 'e1', start: 0n, end: 100n },
        { id: 'e2', start: 50n, end: 150n },
        { id: 'e3', start: 120n, end: 200n },
      ];

      const result = await calculateLayout(events);

      expect(result).toBeDefined();
      expect(result.layouts).toBeInstanceOf(Map);
      expect(result.laneCount).toBe(2); // Events should be in 2 lanes
      expect(result.duration).toBeGreaterThanOrEqual(0);

      // Verify lane assignments
      expect(result.layouts.get('e1')).toBe(0); // First event in lane 0
      expect(result.layouts.get('e2')).toBe(1); // Overlaps e1, goes to lane 1
      expect(result.layouts.get('e3')).toBe(0); // Doesn't overlap e1, goes to lane 0
    });

    it('should handle empty event array', async () => {
      const result = await calculateLayout([]);

      expect(result.layouts.size).toBe(0);
      expect(result.laneCount).toBe(0);
    });

    it('should handle null events', async () => {
      const result = await calculateLayout(null);

      expect(result.layouts.size).toBe(0);
      expect(result.laneCount).toBe(0);
    });

    it('should handle point events (no end time)', async () => {
      const events = [
        { id: 'e1', start: 0n },
        { id: 'e2', start: 0n },
        { id: 'e3', start: 100n },
      ];

      const result = await calculateLayout(events);

      expect(result.layouts.size).toBe(3);
      expect(result.laneCount).toBeGreaterThan(0);
    });
  });

  describe('calculateLayout - worker path', () => {
    it('should use worker for large datasets', async () => {
      // Create a large dataset (above threshold)
      const threshold = getWorkerThreshold();
      const events = [];
      for (let i = 0; i < threshold + 100; i++) {
        events.push({
          id: `e${i}`,
          start: BigInt(i * 100),
          end: BigInt(i * 100 + 50),
        });
      }

      const result = await calculateLayout(events);

      expect(result).toBeDefined();
      expect(result.layouts).toBeInstanceOf(Map);
      expect(result.layouts.size).toBe(events.length);
      expect(result.laneCount).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle overlapping events in worker', async () => {
      const threshold = getWorkerThreshold();
      const events = [];

      // Create events that all overlap at the same time
      for (let i = 0; i < threshold + 10; i++) {
        events.push({
          id: `e${i}`,
          start: 0n,
          end: 100n,
        });
      }

      const result = await calculateLayout(events);

      expect(result.layouts.size).toBe(events.length);
      // All events overlap, so should have as many lanes as events
      expect(result.laneCount).toBe(events.length);
    });

    it('should complete within performance threshold', async () => {
      // Create 10,000 events
      const events = [];
      for (let i = 0; i < 10000; i++) {
        events.push({
          id: `e${i}`,
          start: BigInt(Math.floor(Math.random() * 1000000)),
          end: BigInt(Math.floor(Math.random() * 1000000) + 1000000),
        });
      }

      const startTime = performance.now();
      const result = await calculateLayout(events);
      const duration = performance.now() - startTime;

      expect(result).toBeDefined();
      expect(result.layouts.size).toBe(10000);

      // Performance expectations depend on environment:
      // - With Web Worker (browser): ~100ms
      // - Synchronous fallback (Node.js tests): ~500-1000ms
      // The important thing is the algorithm completes successfully
      if (typeof Worker !== 'undefined') {
        // In browser with worker, should be fast
        expect(duration).toBeLessThan(200);
      } else {
        // In Node.js tests with synchronous fallback, allow more time
        expect(duration).toBeLessThan(2000);
      }
    }, 10000); // 10 second timeout for this test
  });

  describe('terminateWorker', () => {
    it('should terminate worker successfully (when available)', () => {
      initWorker();

      if (typeof Worker !== 'undefined') {
        expect(isWorkerReady()).toBe(true);
      }

      terminateWorker();
      expect(isWorkerReady()).toBe(false);
    });

    it('should handle termination when no worker exists', () => {
      expect(() => terminateWorker()).not.toThrow();
    });
  });

  describe('getWorkerThreshold', () => {
    it('should return a positive number', () => {
      const threshold = getWorkerThreshold();
      expect(threshold).toBeGreaterThan(0);
      expect(typeof threshold).toBe('number');
    });
  });

  describe('viewport and zoom parameters', () => {
    it('should accept optional viewport and zoom parameters', async () => {
      const events = [
        { id: 'e1', start: 0n, end: 100n },
        { id: 'e2', start: 50n, end: 150n },
      ];

      const viewport = { start: 0n, end: 1000n };
      const zoomLevel = 1.5;

      const result = await calculateLayout(events, viewport, zoomLevel);

      expect(result).toBeDefined();
      expect(result.layouts.size).toBe(2);
    });
  });
});
