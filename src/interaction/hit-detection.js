import { projectToScreen } from '../core/time.js';
import { EVENT_HEIGHT, getClusters } from '../rendering/renderer.js';
import { assignLanes } from '../layout/greedy-interval-coloring.js';
import { getLaneY, DEFAULT_CONFIG as LANE_CONFIG } from '../layout/lane-positioning.js';
import { SpatialHash } from '../layout/spatial-hash.js';
import { isPointInCluster } from '../layout/event-clustering.js';

// Lane-aware hit detection
export function findEventAtPoint(x, y, events, viewportStart, scale, canvasHeight) {
  const axisY = canvasHeight / 2;

  // First check for cluster hits (if in macro zoom mode)
  const clusters = getClusters();
  if (clusters && clusters.length > 0) {
    const CLUSTER_RADIUS = 24; // Match max radius from renderer
    for (const cluster of clusters) {
      if (cluster.type === 'cluster') {
        if (isPointInCluster(x, y, cluster, axisY, CLUSTER_RADIUS)) {
          // Return a special cluster object with __cluster flag
          return {
            __cluster: true,
            minTime: cluster.minTime,
            maxTime: cluster.maxTime,
            count: cluster.count,
            events: cluster.events,
          };
        }
      }
    }
  }

  // Build lane assignments for multilane support
  const { layouts: laneAssignments } = assignLanes(events);

  // Check events in reverse order (last rendered = top of stack)
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    const eventX = projectToScreen(event.start, viewportStart, scale);

    let eventWidth;
    if (event.end !== undefined && event.end > event.start) {
      const endX = projectToScreen(event.end, viewportStart, scale);
      eventWidth = Math.max(endX - eventX, 4);
    } else {
      eventWidth = 4;
    }

    // Get the lane for this event and calculate its Y position
    const lane = laneAssignments.get(event.id) || 0;
    const eventY = getLaneY(lane, axisY, { laneHeight: EVENT_HEIGHT, ...LANE_CONFIG });

    // Check if point is within this event's bounds (inclusive boundaries)
    if (x >= eventX && x <= eventX + eventWidth &&
        y >= eventY && y < eventY + EVENT_HEIGHT) {
      return event;
    }
  }
  return null;
}

/**
 * Find event at point using spatial hash (O(1) average time)
 *
 * @param {number} x - Screen X coordinate
 * @param {number} y - Screen Y coordinate
 * @param {Array} events - Array of events
 * @param {number} viewportStart - Viewport start time
 * @param {Object} scale - Scale object
 * @param {number} canvasHeight - Canvas height in pixels
 * @returns {Object|null} - Event at point, or null
 */
export function findEventAtPointFast(x, y, events, viewportStart, scale, canvasHeight) {
  const axisY = canvasHeight / 2;

  // Build lane assignments
  const { layouts: laneAssignments } = assignLanes(events);

  // Build spatial hash
  const hash = new SpatialHash();
  const getBounds = (event) => {
    const eventX = projectToScreen(event.start, viewportStart, scale);

    let eventWidth;
    if (event.end !== undefined && event.end > event.start) {
      const endX = projectToScreen(event.end, viewportStart, scale);
      eventWidth = Math.max(endX - eventX, 4);
    } else {
      eventWidth = 4;
    }

    const lane = laneAssignments.get(event.id) || 0;
    const eventY = getLaneY(lane, axisY, { laneHeight: EVENT_HEIGHT, ...LANE_CONFIG });

    return { x: eventX, y: eventY, width: eventWidth, height: EVENT_HEIGHT };
  };

  hash.rebuild(events, getBounds);

  // Query spatial hash
  return hash.queryFirst(x, y);
}
