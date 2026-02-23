import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeNextIndex, computePrevIndex, computePanToEvent } from '../../src/ui/search-navigation.js';
import { createStore } from '../../src/core/store.js';
import { RationalScale } from '../../src/core/scale.js';
import { YEAR } from '../../src/core/time.js';

// --- Pure navigation index logic ---

describe('computeNextIndex', () => {
  it('advances to the next result', () => {
    expect(computeNextIndex(0, 5)).toBe(1);
    expect(computeNextIndex(2, 5)).toBe(3);
  });

  it('wraps from the last result back to the first', () => {
    expect(computeNextIndex(4, 5)).toBe(0);
  });

  it('returns 0 when total is 0', () => {
    expect(computeNextIndex(0, 0)).toBe(0);
  });

  it('handles single result (stays at 0)', () => {
    expect(computeNextIndex(0, 1)).toBe(0);
  });
});

describe('computePrevIndex', () => {
  it('goes back to the previous result', () => {
    expect(computePrevIndex(3, 5)).toBe(2);
    expect(computePrevIndex(1, 5)).toBe(0);
  });

  it('wraps from the first result to the last', () => {
    expect(computePrevIndex(0, 5)).toBe(4);
  });

  it('returns 0 when total is 0', () => {
    expect(computePrevIndex(0, 0)).toBe(0);
  });

  it('handles single result (stays at 0)', () => {
    expect(computePrevIndex(0, 1)).toBe(0);
  });
});

// --- Viewport pan computation ---

describe('computePanToEvent', () => {
  const scale = RationalScale.fromSecondsPerPixel(Number(YEAR));
  const canvasWidth = 800;

  it('centers a point event in the viewport', () => {
    const event = { id: 'e1', start: 1000n * YEAR, end: 1000n * YEAR };
    const newStart = computePanToEvent(event, canvasWidth, scale);
    const halfTime = scale.pxToTime(canvasWidth / 2);
    expect(newStart).toBe(event.start - halfTime);
  });

  it('centers a duration event on its midpoint', () => {
    const event = { id: 'e1', start: 0n, end: 100n * YEAR };
    const midpoint = 50n * YEAR;
    const halfTime = scale.pxToTime(canvasWidth / 2);
    const newStart = computePanToEvent(event, canvasWidth, scale);
    expect(newStart).toBe(midpoint - halfTime);
  });

  it('handles events with no end (point events)', () => {
    const event = { id: 'e1', start: 500n * YEAR };
    const halfTime = scale.pxToTime(canvasWidth / 2);
    const newStart = computePanToEvent(event, canvasWidth, scale);
    expect(newStart).toBe(event.start - halfTime);
  });

  it('returns a BigInt', () => {
    const event = { id: 'e1', start: 100n, end: 200n };
    const result = computePanToEvent(event, canvasWidth, scale);
    expect(typeof result).toBe('bigint');
  });
});

// --- Store integration ---

describe('NEXT_RESULT action', () => {
  it('advances currentResultIndex', () => {
    const store = createStore();
    store.dispatch({ type: 'SET_EVENTS', events: [
      { id: 'e1', start: 0n, title: 'Moon' },
      { id: 'e2', start: 1n, title: 'Moon Landing' },
    ]});
    store.dispatch({ type: 'SEARCH_EVENTS', query: 'Moon' });
    // Should start at index 0
    expect(store.getState().currentResultIndex).toBe(0);

    store.dispatch({ type: 'NEXT_RESULT' });
    expect(store.getState().currentResultIndex).toBe(1);
  });

  it('wraps around to 0 after the last result', () => {
    const store = createStore();
    store.dispatch({ type: 'SET_EVENTS', events: [
      { id: 'e1', start: 0n, title: 'Apollo' },
      { id: 'e2', start: 1n, title: 'Apollo 11' },
    ]});
    store.dispatch({ type: 'SEARCH_EVENTS', query: 'Apollo' });
    store.dispatch({ type: 'NEXT_RESULT' }); // -> 1
    store.dispatch({ type: 'NEXT_RESULT' }); // -> 0 (wrap)
    expect(store.getState().currentResultIndex).toBe(0);
  });

  it('does nothing when there are no results', () => {
    const store = createStore();
    store.dispatch({ type: 'SEARCH_EVENTS', query: 'zzznomatch' });
    store.dispatch({ type: 'NEXT_RESULT' });
    expect(store.getState().currentResultIndex).toBe(0);
  });
});

