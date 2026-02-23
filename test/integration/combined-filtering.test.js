/**
 * Integration tests for combined text search + category filtering.
 * Verifies that activeFilterIds correctly reflects the intersection of both filters.
 */
import { describe, it, expect } from 'vitest';
import { createStore } from '../../src/core/store.js';

const events = [
  { id: 'e1', label: 'Battle of Hastings', category: 'Military', tags: ['medieval'] },
  { id: 'e2', label: 'Moon Landing', category: 'Science', tags: ['space', 'usa'] },
  { id: 'e3', label: 'French Revolution', category: 'Political', tags: ['france', 'modern'] },
  { id: 'e4', label: 'Penicillin discovery', category: 'Science', tags: ['medicine'] },
  { id: 'e5', label: 'World War I', category: 'Military', tags: ['modern', 'global'] },
];

function setup() {
  const store = createStore();
  store.dispatch({ type: 'SET_EVENTS', events });
  return store;
}

// --- Category + text search combination ---

describe('combined search and category filtering', () => {
  it('shows all events when no filters are active', () => {
    const store = setup();
    expect(store.getState().activeFilterIds).toBeNull();
  });

  it('applies only text search when no categories are selected', () => {
    const store = setup();
    store.dispatch({ type: 'SEARCH_EVENTS', query: 'Moon' });
    const state = store.getState();
    expect(state.activeFilterIds).toEqual(state.searchResultIds);
    expect(state.activeFilterIds).toContain('e2');
    expect(state.activeFilterIds).not.toContain('e1');
  });

  it('applies only category filter when no search query is set', () => {
    const store = setup();
    store.dispatch({ type: 'TOGGLE_CATEGORY', category: 'Science' });
    const state = store.getState();
    expect(state.activeFilterIds).toEqual(state.categoryFilterIds);
    expect(state.activeFilterIds).toContain('e2');
    expect(state.activeFilterIds).toContain('e4');
    expect(state.activeFilterIds).not.toContain('e1');
  });

  it('intersects text search and category filter when both are active', () => {
    const store = setup();
    store.dispatch({ type: 'SEARCH_EVENTS', query: 'Moon' }); // -> e2
    store.dispatch({ type: 'TOGGLE_CATEGORY', category: 'Science' }); // -> e2, e4
    const state = store.getState();
    // Intersection: only e2 (matches both)
    expect(state.activeFilterIds).toContain('e2');
    expect(state.activeFilterIds).not.toContain('e4'); // Science but not 'Moon'
    expect(state.activeFilterIds).not.toContain('e1'); // not Science
  });

  it('produces empty results when intersection is empty', () => {
    const store = setup();
    store.dispatch({ type: 'SEARCH_EVENTS', query: 'Moon' }); // -> e2
    store.dispatch({ type: 'TOGGLE_CATEGORY', category: 'Military' }); // -> e1, e5
    const state = store.getState();
    expect(state.activeFilterIds).toEqual([]);
  });
});

// --- Filter order correctness ---

describe('filter order correctness', () => {
  it('category → search produces same result as search → category', () => {
    const store1 = setup();
    store1.dispatch({ type: 'TOGGLE_CATEGORY', category: 'Science' });
    store1.dispatch({ type: 'SEARCH_EVENTS', query: 'Moon' });

    const store2 = setup();
    store2.dispatch({ type: 'SEARCH_EVENTS', query: 'Moon' });
    store2.dispatch({ type: 'TOGGLE_CATEGORY', category: 'Science' });

    expect(store1.getState().activeFilterIds).toEqual(store2.getState().activeFilterIds);
  });

  it('results are consistent regardless of toggle order', () => {
    const store = setup();
    store.dispatch({ type: 'TOGGLE_CATEGORY', category: 'Science' });
    store.dispatch({ type: 'TOGGLE_CATEGORY', category: 'Military' });
    store.dispatch({ type: 'SEARCH_EVENTS', query: 'World' }); // -> e5

    const state = store.getState();
    // e5 is Military AND matches 'World'
    expect(state.activeFilterIds).toContain('e5');
    // e2/e4 are Science but don't match 'World'
    expect(state.activeFilterIds).not.toContain('e2');
  });
});

