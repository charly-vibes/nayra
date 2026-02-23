/**
 * Accumulates benchmark results and writes them to
 * test-results/performance-{timestamp}.json after the suite completes.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const RESULTS_DIR = join(process.cwd(), 'test-results');

const _results = [];

/**
 * Record a single benchmark result entry.
 *
 * @param {string} suite  - Suite name  (e.g. 'initial-render')
 * @param {string} name   - Benchmark name (e.g. 'lane-assignment-10K')
 * @param {object} stats  - Stats object from bench()
 */
export function recordResult(suite, name, stats) {
  _results.push({ suite, name, ...stats });
}

/**
 * Write all recorded results to disk.
 * Call this from afterAll() in the benchmark test.
 */
export function writeResults() {
  const ts   = new Date().toISOString().replace(/:/g, '-').replace(/\.\d+Z$/, '');
  const file = join(RESULTS_DIR, `performance-${ts}.json`);

  try {
    mkdirSync(RESULTS_DIR, { recursive: true });
    writeFileSync(
      file,
      JSON.stringify({ timestamp: new Date().toISOString(), results: _results }, null, 2),
    );
    console.log(`\nPerformance results written to: test-results/performance-${ts}.json`);
  } catch (err) {
    console.warn(`Could not write performance results: ${err.message}`);
  }
}
