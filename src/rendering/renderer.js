import { BILLION_YEARS, isVisible, MILLION_YEARS, projectToScreen, YEAR } from '../core/time.js';
import { clusterEvents } from '../layout/event-clustering.js';
import { assignLanes } from '../layout/greedy-interval-coloring.js';
import { detectLabelCollisions, renderLabel } from '../layout/label-collision.js';
import { getDynamicLaneConfig, getLaneY, DEFAULT_CONFIG as LANE_CONFIG } from '../layout/lane-positioning.js';
import {
  calculateLayout as calculateLayoutWorker,
  getWorkerThreshold,
  initWorker,
  terminateWorker,
} from '../layout/layout-worker-manager.js';
import { SpatialHash } from '../layout/spatial-hash.js';
import { toDisplayYear } from '../ui/format.js';
import { lightenColor } from './colors.js';
import { applyDpiScaling, getLogicalSize } from './dpi-scaling.js';
import { drawEventShapeIndicator, getShapeIndicatorLabelOffset } from './event-shapes.js';
import {
  determineLOD,
  filterEventsByLOD,
  getMinEventWidth,
  LOD_MACRO,
  LOD_MICRO,
  shouldRenderAsPoint,
  shouldShowLabels,
} from './lod.js';
import { getEventSearchState, getSearchAlpha, renderHighlightedLabel } from './search-highlight.js';

let ctx = null;
let canvas = null;
let resizeObserver = null;
let _lastFrameTime = performance.now();
let fps = 0;
let frameCount = 0;
let fpsUpdateTime = 0;

// Layout state cache
let laneAssignments = new Map(); // eventId -> lane number
let laneCount = 0;
let currentLaneConfig = { ...LANE_CONFIG }; // dynamic config updated each frame
const spatialHash = new SpatialHash();
let layoutRevision = -1; // Track when layout needs recalculation
let currentLOD = LOD_MICRO; // Current level of detail
let clusters = []; // Current event clusters (for macro zoom)
let pendingLayoutRevision = -1; // Track pending async layout calculation
let isLayoutPending = false; // Flag to prevent duplicate layout requests

export const AXIS_BOTTOM_MARGIN = 60;
export function getAxisY(height) {
  return height - AXIS_BOTTOM_MARGIN;
}

export const EVENT_HEIGHT = 20;
export const EVENT_COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe'];

export function init(canvasElement, dispatch) {
  canvas = canvasElement;
  ctx = canvas.getContext('2d');

  const rect = setupDPI();
  dispatch({ type: 'SET_CANVAS_WIDTH', width: rect.width });

  resizeObserver = new ResizeObserver(() => {
    const rect = setupDPI();
    dispatch({ type: 'SET_CANVAS_WIDTH', width: rect.width });
  });
  resizeObserver.observe(canvas);

  // Initialize Web Worker for layout offloading
  initWorker();

  return { ctx, canvas };
}

export function destroy() {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }

  // Terminate Web Worker
  terminateWorker();

  ctx = null;
  canvas = null;
  // Clear layout state
  laneAssignments.clear();
  laneCount = 0;
  currentLaneConfig = { ...LANE_CONFIG };
  spatialHash.clear();
  layoutRevision = -1;
  currentLOD = LOD_MICRO;
  clusters = [];
  pendingLayoutRevision = -1;
  isLayoutPending = false;
}

/**
 * Get the current spatial hash (for hit detection)
 * @returns {SpatialHash} - The current spatial hash
 */
export function getSpatialHash() {
  return spatialHash;
}

/**
 * Get the current lane assignments
 * @returns {Map} - Map of eventId -> lane number
 */
export function getLaneAssignments() {
  return laneAssignments;
}

/**
 * Get the current lane count
 * @returns {number} - Number of lanes
 */
export function getLaneCount() {
  return laneCount;
}

/**
 * Get the current clusters (for hit detection)
 * @returns {Array} - Current clusters
 */
export function getClusters() {
  return clusters;
}

/**
 * Get the current lane config (dynamic, updated each draw frame)
 * @returns {Object} - { laneHeight, laneSpacing, baselineOffset }
 */
export function getCurrentLaneConfig() {
  return currentLaneConfig;
}

function setupDPI() {
  return applyDpiScaling(canvas, ctx);
}

/**
 * Calculate lane assignments for all events
 * Only recalculates if state has changed (based on revision)
 *
 * For large datasets (>= 10,000 events), offloads calculation to Web Worker.
 * For small datasets, uses synchronous calculation on main thread.
 */
