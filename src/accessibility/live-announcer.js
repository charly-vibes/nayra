/**
 * Core ARIA live region announcer.
 *
 * Manages debounced writes to an aria-live DOM element so that screen readers
 * receive clean, non-spammy announcements.
 *
 * @param {HTMLElement} element - An aria-live DOM element to write into
 * @param {object} [options]
 * @param {number} [options.debounceMs=500] - Debounce delay in milliseconds
 */
export function createLiveAnnouncer(element, { debounceMs = 500 } = {}) {
  let timer = null;

  function _write(message) {
    element.textContent = message;
  }

  /**
   * Announce a message after the debounce delay.
   * Rapid successive calls cancel earlier ones — only the last is announced.
   *
   * @param {string} message
   */
  function announce(message) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      _write(message);
      timer = null;
    }, debounceMs);
  }

  /**
   * Announce a message immediately without debouncing.
   * Cancels any pending debounced announcement.
   *
   * @param {string} message
   */
  function announceImmediate(message) {
    clearTimeout(timer);
    timer = null;
    _write(message);
  }

  /**
   * Clear the live region and cancel any pending announcement.
   */
  function clear() {
    clearTimeout(timer);
    timer = null;
    element.textContent = '';
  }

  /**
   * Stop any pending timers. Call on teardown.
   */
  function destroy() {
    clearTimeout(timer);
    timer = null;
  }

  return { announce, announceImmediate, clear, destroy };
}
