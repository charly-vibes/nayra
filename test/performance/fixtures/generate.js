/**
 * Deterministic event dataset generators for performance benchmarks.
 *
 * Uses a seeded LCG so every run produces identical datasets — essential
 * for comparing benchmark results across commits.
 */

const BASE_TIME = -2208988800n; // 1900-01-01 00:00:00 UTC (seconds)
const RANGE     = 6311520000n;  // 200 years in seconds

const CATEGORIES = ['science', 'politics', 'culture', 'technology', 'nature'];

function makePrng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/**
 * Generate a deterministic array of timeline events.
 *
 * @param {number} count   - Number of events to generate
 * @param {number} [seed]  - PRNG seed (default 42)
 * @returns {Array}
 */
export function generateEvents(count, seed = 42) {
  const rand = makePrng(seed);
  const events = [];

  for (let i = 0; i < count; i++) {
    const startOffset = BigInt(Math.floor(rand() * Number(RANGE)));
    const start = BASE_TIME + startOffset;

    const hasDuration = rand() > 0.4;
    const end = hasDuration
      ? start + BigInt(Math.floor(rand() * 315_576_000) + 86_400) // 1 day – 10 years
      : undefined;

    const category = CATEGORIES[Math.floor(rand() * CATEGORIES.length)];
    const priority  = Math.floor(rand() * 3); // 0 | 1 | 2

    events.push({
      id: `evt-${i}`,
      start,
      end,
      label: `Event ${i}`,
      category,
      priority,
    });
  }

  return events;
}

// Module-level caches: datasets are generated once and reused across tests.
let _1k, _10k, _50k;

export function getDataset1K()  { return _1k  ?? (_1k  = generateEvents(1_000)); }
export function getDataset10K() { return _10k ?? (_10k = generateEvents(10_000)); }
export function getDataset50K() { return _50k ?? (_50k = generateEvents(50_000)); }

/** Time constants re-exported for benchmark convenience */
export const DATASET_BASE_TIME = BASE_TIME;
export const DATASET_RANGE     = RANGE;
