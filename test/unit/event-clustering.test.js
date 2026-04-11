import { describe, expect, it } from 'vitest';
import { RationalScale } from '../../src/core/scale.js';
import { YEAR } from '../../src/core/time.js';
import { clusterEvents, getClusterExpansionFactor, isPointInCluster } from '../../src/layout/event-clustering.js';

describe('|unit| event-clustering', () => {
  describe('clusterEvents', () => {
    it('returns empty array for no events', () => {
      const events = [];
      const viewportStart = 0n;
      const scale = RationalScale.fromSecondsPerPixel(Number(YEAR));

      const clusters = clusterEvents(events, viewportStart, scale);

      expect(clusters).toEqual([]);
    });

    it('returns single event for one event', () => {
      const events = [{ id: 'e1', start: 0n, end: 100n }];
      const viewportStart = 0n;
      const scale = RationalScale.fromSecondsPerPixel(Number(YEAR));

      const clusters = clusterEvents(events, viewportStart, scale);

      expect(clusters).toHaveLength(1);
      expect(clusters[0].type).toBe('event');
      expect(clusters[0].event).toEqual(events[0]);
    });

    it('clusters nearby events within threshold', () => {
      const events = [
        { id: 'e1', start: 0n, end: 100n },
        { id: 'e2', start: 50n, end: 150n },
        { id: 'e3', start: 100n, end: 200n },
      ];
      const viewportStart = 0n;
      // Scale where events are close together
      const scale = RationalScale.fromSecondsPerPixel(10);

      const clusters = clusterEvents(events, viewportStart, scale);

      expect(clusters).toHaveLength(1);
      expect(clusters[0].type).toBe('cluster');
      expect(clusters[0].count).toBe(3);
      expect(clusters[0].events).toHaveLength(3);
    });

    it('does not cluster events beyond threshold', () => {
      const events = [
        { id: 'e1', start: 0n, end: 100n },
        { id: 'e2', start: BigInt(Number(YEAR) * 1000), end: BigInt(Number(YEAR) * 1000 + 100) },
      ];
      const viewportStart = 0n;
      const scale = RationalScale.fromSecondsPerPixel(Number(YEAR));

      const clusters = clusterEvents(events, viewportStart, scale);

      // Two separate single events (not clustered)
      expect(clusters).toHaveLength(2);
      expect(clusters[0].type).toBe('event');
      expect(clusters[1].type).toBe('event');
    });

    it('creates multiple clusters for separated groups', () => {
      const events = [
        { id: 'e1', start: 0n, end: 100n },
        { id: 'e2', start: 50n, end: 150n },
        { id: 'e3', start: BigInt(Number(YEAR) * 1000), end: BigInt(Number(YEAR) * 1000 + 100) },
        { id: 'e4', start: BigInt(Number(YEAR) * 1000 + 50), end: BigInt(Number(YEAR) * 1000 + 150) },
      ];
      const viewportStart = 0n;
      const scale = RationalScale.fromSecondsPerPixel(10);

      const clusters = clusterEvents(events, viewportStart, scale);

      // Two clusters, each with 2 events
      expect(clusters).toHaveLength(2);
      expect(clusters[0].type).toBe('cluster');
      expect(clusters[0].count).toBe(2);
      expect(clusters[1].type).toBe('cluster');
      expect(clusters[1].count).toBe(2);
    });

    it('calculates cluster bounds correctly', () => {
      const events = [
        { id: 'e1', start: 100n, end: 200n },
        { id: 'e2', start: 150n, end: 300n },
        { id: 'e3', start: 250n, end: 350n },
      ];
      const viewportStart = 0n;
      const scale = RationalScale.fromSecondsPerPixel(10);

      const clusters = clusterEvents(events, viewportStart, scale);

      expect(clusters).toHaveLength(1);
      expect(clusters[0].type).toBe('cluster');
      expect(clusters[0].minTime).toBe(100n);
      expect(clusters[0].maxTime).toBe(350n);
    });

    it('handles events without end times', () => {
      const events = [
        { id: 'e1', start: 0n },
        { id: 'e2', start: 50n },
      ];
      const viewportStart = 0n;
      const scale = RationalScale.fromSecondsPerPixel(10);

      const clusters = clusterEvents(events, viewportStart, scale);

      expect(clusters).toHaveLength(1);
      expect(clusters[0].type).toBe('cluster');
      expect(clusters[0].count).toBe(2);
    });

    it('sorts events by start time before clustering', () => {
      const events = [
        { id: 'e3', start: 200n, end: 300n },
        { id: 'e1', start: 0n, end: 100n },
        { id: 'e2', start: 50n, end: 150n },
      ];
      const viewportStart = 0n;
      const scale = RationalScale.fromSecondsPerPixel(10);

      const clusters = clusterEvents(events, viewportStart, scale);

      expect(clusters).toHaveLength(1);
      expect(clusters[0].type).toBe('cluster');
      // Events should be in chronological order
      expect(clusters[0].events[0].id).toBe('e1');
      expect(clusters[0].events[1].id).toBe('e2');
      expect(clusters[0].events[2].id).toBe('e3');
    });

    it('includes span events when their visible geometry intersects the cluster footprint', () => {
      const events = [
        { id: 'span', start: 0n, end: 200n },
        { id: 'point', start: 220n },
      ];

      const clusters = clusterEvents(events, 0n, RationalScale.fromSecondsPerPixel(10), 100);

      expect(clusters).toHaveLength(1);
      expect(clusters[0].type).toBe('cluster');
      expect(clusters[0].events.map((event) => event.id)).toEqual(['span', 'point']);
    });

    it('ignores events whose rendered geometry does not intersect the viewport', () => {
      const events = [
        { id: 'offscreen-left', start: -1000n, end: -900n },
        { id: 'visible-a', start: 0n, end: 100n },
        { id: 'visible-b', start: 120n, end: 180n },
      ];

      const clusters = clusterEvents(events, 0n, RationalScale.fromSecondsPerPixel(1), 300);

      expect(clusters).toHaveLength(1);
      expect(clusters[0].type).toBe('cluster');
      expect(clusters[0].events.map((event) => event.id)).toEqual(['visible-a', 'visible-b']);
    });

    it('exposes shared screen footprint and hit geometry for clusters', () => {
      const events = [
        { id: 'e1', start: 0n },
        { id: 'e2', start: 10n },
      ];

      const clusters = clusterEvents(events, 0n, RationalScale.fromSecondsPerPixel(1), 200);

      expect(clusters[0]).toMatchObject({
        type: 'cluster',
        screenFootprint: {
          minX: expect.any(Number),
          maxX: expect.any(Number),
          width: expect.any(Number),
        },
        hitGeometry: {
          centerX: expect.any(Number),
          radius: expect.any(Number),
        },
      });
      expect(clusters[0].screenFootprint.width).toBeGreaterThan(0);
    });
  });

  describe('getClusterExpansionFactor', () => {
    it('returns 0.0 at macro threshold', () => {
      const macroThreshold = 1000;
      const mesoThreshold = 500;
      const secondsPerPixel = 1000;

      const factor = getClusterExpansionFactor(secondsPerPixel, macroThreshold, mesoThreshold);

      expect(factor).toBe(0.0);
    });

    it('returns 1.0 at meso threshold', () => {
      const macroThreshold = 1000;
      const mesoThreshold = 500;
      const secondsPerPixel = 500;

      const factor = getClusterExpansionFactor(secondsPerPixel, macroThreshold, mesoThreshold);

      expect(factor).toBe(1.0);
    });

    it('returns 0.5 at midpoint', () => {
      const macroThreshold = 1000;
      const mesoThreshold = 500;
      const secondsPerPixel = 750; // Midpoint

      const factor = getClusterExpansionFactor(secondsPerPixel, macroThreshold, mesoThreshold);

      expect(factor).toBeCloseTo(0.5);
    });

    it('returns 0.0 for very zoomed out view', () => {
      const macroThreshold = 1000;
      const mesoThreshold = 500;
      const secondsPerPixel = 5000;

      const factor = getClusterExpansionFactor(secondsPerPixel, macroThreshold, mesoThreshold);

      expect(factor).toBe(0.0);
    });

    it('returns 1.0 for very zoomed in view', () => {
      const macroThreshold = 1000;
      const mesoThreshold = 500;
      const secondsPerPixel = 100;

      const factor = getClusterExpansionFactor(secondsPerPixel, macroThreshold, mesoThreshold);

      expect(factor).toBe(1.0);
    });
  });

  describe('isPointInCluster', () => {
    it('returns true for point inside cluster', () => {
      const cluster = {
        centerX: 100,
        centerTime: 1000n,
      };
      const x = 105;
      const y = 205;
      const markerY = 200;
      const markerRadius = 20;

      const result = isPointInCluster(x, y, cluster, markerY, markerRadius);

      expect(result).toBe(true);
    });

    it('returns false for point outside cluster', () => {
      const cluster = {
        centerX: 100,
        centerTime: 1000n,
      };
      const x = 150;
      const y = 200;
      const markerY = 200;
      const markerRadius = 20;

      const result = isPointInCluster(x, y, cluster, markerY, markerRadius);

      expect(result).toBe(false);
    });

    it('returns true for point on cluster edge', () => {
      const cluster = {
        centerX: 100,
        centerTime: 1000n,
      };
      const x = 120; // Exactly radius away
      const y = 200;
      const markerY = 200;
      const markerRadius = 20;

      const result = isPointInCluster(x, y, cluster, markerY, markerRadius);

      expect(result).toBe(true);
    });

    it('returns false for point just outside cluster edge', () => {
      const cluster = {
        centerX: 100,
        centerTime: 1000n,
      };
      const x = 121; // Just beyond radius
      const y = 200;
      const markerY = 200;
      const markerRadius = 20;

      const result = isPointInCluster(x, y, cluster, markerY, markerRadius);

      expect(result).toBe(false);
    });
  });
});
