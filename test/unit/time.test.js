import { describe, it, expect } from 'vitest';
import {
  SECOND,
  MINUTE,
  HOUR,
  DAY,
  YEAR,
  BILLION_YEARS,
  projectToScreen,
  isVisible,
  compareTimes,
  addDuration,
  calculateDuration,
  validateDuration,
} from '../../src/core/time.js';
import { RationalScale } from '../../src/core/scale.js';

describe('Time Unit Constants', () => {
  it('SECOND equals 1n', () => {
    expect(SECOND).toBe(1n);
  });

  it('MINUTE equals 60n', () => {
    expect(MINUTE).toBe(60n);
  });

  it('HOUR equals 3600n', () => {
    expect(HOUR).toBe(3600n);
  });

  it('DAY equals 86400n', () => {
    expect(DAY).toBe(86400n);
  });

  it('YEAR equals approximately 31557600n', () => {
    expect(YEAR).toBe(31557600n);
  });

  it('BILLION_YEARS equals 31557600000000000n', () => {
    expect(BILLION_YEARS).toBe(31557600000000000n);
  });
});

describe('BigInt Temporal Coordinates', () => {
  it('present moment is 0n when zero point is present', () => {
    const present = 0n;
    expect(present).toBe(0n);
  });

  it('historical event is negative BigInt', () => {
    const year500BC = -500n * YEAR;
    expect(year500BC < 0n).toBe(true);
  });

  it('future event is positive BigInt', () => {
    const year2100 = 100n * YEAR;
    expect(year2100 > 0n).toBe(true);
  });

  it('handles 4.5 billion years without precision loss', () => {
    const earthFormation = 4n * BILLION_YEARS + (BILLION_YEARS / 2n);
    const expected = (9n * BILLION_YEARS) / 2n;
    expect(earthFormation).toBe(expected);
    expect(earthFormation > 0n).toBe(true);
  });
});

describe('Floating Origin - projectToScreen', () => {
  it('calculates screen position relative to viewport start', () => {
    const scale = RationalScale.fromPixelsPerSecond(1);
    const viewportStart = 1000000n;
    const eventTime = 1000100n;
    const px = projectToScreen(eventTime, viewportStart, scale);
    expect(px).toBeCloseTo(100, 0);
  });

  it('handles deep time coordinates without jitter', () => {
    const scale = RationalScale.fromSecondsPerPixel(1000);
    const viewportStart = 4n * BILLION_YEARS;
    const eventTime = viewportStart + 1000000n;
    const px = projectToScreen(eventTime, viewportStart, scale);
    expect(px).toBeCloseTo(1000, 0);
  });
});

describe('isVisible', () => {
  it('returns true for events within viewport', () => {
    expect(isVisible(50n, 10n, 0n, 100n)).toBe(true);
  });

  it('returns true for events starting before but ending in viewport', () => {
    expect(isVisible(-20n, 30n, 0n, 100n)).toBe(true);
  });

  it('returns true for events starting in but ending after viewport', () => {
    expect(isVisible(90n, 20n, 0n, 100n)).toBe(true);
  });

  it('returns false for events entirely before viewport', () => {
    expect(isVisible(-50n, 10n, 0n, 100n)).toBe(false);
  });

  it('returns false for events entirely after viewport', () => {
    expect(isVisible(150n, 10n, 0n, 100n)).toBe(false);
  });
});

describe('Temporal Arithmetic', () => {
  it('adds duration correctly', () => {
    expect(addDuration(100n, 50n)).toBe(150n);
  });

  it('calculates duration between times', () => {
    expect(calculateDuration(100n, 200n)).toBe(100n);
  });

  it('handles negative durations', () => {
    expect(calculateDuration(200n, 100n)).toBe(-100n);
  });

  it('compares times correctly', () => {
    expect(compareTimes(100n, 200n)).toBe(-1);
    expect(compareTimes(200n, 100n)).toBe(1);
    expect(compareTimes(100n, 100n)).toBe(0);
  });
});

describe('Duration Validation', () => {
  it('validates zero duration as point event', () => {
    const result = validateDuration(100n, 100n);
    expect(result.valid).toBe(true);
    expect(result.duration).toBe(0n);
    expect(result.isPoint).toBe(true);
  });

  it('rejects negative duration', () => {
    const result = validateDuration(100n, 50n);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('End time before start time');
  });

  it('treats missing end time as point event', () => {
    const result = validateDuration(100n, undefined);
    expect(result.valid).toBe(true);
    expect(result.duration).toBe(0n);
    expect(result.isPoint).toBe(true);
  });

  it('validates positive duration', () => {
    const result = validateDuration(100n, 200n);
    expect(result.valid).toBe(true);
    expect(result.duration).toBe(100n);
    expect(result.isPoint).toBe(false);
  });
});
