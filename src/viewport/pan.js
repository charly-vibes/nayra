/**
 * Viewport Pan Module
 * Handles automatic viewport panning to keep focused events visible
 */

const MARGIN_PERCENT = 0.2; // 20% margin from viewport edges

/**
 * Check if an event is visible in the current viewport
 * @param {Object} event - Event to check
 * @param {bigint} viewportStart - Start time of viewport
 * @param {bigint} viewportEnd - End time of viewport
 * @param {number} marginPercent - Margin as percentage (0.2 = 20%)
 * @returns {boolean} True if event is within viewport with margins
 */
export function isEventInViewport(event, viewportStart, viewportEnd, marginPercent = MARGIN_PERCENT) {
  if (!event) return false;

  const viewportRange = viewportEnd - viewportStart;
  const margin = (viewportRange * BigInt(Math.floor(marginPercent * 1000))) / 1000n;

  const visibleStart = viewportStart + margin;
  const visibleEnd = viewportEnd - margin;

  // Event is visible if its midpoint is within the comfortable viewing area
  const eventMidpoint = event.start + (event.end - event.start) / 2n;

  return eventMidpoint >= visibleStart && eventMidpoint <= visibleEnd;
}

/**
 * Calculate new viewport position to show an event with comfortable margins
 * @param {Object} event - Event to show
 * @param {number} canvasWidth - Width of canvas in pixels
 * @param {Object} scale - Current scale
 * @param {bigint} currentStart - Current viewport start
 * @returns {bigint} New viewport start position
 */
export function calculatePanToEvent(event, canvasWidth, scale, currentStart) {
  if (!event) return currentStart;

  const eventMidpoint = event.start + (event.end - event.start) / 2n;

  // Center the event in the viewport
  const halfWidthTime = scale.pxToTime(canvasWidth / 2);
  const newViewportStart = eventMidpoint - halfWidthTime;

  return newViewportStart;
}

/**
 * Initialize auto-pan system that watches for focus changes
 * @param {Object} store - State store
 * @param {Object} focusManager - Focus manager (optional, for testing)
 * @returns {Function} Unsubscribe function
 */
export function initAutoPan(store, focusManager = null) {
  let lastFocusedEventId = null;

  const unsubscribe = store.subscribe((state) => {
    const { focusedEventId, events, viewportStart, scale, canvasWidth } = state;

    // Check if focus changed
    if (focusedEventId === lastFocusedEventId) {
      return;
    }

    lastFocusedEventId = focusedEventId;

    if (!focusedEventId || !events || events.length === 0) {
      return;
    }

    // Find the focused event
    const focusedEvent = events.find((e) => e.id === focusedEventId);
    if (!focusedEvent) {
      return;
    }

    // Check if event is already visible
    const viewportEnd = viewportStart + scale.pxToTime(canvasWidth);
    if (isEventInViewport(focusedEvent, viewportStart, viewportEnd)) {
      return; // Event is already visible, no need to pan
    }

    // Calculate new viewport position to show the event
    const newViewportStart = calculatePanToEvent(focusedEvent, canvasWidth, scale, viewportStart);

    // Dispatch viewport change
    store.dispatch({ type: 'SET_VIEWPORT', viewportStart: newViewportStart, scale });
  });

  return unsubscribe;
}
