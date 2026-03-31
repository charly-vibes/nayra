import { describe, expect, it } from 'vitest';
import { parseTimeQuery } from '../../../src/core/time-parser.js';
import { formatTimeRange, toDisplayYear } from '../../../src/ui/format.js';

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

  describe('Holocene calendar (HE)', () => {
    it('formats 2024 CE as 12024 HE', () => {
      const event = { start: parseTime('2024') };
      expect(formatTimeRange(event, 'holocene')).toBe('12024 HE');
    });

    it('formats 500 BCE as 9501 HE', () => {
      const event = { start: parseTime('500 BCE') };
      expect(formatTimeRange(event, 'holocene')).toBe('9501 HE');
    });

    it('formats deep past near HE boundary', () => {
      const event = { start: parseTime('10000 BCE') };
      const result = formatTimeRange(event, 'holocene');
      expect(result).toMatch(/^\d+ (?:HE|BHE)$/);
    });

    it('formats year range in HE mode', () => {
      const event = { start: parseTime('500 BCE'), end: parseTime('2024') };
      expect(formatTimeRange(event, 'holocene')).toBe('9501 – 12024 HE');
    });

    it('suppresses day precision to year-only in HE', () => {
      const event = { start: parseTime('2024-01-15'), precision: 'day' };
      expect(formatTimeRange(event, 'holocene')).toBe('12024 HE');
    });

    it('suppresses month precision to year-only in HE', () => {
      const event = { start: parseTime('2024-01'), precision: 'month' };
      expect(formatTimeRange(event, 'holocene')).toBe('12024 HE');
    });

    it('retains circa prefix in HE mode', () => {
      const event = { start: parseTime('44 BCE'), precision: 'decade' };
      expect(formatTimeRange(event, 'holocene')).toBe('c. 9957 HE');
    });

    it('deep time (Ga) is unchanged in HE mode', () => {
      const event = { start: parseTime('4.5 Ga') };
      expect(formatTimeRange(event, 'holocene')).toBe('4.5 Ga');
    });

    it('deep time (Ma) is unchanged in HE mode', () => {
      const event = { start: parseTime('65 Ma') };
      expect(formatTimeRange(event, 'holocene')).toBe('65 Ma');
    });
  });
});

describe('toDisplayYear', () => {
  it('returns CE year as string in gregorian mode', () => {
    expect(toDisplayYear(2024, 'gregorian')).toBe('2024');
  });

  it('returns BCE for years < 1 in gregorian mode', () => {
    expect(toDisplayYear(-499, 'gregorian')).toBe('500 BCE');
    expect(toDisplayYear(0, 'gregorian')).toBe('1 BCE');
  });

  it('converts CE year to HE', () => {
    expect(toDisplayYear(2024, 'holocene')).toBe('12024 HE');
  });

  it('converts 1 BCE (astronomical 0) to 10000 HE', () => {
    expect(toDisplayYear(0, 'holocene')).toBe('10000 HE');
  });

  it('converts 500 BCE to 9501 HE', () => {
    expect(toDisplayYear(-499, 'holocene')).toBe('9501 HE');
  });

  it('converts 10000 BCE to 1 HE', () => {
    expect(toDisplayYear(-9999, 'holocene')).toBe('1 HE');
  });

  it('converts 50000 BCE to 40000 BHE', () => {
    expect(toDisplayYear(-49999, 'holocene')).toBe('40000 BHE');
  });

  it('defaults to gregorian when calendar is undefined', () => {
    expect(toDisplayYear(2024)).toBe('2024');
    expect(toDisplayYear(-499)).toBe('500 BCE');
  });
});
