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
    setPointerCapture: vi.fn(),
    releasePointerCapture: vi.fn(),
    style: { cursor: '' },
    _listeners: listeners,
    dispatchEvent(type, eventInit) {
      const handlers = listeners[type] || [];
      handlers.forEach((h) => h(eventInit));
    },
  };
}

function createMockPointerEvent(x, y, options = {}) {
  return {
    clientX: x,
    clientY: y,
    pointerId: options.pointerId ?? 1,
    pointerType: options.pointerType ?? 'mouse',
    button: options.button ?? 0,
    buttons: options.buttons ?? 0,
    ctrlKey: options.ctrlKey ?? false,
    metaKey: options.metaKey ?? false,
    timeStamp: options.timeStamp ?? 0,
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
    let originalWindow;

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
      originalWindow = globalThis.window;
      globalThis.window = {
        matchMedia: vi.fn(() => ({ matches: false })),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      if (!globalThis.requestAnimationFrame) {
        globalThis.requestAnimationFrame = (cb) => {
          cb();
          return 1;
        };
      }
      if (!globalThis.cancelAnimationFrame) {
        globalThis.cancelAnimationFrame = () => {};
      }
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
      globalThis.window = originalWindow;
    });

    it('tap on event dispatches SELECT_EVENT', () => {
      const eventX = 100;
      const eventY = 200;

      canvas.dispatchEvent('pointerdown', createMockPointerEvent(eventX, eventY, { buttons: 1, timeStamp: 10 }));
      canvas.dispatchEvent('pointerup', createMockPointerEvent(eventX, eventY, { timeStamp: 20 }));

      const newState = store.getState();
      expect(newState.selectedEventIds.has('evt-1')).toBe(true);
      expect(newState.selectedEventIds.size).toBe(1);
    });

    it('Ctrl+tap dispatches TOGGLE_EVENT_SELECTION', () => {
      store.dispatch({ type: 'SELECT_EVENT', eventId: 'evt-1' });

      const eventX = 200;
      const eventY = 200;

      canvas.dispatchEvent('pointerdown', createMockPointerEvent(eventX, eventY, { buttons: 1, timeStamp: 10 }));
      canvas.dispatchEvent(
        'pointerup',
        createMockPointerEvent(eventX, eventY, { ctrlKey: true, timeStamp: 20 })
      );

      const newState = store.getState();
      expect(newState.selectedEventIds.has('evt-1')).toBe(true);
      expect(newState.selectedEventIds.has('evt-2')).toBe(true);
      expect(newState.selectedEventIds.size).toBe(2);
    });

    it('tap on background dispatches CLEAR_SELECTION', () => {
      store.dispatch({ type: 'SELECT_EVENT', eventId: 'evt-1' });
      expect(store.getState().selectedEventIds.size).toBe(1);

      const bgX = 500;
      const bgY = 200;

      canvas.dispatchEvent('pointerdown', createMockPointerEvent(bgX, bgY, { buttons: 1, timeStamp: 10 }));
      canvas.dispatchEvent('pointerup', createMockPointerEvent(bgX, bgY, { timeStamp: 20 }));

      const newState = store.getState();
      expect(newState.selectedEventIds.size).toBe(0);
    });

    it('pointermove over event dispatches SET_HOVER', () => {
      const eventX = 100;
      const eventY = 200;

      canvas.dispatchEvent('pointermove', createMockPointerEvent(eventX, eventY, { timeStamp: 10 }));

      const newState = store.getState();
      expect(newState.hoveredEventId).toBe('evt-1');
    });

    it('pointermove off event dispatches SET_HOVER with null', () => {
      store.dispatch({ type: 'SET_HOVER', eventId: 'evt-1' });
      expect(store.getState().hoveredEventId).toBe('evt-1');

      const bgX = 500;
      const bgY = 200;

      canvas.dispatchEvent('pointermove', createMockPointerEvent(bgX, bgY, { timeStamp: 10 }));

      const newState = store.getState();
      expect(newState.hoveredEventId).toBe(null);
    });

    it('pointerleave clears hover state', () => {
      store.dispatch({ type: 'SET_HOVER', eventId: 'evt-1' });
      expect(store.getState().hoveredEventId).toBe('evt-1');

      canvas.dispatchEvent('pointerleave', createMockPointerEvent(0, 0, { timeStamp: 10 }));

      const newState = store.getState();
      expect(newState.hoveredEventId).toBe(null);
    });

    it('pointercancel clears hover and drag state', () => {
      store.dispatch({ type: 'SET_HOVER', eventId: 'evt-1' });
      canvas.dispatchEvent('pointerdown', createMockPointerEvent(100, 200, { buttons: 1, timeStamp: 10 }));

      canvas.dispatchEvent('pointercancel', createMockPointerEvent(0, 0, { timeStamp: 20 }));

      const newState = store.getState();
      expect(newState.hoveredEventId).toBe(null);
    });

    it('drag does not trigger selection', () => {
      const startX = 100;
      const startY = 200;

      canvas.dispatchEvent('pointerdown', createMockPointerEvent(startX, startY, { buttons: 1, timeStamp: 10 }));
      canvas.dispatchEvent('pointermove', createMockPointerEvent(startX + 50, startY, { buttons: 1, timeStamp: 20 }));
      canvas.dispatchEvent('pointerup', createMockPointerEvent(startX + 50, startY, { timeStamp: 30 }));

      const newState = store.getState();
      expect(newState.selectedEventIds.size).toBe(0);
    });

    it('cursor changes to pointer when hovering over event', () => {
      const eventX = 100;
      const eventY = 200;

      canvas.dispatchEvent('pointermove', createMockPointerEvent(eventX, eventY, { timeStamp: 10 }));

      expect(canvas.style.cursor).toBe('pointer');
    });

    it('cursor changes to grab when not hovering over event', () => {
      canvas.style.cursor = 'pointer';
      const bgX = 500;
      const bgY = 200;

      canvas.dispatchEvent('pointermove', createMockPointerEvent(bgX, bgY, { timeStamp: 10 }));

      expect(canvas.style.cursor).toBe('grab');
    });

    it('calls setPointerCapture on pointerdown', () => {
      canvas.dispatchEvent('pointerdown', createMockPointerEvent(100, 200, { pointerId: 42, buttons: 1, timeStamp: 10 }));

      expect(canvas.setPointerCapture).toHaveBeenCalledWith(42);
    });

    it('sets touch-action to none for gesture support', () => {
      expect(canvas.style.touchAction).toBe('none');
    });

    it('pinch-to-zoom changes scale via two pointers', () => {
      const initialState = store.getState();
      const initialSpp = initialState.scale.getSecondsPerPixel();

      canvas.dispatchEvent('pointerdown', createMockPointerEvent(100, 200, {
        pointerId: 1, buttons: 1, pointerType: 'touch', timeStamp: 10,
      }));
      canvas.dispatchEvent('pointerdown', createMockPointerEvent(200, 200, {
        pointerId: 2, buttons: 1, pointerType: 'touch', timeStamp: 20,
      }));

      canvas.dispatchEvent('pointermove', createMockPointerEvent(50, 200, {
        pointerId: 1, buttons: 1, pointerType: 'touch', timeStamp: 30,
      }));
      canvas.dispatchEvent('pointermove', createMockPointerEvent(250, 200, {
        pointerId: 2, buttons: 1, pointerType: 'touch', timeStamp: 30,
      }));

      const newState = store.getState();
      const newSpp = newState.scale.getSecondsPerPixel();
      expect(newSpp).toBeLessThan(initialSpp);
    });

    it('pinch-to-zoom does not trigger selection', () => {
      canvas.dispatchEvent('pointerdown', createMockPointerEvent(100, 200, {
        pointerId: 1, buttons: 1, pointerType: 'touch', timeStamp: 10,
      }));
      canvas.dispatchEvent('pointerdown', createMockPointerEvent(200, 200, {
        pointerId: 2, buttons: 1, pointerType: 'touch', timeStamp: 20,
      }));
      canvas.dispatchEvent('pointerup', createMockPointerEvent(200, 200, {
        pointerId: 2, pointerType: 'touch', timeStamp: 30,
      }));
      canvas.dispatchEvent('pointerup', createMockPointerEvent(100, 200, {
        pointerId: 1, pointerType: 'touch', timeStamp: 40,
      }));

      expect(store.getState().selectedEventIds.size).toBe(0);
    });

    it('double-tap zooms in at the tap location', () => {
      const initialSpp = store.getState().scale.getSecondsPerPixel();
      const eventX = 100;
      const eventY = 200;

      canvas.dispatchEvent('pointerdown', createMockPointerEvent(eventX, eventY, { buttons: 1, timeStamp: 10 }));
      canvas.dispatchEvent('pointerup', createMockPointerEvent(eventX, eventY, { timeStamp: 20 }));
      canvas.dispatchEvent('pointerdown', createMockPointerEvent(eventX + 5, eventY + 5, { buttons: 1, timeStamp: 200 }));
      canvas.dispatchEvent('pointerup', createMockPointerEvent(eventX + 5, eventY + 5, { timeStamp: 220 }));

      const newSpp = store.getState().scale.getSecondsPerPixel();
      expect(newSpp).toBeLessThan(initialSpp);
    });

    it('long press triggers callback and suppresses selection', () => {
      vi.useFakeTimers();
      const onLongPress = vi.fn();
      destroy();
      destroy = initInput(canvas, store, { onLongPress });

      canvas.dispatchEvent('pointerdown', createMockPointerEvent(100, 200, {
        buttons: 1,
        pointerType: 'touch',
        timeStamp: 10,
      }));
      vi.advanceTimersByTime(500);
      canvas.dispatchEvent('pointermove', createMockPointerEvent(100, 200, {
        pointerType: 'touch',
        timeStamp: 510,
      }));
      canvas.dispatchEvent('pointerup', createMockPointerEvent(100, 200, {
        pointerType: 'touch',
        timeStamp: 600,
      }));

      expect(onLongPress).toHaveBeenCalledTimes(1);
      expect(store.getState().selectedEventIds.size).toBe(0);
      vi.useRealTimers();
    });

    it('momentum starts on pointer release', () => {
      const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
        cb();
        return 1;
      });

      canvas.dispatchEvent('pointerdown', createMockPointerEvent(100, 200, { buttons: 1, timeStamp: 10 }));
      canvas.dispatchEvent('pointermove', createMockPointerEvent(200, 200, { buttons: 1, timeStamp: 40 }));
      canvas.dispatchEvent('pointerup', createMockPointerEvent(200, 200, { timeStamp: 70 }));

      expect(rafSpy).toHaveBeenCalled();
      rafSpy.mockRestore();
    });
  });

  describe('keyboard navigation', () => {
    let canvas;
    let store;
    let mockFocusManager;
    let documentListeners;
    let mockDocument;
    let originalDocument;

    beforeEach(() => {
      canvas = createMockCanvas();
      store = createStore({
        events: [
          { id: 'event-1', start: 100n, end: 200n },
          { id: 'event-2', start: 300n, end: 400n },
          { id: 'event-3', start: 500n, end: 600n },
        ],
      });

      // Mock focus manager
      mockFocusManager = {
        focusNext: vi.fn(),
        focusPrevious: vi.fn(),
        setFocus: vi.fn(),
        getFocus: vi.fn(() => null),
      };

      // Mock document and window
      documentListeners = {};
      originalDocument = globalThis.document;
      mockDocument = {
        addEventListener: vi.fn((type, handler) => {
          documentListeners[type] = documentListeners[type] || [];
          documentListeners[type].push(handler);
        }),
        removeEventListener: vi.fn(),
      };
      globalThis.document = mockDocument;
      globalThis.window = globalThis.window || {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        matchMedia: vi.fn(() => ({ matches: false })),
      };

      initInput(canvas, store, {}, mockFocusManager);
    });

    afterEach(() => {
      globalThis.document = originalDocument;
    });

    function triggerKeyDown(key, options = {}) {
      const event = {
        key,
        shiftKey: options.shiftKey ?? false,
        ctrlKey: options.ctrlKey ?? false,
        metaKey: options.metaKey ?? false,
        preventDefault: vi.fn(),
        ...options,
      };
      const handlers = documentListeners.keydown || [];
      handlers.forEach((h) => h(event));
      return event;
    }

    it('Tab key calls focusNext', () => {
      triggerKeyDown('Tab');
      expect(mockFocusManager.focusNext).toHaveBeenCalledTimes(1);
    });

    it('Tab key prevents default behavior', () => {
      const event = triggerKeyDown('Tab');
      expect(event.preventDefault).toHaveBeenCalledTimes(1);
    });

    it('Shift+Tab calls focusPrevious', () => {
      triggerKeyDown('Tab', { shiftKey: true });
      expect(mockFocusManager.focusPrevious).toHaveBeenCalledTimes(1);
    });

    it('Shift+Tab prevents default behavior', () => {
      const event = triggerKeyDown('Tab', { shiftKey: true });
      expect(event.preventDefault).toHaveBeenCalledTimes(1);
    });

    it('does not interfere with other keys', () => {
      triggerKeyDown('a');
      expect(mockFocusManager.focusNext).not.toHaveBeenCalled();
      expect(mockFocusManager.focusPrevious).not.toHaveBeenCalled();
    });

    it('Home key is not affected by Tab handler', () => {
      const event = triggerKeyDown('Home');
      // Home key should still work for jumpToToday, not call focus methods
      expect(mockFocusManager.focusNext).not.toHaveBeenCalled();
      expect(mockFocusManager.focusPrevious).not.toHaveBeenCalled();
    });
  });
});
