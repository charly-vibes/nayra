import { DAY, YEAR } from '../core/time.js';

/**
 * Level of Detail (LOD) system for adaptive rendering based on zoom level
 */

// LOD levels
export const LOD_MICRO = 'micro';  // days/hours - maximum detail
export const LOD_MESO = 'meso';    // decades - medium detail
export const LOD_MACRO = 'macro';  // centuries+ - minimal detail

// Event priority levels
export const PRIORITY_LOW = 0;
export const PRIORITY_MEDIUM = 1;
export const PRIORITY_HIGH = 2;

// LOD thresholds (seconds per pixel)
// Add hysteresis to prevent flickering during zoom
const MICRO_TO_MESO_THRESHOLD = Number(DAY) / 2;        // 12 hours/px
const MESO_TO_MICRO_THRESHOLD = Number(DAY) / 3;        // 8 hours/px
const MESO_TO_MACRO_THRESHOLD = Number(YEAR) * 50;      // 50 years/px
const MACRO_TO_MESO_THRESHOLD = Number(YEAR) * 30;      // 30 years/px

/**
 * Determine the appropriate LOD level based on zoom
 * Uses hysteresis to prevent flickering at boundaries
 *
 * @param {number} secondsPerPixel - Current zoom level
 * @param {string} currentLOD - Current LOD level (for hysteresis)
 * @returns {string} - LOD level constant
 */
export function determineLOD(secondsPerPixel, currentLOD = LOD_MICRO) {
  // From micro, check if we should jump to meso or macro
  if (currentLOD === LOD_MICRO) {
    if (secondsPerPixel >= MESO_TO_MACRO_THRESHOLD) {
      return LOD_MACRO;
    }
    if (secondsPerPixel >= MICRO_TO_MESO_THRESHOLD) {
      return LOD_MESO;
    }
    return LOD_MICRO;
  }

  // From meso, can go up or down
  if (currentLOD === LOD_MESO) {
    if (secondsPerPixel < MESO_TO_MICRO_THRESHOLD) {
      return LOD_MICRO;
    }
    if (secondsPerPixel >= MESO_TO_MACRO_THRESHOLD) {
      return LOD_MACRO;
    }
    return LOD_MESO;
  }

  // From macro, need less threshold to jump back to meso
  if (currentLOD === LOD_MACRO) {
    if (secondsPerPixel < MACRO_TO_MESO_THRESHOLD) {
      return LOD_MESO;
    }
    return LOD_MACRO;
  }

  // Fallback: determine without hysteresis
  if (secondsPerPixel < MESO_TO_MICRO_THRESHOLD) {
    return LOD_MICRO;
  }
  if (secondsPerPixel < MESO_TO_MACRO_THRESHOLD) {
    return LOD_MESO;
  }
  return LOD_MACRO;
}

/**
 * Get event priority, defaulting to medium if not specified
 *
 * @param {Object} event - Event object
 * @returns {number} - Priority level (0-2)
 */
export function getEventPriority(event) {
  if (event.priority !== undefined && event.priority !== null) {
    return event.priority;
  }
  return PRIORITY_MEDIUM;
}

/**
 * Filter events based on LOD level and priority
 *
 * @param {Array} events - Array of events
 * @param {string} lod - Current LOD level
 * @returns {Array} - Filtered events
 */
export function filterEventsByLOD(events, lod) {
  if (lod === LOD_MICRO) {
    // Show all events at micro level
    return events;
  }

  if (lod === LOD_MESO) {
    // Show medium and high priority events
    return events.filter(event => getEventPriority(event) >= PRIORITY_MEDIUM);
  }

  if (lod === LOD_MACRO) {
    // Show only high priority events
    return events.filter(event => getEventPriority(event) >= PRIORITY_HIGH);
  }

  return events;
}

/**
 * Determine if labels should be shown at current LOD
 *
 * @param {string} lod - Current LOD level
 * @returns {boolean} - Whether to show labels
 */
export function shouldShowLabels(lod) {
  // Macro view: no labels (will show cluster counts instead)
  if (lod === LOD_MACRO) {
    return false;
  }
  return true;
}

/**
 * Determine if full label detail should be shown
 *
 * @param {string} lod - Current LOD level
 * @returns {boolean} - Whether to show full label detail
 */
export function shouldShowFullLabels(lod) {
  return lod === LOD_MICRO;
}

/**
 * Determine minimum event width for rendering
 * Smaller events may be rendered as points at higher LODs
 *
 * @param {string} lod - Current LOD level
 * @returns {number} - Minimum width in pixels
 */
export function getMinEventWidth(lod) {
  if (lod === LOD_MICRO) {
    return 4; // Show small durations
  }
  if (lod === LOD_MESO) {
    return 6; // Slightly larger minimum
  }
  return 8; // Macro: only show significant durations
}

/**
 * Determine if event should be rendered as a point vs duration bar
 *
 * @param {number} eventWidth - Event width in pixels
 * @param {string} lod - Current LOD level
 * @returns {boolean} - Whether to render as point
 */
export function shouldRenderAsPoint(eventWidth, lod) {
  const minWidth = getMinEventWidth(lod);
  return eventWidth < minWidth;
}
