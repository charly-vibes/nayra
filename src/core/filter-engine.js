/**
 * Category filtering logic.
 *
 * Events can be categorized via `event.category` (string) and/or
 * `event.tags` (array of strings). Both are collected into the category pool.
 */

/**
 * Extract all unique categories and tags from a list of events.
 *
 * @param {Array} events
 * @returns {string[]} Sorted array of unique category/tag strings
 */
export function extractCategories(events) {
  const cats = new Set();
  for (const event of events) {
    if (event.category) cats.add(event.category);
    if (Array.isArray(event.tags)) {
      for (const tag of event.tags) cats.add(tag);
    }
  }
  return [...cats].sort();
}

/**
 * Get the set of category/tag strings that belong to a single event.
 *
 * @param {Object} event
 * @returns {Set<string>}
 */
function eventCategorySet(event) {
  const cats = new Set();
  if (event.category) cats.add(event.category);
  if (Array.isArray(event.tags)) {
    for (const tag of event.tags) cats.add(tag);
  }
  return cats;
}

/**
 * Filter events by selected categories.
 *
 * @param {Array} events
 * @param {string[]} selectedCategories - Categories/tags to match
 * @param {'OR'|'AND'} [mode='OR'] - OR: match any, AND: match all
 * @returns {string[]|null} Matching event IDs, or null if selection is empty (no filter)
 */
export function filterByCategories(events, selectedCategories, mode = 'OR') {
  if (!selectedCategories || selectedCategories.length === 0) return null;

  const results = [];
  for (const event of events) {
    const cats = eventCategorySet(event);
    const matches =
      mode === 'AND'
        ? selectedCategories.every((cat) => cats.has(cat))
        : selectedCategories.some((cat) => cats.has(cat));
    if (matches) results.push(event.id);
  }
  return results;
}

/**
 * Toggle a category in the selected list (add if absent, remove if present).
 *
 * @param {string[]} current - Current selection
 * @param {string} category - Category to toggle
 * @returns {string[]} New selection array
 */
export function toggleCategory(current, category) {
  return current.includes(category)
    ? current.filter((c) => c !== category)
    : [...current, category];
}

/**
 * Compute the effective filter IDs from text search and category filter results.
 * - Both null → null (no filter, show all)
 * - One null → use the other
 * - Both active → intersection
 *
 * @param {string[]|null} searchResultIds
 * @param {string[]|null} categoryFilterIds
 * @returns {string[]|null}
 */
export function computeActiveFilter(searchResultIds, categoryFilterIds) {
  if (searchResultIds === null && categoryFilterIds === null) return null;
  if (searchResultIds !== null && categoryFilterIds !== null) {
    const catSet = new Set(categoryFilterIds);
    return searchResultIds.filter((id) => catSet.has(id));
  }
  return searchResultIds ?? categoryFilterIds;
}
