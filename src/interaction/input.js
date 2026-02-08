import { RationalScale } from '../core/scale.js';
import { YEAR } from '../core/time.js';
import { findEventAtPoint } from './hit-detection.js';
import { GestureRecognizer } from './gestures.js';

const MIN_SECONDS_PER_PIXEL = 0.001;
const CLICK_THRESHOLD = 3;
const MAX_SECONDS_PER_PIXEL = 1e15;
const ZOOM_FACTOR = 1.15;

export const DEFAULT_SCALE = RationalScale.fromSecondsPerPixel(Number(YEAR));

export const KEYBOARD_SHORTCUTS = {
  Home: 'jumpToToday',
  h: 'jumpToToday',
  '/': 'openSearch',
  '?': 'toggleHelp',
};

export function jumpToToday(canvasWidth, scale = DEFAULT_SCALE) {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const halfWidthTime = scale.pxToTime(canvasWidth / 2);
  const viewportStart = now - halfWidthTime;
  return { viewportStart, scale };
}

export function initInput(canvas, store, callbacks = {}) {
  let isDragging = false;
  let lastX = 0;
  let dragStartX = 0;
  let dragStartY = 0;
  const gestures = new GestureRecognizer();
  let pinchStartDistance = null;
  let pinchStartSpp = null;
  let wasPinchGesture = false;

  function onPointerDown(e) {
    if (e.button !== 0) return;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // InvalidStateError can occur if element is not in DOM
    }

    gestures.addPointer(e.pointerId, e.clientX, e.clientY, e.timeStamp);

    if (gestures.pointerCount === 2) {
      isDragging = false;
      wasPinchGesture = true;
      const pinch = gestures.getPinchState();
      pinchStartDistance = pinch.distance;
      pinchStartSpp = store.getState().scale.getSecondsPerPixel();
      return;
    }

    isDragging = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    lastX = e.clientX;
  }

  function onPointerMove(e) {
    gestures.updatePointer(e.pointerId, e.clientX, e.clientY, e.timeStamp);

    if (gestures.pointerCount === 2 && pinchStartDistance !== null) {
      const pinch = gestures.getPinchState();
      const ratio = pinch.distance / pinchStartDistance;
      if (ratio === 0) return;

      let newSpp = pinchStartSpp / ratio;
      newSpp = Math.max(MIN_SECONDS_PER_PIXEL, Math.min(MAX_SECONDS_PER_PIXEL, newSpp));

      const rect = canvas.getBoundingClientRect();
      const midX = pinch.midpointX - rect.left;
      const state = store.getState();
      const anchor = state.viewportStart + state.scale.pxToTime(midX);
      const newScale = RationalScale.fromSecondsPerPixel(newSpp);
      const newStart = anchor - newScale.pxToTime(midX);

      store.dispatch({ type: 'SET_VIEWPORT', viewportStart: newStart, scale: newScale });
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const state = store.getState();

    if (!isDragging && e.buttons !== 1) {
      const event = findEventAtPoint(
        x,
        y,
        state.events,
        state.viewportStart,
        state.scale,
        rect.height
      );
      const eventId = event ? event.id : null;
      if (eventId !== state.hoveredEventId) {
        store.dispatch({ type: 'SET_HOVER', eventId });
      }
      canvas.style.cursor = event ? 'pointer' : 'grab';
      
      if (callbacks.onMousePosition) {
        callbacks.onMousePosition(e.clientX, e.clientY);
      }
    }

    if (e.buttons === 1 && gestures.pointerCount === 1) {
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      if (Math.abs(dx) > CLICK_THRESHOLD || Math.abs(dy) > CLICK_THRESHOLD) {
        isDragging = true;
        canvas.style.cursor = 'grabbing';
      }
      if (isDragging) {
        const delta = e.clientX - lastX;
        if (delta !== 0) {
          store.dispatch({ type: 'PAN', offset: state.scale.pxToTime(-delta) });
          lastX = e.clientX;
        }
      }
    }
  }

  function onPointerUp(e) {
    const wasPinching = gestures.pointerCount === 2;
    gestures.removePointer(e.pointerId);

    if (wasPinching) {
      pinchStartDistance = null;
      pinchStartSpp = null;
      if (gestures.pointerCount === 1) {
        const remaining = [...gestures._pointers.values()][0];
        lastX = remaining.x;
        dragStartX = remaining.x;
        dragStartY = remaining.y;
        isDragging = false;
      }
      return;
    }

    if (wasPinchGesture) {
      wasPinchGesture = false;
      isDragging = false;
      canvas.style.cursor = 'grab';
      return;
    }

    if (!isDragging) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const state = store.getState();
      const event = findEventAtPoint(
        x,
        y,
        state.events,
        state.viewportStart,
        state.scale,
        rect.height
      );

      if (event) {
        if (e.ctrlKey || e.metaKey) {
          store.dispatch({ type: 'TOGGLE_EVENT_SELECTION', eventId: event.id });
        } else {
          store.dispatch({ type: 'SELECT_EVENT', eventId: event.id });
        }
      } else {
        store.dispatch({ type: 'CLEAR_SELECTION' });
      }
    }
    isDragging = false;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const state = store.getState();
    const event = findEventAtPoint(
      x,
      y,
      state.events,
      state.viewportStart,
      state.scale,
      rect.height
    );
    canvas.style.cursor = event ? 'pointer' : 'grab';
  }

  function onPointerLeave() {
    if (isDragging) {
      isDragging = false;
    }
    const state = store.getState();
    if (state.hoveredEventId !== null) {
      store.dispatch({ type: 'SET_HOVER', eventId: null });
    }
    canvas.style.cursor = 'grab';
  }

  function onPointerCancel(e) {
    gestures.removePointer(e.pointerId);
    if (gestures.pointerCount < 2) {
      pinchStartDistance = null;
      pinchStartSpp = null;
    }
    isDragging = false;
    const state = store.getState();
    if (state.hoveredEventId !== null) {
      store.dispatch({ type: 'SET_HOVER', eventId: null });
    }
    canvas.style.cursor = 'grab';
  }

  function onWheel(e) {
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const state = store.getState();

    const anchor = state.viewportStart + state.scale.pxToTime(mouseX);

    const zoomIn = e.deltaY < 0;
    const factor = zoomIn ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;

    const currentSpp = state.scale.getSecondsPerPixel();
    let newSpp = currentSpp / factor;
    newSpp = Math.max(MIN_SECONDS_PER_PIXEL, Math.min(MAX_SECONDS_PER_PIXEL, newSpp));

    const newScale = RationalScale.fromSecondsPerPixel(newSpp);

    const newStart = anchor - newScale.pxToTime(mouseX);

    store.dispatch({ type: 'SET_VIEWPORT', viewportStart: newStart, scale: newScale });
  }

  function onKeyDown(e) {
    const action = KEYBOARD_SHORTCUTS[e.key];
    if (action === 'jumpToToday') {
      const state = store.getState();
      const { viewportStart, scale } = jumpToToday(state.canvasWidth);
      store.dispatch({ type: 'SET_VIEWPORT', viewportStart, scale });
    } else if (action === 'openSearch' && callbacks.onOpenSearch) {
      e.preventDefault();
      callbacks.onOpenSearch();
    } else if (action === 'toggleHelp' && callbacks.onToggleHelp) {
      e.preventDefault();
      callbacks.onToggleHelp();
    }
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('pointercancel', onPointerCancel);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  document.addEventListener('keydown', onKeyDown);

  canvas.style.cursor = 'grab';
  canvas.style.touchAction = 'none';

  return function destroy() {
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointerleave', onPointerLeave);
    canvas.removeEventListener('pointercancel', onPointerCancel);
    canvas.removeEventListener('wheel', onWheel);
    document.removeEventListener('keydown', onKeyDown);
  };
}
