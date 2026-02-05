import { describe, it, expect } from 'vitest';
import { formatTimeRange } from '../../../src/ui/format.js';
import { YEAR, MILLION_YEARS, BILLION_YEARS } from '../../../src/core/time.js';
import { parseTimeQuery } from '../../../src/core/time-parser.js';

function parseTime(query) {
  const result = parseTimeQuery(query);
  if (!result.success) throw new Error(`Failed to parse: ${query}`);
  return result.time;
}

describe('formatTimeRange', () => {
  describe('Deep time (Ga)', () => {
    it('formats 4.5 billion years ago', () => {
      const event = { start: parseTime('4.5 Ga') };
      expect(formatTimeRange(event)).toBe('4.5 Ga');
    });

    it('formats 13.8 billion years ago', () => {
      const event = { start: parseTime('13.8 Ga') };
      expect(formatTimeRange(event)).toBe('13.8 Ga');
    });

    it('formats 1 billion years ago', () => {
      const event = { start: parseTime('1 Ga') };
      expect(formatTimeRange(event)).toBe('1.0 Ga');
    });
  });

  describe('Deep time (Ma)', () => {
    it('formats 65 million years ago', () => {
      const event = { start: parseTime('65 Ma') };
      expect(formatTimeRange(event)).toBe('65 Ma');
    });

    it('formats 500 million years ago', () => {
      const event = { start: parseTime('500 Ma') };
      expect(formatTimeRange(event)).toBe('500 Ma');
    });

    it('formats 1 million years ago', () => {
      const event = { start: parseTime('1 Ma') };
      expect(formatTimeRange(event)).toBe('1 Ma');
    });
  });

  describe('Historical years', () => {
    it('formats 2024 CE', () => {
      const event = { start: parseTime('2024') };
      expect(formatTimeRange(event)).toBe('2024');
    });

    it('formats 500 BCE', () => {
      const event = { start: parseTime('500 BCE') };
      expect(formatTimeRange(event)).toBe('500 BCE');
    });

    it('formats 44 BCE', () => {
      const event = { start: parseTime('44 BCE') };
      expect(formatTimeRange(event)).toBe('44 BCE');
    });

    it('formats 1066 CE', () => {
      const event = { start: parseTime('1066') };
      expect(formatTimeRange(event)).toBe('1066');
    });
  });

  describe('Time ranges with start/end', () => {
    it('formats a range in the same year', () => {
      const event = { start: parseTime('2024-01-01'), end: parseTime('2024-12-31') };
      expect(formatTimeRange(event)).toBe('2024');
    });

    it('formats a range across years', () => {
      const event = { start: parseTime('1914'), end: parseTime('1918') };
      expect(formatTimeRange(event)).toBe('1914 – 1918');
    });

    it('formats a range in deep time (Ma)', () => {
      const event = { start: parseTime('500 Ma'), end: parseTime('400 Ma') };
      expect(formatTimeRange(event)).toBe('500 – 400 Ma');
    });

    it('formats a range in deep time (Ga)', () => {
      const event = { start: parseTime('4 Ga'), end: parseTime('3 Ga') };
      expect(formatTimeRange(event)).toBe('4.0 – 3.0 Ga');
    });
  });

  describe('Precision hints', () => {
    it('adds circa for approximate precision', () => {
      const event = { start: parseTime('44 BCE'), precision: 'decade' };
      expect(formatTimeRange(event)).toBe('c. 44 BCE');
    });

    it('shows exact for day precision', () => {
      const event = { start: parseTime('2024-01-15'), precision: 'day' };
      expect(formatTimeRange(event)).toBe('Jan 15, 2024');
    });

    it('shows month for month precision', () => {
      const event = { start: parseTime('2024-01'), precision: 'month' };
      expect(formatTimeRange(event)).toBe('Jan 2024');
    });

    it('no circa for year precision', () => {
      const event = { start: parseTime('44 BCE'), precision: 'year' };
      expect(formatTimeRange(event)).toBe('44 BCE');
    });
  });
});
