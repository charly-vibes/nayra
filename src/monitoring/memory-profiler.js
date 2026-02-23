/**
 * Memory profiling utilities for leak detection (nayra-r1i.4)
 *
 * Designed for Node.js test environments with --expose-gc.
 * In the browser, heap size is read from performance.memory (Chrome-only).
 */

// ---------------------------------------------------------------------------
// GC helpers
// ---------------------------------------------------------------------------

/**
 * Request a full GC pass if the runtime supports it.
 * In Node, requires --expose-gc flag. In the browser this is a no-op.
 */
export function forceGC() {
  if (typeof globalThis.gc === 'function') globalThis.gc();
}

// ---------------------------------------------------------------------------
// Heap measurement
// ---------------------------------------------------------------------------

/**
 * Capture current heap usage in bytes.
 * Node: uses process.memoryUsage().heapUsed
 * Browser (Chrome): uses performance.memory.usedJSHeapSize
 * Others: returns 0 (measurement not available)
 *
 * @returns {number} Heap bytes used, or 0 if unavailable.
 */
export function captureHeapBytes() {
  if (typeof process !== 'undefined' && typeof process.memoryUsage === 'function') {
    return process.memoryUsage().heapUsed;
  }
  if (typeof performance !== 'undefined' && performance.memory) {
    return performance.memory.usedJSHeapSize;
  }
  return 0;
}

/**
 * Convert bytes to mebibytes (MiB), rounded to 2 decimal places.
 * @param {number} bytes
 * @returns {number}
 */
export function bytesToMB(bytes) {
  return Math.round((bytes / (1024 * 1024)) * 100) / 100;
}

/**
 * Measure heap growth (in MiB) between two snapshots.
 *
 * @param {number} beforeBytes - result of captureHeapBytes() before the operation
 * @param {number} afterBytes  - result of captureHeapBytes() after the operation
 * @returns {number} Growth in MiB (can be negative if GC reclaimed more)
 */
export function measureGrowthMB(beforeBytes, afterBytes) {
  return bytesToMB(afterBytes - beforeBytes);
}

// ---------------------------------------------------------------------------
// Event-listener tracking
// ---------------------------------------------------------------------------

/**
 * Create a listener tracker that wraps addEventListener / removeEventListener
 * on a given target and counts live registrations.
 *
 * @param {EventTarget} target
 * @returns {{ count: () => number, restore: () => void }}
 */
export function createListenerTracker(target) {
  const live = new Map(); // type → Set of listeners
  const origAdd    = target.addEventListener.bind(target);
  const origRemove = target.removeEventListener.bind(target);

  target.addEventListener = (type, listener, options) => {
    if (!live.has(type)) live.set(type, new Set());
    live.get(type).add(listener);
    origAdd(type, listener, options);
  };

  target.removeEventListener = (type, listener, options) => {
    live.get(type)?.delete(listener);
    origRemove(type, listener, options);
  };

  return {
    /** Total number of live listener registrations across all event types. */
    count() {
      let total = 0;
      for (const set of live.values()) total += set.size;
      return total;
    },
    /** Restore original methods. */
    restore() {
      target.addEventListener    = origAdd;
      target.removeEventListener = origRemove;
    },
  };
}

// ---------------------------------------------------------------------------
// Lifecycle leak detector (WeakRef-based)
// ---------------------------------------------------------------------------

/**
 * Returns a simple object registry backed by WeakRef.
 * Use it to verify that objects are eventually GC'd after going out of scope.
 *
 * @returns {{ register: (obj: object) => void, countAlive: () => number }}
 */
export function createWeakRegistry() {
  const refs = [];
  return {
    /** Register an object to be tracked. */
    register(obj) {
      refs.push(new WeakRef(obj));
    },
    /**
     * Count how many registered objects are still alive.
     * Call forceGC() before this for reliable results.
     */
    countAlive() {
      return refs.filter((r) => r.deref() !== undefined).length;
    },
  };
}
