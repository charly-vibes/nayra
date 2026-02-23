/**
 * DPI scaling utilities for high-DPI canvas rendering.
 * Scales the canvas backing store by devicePixelRatio and applies the
 * inverse CSS transform so drawing coordinates stay in logical pixels.
 */

/**
 * Read the current device pixel ratio, defaulting to 1.
 * @returns {number}
 */
export function getDevicePixelRatio() {
  return (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
}

/**
 * Apply DPI scaling to a canvas element and its 2D context.
 * Sets canvas.width/height to physical pixels and scales the ctx transform
 * so all drawing code works in logical (CSS) pixels.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {CanvasRenderingContext2D} ctx
 * @returns {{ width: number, height: number }} - Logical (CSS) dimensions
 */
export function applyDpiScaling(canvas, ctx) {
  const rect = canvas.getBoundingClientRect();
  const dpr = getDevicePixelRatio();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return rect;
}

/**
 * Return the logical (CSS pixel) size of a canvas whose backing store
 * has already been scaled by devicePixelRatio.
 *
 * @param {HTMLCanvasElement} canvas
 * @returns {{ width: number, height: number }}
 */
export function getLogicalSize(canvas) {
  const dpr = getDevicePixelRatio();
  return {
    width: canvas.width / dpr,
    height: canvas.height / dpr,
  };
}
