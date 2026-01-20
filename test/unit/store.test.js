import { describe, it, expect, vi } from 'vitest';
import { createStore } from '../../src/core/store.js';
import { RationalScale } from '../../src/core/scale.js';
import { YEAR } from '../../src/core/time.js';

describe('Store', () => {
  describe('initialization', () => {
    it('creates store with default state', () => {
      const store = createStore();
      const state = store.getState();
      expect(state.viewportStart).toBe(0n);
      expect(state.scale).toBeInstanceOf(RationalScale);
      expect(state.canvasWidth).toBe(800);
      expect(state.events).toEqual([]);
      expect(state.selectedEventIds).toBeInstanceOf(Set);
      expect(state.hoveredEventId).toBe(null);
      expect(state.revision).toBe(0);
    });

    it('accepts initial state overrides', () => {
      const store = createStore({ viewportStart: 1000n, canvasWidth: 1200 });
      const state = store.getState();
      expect(state.viewportStart).toBe(1000n);
      expect(state.canvasWidth).toBe(1200);
    });
  });

  describe('derived state', () => {
    it('calculates viewportEnd from viewportStart, scale, and canvasWidth', () => {
      const scale = RationalScale.fromPixelsPerSecond(1);
      const store = createStore({ viewportStart: 0n, scale, canvasWidth: 1000 });
      expect(store.getViewportEnd()).toBe(1000n);
    });
  });

  describe('immutability', () => {
    it('creates new state object on update', () => {
      const store = createStore();
      const prevState = store.getState();
      store.dispatch({ type: 'PAN', offset: 100n });
      const nextState = store.getState();
      expect(nextState).not.toBe(prevState);
    });

    it('increments revision on state change', () => {
      const store = createStore();
      expect(store.getState().revision).toBe(0);
      store.dispatch({ type: 'PAN', offset: 100n });
      expect(store.getState().revision).toBe(1);
    });
  });

  describe('subscriber management', () => {
    it('notifies subscribers on state change', () => {
      const store = createStore();
      const listener = vi.fn();
      store.subscribe(listener);
      store.dispatch({ type: 'PAN', offset: 100n });
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(store.getState());
    });

    it('calls subscribers in registration order', () => {
      const store = createStore();
      const order = [];
      store.subscribe(() => order.push(1));
      store.subscribe(() => order.push(2));
      store.dispatch({ type: 'PAN', offset: 100n });
      expect(order).toEqual([1, 2]);
    });

    it('unsubscribes listener', () => {
      const store = createStore();
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);
      unsubscribe();
      store.dispatch({ type: 'PAN', offset: 100n });
      expect(listener).not.toHaveBeenCalled();
    });

    it('does not notify when state unchanged', () => {
      const store = createStore();
      const listener = vi.fn();
      store.subscribe(listener);
      store.dispatch({ type: 'UNKNOWN_ACTION' });
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('viewport actions', () => {
    it('SET_VIEWPORT updates viewportStart and scale', () => {
      const store = createStore();
      const newScale = RationalScale.fromSecondsPerPixel(1000);
      store.dispatch({ type: 'SET_VIEWPORT', viewportStart: 5000n, scale: newScale });
      const state = store.getState();
      expect(state.viewportStart).toBe(5000n);
      expect(state.scale).toBe(newScale);
    });

    it('PAN updates viewportStart by offset', () => {
      const store = createStore({ viewportStart: 1000n });
      store.dispatch({ type: 'PAN', offset: -500n });
      expect(store.getState().viewportStart).toBe(500n);
    });

    it('SET_ZOOM updates scale', () => {
      const store = createStore();
      const newScale = RationalScale.fromSecondsPerPixel(500);
      store.dispatch({ type: 'SET_ZOOM', scale: newScale });
      expect(store.getState().scale).toBe(newScale);
    });

    it('SET_CANVAS_WIDTH updates canvasWidth', () => {
      const store = createStore();
      store.dispatch({ type: 'SET_CANVAS_WIDTH', width: 1920 });
      expect(store.getState().canvasWidth).toBe(1920);
    });
  });

  describe('event actions', () => {
    it('SET_EVENTS sets and sorts events by start time', () => {
      const store = createStore();
      const events = [
        { id: 'b', start: 200n },
        { id: 'a', start: 100n },
        { id: 'c', start: 300n },
      ];
      store.dispatch({ type: 'SET_EVENTS', events });
      const sorted = store.getState().events;
      expect(sorted.map((e) => e.id)).toEqual(['a', 'b', 'c']);
    });
  });

  describe('selection actions', () => {
    it('SELECT_EVENT sets single selection', () => {
      const store = createStore();
      store.dispatch({ type: 'SELECT_EVENT', eventId: 'event-1' });
      expect(store.getState().selectedEventIds.has('event-1')).toBe(true);
      expect(store.getState().selectedEventIds.size).toBe(1);
    });

    it('SELECT_EVENT clears previous selection', () => {
      const store = createStore();
      store.dispatch({ type: 'SELECT_EVENT', eventId: 'event-1' });
      store.dispatch({ type: 'SELECT_EVENT', eventId: 'event-2' });
      expect(store.getState().selectedEventIds.has('event-1')).toBe(false);
      expect(store.getState().selectedEventIds.has('event-2')).toBe(true);
    });

    it('TOGGLE_EVENT_SELECTION adds unselected event', () => {
      const store = createStore();
      store.dispatch({ type: 'TOGGLE_EVENT_SELECTION', eventId: 'event-1' });
      expect(store.getState().selectedEventIds.has('event-1')).toBe(true);
    });

    it('TOGGLE_EVENT_SELECTION removes selected event', () => {
      const store = createStore();
      store.dispatch({ type: 'SELECT_EVENT', eventId: 'event-1' });
      store.dispatch({ type: 'TOGGLE_EVENT_SELECTION', eventId: 'event-1' });
      expect(store.getState().selectedEventIds.has('event-1')).toBe(false);
    });

    it('CLEAR_SELECTION empties selectedEventIds', () => {
      const store = createStore();
      store.dispatch({ type: 'SELECT_EVENT', eventId: 'event-1' });
      store.dispatch({ type: 'CLEAR_SELECTION' });
      expect(store.getState().selectedEventIds.size).toBe(0);
    });
  });

  describe('hover actions', () => {
    it('SET_HOVER sets hoveredEventId', () => {
      const store = createStore();
      store.dispatch({ type: 'SET_HOVER', eventId: 'event-1' });
      expect(store.getState().hoveredEventId).toBe('event-1');
    });

    it('SET_HOVER with null clears hover', () => {
      const store = createStore();
      store.dispatch({ type: 'SET_HOVER', eventId: 'event-1' });
      store.dispatch({ type: 'SET_HOVER', eventId: null });
      expect(store.getState().hoveredEventId).toBe(null);
    });
  });

  describe('error handling', () => {
    it('ignores unknown action types', () => {
      const store = createStore();
      const prevState = store.getState();
      store.dispatch({ type: 'INVALID_ACTION' });
      expect(store.getState()).toBe(prevState);
    });
  });
});
