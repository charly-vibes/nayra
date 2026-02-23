import { createLiveAnnouncer } from './live-announcer.js';

/**
 * Search-specific ARIA announcer.
 *
 * Provides semantic announcement helpers for search results, navigation,
 * and category filter changes. Accepts either an existing live-announcer
 * instance or a raw HTMLElement.
 *
 * @param {HTMLElement|ReturnType<import('./live-announcer.js').createLiveAnnouncer>} elementOrAnnouncer
 * @param {object} [options] - Forwarded to createLiveAnnouncer if a raw element is passed
 * @param {number} [options.debounceMs=500]
 */
export function createAriaAnnouncer(elementOrAnnouncer, options = {}) {
  const announcer =
    elementOrAnnouncer && typeof elementOrAnnouncer.announce === 'function'
      ? elementOrAnnouncer
      : createLiveAnnouncer(elementOrAnnouncer, options);

  /**
   * Announce search result count.
   * "15 results found for 'moon'" / "1 result found" / "No results found for 'xyz'"
   *
   * @param {number} count
   * @param {string} [query]
   */
  function announceResults(count, query) {
    const plural = count !== 1 ? 's' : '';
    let message;
    if (count === 0) {
      message = query ? `No results found for '${query}'` : 'No results';
    } else {
      message = query
        ? `${count} result${plural} found for '${query}'`
        : `${count} result${plural} found`;
    }
    announcer.announce(message);
  }

  /**
   * Announce navigation position within results.
   * "Result 3 of 15"
   *
   * @param {number} currentIndex - 0-based index
   * @param {number} total
   */
  function announceNavigation(currentIndex, total) {
    if (total === 0) return;
    announcer.announce(`Result ${currentIndex + 1} of ${total}`);
  }

  /**
   * Announce that a category filter was applied.
   * "Category filter applied, 8 results" / "Category filter applied, no results"
   *
   * @param {number} count - Number of matching events after filter
   */
  function announceFilterChange(count) {
    const result =
      count === 0 ? 'no results' : `${count} result${count !== 1 ? 's' : ''}`;
    announcer.announce(`Category filter applied, ${result}`);
  }

  function clear() {
    announcer.clear();
  }

  function destroy() {
    announcer.destroy();
  }

  return { announceResults, announceNavigation, announceFilterChange, clear, destroy };
}