function calculateLayout(state, axisY, viewportStart, scale, width) {
  // Only recalculate if state has changed
  if (layoutRevision === state.revision) {
    return;
  }

  const targetRevision = state.revision;
  const eventCount = state.events.length;
  const threshold = getWorkerThreshold();

  // For small datasets, use synchronous calculation
  if (eventCount < threshold) {
    layoutRevision = targetRevision;

    // Assign lanes using greedy interval coloring (synchronous)
    const result = assignLanes(state.events);
    laneAssignments = result.layouts;
    laneCount = result.laneCount;

    rebuildSpatialHash(state.events, axisY, viewportStart, scale);
    return;
  }

  // For large datasets, use Web Worker (async)
  // Prevent duplicate requests for the same revision
  if (isLayoutPending && pendingLayoutRevision === targetRevision) {
    return; // Already calculating this revision
  }

  isLayoutPending = true;
  pendingLayoutRevision = targetRevision;

  // Kick off async calculation
  calculateLayoutWorker(
    state.events,
    {
      start: viewportStart,
      end: viewportStart + scale.pxToTime(width),
    },
    scale.getSecondsPerPixel(),
  )
    .then((result) => {
      // Only apply result if it's still relevant (revision hasn't changed)
      if (pendingLayoutRevision === targetRevision && layoutRevision !== targetRevision) {
        layoutRevision = targetRevision;
        laneAssignments = result.layouts;
        laneCount = result.laneCount;

        rebuildSpatialHash(state.events, axisY, viewportStart, scale);

        // Trigger a redraw to show updated layout
        if (canvas) {
          requestAnimationFrame(() => draw(state));
        }
      }
      isLayoutPending = false;
    })
    .catch((error) => {
      console.error('Layout calculation failed:', error);
      isLayoutPending = false;

      // Fallback to synchronous calculation
      if (layoutRevision !== targetRevision) {
        layoutRevision = targetRevision;
        const result = assignLanes(state.events);
        laneAssignments = result.layouts;
        laneCount = result.laneCount;
        rebuildSpatialHash(state.events, axisY, viewportStart, scale);
      }
    });
}

/**
 * Rebuild spatial hash with current lane assignments
 * Extracted to reduce duplication between sync and async paths
 */
function rebuildSpatialHash(events, axisY, viewportStart, scale) {
  const laneConfig = getDynamicLaneConfig(axisY, laneCount);
  const eventHeight = laneConfig.laneHeight;

  const getBounds = (event) => {
    const x = projectToScreen(event.start, viewportStart, scale);

    // Calculate actual event width
    let eventWidth;
    if (event.end !== undefined && event.end > event.start) {
      const endX = projectToScreen(event.end, viewportStart, scale);
      eventWidth = endX - x;
    } else {
      eventWidth = 0;
    }

    // Use LOD-aware sizing for hit detection
    const minWidth = getMinEventWidth(currentLOD);
    const renderAsPoint = shouldRenderAsPoint(eventWidth, currentLOD) || eventWidth === 0;
    const displayWidth = renderAsPoint ? minWidth : Math.max(eventWidth, minWidth);

    const lane = laneAssignments.get(event.id) || 0;
    const y = getLaneY(lane, axisY, laneConfig);

    // For points, center the hit area
    const hitX = renderAsPoint ? x - displayWidth / 2 : x;

    return { x: hitX, y, width: displayWidth, height: eventHeight };
  };

  spatialHash.rebuild(events, getBounds);
}

