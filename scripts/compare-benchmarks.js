#!/usr/bin/env node
/**
 * Performance regression comparison tool (nayra-r1i.3)
 *
 * Compares benchmark results against a stored baseline.
 * Exits with code 1 if any metric degrades more than the threshold (default 10%).
 *
 * CLI usage:
 *   node scripts/compare-benchmarks.js \
 *     --baseline .performance-baseline.json \
 *     --current  test-results/performance-2026-02-23T17-03-38.json
 *
 *   # Write markdown report to a file:
 *   node scripts/compare-benchmarks.js ... > report.md
 */

import { readFileSync } from 'fs';

// ---------------------------------------------------------------------------
// Public API (also used by regression.test.js)
// ---------------------------------------------------------------------------

/**
 * Convert a raw benchmark-results file (produced by results-writer.js) into
 * the flat map format used by compareBenchmarks().
 *
 * @param {{ results: Array<{suite,name,p50,mean}> }} raw
 * @returns {{ benchmarks: Record<string, {p50: number, mean: number}> }}
 */
export function normalizeResults(raw) {
  const benchmarks = {};
  for (const entry of raw.results ?? []) {
    const key = `${entry.suite}/${entry.name}`;
    benchmarks[key] = { p50: entry.p50, mean: entry.mean };
  }
  return { benchmarks };
}

/**
 * Compare current benchmark results against a baseline.
 *
 * @param {{ benchmarks: Record<string, {p50: number}> }} baseline
 * @param {{ benchmarks: Record<string, {p50: number}> }} current
 * @param {number} [threshold=0.10]  Fractional degradation threshold (0.10 = 10%)
 * @returns {Array<{key, status, change, baseline, current}>}
 *   status: 'ok' | 'improvement' | 'regression' | 'missing'
 */
export function compareBenchmarks(baseline, current, threshold = 0.10) {
  const comparisons = [];

  for (const [key, baseStats] of Object.entries(baseline.benchmarks ?? {})) {
    const curStats = current.benchmarks?.[key];

    if (!curStats) {
      comparisons.push({ key, status: 'missing', change: null, baseline: baseStats.p50, current: null });
      continue;
    }

    const change = (curStats.p50 - baseStats.p50) / baseStats.p50;
    let status;
    if (change > threshold) {
      status = 'regression';
    } else if (change < -threshold) {
      status = 'improvement';
    } else {
      status = 'ok';
    }

    comparisons.push({ key, status, change, baseline: baseStats.p50, current: curStats.p50 });
  }

  return comparisons;
}

/**
 * Returns true if any comparison entry is a regression.
 * @param {ReturnType<typeof compareBenchmarks>} comparisons
 */
export function hasRegression(comparisons) {
  return comparisons.some((c) => c.status === 'regression');
}

/**
 * Format comparison results as a Markdown table.
 * @param {ReturnType<typeof compareBenchmarks>} comparisons
 * @returns {string}
 */
export function formatMarkdownReport(comparisons) {
  const rows = comparisons.map((c) => {
    if (c.status === 'missing') {
      return `| \`${c.key}\` | ${c.baseline.toFixed(3)}ms | — | ⚠️ missing |`;
    }
    const pct  = (c.change * 100).toFixed(1);
    const sign = c.change > 0 ? '+' : '';
    const icon = c.status === 'regression'
      ? '🔴'
      : c.status === 'improvement'
        ? '🟢'
        : '✅';
    return `| \`${c.key}\` | ${c.baseline.toFixed(3)}ms | ${c.current.toFixed(3)}ms | ${icon} ${sign}${pct}% |`;
  });

  return [
    '| Benchmark | Baseline p50 | Current p50 | Change |',
    '|-----------|-------------|-------------|--------|',
    ...rows,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--baseline') args.baseline = argv[++i];
    if (argv[i] === '--current')  args.current  = argv[++i];
    if (argv[i] === '--threshold') args.threshold = parseFloat(argv[++i]);
  }
  return args;
}

// Only run CLI logic when executed directly (not imported by tests)
if (process.argv[1] && process.argv[1].endsWith('compare-benchmarks.js')) {
  const args    = parseArgs(process.argv.slice(2));
  const threshold = args.threshold ?? 0.10;

  if (!args.baseline || !args.current) {
    console.error('Usage: compare-benchmarks.js --baseline <file> --current <file> [--threshold 0.10]');
    process.exit(2);
  }

  const baselineRaw = JSON.parse(readFileSync(args.baseline, 'utf8'));
  const currentRaw  = JSON.parse(readFileSync(args.current,  'utf8'));

  // Support both baseline format (already normalised) and raw results format
  const baselineNorm = baselineRaw.benchmarks ? baselineRaw : normalizeResults(baselineRaw);
  const currentNorm  = currentRaw.benchmarks  ? currentRaw  : normalizeResults(currentRaw);

  const comparisons = compareBenchmarks(baselineNorm, currentNorm, threshold);
  const report      = formatMarkdownReport(comparisons);

  const regressions = comparisons.filter((c) => c.status === 'regression');
  const improvements = comparisons.filter((c) => c.status === 'improvement');

  console.log(report);
  console.log('');
  console.log(`Benchmarks: ${comparisons.length} total, ${regressions.length} regressions, ${improvements.length} improvements`);

  if (hasRegression(comparisons)) {
    console.error('\n❌ Performance regression detected (>10% degradation in p50)');
    process.exit(1);
  }

  console.log('\n✅ No performance regressions detected');
}
