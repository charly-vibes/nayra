/**
 * Spatial Hash for Efficient Hit Detection
 *
 * Divides the screen into vertical buckets to enable O(1) average time
 * hit detection queries. Events are mapped to all buckets they intersect.
 */

/**
 * Default bucket width in pixels
 */
export const DEFAULT_BUCKET_WIDTH = 50;

/**
 * SpatialHash class for efficient spatial queries
 */
export class SpatialHash {
  /**
   * Create a new SpatialHash
   * @param {number} bucketWidth - Width of each bucket in pixels
   */
  constructor(bucketWidth = DEFAULT_BUCKET_WIDTH) {
    this.bucketWidth = bucketWidth;
    this.buckets = new Map(); // Map<bucketIndex, Set<event>>
    this.eventBounds = new Map(); // Cache event bounds for quick lookup
  }

  /**
   * Clear all data from the spatial hash
   */
  clear() {
    this.buckets.clear();
    this.eventBounds.clear();
  }

  /**
   * Add an event to the spatial hash
   *
   * @param {Object} event - The event to add
   * @param {number} x - Screen X position of event start
   * @param {number} y - Screen Y position of event
   * @param {number} width - Screen width of event
   * @param {number} height - Screen height of event
   */
  insert(event, x, y, width, height) {
    // Cache the bounds for this event
    this.eventBounds.set(event.id, { x, y, width, height });

    // Calculate which buckets this event spans
    const startBucket = this.getBucketIndex(x);
    const endBucket = this.getBucketIndex(x + width);

    // Add event to all buckets it intersects
    for (let bucketIdx = startBucket; bucketIdx <= endBucket; bucketIdx++) {
      if (!this.buckets.has(bucketIdx)) {
        this.buckets.set(bucketIdx, new Set());
      }
      this.buckets.get(bucketIdx).add(event);
    }
  }

  /**
   * Query for events at a specific point
   *
   * @param {number} x - Screen X coordinate
   * @param {number} y - Screen Y coordinate
   * @returns {Array} - Array of events at this position, sorted by priority
   */
  query(x, y) {
    const bucketIdx = this.getBucketIndex(x);
    const bucket = this.buckets.get(bucketIdx);

    if (!bucket || bucket.size === 0) {
      return [];
    }

    // Filter events in this bucket that actually contain the point
    const hits = [];
    for (const event of bucket) {
      const bounds = this.eventBounds.get(event.id);
      if (!bounds) continue;

      if (this.pointInBounds(x, y, bounds)) {
        hits.push(event);
      }
    }

    return hits;
  }

  /**
   * Find the topmost event at a point (for mouse/touch interaction)
   *
   * @param {number} x - Screen X coordinate
   * @param {number} y - Screen Y coordinate
   * @returns {Object|null} - The frontmost event, or null
   */
  queryFirst(x, y) {
    const hits = this.query(x, y);
    if (hits.length === 0) return null;

    // For now, return the last one in the array (drawn last = on top)
    // Future: could sort by z-index, priority, or other criteria
    return hits[hits.length - 1];
  }

  /**
   * Get the bucket index for a screen X coordinate
   *
   * @param {number} x - Screen X coordinate
   * @returns {number} - Bucket index
   */
  getBucketIndex(x) {
    return Math.floor(x / this.bucketWidth);
  }

  /**
   * Check if a point is within bounds
   *
   * @param {number} x - Point X coordinate
   * @param {number} y - Point Y coordinate
   * @param {Object} bounds - Bounds object with x, y, width, height
   * @returns {boolean} - True if point is in bounds
   */
  pointInBounds(x, y, bounds) {
    return (
      x >= bounds.x &&
      x <= bounds.x + bounds.width &&
      y >= bounds.y &&
      y <= bounds.y + bounds.height
    );
  }

  /**
   * Get statistics about the spatial hash (for debugging/profiling)
   *
   * @returns {Object} - Statistics object
   */
  getStats() {
    const bucketCounts = [];
    let totalEvents = 0;
    let maxBucketSize = 0;

    for (const bucket of this.buckets.values()) {
      const size = bucket.size;
      bucketCounts.push(size);
      totalEvents += size;
      maxBucketSize = Math.max(maxBucketSize, size);
    }

    const avgBucketSize = bucketCounts.length > 0
      ? totalEvents / bucketCounts.length
      : 0;

    return {
      bucketCount: this.buckets.size,
      eventCount: this.eventBounds.size,
      totalEventBucketMappings: totalEvents,
      avgEventsPerBucket: avgBucketSize,
      maxEventsPerBucket: maxBucketSize,
      bucketWidth: this.bucketWidth,
    };
  }

  /**
   * Rebuild the spatial hash with new event positions
   * This should complete within 16ms for smooth 60 FPS
   *
   * @param {Array} events - Array of events
   * @param {Function} getBounds - Function to get bounds for an event: (event) => {x, y, width, height}
   */
  rebuild(events, getBounds) {
    const startTime = performance.now();

    this.clear();

    for (const event of events) {
      const bounds = getBounds(event);
      if (bounds) {
        this.insert(event, bounds.x, bounds.y, bounds.width, bounds.height);
      }
    }

    const duration = performance.now() - startTime;
    return { duration, eventCount: events.length };
  }
}

/**
 * Create a spatial hash from events with screen positions
 *
 * @param {Array} events - Array of events with screen positions
 * @param {Function} getBounds - Function to get bounds: (event) => {x, y, width, height}
 * @param {number} bucketWidth - Bucket width in pixels
 * @returns {SpatialHash} - Populated spatial hash
 */
export function createSpatialHash(events, getBounds, bucketWidth = DEFAULT_BUCKET_WIDTH) {
  const hash = new SpatialHash(bucketWidth);
  hash.rebuild(events, getBounds);
  return hash;
}
