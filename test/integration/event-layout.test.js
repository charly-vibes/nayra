import { describe, it, expect, beforeEach } from 'vitest';
import { assignLanes } from '../../src/layout/greedy-interval-coloring.js';
import { SpatialHash } from '../../src/layout/spatial-hash.js';
import { getLaneY, getLaneBounds, DEFAULT_CONFIG } from '../../src/layout/lane-positioning.js';
import { detectLabelCollisions } from '../../src/layout/label-collision.js';
import { clusterEvents } from '../../src/layout/event-clustering.js';
import { RationalScale } from '../../src/core/scale.js';
import { projectToScreen, YEAR } from '../../src/core/time.js';

describe('Event Layout Integration', () => {
  describe('End-to-end layout pipeline', () => {
    it('should complete full layout pipeline for complex event set', () => {
      // Step 1: Create complex event dataset
      const events = [
        // Overlapping cluster 1
        { id: 'e1', label: 'Event 1', start: 0n, end: 100n, priority: 2 },
        { id: 'e2', label: 'Event 2', start: 50n, end: 150n, priority: 1 },
        { id: 'e3', label: 'Event 3', start: 75n, end: 125n, priority: 3 },

        // Non-overlapping event
        { id: 'e4', label: 'Event 4', start: 200n, end: 300n, priority: 2 },

        // Overlapping cluster 2
        { id: 'e5', label: 'Event 5', start: 350n, end: 450n, priority: 1 },
        { id: 'e6', label: 'Event 6', start: 400n, end: 500n, priority: 2 },

        // Point event
        { id: 'e7', label: 'Event 7', start: 550n, priority: 2 },
      ];

      // Step 2: Assign lanes
      const laneResult = assignLanes(events);

      expect(laneResult.layouts.size).toBe(7);
      expect(laneResult.laneCount).toBeGreaterThan(0);

      // Step 3: Calculate screen positions
      const viewportStart = 0n;
      const scale = RationalScale.fromSecondsPerPixel(1);
      const axisY = 300;

      const positionedEvents = events.map(event => {
        const lane = laneResult.layouts.get(event.id);
        const screenX = projectToScreen(event.start, viewportStart, scale);
        const screenWidth = event.end !== undefined
          ? projectToScreen(event.end, viewportStart, scale) - screenX
          : 8; // Point event width

        const laneY = getLaneY(lane, axisY);

        return {
          ...event,
          lane,
          bounds: {
            x: screenX,
            y: laneY,
            width: screenWidth,
            height: DEFAULT_CONFIG.laneHeight,
          },
        };
      });

      // Step 4: Build spatial hash
      const spatialHash = new SpatialHash(50);
      for (const event of positionedEvents) {
        spatialHash.insert(
          event,
          event.bounds.x,
          event.bounds.y,
          event.bounds.width,
          event.bounds.height
        );
      }

      // Step 5: Test hit detection
      const hit = spatialHash.queryFirst(75, axisY - 12);
      expect(hit).toBeDefined();
      expect(hit.id).toMatch(/e[1-3]/); // Should be one of the overlapping events

      // Step 6: Detect label collisions
      const mockCtx = {
        measureText: (text) => ({ width: text.length * 7 }),
      };
      const visibleLabels = detectLabelCollisions(positionedEvents, mockCtx, 1);

      expect(visibleLabels.size).toBeGreaterThan(0);
      expect(visibleLabels.size).toBeLessThanOrEqual(7);

      console.log(`Layout pipeline: ${events.length} events, ${laneResult.laneCount} lanes, ${visibleLabels.size} visible labels`);
    });

    it('should integrate lane positioning with spatial hash queries', () => {
      const events = [];
      const axisY = 400;

      // Create events in multiple lanes
      for (let lane = 0; lane < 5; lane++) {
        for (let i = 0; i < 3; i++) {
          const eventId = `lane${lane}_event${i}`;
          events.push({
            id: eventId,
            start: BigInt(i * 200),
            end: BigInt(i * 200 + 150),
          });
        }
      }

      // Assign lanes
      const laneResult = assignLanes(events);
      const viewportStart = 0n;
      const scale = RationalScale.fromSecondsPerPixel(1);

      // Position events
      const positionedEvents = events.map(event => {
        const lane = laneResult.layouts.get(event.id);
        const screenX = projectToScreen(event.start, viewportStart, scale);
        const screenWidth = projectToScreen(event.end, viewportStart, scale) - screenX;
        const laneY = getLaneY(lane, axisY);

        return {
          ...event,
          lane,
          x: screenX,
          y: laneY,
          width: screenWidth,
          height: DEFAULT_CONFIG.laneHeight,
        };
      });

      // Build spatial hash
      const hash = new SpatialHash();
      for (const event of positionedEvents) {
        hash.insert(event, event.x, event.y, event.width, event.height);
      }

      // Test queries at different positions
      for (const event of positionedEvents) {
        const midX = event.x + event.width / 2;
        const midY = event.y + event.height / 2;

        const hits = hash.query(midX, midY);
        expect(hits.length).toBeGreaterThan(0);
        expect(hits.some(h => h.id === event.id)).toBe(true);
      }
    });

    it('should handle viewport changes and relayout', () => {
      const events = [
        { id: 'e1', start: -1000n, end: -500n },
        { id: 'e2', start: -750n, end: -250n },
        { id: 'e3', start: 0n, end: 500n },
        { id: 'e4', start: 250n, end: 750n },
        { id: 'e5', start: 1000n, end: 1500n },
      ];

      // Initial layout
      const result1 = assignLanes(events);
      expect(result1.layouts.size).toBe(5);

      // Filter to visible events in viewport
      const viewport1Start = -1000n;
      const viewport1End = 500n;
      const visibleEvents1 = events.filter(
        e => !(e.end < viewport1Start || e.start > viewport1End)
      );

      // Layout visible events
      const result2 = assignLanes(visibleEvents1);
      expect(result2.layouts.size).toBe(4); // e1, e2, e3, e4

      // Pan to different viewport
      const viewport2Start = 0n;
      const viewport2End = 1500n;
      const visibleEvents2 = events.filter(
        e => !(e.end < viewport2Start || e.start > viewport2End)
      );

      // Layout new visible events
      const result3 = assignLanes(visibleEvents2);
      expect(result3.layouts.size).toBe(3); // e3, e4, e5
    });
  });

  describe('Clustering integration', () => {
    it('should cluster events at macro zoom and expand at micro zoom', () => {
      const events = [];
      for (let i = 0; i < 100; i++) {
        events.push({
          id: `e${i}`,
          start: BigInt(i * 10),
          end: BigInt(i * 10 + 5),
        });
      }

      // Macro zoom - events should cluster
      const macroScale = RationalScale.fromSecondsPerPixel(100);
      const macroClusters = clusterEvents(events, 0n, macroScale);

      expect(macroClusters.length).toBeLessThan(events.length);
      const clusterCount = macroClusters.filter(c => c.type === 'cluster').length;
      expect(clusterCount).toBeGreaterThan(0);

      // Micro zoom - events should be separate
      const microScale = RationalScale.fromSecondsPerPixel(0.1);
      const microClusters = clusterEvents(events, 0n, microScale);

      const individualCount = microClusters.filter(c => c.type === 'event').length;
      expect(individualCount).toBeGreaterThan(clusterCount);
    });

    it('should handle cluster expansion with spatial hash', () => {
      const events = [];
      for (let i = 0; i < 50; i++) {
        events.push({
          id: `e${i}`,
          label: `Event ${i}`,
          start: BigInt(i * 5),
          end: BigInt(i * 5 + 3),
        });
      }

      // Cluster at macro zoom
      const scale = RationalScale.fromSecondsPerPixel(10);
      const clusters = clusterEvents(events, 0n, scale);

      // Build spatial hash for clusters
      const hash = new SpatialHash();
      for (const cluster of clusters) {
        if (cluster.type === 'cluster') {
          // Add cluster marker to spatial hash
          hash.insert(
            cluster,
            cluster.centerX - 10,
            200 - 10,
            20,
            20
          );
        }
      }

      // Verify we can hit-test cluster markers
      for (const cluster of clusters) {
        if (cluster.type === 'cluster') {
          const hits = hash.query(cluster.centerX, 200);
          expect(hits.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Label collision with lane positioning', () => {
    it('should only show non-overlapping labels across lanes', () => {
      const events = [
        // Lane 0
        { id: 'e1', label: 'Very Long Label A', start: 0n, end: 100n },
        { id: 'e3', label: 'Short C', start: 300n, end: 400n },

        // Lane 1 (overlaps e1)
        { id: 'e2', label: 'Very Long Label B', start: 50n, end: 150n },
        { id: 'e4', label: 'Short D', start: 350n, end: 450n },
      ];

      // Assign lanes
      const laneResult = assignLanes(events);
      const viewportStart = 0n;
      const scale = RationalScale.fromSecondsPerPixel(1);
      const axisY = 300;

      // Position events
      const positionedEvents = events.map(event => {
        const lane = laneResult.layouts.get(event.id);
        const screenX = projectToScreen(event.start, viewportStart, scale);
        const screenWidth = projectToScreen(event.end, viewportStart, scale) - screenX;
        const laneY = getLaneY(lane, axisY);

        return {
          ...event,
          lane,
          bounds: {
            x: screenX,
            y: laneY,
            width: screenWidth,
            height: DEFAULT_CONFIG.laneHeight,
          },
        };
      });

      // Detect label collisions
      const mockCtx = {
        measureText: (text) => ({ width: text.length * 7 }),
      };
      const visibleLabels = detectLabelCollisions(positionedEvents, mockCtx, 1);

      // Verify labels don't overlap
      const visibleEvents = positionedEvents.filter(e => visibleLabels.has(e.id));
      for (let i = 0; i < visibleEvents.length; i++) {
        for (let j = i + 1; j < visibleEvents.length; j++) {
          const e1 = visibleEvents[i];
          const e2 = visibleEvents[j];

          // Calculate label bounds
          const label1Width = e1.label.length * 7 + 8;
          const label2Width = e2.label.length * 7 + 8;

          const label1 = {
            x: e1.bounds.x,
            y: e1.bounds.y,
            width: Math.min(label1Width, e1.bounds.width),
            height: 14,
          };

          const label2 = {
            x: e2.bounds.x,
            y: e2.bounds.y,
            width: Math.min(label2Width, e2.bounds.width),
            height: 14,
          };

          // Labels should not overlap
          const overlaps = !(
            label1.x + label1.width <= label2.x ||
            label2.x + label2.width <= label1.x ||
            label1.y + label1.height <= label2.y ||
            label2.y + label2.height <= label1.y
          );

          expect(overlaps).toBe(false);
        }
      }
    });
  });

  describe('Performance integration', () => {
    it('should complete full layout pipeline for 1000 events quickly', () => {
      // Generate 1000 events
      const events = [];
      for (let i = 0; i < 1000; i++) {
        const start = BigInt(Math.floor(Math.random() * 100000));
        const end = start + BigInt(Math.floor(Math.random() * 1000) + 100);
        events.push({
          id: `e${i}`,
          label: `Event ${i}`,
          start,
          end,
          priority: Math.floor(Math.random() * 3),
        });
      }

      const startTime = performance.now();

      // Step 1: Assign lanes
      const laneResult = assignLanes(events);

      // Step 2: Position events
      const viewportStart = 0n;
      const scale = RationalScale.fromSecondsPerPixel(100);
      const axisY = 400;

      const positionedEvents = events.map(event => {
        const lane = laneResult.layouts.get(event.id);
        const screenX = projectToScreen(event.start, viewportStart, scale);
        const screenWidth = projectToScreen(event.end, viewportStart, scale) - screenX;
        const laneY = getLaneY(lane, axisY);

        return {
          ...event,
          lane,
          bounds: {
            x: screenX,
            y: laneY,
            width: screenWidth,
            height: DEFAULT_CONFIG.laneHeight,
          },
        };
      });

      // Step 3: Build spatial hash
      const hash = new SpatialHash();
      const rebuildResult = hash.rebuild(
        positionedEvents,
        e => ({ x: e.bounds.x, y: e.bounds.y, width: e.bounds.width, height: e.bounds.height })
      );

      // Step 4: Detect label collisions
      const mockCtx = {
        measureText: (text) => ({ width: text.length * 7 }),
      };
      const visibleLabels = detectLabelCollisions(positionedEvents, mockCtx, 100);

      const totalDuration = performance.now() - startTime;

      // Verify results
      expect(laneResult.layouts.size).toBe(1000);
      expect(positionedEvents.length).toBe(1000);
      expect(rebuildResult.eventCount).toBe(1000);

      // Total pipeline should complete quickly
      expect(totalDuration).toBeLessThan(50);

      console.log(`Full pipeline for 1000 events: ${totalDuration.toFixed(2)}ms (${rebuildResult.duration.toFixed(2)}ms for spatial hash)`);
    });

    it('should handle viewport pan without frame drops', () => {
      // Simulate panning by rebuilding spatial hash
      const events = [];
      for (let i = 0; i < 500; i++) {
        events.push({
          id: `e${i}`,
          start: BigInt(i * 100),
          end: BigInt(i * 100 + 50),
        });
      }

      const laneResult = assignLanes(events);
      const scale = RationalScale.fromSecondsPerPixel(10);
      const axisY = 400;

      // Simulate 10 viewport updates (panning)
      const updateTimes = [];
      for (let frame = 0; frame < 10; frame++) {
        const viewportStart = BigInt(frame * 1000);

        const frameStart = performance.now();

        const positionedEvents = events.map(event => {
          const lane = laneResult.layouts.get(event.id);
          const screenX = projectToScreen(event.start, viewportStart, scale);
          const screenWidth = projectToScreen(event.end, viewportStart, scale) - screenX;
          const laneY = getLaneY(lane, axisY);

          return {
            ...event,
            bounds: { x: screenX, y: laneY, width: screenWidth, height: 24 },
          };
        });

        const hash = new SpatialHash();
        hash.rebuild(positionedEvents, e => e.bounds);

        const frameDuration = performance.now() - frameStart;
        updateTimes.push(frameDuration);

        // Each update should complete within 16ms (60 FPS)
        expect(frameDuration).toBeLessThan(16);
      }

      const avgTime = updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length;
      console.log(`Average viewport update: ${avgTime.toFixed(2)}ms`);
    });
  });

  describe('Complex real-world scenarios', () => {
    it('should handle geological timeline with eras and periods', () => {
      const MILLION_YEARS = 31557600000000n;

      const events = [
        // Eras (very long events)
        { id: 'paleozoic', label: 'Paleozoic Era', start: -541n * MILLION_YEARS, end: -252n * MILLION_YEARS, priority: 3 },
        { id: 'mesozoic', label: 'Mesozoic Era', start: -252n * MILLION_YEARS, end: -66n * MILLION_YEARS, priority: 3 },
        { id: 'cenozoic', label: 'Cenozoic Era', start: -66n * MILLION_YEARS, end: 0n, priority: 3 },

        // Periods (nested within eras)
        { id: 'cambrian', label: 'Cambrian', start: -541n * MILLION_YEARS, end: -485n * MILLION_YEARS, priority: 2 },
        { id: 'ordovician', label: 'Ordovician', start: -485n * MILLION_YEARS, end: -444n * MILLION_YEARS, priority: 2 },
        { id: 'triassic', label: 'Triassic', start: -252n * MILLION_YEARS, end: -201n * MILLION_YEARS, priority: 2 },
        { id: 'jurassic', label: 'Jurassic', start: -201n * MILLION_YEARS, end: -145n * MILLION_YEARS, priority: 2 },
        { id: 'cretaceous', label: 'Cretaceous', start: -145n * MILLION_YEARS, end: -66n * MILLION_YEARS, priority: 2 },

        // Significant events (points in time)
        { id: 'cambrian_explosion', label: 'Cambrian Explosion', start: -530n * MILLION_YEARS, priority: 3 },
        { id: 'dinosaur_extinction', label: 'K-T Extinction', start: -66n * MILLION_YEARS, priority: 3 },
      ];

      // Assign lanes
      const result = assignLanes(events);

      // All events should be assigned
      expect(result.layouts.size).toBe(events.length);

      // Verify lanes are assigned
      const paleozoicLane = result.layouts.get('paleozoic');
      const mesozoicLane = result.layouts.get('mesozoic');
      const cenozoicLane = result.layouts.get('cenozoic');

      expect(paleozoicLane).toBeGreaterThanOrEqual(0);
      expect(mesozoicLane).toBeGreaterThanOrEqual(0);
      expect(cenozoicLane).toBeGreaterThanOrEqual(0);

      // Sequential non-overlapping eras should share the same lane
      expect(paleozoicLane).toBe(mesozoicLane);

      // Nested periods should be in different lanes from their parent eras
      const cambrianLane = result.layouts.get('cambrian');
      const triassicLane = result.layouts.get('triassic');
      expect(cambrianLane).not.toBe(paleozoicLane); // Period is nested in era
      expect(triassicLane).not.toBe(mesozoicLane); // Period is nested in era

      console.log(`Geological timeline: ${result.laneCount} lanes for ${events.length} events`);
    });

    it('should handle sparse ancient history with dense modern history', () => {
      const YEAR_SECONDS = 31557600n;
      const events = [];

      // Ancient history: sparse events (10 events over 10,000 years)
      for (let i = 0; i < 10; i++) {
        events.push({
          id: `ancient_${i}`,
          start: -10000n * YEAR_SECONDS + BigInt(i * 1000) * YEAR_SECONDS,
          end: -10000n * YEAR_SECONDS + BigInt(i * 1000 + 50) * YEAR_SECONDS,
        });
      }

      // Modern history: dense events (100 events over 100 years)
      for (let i = 0; i < 100; i++) {
        events.push({
          id: `modern_${i}`,
          start: -100n * YEAR_SECONDS + BigInt(i) * YEAR_SECONDS,
          end: -100n * YEAR_SECONDS + BigInt(i + 1) * YEAR_SECONDS,
        });
      }

      const result = assignLanes(events);

      expect(result.layouts.size).toBe(110);
      expect(result.laneCount).toBeGreaterThan(0);

      console.log(`Mixed timeline: ${result.laneCount} lanes for 110 events`);
    });
  });
});
