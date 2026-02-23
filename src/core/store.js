import { RationalScale } from './scale.js';
import { YEAR } from './time.js';
import { filterEvents } from './search-engine.js';
import { filterByCategories, toggleCategory, computeActiveFilter } from './filter-engine.js';

export function createStore(initialState = {}) {
  let state = {
    viewportStart: 0n,
    scale: RationalScale.fromSecondsPerPixel(Number(YEAR)),
    canvasWidth: 800,
    events: [],
    searchQuery: '',
    searchResultIds: null,
    currentResultIndex: 0,
    selectedCategories: [],
    filterMode: 'OR',
    categoryFilterIds: null,
    activeFilterIds: null,
    selectedEventIds: new Set(),
    hoveredEventId: null,
    focusedEventId: null,
    focusHistory: [],
    isKeyboardFocusMode: false,
    revision: 0,
    ...initialState,
  };

  const listeners = [];

  function getState() {
    return state;
  }

  function getViewportEnd() {
    const widthTime = state.scale.pxToTime(state.canvasWidth);
    return state.viewportStart + widthTime;
  }

  function dispatch(action) {
    const prevState = state;
    state = reduce(state, action);
    if (state !== prevState) {
      state = { ...state, revision: state.revision + 1 };
      listeners.forEach((fn) => fn(state));
    }
  }

  function subscribe(fn) {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }

  return { getState, getViewportEnd, dispatch, subscribe };
}

function reduce(state, action) {
  switch (action.type) {
    case 'SET_VIEWPORT':
      return { ...state, viewportStart: action.viewportStart, scale: action.scale };

    case 'PAN':
      return { ...state, viewportStart: state.viewportStart + action.offset };

    case 'SET_ZOOM':
      return { ...state, scale: action.scale };

    case 'SET_CANVAS_WIDTH':
      return { ...state, canvasWidth: action.width };

    case 'SET_EVENTS': {
      const sorted = [...action.events].sort((a, b) =>
        a.start < b.start ? -1 : a.start > b.start ? 1 : 0
      );
      const searchResultIds = state.searchQuery ? filterEvents(sorted, state.searchQuery) : null;
      const categoryFilterIds =
        state.selectedCategories.length > 0
          ? filterByCategories(sorted, state.selectedCategories, state.filterMode)
          : null;
      return {
        ...state,
        events: sorted,
        searchResultIds,
        categoryFilterIds,
        activeFilterIds: computeActiveFilter(searchResultIds, categoryFilterIds),
      };
    }

    case 'SEARCH_EVENTS': {
      const query = action.query || '';
      const searchResultIds = filterEvents(state.events, query);
      return {
        ...state,
        searchQuery: query,
        searchResultIds,
        currentResultIndex: 0,
        activeFilterIds: computeActiveFilter(searchResultIds, state.categoryFilterIds),
      };
    }

    case 'CLEAR_SEARCH': {
      return {
        ...state,
        searchQuery: '',
        searchResultIds: null,
        currentResultIndex: 0,
        activeFilterIds: computeActiveFilter(null, state.categoryFilterIds),
      };
    }

    case 'TOGGLE_CATEGORY': {
      const selectedCategories = toggleCategory(state.selectedCategories, action.category);
      const categoryFilterIds = filterByCategories(state.events, selectedCategories, state.filterMode);
      return {
        ...state,
        selectedCategories,
        categoryFilterIds,
        activeFilterIds: computeActiveFilter(state.searchResultIds, categoryFilterIds),
      };
    }

    case 'SET_FILTER_MODE': {
      const categoryFilterIds = filterByCategories(state.events, state.selectedCategories, action.mode);
      return {
        ...state,
        filterMode: action.mode,
        categoryFilterIds,
        activeFilterIds: computeActiveFilter(state.searchResultIds, categoryFilterIds),
      };
    }

    case 'CLEAR_CATEGORIES': {
      return {
        ...state,
        selectedCategories: [],
        categoryFilterIds: null,
        activeFilterIds: computeActiveFilter(state.searchResultIds, null),
      };
    }

    case 'CLEAR_ALL_FILTERS':
      return {
        ...state,
        searchQuery: '',
        searchResultIds: null,
        currentResultIndex: 0,
        selectedCategories: [],
        categoryFilterIds: null,
        activeFilterIds: null,
      };

    case 'RESTORE_FROM_URL': {
      const { searchQuery = '', selectedCategories = [], filterMode = 'OR' } = action;
      const searchResultIds = filterEvents(state.events, searchQuery);
      const categoryFilterIds =
        selectedCategories.length > 0
          ? filterByCategories(state.events, selectedCategories, filterMode)
          : null;
      return {
        ...state,
        searchQuery,
        searchResultIds,
        currentResultIndex: 0,
        selectedCategories,
        filterMode,
        categoryFilterIds,
        activeFilterIds: computeActiveFilter(searchResultIds, categoryFilterIds),
      };
    }

    case 'NEXT_RESULT': {
      if (!state.searchResultIds || state.searchResultIds.length === 0) return state;
      const next = (state.currentResultIndex + 1) % state.searchResultIds.length;
      return { ...state, currentResultIndex: next };
    }

    case 'PREV_RESULT': {
      if (!state.searchResultIds || state.searchResultIds.length === 0) return state;
      const total = state.searchResultIds.length;
      return { ...state, currentResultIndex: (state.currentResultIndex - 1 + total) % total };
    }

    case 'JUMP_TO_RESULT': {
      if (!state.searchResultIds || state.searchResultIds.length === 0) return state;
      const idx = Math.max(0, Math.min(action.index, state.searchResultIds.length - 1));
      return { ...state, currentResultIndex: idx };
    }

    case 'SELECT_EVENT':
      return { ...state, selectedEventIds: new Set([action.eventId]) };

    case 'TOGGLE_EVENT_SELECTION': {
      const next = new Set(state.selectedEventIds);
      if (next.has(action.eventId)) {
        next.delete(action.eventId);
      } else {
        next.add(action.eventId);
      }
      return { ...state, selectedEventIds: next };
    }

    case 'CLEAR_SELECTION':
      return { ...state, selectedEventIds: new Set() };

    case 'SET_HOVER':
      return { ...state, hoveredEventId: action.eventId };

    case 'SET_FOCUS':
      return { ...state, focusedEventId: action.eventId };

    case 'SET_FOCUS_HISTORY':
      return { ...state, focusHistory: action.history };

    case 'SET_KEYBOARD_FOCUS_MODE':
      return { ...state, isKeyboardFocusMode: action.enabled };

    default:
      return state;
  }
}
