import { RationalScale } from '../core/scale.js';
import { YEAR } from '../core/time.js';
import { findEventAtPoint } from './hit-detection.js';
import { GestureRecognizer } from './gestures.js';

const MIN_SECONDS_PER_PIXEL = 0.001;
const CLICK_THRESHOLD = 3;
const DOUBLE_TAP_MAX_DELAY = 300;
const DOUBLE_TAP_MAX_DISTANCE = 20;
const LONG_PRESS_DELAY = 500;
const LONG_PRESS_MOVE_THRESHOLD = 10;
const MAX_SECONDS_PER_PIXEL = 1e15;
const MOMENTUM_MIN_VELOCITY = 20;
const MOMENTUM_SAMPLE_WINDOW_MS = 100;
const MOMENTUM_THRESHOLD = 5;
const MOMENTUM_FRICTION = 0.95;
const MOMENTUM_MAX_SAMPLES = 5;
const ZOOM_FACTOR = 1.15;

export const DEFAULT_SCALE = RationalScale.fromSecondsPerPixel(Number(YEAR));

export const KEYBOARD_SHORTCUTS = {
  Home: 'jumpToFirst',
  End: 'jumpToLast',
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

export function initInput(canvas, store, callbacks = {}, focusManager = null) {
  let isDragging = false;
  let lastX = 0;
  let dragStartX = 0;
  let dragStartY = 0;
  const gestures = new GestureRecognizer();
  const pointerSamples = new Map();
  let pinchStartDistance = null;
  let pinchStartSpp = null;
  let wasPinchGesture = false;
  let lastTapTime = 0;
  let lastTapX = 0;
  let lastTapY = 0;
  let longPressTimer = null;
  let longPressPointerId = null;
  let momentumRaf = null;
  let hasActiveTouch = false;
  let isLongPressActive = false;

  function cancelMomentum() {
    if (momentumRaf !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(momentumRaf);
      momentumRaf = null;
    } else if (momentumRaf !== null) {
      momentumRaf = null;
    }
  }

  function clearLongPress() {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    longPressPointerId = null;
    isLongPressActive = false;
  }

  function resetGestures() {
    cancelMomentum();
    clearLongPress();
    gestures.reset();
    pointerSamples.clear();
    pinchStartDistance = null;
    pinchStartSpp = null;
    wasPinchGesture = false;
    isDragging = false;
    hasActiveTouch = false;
    const state = store.getState();
    if (state.hoveredEventId !== null) {
      store.dispatch({ type: 'SET_HOVER', eventId: null });
    }
    canvas.style.cursor = 'grab';
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function recordSample(pointerId, x, timestamp) {
    let samples = pointerSamples.get(pointerId);
    if (!samples) {
      samples = [];
      pointerSamples.set(pointerId, samples);
    }
    samples.push({ x, timestamp });
    if (samples.length > MOMENTUM_MAX_SAMPLES) {
      samples.shift();
    }
    const cutoff = timestamp - MOMENTUM_SAMPLE_WINDOW_MS;
    while (samples.length > 2 && samples[0].timestamp < cutoff) {
      samples.shift();
    }
  }

  function computeVelocity(pointerId) {
    const samples = pointerSamples.get(pointerId);
    if (!samples || samples.length < 2) return 0;
    const first = samples[0];
    const last = samples[samples.length - 1];
    const dt = last.timestamp - first.timestamp;
    if (dt <= 0) return 0;
    return ((last.x - first.x) / dt) * 1000;
  }

  function startMomentum(initialVelocity) {
    if (typeof requestAnimationFrame !== 'function') {
      return;
    }
    if (prefersReducedMotion() || Math.abs(initialVelocity) < MOMENTUM_MIN_VELOCITY) {
      return;
    }
    cancelMomentum();
    let velocity = initialVelocity;

    const step = () => {
      if (Math.abs(velocity) < MOMENTUM_THRESHOLD) {
        momentumRaf = null;
        return;
      }
      const state = store.getState();
      const delta = velocity / 60;
      store.dispatch({ type: 'PAN', offset: state.scale.pxToTime(-delta) });
      velocity *= MOMENTUM_FRICTION;
      momentumRaf = requestAnimationFrame(step);
    };

    momentumRaf = requestAnimationFrame(step);
  }

  function applyZoomAtPosition(clientX, rect, zoomIn) {
    const mouseX = clientX - rect.left;
    const state = store.getState();
    const anchor = state.viewportStart + state.scale.pxToTime(mouseX);
    const factor = zoomIn ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
    const currentSpp = state.scale.getSecondsPerPixel();
    let newSpp = currentSpp / factor;
    newSpp = Math.max(MIN_SECONDS_PER_PIXEL, Math.min(MAX_SECONDS_PER_PIXEL, newSpp));
    const newScale = RationalScale.fromSecondsPerPixel(newSpp);
    const newStart = anchor - newScale.pxToTime(mouseX);
    store.dispatch({ type: 'SET_VIEWPORT', viewportStart: newStart, scale: newScale });
  }

  function onPointerDown(e) {
    if (e.button !== 0) return;
    if (hasActiveTouch && e.pointerType === 'mouse') return;
    cancelMomentum();
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // InvalidStateError can occur if element is not in DOM
    }

    if (!gestures.addPointer(e.pointerId, e.clientX, e.clientY, e.timeStamp)) {
      return;
    }
    pointerSamples.delete(e.pointerId);
    recordSample(e.pointerId, e.clientX, e.timeStamp);
    if (e.pointerType === 'touch') {
      hasActiveTouch = true;
    }

    if (gestures.pointerCount === 1 && e.pointerType === 'touch') {
      clearLongPress();
      longPressPointerId = e.pointerId;
      isLongPressActive = false;
      longPressTimer = setTimeout(() => {
        if (gestures.pointerCount === 1 && gestures.hasPointer(longPressPointerId)) {
          isLongPressActive = true;
          if (callbacks.onLongPress) {
            const rect = canvas.getBoundingClientRect();
            const pointer = gestures.getPointer(longPressPointerId);
            const x = pointer.x - rect.left;
            const y = pointer.y - rect.top;
            callbacks.onLongPress({ x, y, pointerType: e.pointerType });
          }
        }
      }, LONG_PRESS_DELAY);
    }

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
    if (hasActiveTouch && e.pointerType === 'mouse') return;
    const hasPointer = gestures.hasPointer(e.pointerId);
    if (hasPointer) {
      if (!gestures.updatePointer(e.pointerId, e.clientX, e.clientY, e.timeStamp)) {
        return;
      }
      recordSample(e.pointerId, e.clientX, e.timeStamp);
    } else if (e.pointerType !== 'mouse') {
      return;
    }

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

    if (!isDragging && e.buttons !== 1 && !hasActiveTouch) {
      const event = findEventAtPoint(
        x,
        y,
        state.events,
        state.viewportStart,
        state.scale,
        rect.height
      );
      // Don't hover on clusters, only on regular events
      const eventId = (event && !event.__cluster) ? event.id : null;
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
      if (longPressPointerId === e.pointerId &&
        (Math.abs(dx) > LONG_PRESS_MOVE_THRESHOLD || Math.abs(dy) > LONG_PRESS_MOVE_THRESHOLD)) {
        clearLongPress();
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
    if (!gestures.hasPointer(e.pointerId)) {
      return;
    }
    const wasLongPressActive = isLongPressActive;
    const wasPinching = gestures.pointerCount === 2;
    const velocity = computeVelocity(e.pointerId);
    gestures.removePointer(e.pointerId);
    pointerSamples.delete(e.pointerId);
    if (longPressPointerId === e.pointerId) {
      clearLongPress();
    }

    if (wasPinching) {
      pinchStartDistance = null;
      pinchStartSpp = null;
      if (gestures.pointerCount === 1) {
        const remaining = gestures.getAnyPointer();
        if (remaining) {
          lastX = remaining.x;
          dragStartX = remaining.x;
          dragStartY = remaining.y;
        }
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

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!isDragging && !wasLongPressActive) {
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
        // Check if this is a cluster click
        if (event.__cluster) {
          // Zoom to show the cluster's events
          const clusterTimeRange = event.maxTime - event.minTime;
          const padding = clusterTimeRange / 4n; // Add 25% padding on each side
          const targetStart = event.minTime - padding;
          const targetEnd = event.maxTime + padding;
          const targetRange = targetEnd - targetStart;

          // Calculate new scale to fit the cluster in view
          const newSpp = Number(targetRange) / rect.width;
          const newScale = RationalScale.fromSecondsPerPixel(newSpp);

          // Center the cluster in view
          store.dispatch({ type: 'SET_VIEWPORT', viewportStart: targetStart, scale: newScale });
        } else {
          // Regular event click
          if (e.ctrlKey || e.metaKey) {
            store.dispatch({ type: 'TOGGLE_EVENT_SELECTION', eventId: event.id });
          } else {
            store.dispatch({ type: 'SELECT_EVENT', eventId: event.id });
          }
        }
      } else {
        store.dispatch({ type: 'CLEAR_SELECTION' });
      }

      const now = e.timeStamp || performance.now();
      const dx = x - lastTapX;
      const dy = y - lastTapY;
      if (now - lastTapTime <= DOUBLE_TAP_MAX_DELAY &&
        Math.hypot(dx, dy) <= DOUBLE_TAP_MAX_DISTANCE) {
        applyZoomAtPosition(e.clientX, rect, true);
        lastTapTime = 0;
      } else {
        lastTapTime = now;
        lastTapX = x;
        lastTapY = y;
      }
    }
    isDragging = false;
    if (gestures.pointerCount === 0) {
      if (hasActiveTouch && e.pointerType === 'touch') {
        hasActiveTouch = false;
      }
      if (hasActiveTouch) {
        return;
      }
      const state = store.getState();
      const hitResult = findEventAtPoint(
        x,
        y,
        state.events,
        state.viewportStart,
        state.scale,
        rect.height
      );
      canvas.style.cursor = hitResult ? 'pointer' : 'grab';
      startMomentum(velocity);
    }
  }

  function onPointerLeave() {
    if (isDragging) {
      isDragging = false;
    }
    clearLongPress();
    if (!hasActiveTouch) {
      const state = store.getState();
      if (state.hoveredEventId !== null) {
        store.dispatch({ type: 'SET_HOVER', eventId: null });
      }
      canvas.style.cursor = 'grab';
    }
  }

  function onPointerCancel(e) {
    if (!gestures.hasPointer(e.pointerId)) {
      return;
    }
    gestures.removePointer(e.pointerId);
    pointerSamples.delete(e.pointerId);
    clearLongPress();
    if (gestures.pointerCount < 2) {
      pinchStartDistance = null;
      pinchStartSpp = null;
    }
    isDragging = false;
    if (!hasActiveTouch) {
      const state = store.getState();
      if (state.hoveredEventId !== null) {
        store.dispatch({ type: 'SET_HOVER', eventId: null });
      }
      canvas.style.cursor = 'grab';
    }
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
    // Handle Tab navigation for keyboard focus
    if (e.key === 'Tab' && focusManager) {
      e.preventDefault();
      if (e.shiftKey) {
        focusManager.focusPrevious();
      } else {
        focusManager.focusNext();
      }
      return;
    }

    const action = KEYBOARD_SHORTCUTS[e.key];
    if (action === 'jumpToToday') {
      const state = store.getState();
      const { viewportStart, scale } = jumpToToday(state.canvasWidth);
      store.dispatch({ type: 'SET_VIEWPORT', viewportStart, scale });
    } else if (action === 'jumpToFirst' && focusManager) {
      e.preventDefault();
      const state = store.getState();
      if (state.events.length > 0) {
        const firstEvent = state.events[0];
        focusManager.focusFirst();
        // Pan viewport to show the first event
        const eventPosition = firstEvent.start;
        const halfWidthTime = state.scale.pxToTime(state.canvasWidth / 2);
        const newViewportStart = eventPosition - halfWidthTime;
        store.dispatch({ type: 'SET_VIEWPORT', viewportStart: newViewportStart, scale: state.scale });
      }
    } else if (action === 'jumpToLast' && focusManager) {
      e.preventDefault();
      const state = store.getState();
      if (state.events.length > 0) {
        const lastEvent = state.events[state.events.length - 1];
        focusManager.focusLast();
        // Pan viewport to show the last event
        const eventPosition = lastEvent.start;
        const halfWidthTime = state.scale.pxToTime(state.canvasWidth / 2);
        const newViewportStart = eventPosition - halfWidthTime;
        store.dispatch({ type: 'SET_VIEWPORT', viewportStart: newViewportStart, scale: state.scale });
      }
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
  window.addEventListener('resize', resetGestures);
  window.addEventListener('orientationchange', resetGestures);

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
    window.removeEventListener('resize', resetGestures);
    window.removeEventListener('orientationchange', resetGestures);
    resetGestures();
  };
}
