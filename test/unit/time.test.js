import { describe, it, expect } from 'vitest';
import {
  SECOND,
  MINUTE,
  HOUR,
  DAY,
  YEAR,
  MILLION_YEARS,
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

describe('Boundary-value analysis: extreme deep time', () => {
  // Key cosmological anchors in seconds (negative = before present)
  const BIG_BANG     = -13_800n * MILLION_YEARS;
  const EARTH_FORMED =  -4_500n * MILLION_YEARS;
  const DINO_EXTINCT =     -66n * MILLION_YEARS;
  const FUTURE_30GA  =  30_000n * MILLION_YEARS;

  describe('BigInt constant magnitudes', () => {
    it('BILLION_YEARS equals 1000 * MILLION_YEARS', () => {
      expect(BILLION_YEARS).toBe(1000n * MILLION_YEARS);
    });

    it('Big Bang coordinate is a large negative BigInt', () => {
      expect(BIG_BANG).toBeLessThan(0n);
      expect(BIG_BANG).toBe(-13_800n * MILLION_YEARS);
    });

    it('30 Ga future coordinate is representable', () => {
      expect(FUTURE_30GA).toBeGreaterThan(0n);
      expect(FUTURE_30GA).toBe(30_000n * MILLION_YEARS);
    });
  });

  describe('precision at cosmological scale', () => {
    it('two events 1 second apart at Big Bang epoch are distinguishable', () => {
      expect((BIG_BANG + 1n) - BIG_BANG).toBe(1n);
    });

    it('Big Bang to Earth formation duration is exactly 9300 Ma', () => {
      const duration = EARTH_FORMED - BIG_BANG;
      expect(duration / MILLION_YEARS).toBe(9_300n);
    });

    it('Big Bang to dino extinction duration is exactly 13734 Ma', () => {
      const duration = DINO_EXTINCT - BIG_BANG;
      expect(duration / MILLION_YEARS).toBe(13_734n);
    });
  });

  describe('projectToScreen at extreme offsets', () => {
    it('no jitter: 1-second events at Big Bang viewport project exactly at 1s/px', () => {
      // Use RationalScale(1,1): 1 pixel per second — avoids float precision in constructor
      const scale = new RationalScale(1n, 1n);
      const px0 = projectToScreen(BIG_BANG, BIG_BANG, scale);
      const px1 = projectToScreen(BIG_BANG + 1n, BIG_BANG, scale);
      expect(px0).toBe(0);
      expect(px1).toBe(1);
    });

    it('100 Ma/px scale maps Big Bang to Earth formation exactly 93 pixels apart', () => {
      // 1 pixel = 100 Ma → RationalScale(1, 100 * MILLION_YEARS)
      const scale = new RationalScale(1n, 100n * MILLION_YEARS);
      const px = projectToScreen(EARTH_FORMED, BIG_BANG, scale);
      // (9300 Ma) / (100 Ma/px) = 93 px
      expect(px).toBe(93);
    });

    it('1 Ma/px scale maps Big Bang to present as 13800 pixels', () => {
      const scale = new RationalScale(1n, MILLION_YEARS);
      const px = projectToScreen(0n, BIG_BANG, scale);
      expect(px).toBe(13_800);
    });
  });

  describe('isVisible at extreme coordinates', () => {
    it('event at Big Bang is visible when viewport spans Big Bang era', () => {
      const viewStart = BIG_BANG - BILLION_YEARS;
      const viewEnd   = BIG_BANG + BILLION_YEARS;
      expect(isVisible(BIG_BANG, 0n, viewStart, viewEnd)).toBe(true);
    });

    it('Earth formation is not visible in Big Bang-only viewport', () => {
      const viewStart = BIG_BANG - MILLION_YEARS;
      const viewEnd   = BIG_BANG + MILLION_YEARS;
      expect(isVisible(EARTH_FORMED, 0n, viewStart, viewEnd)).toBe(false);
    });

    it('long event from Big Bang to Earth formation is visible mid-span', () => {
      const duration  = EARTH_FORMED - BIG_BANG;
      const midpoint  = BIG_BANG + duration / 2n;
      const viewStart = midpoint - BILLION_YEARS;
      const viewEnd   = midpoint + BILLION_YEARS;
      expect(isVisible(BIG_BANG, duration, viewStart, viewEnd)).toBe(true);
    });

    it('future 30 Ga event is not visible from present viewport', () => {
      expect(isVisible(FUTURE_30GA, 0n, -DAY, DAY)).toBe(false);
    });
  });

  describe('arithmetic at 30+ Ga boundary', () => {
    it('future 30 Ga arithmetic stays exact', () => {
      const half = FUTURE_30GA / 2n;
      expect(half + half).toBe(FUTURE_30GA);
    });

    it('span from Big Bang to 30 Ga future is 43800 Ma', () => {
      const duration = FUTURE_30GA - BIG_BANG;
      expect(duration / MILLION_YEARS).toBe(43_800n);
    });

    it('compareTimes orders Big Bang before Earth formation', () => {
      expect(compareTimes(BIG_BANG, EARTH_FORMED)).toBe(-1);
      expect(compareTimes(EARTH_FORMED, BIG_BANG)).toBe(1);
    });

    it('compareTimes orders present before 30 Ga future', () => {
      expect(compareTimes(0n, FUTURE_30GA)).toBe(-1);
    });
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
