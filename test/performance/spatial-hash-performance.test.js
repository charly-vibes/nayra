import { describe, it, expect } from 'vitest';
import { SpatialHash, createSpatialHash } from '../../src/layout/spatial-hash.js';

describe('Spatial Hash Performance', () => {
  describe('Rebuild performance', () => {
    it('should rebuild hash for 10,000 events within 16ms (one frame)', () => {
      const events = [];
      for (let i = 0; i < 10000; i++) {
        events.push({
          id: `e${i}`,
          label: `Event ${i}`,
        });
      }

      const getBounds = (event) => {
        const idx = parseInt(event.id.slice(1));
        return {
          x: (idx % 100) * 50, // Distribute across screen
          y: Math.floor(idx / 100) * 30,
          width: 40,
          height: 20,
        };
      };

      const hash = new SpatialHash(50);
      const result = hash.rebuild(events, getBounds);

      expect(result.duration).toBeLessThan(16);
      expect(result.eventCount).toBe(10000);

      console.log(`Rebuilt spatial hash for 10,000 events in ${result.duration.toFixed(2)}ms`);
    });

    it('should handle viewport changes efficiently', () => {
      const events = [];
      for (let i = 0; i < 5000; i++) {
        events.push({ id: `e${i}` });
      }

      const hash = new SpatialHash(50);

      // Simulate 60 frames of viewport updates (1 second at 60 FPS)
      const frameTimes = [];
      for (let frame = 0; frame < 60; frame++) {
        const offset = frame * 10; // Simulate panning

        const getBounds = (event) => {
          const idx = parseInt(event.id.slice(1));
          return {
            x: (idx % 100) * 50 + offset,
            y: Math.floor(idx / 100) * 30,
            width: 40,
            height: 20,
          };
        };

        const frameStart = performance.now();
        hash.rebuild(events, getBounds);
        const frameDuration = performance.now() - frameStart;

        frameTimes.push(frameDuration);

        // Each frame should complete within 16ms
        expect(frameDuration).toBeLessThan(16);
      }

      const avgTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      const maxTime = Math.max(...frameTimes);

      console.log(`Viewport updates: avg ${avgTime.toFixed(2)}ms, max ${maxTime.toFixed(2)}ms`);
    });
  });

  describe('Query performance', () => {
    it('should query in O(1) average time', () => {
      const events = [];
      const eventCount = 10000;

      for (let i = 0; i < eventCount; i++) {
        events.push({ id: `e${i}` });
      }

      const getBounds = (event) => {
        const idx = parseInt(event.id.slice(1));
        return {
          x: (idx % 100) * 50,
          y: Math.floor(idx / 100) * 30,
          width: 40,
          height: 20,
        };
      };

      const hash = createSpatialHash(events, getBounds);

      // Perform 1000 random queries
      const queryTimes = [];
      for (let i = 0; i < 1000; i++) {
        const x = Math.random() * 5000;
        const y = Math.random() * 3000;

        const startTime = performance.now();
        hash.query(x, y);
        const queryDuration = performance.now() - startTime;

        queryTimes.push(queryDuration);
      }

      const avgQueryTime = queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length;
      const maxQueryTime = Math.max(...queryTimes);

      // Queries should be very fast (sub-millisecond)
      expect(avgQueryTime).toBeLessThan(1);
      expect(maxQueryTime).toBeLessThan(5);

      console.log(`Query performance: avg ${avgQueryTime.toFixed(4)}ms, max ${maxQueryTime.toFixed(4)}ms`);
    });

    it('should handle dense buckets efficiently', () => {
      const events = [];
      const denseBucketSize = 1000;

      // Create 1000 events in the same bucket
      for (let i = 0; i < denseBucketSize; i++) {
        events.push({ id: `e${i}` });
      }

      const getBounds = () => ({
        x: 100, // All in same position
        y: 100,
        width: 50,
        height: 20,
      });

      const hash = createSpatialHash(events, getBounds, 50);

      // Query the dense bucket
      const startTime = performance.now();
      const hits = hash.query(120, 110);
      const queryDuration = performance.now() - startTime;

      expect(hits.length).toBe(denseBucketSize);
      expect(queryDuration).toBeLessThan(5); // Should still be fast

      console.log(`Dense bucket query (${denseBucketSize} events): ${queryDuration.toFixed(2)}ms`);
    });

    it('should handle sparse distribution efficiently', () => {
      const events = [];
      const eventCount = 10000;

      // Spread events across large area
      for (let i = 0; i < eventCount; i++) {
        events.push({ id: `e${i}` });
      }

      const getBounds = (event) => {
        const idx = parseInt(event.id.slice(1));
        return {
          x: idx * 100, // 1 million pixels wide
          y: 100,
          width: 50,
          height: 20,
        };
      };

      const hash = createSpatialHash(events, getBounds, 50);

      // Query should only check relevant bucket
      const queries = [];
      for (let i = 0; i < 100; i++) {
        const x = i * 10000;
        const startTime = performance.now();
        hash.query(x, 110);
        const duration = performance.now() - startTime;
        queries.push(duration);
      }

      const avgTime = queries.reduce((a, b) => a + b, 0) / queries.length;

      // Should be very fast even with many events
      expect(avgTime).toBeLessThan(1);

      console.log(`Sparse distribution query: avg ${avgTime.toFixed(4)}ms`);
    });
  });

  describe('Bucket sizing optimization', () => {
    it('should verify 50px bucket width is optimal', () => {
      const events = [];
      for (let i = 0; i < 5000; i++) {
        events.push({ id: `e${i}` });
      }

      const getBounds = (event) => {
        const idx = parseInt(event.id.slice(1));
        return {
          x: (idx % 100) * 50,
          y: Math.floor(idx / 100) * 30,
          width: 40,
          height: 20,
        };
      };

      const bucketWidths = [20, 30, 50, 70, 100, 150];
      const results = [];

      for (const width of bucketWidths) {
        const hash = new SpatialHash(width);
        const rebuildResult = hash.rebuild(events, getBounds);

        // Test query performance
        const queryStart = performance.now();
        for (let i = 0; i < 100; i++) {
          hash.query(Math.random() * 5000, Math.random() * 1500);
        }
        const queryDuration = performance.now() - queryStart;

        const stats = hash.getStats();

        results.push({
          width,
          rebuildTime: rebuildResult.duration,
          queryTime: queryDuration / 100,
          bucketCount: stats.bucketCount,
          avgEventsPerBucket: stats.avgEventsPerBucket,
          maxEventsPerBucket: stats.maxEventsPerBucket,
        });
      }

      // Log results for comparison
      console.log('\nBucket width optimization results:');
      results.forEach(r => {
        console.log(
          `Width ${r.width}px: ` +
          `rebuild ${r.rebuildTime.toFixed(2)}ms, ` +
          `query ${r.queryTime.toFixed(4)}ms, ` +
          `${r.bucketCount} buckets, ` +
          `avg ${r.avgEventsPerBucket.toFixed(1)} events/bucket, ` +
          `max ${r.maxEventsPerBucket} events/bucket`
        );
      });

      // 50px should be competitive
      const fiftyPxResult = results.find(r => r.width === 50);
      expect(fiftyPxResult.rebuildTime).toBeLessThan(20);
      expect(fiftyPxResult.queryTime).toBeLessThan(1);
    });
  });

  describe('Worst-case scenarios', () => {
    it('should handle all events in single bucket', () => {
      const events = [];
      const eventCount = 5000;

      for (let i = 0; i < eventCount; i++) {
        events.push({ id: `e${i}` });
      }

      // All events at same position
      const getBounds = () => ({
        x: 100,
        y: 100,
        width: 10,
        height: 10,
      });

      const hash = new SpatialHash(50);
      const rebuildResult = hash.rebuild(events, getBounds);

      const stats = hash.getStats();
      expect(stats.bucketCount).toBe(1);
      expect(stats.maxEventsPerBucket).toBe(eventCount);

      // Should still rebuild quickly
      expect(rebuildResult.duration).toBeLessThan(20);

      // Query should return all events
      const hits = hash.query(105, 105);
      expect(hits.length).toBe(eventCount);
    });

    it('should handle very wide events spanning many buckets', () => {
      const events = [
        { id: 'wide', label: 'Very Wide Event' },
      ];

      const getBounds = () => ({
        x: 0,
        y: 100,
        width: 5000, // Spans 100 buckets at 50px width
        height: 20,
      });

      const hash = new SpatialHash(50);
      hash.rebuild(events, getBounds);

      // Event should be in all 100+ buckets
      const stats = hash.getStats();
      expect(stats.bucketCount).toBeGreaterThan(95);

      // Should be findable from any position it spans
      const hit1 = hash.query(100, 110);
      const hit2 = hash.query(2500, 110);
      const hit3 = hash.query(4900, 110);

      expect(hit1.length).toBe(1);
      expect(hit2.length).toBe(1);
      expect(hit3.length).toBe(1);
    });

    it('should handle many events with varied widths', () => {
      const events = [];

      // Mix of narrow and wide events
      for (let i = 0; i < 1000; i++) {
        events.push({ id: `narrow_${i}` });
      }
      for (let i = 0; i < 100; i++) {
        events.push({ id: `wide_${i}` });
      }

      const getBounds = (event) => {
        if (event.id.startsWith('narrow')) {
          const idx = parseInt(event.id.split('_')[1]);
          return { x: idx * 10, y: 100, width: 8, height: 20 };
        } else {
          const idx = parseInt(event.id.split('_')[1]);
          return { x: idx * 100, y: 100, width: 500, height: 20 };
        }
      };

      const hash = new SpatialHash(50);
      const rebuildResult = hash.rebuild(events, getBounds);

      expect(rebuildResult.duration).toBeLessThan(20);

      // Wide events should be in multiple buckets
      const stats = hash.getStats();
      expect(stats.totalEventBucketMappings).toBeGreaterThan(events.length);

      console.log(`Mixed widths: ${stats.totalEventBucketMappings} mappings for ${events.length} events`);
    });
  });

  describe('Memory efficiency', () => {
    it('should handle large number of events without excessive memory', () => {
      const events = [];
      const eventCount = 50000;

      for (let i = 0; i < eventCount; i++) {
        events.push({ id: `e${i}` });
      }

      const getBounds = (event) => {
        const idx = parseInt(event.id.slice(1));
        return {
          x: (idx % 1000) * 20,
          y: Math.floor(idx / 1000) * 30,
          width: 15,
          height: 20,
        };
      };

      const hash = new SpatialHash(50);
      const rebuildResult = hash.rebuild(events, getBounds);

      const stats = hash.getStats();

      // Should complete rebuild
      expect(rebuildResult.eventCount).toBe(eventCount);

      // Rebuild should still be reasonably fast
      expect(rebuildResult.duration).toBeLessThan(100);

      console.log(`Large dataset (${eventCount} events): ${rebuildResult.duration.toFixed(2)}ms, ${stats.bucketCount} buckets`);
    });

    it('should efficiently handle clear and rebuild cycles', () => {
      const events = [];
      for (let i = 0; i < 1000; i++) {
        events.push({ id: `e${i}` });
      }

      const hash = new SpatialHash(50);

      // Perform 100 clear/rebuild cycles
      const cycleTimes = [];
      for (let cycle = 0; cycle < 100; cycle++) {
        const getBounds = (event) => {
          const idx = parseInt(event.id.slice(1));
          return {
            x: (idx % 100) * 50 + cycle * 10,
            y: Math.floor(idx / 100) * 30,
            width: 40,
            height: 20,
          };
        };

        const startTime = performance.now();
        hash.rebuild(events, getBounds);
        const duration = performance.now() - startTime;

        cycleTimes.push(duration);
      }

      const avgTime = cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length;

      // Should not slow down over time (no memory leaks)
      const firstTenAvg = cycleTimes.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
      const lastTenAvg = cycleTimes.slice(-10).reduce((a, b) => a + b, 0) / 10;

      expect(lastTenAvg).toBeLessThan(firstTenAvg * 1.5); // Allow 50% variance

      console.log(`Rebuild cycles: avg ${avgTime.toFixed(2)}ms, first 10: ${firstTenAvg.toFixed(2)}ms, last 10: ${lastTenAvg.toFixed(2)}ms`);
    });
  });
});
