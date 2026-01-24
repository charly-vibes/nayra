import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { YEAR } from '../../src/core/time.js';
import { RationalScale } from '../../src/core/scale.js';
import { initInput } from '../../src/interaction/input.js';
import { createStore } from '../../src/core/store.js';

function createMockCanvas() {
  const listeners = {};
  return {
    addEventListener: vi.fn((type, handler) => {
      listeners[type] = listeners[type] || [];
      listeners[type].push(handler);
    }),
    removeEventListener: vi.fn((type, handler) => {
      if (listeners[type]) {
        listeners[type] = listeners[type].filter((h) => h !== handler);
      }
    }),
    getBoundingClientRect: vi.fn(() => ({
      left: 0,
      top: 0,
      width: 800,
      height: 400,
    })),
    style: { cursor: '' },
    _listeners: listeners,
    dispatchEvent(type, eventInit) {
      const handlers = listeners[type] || [];
      handlers.forEach((h) => h(eventInit));
    },
  };
}

function createMockEvent(x, y, options = {}) {
  return {
    clientX: x,
    clientY: y,
    button: options.button ?? 0,
    buttons: options.buttons ?? 0,
    ctrlKey: options.ctrlKey ?? false,
    metaKey: options.metaKey ?? false,
    preventDefault: vi.fn(),
  };
}