export function draw(state) {
  if (!ctx || !canvas) return;

  const now = performance.now();
  updateFPS(now);

  const { width, height } = getLogicalSize(canvas);
  const viewportEnd = state.viewportStart + state.scale.pxToTime(width);

  const axisY = getAxisY(height);

  // Determine LOD level based on zoom
  const secondsPerPixel = state.scale.getSecondsPerPixel();
  currentLOD = determineLOD(secondsPerPixel, currentLOD);

  // Filter events by LOD before layout
  const lodFilteredEvents = filterEventsByLOD(state.events, currentLOD);

  // Apply clustering at macro zoom level
  if (currentLOD === LOD_MACRO) {
    clusters = clusterEvents(lodFilteredEvents, state.viewportStart, state.scale);
  } else {
    clusters = [];
  }

  // Calculate layout (only if state changed)
  // For macro zoom with clustering, we still need layout for individual events within clusters
  calculateLayout({ ...state, events: lodFilteredEvents }, axisY, state.viewportStart, state.scale, width);

  // Update dynamic lane config based on current lane count and canvas height
  currentLaneConfig = getDynamicLaneConfig(axisY, laneCount);

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, width, height);

  drawGridAndLabels(state, width, height, axisY);

  ctx.strokeStyle = '#4a4a6a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, axisY);
  ctx.lineTo(width, axisY);
  ctx.stroke();

  // Build Set for O(1) lookups during rendering (uses combined active filter)
  const searchResultSet = state.activeFilterIds ? new Set(state.activeFilterIds) : null;

  // Render based on LOD level
  if (currentLOD === LOD_MACRO && clusters.length > 0) {
    // Render clusters at macro zoom
    for (const cluster of clusters) {
      if (cluster.type === 'cluster') {
        drawCluster(cluster, state, axisY, width, viewportEnd);
      } else if (cluster.type === 'event') {
        // Single unclustered event
        const event = cluster.event;
        const duration = event.end !== undefined ? event.end - event.start : 0n;
        if (isVisible(event.start, duration, state.viewportStart, viewportEnd)) {
          drawEvent(event, state, axisY, width, currentLOD, searchResultSet, currentLaneConfig);
        }
      }
    }
  } else {
    // Normal rendering: draw events and collect bounds for label collision detection
    const eventsWithBounds = [];
    for (const event of lodFilteredEvents) {
      const duration = event.end !== undefined ? event.end - event.start : 0n;
      if (!isVisible(event.start, duration, state.viewportStart, viewportEnd)) {
        continue;
      }
      const bounds = drawEvent(event, state, axisY, width, currentLOD, searchResultSet, currentLaneConfig);
      if (bounds) {
        eventsWithBounds.push({ id: event.id, label: event.label, bounds });
      }
    }

    // Second pass: detect label collisions and render visible labels
    // Only show labels if appropriate for current LOD
    if (shouldShowLabels(currentLOD)) {
      const visibleLabels = detectLabelCollisions(eventsWithBounds, ctx, secondsPerPixel);

      for (const eventData of eventsWithBounds) {
        if (visibleLabels.has(eventData.id) && eventData.label) {
          const symbolOffset = eventData.bounds.symbolOffset || 0;
          if (state.searchQuery) {
            renderHighlightedLabel(
              ctx,
              eventData.label,
              eventData.bounds.x,
              eventData.bounds.y,
              eventData.bounds.width,
              eventData.bounds.height,
              state.searchQuery,
              symbolOffset,
            );
          } else {
            renderLabel(
              ctx,
              eventData.label,
              eventData.bounds.x,
              eventData.bounds.y,
              eventData.bounds.width,
              eventData.bounds.height,
              symbolOffset,
            );
          }
        }
      }
    }
  }

  drawFPS(width);
}

/**
 * Draw a cluster marker with event count
 */
