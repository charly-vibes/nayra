import { projectToScreen } from '../core/time.js';

/**
 * Event Clustering System for Macro Zoom Levels
 *
 * Groups nearby events into clusters to reduce visual complexity
 * at macro zoom levels where events would be too dense to distinguish.
 */

const CLUSTER_THRESHOLD_PX = 24;
const CLUSTER_BASE_RADIUS_PX = 12;
const CLUSTER_MAX_RADIUS_PX = 24;

// Minimum events to form a cluster (single events won't cluster)
const MIN_CLUSTER_SIZE = 2;

/**
 * Cluster nearby events based on screen space proximity
 *
 * @param {Array} events - Array of events to cluster
 * @param {BigInt} viewportStart - Viewport start time
 * @param {Object} scale - Scale object for time projection
 * @returns {Array} - Array of cluster objects
 */
export function clusterEvents(events, viewportStart, scale, viewportWidth = Number.POSITIVE_INFINITY) {
  if (events.length === 0) {
    return [];
  }

  const projectedEvents = events
    .map((event) => projectEvent(event, viewportStart, scale))
    .filter((event) => event.maxX >= 0 && event.minX <= viewportWidth)
    .sort(compareProjectedEvents);

  if (projectedEvents.length === 0) {
    return [];
  }

  const clusters = [];
  let currentCluster = null;

  for (const event of projectedEvents) {
    if (!currentCluster) {
      currentCluster = createClusterCandidate(event);
    } else {
      if (event.minX <= currentCluster.footprintMaxX) {
        addEventToClusterCandidate(currentCluster, event);
      } else {
        clusters.push(finalizeClusterCandidate(currentCluster));
        currentCluster = createClusterCandidate(event);
      }
    }
  }

  if (currentCluster) {
    clusters.push(finalizeClusterCandidate(currentCluster));
  }

  return clusters;
}

function compareProjectedEvents(a, b) {
  if (a.minX !== b.minX) return a.minX - b.minX;
  if (a.maxX !== b.maxX) return a.maxX - b.maxX;
  if (a.event.start < b.event.start) return -1;
  if (a.event.start > b.event.start) return 1;
  return a.event.id.localeCompare(b.event.id);
}

function compareEventsChronologically(a, b) {
  if (a.start < b.start) return -1;
  if (a.start > b.start) return 1;
  const aEnd = a.end ?? a.start;
  const bEnd = b.end ?? b.start;
  if (aEnd < bEnd) return -1;
  if (aEnd > bEnd) return 1;
  return a.id.localeCompare(b.id);
}

function projectEvent(event, viewportStart, scale) {
  const startX = projectToScreen(event.start, viewportStart, scale);
  const endTime = event.end ?? event.start;
  const endX = projectToScreen(endTime, viewportStart, scale);
  return {
    event,
    minX: Math.min(startX, endX),
    maxX: Math.max(startX, endX),
  };
}

function createClusterCandidate(projectedEvent) {
  return {
    projectedEvents: [projectedEvent],
    footprintMinX: projectedEvent.minX - CLUSTER_THRESHOLD_PX,
    footprintMaxX: projectedEvent.maxX + CLUSTER_THRESHOLD_PX,
  };
}

function addEventToClusterCandidate(cluster, projectedEvent) {
  cluster.projectedEvents.push(projectedEvent);
  cluster.footprintMinX = Math.min(cluster.footprintMinX, projectedEvent.minX - CLUSTER_THRESHOLD_PX);
  cluster.footprintMaxX = Math.max(cluster.footprintMaxX, projectedEvent.maxX + CLUSTER_THRESHOLD_PX);
}

function finalizeClusterCandidate(clusterCandidate) {
  const events = clusterCandidate.projectedEvents.map(({ event }) => event).sort(compareEventsChronologically);
  if (events.length < MIN_CLUSTER_SIZE) {
    return {
      type: 'event',
      event: events[0],
    };
  }

  return finalizeCluster(clusterCandidate, events);
}

/**
 * Finalize a cluster by calculating its centroid and bounds
 *
 * @param {Object} clusterData - Raw cluster data
 * @returns {Object} - Finalized cluster object
 */
function finalizeCluster(clusterData, events) {
  let minTime = events[0].start;
  let maxTime = events[0].end ?? events[0].start;
  for (const event of events) {
    if (event.start < minTime) minTime = event.start;
    const eventEnd = event.end ?? event.start;
    if (eventEnd > maxTime) maxTime = eventEnd;
  }

  const centerX = (clusterData.footprintMinX + clusterData.footprintMaxX) / 2;
  const centerTime = minTime + (maxTime - minTime) / 2n;
  const markerRadius = getClusterMarkerRadius(events.length);

  return {
    type: 'cluster',
    events,
    count: events.length,
    centerX,
    centerTime,
    minTime,
    maxTime,
    minX: clusterData.footprintMinX,
    maxX: clusterData.footprintMaxX,
    screenFootprint: {
      minX: clusterData.footprintMinX,
      maxX: clusterData.footprintMaxX,
      width: clusterData.footprintMaxX - clusterData.footprintMinX,
    },
    hitGeometry: {
      centerX,
      radius: markerRadius,
    },
  };
}

export function getClusterMarkerRadius(count) {
  return Math.min(CLUSTER_BASE_RADIUS_PX + Math.log(count) * 2, CLUSTER_MAX_RADIUS_PX);
}

/**
 * Get the expansion factor for cluster-to-event transition
 * Returns 0.0 at MACRO threshold, 1.0 at MESO threshold
 *
 * @param {number} secondsPerPixel - Current zoom level
 * @param {number} macroThreshold - Threshold for macro zoom
 * @param {number} mesoThreshold - Threshold for meso zoom
 * @returns {number} - Expansion factor (0.0 to 1.0)
 */
export function getClusterExpansionFactor(secondsPerPixel, macroThreshold, mesoThreshold) {
  if (secondsPerPixel >= macroThreshold) {
    // Fully clustered
    return 0.0;
  }
  if (secondsPerPixel <= mesoThreshold) {
    // Fully expanded
    return 1.0;
  }

  // Interpolate between thresholds
  const range = macroThreshold - mesoThreshold;
  const position = macroThreshold - secondsPerPixel;
  return position / range;
}

/**
 * Check if a point intersects a cluster marker
 *
 * @param {number} x - Screen X coordinate
 * @param {number} y - Screen Y coordinate
 * @param {Object} cluster - Cluster object
 * @param {number} markerY - Y position of cluster marker
 * @param {number} markerRadius - Radius of cluster marker
 * @returns {boolean} - Whether the point intersects the cluster
 */
export function isPointInCluster(x, y, cluster, markerY, markerRadius) {
  const radius = cluster.hitGeometry?.radius ?? markerRadius;
  const centerX = cluster.hitGeometry?.centerX ?? cluster.centerX;
  const dx = x - centerX;
  const dy = y - markerY;
  const distanceSquared = dx * dx + dy * dy;
  return distanceSquared <= radius * radius;
}
