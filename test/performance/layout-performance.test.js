import { describe, it, expect } from 'vitest';
import { assignLanes } from '../../src/layout/greedy-interval-coloring.js';

describe('Layout Performance Benchmarks', () => {
  describe('O(N log N) complexity verification', () => {
    it('should complete layout for 10,000 events within 100ms', () => {
      // Generate 10,000 events with random time ranges
      const events = [];
      for (let i = 0; i < 10000; i++) {
        const start = BigInt(Math.floor(Math.random() * 1000000));
        const duration = BigInt(Math.floor(Math.random() * 10000) + 1000);
        events.push({
          id: `e${i}`,
          start: start,
          end: start + duration,
        });
      }

      const startTime = performance.now();
      const result = assignLanes(events);
      const duration = performance.now() - startTime;

      expect(result.layouts.size).toBe(10000);
      expect(duration).toBeLessThan(100);

      console.log(`Layout for 10,000 events completed in ${duration.toFixed(2)}ms`);
    });

    it('should scale linearly with sorted input (best case)', () => {
      const sizes = [1000, 5000, 10000];
      const times = [];

      for (const size of sizes) {
        const events = [];
        for (let i = 0; i < size; i++) {
          events.push({
            id: `e${i}`,
            start: BigInt(i * 1000),
            end: BigInt(i * 1000 + 500),
          });
        }

        const startTime = performance.now();
        assignLanes(events);
        const duration = performance.now() - startTime;
        times.push(duration);
      }

      console.log(`Sorted input scaling: ${sizes.map((s, i) => `${s}: ${times[i].toFixed(2)}ms`).join(', ')}`);

      // Each doubling should not take more than 3x the time (accounting for O(N log N))
      expect(times[2] / times[0]).toBeLessThan(15); // 10x size should be < 15x time
    });

    it('should handle worst-case overlapping events efficiently', () => {
      const sizes = [1000, 5000, 10000];
      const times = [];

      for (const size of sizes) {
        const events = [];
        // All events overlap (worst case for lane assignment)
        for (let i = 0; i < size; i++) {
          events.push({
            id: `e${i}`,
            start: 0n,
            end: 1000000n,
          });
        }

        const startTime = performance.now();
        assignLanes(events);
        const duration = performance.now() - startTime;
        times.push(duration);
      }

      console.log(`Overlapping events scaling: ${sizes.map((s, i) => `${s}: ${times[i].toFixed(2)}ms`).join(', ')}`);

      // Should still complete in reasonable time even in worst case
      // Note: 10,000 overlapping events is an extreme worst case
      expect(times[2]).toBeLessThan(1000); // Allow up to 1 second for this worst case
    });

    it('should verify dominant cost is sorting', () => {
      const size = 10000;

      // Measure with pre-sorted events (no sorting needed)
      const sortedEvents = [];
      for (let i = 0; i < size; i++) {
        sortedEvents.push({
          id: `e${i}`,
          start: BigInt(i * 1000),
          end: BigInt(i * 1000 + 500),
        });
      }

      const sortedStartTime = performance.now();
      assignLanes(sortedEvents);
      const sortedDuration = performance.now() - sortedStartTime;

      // Measure with randomly ordered events (sorting required)
      const unsortedEvents = [];
      const indices = Array.from({ length: size }, (_, i) => i);
      // Fisher-Yates shuffle
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      for (const i of indices) {
        unsortedEvents.push({
          id: `e${i}`,
          start: BigInt(i * 1000),
          end: BigInt(i * 1000 + 500),
        });
      }

      const unsortedStartTime = performance.now();
      assignLanes(unsortedEvents);
      const unsortedDuration = performance.now() - unsortedStartTime;

      console.log(`Sorted: ${sortedDuration.toFixed(2)}ms, Unsorted: ${unsortedDuration.toFixed(2)}ms`);

      // Unsorted should take more time due to sorting overhead
      // But both should complete quickly
      expect(sortedDuration).toBeLessThan(100);
      expect(unsortedDuration).toBeLessThan(100);
    });
  });

  describe('Memory efficiency', () => {
    it('should handle large datasets without excessive memory usage', () => {
      const events = [];
      const size = 50000;

      for (let i = 0; i < size; i++) {
        events.push({
          id: `e${i}`,
          start: BigInt(i * 100),
          end: BigInt(i * 100 + 50),
        });
      }

      const result = assignLanes(events);

      // Verify result is correct
      expect(result.layouts.size).toBe(size);

      // Should complete without running out of memory
      expect(result.laneCount).toBeGreaterThan(0);
    });
  });

  describe('Deep time performance', () => {
    it('should handle BigInt timestamps efficiently', () => {
      const BILLION_YEARS = 31557600000000000n;
      const events = [];

      // Create events spanning billions of years
      for (let i = 0; i < 10000; i++) {
        const start = BigInt(i) * BILLION_YEARS;
        const end = start + BILLION_YEARS / 2n;
        events.push({
          id: `e${i}`,
          start,
          end,
        });
      }

      const startTime = performance.now();
      const result = assignLanes(events);
      const duration = performance.now() - startTime;

      expect(result.layouts.size).toBe(10000);
      expect(duration).toBeLessThan(100);

      console.log(`Deep time layout for 10,000 events: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Real-world patterns', () => {
    it('should handle dense historical timeline efficiently', () => {
      // Simulate a dense historical timeline with many overlapping periods
      const events = [];
      const baseTime = -13800000000n * 31557600n; // 13.8 billion years ago (Big Bang)

      // Add 10,000 historical events with varying durations
      for (let i = 0; i < 10000; i++) {
        const yearOffset = BigInt(Math.floor(Math.random() * 13800000000));
        const durationYears = BigInt(Math.floor(Math.random() * 1000000) + 1);

        const start = baseTime + yearOffset * 31557600n;
        const end = start + durationYears * 31557600n;

        events.push({
          id: `event_${i}`,
          start,
          end,
        });
      }

      const startTime = performance.now();
      const result = assignLanes(events);
      const duration = performance.now() - startTime;

      expect(result.layouts.size).toBe(10000);
      expect(duration).toBeLessThan(150); // Allow slightly more time for complex patterns

      console.log(`Historical timeline layout: ${duration.toFixed(2)}ms, ${result.laneCount} lanes`);
    });

    it('should handle alternating dense and sparse regions', () => {
      const events = [];
      let eventId = 0;

      // Create 5 dense regions with 1000 overlapping events each
      for (let region = 0; region < 5; region++) {
        const regionStart = BigInt(region * 1000000);

        for (let i = 0; i < 1000; i++) {
          events.push({
            id: `dense_${eventId++}`,
            start: regionStart + BigInt(Math.floor(Math.random() * 10000)),
            end: regionStart + BigInt(Math.floor(Math.random() * 10000) + 10000),
          });
        }

        // Sparse region between dense regions
        if (region < 4) {
          const sparseStart = regionStart + 500000n;
          for (let i = 0; i < 100; i++) {
            events.push({
              id: `sparse_${eventId++}`,
              start: sparseStart + BigInt(i * 1000),
              end: sparseStart + BigInt(i * 1000 + 100),
            });
          }
        }
      }

      const startTime = performance.now();
      const result = assignLanes(events);
      const duration = performance.now() - startTime;

      expect(result.layouts.size).toBe(events.length);
      expect(duration).toBeLessThan(100);

      console.log(`Mixed density layout (${events.length} events): ${duration.toFixed(2)}ms`);
    });
  });

  describe('Edge case performance', () => {
    it('should handle many simultaneous events efficiently', () => {
      const events = [];
      const simultaneousCount = 10000;

      // All events start at the same time with different durations
      for (let i = 0; i < simultaneousCount; i++) {
        events.push({
          id: `e${i}`,
          start: 0n,
          end: BigInt(i + 1),
        });
      }

      const startTime = performance.now();
      const result = assignLanes(events);
      const duration = performance.now() - startTime;

      expect(result.layouts.size).toBe(simultaneousCount);
      // Allow more time for this worst case scenario
      expect(duration).toBeLessThan(1000);

      console.log(`Simultaneous events layout: ${duration.toFixed(2)}ms`);
    });

    it('should handle many point events efficiently', () => {
      const events = [];

      for (let i = 0; i < 10000; i++) {
        events.push({
          id: `p${i}`,
          start: BigInt(Math.floor(Math.random() * 1000000)),
        });
      }

      const startTime = performance.now();
      const result = assignLanes(events);
      const duration = performance.now() - startTime;

      expect(result.layouts.size).toBe(10000);
      expect(duration).toBeLessThan(100);

      console.log(`Point events layout: ${duration.toFixed(2)}ms`);
    });

    it('should handle very long-running events with many nested events', () => {
      const events = [];

      // One very long event
      events.push({
        id: 'container',
        start: 0n,
        end: 10000000n,
      });

      // 10,000 short events nested within
      for (let i = 0; i < 10000; i++) {
        const start = BigInt(Math.floor(Math.random() * 9900000));
        events.push({
          id: `nested_${i}`,
          start,
          end: start + BigInt(Math.floor(Math.random() * 1000) + 100),
        });
      }

      const startTime = performance.now();
      const result = assignLanes(events);
      const duration = performance.now() - startTime;

      expect(result.layouts.size).toBe(10001);
      expect(duration).toBeLessThan(100);

      console.log(`Nested events layout: ${duration.toFixed(2)}ms`);
    });
  });
});
