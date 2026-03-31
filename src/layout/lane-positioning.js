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
  laneHeight: 24, // Height of each lane in pixels
  laneSpacing: 4, // Vertical spacing between lanes
  baselineOffset: 0, // Offset from timeline axis to first lane
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

  const laneStride = cfg.laneHeight + cfg.laneSpacing;
  const laneOffset = lane * laneStride;
  const verticalShift = cfg.verticalOffset || 0;

  // Position lane 0 at axis, offset up for additional lanes, then shift
  // the entire band toward the vertical center of available space.
  return axisY - cfg.laneHeight / 2 - laneOffset - verticalShift;
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

const TOP_LANE_PADDING = 40; // pixels reserved above the topmost lane
const MAX_LANE_HEIGHT = 40; // cap so lanes don't balloon with sparse data
const MIN_LANE_HEIGHT = 20; // floor so events stay readable

/**
 * Compute a lane config that fills the available vertical space.
 *
 * Distributes the canvas height between the axis and the top padding
 * evenly across all active lanes, capped at MAX_LANE_HEIGHT and floored
 * at MIN_LANE_HEIGHT.
 *
 * @param {number} axisY - Y coordinate of the timeline axis
 * @param {number} laneCount - Number of active lanes
 * @returns {Object} - Configuration object with adaptive laneHeight
 */
export function getDynamicLaneConfig(axisY, laneCount) {
  const effectiveLanes = Math.max(1, laneCount);
  const { laneSpacing } = DEFAULT_CONFIG;
  const availableHeight = axisY - TOP_LANE_PADDING;

  // Solve: laneHeight * N + laneSpacing * (N-1) = availableHeight
  const laneHeight = Math.max(
    MIN_LANE_HEIGHT,
    Math.min(MAX_LANE_HEIGHT, Math.floor((availableHeight - laneSpacing * (effectiveLanes - 1)) / effectiveLanes)),
  );

  // Vertically center the lane band in the available space above the axis.
  // Without this, lanes anchor to the axis leaving the top 90% empty.
  const bandHeight = effectiveLanes * laneHeight + (effectiveLanes - 1) * laneSpacing;
  const verticalOffset = Math.max(0, Math.floor((availableHeight - bandHeight) / 2));

  return { ...DEFAULT_CONFIG, laneHeight, verticalOffset };
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