describe('PREV_RESULT action', () => {
  it('goes back to the previous result', () => {
    const store = createStore();
    store.dispatch({ type: 'SET_EVENTS', events: [
      { id: 'e1', start: 0n, title: 'Apollo' },
      { id: 'e2', start: 1n, title: 'Apollo 11' },
    ]});
    store.dispatch({ type: 'SEARCH_EVENTS', query: 'Apollo' });
    store.dispatch({ type: 'NEXT_RESULT' }); // -> 1
    store.dispatch({ type: 'PREV_RESULT' }); // -> 0
    expect(store.getState().currentResultIndex).toBe(0);
  });

  it('wraps from 0 to the last result', () => {
    const store = createStore();
    store.dispatch({ type: 'SET_EVENTS', events: [
      { id: 'e1', start: 0n, title: 'Apollo' },
      { id: 'e2', start: 1n, title: 'Apollo 11' },
    ]});
    store.dispatch({ type: 'SEARCH_EVENTS', query: 'Apollo' });
    store.dispatch({ type: 'PREV_RESULT' }); // 0 -> 1 (wrap)
    expect(store.getState().currentResultIndex).toBe(1);
  });
});

describe('JUMP_TO_RESULT action', () => {
  it('jumps to a specific result index', () => {
    const store = createStore();
    store.dispatch({ type: 'SET_EVENTS', events: [
      { id: 'e1', start: 0n, title: 'Apollo' },
      { id: 'e2', start: 1n, title: 'Apollo 11' },
      { id: 'e3', start: 2n, title: 'Apollo 13' },
    ]});
    store.dispatch({ type: 'SEARCH_EVENTS', query: 'Apollo' });
    store.dispatch({ type: 'JUMP_TO_RESULT', index: 2 });
    expect(store.getState().currentResultIndex).toBe(2);
  });

  it('clamps index to valid range', () => {
    const store = createStore();
    store.dispatch({ type: 'SET_EVENTS', events: [
      { id: 'e1', start: 0n, title: 'Apollo' },
    ]});
    store.dispatch({ type: 'SEARCH_EVENTS', query: 'Apollo' });
    store.dispatch({ type: 'JUMP_TO_RESULT', index: 999 });
    expect(store.getState().currentResultIndex).toBe(0); // only 1 result, clamped to 0
  });
});

describe('result count accuracy', () => {
  it('resets currentResultIndex when new search starts', () => {
    const store = createStore();
    store.dispatch({ type: 'SET_EVENTS', events: [
      { id: 'e1', start: 0n, title: 'Apollo' },
      { id: 'e2', start: 1n, title: 'Apollo 11' },
    ]});
    store.dispatch({ type: 'SEARCH_EVENTS', query: 'Apollo' });
    store.dispatch({ type: 'NEXT_RESULT' }); // -> 1
    store.dispatch({ type: 'SEARCH_EVENTS', query: 'Moon' }); // new search
    expect(store.getState().currentResultIndex).toBe(0);
  });

  it('tracks total results via searchResultIds length', () => {
    const store = createStore();
    store.dispatch({ type: 'SET_EVENTS', events: [
      { id: 'e1', start: 0n, title: 'Apollo' },
      { id: 'e2', start: 1n, title: 'Apollo 11' },
      { id: 'e3', start: 2n, title: 'Moon' },
    ]});
    store.dispatch({ type: 'SEARCH_EVENTS', query: 'Apollo' });
    const state = store.getState();
    expect(state.searchResultIds).toHaveLength(2);
    expect(state.currentResultIndex).toBe(0);
  });
});
