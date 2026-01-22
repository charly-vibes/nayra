import { describe, it, expect } from 'vitest';
import { YEAR, MILLION_YEARS, BILLION_YEARS } from '../../src/core/time.js';

describe('TimeParser', () => {
  describe('parseTimeQuery', () => {
    it('parses 4-digit years as CE dates', async () => {
      const { parseTimeQuery } = await import('../../src/core/time-parser.js');

      const result = parseTimeQuery('2000');

      // Year 2000 centered on mid-year (~July)
      expect(result.success).toBe(true);
      expect(result.time).toBeGreaterThan(946000000n);
      expect(result.time).toBeLessThan(965000000n);
    });

    it('parses negative years as BCE', async () => {
      const { parseTimeQuery } = await import('../../src/core/time-parser.js');

      const result = parseTimeQuery('-500');

      expect(result.success).toBe(true);
      expect(result.time).toBeLessThan(0n);
    });

    it('parses "Ma" suffix as millions of years ago', async () => {
      const { parseTimeQuery } = await import('../../src/core/time-parser.js');

      const result = parseTimeQuery('100 Ma');

      expect(result.success).toBe(true);
      // 100 million years ago should be negative and around -100 * MILLION_YEARS
      expect(result.time).toBeLessThan(0n);
      const expectedApprox = -100n * MILLION_YEARS;
      const diff = result.time - expectedApprox;
      expect(diff > -MILLION_YEARS && diff < MILLION_YEARS).toBe(true);
    });

    it('parses "Ga" suffix as billions of years ago', async () => {
      const { parseTimeQuery } = await import('../../src/core/time-parser.js');

      const result = parseTimeQuery('4.5 Ga');

      expect(result.success).toBe(true);
      // 4.5 billion years ago
      const expected = -4n * BILLION_YEARS - BILLION_YEARS / 2n;
      const diff = result.time - expected;
      expect(diff > -BILLION_YEARS / 10n && diff < BILLION_YEARS / 10n).toBe(true);
    });

    it('parses "Big Bang" as named event', async () => {
      const { parseTimeQuery } = await import('../../src/core/time-parser.js');

      const result = parseTimeQuery('Big Bang');

      expect(result.success).toBe(true);
      // Big Bang ~13.8 billion years ago
      const expected = -13800000000n * YEAR;
      const diff = result.time - expected;
      expect(diff > -BILLION_YEARS && diff < BILLION_YEARS).toBe(true);
    });

    it('parses "Earth formation" as named event', async () => {
      const { parseTimeQuery } = await import('../../src/core/time-parser.js');

      const result = parseTimeQuery('Earth formation');

      expect(result.success).toBe(true);
      // Earth formation ~4.5 billion years ago
      expect(result.time).toBeLessThan(-4n * BILLION_YEARS);
    });

    it('parses "now" or "today" as current time', async () => {
      const { parseTimeQuery } = await import('../../src/core/time-parser.js');

      const before = BigInt(Math.floor(Date.now() / 1000));
      const result = parseTimeQuery('now');
      const after = BigInt(Math.floor(Date.now() / 1000));

      expect(result.success).toBe(true);
      expect(result.time).toBeGreaterThanOrEqual(before);
      expect(result.time).toBeLessThanOrEqual(after + 1n);
    });

    it('returns error for unparseable input', async () => {
      const { parseTimeQuery } = await import('../../src/core/time-parser.js');

      const result = parseTimeQuery('not a date');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('is case insensitive for named events', async () => {
      const { parseTimeQuery } = await import('../../src/core/time-parser.js');

      const result1 = parseTimeQuery('big bang');
      const result2 = parseTimeQuery('BIG BANG');

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.time).toBe(result2.time);
    });

    it('handles whitespace in input', async () => {
      const { parseTimeQuery } = await import('../../src/core/time-parser.js');

      const result = parseTimeQuery('  100 Ma  ');

      expect(result.success).toBe(true);
    });
  });

  describe('span precision', () => {
    it('returns 1 year span for year-only queries', async () => {
      const { parseTimeQuery } = await import('../../src/core/time-parser.js');

      const result = parseTimeQuery('2000');

      expect(result.success).toBe(true);
      expect(result.span).toBe(YEAR);
    });

    it('returns ~30 day span for month queries (YYYY-MM)', async () => {
      const { parseTimeQuery } = await import('../../src/core/time-parser.js');

      const result = parseTimeQuery('2024-06');

      expect(result.success).toBe(true);
      expect(result.span).toBe(30n * 86400n);
    });

    it('returns ~30 day span for month queries (Mon YYYY)', async () => {
      const { parseTimeQuery } = await import('../../src/core/time-parser.js');

      const result = parseTimeQuery('Jan 2024');

      expect(result.success).toBe(true);
      expect(result.span).toBe(30n * 86400n);
    });

    it('returns 1 day span for full date queries (YYYY-MM-DD)', async () => {
      const { parseTimeQuery } = await import('../../src/core/time-parser.js');

      const result = parseTimeQuery('2024-06-15');

      expect(result.success).toBe(true);
      expect(result.span).toBe(86400n);
    });

    it('returns 1 Ma span for Ma queries', async () => {
      const { parseTimeQuery } = await import('../../src/core/time-parser.js');

      const result = parseTimeQuery('100 Ma');

      expect(result.success).toBe(true);
      expect(result.span).toBe(MILLION_YEARS);
    });

    it('returns 1 Ga span for Ga queries', async () => {
      const { parseTimeQuery } = await import('../../src/core/time-parser.js');

      const result = parseTimeQuery('4.5 Ga');

      expect(result.success).toBe(true);
      expect(result.span).toBe(BILLION_YEARS);
    });

    it('returns appropriate span for named events', async () => {
      const { parseTimeQuery } = await import('../../src/core/time-parser.js');

      const result = parseTimeQuery('Big Bang');

      expect(result.success).toBe(true);
      expect(result.span).toBe(BILLION_YEARS);
    });
  });
});
