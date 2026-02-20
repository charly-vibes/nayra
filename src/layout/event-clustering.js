import { projectToScreen } from '../core/time.js';

/**
 * Event Clustering System for Macro Zoom Levels
 *
 * Groups nearby events into clusters to reduce visual complexity
 * at macro zoom levels where events would be too dense to distinguish.
 */

// Clustering threshold in pixels - events closer than this will be clustered
const CLUSTER_THRESHOLD_PX = 20;

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
export function clusterEvents(events, viewportStart, scale) {
  if (events.length === 0) {
    return [];
  }

  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) => {
    if (a.start < b.start) return -1;
    if (a.start > b.start) return 1;
    return 0;
  });

  const clusters = [];
  let currentCluster = null;

  for (const event of sortedEvents) {
    const eventX = projectToScreen(event.start, viewportStart, scale);

    if (!currentCluster) {
      // Start a new cluster
      currentCluster = {
        events: [event],
        minX: eventX,
        maxX: eventX,
        minTime: event.start,
        maxTime: event.end !== undefined ? event.end : event.start,
      };
    } else {
      // Check if this event is close enough to the current cluster
      const distanceFromCluster = eventX - currentCluster.maxX;

      if (distanceFromCluster <= CLUSTER_THRESHOLD_PX) {
        // Add to current cluster
        currentCluster.events.push(event);
        currentCluster.maxX = Math.max(currentCluster.maxX, eventX);
        currentCluster.maxTime = event.end !== undefined ?
          (event.end > currentCluster.maxTime ? event.end : currentCluster.maxTime) :
          (event.start > currentCluster.maxTime ? event.start : currentCluster.maxTime);
      } else {
        // Finalize current cluster and start a new one
        if (currentCluster.events.length >= MIN_CLUSTER_SIZE) {
          clusters.push(finalizeCluster(currentCluster));
        } else {
          // Single event - don't cluster
          clusters.push({
            type: 'event',
            event: currentCluster.events[0],
          });
        }

        currentCluster = {
          events: [event],
          minX: eventX,
          maxX: eventX,
          minTime: event.start,
          maxTime: event.end !== undefined ? event.end : event.start,
        };
      }
    }
  }

  // Finalize the last cluster
  if (currentCluster) {
    if (currentCluster.events.length >= MIN_CLUSTER_SIZE) {
      clusters.push(finalizeCluster(currentCluster));
    } else {
      // Single event - don't cluster
      clusters.push({
        type: 'event',
        event: currentCluster.events[0],
      });
    }
  }

  return clusters;
}

/**
 * Finalize a cluster by calculating its centroid and bounds
 *
 * @param {Object} clusterData - Raw cluster data
 * @returns {Object} - Finalized cluster object
 */
function finalizeCluster(clusterData) {
  const { events, minX, maxX, minTime, maxTime } = clusterData;

  // Calculate centroid (average position)
  const centerX = (minX + maxX) / 2;
  const centerTime = minTime + (maxTime - minTime) / 2n;

  return {
    type: 'cluster',
    events,
    count: events.length,
    centerX,
    centerTime,
    minTime,
    maxTime,
    minX,
    maxX,
  };
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
  const dx = x - cluster.centerX;
  const dy = y - markerY;
  const distanceSquared = dx * dx + dy * dy;
  return distanceSquared <= markerRadius * markerRadius;
}
