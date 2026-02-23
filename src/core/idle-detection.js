/**
 * Idle detection and background-tab throttling (nayra-r1i.6)
 *
 * Stops the animation loop when:
 *   1. No user interaction for `idleTimeoutMs` (default 5 s)
 *   2. The document is hidden (background tab — Page Visibility API)
 *
 * When idle, ResizeObserver / IntersectionObserver instances can be
 * disconnected via the optional `onIdle` callback and reconnected via
 * `onActive`.
 *
 * All browser globals are injectable for unit-test isolation.
 *
 * Usage:
 *
 *   import { createIdleDetector } from './core/idle-detection.js';
 *
 *   const idle = createIdleDetector({
 *     onIdle:   () => { resizeObs.disconnect(); cancelAnimationFrame(rafId); },
 *     onActive: () => { resizeObs.observe(canvas); scheduleFrame(); },
 *   });
 *
 *   // Clean up when the timeline is destroyed:
 *   idle.destroy();
 */

const INTERACTION_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel', 'click'];

/**
 * @typedef {object} IdleDetectorOptions
 * @property {number}   [idleTimeoutMs=5000]  Milliseconds of inactivity before idle.
 * @property {()=>void} [onIdle]              Called when idle state is entered.
 * @property {()=>void} [onActive]            Called when active state is resumed.
 * @property {Document} [document]            Injectable document (for tests).
 * @property {Window}   [window]              Injectable window (for tests).
 * @property {(cb:()=>void)=>number} [requestAnimationFrame]
 * @property {(id:number)=>void}     [cancelAnimationFrame]
 */

/**
 * Create an idle detector.
 *
 * @param {IdleDetectorOptions} [opts]
 * @returns {{ isIdle: () => boolean, resetIdleTimer: () => void, destroy: () => void }}
 */
export function createIdleDetector({
  idleTimeoutMs = 5000,
  onIdle        = () => {},
  onActive      = () => {},
  document: doc = globalThis.document,
  window: win   = globalThis.window ?? globalThis,
} = {}) {
  let idle      = false;
  let timerId   = null;

  // ---------------------------------------------------------------------------
  // Idle / active transitions
  // ---------------------------------------------------------------------------

  function enterIdle() {
    if (idle) return;
    idle = true;
    onIdle();
  }

  function enterActive() {
    if (!idle) return;
    idle = false;
    onActive();
  }

  // ---------------------------------------------------------------------------
  // Idle timer
  // ---------------------------------------------------------------------------

  function resetIdleTimer() {
    if (timerId !== null) clearTimeout(timerId);
    timerId = setTimeout(enterIdle, idleTimeoutMs);
    enterActive(); // any activity resumes from idle immediately
  }

  // ---------------------------------------------------------------------------
  // Page Visibility API
  // ---------------------------------------------------------------------------

  function onVisibilityChange() {
    if (doc.hidden) {
      // Immediately pause when the tab goes to the background
      if (timerId !== null) { clearTimeout(timerId); timerId = null; }
      enterIdle();
    } else {
      // Tab is visible again — resume and restart the idle timer
      enterActive();
      resetIdleTimer();
    }
  }

  // ---------------------------------------------------------------------------
  // Interaction listeners (on window so we capture all events globally)
  // ---------------------------------------------------------------------------

  function onInteraction() {
    resetIdleTimer();
  }

  for (const type of INTERACTION_EVENTS) {
    win.addEventListener(type, onInteraction, { passive: true });
  }

  doc.addEventListener('visibilitychange', onVisibilityChange);

  // Start the idle countdown immediately
  resetIdleTimer();

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  function destroy() {
    if (timerId !== null) { clearTimeout(timerId); timerId = null; }
    for (const type of INTERACTION_EVENTS) {
      win.removeEventListener(type, onInteraction);
    }
    doc.removeEventListener('visibilitychange', onVisibilityChange);
  }

  return {
    /** Returns true when currently in idle state. */
    isIdle: () => idle,
    /** Reset the idle countdown (call this when an interaction occurs manually). */
    resetIdleTimer,
    destroy,
  };
}
