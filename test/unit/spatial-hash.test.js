import { describe, it, expect, beforeEach } from 'vitest';
import { SpatialHash, createSpatialHash, DEFAULT_BUCKET_WIDTH } from '../../src/layout/spatial-hash.js';

describe('SpatialHash', () => {
  let hash;

  beforeEach(() => {
    hash = new SpatialHash();
  });

  describe('construction', () => {
    it('creates with default bucket width', () => {
      expect(hash.bucketWidth).toBe(DEFAULT_BUCKET_WIDTH);
    });

    it('creates with custom bucket width', () => {
      const customHash = new SpatialHash(100);
      expect(customHash.bucketWidth).toBe(100);
    });

    it('starts with empty buckets', () => {
      const stats = hash.getStats();
      expect(stats.bucketCount).toBe(0);
      expect(stats.eventCount).toBe(0);
    });
  });

  describe('getBucketIndex', () => {
    it('calculates correct bucket index for x=0', () => {
      const idx = hash.getBucketIndex(0);
      expect(idx).toBe(0);
    });

    it('calculates correct bucket index for x in first bucket', () => {
      const idx = hash.getBucketIndex(25);
      expect(idx).toBe(0); // 25 / 50 = 0
    });

    it('calculates correct bucket index for x in second bucket', () => {
      const idx = hash.getBucketIndex(75);
      expect(idx).toBe(1); // 75 / 50 = 1
    });

    it('calculates correct bucket index for large x', () => {
      const idx = hash.getBucketIndex(525);
      expect(idx).toBe(10); // 525 / 50 = 10
    });

    it('handles negative x coordinates', () => {
      const idx = hash.getBucketIndex(-25);
      expect(idx).toBe(-1); // Math.floor(-25 / 50) = -1
    });
  });

  describe('insert', () => {
    it('inserts event into single bucket', () => {
      const event = { id: 'e1', label: 'Event 1' };
      hash.insert(event, 10, 100, 30, 20);

      const stats = hash.getStats();
      expect(stats.eventCount).toBe(1);
      expect(stats.bucketCount).toBe(1);
    });

    it('inserts event into multiple buckets when it spans boundaries', () => {
      const event = { id: 'e1', label: 'Event 1' };
      // Event from x=25 to x=125 (width 100) spans buckets 0, 1, 2
      hash.insert(event, 25, 100, 100, 20);

      const stats = hash.getStats();
      expect(stats.eventCount).toBe(1);
      expect(stats.bucketCount).toBe(3); // Buckets 0, 1, 2
    });

    it('caches event bounds', () => {
      const event = { id: 'e1', label: 'Event 1' };
      hash.insert(event, 10, 100, 30, 20);

      expect(hash.eventBounds.has('e1')).toBe(true);
      const bounds = hash.eventBounds.get('e1');
      expect(bounds).toEqual({ x: 10, y: 100, width: 30, height: 20 });
    });

    it('handles multiple events in same bucket', () => {
      const event1 = { id: 'e1', label: 'Event 1' };
      const event2 = { id: 'e2', label: 'Event 2' };

      hash.insert(event1, 10, 100, 20, 20);
      hash.insert(event2, 15, 110, 20, 20);

      const stats = hash.getStats();
      expect(stats.eventCount).toBe(2);
      expect(stats.bucketCount).toBe(1); // Both in bucket 0
    });
  });

  describe('pointInBounds', () => {
    it('returns true for point inside bounds', () => {
      const bounds = { x: 10, y: 20, width: 50, height: 30 };
      expect(hash.pointInBounds(30, 35, bounds)).toBe(true);
    });

    it('returns true for point at top-left corner', () => {
      const bounds = { x: 10, y: 20, width: 50, height: 30 };
      expect(hash.pointInBounds(10, 20, bounds)).toBe(true);
    });

    it('returns true for point at bottom-right corner', () => {
      const bounds = { x: 10, y: 20, width: 50, height: 30 };
      expect(hash.pointInBounds(60, 50, bounds)).toBe(true);
    });

    it('returns false for point outside bounds (left)', () => {
      const bounds = { x: 10, y: 20, width: 50, height: 30 };
      expect(hash.pointInBounds(5, 35, bounds)).toBe(false);
    });

    it('returns false for point outside bounds (right)', () => {
      const bounds = { x: 10, y: 20, width: 50, height: 30 };
      expect(hash.pointInBounds(65, 35, bounds)).toBe(false);
    });

    it('returns false for point outside bounds (above)', () => {
      const bounds = { x: 10, y: 20, width: 50, height: 30 };
      expect(hash.pointInBounds(30, 15, bounds)).toBe(false);
    });

    it('returns false for point outside bounds (below)', () => {
      const bounds = { x: 10, y: 20, width: 50, height: 30 };
      expect(hash.pointInBounds(30, 55, bounds)).toBe(false);
    });
  });

  describe('query', () => {
    it('returns empty array for empty hash', () => {
      const hits = hash.query(100, 100);
      expect(hits).toEqual([]);
    });

    it('returns empty array for position with no events', () => {
      const event = { id: 'e1', label: 'Event 1' };
      hash.insert(event, 10, 100, 30, 20);

      const hits = hash.query(500, 100);
      expect(hits).toEqual([]);
    });

    it('returns event when point is inside event bounds', () => {
      const event = { id: 'e1', label: 'Event 1' };
      hash.insert(event, 10, 100, 30, 20);

      const hits = hash.query(20, 110);
      expect(hits).toHaveLength(1);
      expect(hits[0]).toBe(event);
    });

    it('returns multiple events when they overlap at point', () => {
      const event1 = { id: 'e1', label: 'Event 1' };
      const event2 = { id: 'e2', label: 'Event 2' };

      hash.insert(event1, 10, 100, 40, 20);
      hash.insert(event2, 20, 105, 40, 20);

      const hits = hash.query(30, 110);
      expect(hits).toHaveLength(2);
    });

    it('does not return events in same bucket but outside bounds', () => {
      const event1 = { id: 'e1', label: 'Event 1' };
      const event2 = { id: 'e2', label: 'Event 2' };

      // Both events in same bucket but at different Y positions
      hash.insert(event1, 10, 100, 20, 20);
      hash.insert(event2, 15, 200, 20, 20);

      const hits = hash.query(20, 110);
      expect(hits).toHaveLength(1);
      expect(hits[0]).toBe(event1);
    });

    it('handles queries in buckets with no events', () => {
      const event = { id: 'e1', label: 'Event 1' };
      hash.insert(event, 10, 100, 20, 20);

      // Query in a different bucket
      const hits = hash.query(500, 110);
      expect(hits).toEqual([]);
    });
  });

  describe('queryFirst', () => {
    it('returns null for empty hash', () => {
      const hit = hash.queryFirst(100, 100);
      expect(hit).toBeNull();
    });

    it('returns the event when only one event at point', () => {
      const event = { id: 'e1', label: 'Event 1' };
      hash.insert(event, 10, 100, 30, 20);

      const hit = hash.queryFirst(20, 110);
      expect(hit).toBe(event);
    });

    it('returns the last event when multiple events overlap', () => {
      const event1 = { id: 'e1', label: 'Event 1' };
      const event2 = { id: 'e2', label: 'Event 2' };

      hash.insert(event1, 10, 100, 40, 20);
      hash.insert(event2, 20, 105, 40, 20);

      const hit = hash.queryFirst(30, 110);
      // Should return last inserted (topmost)
      expect(hit).toBe(event2);
    });
  });

  describe('clear', () => {
    it('removes all events and buckets', () => {
      const event1 = { id: 'e1', label: 'Event 1' };
      const event2 = { id: 'e2', label: 'Event 2' };

      hash.insert(event1, 10, 100, 30, 20);
      hash.insert(event2, 60, 100, 30, 20);

      hash.clear();

      const stats = hash.getStats();
      expect(stats.eventCount).toBe(0);
      expect(stats.bucketCount).toBe(0);
    });
  });

  describe('rebuild', () => {
    it('rebuilds hash from event array', () => {
      const events = [
        { id: 'e1', label: 'Event 1' },
        { id: 'e2', label: 'Event 2' },
        { id: 'e3', label: 'Event 3' },
      ];

      const getBounds = (event) => {
        const idx = parseInt(event.id.slice(1));
        return { x: idx * 100, y: 100, width: 50, height: 20 };
      };

      const result = hash.rebuild(events, getBounds);

      expect(result.eventCount).toBe(3);
      const stats = hash.getStats();
      expect(stats.eventCount).toBe(3);
    });

    it('completes rebuild quickly', () => {
      // Generate many events
      const events = [];
      for (let i = 0; i < 1000; i++) {
        events.push({ id: `e${i}`, label: `Event ${i}` });
      }

      const getBounds = (event) => {
        const idx = parseInt(event.id.slice(1));
        return { x: idx * 10, y: 100, width: 50, height: 20 };
      };

      const result = hash.rebuild(events, getBounds);

      // Should complete within 16ms (one frame at 60 FPS)
      expect(result.duration).toBeLessThan(16);
    });

    it('clears previous data before rebuilding', () => {
      const event1 = { id: 'e1', label: 'Event 1' };
      hash.insert(event1, 10, 100, 30, 20);

      const events = [{ id: 'e2', label: 'Event 2' }];
      const getBounds = () => ({ x: 100, y: 100, width: 50, height: 20 });

      hash.rebuild(events, getBounds);

      const stats = hash.getStats();
      expect(stats.eventCount).toBe(1);
      expect(hash.eventBounds.has('e1')).toBe(false);
      expect(hash.eventBounds.has('e2')).toBe(true);
    });
  });

  describe('getStats', () => {
    it('returns correct statistics', () => {
      const event1 = { id: 'e1', label: 'Event 1' };
      const event2 = { id: 'e2', label: 'Event 2' };
      const event3 = { id: 'e3', label: 'Event 3' };

      hash.insert(event1, 10, 100, 30, 20);    // Bucket 0
      hash.insert(event2, 60, 100, 30, 20);    // Bucket 1
      hash.insert(event3, 15, 100, 30, 20);    // Bucket 0

      const stats = hash.getStats();

      expect(stats.eventCount).toBe(3);
      expect(stats.bucketCount).toBe(2);
      expect(stats.bucketWidth).toBe(DEFAULT_BUCKET_WIDTH);
      expect(stats.maxEventsPerBucket).toBe(2); // Bucket 0 has 2 events
    });
  });

  describe('createSpatialHash helper', () => {
    it('creates and populates hash from events', () => {
      const events = [
        { id: 'e1', label: 'Event 1' },
        { id: 'e2', label: 'Event 2' },
      ];

      const getBounds = (event) => ({ x: 10, y: 100, width: 30, height: 20 });

      const hash = createSpatialHash(events, getBounds);

      expect(hash).toBeInstanceOf(SpatialHash);
      const stats = hash.getStats();
      expect(stats.eventCount).toBe(2);
    });

    it('accepts custom bucket width', () => {
      const events = [{ id: 'e1', label: 'Event 1' }];
      const getBounds = () => ({ x: 10, y: 100, width: 30, height: 20 });

      const hash = createSpatialHash(events, getBounds, 100);

      expect(hash.bucketWidth).toBe(100);
    });
  });

  describe('performance scenarios', () => {
    it('handles dense event clusters efficiently', () => {
      const events = [];
      // 100 overlapping events in same area
      for (let i = 0; i < 100; i++) {
        events.push({ id: `e${i}`, label: `Event ${i}` });
      }

      const getBounds = () => ({ x: 100, y: 100, width: 50, height: 20 });
      hash.rebuild(events, getBounds);

      // Query should still be fast even with many events in one bucket
      const startTime = performance.now();
      const hits = hash.query(120, 110);
      const duration = performance.now() - startTime;

      expect(hits.length).toBe(100);
      expect(duration).toBeLessThan(5); // Should be very fast
    });

    it('handles sparse event distribution', () => {
      const events = [];
      // 1000 events spread across screen
      for (let i = 0; i < 1000; i++) {
        events.push({ id: `e${i}`, label: `Event ${i}` });
      }

      const getBounds = (event) => {
        const idx = parseInt(event.id.slice(1));
        return { x: idx * 100, y: 100, width: 50, height: 20 };
      };

      hash.rebuild(events, getBounds);

      // Queries should only check relevant bucket
      const hits = hash.query(550, 110);
      expect(hits.length).toBe(1);
      expect(hits[0].id).toBe('e5');
    });

    it('handles events spanning many buckets', () => {
      const event = { id: 'e1', label: 'Very wide event' };
      // Event 500px wide spanning 11 buckets (0-10)
      hash.insert(event, 0, 100, 500, 20);

      const stats = hash.getStats();
      expect(stats.bucketCount).toBe(11);

      // Event should be found in any of the buckets it spans
      const hits1 = hash.query(25, 110);
      const hits2 = hash.query(250, 110);
      const hits3 = hash.query(475, 110);

      expect(hits1[0]).toBe(event);
      expect(hits2[0]).toBe(event);
      expect(hits3[0]).toBe(event);
    });
  });
});
