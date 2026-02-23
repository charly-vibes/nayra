/**
 * Automated performance benchmark suite (nayra-r1i.1)
 *
 * Covers the full rendering pipeline across 1K / 10K / 50K event datasets:
 *   - Initial render  : lane assignment + spatial hash build
 *   - Pan operations  : 60-frame viewport translation sequences
 *   - Zoom operations : scale transforms, LOD transitions, LOD filtering
 *   - Layout ops      : label collision detection, event clustering,
 *                       coordinate projection at scale
 *
 * Results are written to test-results/performance-{timestamp}.json.
 *
 * TDD note: thresholds below are intentionally conservative so they pass
 * immediately and serve as the baseline for regression detection in r1i.3.
 */

import { describe, it, expect, afterAll } from 'vitest';

// Source modules under test
import { assignLanes }            from '../../src/layout/greedy-interval-coloring.js';
import { SpatialHash }            from '../../src/layout/spatial-hash.js';
import { clusterEvents }          from '../../src/layout/event-clustering.js';
import { detectLabelCollisions }  from '../../src/layout/label-collision.js';
import { RationalScale }          from '../../src/core/scale.js';
import { projectToScreen, YEAR }  from '../../src/core/time.js';
import {
  determineLOD,
  filterEventsByLOD,
  LOD_MICRO,
  LOD_MESO,
  LOD_MACRO,
} from '../../src/rendering/lod.js';
import { getLaneY } from '../../src/layout/lane-positioning.js';

// Benchmark infrastructure
import { bench }          from './helpers/benchmark.js';
import { recordResult, writeResults } from './helpers/results-writer.js';
import { getDataset1K, getDataset10K, getDataset50K, DATASET_BASE_TIME } from './fixtures/generate.js';

// ---------------------------------------------------------------------------
// Shared viewport/scale constants
// ---------------------------------------------------------------------------

const CANVAS_WIDTH = 1920;
const AXIS_Y       = 200;

// Viewport covering the full 200-year dataset span
const VIEWPORT_START = DATASET_BASE_TIME; // 1900-01-01
const SECONDS_PER_PX = Number(200n * YEAR) / CANVAS_WIDTH; // ~3.29M s/px
const SCALE          = RationalScale.fromSecondsPerPixel(SECONDS_PER_PX);

// Pan step: 10 years per frame (a realistic drag gesture)
const PAN_STEP = 10n * YEAR;

