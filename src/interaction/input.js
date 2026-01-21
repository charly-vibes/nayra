import { RationalScale } from '../core/scale.js';

const MIN_SECONDS_PER_PIXEL = 0.001;
const MAX_SECONDS_PER_PIXEL = 1e15;
const ZOOM_FACTOR = 1.15;

export function initInput(canvas, store) {
  let isDragging = false;
  let lastX = 0;

  function onMouseDown(e) {
    if (e.button !== 0) return;
    isDragging = true;
    lastX = e.clientX;
    canvas.style.cursor = 'grabbing';
  }

  function onMouseMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    if (dx === 0) return;
    
    const state = store.getState();
    const timeDelta = state.scale.pxToTime(-dx);
    store.dispatch({ type: 'PAN', offset: timeDelta });
    lastX = e.clientX;
  }

  function onMouseUp() {
    if (!isDragging) return;
    isDragging = false;
    canvas.style.cursor = 'grab';
  }

  function onMouseLeave() {
    if (isDragging) {
      isDragging = false;
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

  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('mouseleave', onMouseLeave);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  
  canvas.style.cursor = 'grab';

  return function destroy() {
    canvas.removeEventListener('mousedown', onMouseDown);
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('mouseup', onMouseUp);
    canvas.removeEventListener('mouseleave', onMouseLeave);
    canvas.removeEventListener('wheel', onWheel);
  };
}
