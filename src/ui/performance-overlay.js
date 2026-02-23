/**
 * Developer performance monitoring overlay (nayra-r1i.5)
 *
 * Shows real-time FPS, frame time, and heap usage in a small overlay panel.
 * Toggle with Ctrl+Shift+P.  Completely tree-shaken in production builds:
 * the module short-circuits to a no-op when NODE_ENV === 'production'.
 *
 * Usage:
 *   import { createPerformanceOverlay } from './ui/performance-overlay.js';
 *   const overlay = createPerformanceOverlay(document.body);
 *   // overlay.toggle() / overlay.destroy()
 *
 * Integration with frame-time.js:
 *   Call overlay.recordFrame(metrics) from the render loop with the object
 *   returned by endFrame() to feed live frame-time data.
 */

// ---------------------------------------------------------------------------
// Production guard — entire module is a no-op in production builds.
// Bundlers (Vite, Rollup, webpack) tree-shake the real implementation when
// process.env.NODE_ENV is replaced with the string 'production'.
// ---------------------------------------------------------------------------

const IS_DEV = (
  typeof process === 'undefined' ||
  process.env?.NODE_ENV !== 'production'
);

// Thresholds matching the 60 FPS budget
const FRAME_BUDGET_MS  = 1000 / 60; // 16.67 ms
const WARN_FRAME_MS    = FRAME_BUDGET_MS;      // yellow
const CRITICAL_FRAME_MS = FRAME_BUDGET_MS * 2; // red (≈33ms)

const UPDATE_INTERVAL_MS = 100;

// ---------------------------------------------------------------------------
// Styles (injected once per document)
// ---------------------------------------------------------------------------

const STYLE_ID = 'nayra-perf-overlay-style';

const CSS = `
#nayra-perf-overlay {
  position: fixed;
  top: 8px;
  right: 8px;
  z-index: 9999;
  font: 11px/1.4 monospace;
  background: rgba(0,0,0,0.75);
  color: #e0e0e0;
  padding: 6px 10px;
  border-radius: 4px;
  pointer-events: none;
  user-select: none;
  min-width: 140px;
}
#nayra-perf-overlay .row { display: flex; justify-content: space-between; gap: 12px; }
#nayra-perf-overlay .label { color: #888; }
#nayra-perf-overlay .ok   { color: #4fc; }
#nayra-perf-overlay .warn { color: #fc0; }
#nayra-perf-overlay .bad  { color: #f44; }
`;

function ensureStyles(doc) {
  if (doc.getElementById(STYLE_ID)) return;
  const el = doc.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  doc.head.appendChild(el);
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a performance overlay attached to the given container.
 *
 * @param {HTMLElement} container  Element to append the overlay to (e.g. document.body)
 * @param {object}      [opts]
 * @param {Document}    [opts.document=globalThis.document]  Injectable for tests
 * @param {number}      [opts.updateIntervalMs=100]
 * @returns {{ toggle: () => void, recordFrame: (metrics: object) => void, destroy: () => void, isVisible: () => boolean }}
 */
export function createPerformanceOverlay(container, {
  document: doc = globalThis.document,
  updateIntervalMs = UPDATE_INTERVAL_MS,
} = {}) {
  // Production no-op
  if (!IS_DEV) {
    return { toggle: () => {}, recordFrame: () => {}, destroy: () => {}, isVisible: () => false };
  }

  ensureStyles(doc);

  const el = doc.createElement('div');
  el.id = 'nayra-perf-overlay';
  el.setAttribute('aria-hidden', 'true');
  el.style.display = 'none';
  container.appendChild(el);

  // Internal state
  let visible      = false;
  let frameCount   = 0;
  let lastFpsReset = performance.now();
  let fps          = 0;
  let lastFrameMs  = 0;
  let intervalId   = null;

  // ---------------------------------------------------------------------------
  // Frame data ingestion (called by the render loop via endFrame())
  // ---------------------------------------------------------------------------

  function recordFrame(metrics) {
    if (!visible) return;
    frameCount++;
    lastFrameMs = metrics.frameTime ?? 0;
  }

  // ---------------------------------------------------------------------------
  // DOM update (runs every updateIntervalMs)
  // ---------------------------------------------------------------------------

  function update() {
    const now     = performance.now();
    const elapsed = now - lastFpsReset;

    if (elapsed >= 1000) {
      fps          = Math.round((frameCount * 1000) / elapsed);
      frameCount   = 0;
      lastFpsReset = now;
    }

    const heapMB = getHeapMB();

    const ftClass  = lastFrameMs >= CRITICAL_FRAME_MS ? 'bad'
                   : lastFrameMs >= WARN_FRAME_MS     ? 'warn'
                   : 'ok';
    const fpsClass = fps < 30 ? 'bad' : fps < 55 ? 'warn' : 'ok';

    el.innerHTML =
      `<div class="row"><span class="label">FPS</span><span class="${fpsClass}">${fps}</span></div>` +
      `<div class="row"><span class="label">Frame</span><span class="${ftClass}">${lastFrameMs.toFixed(1)}ms</span></div>` +
      (heapMB !== null
        ? `<div class="row"><span class="label">Heap</span><span class="ok">${heapMB}MB</span></div>`
        : '');
  }

  function getHeapMB() {
    if (typeof performance !== 'undefined' && performance.memory) {
      return (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1);
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Show / hide
  // ---------------------------------------------------------------------------

  function show() {
    visible     = true;
    frameCount  = 0;
    lastFpsReset = performance.now();
    el.style.display = 'block';
    intervalId = setInterval(update, updateIntervalMs);
  }

  function hide() {
    visible = false;
    el.style.display = 'none';
    if (intervalId !== null) { clearInterval(intervalId); intervalId = null; }
  }

  function toggle() {
    visible ? hide() : show();
  }

  // ---------------------------------------------------------------------------
  // Keyboard shortcut: Ctrl+Shift+P
  // ---------------------------------------------------------------------------

  function onKeyDown(event) {
    if (event.ctrlKey && event.shiftKey && event.key === 'P') {
      event.preventDefault();
      toggle();
    }
  }

  doc.addEventListener('keydown', onKeyDown);

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  function destroy() {
    hide();
    doc.removeEventListener('keydown', onKeyDown);
    el.remove();
  }

  return { toggle, recordFrame, destroy, isVisible: () => visible };
}
