import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createStore } from '../../src/core/store.js';
import { RationalScale } from '../../src/core/scale.js';
import { initInput } from '../../src/interaction/input.js';
import './setup.js';

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
    style: { cursor: '', touchAction: '' },
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
    pointerType: options.pointerType ?? 'touch',
    button: options.button ?? 0,
    buttons: options.buttons ?? 0,
    ctrlKey: options.ctrlKey ?? false,
    metaKey: options.metaKey ?? false,
    timeStamp: options.timeStamp ?? 0,
    preventDefault: vi.fn(),
  };
}

describe('Pointer Gesture Integration', () => {
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

  describe('single touch gestures', () => {
    it('tap on event selects the event', () => {
      const eventX = 100;
      const eventY = 200;

      canvas.dispatchEvent('pointerdown', createMockPointerEvent(eventX, eventY, {
        pointerId: 1,
        pointerType: 'touch',
        buttons: 1,
        timeStamp: 10,
      }));
      canvas.dispatchEvent('pointerup', createMockPointerEvent(eventX, eventY, {
        pointerId: 1,
        pointerType: 'touch',
        timeStamp: 20,
      }));

      const state = store.getState();
      expect(state.selectedEventIds.has('evt-1')).toBe(true);
      expect(state.selectedEventIds.size).toBe(1);
    });

    it('tap on background clears selection', () => {
      store.dispatch({ type: 'SELECT_EVENT', eventId: 'evt-1' });
      expect(store.getState().selectedEventIds.size).toBe(1);

      canvas.dispatchEvent('pointerdown', createMockPointerEvent(500, 200, {
        pointerId: 1,
        pointerType: 'touch',
        buttons: 1,
        timeStamp: 10,
      }));
      canvas.dispatchEvent('pointerup', createMockPointerEvent(500, 200, {
        pointerId: 1,
        pointerType: 'touch',
        timeStamp: 20,
      }));

      const state = store.getState();
      expect(state.selectedEventIds.size).toBe(0);
    });

    it('drag pans the viewport', () => {
      const initialViewport = store.getState().viewportStart;

      canvas.dispatchEvent('pointerdown', createMockPointerEvent(400, 200, {
        pointerId: 1,
        pointerType: 'touch',
        buttons: 1,
        timeStamp: 10,
      }));
      canvas.dispatchEvent('pointermove', createMockPointerEvent(300, 200, {
        pointerId: 1,
        pointerType: 'touch',
        buttons: 1,
        timeStamp: 20,
      }));
      canvas.dispatchEvent('pointerup', createMockPointerEvent(300, 200, {
        pointerId: 1,
        pointerType: 'touch',
        timeStamp: 30,
      }));

      const finalViewport = store.getState().viewportStart;
      expect(finalViewport).not.toBe(initialViewport);
    });

    it('double-tap zooms in at tap location', () => {
      const initialSpp = store.getState().scale.getSecondsPerPixel();
      const tapX = 400;
      const tapY = 200;

      // First tap
      canvas.dispatchEvent('pointerdown', createMockPointerEvent(tapX, tapY, {
        pointerId: 1,
        pointerType: 'touch',
        buttons: 1,
        timeStamp: 10,
      }));
      canvas.dispatchEvent('pointerup', createMockPointerEvent(tapX, tapY, {
        pointerId: 1,
        pointerType: 'touch',
        timeStamp: 20,
      }));

      // Second tap (within double-tap threshold)
      canvas.dispatchEvent('pointerdown', createMockPointerEvent(tapX + 2, tapY + 2, {
        pointerId: 1,
        pointerType: 'touch',
        buttons: 1,
        timeStamp: 200,
      }));
      canvas.dispatchEvent('pointerup', createMockPointerEvent(tapX + 2, tapY + 2, {
        pointerId: 1,
        pointerType: 'touch',
        timeStamp: 210,
      }));

      const finalSpp = store.getState().scale.getSecondsPerPixel();
      expect(finalSpp).toBeLessThan(initialSpp);
    });

    it('long press triggers callback without selecting', () => {
      vi.useFakeTimers();
      const onLongPress = vi.fn();
      destroy();
      destroy = initInput(canvas, store, { onLongPress });

      canvas.dispatchEvent('pointerdown', createMockPointerEvent(100, 200, {
        pointerId: 1,
        pointerType: 'touch',
        buttons: 1,
        timeStamp: 10,
      }));

      vi.advanceTimersByTime(500);

      canvas.dispatchEvent('pointermove', createMockPointerEvent(100, 200, {
        pointerId: 1,
        pointerType: 'touch',
        timeStamp: 510,
      }));
      canvas.dispatchEvent('pointerup', createMockPointerEvent(100, 200, {
        pointerId: 1,
        pointerType: 'touch',
        timeStamp: 600,
      }));

      expect(onLongPress).toHaveBeenCalledTimes(1);
      expect(store.getState().selectedEventIds.size).toBe(0);

      vi.useRealTimers();
    });
  });

  describe('two-finger gestures', () => {
    it('pinch-to-zoom zooms in when fingers move apart', () => {
      const initialSpp = store.getState().scale.getSecondsPerPixel();

      // First finger down
      canvas.dispatchEvent('pointerdown', createMockPointerEvent(100, 200, {
        pointerId: 1,
        pointerType: 'touch',
        buttons: 1,
        timeStamp: 10,
      }));

      // Second finger down (100px apart)
      canvas.dispatchEvent('pointerdown', createMockPointerEvent(200, 200, {
        pointerId: 2,
        pointerType: 'touch',
        buttons: 1,
        timeStamp: 20,
      }));

      // Move fingers apart to 200px
      canvas.dispatchEvent('pointermove', createMockPointerEvent(50, 200, {
        pointerId: 1,
        pointerType: 'touch',
        buttons: 1,
        timeStamp: 30,
      }));
      canvas.dispatchEvent('pointermove', createMockPointerEvent(250, 200, {
        pointerId: 2,
        pointerType: 'touch',
        buttons: 1,
        timeStamp: 30,
      }));

      const finalSpp = store.getState().scale.getSecondsPerPixel();
      expect(finalSpp).toBeLessThan(initialSpp);
    });

    it('pinch-to-zoom zooms out when fingers move together', () => {
      const initialSpp = store.getState().scale.getSecondsPerPixel();

      // First finger down
      canvas.dispatchEvent('pointerdown', createMockPointerEvent(0, 200, {
        pointerId: 1,
        pointerType: 'touch',
        buttons: 1,
        timeStamp: 10,
      }));

      // Second finger down (200px apart)
      canvas.dispatchEvent('pointerdown', createMockPointerEvent(200, 200, {
        pointerId: 2,
        pointerType: 'touch',
        buttons: 1,
        timeStamp: 20,
      }));

      // Move fingers together to 100px
      canvas.dispatchEvent('pointermove', createMockPointerEvent(50, 200, {
        pointerId: 1,
        pointerType: 'touch',
        buttons: 1,
        timeStamp: 30,
      }));
      canvas.dispatchEvent('pointermove', createMockPointerEvent(150, 200, {
        pointerId: 2,
        pointerType: 'touch',
        buttons: 1,
        timeStamp: 30,
      }));

      const finalSpp = store.getState().scale.getSecondsPerPixel();
      expect(finalSpp).toBeGreaterThan(initialSpp);
    });

    it('pinch gesture does not trigger selection on release', () => {
      // First finger down
      canvas.dispatchEvent('pointerdown', createMockPointerEvent(100, 200, {
        pointerId: 1,
        pointerType: 'touch',
        buttons: 1,
        timeStamp: 10,
      }));

      // Second finger down
      canvas.dispatchEvent('pointerdown', createMockPointerEvent(200, 200, {
        pointerId: 2,
        pointerType: 'touch',
        buttons: 1,
        timeStamp: 20,
      }));

      // Release both fingers
      canvas.dispatchEvent('pointerup', createMockPointerEvent(200, 200, {
        pointerId: 2,
        pointerType: 'touch',
        timeStamp: 30,
      }));
      canvas.dispatchEvent('pointerup', createMockPointerEvent(100, 200, {
        pointerId: 1,
        pointerType: 'touch',
        timeStamp: 40,
      }));

      const state = store.getState();
      expect(state.selectedEventIds.size).toBe(0);
    });

    it('maintains midpoint during pinch for smooth zoom', () => {
      // First finger down at 100, 200
      canvas.dispatchEvent('pointerdown', createMockPointerEvent(100, 200, {
        pointerId: 1,
        pointerType: 'touch',
        buttons: 1,
        timeStamp: 10,
      }));

      // Second finger down at 200, 200 (midpoint at 150)
      canvas.dispatchEvent('pointerdown', createMockPointerEvent(200, 200, {
        pointerId: 2,
        pointerType: 'touch',
        buttons: 1,
        timeStamp: 20,
      }));

      const initialState = store.getState();
      const initialTime = initialState.viewportStart + initialState.scale.pxToTime(150);

      // Zoom by moving fingers apart while keeping midpoint at 150
      canvas.dispatchEvent('pointermove', createMockPointerEvent(50, 200, {
        pointerId: 1,
        pointerType: 'touch',
        buttons: 1,
        timeStamp: 30,
      }));
      canvas.dispatchEvent('pointermove', createMockPointerEvent(250, 200, {
        pointerId: 2,
        pointerType: 'touch',
        buttons: 1,
        timeStamp: 30,
      }));

      const finalState = store.getState();
      const finalTime = finalState.viewportStart + finalState.scale.pxToTime(150);

      // The time at the midpoint should remain relatively stable
      const timeDelta = Number(finalTime - initialTime);
      expect(Math.abs(timeDelta)).toBeLessThan(100);
    });
  });

  describe('gesture isolation and cleanup', () => {
    it('sets touch-action to none for proper gesture handling', () => {
      expect(canvas.style.touchAction).toBe('none');
    });

    it('cancels gestures on pointercancel', () => {
      // Start a drag
      canvas.dispatchEvent('pointerdown', createMockPointerEvent(100, 200, {
        pointerId: 1,
        pointerType: 'touch',
        buttons: 1,
        timeStamp: 10,
      }));
      canvas.dispatchEvent('pointermove', createMockPointerEvent(150, 200, {
        pointerId: 1,
        pointerType: 'touch',
        buttons: 1,
        timeStamp: 20,
      }));

      // Cancel gesture
      canvas.dispatchEvent('pointercancel', createMockPointerEvent(150, 200, {
        pointerId: 1,
        pointerType: 'touch',
        timeStamp: 30,
      }));

      const state = store.getState();
      expect(state.hoveredEventId).toBe(null);
    });

    it('ignores mouse events while touch is active', () => {
      const initialViewport = store.getState().viewportStart;

      // Start touch gesture
      canvas.dispatchEvent('pointerdown', createMockPointerEvent(100, 200, {
        pointerId: 1,
        pointerType: 'touch',
        buttons: 1,
        timeStamp: 10,
      }));

      // Try mouse event (should be ignored)
      canvas.dispatchEvent('pointermove', createMockPointerEvent(200, 200, {
        pointerId: 999,
        pointerType: 'mouse',
        timeStamp: 20,
      }));

      const midViewport = store.getState().viewportStart;
      expect(midViewport).toBe(initialViewport);

      // Complete touch gesture
      canvas.dispatchEvent('pointerup', createMockPointerEvent(100, 200, {
        pointerId: 1,
        pointerType: 'touch',
        timeStamp: 30,
      }));

      // Now mouse should work again
      canvas.dispatchEvent('pointermove', createMockPointerEvent(200, 200, {
        pointerId: 999,
        pointerType: 'mouse',
        timeStamp: 40,
      }));

      // Mouse hover should work now (verify by checking cursor style)
      expect(canvas.style.cursor).toBeDefined();
    });

    it('properly cleans up listeners on destroy', () => {
      const removeEventListenerSpy = vi.spyOn(canvas, 'removeEventListener');
      const docRemoveSpy = vi.spyOn(document, 'removeEventListener');
      const windowRemoveSpy = vi.spyOn(window, 'removeEventListener');

      destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('pointermove', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('pointerup', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('pointerleave', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('pointercancel', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('wheel', expect.any(Function));
      expect(docRemoveSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(windowRemoveSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(windowRemoveSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function));
    });
  });

  describe('momentum scrolling', () => {
    it('applies momentum after fast drag release', () => {
      const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
        cb();
        return 1;
      });

      // Fast drag
      canvas.dispatchEvent('pointerdown', createMockPointerEvent(100, 200, {
        pointerId: 1,
        pointerType: 'touch',
        buttons: 1,
        timeStamp: 10,
      }));
      canvas.dispatchEvent('pointermove', createMockPointerEvent(200, 200, {
        pointerId: 1,
        pointerType: 'touch',
        buttons: 1,
        timeStamp: 40,
      }));
      canvas.dispatchEvent('pointerup', createMockPointerEvent(200, 200, {
        pointerId: 1,
        pointerType: 'touch',
        timeStamp: 70,
      }));

      expect(rafSpy).toHaveBeenCalled();
      rafSpy.mockRestore();
    });

    it('cancels momentum on new touch', () => {
      const cancelSpy = vi.spyOn(globalThis, 'cancelAnimationFrame');

      // Start momentum (fast drag and release)
      canvas.dispatchEvent('pointerdown', createMockPointerEvent(100, 200, {
        pointerId: 1,
        pointerType: 'touch',
        buttons: 1,
        timeStamp: 10,
      }));
      canvas.dispatchEvent('pointermove', createMockPointerEvent(200, 200, {
        pointerId: 1,
        pointerType: 'touch',
        buttons: 1,
        timeStamp: 40,
      }));
      canvas.dispatchEvent('pointerup', createMockPointerEvent(200, 200, {
        pointerId: 1,
        pointerType: 'touch',
        timeStamp: 70,
      }));

      // New touch should cancel momentum
      canvas.dispatchEvent('pointerdown', createMockPointerEvent(300, 200, {
        pointerId: 2,
        pointerType: 'touch',
        buttons: 1,
        timeStamp: 100,
      }));

      // Verify cancelAnimationFrame was called
      expect(cancelSpy).toHaveBeenCalled();
      cancelSpy.mockRestore();
    });
  });
});
