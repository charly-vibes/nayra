import { describe, it, expect } from 'vitest';
import {
  hashCode,
  getEventColor,
  cullEvents,
  getGridInterval,
  formatTime,
  EVENT_HEIGHT,
  EVENT_COLORS,
} from '../../src/rendering/renderer.js';
import { YEAR, MILLION_YEARS, BILLION_YEARS } from '../../src/core/time.js';

describe('Renderer', () => {
  describe('constants', () => {
    it('EVENT_HEIGHT is 20 pixels', () => {
      expect(EVENT_HEIGHT).toBe(20);
    });

    it('EVENT_COLORS has 8 colors', () => {
      expect(EVENT_COLORS).toHaveLength(8);
    });

    it('EVENT_COLORS are valid hex colors', () => {
      for (const color of EVENT_COLORS) {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });
  });

  describe('hashCode', () => {
    it('returns consistent hash for same string', () => {
      const hash1 = hashCode('event-123');
      const hash2 = hashCode('event-123');
      expect(hash1).toBe(hash2);
    });

    it('returns different hash for different strings', () => {
      const hash1 = hashCode('event-1');
      const hash2 = hashCode('event-2');
      expect(hash1).not.toBe(hash2);
    });

    it('returns non-negative number', () => {
      expect(hashCode('test')).toBeGreaterThanOrEqual(0);
      expect(hashCode('')).toBeGreaterThanOrEqual(0);
      expect(hashCode('negative-test-case')).toBeGreaterThanOrEqual(0);
    });

    it('handles empty string', () => {
      expect(hashCode('')).toBe(0);
    });

    it('handles unicode characters', () => {
      const hash = hashCode('日本語テスト');
      expect(typeof hash).toBe('number');
      expect(hash).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getEventColor', () => {
    it('returns a color from EVENT_COLORS', () => {
      const color = getEventColor('event-1');
      expect(EVENT_COLORS).toContain(color);
    });

    it('returns consistent color for same event id', () => {
      const color1 = getEventColor('my-event');
      const color2 = getEventColor('my-event');
      expect(color1).toBe(color2);
    });

    it('distributes colors across different event ids', () => {
      const colors = new Set();
      for (let i = 0; i < 100; i++) {
        colors.add(getEventColor(`event-${i}`));
      }
      expect(colors.size).toBeGreaterThan(1);
    });
  });

  describe('cullEvents', () => {
    it('returns empty array for no events', () => {
      const result = cullEvents([], 0n, 1000n);
      expect(result).toEqual([]);
    });

    it('returns events within viewport', () => {
      const events = [
        { id: 'a', start: 100n },
        { id: 'b', start: 500n },
      ];
      const result = cullEvents(events, 0n, 1000n);
      expect(result).toHaveLength(2);
    });

    it('excludes events before viewport', () => {
      const events = [
        { id: 'before', start: 50n },
        { id: 'inside', start: 150n },
      ];
      const result = cullEvents(events, 100n, 200n);
      expect(result.map((e) => e.id)).toEqual(['inside']);
    });

    it('excludes events after viewport', () => {
      const events = [
        { id: 'inside', start: 150n },
        { id: 'after', start: 250n },
      ];
      const result = cullEvents(events, 100n, 200n);
      expect(result.map((e) => e.id)).toEqual(['inside']);
    });

    it('includes events with duration spanning viewport start', () => {
      const events = [{ id: 'spanning', start: 50n, end: 150n }];
      const result = cullEvents(events, 100n, 200n);
      expect(result).toHaveLength(1);
    });

    it('includes events with duration spanning entire viewport', () => {
      const events = [{ id: 'large', start: 0n, end: 1000n }];
      const result = cullEvents(events, 100n, 200n);
      expect(result).toHaveLength(1);
    });

    it('treats undefined end as point event (zero duration)', () => {
      const events = [
        { id: 'point-inside', start: 150n },
        { id: 'point-outside', start: 50n },
      ];
      const result = cullEvents(events, 100n, 200n);
      expect(result.map((e) => e.id)).toEqual(['point-inside']);
    });

    it('handles BigInt coordinates at deep time scales', () => {
      const BILLION_YEARS = 31557600000000000n;
      const events = [
        { id: 'big-bang', start: -13n * BILLION_YEARS },
        { id: 'earth', start: -4n * BILLION_YEARS },
        { id: 'now', start: 0n },
      ];
      const result = cullEvents(events, -5n * BILLION_YEARS, -3n * BILLION_YEARS);
      expect(result.map((e) => e.id)).toEqual(['earth']);
    });
  });

  describe('getGridInterval', () => {
    it('returns seconds for very small scale (zoomed in)', () => {
      const result = getGridInterval(0.1); // 0.1 seconds per pixel
      expect(result.unit).toBe('s');
    });

    it('returns minutes for minute-scale zoom', () => {
      const result = getGridInterval(10); // 10 seconds per pixel
      expect(result.unit).toBe('min');
    });

    it('returns hours for hour-scale zoom', () => {
      const result = getGridInterval(100); // 100 seconds per pixel
      expect(result.unit).toBe('h');
    });

    it('returns days for day-scale zoom', () => {
      const result = getGridInterval(1000); // ~1000 seconds per pixel
      expect(result.unit).toBe('d');
    });

    it('returns years for year-scale zoom', () => {
      const result = getGridInterval(Number(YEAR) / 100); // typical year view
      expect(result.unit).toBe('y');
    });

    it('returns Ma for million-year scale zoom', () => {
      const result = getGridInterval(Number(MILLION_YEARS) / 10);
      expect(result.unit).toBe('Ma');
    });

    it('returns Ga for billion-year scale zoom', () => {
      const result = getGridInterval(Number(BILLION_YEARS) / 10);
      expect(result.unit).toBe('Ga');
    });

    it('returns interval as BigInt', () => {
      const result = getGridInterval(1);
      expect(typeof result.interval).toBe('bigint');
    });
  });

  describe('formatTime', () => {
    it('formats Ga values correctly for negative (past) times', () => {
      const time = -4n * BILLION_YEARS;
      const result = formatTime(time, 'Ga', BILLION_YEARS);
      expect(result).toMatch(/4.*Ga/);
    });

    it('formats Ma values correctly for negative (past) times', () => {
      const time = -100n * MILLION_YEARS;
      const result = formatTime(time, 'Ma', MILLION_YEARS);
      expect(result).toMatch(/100.*Ma/);
    });

    it('formats recent years correctly', () => {
      const year2000 = 946684800n; // 2000-01-01 00:00:00 UTC
      const result = formatTime(year2000, 'y', YEAR);
      expect(result).toBe('2000');
    });

    it('formats dates correctly for day-scale', () => {
      const date = 946684800n; // 2000-01-01 00:00:00 UTC
      const result = formatTime(date, 'd', 86400n);
      expect(result).toBe('2000-01-01');
    });

    it('handles deep time values without NaN (regression test for 1800 Ma)', () => {
      const time = -1800n * MILLION_YEARS;
      const result = formatTime(time, 'Ma', MILLION_YEARS);
      expect(result).not.toContain('NaN');
      expect(result).toMatch(/1800.*Ma/);
    });

    it('handles values exceeding Number.MAX_SAFE_INTEGER', () => {
      const time = -13n * BILLION_YEARS;
      const result = formatTime(time, 'Ga', BILLION_YEARS);
      expect(result).not.toContain('NaN');
      expect(result).toMatch(/13.*Ga/);
    });
  });
});
