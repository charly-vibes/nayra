import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isEventInViewport, calculatePanToEvent, initAutoPan } from '../../src/viewport/pan.js';
import { RationalScale } from '../../src/core/scale.js';
import { createStore } from '../../src/core/store.js';

describe('Viewport Pan', () => {
  describe('isEventInViewport', () => {
    const viewportStart = 1000n;
    const viewportEnd = 2000n;

    it('returns true when event is within comfortable viewing area', () => {
      const event = { id: 'evt-1', start: 1400n, end: 1600n };
      expect(isEventInViewport(event, viewportStart, viewportEnd)).toBe(true);
    });

    it('returns false when event is before viewport margin', () => {
      const event = { id: 'evt-1', start: 1000n, end: 1100n };
      expect(isEventInViewport(event, viewportStart, viewportEnd)).toBe(false);
    });

    it('returns false when event is after viewport margin', () => {
      const event = { id: 'evt-1', start: 1900n, end: 2000n };
      expect(isEventInViewport(event, viewportStart, viewportEnd)).toBe(false);
    });

    it('returns false when event is before viewport start', () => {
      const event = { id: 'evt-1', start: 500n, end: 600n };
      expect(isEventInViewport(event, viewportStart, viewportEnd)).toBe(false);
    });

    it('returns false when event is after viewport end', () => {
      const event = { id: 'evt-1', start: 2500n, end: 2600n };
      expect(isEventInViewport(event, viewportStart, viewportEnd)).toBe(false);
    });

    it('uses event midpoint for visibility check', () => {
      // Event starts just outside margin but midpoint is inside
      const event = { id: 'evt-1', start: 1150n, end: 1350n };
      // Midpoint is 1250n, which should be within 20% margin
      expect(isEventInViewport(event, viewportStart, viewportEnd)).toBe(true);
    });

    it('returns false for null event', () => {
      expect(isEventInViewport(null, viewportStart, viewportEnd)).toBe(false);
    });
  });

  describe('calculatePanToEvent', () => {
    const scale = RationalScale.fromSecondsPerPixel(1);
    const canvasWidth = 800;

    it('centers event in viewport', () => {
      const event = { id: 'evt-1', start: 1000n, end: 1200n };
      const currentStart = 0n;

      const newStart = calculatePanToEvent(event, canvasWidth, scale, currentStart);

      // Event midpoint is 1100n
      // Half canvas width is 400 seconds
      // So viewport should start at 1100 - 400 = 700
      expect(newStart).toBe(700n);
    });

    it('handles different canvas widths', () => {
      const event = { id: 'evt-1', start: 2000n, end: 2400n };
      const currentStart = 0n;
      const wideCanvas = 1600;

      const newStart = calculatePanToEvent(event, wideCanvas, scale, currentStart);

      // Event midpoint is 2200n
      // Half canvas width is 800 seconds
      // So viewport should start at 2200 - 800 = 1400
      expect(newStart).toBe(1400n);
    });

    it('returns current start for null event', () => {
      const currentStart = 500n;
      const newStart = calculatePanToEvent(null, canvasWidth, scale, currentStart);
      expect(newStart).toBe(currentStart);
    });
  });

  describe('initAutoPan', () => {
    let store;
    let unsubscribe;

    beforeEach(() => {
      const scale = RationalScale.fromSecondsPerPixel(1);
      store = createStore({
        viewportStart: 0n,
        scale,
        canvasWidth: 800,
        events: [
          { id: 'event-1', start: 300n, end: 400n }, // Midpoint 350n, well within 160n-640n margin
          { id: 'event-2', start: 1000n, end: 1100n },
          { id: 'event-3', start: 2000n, end: 2100n },
        ],
        focusedEventId: null,
      });
    });

    afterEach(() => {
      if (unsubscribe) unsubscribe();
    });

    it('pans viewport when focused event is off-screen', () => {
      unsubscribe = initAutoPan(store);

      // Focus event that's off-screen (event-3 at 2000n, viewport at 0n-800n)
      store.dispatch({ type: 'SET_FOCUS', eventId: 'event-3' });

      const state = store.getState();
      // Viewport should have panned to show event-3
      expect(state.viewportStart).not.toBe(0n);
      expect(state.viewportStart).toBeGreaterThan(1000n);
    });

    it('does not pan when focused event is already visible', () => {
      unsubscribe = initAutoPan(store);
      const initialStart = store.getState().viewportStart;

      // Focus event that's already visible (event-1 at 100n, viewport at 0n-800n)
      store.dispatch({ type: 'SET_FOCUS', eventId: 'event-1' });

      const state = store.getState();
      // Viewport should not have changed
      expect(state.viewportStart).toBe(initialStart);
    });

    it('does not pan when no event is focused', () => {
      unsubscribe = initAutoPan(store);
      const initialStart = store.getState().viewportStart;

      store.dispatch({ type: 'SET_FOCUS', eventId: null });

      const state = store.getState();
      expect(state.viewportStart).toBe(initialStart);
    });

    it('does not pan when focusing the same event again', () => {
      unsubscribe = initAutoPan(store);

      // First focus
      store.dispatch({ type: 'SET_FOCUS', eventId: 'event-3' });
      const firstPanStart = store.getState().viewportStart;

      // Focus the same event again
      store.dispatch({ type: 'SET_FOCUS', eventId: 'event-3' });
      const secondPanStart = store.getState().viewportStart;

      // Viewport should not have changed
      expect(secondPanStart).toBe(firstPanStart);
    });

    it('handles focus change to non-existent event gracefully', () => {
      unsubscribe = initAutoPan(store);
      const initialStart = store.getState().viewportStart;

      store.dispatch({ type: 'SET_FOCUS', eventId: 'non-existent' });

      const state = store.getState();
      // Should not crash, viewport unchanged
      expect(state.viewportStart).toBe(initialStart);
    });

    it('pans when switching between off-screen events', () => {
      // Set viewport to show middle area
      store.dispatch({ type: 'SET_VIEWPORT', viewportStart: 1000n, scale: store.getState().scale });
      unsubscribe = initAutoPan(store);

      // Focus first event (off-screen to the left)
      store.dispatch({ type: 'SET_FOCUS', eventId: 'event-1' });
      const firstPanStart = store.getState().viewportStart;
      expect(firstPanStart).toBeLessThan(1000n);

      // Focus last event (off-screen to the right)
      store.dispatch({ type: 'SET_FOCUS', eventId: 'event-3' });
      const secondPanStart = store.getState().viewportStart;
      expect(secondPanStart).toBeGreaterThan(firstPanStart);
    });
  });
});