function drawCluster(cluster, state, axisY, canvasWidth, viewportEnd) {
  // Check if cluster is visible
  if (!isVisible(cluster.minTime, cluster.maxTime - cluster.minTime, state.viewportStart, viewportEnd)) {
    return;
  }

  const x = cluster.centerX;
  if (x < 0 || x > canvasWidth) return;

  // Cluster marker size based on count
  const baseRadius = 12;
  const maxRadius = 24;
  const radius = Math.min(baseRadius + Math.log(cluster.count) * 2, maxRadius);

  // Draw cluster marker (circle)
  ctx.fillStyle = '#4ecdc4';
  ctx.strokeStyle = '#2a9d8f';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(x, axisY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Draw count label
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(cluster.count.toString(), x, axisY);
}

function drawEvent(event, state, axisY, canvasWidth, lod, searchResultSet = null, laneConfig = null) {
  const cfg = laneConfig || currentLaneConfig;
  const eventHeight = cfg.laneHeight;

  const x = projectToScreen(event.start, state.viewportStart, state.scale);

  // Calculate actual event width
  let eventWidth;
  if (event.end !== undefined && event.end > event.start) {
    const endX = projectToScreen(event.end, state.viewportStart, state.scale);
    eventWidth = endX - x;
  } else {
    eventWidth = 0;
  }

  // Determine minimum width based on LOD
  const minWidth = getMinEventWidth(lod);
  const renderAsPoint = shouldRenderAsPoint(eventWidth, lod) || eventWidth === 0;
  const displayWidth = renderAsPoint ? minWidth : Math.max(eventWidth, minWidth);

  if (x > canvasWidth || x + displayWidth < 0) return null;

  const isHovered = state.hoveredEventId === event.id;
  const isSelected = state.selectedEventIds?.has(event.id);
  const isFocused = state.focusedEventId === event.id;

  const searchState = getEventSearchState(event.id, searchResultSet);
  const alpha = getSearchAlpha(searchState);

  const fillColor = getEventFillColor(event.id, isHovered, isSelected);
  const strokeStyle = getEventStrokeStyle(isSelected, isFocused);

  // Use lane-based positioning
  const lane = laneAssignments.get(event.id) || 0;
  const y = getLaneY(lane, axisY, cfg);

  ctx.globalAlpha = alpha;
  ctx.fillStyle = fillColor;

  if (renderAsPoint) {
    // Render as a diamond — the standard milestone/instant symbol in Gantt charts.
    // Diamond is maximally distinct from rectangular range bars and readable at 6-8px.
    const pointSize = minWidth;
    const cx = x;
    const cy = y + eventHeight / 2;
    const half = pointSize / 2;

    ctx.beginPath();
    ctx.moveTo(cx, cy - half); // top
    ctx.lineTo(cx + half, cy); // right
    ctx.lineTo(cx, cy + half); // bottom
    ctx.lineTo(cx - half, cy); // left
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = strokeStyle.color;
    ctx.lineWidth = strokeStyle.lineWidth;
    if (isSelected) {
      const s = half + 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy - s);
      ctx.lineTo(cx + s, cy);
      ctx.lineTo(cx, cy + s);
      ctx.lineTo(cx - s, cy);
      ctx.closePath();
    }
    ctx.stroke();
  } else {
    // Render as a duration bar
    ctx.fillRect(x, y, displayWidth, eventHeight);

    ctx.strokeStyle = strokeStyle.color;
    ctx.lineWidth = strokeStyle.lineWidth;
    if (isSelected) {
      ctx.strokeRect(x - 1, y - 1, displayWidth + 2, eventHeight + 2);
    } else {
      ctx.strokeRect(x, y, displayWidth, eventHeight);
    }

    // Draw shape indicator for color-independent category encoding (WCAG 1.4.1)
    drawEventShapeIndicator(ctx, event, x, y, displayWidth, eventHeight, alpha);
  }

  ctx.globalAlpha = 1.0;

  // Calculate label x offset to avoid overlapping the shape indicator
  const symbolOffset = renderAsPoint ? 0 : getShapeIndicatorLabelOffset(displayWidth, eventHeight);

  // Return bounds for label collision detection (includes symbolOffset for text positioning)
  return { x, y, width: displayWidth, height: eventHeight, symbolOffset };
}

export function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function getEventColor(eventId) {
  const colorIndex = hashCode(eventId) % EVENT_COLORS.length;
  return EVENT_COLORS[colorIndex];
}

export function getEventFillColor(eventId, isHovered, _isSelected) {
  const baseColor = getEventColor(eventId);
  if (isHovered) {
    return lightenColor(baseColor, 0.2);
  }
  return baseColor;
}

export function getEventStrokeStyle(isSelected, isFocused) {
  // Focus takes priority over selection for visual clarity
  if (isFocused) {
    // WCAG 2.1 AA compliant focus indicator (blue with high contrast)
    return { color: '#2563eb', lineWidth: 2 };
  }
  if (isSelected) {
    return { color: '#ffcc00', lineWidth: 2 };
  }
  return { color: 'rgba(255, 255, 255, 0.3)', lineWidth: 1 };
}

export function cullEvents(events, viewportStart, viewportEnd) {
  const visible = [];
  for (const event of events) {
    const duration = event.end !== undefined ? event.end - event.start : 0n;
    if (isVisible(event.start, duration, viewportStart, viewportEnd)) {
      visible.push(event);
    }
  }
  return visible;
}

function updateFPS(now) {
  frameCount++;
  const elapsed = now - fpsUpdateTime;
  if (elapsed >= 500) {
    fps = Math.round((frameCount * 1000) / elapsed);
    frameCount = 0;
    fpsUpdateTime = now;
  }
  _lastFrameTime = now;
}

