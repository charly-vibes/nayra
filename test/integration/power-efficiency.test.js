/**
 * Power efficiency tests — idle detection (nayra-r1i.6)
 *
 * TDD: verify that the idle detector enters idle state after the timeout
 * and resumes on interaction.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createIdleDetector } from '../../src/core/idle-detection.js';

// ---------------------------------------------------------------------------
// Test doubles for injectable globals
// ---------------------------------------------------------------------------

function makeDocStub() {
  let hiddenValue = false;
  const listeners = {};
  return {
    get hidden() { return hiddenValue; },
    set hidden(v) { hiddenValue = v; },
    addEventListener(type, fn) {
      listeners[type] = listeners[type] ?? [];
      listeners[type].push(fn);
    },
    removeEventListener(type, fn) {
      listeners[type] = (listeners[type] ?? []).filter((f) => f !== fn);
    },
    _trigger(type) {
      for (const fn of listeners[type] ?? []) fn();
    },
    _listenerCount(type) {
      return (listeners[type] ?? []).length;
    },
  };
}

function makeWinStub() {
  const listeners = {};
  return {
    addEventListener(type, fn, opts) {
      listeners[type] = listeners[type] ?? [];
      listeners[type].push(fn);
    },
    removeEventListener(type, fn) {
      listeners[type] = (listeners[type] ?? []).filter((f) => f !== fn);
    },
    _trigger(type) {
      for (const fn of listeners[type] ?? []) fn();
    },
    _listenerCount(type) {
      return (listeners[type] ?? []).length;
    },
  };
}

// ---------------------------------------------------------------------------
// Shared setup
// ---------------------------------------------------------------------------

let doc, win, idleCalls, activeCalls, detector;

beforeEach(() => {
  vi.useFakeTimers();
  doc        = makeDocStub();
  win        = makeWinStub();
  idleCalls  = 0;
  activeCalls = 0;
});

afterEach(() => {
  detector?.destroy();
  vi.useRealTimers();
});

function makeDetector(extraOpts = {}) {
  return createIdleDetector({
    idleTimeoutMs: 5000,
    onIdle:   () => { idleCalls++; },
    onActive: () => { activeCalls++; },
    document: doc,
    window:   win,
    ...extraOpts,
  });
}

// ---------------------------------------------------------------------------
// Basic idle detection
// ---------------------------------------------------------------------------

describe('idle timeout', () => {
  it('starts in active state', () => {
    detector = makeDetector();
    expect(detector.isIdle()).toBe(false);
  });

  it('enters idle after the timeout with no interactions', () => {
    detector = makeDetector();
    vi.advanceTimersByTime(5000);
    expect(detector.isIdle()).toBe(true);
    expect(idleCalls).toBe(1);
  });

  it('does not enter idle before the timeout', () => {
    detector = makeDetector();
    vi.advanceTimersByTime(4999);
    expect(detector.isIdle()).toBe(false);
    expect(idleCalls).toBe(0);
  });

  it('resets the timer on interaction, delaying idle entry', () => {
    detector = makeDetector();
    vi.advanceTimersByTime(4000);
    win._trigger('mousemove');           // interaction at 4 s
    vi.advanceTimersByTime(4000);        // 4 s after interaction = 8 s total
    expect(detector.isIdle()).toBe(false);
    vi.advanceTimersByTime(1100);        // 1.1 s more = idle timer fires
    expect(detector.isIdle()).toBe(true);
  });

  it('calls onIdle exactly once per idle entry', () => {
    detector = makeDetector();
    vi.advanceTimersByTime(5100);
    expect(idleCalls).toBe(1);
    vi.advanceTimersByTime(5100);        // no interactions → timer already fired
    expect(idleCalls).toBe(1);           // still 1 — already idle
  });
});

// ---------------------------------------------------------------------------
// Active resume
// ---------------------------------------------------------------------------

describe('resuming from idle', () => {
  it('calls onActive when interaction occurs while idle', () => {
    detector = makeDetector();
    vi.advanceTimersByTime(5100);        // enter idle
    expect(detector.isIdle()).toBe(true);

    win._trigger('keydown');             // interact
    expect(detector.isIdle()).toBe(false);
    expect(activeCalls).toBeGreaterThan(0);
  });

  it('enters idle again after another timeout of inactivity', () => {
    detector = makeDetector();
    vi.advanceTimersByTime(5100);        // idle
    win._trigger('mousemove');           // active
    expect(idleCalls).toBe(1);

    vi.advanceTimersByTime(5100);        // idle again
    expect(idleCalls).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Page Visibility API
// ---------------------------------------------------------------------------

describe('background tab throttling', () => {
  it('enters idle immediately when document becomes hidden', () => {
    detector = makeDetector();
    expect(detector.isIdle()).toBe(false);

    doc.hidden = true;
    doc._trigger('visibilitychange');
    expect(detector.isIdle()).toBe(true);
    expect(idleCalls).toBe(1);
  });

  it('resumes when document becomes visible again', () => {
    detector = makeDetector();
    doc.hidden = true;
    doc._trigger('visibilitychange');
    expect(detector.isIdle()).toBe(true);

    doc.hidden = false;
    doc._trigger('visibilitychange');
    expect(detector.isIdle()).toBe(false);
  });

  it('restarts idle timer after tab becomes visible', () => {
    detector = makeDetector();
    doc.hidden = true;
    doc._trigger('visibilitychange');

    doc.hidden = false;
    doc._trigger('visibilitychange');   // visible again → timer restarts
    expect(detector.isIdle()).toBe(false);

    vi.advanceTimersByTime(5100);        // idle timer fires
    expect(detector.isIdle()).toBe(true);
  });

  it('cancels the idle timer when tab goes hidden', () => {
    detector = makeDetector();
    vi.advanceTimersByTime(3000);        // 3 s in, 2 s remaining on timer

    doc.hidden = true;
    doc._trigger('visibilitychange');    // immediately idle, timer cancelled

    doc.hidden = false;
    doc._trigger('visibilitychange');    // visible; fresh 5 s timer

    // Only 2 s after becoming visible → NOT yet idle
    vi.advanceTimersByTime(2000);
    expect(detector.isIdle()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Interaction event wiring
// ---------------------------------------------------------------------------

describe('interaction event listeners', () => {
  it('registers listeners for all expected interaction events', () => {
    const expectedEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel', 'click'];
    detector = makeDetector();
    for (const type of expectedEvents) {
      expect(win._listenerCount(type)).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Destroy / cleanup
// ---------------------------------------------------------------------------

describe('destroy()', () => {
  it('removes all window interaction listeners', () => {
    detector = makeDetector();
    detector.destroy();
    // After destroy, no listeners should remain for tracked events
    expect(win._listenerCount('mousemove')).toBe(0);
    expect(win._listenerCount('keydown')).toBe(0);
    detector = null;
  });

  it('removes the visibilitychange listener', () => {
    detector = makeDetector();
    detector.destroy();
    expect(doc._listenerCount('visibilitychange')).toBe(0);
    detector = null;
  });

  it('does not enter idle after destroy', () => {
    detector = makeDetector();
    detector.destroy();
    vi.advanceTimersByTime(10000);
    expect(idleCalls).toBe(0);
    detector = null;
  });
});
