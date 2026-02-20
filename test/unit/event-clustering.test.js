import { describe, it, expect } from 'vitest';
import { clusterEvents, getClusterExpansionFactor, isPointInCluster } from '../../src/layout/event-clustering.js';
import { RationalScale } from '../../src/core/scale.js';
import { YEAR } from '../../src/core/time.js';

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
      const events = [
        { id: 'e1', start: 0n, end: 100n },
      ];
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
