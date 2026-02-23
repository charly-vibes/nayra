/**
 * Frame time measurement using the Performance API (nayra-r1i.2)
 *
 * Usage pattern per frame:
 *
 *   startFrame(id);
 *
 *   startPhase(id, 'layout');
 *   // ... layout work ...
 *   endPhase(id, 'layout');
 *
 *   startPhase(id, 'render');
 *   // ... render work ...
 *   endPhase(id, 'render');
 *
 *   const metrics = endFrame(id);
 *   logSlowFrame(metrics, isDevMode());
 */

/** 60 FPS budget in milliseconds. */
export const FRAME_BUDGET_MS = 1000 / 60; // 16.666…

/**
 * Mark the start of a frame.
 * @param {string|number} frameId
 */
export function startFrame(frameId) {
  performance.mark(`frame-start-${frameId}`);
}

/**
 * Mark the start of a named phase within a frame (e.g. 'render', 'layout').
 * @param {string|number} frameId
 * @param {string} phase
 */
export function startPhase(frameId, phase) {
  performance.mark(`${phase}-start-${frameId}`);
}

/**
 * Mark the end of a named phase and create a Performance measure for it.
 * @param {string|number} frameId
 * @param {string} phase
 */
export function endPhase(frameId, phase) {
  performance.mark(`${phase}-end-${frameId}`);
  performance.measure(`${phase}-${frameId}`, `${phase}-start-${frameId}`, `${phase}-end-${frameId}`);
}

/**
 * Mark the end of a frame, measure its total duration, and return metrics.
 *
 * @param {string|number} frameId
 * @returns {{ frameId, frameTime: number, renderTime: number, layoutTime: number, isSlowFrame: boolean }}
 */
export function endFrame(frameId) {
  performance.mark(`frame-end-${frameId}`);
  performance.measure(`frame-${frameId}`, `frame-start-${frameId}`, `frame-end-${frameId}`);
  return _collectMetrics(frameId);
}

function _collectMetrics(frameId) {
  const frameEntries  = performance.getEntriesByName(`frame-${frameId}`);
  const renderEntries = performance.getEntriesByName(`render-${frameId}`);
  const layoutEntries = performance.getEntriesByName(`layout-${frameId}`);

  const frameTime  = frameEntries[0]?.duration  ?? 0;
  const renderTime = renderEntries[0]?.duration ?? 0;
  const layoutTime = layoutEntries[0]?.duration ?? 0;

  return {
    frameId,
    frameTime,
    renderTime,
    layoutTime,
    isSlowFrame: frameTime > FRAME_BUDGET_MS,
  };
}
