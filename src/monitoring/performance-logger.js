/**
 * Performance logging for slow frame detection (nayra-r1i.2)
 *
 * Logs frames that exceed the 16.67ms budget to the console when running
 * in development mode.
 */

/**
 * Returns true when the application is running in development mode.
 *
 * Detection order:
 *  1. NODE_ENV environment variable (Node / bundler-injected)
 *  2. Default to true (safest: always show dev warnings unless explicitly prod)
 */
export function isDevMode() {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
    return process.env.NODE_ENV !== 'production';
  }
  return true;
}

/**
 * Log a slow frame to the console.
 *
 * @param {{ frameId, frameTime: number, renderTime: number, layoutTime: number, isSlowFrame: boolean }} metrics
 * @param {boolean} [devMode] - pass explicitly in tests; defaults to isDevMode()
 */
export function logSlowFrame(metrics, devMode = isDevMode()) {
  if (!devMode || !metrics.isSlowFrame) return;

  console.warn(
    `[perf] slow frame: ${metrics.frameTime.toFixed(2)}ms` +
    ` (budget: 16.67ms)` +
    ` | render: ${metrics.renderTime.toFixed(2)}ms` +
    ` | layout: ${metrics.layoutTime.toFixed(2)}ms`,
  );
}
