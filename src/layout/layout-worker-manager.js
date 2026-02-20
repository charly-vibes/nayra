/**
 * Layout Worker Manager
 *
 * Manages communication with the layout Web Worker for offloading heavy
 * layout computation. Provides fallback to synchronous calculation for
 * small datasets or when workers are unavailable.
 */

import { assignLanes } from './greedy-interval-coloring.js';

const WORKER_THRESHOLD = 10000; // Use worker for datasets >= this size

let worker = null;
let requestIdCounter = 0;
let pendingRequests = new Map(); // requestId -> { resolve, reject }

/**
 * Initialize the Web Worker
 * @returns {boolean} - True if worker was successfully initialized
 */
export function initWorker() {
  if (worker) {
    return true; // Already initialized
  }

  try {
    // Create worker from module
    worker = new Worker(new URL('./layout.worker.js', import.meta.url), {
      type: 'module',
    });

    // Handle messages from worker
    worker.addEventListener('message', handleWorkerMessage);

    // Handle worker errors
    worker.addEventListener('error', handleWorkerError);

    return true;
  } catch (error) {
    console.warn('Failed to initialize layout worker:', error);
    worker = null;
    return false;
  }
}

/**
 * Terminate the Web Worker
 */
export function terminateWorker() {
  if (worker) {
    worker.terminate();
    worker = null;
  }

  // Reject all pending requests
  for (const [requestId, { reject }] of pendingRequests) {
    reject(new Error('Worker terminated'));
  }
  pendingRequests.clear();
}

/**
 * Handle messages from the worker
 */
function handleWorkerMessage(event) {
  const { type, requestId, layouts, laneCount, duration } = event.data;

  if (type === 'layout-result') {
    const request = pendingRequests.get(requestId);
    if (request) {
      // Convert layouts array back to Map
      const layoutsMap = new Map(layouts);

      request.resolve({
        layouts: layoutsMap,
        laneCount,
        duration,
      });

      pendingRequests.delete(requestId);
    }
  }
}

/**
 * Handle worker errors
 */
function handleWorkerError(error) {
  console.error('Layout worker error:', error);

  // Reject all pending requests
  for (const [requestId, { reject }] of pendingRequests) {
    reject(error);
  }
  pendingRequests.clear();
}

/**
 * Calculate layout using Web Worker or synchronous fallback
 *
 * @param {Array} events - Array of events with { id, start, end, ... }
 * @param {Object} viewport - { start, end } (optional, for future optimizations)
 * @param {number} zoomLevel - Current zoom level (optional, for future optimizations)
 * @returns {Promise<Object>} - { layouts: Map, laneCount: number, duration: number }
 */
export async function calculateLayout(events, viewport = null, zoomLevel = 1) {
  // Use synchronous calculation for small datasets
  if (!events || events.length < WORKER_THRESHOLD) {
    const startTime = performance.now();
    const result = assignLanes(events);
    const duration = performance.now() - startTime;

    return {
      layouts: result.layouts,
      laneCount: result.laneCount,
      duration,
    };
  }

  // Ensure worker is initialized
  if (!worker) {
    const initialized = initWorker();
    if (!initialized) {
      // Fallback to synchronous if worker initialization failed
      console.warn('Worker unavailable, using synchronous layout calculation');
      const startTime = performance.now();
      const result = assignLanes(events);
      const duration = performance.now() - startTime;

      return {
        layouts: result.layouts,
        laneCount: result.laneCount,
        duration,
      };
    }
  }

  // Offload to worker
  const requestId = ++requestIdCounter;

  // Serialize events (convert BigInt to strings for transfer)
  const serializedEvents = events.map((event) => ({
    id: event.id,
    start: event.start.toString(),
    end: event.end !== undefined ? event.end.toString() : undefined,
  }));

  // Create promise for this request
  const promise = new Promise((resolve, reject) => {
    pendingRequests.set(requestId, { resolve, reject });

    // Set timeout to prevent hanging
    const timeout = setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        reject(new Error('Layout calculation timeout'));
      }
    }, 5000); // 5 second timeout

    // Clear timeout when request completes
    const originalResolve = resolve;
    const originalReject = reject;

    pendingRequests.set(requestId, {
      resolve: (result) => {
        clearTimeout(timeout);
        originalResolve(result);
      },
      reject: (error) => {
        clearTimeout(timeout);
        originalReject(error);
      },
    });
  });

  // Send request to worker
  worker.postMessage({
    type: 'layout',
    requestId,
    events: serializedEvents,
    viewport,
    zoomLevel,
  });

  return promise;
}

/**
 * Cancel a pending layout request
 * @param {number} requestId - The request ID to cancel
 */
export function cancelLayout(requestId) {
  if (worker && pendingRequests.has(requestId)) {
    worker.postMessage({
      type: 'cancel',
      requestId,
    });

    const request = pendingRequests.get(requestId);
    if (request) {
      request.reject(new Error('Layout calculation cancelled'));
      pendingRequests.delete(requestId);
    }
  }
}

/**
 * Get the current worker threshold
 * @returns {number} - Number of events that triggers worker usage
 */
export function getWorkerThreshold() {
  return WORKER_THRESHOLD;
}

/**
 * Check if worker is initialized and ready
 * @returns {boolean}
 */
export function isWorkerReady() {
  return worker !== null;
}
