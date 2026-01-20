import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createStore } from '../../src/core/store.js';
import { init, destroy, draw } from '../../src/rendering/renderer.js';
import { RationalScale } from '../../src/core/scale.js';

describe('Render Loop Integration', () => {
  let canvas;
  let store;
  let ctx;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.style.width = '800px';
    canvas.style.height = '400px';
    document.body.appendChild(canvas);

    Object.defineProperty(canvas, 'getBoundingClientRect', {
      value: () => ({ width: 800, height: 400, top: 0, left: 0 }),
    });

    store = createStore();
  });

  afterEach(() => {
    destroy();
    document.body.removeChild(canvas);
  });

  describe('renderer initialization', () => {
    it('initializes renderer with canvas and dispatch', () => {
      const result = init(canvas, store.dispatch);
      expect(result.canvas).toBe(canvas);
      expect(result.ctx).toBeDefined();
    });

    it('dispatches SET_CANVAS_WIDTH on init', () => {
      init(canvas, store.dispatch);
      expect(store.getState().canvasWidth).toBe(800);
    });

    it('sets canvas dimensions for DPI scaling', () => {
      const dpr = window.devicePixelRatio || 1;
      init(canvas, store.dispatch);
      expect(canvas.width).toBe(800 * dpr);
      expect(canvas.height).toBe(400 * dpr);
    });
  });

  describe('draw integration', () => {
    beforeEach(() => {
      init(canvas, store.dispatch);
    });

    it('draws without errors on empty state', () => {
      expect(() => draw(store.getState())).not.toThrow();
    });

    it('draws events from store', () => {
      store.dispatch({
        type: 'SET_EVENTS',
        events: [
          { id: 'e1', start: 0n },
          { id: 'e2', start: 100n },
        ],
      });
      expect(() => draw(store.getState())).not.toThrow();
    });

    it('respects viewport when drawing events', () => {
      const scale = RationalScale.fromPixelsPerSecond(1);
      store.dispatch({ type: 'SET_VIEWPORT', viewportStart: 0n, scale });
      store.dispatch({
        type: 'SET_EVENTS',
        events: [
          { id: 'visible', start: 100n },
          { id: 'outside', start: 10000n },
        ],
      });
      expect(() => draw(store.getState())).not.toThrow();
    });
  });

  describe('revision-based rendering', () => {
    beforeEach(() => {
      init(canvas, store.dispatch);
    });

    it('revision increments on state change', () => {
      const initialRevision = store.getState().revision;
      store.dispatch({ type: 'PAN', offset: 100n });
      expect(store.getState().revision).toBe(initialRevision + 1);
    });

    it('revision stays same on no-op dispatch', () => {
      const initialRevision = store.getState().revision;
      store.dispatch({ type: 'UNKNOWN_ACTION' });
      expect(store.getState().revision).toBe(initialRevision);
    });

    it('simulates RAF loop skipping unchanged state', () => {
      let lastRenderedRevision = -1;
      let drawCount = 0;

      function simulateLoop() {
        const state = store.getState();
        if (state.revision !== lastRenderedRevision) {
          draw(state);
          drawCount++;
          lastRenderedRevision = state.revision;
        }
      }

      simulateLoop();
      expect(drawCount).toBe(1);

      simulateLoop();
      expect(drawCount).toBe(1);

      store.dispatch({ type: 'PAN', offset: 50n });
      simulateLoop();
      expect(drawCount).toBe(2);

      simulateLoop();
      expect(drawCount).toBe(2);
    });
  });

  describe('store-renderer coordination', () => {
    it('viewportEnd updates with canvasWidth', () => {
      const scale = RationalScale.fromPixelsPerSecond(1);
      store.dispatch({ type: 'SET_VIEWPORT', viewportStart: 0n, scale });

      store.dispatch({ type: 'SET_CANVAS_WIDTH', width: 500 });
      expect(store.getViewportEnd()).toBe(500n);

      store.dispatch({ type: 'SET_CANVAS_WIDTH', width: 1000 });
      expect(store.getViewportEnd()).toBe(1000n);
    });

    it('panning updates viewport correctly', () => {
      const scale = RationalScale.fromPixelsPerSecond(1);
      store.dispatch({ type: 'SET_VIEWPORT', viewportStart: 0n, scale });

      store.dispatch({ type: 'PAN', offset: 200n });
      expect(store.getState().viewportStart).toBe(200n);
    });
  });
});
