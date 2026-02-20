/**
 * Layout Web Worker
 *
 * Offloads heavy layout computation to a Web Worker to maintain UI responsiveness
 * for datasets with 10,000+ events.
 *
 * Message Protocol:
 * - Request: { type: 'layout', requestId, events, viewport, zoomLevel }
 * - Response: { type: 'layout-result', requestId, layouts, laneCount, duration }
 * - Cancellation: { type: 'cancel', requestId }
 */

import { assignLanes } from './greedy-interval-coloring.js';

let currentRequestId = null;

/**
 * Handle incoming messages from main thread
 */
self.addEventListener('message', (event) => {
  const { type, requestId, events, viewport, zoomLevel } = event.data;

  if (type === 'cancel') {
    // Mark current request as cancelled
    if (currentRequestId === requestId) {
      currentRequestId = null;
    }
    return;
  }

  if (type === 'layout') {
    // Cancel previous request if it's still running
    currentRequestId = requestId;

    const startTime = performance.now();

    // Deserialize BigInt timestamps from strings
    const deserializedEvents = events.map((event) => ({
      ...event,
      start: BigInt(event.start),
      end: event.end !== undefined ? BigInt(event.end) : undefined,
    }));

    // Check if request was cancelled during deserialization
    if (currentRequestId !== requestId) {
      return; // Discard stale request
    }

    // Perform layout calculation
    const result = assignLanes(deserializedEvents);

    // Check if request was cancelled during computation
    if (currentRequestId !== requestId) {
      return; // Discard stale result
    }

    const duration = performance.now() - startTime;

    // Convert Map to array of [key, value] pairs for serialization
    const layoutsArray = Array.from(result.layouts.entries());

    // Post result back to main thread
    self.postMessage({
      type: 'layout-result',
      requestId,
      layouts: layoutsArray,
      laneCount: result.laneCount,
      duration,
    });

    currentRequestId = null;
  }
});
