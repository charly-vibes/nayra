/**
 * Label Collision Detection
 *
 * Detects and resolves label collisions to maintain readability.
 * Uses spatial hash for efficient near-linear time collision checking.
 */

const LABEL_PADDING = 4; // Horizontal padding around text
const LABEL_HEIGHT = 14; // Approximate height of label text
const MIN_EVENT_WIDTH_FOR_LABEL = 30; // Minimum event width to show label

/**
 * Calculate label priority
 * Higher priority labels are shown when collisions occur
 * @param {Object} event - The event object
 * @param {number} eventWidth - Width of event in pixels
 * @param {number} zoomLevel - Current zoom level (seconds per pixel)
 * @returns {number} - Priority value (higher = more important)
 */
export function calculateLabelPriority(event, eventWidth, zoomLevel) {
  let priority = 0;

  // Wider events have higher priority (more screen space = more important at this zoom)
  priority += Math.min(eventWidth / 10, 50);

  // Events with explicit priority field
  if (event.priority !== undefined) {
    priority += event.priority * 100;
  }

  // Longer duration events have higher priority
  if (event.end !== undefined && event.start !== undefined) {
    const duration = Number(event.end - event.start);
    priority += Math.log10(Math.max(duration, 1)) * 5;
  }

  return priority;
}

/**
 * Measure label dimensions
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} text - Label text
 * @returns {Object} - {width, height}
 */
export function measureLabel(ctx, text) {
  const metrics = ctx.measureText(text);
  return {
    width: metrics.width + LABEL_PADDING * 2,
    height: LABEL_HEIGHT,
  };
}

/**
 * Check if two label bounds overlap
 * @param {Object} a - First label bounds {x, y, width, height}
 * @param {Object} b - Second label bounds {x, y, width, height}
 * @returns {boolean} - True if labels overlap
 */
export function labelsOverlap(a, b) {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

/**
 * Detect label collisions and determine which labels to show
 * Uses spatial hash bucketing for efficient O(N) average case performance
 *
 * @param {Array} events - Array of events with {id, label, bounds: {x, y, width, height}}
 * @param {CanvasRenderingContext2D} ctx - Canvas context for text measurement
 * @param {number} zoomLevel - Current zoom level (seconds per pixel)
 * @param {number} bucketWidth - Spatial hash bucket width (default: 50px)
 * @returns {Set} - Set of event IDs whose labels should be displayed
 */
export function detectLabelCollisions(events, ctx, zoomLevel, bucketWidth = 50) {
  if (!events || events.length === 0) {
    return new Set();
  }

  // Calculate label bounds and priority for each event
  const labelData = [];
  for (const event of events) {
    if (!event.label || event.bounds.width < MIN_EVENT_WIDTH_FOR_LABEL) {
      continue;
    }

    const labelDims = measureLabel(ctx, event.label);
    const labelBounds = {
      x: event.bounds.x,
      y: event.bounds.y + (event.bounds.height - labelDims.height) / 2,
      width: Math.min(labelDims.width, event.bounds.width),
      height: labelDims.height,
    };

    const priority = calculateLabelPriority(event, event.bounds.width, zoomLevel);

    labelData.push({
      eventId: event.id,
      bounds: labelBounds,
      priority,
    });
  }

  // Sort by priority (highest first)
  labelData.sort((a, b) => b.priority - a.priority);

  // Build spatial hash buckets
  const buckets = new Map();
  for (const label of labelData) {
    const startBucket = Math.floor(label.bounds.x / bucketWidth);
    const endBucket = Math.floor((label.bounds.x + label.bounds.width) / bucketWidth);

    for (let bucket = startBucket; bucket <= endBucket; bucket++) {
      if (!buckets.has(bucket)) {
        buckets.set(bucket, []);
      }
      buckets.get(bucket).push(label);
    }
  }

  // Greedily select labels in priority order, skipping overlapping ones
  const visibleLabels = new Set();
  const placedLabels = [];

  for (const label of labelData) {
    // Check only labels in same buckets
    const startBucket = Math.floor(label.bounds.x / bucketWidth);
    const endBucket = Math.floor((label.bounds.x + label.bounds.width) / bucketWidth);

    let hasCollision = false;
    for (let bucket = startBucket; bucket <= endBucket; bucket++) {
      const bucketLabels = buckets.get(bucket) || [];
      for (const other of bucketLabels) {
        if (other.eventId === label.eventId) continue;
        if (!visibleLabels.has(other.eventId)) continue;

        if (labelsOverlap(label.bounds, other.bounds)) {
          hasCollision = true;
          break;
        }
      }
      if (hasCollision) break;
    }

    if (!hasCollision) {
      visibleLabels.add(label.eventId);
      placedLabels.push(label);
    }
  }

  return visibleLabels;
}

/**
 * Render a label on the canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} text - Label text
 * @param {number} x - X position
 * @param {number} y - Y position (center of event)
 * @param {number} maxWidth - Maximum width for label
 * @param {number} eventHeight - Height of the event rectangle
 */
export function renderLabel(ctx, text, x, y, maxWidth, eventHeight) {
  ctx.save();

  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  // Center label vertically in event
  const labelY = y + eventHeight / 2;

  // Clip to event bounds
  ctx.beginPath();
  ctx.rect(x + LABEL_PADDING, y, maxWidth - LABEL_PADDING * 2, eventHeight);
  ctx.clip();

  // Draw text
  ctx.fillText(text, x + LABEL_PADDING, labelY);

  ctx.restore();
}
