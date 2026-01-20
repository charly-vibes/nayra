import { RationalScale } from './scale.js';
import { YEAR } from './time.js';

export function createStore(initialState = {}) {
  let state = {
    viewportStart: 0n,
    scale: RationalScale.fromSecondsPerPixel(Number(YEAR)),
    canvasWidth: 800,
    events: [],
    selectedEventIds: new Set(),
    hoveredEventId: null,
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

    case 'SET_EVENTS':
      return {
        ...state,
        events: [...action.events].sort((a, b) =>
          a.start < b.start ? -1 : a.start > b.start ? 1 : 0
        ),
      };

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

    default:
      return state;
  }
}