function drawFPS(_canvasWidth) {
  const text = `${fps} FPS`;
  ctx.font = '12px monospace';
  ctx.fillStyle = fps >= 55 ? '#4ecdc4' : fps >= 30 ? '#ffeaa7' : '#ff6b6b';
  ctx.textAlign = 'left';
  ctx.fillText(text, 10, 20);
}

const TIME_INTERVALS = [
  { value: 1n, label: 's', threshold: 60 },
  { value: 60n, label: 'min', threshold: 3600 },
  { value: 3600n, label: 'h', threshold: 86400 },
  { value: 86400n, label: 'd', threshold: 86400 * 30 },
  { value: YEAR, label: 'y', threshold: Number(YEAR) * 100 },
  { value: YEAR * 100n, label: 'y', threshold: Number(YEAR) * 1000 },
  { value: YEAR * 1000n, label: 'ky', threshold: Number(YEAR) * 1000000 },
  { value: MILLION_YEARS, label: 'Ma', threshold: Number(MILLION_YEARS) * 1000 },
  { value: BILLION_YEARS, label: 'Ga', threshold: Infinity },
];

export function getGridInterval(secondsPerPixel, targetPixelSpacing = 100) {
  const targetSeconds = secondsPerPixel * targetPixelSpacing;

  for (const interval of TIME_INTERVALS) {
    if (targetSeconds < interval.threshold) {
      const multipliers = [1n, 2n, 5n, 10n, 20n, 50n, 100n];
      for (const mult of multipliers) {
        const candidate = interval.value * mult;
        const pixels = Number(candidate) / secondsPerPixel;
        if (pixels >= targetPixelSpacing * 0.5 && pixels <= targetPixelSpacing * 2) {
          return { interval: candidate, unit: interval.label, multiplier: mult };
        }
      }
      return { interval: interval.value, unit: interval.label, multiplier: 1n };
    }
  }
  return { interval: BILLION_YEARS, unit: 'Ga', multiplier: 1n };
}

