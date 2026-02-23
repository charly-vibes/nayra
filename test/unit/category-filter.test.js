import { describe, it, expect } from 'vitest';
import { extractCategories, filterByCategories } from '../../src/core/filter-engine.js';
import { createStore } from '../../src/core/store.js';

// Test events
const events = [
  { id: 'e1', label: 'Battle of Hastings', category: 'Military', tags: ['medieval', 'england'] },
  { id: 'e2', label: 'Moon Landing', category: 'Science', tags: ['space', 'usa'] },
  { id: 'e3', label: 'French Revolution', category: 'Political', tags: ['france', 'modern'] },
  { id: 'e4', label: 'Penicillin', category: 'Science', tags: ['medicine'] },
  { id: 'e5', label: 'WWI', category: 'Military', tags: ['modern', 'global'] },
];

// --- extractCategories ---

describe('extractCategories', () => {
  it('returns unique categories from event.category', () => {
    const cats = extractCategories(events);
    expect(cats).toContain('Military');
    expect(cats).toContain('Science');
    expect(cats).toContain('Political');
  });

  it('returns unique tags from event.tags', () => {
    const cats = extractCategories(events);
    expect(cats).toContain('medieval');
    expect(cats).toContain('space');
    expect(cats).toContain('modern');
  });

  it('does not return duplicate categories', () => {
    const cats = extractCategories(events);
    const militaryCount = cats.filter((c) => c === 'Military').length;
    expect(militaryCount).toBe(1);
  });

  it('returns categories in sorted order', () => {
    const cats = extractCategories(events);
    const sorted = [...cats].sort();
    expect(cats).toEqual(sorted);
  });

  it('returns empty array for empty event list', () => {
    expect(extractCategories([])).toEqual([]);
  });

  it('handles events with no category or tags', () => {
    const sparse = [{ id: 'e1', label: 'Event' }];
    expect(extractCategories(sparse)).toEqual([]);
  });

  it('handles events with only tags (no category)', () => {
    const sparse = [{ id: 'e1', label: 'Event', tags: ['science'] }];
    expect(extractCategories(sparse)).toContain('science');
  });

  it('handles events with only category (no tags)', () => {
    const sparse = [{ id: 'e1', label: 'Event', category: 'Science' }];
    expect(extractCategories(sparse)).toContain('Science');
  });
});

// --- filterByCategories ---

describe('filterByCategories - empty selection', () => {
  it('returns null for empty selectedCategories', () => {
    expect(filterByCategories(events, [])).toBeNull();
  });

  it('returns null for null selectedCategories', () => {
    expect(filterByCategories(events, null)).toBeNull();
  });
});

describe('filterByCategories - OR logic', () => {
  it('returns events matching any selected category', () => {
    const result = filterByCategories(events, ['Military'], 'OR');
    expect(result).toContain('e1');
    expect(result).toContain('e5');
    expect(result).not.toContain('e2');
    expect(result).not.toContain('e3');
  });

  it('returns events matching any of multiple categories', () => {
    const result = filterByCategories(events, ['Military', 'Political'], 'OR');
    expect(result).toContain('e1'); // Military
    expect(result).toContain('e3'); // Political
    expect(result).toContain('e5'); // Military
    expect(result).not.toContain('e2'); // Science only
    expect(result).not.toContain('e4'); // Science only
  });

  it('matches by tag as well as category', () => {
    const result = filterByCategories(events, ['modern'], 'OR');
    expect(result).toContain('e3'); // tag: modern
    expect(result).toContain('e5'); // tag: modern
  });

  it('OR is the default mode', () => {
    const withMode = filterByCategories(events, ['Military'], 'OR');
    const withDefault = filterByCategories(events, ['Military']);
    expect(withDefault).toEqual(withMode);
  });
});

describe('filterByCategories - AND logic', () => {
  it('returns events matching ALL selected categories', () => {
    // e5 has category: Military AND tag: modern
    const result = filterByCategories(events, ['Military', 'modern'], 'AND');
    expect(result).toContain('e5');
    expect(result).not.toContain('e1'); // Military but not modern
    expect(result).not.toContain('e3'); // modern but not Military
  });

  it('returns empty array when no events match all categories', () => {
    const result = filterByCategories(events, ['Military', 'Science'], 'AND');
    expect(result).toEqual([]);
  });
});

// --- Store integration ---

