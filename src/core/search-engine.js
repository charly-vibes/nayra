/**
 * Core search logic for filtering events by title and description.
 */

/**
 * Filter events by a text query across title and description fields.
 *
 * @param {Array} events - Array of event objects
 * @param {string} query - Search query string
 * @returns {string[]|null} Matching event IDs, or null if query is empty (no filter)
 */
export function filterEvents(events, query) {
  if (!query || query.trim() === '') {
    return null;
  }

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