const MONTH_ABBREVS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Ordinal suffix for century labels: 1 → "1st", 2 → "2nd", 3 → "3rd", 4 → "4th", …
function ordinalSuffix(n) {
  const abs = Math.abs(n);
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${abs}th`;
  const mod10 = abs % 10;
  if (mod10 === 1) return `${abs}st`;
  if (mod10 === 2) return `${abs}nd`;
  if (mod10 === 3) return `${abs}rd`;
  return `${abs}th`;
}

export function formatTime(timeValue, unit, interval, calendar) {
  if (unit === 'Ga') {
    const gaAbs = timeValue < 0n ? -timeValue : timeValue;
    const gaWhole = gaAbs / BILLION_YEARS;
    const gaRemainder = gaAbs % BILLION_YEARS;
    const decimal = Number((gaRemainder * 10n) / BILLION_YEARS);
    const gaNum = Number(gaWhole) + decimal / 10;
    if (timeValue <= 0n) {
      return `${gaNum.toFixed(1)} Bya`;
    }
    return `+${gaNum.toFixed(1)} Ga`;
  }

  if (unit === 'Ma') {
    const maAbs = timeValue < 0n ? -timeValue : timeValue;
    const maWhole = maAbs / MILLION_YEARS;
    const maRemainder = maAbs % MILLION_YEARS;
    const maInt = Number(maWhole);
    if (timeValue <= 0n) {
      if (maInt === 0) {
        const tenths = Number((maRemainder * 10n) / MILLION_YEARS);
        return `0.${tenths} Mya`;
      }
      return `${maInt} Mya`;
    }
    return `+${maInt} Ma`;
  }

  if (unit === 'ky') {
    if (calendar === 'holocene') {
      const yearsFromEpoch = Number(timeValue / YEAR);
      const year = 1970 + yearsFromEpoch;
      return toDisplayYear(year, 'holocene');
    }
    const kyAbs = timeValue < 0n ? -timeValue : timeValue;
    const kyWhole = kyAbs / (YEAR * 1000n);
    const kyInt = Number(kyWhole);
    if (timeValue <= 0n) {
      if (kyInt === 0) {
        const yrs = Number(kyAbs / YEAR);
        return yrs > 0 ? `${yrs.toLocaleString()} BCE` : 'now';
      }
      return `${kyInt} kya`;
    }
    return `${kyInt} ky`;
  }

  const secondsFromEpoch = Number(timeValue);
  if (!Number.isFinite(secondsFromEpoch) || Math.abs(secondsFromEpoch) > 8.64e15 / 1000) {
    const years = timeValue / YEAR;
    return `${Number(years)} y`;
  }

  const date = new Date(secondsFromEpoch * 1000);
  const month = MONTH_ABBREVS[date.getUTCMonth()];

  if (unit === 'y') {
    const yr = date.getUTCFullYear();
    if (calendar === 'holocene') {
      return toDisplayYear(yr, 'holocene');
    }
    if (yr > 0) {
      if (interval !== undefined && interval >= YEAR * 100n) {
        const century = Math.ceil(yr / 100);
        return `${ordinalSuffix(century)} c.`;
      }
      return `${yr}`;
    }
    // BCE: getUTCFullYear() 0 → 1 BCE, -1 → 2 BCE, etc.
    const bceYear = 1 - yr;
    if (interval !== undefined && interval >= YEAR * 100n) {
      const century = Math.ceil(bceYear / 100);
      return `${ordinalSuffix(century)} c. BCE`;
    }
    if (bceYear >= 1000) {
      return `${bceYear.toLocaleString()} BCE`;
    }
    return `${bceYear} BCE`;
  }

  if (unit === 'd') {
    // Day-level resolution: show "Jan 8" — year context comes from neighboring labels
    const day = date.getUTCDate();
    // Show year when it's the first day of the year to provide context
    if (day === 1 && date.getUTCMonth() === 0) {
      return `${date.getUTCFullYear()}`;
    }
    // Show month name when it's the first of the month
    if (day === 1) {
      return `${month} '${String(date.getUTCFullYear()).slice(-2)}`;
    }
    return `${month} ${day}`;
  }

  if (unit === 'h') {
    // Hour-level resolution: show "Jan 8" or time for intra-day
    const day = date.getUTCDate();
    const hours = date.getUTCHours();
    if (hours === 0) {
      return `${month} ${day}`;
    }
    return `${String(hours).padStart(2, '0')}:00`;
  }

  if (unit === 'min') {
    // Minute-level resolution: show HH:MM
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  if (unit === 's') {
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const seconds = date.getUTCSeconds();
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return date.toISOString().substring(0, 19);
}

function drawGridAndLabels(state, width, height, axisY) {
  const secondsPerPixel = state.scale.getSecondsPerPixel();
  const { interval, unit } = getGridInterval(secondsPerPixel);
  const viewportEnd = state.viewportStart + state.scale.pxToTime(width);

  const firstGridTime = (state.viewportStart / interval) * interval;
  const startGrid = firstGridTime < state.viewportStart ? firstGridTime + interval : firstGridTime;

  ctx.strokeStyle = 'rgba(100, 100, 140, 0.3)';
  ctx.lineWidth = 1;
  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#8888aa';
  ctx.textAlign = 'center';

  // Minimum horizontal gap between label centers (in pixels) to avoid overlap
  const LABEL_MIN_GAP = 4;

  let gridTime = startGrid;
  let gridCount = 0;
  const maxGridLines = 200;

  // Track the right edge of the last drawn label so we can skip overlapping ones
  let lastLabelRightEdge = -Infinity;

  // First pass: collect all tick positions and labels
  const ticks = [];
  while (gridTime <= viewportEnd && gridCount < maxGridLines) {
    const x = projectToScreen(gridTime, state.viewportStart, state.scale);
    if (x >= -1 && x <= width + 1) {
      const label = formatTime(gridTime, unit, interval, state.calendar);
      ticks.push({ x, gridTime, label });
    }
    gridTime = gridTime + interval;
    gridCount++;
  }

  // Draw grid lines for all ticks (always draw lines, only skip labels when crowded)
  for (const tick of ticks) {
    ctx.strokeStyle = 'rgba(100, 100, 140, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tick.x, 0);
    ctx.lineTo(tick.x, height);
    ctx.stroke();
  }

  // Draw labels with collision avoidance: measure each label and skip if it
  // would overlap the previously drawn label.
  ctx.fillStyle = '#8888aa';
  ctx.textAlign = 'center';
  for (const tick of ticks) {
    const measured = ctx.measureText ? ctx.measureText(tick.label) : { width: 0 };
    const labelWidth = measured.width;
    const labelLeft = tick.x - labelWidth / 2 - LABEL_MIN_GAP;

    if (labelLeft >= lastLabelRightEdge) {
      ctx.fillText(tick.label, tick.x, axisY + 30);
      lastLabelRightEdge = tick.x + labelWidth / 2 + LABEL_MIN_GAP;
    }
  }
}
