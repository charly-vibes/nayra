/**
 * ARIA label generation utilities for timeline events and UI controls.
 *
 * WCAG 2.1 AA:
 *   - 4.1.2 Name, Role, Value (Level A)
 *   - 2.4.6 Headings and Labels (Level AA)
 *   - 1.1.1 Non-text Content (Level A)
 */

import { formatTimeRange } from '../ui/format.js';

/**
 * Build an accessible label for a timeline event.
 * Format: "[title] on [formatted date/range]"
 *
 * @param {Object} event - Timeline event object
 * @returns {string}
 */
export function buildEventAriaLabel(event) {
  const title = event.title || event.label || '';
  const dateRange = formatTimeRange(event);
  return `${title} on ${dateRange}`;
}

/**
 * Build an accessible description for a timeline event.
 * Returns description or notes text, or empty string if neither exists.
 *
 * @param {Object} event - Timeline event object
 * @returns {string}
 */
export function buildEventAriaDescription(event) {
  return event.description || event.notes || '';
}

/**
 * Build an accessible label for a cluster of events.
 * Format: "[N] event(s) in [date range]"
 *
 * @param {number} count - Number of events in the cluster
 * @param {string} dateRange - Formatted date range string
 * @returns {string}
 */
export function buildClusterAriaLabel(count, dateRange) {
  const noun = count === 1 ? 'event' : 'events';
  return `${count} ${noun} in ${dateRange}`;
}
