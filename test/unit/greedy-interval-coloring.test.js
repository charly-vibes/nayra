import { describe, it, expect } from 'vitest';
import { assignLanes } from '../../src/layout/greedy-interval-coloring.js';

describe('assignLanes - Greedy Interval Coloring', () => {
  describe('basic functionality', () => {
    it('returns empty result for empty array', () => {
      const result = assignLanes([]);
      expect(result.layouts.size).toBe(0);
      expect(result.laneCount).toBe(0);
    });

    it('returns empty result for null input', () => {
      const result = assignLanes(null);
      expect(result.layouts.size).toBe(0);
      expect(result.laneCount).toBe(0);
    });

    it('assigns single event to lane 0', () => {
      const events = [
        { id: 'e1', start: 0n, end: 100n },
      ];
      const result = assignLanes(events);
      expect(result.layouts.get('e1')).toBe(0);
      expect(result.laneCount).toBe(1);
    });
  });

  describe('non-overlapping events', () => {
    it('places sequential non-overlapping events in lane 0', () => {
      const events = [
        { id: 'e1', start: 0n, end: 100n },
        { id: 'e2', start: 100n, end: 200n },
        { id: 'e3', start: 200n, end: 300n },
      ];
      const result = assignLanes(events);

      expect(result.layouts.get('e1')).toBe(0);
      expect(result.layouts.get('e2')).toBe(0);
      expect(result.layouts.get('e3')).toBe(0);
      expect(result.laneCount).toBe(1);
    });

    it('places non-adjacent non-overlapping events in lane 0', () => {
      const events = [
        { id: 'e1', start: 0n, end: 50n },
        { id: 'e2', start: 100n, end: 150n },
        { id: 'e3', start: 200n, end: 250n },
      ];
      const result = assignLanes(events);

      expect(result.layouts.get('e1')).toBe(0);
      expect(result.layouts.get('e2')).toBe(0);
      expect(result.layouts.get('e3')).toBe(0);
      expect(result.laneCount).toBe(1);
    });
  });

  describe('overlapping events', () => {
    it('places two overlapping events in different lanes', () => {
      const events = [
        { id: 'e1', start: 0n, end: 100n },
        { id: 'e2', start: 50n, end: 150n },
      ];
      const result = assignLanes(events);

      expect(result.layouts.get('e1')).toBe(0);
      expect(result.layouts.get('e2')).toBe(1);
      expect(result.laneCount).toBe(2);
    });

    it('handles the canonical three-event example from spec', () => {
      // Event A (0-100), Event B (50-150), Event C (120-200)
      // Expected: A in lane 0, B in lane 1, C in lane 0 (doesn't overlap A)
      const events = [
        { id: 'A', start: 0n, end: 100n },
        { id: 'B', start: 50n, end: 150n },
        { id: 'C', start: 120n, end: 200n },
      ];
      const result = assignLanes(events);

      expect(result.layouts.get('A')).toBe(0);
      expect(result.layouts.get('B')).toBe(1);
      expect(result.layouts.get('C')).toBe(0);
      expect(result.laneCount).toBe(2);
    });

    it('handles multiple overlapping events requiring many lanes', () => {
      const events = [
        { id: 'e1', start: 0n, end: 400n },
        { id: 'e2', start: 50n, end: 450n },
        { id: 'e3', start: 100n, end: 500n },
        { id: 'e4', start: 150n, end: 550n },
      ];
      const result = assignLanes(events);

      expect(result.layouts.get('e1')).toBe(0);
      expect(result.layouts.get('e2')).toBe(1);
      expect(result.layouts.get('e3')).toBe(2);
      expect(result.layouts.get('e4')).toBe(3);
      expect(result.laneCount).toBe(4);
    });

    it('reuses lanes when they become available', () => {
      const events = [
        { id: 'e1', start: 0n, end: 100n },
        { id: 'e2', start: 50n, end: 150n },
        { id: 'e3', start: 100n, end: 200n },
        { id: 'e4', start: 150n, end: 250n },
      ];
      const result = assignLanes(events);

      expect(result.layouts.get('e1')).toBe(0);
      expect(result.layouts.get('e2')).toBe(1);
      expect(result.layouts.get('e3')).toBe(0); // Reuses lane 0
      expect(result.layouts.get('e4')).toBe(1); // Reuses lane 1
      expect(result.laneCount).toBe(2);
    });
  });

  describe('simultaneous events (same start time)', () => {
    it('places longer event in lower lane for same start time', () => {
      const events = [
        { id: 'short', start: 0n, end: 100n },
        { id: 'long', start: 0n, end: 200n },
      ];
      const result = assignLanes(events);

      expect(result.layouts.get('long')).toBe(0);
      expect(result.layouts.get('short')).toBe(1);
      expect(result.laneCount).toBe(2);
    });

    it('uses ID for tie-breaking when duration is same', () => {
      const events = [
        { id: 'zebra', start: 0n, end: 100n },
        { id: 'alpha', start: 0n, end: 100n },
      ];
      const result = assignLanes(events);

      // Alpha sorts before zebra alphabetically
      expect(result.layouts.get('alpha')).toBe(0);
      expect(result.layouts.get('zebra')).toBe(1);
      expect(result.laneCount).toBe(2);
    });

    it('handles three simultaneous events with different durations', () => {
      const events = [
        { id: 'short', start: 0n, end: 100n },
        { id: 'medium', start: 0n, end: 200n },
        { id: 'long', start: 0n, end: 300n },
      ];
      const result = assignLanes(events);

      expect(result.layouts.get('long')).toBe(0);
      expect(result.layouts.get('medium')).toBe(1);
      expect(result.layouts.get('short')).toBe(2);
      expect(result.laneCount).toBe(3);
    });
  });

  describe('point events (no end time)', () => {
    it('places point event in lane 0', () => {
      const events = [
        { id: 'p1', start: 0n, end: undefined },
      ];
      const result = assignLanes(events);

      expect(result.layouts.get('p1')).toBe(0);
      expect(result.laneCount).toBe(1);
    });

    it('point events do not block lanes for future events', () => {
      const events = [
        { id: 'p1', start: 0n, end: undefined },
        { id: 'e1', start: 50n, end: 100n },
      ];
      const result = assignLanes(events);

      expect(result.layouts.get('p1')).toBe(0);
      expect(result.layouts.get('e1')).toBe(0); // Can reuse lane 0
      expect(result.laneCount).toBe(1);
    });

    it('treats point events as longer duration for same start time', () => {
      const events = [
        { id: 'duration', start: 0n, end: 100n },
        { id: 'point', start: 0n, end: undefined },
      ];
      const result = assignLanes(events);

      // Point event goes in lower lane (treated as infinite duration)
      expect(result.layouts.get('point')).toBe(0);
      expect(result.layouts.get('duration')).toBe(1);
      expect(result.laneCount).toBe(2);
    });

    it('uses ID for tie-breaking between multiple point events', () => {
      const events = [
        { id: 'zebra', start: 0n, end: undefined },
        { id: 'alpha', start: 0n, end: undefined },
      ];
      const result = assignLanes(events);

      expect(result.layouts.get('alpha')).toBe(0);
      expect(result.layouts.get('zebra')).toBe(1);
      expect(result.laneCount).toBe(2);
    });
  });

  describe('deterministic layout', () => {
    it('produces same result on multiple runs', () => {
      const events = [
        { id: 'e1', start: 0n, end: 100n },
        { id: 'e2', start: 50n, end: 150n },
        { id: 'e3', start: 100n, end: 200n },
        { id: 'e4', start: 150n, end: 250n },
      ];

      const result1 = assignLanes(events);
      const result2 = assignLanes(events);

      expect(result1.layouts.get('e1')).toBe(result2.layouts.get('e1'));
      expect(result1.layouts.get('e2')).toBe(result2.layouts.get('e2'));
      expect(result1.layouts.get('e3')).toBe(result2.layouts.get('e3'));
      expect(result1.layouts.get('e4')).toBe(result2.layouts.get('e4'));
      expect(result1.laneCount).toBe(result2.laneCount);
    });

    it('produces same result regardless of input order', () => {
      const events1 = [
        { id: 'e1', start: 0n, end: 100n },
        { id: 'e2', start: 50n, end: 150n },
        { id: 'e3', start: 100n, end: 200n },
      ];

      const events2 = [
        { id: 'e3', start: 100n, end: 200n },
        { id: 'e1', start: 0n, end: 100n },
        { id: 'e2', start: 50n, end: 150n },
      ];

      const result1 = assignLanes(events1);
      const result2 = assignLanes(events2);

      expect(result1.layouts.get('e1')).toBe(result2.layouts.get('e1'));
      expect(result1.layouts.get('e2')).toBe(result2.layouts.get('e2'));
      expect(result1.layouts.get('e3')).toBe(result2.layouts.get('e3'));
      expect(result1.laneCount).toBe(result2.laneCount);
    });
  });

  describe('complex scenarios', () => {
    it('handles mix of overlapping, non-overlapping, and point events', () => {
      const events = [
        { id: 'e1', start: 0n, end: 100n },
        { id: 'p1', start: 50n, end: undefined },
        { id: 'e2', start: 75n, end: 125n },
        { id: 'e3', start: 150n, end: 200n },
        { id: 'p2', start: 175n, end: undefined },
      ];
      const result = assignLanes(events);

      expect(result.layouts.get('e1')).toBe(0);
      expect(result.layouts.get('p1')).toBe(1);
      expect(result.layouts.get('e2')).toBe(1); // Reuses lane 1 (p1 doesn't block it)
      expect(result.layouts.get('e3')).toBe(0); // Reuses lane 0
      expect(result.layouts.get('p2')).toBe(1); // Reuses lane 1
    });

    it('handles deep time with BigInt timestamps', () => {
      const BILLION_YEARS = 31_536_000_000_000_000n;
      const events = [
        { id: 'e1', start: -13n * BILLION_YEARS, end: -10n * BILLION_YEARS },
        { id: 'e2', start: -12n * BILLION_YEARS, end: -9n * BILLION_YEARS },
        { id: 'e3', start: -11n * BILLION_YEARS, end: -8n * BILLION_YEARS },
      ];
      const result = assignLanes(events);

      expect(result.layouts.get('e1')).toBe(0);
      expect(result.layouts.get('e2')).toBe(1);
      expect(result.layouts.get('e3')).toBe(2);
      expect(result.laneCount).toBe(3);
    });

    it('handles large number of events efficiently', () => {
      // Generate 1000 events with random overlaps
      const events = [];
      for (let i = 0; i < 1000; i++) {
        const start = BigInt(i * 50);
        const end = start + 100n;
        events.push({ id: `e${i}`, start, end });
      }

      const startTime = performance.now();
      const result = assignLanes(events);
      const endTime = performance.now();

      expect(result.layouts.size).toBe(1000);
      expect(result.laneCount).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });
  });

  describe('edge cases', () => {
    it('handles events with same start and end', () => {
      const events = [
        { id: 'e1', start: 0n, end: 0n },
        { id: 'e2', start: 0n, end: 0n },
      ];
      const result = assignLanes(events);

      expect(result.layouts.get('e1')).toBe(0);
      expect(result.layouts.get('e2')).toBe(0); // Zero duration doesn't block
    });

    it('handles events starting exactly when previous ends', () => {
      const events = [
        { id: 'e1', start: 0n, end: 100n },
        { id: 'e2', start: 100n, end: 200n },
      ];
      const result = assignLanes(events);

      expect(result.layouts.get('e1')).toBe(0);
      expect(result.layouts.get('e2')).toBe(0); // Can reuse lane
      expect(result.laneCount).toBe(1);
    });

    it('handles negative timestamps', () => {
      const events = [
        { id: 'e1', start: -200n, end: -100n },
        { id: 'e2', start: -150n, end: -50n },
        { id: 'e3', start: -100n, end: 0n },
      ];
      const result = assignLanes(events);

      expect(result.layouts.get('e1')).toBe(0);
      expect(result.layouts.get('e2')).toBe(1);
      expect(result.layouts.get('e3')).toBe(0); // Reuses lane 0
      expect(result.laneCount).toBe(2);
    });
  });
});