// --- Clear all filters ---

describe('clear all filters', () => {
  it('CLEAR_SEARCH removes text filter but keeps category filter', () => {
    const store = setup();
    store.dispatch({ type: 'TOGGLE_CATEGORY', category: 'Science' });
    store.dispatch({ type: 'SEARCH_EVENTS', query: 'Moon' });
    store.dispatch({ type: 'CLEAR_SEARCH' });

    const state = store.getState();
    expect(state.searchQuery).toBe('');
    expect(state.searchResultIds).toBeNull();
    // Category filter should still be active
    expect(state.activeFilterIds).toEqual(state.categoryFilterIds);
    expect(state.activeFilterIds).toContain('e2');
    expect(state.activeFilterIds).toContain('e4');
  });

  it('CLEAR_CATEGORIES removes category filter but keeps search', () => {
    const store = setup();
    store.dispatch({ type: 'SEARCH_EVENTS', query: 'Moon' });
    store.dispatch({ type: 'TOGGLE_CATEGORY', category: 'Science' });
    store.dispatch({ type: 'CLEAR_CATEGORIES' });

    const state = store.getState();
    expect(state.selectedCategories).toEqual([]);
    // Search filter should still be active
    expect(state.activeFilterIds).toEqual(state.searchResultIds);
  });

  it('CLEAR_ALL_FILTERS removes both filters simultaneously', () => {
    const store = setup();
    store.dispatch({ type: 'TOGGLE_CATEGORY', category: 'Science' });
    store.dispatch({ type: 'SEARCH_EVENTS', query: 'Moon' });
    store.dispatch({ type: 'CLEAR_ALL_FILTERS' });

    const state = store.getState();
    expect(state.searchQuery).toBe('');
    expect(state.searchResultIds).toBeNull();
    expect(state.selectedCategories).toEqual([]);
    expect(state.categoryFilterIds).toBeNull();
    expect(state.activeFilterIds).toBeNull();
  });
});

// --- Empty results handling ---

describe('empty results handling', () => {
  it('handles empty events array gracefully', () => {
    const store = createStore();
    store.dispatch({ type: 'SEARCH_EVENTS', query: 'anything' });
    store.dispatch({ type: 'TOGGLE_CATEGORY', category: 'Science' });
    expect(store.getState().activeFilterIds).toEqual([]);
  });

  it('handles no-match search gracefully', () => {
    const store = setup();
    store.dispatch({ type: 'SEARCH_EVENTS', query: 'zzznomatch' });
    expect(store.getState().activeFilterIds).toEqual([]);
    expect(store.getState().searchResultIds).toEqual([]);
  });
});

// --- State synchronization ---

describe('state synchronization', () => {
  it('activeFilterIds updates when events change with active filters', () => {
    const store = setup();
    store.dispatch({ type: 'TOGGLE_CATEGORY', category: 'Science' });

    // Replace events with new set
    const newEvents = [
      { id: 'e10', label: 'Nuclear Fission', category: 'Science', tags: [] },
    ];
    store.dispatch({ type: 'SET_EVENTS', events: newEvents });

    const state = store.getState();
    expect(state.activeFilterIds).toContain('e10');
    expect(state.activeFilterIds).not.toContain('e2');
  });
});

// --- Performance benchmark ---

describe('combined filtering performance', () => {
  it('completes combined filtering for 10,000 events in under 10ms', () => {
    const largeEvents = Array.from({ length: 10000 }, (_, i) => ({
      id: `e${i}`,
      label: `Event ${i} ${i % 2 === 0 ? 'Apollo' : 'Discovery'}`,
      category: i % 3 === 0 ? 'Science' : i % 3 === 1 ? 'Military' : 'Political',
      tags: ['tag1'],
      start: BigInt(i),
    }));

    const store = createStore();
    store.dispatch({ type: 'SET_EVENTS', events: largeEvents });

    const start = performance.now();
    store.dispatch({ type: 'TOGGLE_CATEGORY', category: 'Science' });
    store.dispatch({ type: 'SEARCH_EVENTS', query: 'Apollo' });
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(10);
    // Should have results
    expect(store.getState().activeFilterIds).not.toBeNull();
  });
});
