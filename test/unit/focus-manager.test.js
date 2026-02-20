import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createFocusManager } from '../../src/interaction/focus-manager.js';
import { createStore } from '../../src/core/store.js';
import { RationalScale } from '../../src/core/scale.js';

describe('FocusManager', () => {
  let store;
  let focusManager;
  let mockAriaLive;

  beforeEach(() => {
    store = createStore({
      events: [
        { id: 'event-1', start: 100n, end: 200n },
        { id: 'event-2', start: 300n, end: 400n },
        { id: 'event-3', start: 500n, end: 600n },
      ],
      viewportStart: 0n,
      scale: RationalScale.fromSecondsPerPixel(1),
      canvasWidth: 800,
    });

    // Mock ARIA live region
    mockAriaLive = { textContent: '' };

    focusManager = createFocusManager(store, mockAriaLive);
  });

  describe('initialization', () => {
    it('creates focus manager with null initial focus', () => {
      const state = store.getState();
      expect(state.focusedEventId).toBe(null);
    });

    it('initializes with empty focus history', () => {
      const state = store.getState();
      expect(state.focusHistory).toEqual([]);
    });

    it('initializes with keyboard focus mode disabled', () => {
      const state = store.getState();
      expect(state.isKeyboardFocusMode).toBe(false);
    });
  });

  describe('setFocus', () => {
    it('updates focused event in store', () => {
      focusManager.setFocus('event-2');
      const state = store.getState();
      expect(state.focusedEventId).toBe('event-2');
    });

    it('adds focused event to focus history', () => {
      focusManager.setFocus('event-1');
      focusManager.setFocus('event-2');
      const state = store.getState();
      expect(state.focusHistory).toEqual(['event-1', 'event-2']);
    });

    it('does not duplicate consecutive entries in history', () => {
      focusManager.setFocus('event-1');
      focusManager.setFocus('event-1');
      const state = store.getState();
      expect(state.focusHistory).toEqual(['event-1']);
    });

    it('limits focus history to max size', () => {
      for (let i = 0; i < 60; i++) {
        focusManager.setFocus(i % 2 === 0 ? 'event-1' : 'event-2');
      }
      const state = store.getState();
      expect(state.focusHistory.length).toBeLessThanOrEqual(50);
    });

    it('announces focus change to ARIA live region', () => {
      focusManager.setFocus('event-2');
      expect(mockAriaLive.textContent).toContain('event-2');
    });

    it('accepts null to clear focus', () => {
      focusManager.setFocus('event-1');
      focusManager.setFocus(null);
      const state = store.getState();
      expect(state.focusedEventId).toBe(null);
    });
  });

  describe('getFocus', () => {
    it('returns current focused event ID', () => {
      focusManager.setFocus('event-2');
      expect(focusManager.getFocus()).toBe('event-2');
    });

    it('returns null when no focus', () => {
      expect(focusManager.getFocus()).toBe(null);
    });
  });

  describe('focus persistence across viewport changes', () => {
    it('maintains focus after viewport pan', () => {
      focusManager.setFocus('event-2');
      store.dispatch({ type: 'PAN', offset: 1000n });
      expect(store.getState().focusedEventId).toBe('event-2');
    });

    it('maintains focus after viewport zoom', () => {
      focusManager.setFocus('event-2');
      const newScale = RationalScale.fromSecondsPerPixel(2);
      store.dispatch({ type: 'SET_ZOOM', scale: newScale });
      expect(store.getState().focusedEventId).toBe('event-2');
    });

    it('maintains focus after combined viewport change', () => {
      focusManager.setFocus('event-3');
      const newScale = RationalScale.fromSecondsPerPixel(0.5);
      store.dispatch({ type: 'SET_VIEWPORT', viewportStart: 500n, scale: newScale });
      expect(store.getState().focusedEventId).toBe('event-3');
    });
  });

  describe('focus restoration when event filtered', () => {
    it('clears focus when all events are removed', () => {
      focusManager.setFocus('event-2');
      store.dispatch({
        type: 'SET_EVENTS',
        events: [],
      });
      expect(store.getState().focusedEventId).toBe(null);
    });

    it('moves focus to nearest visible event when current filtered', () => {
      focusManager.setFocus('event-2');

      store.dispatch({
        type: 'SET_EVENTS',
        events: [
          { id: 'event-1', start: 100n, end: 200n },
          { id: 'event-3', start: 500n, end: 600n },
        ],
      });

      // Focus should move to nearest event (event-2 was at 350n midpoint)
      // event-1 midpoint is 150n (200n away), event-3 midpoint is 550n (200n away)
      // Both are equidistant, so either is acceptable
      const state = store.getState();
      expect(['event-1', 'event-3']).toContain(state.focusedEventId);
    });
  });

  describe('findNearestEvent', () => {
    it('returns event ID closest to given time', () => {
      // At 250n: event-1 midpoint (150n) is 100n away, event-2 midpoint (350n) is 100n away
      // Both equidistant, so either is acceptable
      const nearest = focusManager.findNearestEvent(250n);
      expect(['event-1', 'event-2']).toContain(nearest);
    });

    it('returns null when no events exist', () => {
      store.dispatch({ type: 'SET_EVENTS', events: [] });
      const nearest = focusManager.findNearestEvent(100n);
      expect(nearest).toBe(null);
    });

    it('finds nearest by comparing to event midpoint', () => {
      // event-1 midpoint: 150n
      // event-2 midpoint: 350n
      const nearest = focusManager.findNearestEvent(200n);
      expect(nearest).toBe('event-1');
    });
  });

  describe('focus history navigation', () => {
    it('supports back navigation through history', () => {
      focusManager.setFocus('event-1');
      focusManager.setFocus('event-2');
      focusManager.setFocus('event-3');

      focusManager.focusBack();
      expect(store.getState().focusedEventId).toBe('event-2');

      focusManager.focusBack();
      expect(store.getState().focusedEventId).toBe('event-1');
    });

    it('supports forward navigation through history', () => {
      focusManager.setFocus('event-1');
      focusManager.setFocus('event-2');
      focusManager.focusBack();

      focusManager.focusForward();
      expect(store.getState().focusedEventId).toBe('event-2');
    });

    it('does nothing when back at start of history', () => {
      focusManager.setFocus('event-1');
      focusManager.focusBack();
      focusManager.focusBack(); // Should be no-op
      expect(store.getState().focusedEventId).toBe('event-1');
    });

    it('does nothing when forward at end of history', () => {
      focusManager.setFocus('event-1');
      focusManager.setFocus('event-2');
      focusManager.focusForward(); // Should be no-op
      expect(store.getState().focusedEventId).toBe('event-2');
    });
  });

  describe('keyboard focus mode', () => {
    it('enables keyboard focus mode', () => {
      focusManager.enableKeyboardFocusMode();
      expect(store.getState().isKeyboardFocusMode).toBe(true);
    });

    it('disables keyboard focus mode', () => {
      focusManager.enableKeyboardFocusMode();
      focusManager.disableKeyboardFocusMode();
      expect(store.getState().isKeyboardFocusMode).toBe(false);
    });

    it('creates focus trap when enabled', () => {
      focusManager.enableKeyboardFocusMode();
      const state = store.getState();
      expect(state.isKeyboardFocusMode).toBe(true);
    });
  });

  describe('integration with keyboard navigation', () => {
    it('focuses next event chronologically', () => {
      focusManager.setFocus('event-1');
      focusManager.focusNext();
      expect(store.getState().focusedEventId).toBe('event-2');
    });

    it('focuses previous event chronologically', () => {
      focusManager.setFocus('event-2');
      focusManager.focusPrevious();
      expect(store.getState().focusedEventId).toBe('event-1');
    });

    it('focuses first event', () => {
      focusManager.setFocus('event-3');
      focusManager.focusFirst();
      expect(store.getState().focusedEventId).toBe('event-1');
    });

    it('focuses last event', () => {
      focusManager.setFocus('event-1');
      focusManager.focusLast();
      expect(store.getState().focusedEventId).toBe('event-3');
    });

    it('wraps to first when focusing next from last event', () => {
      focusManager.setFocus('event-3');
      focusManager.focusNext();
      expect(store.getState().focusedEventId).toBe('event-1');
    });

    it('wraps to last when focusing previous from first event', () => {
      focusManager.setFocus('event-1');
      focusManager.focusPrevious();
      expect(store.getState().focusedEventId).toBe('event-3');
    });

    it('focuses first event if none focused', () => {
      focusManager.focusNext();
      expect(store.getState().focusedEventId).toBe('event-1');
    });
  });

  describe('ARIA announcements', () => {
    it('announces event title when available', () => {
      store.dispatch({
        type: 'SET_EVENTS',
        events: [{ id: 'event-1', start: 100n, end: 200n, title: 'Test Event' }],
      });
      focusManager.setFocus('event-1');
      expect(mockAriaLive.textContent).toContain('Test Event');
    });

    it('announces event ID when title not available', () => {
      focusManager.setFocus('event-1');
      expect(mockAriaLive.textContent).toContain('event-1');
    });

    it('announces position in list', () => {
      focusManager.setFocus('event-2');
      expect(mockAriaLive.textContent).toMatch(/2 of 3/);
    });

    it('clears announcement when focus cleared', () => {
      focusManager.setFocus('event-1');
      focusManager.setFocus(null);
      expect(mockAriaLive.textContent).toBe('');
    });
  });

  describe('error handling', () => {
    it('handles focus on non-existent event ID', () => {
      focusManager.setFocus('non-existent');
      // Should not throw, focus might be cleared or kept
      expect(() => focusManager.getFocus()).not.toThrow();
    });

    it('handles findNearestEvent with invalid time', () => {
      expect(() => focusManager.findNearestEvent(null)).not.toThrow();
    });
  });
});
