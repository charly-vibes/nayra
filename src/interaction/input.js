import { RationalScale } from '../core/scale.js';
import { YEAR } from '../core/time.js';
import { findEventAtPoint } from './hit-detection.js';

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

  function onMouseDown(e) {
    if (e.button !== 0) return;
    isDragging = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    lastX = e.clientX;
  }

  function onMouseMove(e) {
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
    }

    if (e.buttons === 1) {
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

  function onMouseUp(e) {
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

  function onMouseLeave() {
    if (isDragging) {
      isDragging = false;
    }
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

  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('mouseleave', onMouseLeave);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  document.addEventListener('keydown', onKeyDown);

  canvas.style.cursor = 'grab';

  return function destroy() {
    canvas.removeEventListener('mousedown', onMouseDown);
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('mouseup', onMouseUp);
    canvas.removeEventListener('mouseleave', onMouseLeave);
    canvas.removeEventListener('wheel', onWheel);
    document.removeEventListener('keydown', onKeyDown);
  };
}
