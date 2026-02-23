/**
 * Background tab throttling integration tests (nayra-r1i.6)
 *
 * Verifies that the idle detector correctly integrates with a simulated
 * render loop — requestAnimationFrame is cancelled when the document is
 * hidden, and resumed when it becomes visible.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createIdleDetector } from '../../src/core/idle-detection.js';

// ---------------------------------------------------------------------------
// Test doubles
// ---------------------------------------------------------------------------

function makeDocStub() {
  let hidden = false;
  const listeners = {};
  return {
    get hidden() { return hidden; },
    set hidden(v) { hidden = v; },
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
  };
}

function makeWinStub() {
  const listeners = {};
  return {
    addEventListener(type, fn) { listeners[type] = listeners[type] ?? []; listeners[type].push(fn); },
    removeEventListener(type, fn) { listeners[type] = (listeners[type] ?? []).filter((f) => f !== fn); },
    _trigger(type) { for (const fn of listeners[type] ?? []) fn(); },
  };
}

// ---------------------------------------------------------------------------
// Render loop simulation
// ---------------------------------------------------------------------------

/**
 * A minimal simulated render loop.
 * Tracks how many frames were requested and whether it's running.
 */
function makeRenderLoop() {
  let running   = false;
  let rafId     = 0;
  let frameCount = 0;

  const callbacks = new Map();
  let nextId = 1;

  function mockRaf(cb) {
    const id = nextId++;
    callbacks.set(id, cb);
    return id;
  }

  function mockCaf(id) {
    callbacks.delete(id);
  }

  function tick() {
    if (!running) return;
    frameCount++;
    for (const [id, cb] of callbacks) {
      callbacks.delete(id);
      cb(performance.now());
    }
  }

  function start() {
    if (running) return;
    running = true;
    rafId   = mockRaf(tick);
  }

  function stop() {
    if (!running) return;
    running = false;
    mockCaf(rafId);
  }

  return { start, stop, tick, isRunning: () => running, frameCount: () => frameCount };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

let doc, win, loop, detector;

beforeEach(() => {
  vi.useFakeTimers();
  doc  = makeDocStub();
  win  = makeWinStub();
  loop = makeRenderLoop();
});

afterEach(() => {
  detector?.destroy();
  vi.useRealTimers();
});

describe('render loop pauses on background tab', () => {
  it('stops the render loop when the tab is hidden', () => {
    detector = createIdleDetector({
      idleTimeoutMs: 5000,
      onIdle:   () => loop.stop(),
      onActive: () => loop.start(),
      document: doc,
      window:   win,
    });

    loop.start();
    expect(loop.isRunning()).toBe(true);

    doc.hidden = true;
    doc._trigger('visibilitychange');
    expect(loop.isRunning()).toBe(false);
  });

  it('resumes the render loop when the tab becomes visible', () => {
    detector = createIdleDetector({
      idleTimeoutMs: 5000,
      onIdle:   () => loop.stop(),
      onActive: () => loop.start(),
      document: doc,
      window:   win,
    });

    doc.hidden = true;
    doc._trigger('visibilitychange');
    expect(loop.isRunning()).toBe(false);

    doc.hidden = false;
    doc._trigger('visibilitychange');
    expect(loop.isRunning()).toBe(true);
  });
});

describe('render loop pauses on idle timeout', () => {
  it('stops the render loop after 5 s of inactivity', () => {
    detector = createIdleDetector({
      idleTimeoutMs: 5000,
      onIdle:   () => loop.stop(),
      onActive: () => loop.start(),
      document: doc,
      window:   win,
    });

    loop.start();
    vi.advanceTimersByTime(5100);
    expect(loop.isRunning()).toBe(false);
  });

  it('resumes the render loop on interaction after idle', () => {
    detector = createIdleDetector({
      idleTimeoutMs: 5000,
      onIdle:   () => loop.stop(),
      onActive: () => loop.start(),
      document: doc,
      window:   win,
    });

    loop.start();
    vi.advanceTimersByTime(5100); // idle
    expect(loop.isRunning()).toBe(false);

    win._trigger('mousemove');    // interact
    expect(loop.isRunning()).toBe(true);
  });
});

describe('combined: hidden tab + idle', () => {
  it('does not double-call onIdle when already idle from timeout then hidden', () => {
    let idleCount = 0;
    detector = createIdleDetector({
      idleTimeoutMs: 5000,
      onIdle:   () => { idleCount++; loop.stop(); },
      onActive: () => loop.start(),
      document: doc,
      window:   win,
    });

    vi.advanceTimersByTime(5100);   // idle from timeout
    expect(idleCount).toBe(1);

    doc.hidden = true;
    doc._trigger('visibilitychange'); // already idle, no second call
    expect(idleCount).toBe(1);
  });
});