// Mock canvas context – label collision only needs measureText
const MOCK_CTX = {
  measureText: (text) => ({ width: text.length * 6.5 }),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute pixel-space bounds for a single event given a viewport position.
 *
 * @param {object}  event
 * @param {BigInt}  viewportStart
 * @param {object}  scale
 * @param {Map}     layouts  - Map<eventId, laneNumber> from assignLanes()
 * @returns {{ x, y, width, height }}
 */
function getEventBounds(event, viewportStart, scale, layouts) {
  const x    = projectToScreen(event.start, viewportStart, scale);
  const lane = layouts.get(event.id) ?? 0;
  const y    = getLaneY(lane, AXIS_Y);
  const endX = event.end !== undefined
    ? projectToScreen(event.end, viewportStart, scale)
    : x + 4;
  const width = Math.max(4, endX - x);
  return { x, y, width, height: 24 };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('Performance Benchmarks', () => {

  // =========================================================================
  // 1. Initial Render Pipeline
  //    Time from event data → layout assigned → spatial hash built
  // =========================================================================

  describe('Initial Render Pipeline', () => {
    const SIZES = [
      { label: '1K',  getData: getDataset1K,  layoutBudget: 15,   hashBudget: 10,   pipelineBudget: 25  },
      { label: '10K', getData: getDataset10K, layoutBudget: 150,  hashBudget: 40,   pipelineBudget: 200 },
      { label: '50K', getData: getDataset50K, layoutBudget: 800,  hashBudget: 150,  pipelineBudget: 950 },
    ];

    for (const { label, getData, layoutBudget, hashBudget, pipelineBudget } of SIZES) {
      const iters      = label === '1K' ? 50 : label === '10K' ? 20 : 8;
      const warmup     = label === '50K' ? 2 : 5;

      it(`lane assignment — ${label} events completes within ${layoutBudget}ms (mean)`, () => {
        const events = getData();

        const stats = bench(() => assignLanes(events), { warmup, iterations: iters });
        recordResult('initial-render', `lane-assignment-${label}`, stats);

        expect(stats.mean).toBeLessThan(layoutBudget);
        console.log(
          `assignLanes(${label}): mean=${stats.mean.toFixed(2)}ms ` +
          `p95=${stats.p95.toFixed(2)}ms cv=${stats.cv.toFixed(1)}%`,
        );
      });

      it(`spatial hash rebuild — ${label} events completes within ${hashBudget}ms (mean)`, () => {
        const events = getData();
        const { layouts } = assignLanes(events);
        const hash = new SpatialHash(50);

        const stats = bench(
          () => hash.rebuild(events, (e) => getEventBounds(e, VIEWPORT_START, SCALE, layouts)),
          { warmup, iterations: iters },
        );
        recordResult('initial-render', `spatial-hash-rebuild-${label}`, stats);

        expect(stats.mean).toBeLessThan(hashBudget);
        console.log(
          `SpatialHash.rebuild(${label}): mean=${stats.mean.toFixed(2)}ms ` +
          `p95=${stats.p95.toFixed(2)}ms`,
        );
      });

      it(`full pipeline — ${label} events completes within ${pipelineBudget}ms (mean)`, () => {
        const events = getData();
        const hash   = new SpatialHash(50);
        const iters2 = label === '1K' ? 30 : label === '10K' ? 10 : 5;

        const stats = bench(() => {
          const { layouts } = assignLanes(events);
          hash.rebuild(events, (e) => getEventBounds(e, VIEWPORT_START, SCALE, layouts));
        }, { warmup, iterations: iters2 });
        recordResult('initial-render', `full-pipeline-${label}`, stats);

        expect(stats.mean).toBeLessThan(pipelineBudget);
        console.log(
          `Full pipeline (${label}): mean=${stats.mean.toFixed(2)}ms ` +
          `p95=${stats.p95.toFixed(2)}ms`,
        );
      });
    }
  });

  // =========================================================================
  // 2. Pan Operations
  //    Simulates continuous panning: spatial hash rebuild each frame with a
  //    new viewport position.  Layout is stable during pan (re-used).
  // =========================================================================

  describe('Pan Operations', () => {
    const PAN_SIZES = [
      { label: '1K',  getData: getDataset1K,  frames: 60, budgetMs: 500,  runs: 8 },
      { label: '10K', getData: getDataset10K, frames: 30, budgetMs: 1500, runs: 5 },
      { label: '50K', getData: getDataset50K, frames: 10, budgetMs: 2000, runs: 3 },
    ];

    for (const { label, getData, frames, budgetMs, runs } of PAN_SIZES) {
      it(`${frames}-frame pan sequence — ${label} events within ${budgetMs}ms total`, () => {
        const events = getData();
        const { layouts } = assignLanes(events);
        const hash = new SpatialHash(50);

        const stats = bench(() => {
          let viewportStart = VIEWPORT_START;
          for (let f = 0; f < frames; f++) {
            viewportStart += PAN_STEP;
            hash.rebuild(events, (e) => getEventBounds(e, viewportStart, SCALE, layouts));
          }
        }, { warmup: 2, iterations: runs });

        const perFrame = stats.mean / frames;
        recordResult('pan', `${frames}-frames-${label}`, { ...stats, perFrame });

        expect(stats.mean).toBeLessThan(budgetMs);
        console.log(
          `Pan ${frames}f (${label}): ${stats.mean.toFixed(0)}ms total, ` +
          `${perFrame.toFixed(2)}ms/frame`,
        );
      });
    }
  });

  // =========================================================================
  // 3. Zoom Operations
  //    Scale transforms, LOD determination, and LOD-filtered layout.
  // =========================================================================

  describe('Zoom Operations', () => {

    it('scale.zoom — 1000 successive transforms within 5ms', () => {
      const stats = bench(() => {
        let s = SCALE;
        for (let i = 0; i < 1000; i++) s = s.zoom(1.15);
      }, { warmup: 10, iterations: 100 });

      const perCall = stats.mean / 1000;
      recordResult('zoom', 'scale-zoom-1000x', { ...stats, perCall });

      expect(stats.mean).toBeLessThan(5);
      console.log(
        `scale.zoom (1000×): mean=${stats.mean.toFixed(3)}ms, ` +
        `per-call=${perCall.toFixed(5)}ms`,
      );
    });

    it('determineLOD — 1000 calls including level transitions within 2ms', () => {
      const stats = bench(() => {
        let lod = LOD_MICRO;
        for (let i = 0; i < 1000; i++) {
          // Sweep through all zoom levels to exercise all branches
          const spp = (i % 500) * 2_000_000;
          lod = determineLOD(spp, lod);
        }
      }, { warmup: 10, iterations: 100 });

      const perCall = stats.mean / 1000;
      recordResult('zoom', 'determineLOD-1000x', { ...stats, perCall });

      expect(stats.mean).toBeLessThan(2);
      console.log(
        `determineLOD (1000×): mean=${stats.mean.toFixed(3)}ms, ` +
        `per-call=${perCall.toFixed(5)}ms`,
      );
    });

    const LOD_SIZES = [
      { label: '1K',  getData: getDataset1K,  budget: 3,   iters: 100 },
      { label: '10K', getData: getDataset10K, budget: 15,  iters: 40  },
      { label: '50K', getData: getDataset50K, budget: 60,  iters: 15  },
    ];

    for (const { label, getData, budget, iters } of LOD_SIZES) {
      it(`filterEventsByLOD (MESO) — ${label} events within ${budget}ms (mean)`, () => {
        const events = getData();

        const stats = bench(
          () => filterEventsByLOD(events, LOD_MESO),
          { warmup: 5, iterations: iters },
        );
        recordResult('zoom', `lod-filter-meso-${label}`, stats);

        expect(stats.mean).toBeLessThan(budget);
        console.log(`filterEventsByLOD(${label}): mean=${stats.mean.toFixed(3)}ms`);
      });
    }

    it('full zoom-out transition — 10K events (micro→macro pipeline) within 250ms', () => {
      const events = getDataset10K();

      const stats = bench(() => {
        const newScale = SCALE.zoom(0.0005);               // very zoomed out
        const spp      = newScale.getSecondsPerPixel();
        const lod      = determineLOD(spp, LOD_MICRO);
        const visible  = filterEventsByLOD(events, lod);
        assignLanes(visible);
      }, { warmup: 3, iterations: 12 });
      recordResult('zoom', 'full-zoom-out-transition-10K', stats);

      expect(stats.mean).toBeLessThan(250);
      console.log(
        `Zoom-out transition (10K→MACRO): mean=${stats.mean.toFixed(2)}ms ` +
        `p95=${stats.p95.toFixed(2)}ms`,
      );
    });
  });

  // =========================================================================
  // 4. Layout Operations
  //    Coordinate projection, label collision, event clustering.
  //    These are not covered by the existing layout/spatial-hash benchmarks.
  // =========================================================================

  describe('Layout Operations', () => {

    it('projectToScreen — 50K events within 30ms', () => {
      const events = getDataset50K();

      const stats = bench(
        () => { for (const e of events) projectToScreen(e.start, VIEWPORT_START, SCALE); },
        { warmup: 5, iterations: 20 },
      );
      recordResult('layout', 'project-to-screen-50K', stats);

      expect(stats.mean).toBeLessThan(30);
      console.log(`projectToScreen(50K): mean=${stats.mean.toFixed(2)}ms`);
    });

    it('label collision detection — 1K events within 20ms (mean)', () => {
      const events = getDataset1K();
      const { layouts } = assignLanes(events);

      const eventsWithBounds = events.map((e) => ({
        ...e,
        bounds: getEventBounds(e, VIEWPORT_START, SCALE, layouts),
      }));

      const spp   = SCALE.getSecondsPerPixel();
      const stats = bench(
        () => detectLabelCollisions(eventsWithBounds, MOCK_CTX, spp),
        { warmup: 5, iterations: 30 },
      );
      recordResult('layout', 'label-collision-1K', stats);

      expect(stats.mean).toBeLessThan(20);
      console.log(
        `detectLabelCollisions(1K): mean=${stats.mean.toFixed(2)}ms ` +
        `p95=${stats.p95.toFixed(2)}ms`,
      );
    });

    it('label collision detection — 10K events within 100ms (mean)', () => {
      const events = getDataset10K();
      const { layouts } = assignLanes(events);

      const eventsWithBounds = events.map((e) => ({
        ...e,
        bounds: getEventBounds(e, VIEWPORT_START, SCALE, layouts),
      }));

      const spp   = SCALE.getSecondsPerPixel();
      const stats = bench(
        () => detectLabelCollisions(eventsWithBounds, MOCK_CTX, spp),
        { warmup: 3, iterations: 15 },
      );
      recordResult('layout', 'label-collision-10K', stats);

      expect(stats.mean).toBeLessThan(100);
      console.log(
        `detectLabelCollisions(10K): mean=${stats.mean.toFixed(2)}ms ` +
        `p95=${stats.p95.toFixed(2)}ms`,
      );
    });

    it('event clustering (macro zoom) — 10K events within 50ms (mean)', () => {
      const events    = getDataset10K();
      const macroScale = SCALE.zoom(0.001); // very zoomed out → dense clusters

      const stats = bench(
        () => clusterEvents(events, VIEWPORT_START, macroScale),
        { warmup: 5, iterations: 20 },
      );
      recordResult('layout', 'event-clustering-macro-10K', stats);

      expect(stats.mean).toBeLessThan(50);
      console.log(
        `clusterEvents(10K, macro): mean=${stats.mean.toFixed(2)}ms ` +
        `p95=${stats.p95.toFixed(2)}ms`,
      );
    });

    it('event clustering (macro zoom) — 50K events within 200ms (mean)', () => {
      const events    = getDataset50K();
      const macroScale = SCALE.zoom(0.001);

      const stats = bench(
        () => clusterEvents(events, VIEWPORT_START, macroScale),
        { warmup: 3, iterations: 8 },
      );
      recordResult('layout', 'event-clustering-macro-50K', stats);

      expect(stats.mean).toBeLessThan(200);
      console.log(
        `clusterEvents(50K, macro): mean=${stats.mean.toFixed(2)}ms ` +
        `p95=${stats.p95.toFixed(2)}ms`,
      );
    });
  });

  // =========================================================================
  // Write baseline results after all suites complete
  // =========================================================================

  afterAll(() => {
    writeResults();
  });
});