describe('TOGGLE_CATEGORY action', () => {
  it('adds a category to selectedCategories', () => {
    const store = createStore();
    store.dispatch({ type: 'SET_EVENTS', events });
    store.dispatch({ type: 'TOGGLE_CATEGORY', category: 'Military' });
    expect(store.getState().selectedCategories).toContain('Military');
  });

  it('removes a category when toggled again', () => {
    const store = createStore();
    store.dispatch({ type: 'SET_EVENTS', events });
    store.dispatch({ type: 'TOGGLE_CATEGORY', category: 'Military' });
    store.dispatch({ type: 'TOGGLE_CATEGORY', category: 'Military' });
    expect(store.getState().selectedCategories).not.toContain('Military');
  });

  it('updates categoryFilterIds after toggle', () => {
    const store = createStore();
    store.dispatch({ type: 'SET_EVENTS', events });
    store.dispatch({ type: 'TOGGLE_CATEGORY', category: 'Science' });
    const state = store.getState();
    expect(state.categoryFilterIds).toContain('e2'); // Moon Landing
    expect(state.categoryFilterIds).toContain('e4'); // Penicillin
    expect(state.categoryFilterIds).not.toContain('e1');
  });

  it('sets categoryFilterIds to null when all categories cleared', () => {
    const store = createStore();
    store.dispatch({ type: 'SET_EVENTS', events });
    store.dispatch({ type: 'TOGGLE_CATEGORY', category: 'Science' });
    store.dispatch({ type: 'TOGGLE_CATEGORY', category: 'Science' }); // untoggle
    expect(store.getState().categoryFilterIds).toBeNull();
  });
});

describe('SET_FILTER_MODE action', () => {
  it('switches to AND mode', () => {
    const store = createStore();
    store.dispatch({ type: 'SET_FILTER_MODE', mode: 'AND' });
    expect(store.getState().filterMode).toBe('AND');
  });

  it('recomputes categoryFilterIds when mode changes', () => {
    const store = createStore();
    store.dispatch({ type: 'SET_EVENTS', events });
    store.dispatch({ type: 'TOGGLE_CATEGORY', category: 'Military' });
    store.dispatch({ type: 'TOGGLE_CATEGORY', category: 'modern' });

    store.dispatch({ type: 'SET_FILTER_MODE', mode: 'OR' });
    const orResult = store.getState().categoryFilterIds;

    store.dispatch({ type: 'SET_FILTER_MODE', mode: 'AND' });
    const andResult = store.getState().categoryFilterIds;

    // AND result should be smaller or equal to OR result
    expect(andResult.length).toBeLessThanOrEqual(orResult.length);
  });
});

describe('CLEAR_CATEGORIES action', () => {
  it('clears selectedCategories and categoryFilterIds', () => {
    const store = createStore();
    store.dispatch({ type: 'SET_EVENTS', events });
    store.dispatch({ type: 'TOGGLE_CATEGORY', category: 'Military' });
    store.dispatch({ type: 'CLEAR_CATEGORIES' });
    const state = store.getState();
    expect(state.selectedCategories).toEqual([]);
    expect(state.categoryFilterIds).toBeNull();
  });
});

describe('activeFilterIds integration', () => {
  it('is null when no search and no categories are active', () => {
    const store = createStore();
    expect(store.getState().activeFilterIds).toBeNull();
  });

  it('equals searchResultIds when only search is active', () => {
    const store = createStore();
    store.dispatch({ type: 'SET_EVENTS', events });
    store.dispatch({ type: 'SEARCH_EVENTS', query: 'Battle' });
    const state = store.getState();
    expect(state.activeFilterIds).toEqual(state.searchResultIds);
  });

  it('equals categoryFilterIds when only categories are active', () => {
    const store = createStore();
    store.dispatch({ type: 'SET_EVENTS', events });
    store.dispatch({ type: 'TOGGLE_CATEGORY', category: 'Science' });
    const state = store.getState();
    expect(state.activeFilterIds).toEqual(state.categoryFilterIds);
  });

  it('is the intersection when both search and categories are active', () => {
    const store = createStore();
    store.dispatch({ type: 'SET_EVENTS', events });
    store.dispatch({ type: 'SEARCH_EVENTS', query: 'Moon' }); // -> e2
    store.dispatch({ type: 'TOGGLE_CATEGORY', category: 'Science' }); // -> e2, e4
    const state = store.getState();
    // Intersection: e2 (Science AND matches Moon)
    expect(state.activeFilterIds).toContain('e2');
    expect(state.activeFilterIds).not.toContain('e4'); // doesn't match Moon
    expect(state.activeFilterIds).not.toContain('e1'); // not Science
  });
});
