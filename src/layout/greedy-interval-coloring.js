/**
 * Greedy Interval Coloring Algorithm for Lane Assignment
 *
 * Assigns overlapping events to lanes using a greedy approach:
 * - Sorts events by start time in O(N log N)
 * - Assigns each event to the first available lane in O(N)
 * - Total complexity: O(N log N)
 *
 * @param {Array} events - Array of event objects with { id, start, end, ... }
 *                         start and end are BigInt timestamps (end may be undefined for point events)
 * @returns {Object} - { layouts: Map<eventId, lane>, laneCount: number }
 */
export function assignLanes(events) {
  if (!events || events.length === 0) {
    return { layouts: new Map(), laneCount: 0 };
  }

  // Step 1: Sort events by start time, with tie-breaking for simultaneous events
  // Longer events (or point events) go in lower lanes for deterministic layout
  const sortedEvents = [...events].sort((a, b) => {
    // Primary sort: start time
    if (a.start < b.start) return -1;
    if (a.start > b.start) return 1;

    // Tie-breaker: for events starting at the same time
    // Sort by duration (longer events first for lower lanes)
    const durationA = getDuration(a);
    const durationB = getDuration(b);

    // Point events (undefined duration) are treated as having infinite duration
    // so they sort first (go to lower lanes)
    if (durationA === null && durationB === null) {
      // Both are point events - use ID for determinism
      return a.id.localeCompare(b.id);
    }
    if (durationA === null) return -1; // Point event goes first
    if (durationB === null) return 1;

    // Both have durations - longer duration first
    if (durationA > durationB) return -1;
    if (durationA < durationB) return 1;

    // Same duration - use ID for determinism
    return a.id.localeCompare(b.id);
  });

  // Step 2: Assign lanes greedily
  const layouts = new Map();
  const laneEndTimes = []; // Track the end time of the last event in each lane

  for (const event of sortedEvents) {
    // Find the first available lane
    const availableLane = findAvailableLane(laneEndTimes, event.start);

    // Assign the event to this lane
    layouts.set(event.id, availableLane);

    // Update the lane's end time
    // Point events (no end time) occupy the instant but don't block future events
    // Use start + 1 to indicate the lane is available after this instant
    if (event.end !== undefined) {
      laneEndTimes[availableLane] = event.end;
    } else {
      laneEndTimes[availableLane] = event.start + 1n;
    }
  }

  return {
    layouts,
    laneCount: laneEndTimes.length,
  };
}

/**
 * Get the duration of an event
 * @param {Object} event - Event with start and optional end
 * @returns {BigInt|null} - Duration in time units, or null for point events
 */
function getDuration(event) {
  if (event.end === undefined) {
    return null; // Point event
  }
  return event.end - event.start;
}

/**
 * Find the first available lane for an event starting at the given time
 * A lane is available if its last event ends at or before the current start time
 *
 * @param {Array<BigInt>} laneEndTimes - Array of end times for each lane
 * @param {BigInt} eventStart - Start time of the event to place
 * @returns {number} - Lane index (0-based)
 */
function findAvailableLane(laneEndTimes, eventStart) {
  // Check each existing lane
  for (let i = 0; i < laneEndTimes.length; i++) {
    if (laneEndTimes[i] <= eventStart) {
      return i; // Lane is available
    }
  }

  // No available lane found - create a new one
  return laneEndTimes.length;
}
