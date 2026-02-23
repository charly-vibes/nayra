/**
 * Performance regression detection tests (nayra-r1i.3)
 *
 * TDD: these tests verify the comparison logic BEFORE connecting it to CI.
 * They intentionally probe the boundaries of the 10% threshold.
 */

import { describe, it, expect } from 'vitest';
import {
  compareBenchmarks,
  hasRegression,
  formatMarkdownReport,
  normalizeResults,
} from '../../scripts/compare-benchmarks.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal baseline/current object with a single benchmark entry. */
function makeData(p50) {
  return { benchmarks: { 'suite/bench': { p50, mean: p50 } } };
}

// ---------------------------------------------------------------------------
// compareBenchmarks
// ---------------------------------------------------------------------------

describe('compareBenchmarks', () => {
  it('marks a benchmark as "ok" when within the threshold', () => {
    const baseline = makeData(100);
    const current  = makeData(108); // +8% — within default 10%
    const [result] = compareBenchmarks(baseline, current);
    expect(result.status).toBe('ok');
    expect(result.change).toBeCloseTo(0.08, 5);
  });

  it('detects a regression at exactly the threshold boundary', () => {
    // +10% is NOT a regression (change > threshold, not >=)
    const atBoundary = makeData(110); // +10%
    const [atResult] = compareBenchmarks(makeData(100), atBoundary);
    expect(atResult.status).toBe('ok');

    // +10.1% IS a regression
    const overBoundary = makeData(110.1); // +10.1%
    const [overResult] = compareBenchmarks(makeData(100), overBoundary);
    expect(overResult.status).toBe('regression');
  });

  it('detects a clear regression (>10% slower)', () => {
    const [result] = compareBenchmarks(makeData(100), makeData(115)); // +15%
    expect(result.status).toBe('regression');
    expect(result.change).toBeCloseTo(0.15, 5);
  });

  it('detects an improvement (>10% faster)', () => {
    const [result] = compareBenchmarks(makeData(100), makeData(80)); // −20%
    expect(result.status).toBe('improvement');
    expect(result.change).toBeCloseTo(-0.20, 5);
  });

  it('marks a minor speedup as "ok"', () => {
    const [result] = compareBenchmarks(makeData(100), makeData(95)); // −5%
    expect(result.status).toBe('ok');
  });

  it('flags a missing benchmark', () => {
    const baseline = makeData(100);
    const current  = { benchmarks: {} }; // benchmark absent from current run
    const [result] = compareBenchmarks(baseline, current);
    expect(result.status).toBe('missing');
    expect(result.change).toBeNull();
  });

  it('respects a custom threshold', () => {
    // With 20% threshold, +15% should be ok
    const [result] = compareBenchmarks(makeData(100), makeData(115), 0.20);
    expect(result.status).toBe('ok');
  });

  it('handles multiple benchmarks independently', () => {
    const baseline = {
      benchmarks: {
        'suite/fast': { p50: 10, mean: 10 },
        'suite/slow': { p50: 100, mean: 100 },
      },
    };
    const current = {
      benchmarks: {
        'suite/fast': { p50: 8, mean: 8 },   // -20% improvement
        'suite/slow': { p50: 120, mean: 120 }, // +20% regression
      },
    };
    const results = compareBenchmarks(baseline, current);
    expect(results).toHaveLength(2);
    expect(results.find((r) => r.key === 'suite/fast').status).toBe('improvement');
    expect(results.find((r) => r.key === 'suite/slow').status).toBe('regression');
  });

  it('stores baseline and current p50 values in the result', () => {
    const [result] = compareBenchmarks(makeData(50), makeData(55));
    expect(result.baseline).toBe(50);
    expect(result.current).toBe(55);
    expect(result.key).toBe('suite/bench');
  });
});

// ---------------------------------------------------------------------------
// hasRegression
// ---------------------------------------------------------------------------

describe('hasRegression', () => {
  it('returns false when all benchmarks are ok', () => {
    expect(hasRegression([{ status: 'ok' }, { status: 'improvement' }])).toBe(false);
  });

  it('returns true when any benchmark regressed', () => {
    expect(hasRegression([{ status: 'ok' }, { status: 'regression' }])).toBe(true);
  });

  it('returns false for an empty list', () => {
    expect(hasRegression([])).toBe(false);
  });

  it('returns false for missing benchmarks (not a regression)', () => {
    expect(hasRegression([{ status: 'missing' }])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// formatMarkdownReport
// ---------------------------------------------------------------------------

describe('formatMarkdownReport', () => {
  it('produces a markdown table with header', () => {
    const comparisons = compareBenchmarks(makeData(100), makeData(115));
    const report = formatMarkdownReport(comparisons);
    expect(report).toContain('| Benchmark |');
    expect(report).toContain('| Baseline p50 |');
    expect(report).toContain('|-----------|');
  });

  it('includes the benchmark key in backticks', () => {
    const report = formatMarkdownReport(compareBenchmarks(makeData(100), makeData(100)));
    expect(report).toContain('`suite/bench`');
  });

  it('shows red circle for regressions', () => {
    const report = formatMarkdownReport(compareBenchmarks(makeData(100), makeData(115)));
    expect(report).toContain('🔴');
  });

  it('shows green circle for improvements', () => {
    const report = formatMarkdownReport(compareBenchmarks(makeData(100), makeData(80)));
    expect(report).toContain('🟢');
  });

  it('shows checkmark for ok results', () => {
    const report = formatMarkdownReport(compareBenchmarks(makeData(100), makeData(105)));
    expect(report).toContain('✅');
  });

  it('shows warning for missing benchmarks', () => {
    const comparisons = compareBenchmarks(makeData(100), { benchmarks: {} });
    const report = formatMarkdownReport(comparisons);
    expect(report).toContain('⚠️');
    expect(report).toContain('missing');
  });

  it('formats change percentage with sign', () => {
    const report = formatMarkdownReport(compareBenchmarks(makeData(100), makeData(115)));
    expect(report).toContain('+15.0%');
  });

  it('formats negative change without extra sign', () => {
    const report = formatMarkdownReport(compareBenchmarks(makeData(100), makeData(80)));
    expect(report).toContain('-20.0%');
  });
});

// ---------------------------------------------------------------------------
// normalizeResults
// ---------------------------------------------------------------------------

describe('normalizeResults', () => {
  it('converts raw results array to benchmarks map', () => {
    const raw = {
      results: [
        { suite: 'initial-render', name: 'lane-1K', p50: 0.43, mean: 0.54 },
        { suite: 'pan', name: '60-frames-1K', p50: 13.8, mean: 14.3 },
      ],
    };
    const normalized = normalizeResults(raw);
    expect(normalized.benchmarks['initial-render/lane-1K'].p50).toBeCloseTo(0.43);
    expect(normalized.benchmarks['pan/60-frames-1K'].p50).toBeCloseTo(13.8);
  });

  it('handles empty results array', () => {
    const normalized = normalizeResults({ results: [] });
    expect(Object.keys(normalized.benchmarks)).toHaveLength(0);
  });

  it('handles missing results field', () => {
    const normalized = normalizeResults({});
    expect(Object.keys(normalized.benchmarks)).toHaveLength(0);
  });
});
