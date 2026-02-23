/**
 * Action type constants and action creator functions.
 */

export const SEARCH_EVENTS = 'SEARCH_EVENTS';
export const CLEAR_SEARCH = 'CLEAR_SEARCH';
export const NEXT_RESULT = 'NEXT_RESULT';
export const PREV_RESULT = 'PREV_RESULT';
export const JUMP_TO_RESULT = 'JUMP_TO_RESULT';

/** Dispatch a text search query against loaded events. */
export function searchEvents(query) {
  return { type: SEARCH_EVENTS, query };
}

/** Clear the active search, restoring full event visibility. */
export function clearSearch() {
  return { type: CLEAR_SEARCH };
}

/** Navigate to the next search result (wraps around). */
export function nextResult() {
  return { type: NEXT_RESULT };
}

/** Navigate to the previous search result (wraps around). */
export function prevResult() {
  return { type: PREV_RESULT };
}

/** Jump to a specific result by index. */
export function jumpToResult(index) {
  return { type: JUMP_TO_RESULT, index };
}

export const TOGGLE_CATEGORY = 'TOGGLE_CATEGORY';
export const SET_FILTER_MODE = 'SET_FILTER_MODE';
export const CLEAR_CATEGORIES = 'CLEAR_CATEGORIES';

/** Toggle a category filter on or off. */
export function toggleCategory(category) {
  return { type: TOGGLE_CATEGORY, category };
}

/** Set the filter mode (OR or AND). */
export function setFilterMode(mode) {
  return { type: SET_FILTER_MODE, mode };
}

/** Clear all active category filters. */
export function clearCategories() {
  return { type: CLEAR_CATEGORIES };
}

export const CLEAR_ALL_FILTERS = 'CLEAR_ALL_FILTERS';

/** Clear both text search and category filters simultaneously. */
export function clearAllFilters() {
  return { type: CLEAR_ALL_FILTERS };
}
