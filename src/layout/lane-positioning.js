/**
 * Lane Positioning Module
 *
 * Calculates consistent vertical positions for event lanes.
 * Lane 0 is closest to the timeline axis, with subsequent lanes
 * offset vertically with consistent spacing.
 */

/**
 * Configuration for lane positioning
 */
export const DEFAULT_CONFIG = {
  laneHeight: 24,        // Height of each lane in pixels
  laneSpacing: 4,        // Vertical spacing between lanes
  baselineOffset: 0,     // Offset from timeline axis to first lane
};

/**
 * Calculate the Y position for a given lane
 *
 * @param {number} lane - The lane number (0-based, 0 is closest to axis)
 * @param {number} axisY - The Y coordinate of the timeline axis
 * @param {Object} config - Configuration options (optional)
 * @param {number} config.laneHeight - Height of each lane in pixels
 * @param {number} config.laneSpacing - Vertical spacing between lanes
 * @param {number} config.baselineOffset - Offset from axis to first lane
 * @returns {number} - The Y coordinate for the top of the lane
 */
export function getLaneY(lane, axisY, config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Lane 0 is centered on the axis
  // Each subsequent lane is offset vertically
  const laneStride = cfg.laneHeight + cfg.laneSpacing;
  const offset = lane * laneStride;

  // Position lane 0 centered on axis, then offset up for additional lanes
  return axisY - cfg.laneHeight / 2 - offset;
}

/**
 * Calculate the total height needed to accommodate all lanes
 *
 * @param {number} laneCount - Total number of lanes
 * @param {Object} config - Configuration options (optional)
 * @returns {number} - Total height in pixels
 */
export function getTotalHeight(laneCount, config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (laneCount === 0) return 0;

  // Total height is the number of lanes times lane height,
  // plus spacing between lanes (one less spacing than lanes)
  return laneCount * cfg.laneHeight + (laneCount - 1) * cfg.laneSpacing;
}

/**
 * Get adaptive lane configuration based on zoom level
 *
 * This allows lanes to scale with zoom for better visual density
 * at different zoom levels (optional feature for future enhancement)
 *
 * @param {number} secondsPerPixel - Current zoom level
 * @returns {Object} - Configuration object with adaptive sizing
 */
export function getAdaptiveLaneConfig(secondsPerPixel) {
  // For now, return default config
  // Future: adjust lane height based on zoom level
  // e.g., smaller lanes when zoomed out (macro view)
  // larger lanes when zoomed in (micro view)
  return { ...DEFAULT_CONFIG };
}

/**
 * Calculate lane bounds (top and bottom Y coordinates)
 *
 * @param {number} lane - The lane number
 * @param {number} axisY - The Y coordinate of the timeline axis
 * @param {Object} config - Configuration options (optional)
 * @returns {Object} - { top, bottom, height } coordinates
 */
export function getLaneBounds(lane, axisY, config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const top = getLaneY(lane, axisY, cfg);
  const bottom = top + cfg.laneHeight;

  return {
    top,
    bottom,
    height: cfg.laneHeight,
  };
}

/**
 * Find which lane a Y coordinate falls into
 *
 * @param {number} y - The Y coordinate
 * @param {number} axisY - The Y coordinate of the timeline axis
 * @param {number} maxLanes - Maximum number of lanes
 * @param {Object} config - Configuration options (optional)
 * @returns {number|null} - The lane number, or null if not in any lane
 */
export function getLaneAtY(y, axisY, maxLanes, config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  for (let lane = 0; lane < maxLanes; lane++) {
    const bounds = getLaneBounds(lane, axisY, cfg);
    if (y >= bounds.top && y <= bounds.bottom) {
      return lane;
    }
  }

  return null;
}
