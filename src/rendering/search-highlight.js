/**
 * Search highlighting utilities for the canvas renderer.
 *
 * Pure logic lives here (getMatchSpans, getEventSearchState, getSearchAlpha).
 * Canvas rendering (renderHighlightedLabel) mirrors the signature of renderLabel
 * in label-collision.js, adding an optional highlightQuery parameter.
 */

const LABEL_PADDING = 4;
const HIGHLIGHT_COLOR = 'rgba(255, 230, 0, 0.6)';

/**
 * Find all match positions of a query within text (case-insensitive).
 * Uses plain string search so special characters are matched literally.
 *
 * @param {string} text - Text to search within
 * @param {string} query - Search query
 * @returns {Array<{start: number, end: number}>} Match positions
 */
export function getMatchSpans(text, query) {
  if (!text || !query || query.trim() === '') return [];

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const spans = [];
  let idx = 0;

  while (idx < lowerText.length) {
    const matchIdx = lowerText.indexOf(lowerQuery, idx);
    if (matchIdx === -1) break;
    spans.push({ start: matchIdx, end: matchIdx + lowerQuery.length });
    idx = matchIdx + lowerQuery.length;
  }

  return spans;
}

/**
 * Determine the search state of an event.
 *
 * @param {string} eventId - Event ID
 * @param {string[]|Set<string>|null} searchResultIds
 *   null/undefined = no active search; array or Set = filtered results
 * @returns {'none'|'match'|'dim'}
 */
export function getEventSearchState(eventId, searchResultIds) {
  if (searchResultIds === null || searchResultIds === undefined) return 'none';
  const found =
    searchResultIds instanceof Set
      ? searchResultIds.has(eventId)
      : searchResultIds.includes(eventId);
  return found ? 'match' : 'dim';
}

/**
 * Get the canvas globalAlpha value for a given search state.
 *
 * @param {'none'|'match'|'dim'} searchState
 * @returns {number} Alpha value (0.3 for dim, 1.0 otherwise)
 */
export function getSearchAlpha(searchState) {
  return searchState === 'dim' ? 0.3 : 1.0;
}

/**
 * Render a label with optional search match highlighting.
 * Drop-in replacement for renderLabel in label-collision.js when a search is active.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} text - Label text
 * @param {number} x - X position of the event bar
 * @param {number} y - Y position of the event bar
 * @param {number} maxWidth - Maximum width for the label
 * @param {number} eventHeight - Height of the event rectangle
 * @param {string} [highlightQuery=''] - Active search query (empty = no highlighting)
 */
export function renderHighlightedLabel(ctx, text, x, y, maxWidth, eventHeight, highlightQuery = '') {
  if (!text) return;

  ctx.save();

  ctx.font = '11px system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  const labelY = y + eventHeight / 2;
  const textX = x + LABEL_PADDING;

  // Clip to event bounds
  ctx.beginPath();
  ctx.rect(textX, y, maxWidth - LABEL_PADDING * 2, eventHeight);
  ctx.clip();

  const spans = getMatchSpans(text, highlightQuery);

  if (spans.length === 0) {
    // No highlights — plain render
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, textX, labelY);
  } else {
    // Draw yellow highlight rects behind matching segments
    ctx.fillStyle = HIGHLIGHT_COLOR;
    for (const span of spans) {
      const prefix = text.substring(0, span.start);
      const match = text.substring(span.start, span.end);
      const prefixWidth = ctx.measureText(prefix).width;
      const matchWidth = ctx.measureText(match).width;
      const highlightH = eventHeight * 0.8;
      ctx.fillRect(
        textX + prefixWidth,
        y + (eventHeight - highlightH) / 2,
        matchWidth,
        highlightH
      );
    }

    // Draw label text on top
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, textX, labelY);
  }

  ctx.restore();
}
