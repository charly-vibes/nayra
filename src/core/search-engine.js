/**
 * Core search logic for filtering events by title and description.
 *
 * For datasets above INDEX_THRESHOLD, an InvertedIndex is used automatically
 * for better performance. For smaller datasets, a simple linear scan is used.
 */
import { InvertedIndex } from './inverted-index.js';

const INDEX_THRESHOLD = 5000; // Use inverted index above this event count

// Module-level index — rebuilt lazily when events change
let _cachedIndex = null;
let _cachedEvents = null;

function getIndex(events) {
  if (_cachedEvents !== events) {
    _cachedIndex = new InvertedIndex();
    _cachedIndex.build(events);
    _cachedEvents = events;
  }
  return _cachedIndex;
}

/**
 * Filter events by a text query across title/label and description fields.
 * Automatically uses an inverted index for large datasets.
 *
 * @param {Array} events - Array of event objects
 * @param {string} query - Search query string
 * @returns {string[]|null} Matching event IDs, or null if query is empty (no filter)
 */
export function filterEvents(events, query) {
  if (!query || query.trim() === '') {
    return null;
  }

  if (events.length >= INDEX_THRESHOLD) {
    return getIndex(events).search(query);
  }

  // Linear scan for small datasets
  const lowerQuery = query.toLowerCase();
  const results = [];

  for (const event of events) {
    const title = (event.title || event.label || '').toLowerCase();
    const description = (event.description || '').toLowerCase();
    if (title.includes(lowerQuery) || description.includes(lowerQuery)) {
      results.push(event.id);
    }
  }

  return results;
}

/** Invalidate the cached index (call when events array reference changes). */
export function invalidateSearchIndex() {
  _cachedIndex = null;
  _cachedEvents = null;
}

/**
 * Create a debounced version of a function.
 * The returned function exposes a `.cancel()` method to abort a pending call.
 *
 * @param {Function} fn - Function to debounce
 * @param {number} [delay=150] - Debounce delay in milliseconds
 * @returns {Function} Debounced function with `.cancel()` method
 */
export function createDebouncedSearch(fn, delay = 150) {
  let timer = null;

  const debounced = function (...args) {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, delay);
  };

  debounced.cancel = function () {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return debounced;
}
