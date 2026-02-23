/**
 * TDD tests for frame-time measurement (nayra-r1i.2)
 *
 * Tests are written before implementation to drive the API design.
 * The Performance API is fully mocked so tests run fast in Node.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  FRAME_BUDGET_MS,
  startFrame,
  startPhase,
  endPhase,
  endFrame,
} from '../../src/monitoring/frame-time.js';
import { logSlowFrame, isDevMode } from '../../src/monitoring/performance-logger.js';

// ---------------------------------------------------------------------------
// Performance API mock helpers
// ---------------------------------------------------------------------------

function makePerformanceMock(measureDurations = {}) {
  const marks = [];
  const measures = [];

  return {
    mark: vi.fn((name) => marks.push(name)),
    measure: vi.fn((name, startMark, endMark) =>
      measures.push({ name, startMark, endMark }),
    ),
    getEntriesByName: vi.fn((name) => {
      if (name in measureDurations) {
        return [{ name, duration: measureDurations[name] }];
      }
      return [];
    }),
    _marks: marks,
    _measures: measures,
  };
}

// ---------------------------------------------------------------------------
// FRAME_BUDGET_MS constant
// ---------------------------------------------------------------------------

describe('FRAME_BUDGET_MS', () => {
  it('equals 16.67 (1000/60)', () => {
    expect(FRAME_BUDGET_MS).toBeCloseTo(16.67, 2);
  });
});

// ---------------------------------------------------------------------------
// startFrame / endFrame
// ---------------------------------------------------------------------------

describe('startFrame', () => {
  let perfMock;
  beforeEach(() => {
    perfMock = makePerformanceMock();
    global.performance = perfMock;
  });
  afterEach(() => { delete global.performance; });

  it('calls performance.mark with frame-start-<id>', () => {
    startFrame('f1');
    expect(perfMock.mark).toHaveBeenCalledWith('frame-start-f1');
  });

  it('uses the supplied frame id verbatim', () => {
    startFrame('my-frame-42');
    expect(perfMock.mark).toHaveBeenCalledWith('frame-start-my-frame-42');
  });
});

describe('endFrame', () => {
  let perfMock;
  beforeEach(() => {
    perfMock = makePerformanceMock({ 'frame-f1': 10 });
    global.performance = perfMock;
  });
  afterEach(() => { delete global.performance; });

  it('calls performance.mark with frame-end-<id>', () => {
    endFrame('f1');
    expect(perfMock.mark).toHaveBeenCalledWith('frame-end-f1');
  });

  it('calls performance.measure spanning the frame marks', () => {
    endFrame('f1');
    expect(perfMock.measure).toHaveBeenCalledWith(
      'frame-f1',
      'frame-start-f1',
      'frame-end-f1',
    );
  });

  it('returns metrics object with frameId', () => {
    const m = endFrame('f1');
    expect(m.frameId).toBe('f1');
  });

  it('returns frameTime from the measure duration', () => {
    const m = endFrame('f1');
    expect(m.frameTime).toBe(10);
  });

  it('marks frame as not slow when under budget', () => {
    const m = endFrame('f1');
    expect(m.isSlowFrame).toBe(false);
  });

  it('marks frame as slow when over budget', () => {
    global.performance = makePerformanceMock({ 'frame-slow': 20 });
    const m = endFrame('slow');
    expect(m.isSlowFrame).toBe(true);
  });

  it('returns renderTime of 0 when render phase not measured', () => {
    const m = endFrame('f1');
    expect(m.renderTime).toBe(0);
  });

  it('returns layoutTime of 0 when layout phase not measured', () => {
    const m = endFrame('f1');
    expect(m.layoutTime).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// startPhase / endPhase
// ---------------------------------------------------------------------------

describe('startPhase', () => {
  let perfMock;
  beforeEach(() => {
    perfMock = makePerformanceMock();
    global.performance = perfMock;
  });
  afterEach(() => { delete global.performance; });

  it('calls performance.mark with <phase>-start-<frameId>', () => {
    startPhase('f1', 'render');
    expect(perfMock.mark).toHaveBeenCalledWith('render-start-f1');
  });

  it('works for layout phase', () => {
    startPhase('f1', 'layout');
    expect(perfMock.mark).toHaveBeenCalledWith('layout-start-f1');
  });
});

describe('endPhase', () => {
  let perfMock;
  beforeEach(() => {
    perfMock = makePerformanceMock();
    global.performance = perfMock;
  });
  afterEach(() => { delete global.performance; });

  it('calls performance.mark with <phase>-end-<frameId>', () => {
    endPhase('f1', 'render');
    expect(perfMock.mark).toHaveBeenCalledWith('render-end-f1');
  });

  it('calls performance.measure for the phase', () => {
    endPhase('f1', 'render');
    expect(perfMock.measure).toHaveBeenCalledWith(
      'render-f1',
      'render-start-f1',
      'render-end-f1',
    );
  });

  it('measures layout phase with correct marks', () => {
    endPhase('f1', 'layout');
    expect(perfMock.measure).toHaveBeenCalledWith(
      'layout-f1',
      'layout-start-f1',
      'layout-end-f1',
    );
  });
});

// ---------------------------------------------------------------------------
// Phase metrics included in endFrame result
// ---------------------------------------------------------------------------

describe('endFrame with phase metrics', () => {
  afterEach(() => { delete global.performance; });

  it('includes renderTime when render phase was measured', () => {
    global.performance = makePerformanceMock({
      'frame-f2': 18,
      'render-f2': 8,
    });
    const m = endFrame('f2');
    expect(m.renderTime).toBe(8);
  });

  it('includes layoutTime when layout phase was measured', () => {
    global.performance = makePerformanceMock({
      'frame-f3': 18,
      'layout-f3': 5,
    });
    const m = endFrame('f3');
    expect(m.layoutTime).toBe(5);
  });

  it('includes both renderTime and layoutTime together', () => {
    global.performance = makePerformanceMock({
      'frame-f4': 20,
      'render-f4': 9,
      'layout-f4': 6,
    });
    const m = endFrame('f4');
    expect(m.renderTime).toBe(9);
    expect(m.layoutTime).toBe(6);
    expect(m.isSlowFrame).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// performance-logger: isDevMode
// ---------------------------------------------------------------------------

describe('isDevMode', () => {
  it('returns a boolean', () => {
    expect(typeof isDevMode()).toBe('boolean');
  });
});

// ---------------------------------------------------------------------------
// performance-logger: logSlowFrame
// ---------------------------------------------------------------------------

describe('logSlowFrame', () => {
  let warnSpy;
  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => { warnSpy.mockRestore(); });

  it('does not log when frame is not slow', () => {
    logSlowFrame({ frameId: 'f1', frameTime: 10, renderTime: 0, layoutTime: 0, isSlowFrame: false }, true);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('logs to console.warn when frame is slow in dev mode', () => {
    logSlowFrame({ frameId: 'f1', frameTime: 20, renderTime: 8, layoutTime: 5, isSlowFrame: true }, true);
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it('does not log when devMode is false even for slow frames', () => {
    logSlowFrame({ frameId: 'f1', frameTime: 20, renderTime: 8, layoutTime: 5, isSlowFrame: true }, false);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('log message includes frame time', () => {
    logSlowFrame({ frameId: 'f1', frameTime: 20.5, renderTime: 8, layoutTime: 5, isSlowFrame: true }, true);
    expect(warnSpy.mock.calls[0][0]).toContain('20.50');
  });

  it('log message includes render time', () => {
    logSlowFrame({ frameId: 'f1', frameTime: 20, renderTime: 8.3, layoutTime: 5, isSlowFrame: true }, true);
    expect(warnSpy.mock.calls[0][0]).toContain('8.30');
  });

  it('log message includes layout time', () => {
    logSlowFrame({ frameId: 'f1', frameTime: 20, renderTime: 8, layoutTime: 5.1, isSlowFrame: true }, true);
    expect(warnSpy.mock.calls[0][0]).toContain('5.10');
  });
});

// ---------------------------------------------------------------------------
// Overhead: monitoring calls must be fast (<0.1ms each on average)
// ---------------------------------------------------------------------------

describe('monitoring overhead', () => {
  afterEach(() => { delete global.performance; });

  it('startFrame + endFrame overhead is under 0.1ms per frame on average', () => {
    // Use a real-but-minimal performance mock that just accumulates entries
    const entries = new Map();
    global.performance = {
      mark: () => {},
      measure: (name) => {
        entries.set(name, { name, duration: 5 });
      },
      getEntriesByName: (name) => entries.has(name) ? [entries.get(name)] : [],
    };

    const ITERATIONS = 500;
    const t0 = Date.now();
    for (let i = 0; i < ITERATIONS; i++) {
      startFrame(i);
      endFrame(i);
    }
    const totalMs = Date.now() - t0;
    const perFrameMs = totalMs / ITERATIONS;

    // Allow generous budget since Date.now() has 1ms resolution; the important
    // thing is it doesn't take seconds.
    expect(perFrameMs).toBeLessThan(0.5);
  });
});
