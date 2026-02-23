/**
 * Lightweight benchmark runner for performance tests.
 *
 * Runs a function with warmup to allow JIT optimisation, then times
 * `iterations` executions and returns summary statistics.
 */

/**
 * Benchmark a synchronous function.
 *
 * @param {Function} fn
 * @param {object}   [opts]
 * @param {number}   [opts.warmup=5]      - Warmup runs (not measured)
 * @param {number}   [opts.iterations=30] - Measured runs
 * @returns {{ mean, p50, p95, min, max, stddev, cv, iterations }}
 *   cv = coefficient of variation (stddev/mean × 100) in percent
 */
export function bench(fn, { warmup = 5, iterations = 30 } = {}) {
  for (let i = 0; i < warmup; i++) fn();

  const times = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    fn();
    times.push(performance.now() - t0);
  }

  times.sort((a, b) => a - b);

  const mean   = times.reduce((s, t) => s + t, 0) / times.length;
  const p50    = times[Math.floor(times.length * 0.50)];
  const p95    = times[Math.floor(times.length * 0.95)];
  const stddev = Math.sqrt(times.reduce((s, t) => s + (t - mean) ** 2, 0) / times.length);
  const cv     = mean > 0 ? (stddev / mean) * 100 : 0;

  return {
    mean,
    p50,
    p95,
    min: times[0],
    max: times[times.length - 1],
    stddev,
    cv,
    iterations,
  };
}
