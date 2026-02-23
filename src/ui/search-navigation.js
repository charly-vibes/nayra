/**
 * Search result navigation — pure helpers and UI component.
 */

// ---------------------------------------------------------------------------
// Pure navigation index logic (tested directly)
// ---------------------------------------------------------------------------

/**
 * @param {number} current - Current index
 * @param {number} total - Total result count
 * @returns {number} Next index (wraps around)
 */
export function computeNextIndex(current, total) {
  if (total === 0) return 0;
  return (current + 1) % total;
}

/**
 * @param {number} current - Current index
 * @param {number} total - Total result count
 * @returns {number} Previous index (wraps around)
 */
export function computePrevIndex(current, total) {
  if (total === 0) return 0;
  return (current - 1 + total) % total;
}

/**
 * Compute the viewport start position that centers an event.
 *
 * @param {Object} event - Event object with .start and optional .end (BigInt)
 * @param {number} canvasWidth - Canvas width in pixels
 * @param {Object} scale - RationalScale instance
 * @returns {bigint} New viewportStart
 */
export function computePanToEvent(event, canvasWidth, scale) {
  const center =
    event.end !== undefined && event.end > event.start
      ? event.start + (event.end - event.start) / 2n
      : event.start;

  const halfWidthTime = scale.pxToTime(canvasWidth / 2);
  return center - halfWidthTime;
}

// ---------------------------------------------------------------------------
// UI component
// ---------------------------------------------------------------------------

const BTN_STYLE = `
  background: #3a3a5a;
  border: 1px solid #4a4a6a;
  border-radius: 4px;
  color: #ffffff;
  cursor: pointer;
  font-size: 13px;
  padding: 3px 8px;
`;

/**
 * Create the search result navigation bar (count + prev/next buttons).
 * Returns an object with an `update(currentIndex, total)` method and `destroy()`.
 *
 * @param {HTMLElement} container - Parent element to append into
 * @param {{ onNext: Function, onPrev: Function }} callbacks
 */
export function createSearchNavigation(container, { onNext, onPrev }) {
  const bar = document.createElement('div');
  bar.style.cssText = `
    display: none;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
    font-size: 12px;
    color: #aaaacc;
    font-family: monospace;
  `;

  const countLabel = document.createElement('span');
  countLabel.textContent = '0 results';

  const prevBtn = document.createElement('button');
  prevBtn.textContent = '←';
  prevBtn.title = 'Previous result (Shift+Enter)';
  prevBtn.style.cssText = BTN_STYLE;
  prevBtn.addEventListener('click', () => onPrev());

  const nextBtn = document.createElement('button');
  nextBtn.textContent = '→';
  nextBtn.title = 'Next result (Enter)';
  nextBtn.style.cssText = BTN_STYLE;
  nextBtn.addEventListener('click', () => onNext());

  bar.appendChild(prevBtn);
  bar.appendChild(countLabel);
  bar.appendChild(nextBtn);
  container.appendChild(bar);

  function update(currentIndex, total) {
    if (total === 0) {
      bar.style.display = 'none';
      return;
    }
    bar.style.display = 'flex';
    countLabel.textContent = `${currentIndex + 1} of ${total} results`;
  }

  function hide() {
    bar.style.display = 'none';
  }

  function destroy() {
    container.removeChild(bar);
  }

  return { update, hide, destroy, element: bar };
}