describe('Input', () => {
  describe('jumpToToday', () => {
    it('calculates viewport start to center current time on screen', async () => {
      const { jumpToToday } = await import('../../src/interaction/input.js');

      const now = BigInt(Math.floor(Date.now() / 1000));
      const canvasWidth = 800;
      const defaultScale = RationalScale.fromSecondsPerPixel(Number(YEAR));

      const result = jumpToToday(canvasWidth, defaultScale);

      const halfWidthTime = defaultScale.pxToTime(canvasWidth / 2);
      const expectedStart = now - halfWidthTime;

      // Allow 1 second tolerance for test execution time
      const diff = result.viewportStart - expectedStart;
      expect(diff >= -1n && diff <= 1n).toBe(true);
    });

    it('returns the default scale', async () => {
      const { jumpToToday, DEFAULT_SCALE } = await import('../../src/interaction/input.js');

      const canvasWidth = 800;

      const result = jumpToToday(canvasWidth, DEFAULT_SCALE);

      expect(result.scale).toBe(DEFAULT_SCALE);
    });
  });

  describe('keyboard shortcuts', () => {
    it('Home key triggers jump to today', async () => {
      const { KEYBOARD_SHORTCUTS } = await import('../../src/interaction/input.js');

      expect(KEYBOARD_SHORTCUTS.Home).toBe('jumpToToday');
    });

    it('h key triggers jump to today', async () => {
      const { KEYBOARD_SHORTCUTS } = await import('../../src/interaction/input.js');

      expect(KEYBOARD_SHORTCUTS.h).toBe('jumpToToday');
    });

    it('/ key triggers search', async () => {
      const { KEYBOARD_SHORTCUTS } = await import('../../src/interaction/input.js');

      expect(KEYBOARD_SHORTCUTS['/']).toBe('openSearch');
    });
  });

  describe('selection and hover', () => {
    let canvas;
    let store;
    let destroy;
    let documentListeners;

    beforeEach(() => {
      documentListeners = {};
      globalThis.document = {
        addEventListener: vi.fn((type, handler) => {
          documentListeners[type] = documentListeners[type] || [];
          documentListeners[type].push(handler);
        }),
        removeEventListener: vi.fn((type, handler) => {
          if (documentListeners[type]) {
            documentListeners[type] = documentListeners[type].filter((h) => h !== handler);
          }
        }),
      };
      canvas = createMockCanvas();
      const now = BigInt(Math.floor(Date.now() / 1000));
      store = createStore({
        viewportStart: now,
        scale: RationalScale.fromSecondsPerPixel(1),
        canvasWidth: 800,
        canvasHeight: 400,
        events: [
          { id: 'evt-1', title: 'Event 1', start: now + 100n },
          { id: 'evt-2', title: 'Event 2', start: now + 200n },
        ],
      });
      destroy = initInput(canvas, store);
    });

    afterEach(() => {
      if (destroy) destroy();
      delete globalThis.document;
    });

    it('click on event dispatches SELECT_EVENT', () => {
      const state = store.getState();
      const eventX = 100;
      const eventY = 200;

      canvas.dispatchEvent('mousedown', createMockEvent(eventX, eventY, { buttons: 1 }));
      canvas.dispatchEvent('mouseup', createMockEvent(eventX, eventY));

      const newState = store.getState();
      expect(newState.selectedEventIds.has('evt-1')).toBe(true);
      expect(newState.selectedEventIds.size).toBe(1);
    });

    it('Ctrl+click dispatches TOGGLE_EVENT_SELECTION', () => {
      store.dispatch({ type: 'SELECT_EVENT', eventId: 'evt-1' });

      const eventX = 200;
      const eventY = 200;

      canvas.dispatchEvent('mousedown', createMockEvent(eventX, eventY, { buttons: 1 }));
      canvas.dispatchEvent(
        'mouseup',
        createMockEvent(eventX, eventY, { ctrlKey: true })
      );

      const newState = store.getState();
      expect(newState.selectedEventIds.has('evt-1')).toBe(true);
      expect(newState.selectedEventIds.has('evt-2')).toBe(true);
      expect(newState.selectedEventIds.size).toBe(2);
    });

    it('click on background dispatches CLEAR_SELECTION', () => {
      store.dispatch({ type: 'SELECT_EVENT', eventId: 'evt-1' });
      expect(store.getState().selectedEventIds.size).toBe(1);

      const bgX = 500;
      const bgY = 200;

      canvas.dispatchEvent('mousedown', createMockEvent(bgX, bgY, { buttons: 1 }));
      canvas.dispatchEvent('mouseup', createMockEvent(bgX, bgY));

      const newState = store.getState();
      expect(newState.selectedEventIds.size).toBe(0);
    });

    it('mousemove over event dispatches SET_HOVER', () => {
      const eventX = 100;
      const eventY = 200;

      canvas.dispatchEvent('mousemove', createMockEvent(eventX, eventY));

      const newState = store.getState();
      expect(newState.hoveredEventId).toBe('evt-1');
    });

    it('mousemove off event dispatches SET_HOVER with null', () => {
      store.dispatch({ type: 'SET_HOVER', eventId: 'evt-1' });
      expect(store.getState().hoveredEventId).toBe('evt-1');

      const bgX = 500;
      const bgY = 200;

      canvas.dispatchEvent('mousemove', createMockEvent(bgX, bgY));

      const newState = store.getState();
      expect(newState.hoveredEventId).toBe(null);
    });

    it('mouseleave clears hover state', () => {
      store.dispatch({ type: 'SET_HOVER', eventId: 'evt-1' });
      expect(store.getState().hoveredEventId).toBe('evt-1');

      canvas.dispatchEvent('mouseleave', createMockEvent(0, 0));

      const newState = store.getState();
      expect(newState.hoveredEventId).toBe(null);
    });

    it('drag does not trigger selection', () => {
      const startX = 100;
      const startY = 200;

      canvas.dispatchEvent('mousedown', createMockEvent(startX, startY, { buttons: 1 }));
      canvas.dispatchEvent('mousemove', createMockEvent(startX + 50, startY, { buttons: 1 }));
      canvas.dispatchEvent('mouseup', createMockEvent(startX + 50, startY));

      const newState = store.getState();
      expect(newState.selectedEventIds.size).toBe(0);
    });

    it('cursor changes to pointer when hovering over event', () => {
      const eventX = 100;
      const eventY = 200;

      canvas.dispatchEvent('mousemove', createMockEvent(eventX, eventY));

      expect(canvas.style.cursor).toBe('pointer');
    });

    it('cursor changes to grab when not hovering over event', () => {
      canvas.style.cursor = 'pointer';
      const bgX = 500;
      const bgY = 200;

      canvas.dispatchEvent('mousemove', createMockEvent(bgX, bgY));

      expect(canvas.style.cursor).toBe('grab');
    });
  });
});
