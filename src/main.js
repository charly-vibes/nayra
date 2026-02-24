import { createStore } from './core/store.js';
import { init as initRenderer, draw } from './rendering/renderer.js';
import { initInput, fitToContent, resetZoom } from './interaction/input.js';
import { createFocusManager } from './interaction/focus-manager.js';
import { generateSampleEvents } from './data/samples.js';
import { loadExample, loadFromFile } from './data/loader.js';
import { DEFAULT_EXAMPLE } from './data/examples.js';
import { createSearchBar } from './ui/searchbar.js';
import { createHelpMenu } from './ui/help.js';
import { createHelpButton } from './ui/help-button.js';
import { createZoomControls } from './ui/zoom-controls.js';
import { createTooltip } from './ui/tooltip.js';
import { createEventPanel } from './ui/event-panel.js';
import { createContextMenu, buildEventActions } from './ui/context-menu.js';
import { createDropzone } from './ui/dropzone.js';
import { parseTimeQuery } from './core/time-parser.js';
import { RationalScale } from './core/scale.js';
import { computePanToEvent } from './ui/search-navigation.js';
import { createCategoryFilter } from './ui/category-filter.js';
import { extractCategories } from './core/filter-engine.js';
import { encodeAllState, decodeSearchState, decodeViewportState } from './core/url-state.js';
import { createDebouncedSearch } from './core/search-engine.js';
import { createDomSync } from './accessibility/dom-sync.js';
import { createLiveAnnouncer } from './accessibility/live-announcer.js';
import { createAriaAnnouncer } from './accessibility/aria-announcer.js';
import { createSkipLinks } from './accessibility/skip-links.js';
import { detectFeatures, REQUIRED_FEATURES } from './utils/feature-detection.js';
import { createBrowserError } from './ui/browser-error.js';

// Feature detection: show a graceful error UI if required APIs are missing
const features = detectFeatures();
const missing = REQUIRED_FEATURES.filter(key => !features[key].supported);
if (missing.length > 0) {
  createBrowserError(document.body, missing);
  throw new Error(`Nayra: missing required browser features: ${missing.join(', ')}`);
}

const canvas = document.getElementById('timeline-canvas');
const store = createStore();

// Skip navigation links: first focusable elements on the page (WCAG 2.4.1)
createSkipLinks(document.body, [
  { label: 'Skip to timeline', targetId: 'timeline-canvas' },
  { label: 'Skip to search', onClick: () => { searchBar.show(); } },
  { label: 'Skip to help', targetId: 'help-button' },
]);

// Create focus manager for keyboard navigation
const ariaLiveElement = document.getElementById('aria-live');
const focusManager = createFocusManager(store, ariaLiveElement);

// ARIA announcer for search results and filter changes
const liveAnnouncer = createLiveAnnouncer(ariaLiveElement, { debounceMs: 500 });
const ariaAnnouncer = createAriaAnnouncer(liveAnnouncer);

initRenderer(canvas, store.dispatch);

const searchBar = createSearchBar(document.body, {
  onSubmit: (query) => {
    const result = parseTimeQuery(query);
    if (result.success) {
      const state = store.getState();
      const targetWidth = state.canvasWidth * 0.8;
      const secondsPerPixel = Number(result.span) / targetWidth;
      const newScale = RationalScale.fromSecondsPerPixel(secondsPerPixel);
      const halfWidthTime = newScale.pxToTime(state.canvasWidth / 2);
      const viewportStart = result.time - halfWidthTime;
      store.dispatch({ type: 'SET_VIEWPORT', viewportStart, scale: newScale });
    }
  },
  onSearch: (query) => {
    store.dispatch({ type: 'SEARCH_EVENTS', query });
  },
  onNext: () => {
    store.dispatch({ type: 'NEXT_RESULT' });
  },
  onPrev: () => {
    store.dispatch({ type: 'PREV_RESULT' });
  },
  onClearAll: () => {
    store.dispatch({ type: 'CLEAR_ALL_FILTERS' });
  },
});

async function handleExampleLoad(exampleOrFile) {
  let result;
  if (typeof exampleOrFile === 'string') {
    result = await loadExample(exampleOrFile);
  } else {
    result = await loadFromFile(exampleOrFile);
  }

  if (result.errors.length > 0) {
    console.warn(result.summary, result.errors);
  }

  if (result.events.length > 0) {
    store.dispatch({ type: 'SET_EVENTS', events: result.events });
    // Fit all content in view after loading
    const state = store.getState();
    const { viewportStart, scale } = fitToContent(result.events, state.canvasWidth);
    store.dispatch({ type: 'SET_VIEWPORT', viewportStart, scale });
  }
}

const helpMenu = createHelpMenu(document.body, { onLoad: handleExampleLoad });

function toggleHelp() {
  if (helpMenu.isVisible()) {
    helpMenu.hide();
  } else {
    helpMenu.show();
  }
}

const helpButton = createHelpButton(document.body, { onToggleHelp: toggleHelp });
helpButton.element.id = 'help-button';

// Zoom control handlers
function handleZoomIn() {
  const state = store.getState();
  const rect = canvas.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const mouseX = centerX - rect.left;
  const anchor = state.viewportStart + state.scale.pxToTime(mouseX);
  const factor = 1.15; // ZOOM_FACTOR from input.js
  const currentSpp = state.scale.getSecondsPerPixel();
  let newSpp = currentSpp / factor;
  newSpp = Math.max(0.001, Math.min(1e15, newSpp)); // MIN/MAX_SECONDS_PER_PIXEL
  const newScale = RationalScale.fromSecondsPerPixel(newSpp);
  const newStart = anchor - newScale.pxToTime(mouseX);
  store.dispatch({ type: 'SET_VIEWPORT', viewportStart: newStart, scale: newScale });
}

function handleZoomOut() {
  const state = store.getState();
  const rect = canvas.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const mouseX = centerX - rect.left;
  const anchor = state.viewportStart + state.scale.pxToTime(mouseX);
  const factor = 1 / 1.15; // 1/ZOOM_FACTOR from input.js
  const currentSpp = state.scale.getSecondsPerPixel();
  let newSpp = currentSpp / factor;
  newSpp = Math.max(0.001, Math.min(1e15, newSpp)); // MIN/MAX_SECONDS_PER_PIXEL
  const newScale = RationalScale.fromSecondsPerPixel(newSpp);
  const newStart = anchor - newScale.pxToTime(mouseX);
  store.dispatch({ type: 'SET_VIEWPORT', viewportStart: newStart, scale: newScale });
}

function handleFitToContent() {
  const state = store.getState();
  const { viewportStart, scale } = fitToContent(state.events, state.canvasWidth);
  store.dispatch({ type: 'SET_VIEWPORT', viewportStart, scale });
}

function handleResetZoom() {
  const state = store.getState();
  const { viewportStart, scale } = resetZoom(state.canvasWidth);
  store.dispatch({ type: 'SET_VIEWPORT', viewportStart, scale });
}

function toggleFilter() {
  if (categoryFilter.isVisible()) {
    categoryFilter.hide();
  } else {
    categoryFilter.show();
  }
}

const zoomControls = createZoomControls(document.body, {
  onZoomIn: handleZoomIn,
  onZoomOut: handleZoomOut,
  onFitToContent: handleFitToContent,
  onResetZoom: handleResetZoom,
  onToggleFilter: toggleFilter,
});

const dropzone = createDropzone(canvas.parentElement, { onLoad: handleExampleLoad });

const categoryFilter = createCategoryFilter(document.body, {
  onToggle: (category) => store.dispatch({ type: 'TOGGLE_CATEGORY', category }),
  onSetMode: (mode) => store.dispatch({ type: 'SET_FILTER_MODE', mode }),
  onClear: () => store.dispatch({ type: 'CLEAR_CATEGORIES' }),
});

const domSync = createDomSync(document.body, {
  onFocus: (id) => store.dispatch({ type: 'SET_HOVER', eventId: id }),
  onActivate: (id) => store.dispatch({ type: 'SELECT_EVENT', eventId: id }),
});

const tooltip = createTooltip(document.body);
const eventPanel = createEventPanel(document.body, {
  onClose: () => {
    // Clear selection when panel is closed
    store.dispatch({ type: 'CLEAR_SELECTION' });
  },
});

const contextMenu = createContextMenu(document.body);

let mouseX = 0;
let mouseY = 0;
let hoverTimeout = null;
let lastHoveredEventId = null;

function handleHoverChange(hoveredEventId) {
  if (hoveredEventId !== lastHoveredEventId) {
    lastHoveredEventId = hoveredEventId;
    
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
    
    if (hoveredEventId === null) {
      tooltip.hide();
    } else {
      hoverTimeout = setTimeout(() => {
        const state = store.getState();
        const event = state.events.find(e => e.id === hoveredEventId);
        if (event && state.hoveredEventId === hoveredEventId) {
          tooltip.update(event, mouseX, mouseY);
          tooltip.show();
        }
      }, 500);
    }
  }
}

function handleSelectionChange(selectedEventIds) {
  if (selectedEventIds.size > 0) {
    const state = store.getState();
    const selectedEvents = state.events.filter(e => selectedEventIds.has(e.id));
    if (selectedEvents.length > 0) {
      eventPanel.update(selectedEvents);
      eventPanel.show();
    }
  }
}

let lastSelectedIds = new Set();
let lastResultIndex = -1;
let lastSearchResultIds = null;
let lastEvents = null;
let lastAnnouncedQuery = '';
let lastAnnouncedResultCount = null;
let lastAnnouncedCatCount = 0;

store.subscribe((state) => {
  handleHoverChange(state.hoveredEventId);

  // Update accessible DOM tree and category filter panel when events change
  if (state.events !== lastEvents) {
    lastEvents = state.events;
    domSync.update(state.events);
    const cats = extractCategories(state.events);
    categoryFilter.setCategories(cats);
  }
  categoryFilter.setSelected(state.selectedCategories);
  categoryFilter.setMode(state.filterMode);
  zoomControls.setFilterActive(state.selectedCategories.length > 0);

  const currentIds = [...state.selectedEventIds].sort().join(',');
  const prevIds = [...lastSelectedIds].sort().join(',');
  if (currentIds !== prevIds) {
    if (state.selectedEventIds.size > 0) {
      handleSelectionChange(state.selectedEventIds);
    } else {
      eventPanel.hide();
    }
  }
  lastSelectedIds = new Set(state.selectedEventIds);

  // Update search navigation UI
  const total = state.searchResultIds ? state.searchResultIds.length : 0;
  const activeFilterCount =
    (state.searchQuery ? 1 : 0) + state.selectedCategories.length;
  searchBar.updateNavigation(state.currentResultIndex, total, activeFilterCount);

  // Pan to current search result when index or results change
  const resultIndexChanged = state.currentResultIndex !== lastResultIndex;
  const resultsChanged = state.searchResultIds !== lastSearchResultIds;
  lastResultIndex = state.currentResultIndex;
  lastSearchResultIds = state.searchResultIds;

  if ((resultIndexChanged || resultsChanged) && state.searchResultIds && state.searchResultIds.length > 0) {
    const currentEventId = state.searchResultIds[state.currentResultIndex];
    const event = state.events.find((e) => e.id === currentEventId);
    if (event) {
      const newViewportStart = computePanToEvent(event, state.canvasWidth, state.scale);
      store.dispatch({ type: 'SET_VIEWPORT', viewportStart: newViewportStart, scale: state.scale });
    }
  }

  // ARIA announcements for search results, navigation, and category filters
  const currentQuery = state.searchQuery;
  const currentResultCount = state.searchResultIds ? state.searchResultIds.length : null;
  const currentCatCount = state.selectedCategories.length;

  const queryChanged = currentQuery !== lastAnnouncedQuery;
  const resultCountChanged = currentResultCount !== lastAnnouncedResultCount;
  const catCountChanged = currentCatCount !== lastAnnouncedCatCount;

  if (queryChanged || resultCountChanged) {
    lastAnnouncedQuery = currentQuery;
    lastAnnouncedResultCount = currentResultCount;
    if (currentQuery) {
      ariaAnnouncer.announceResults(currentResultCount ?? 0, currentQuery);
    } else if (queryChanged) {
      // Search was cleared
      ariaAnnouncer.clear();
    }
  } else if (resultIndexChanged && currentResultCount > 0) {
    ariaAnnouncer.announceNavigation(state.currentResultIndex, currentResultCount);
  }

  if (catCountChanged) {
    lastAnnouncedCatCount = currentCatCount;
    if (currentCatCount > 0 && state.categoryFilterIds !== null) {
      ariaAnnouncer.announceFilterChange(state.categoryFilterIds.length);
    }
  }

  // Sync URL hash (debounced to avoid excessive updates)
  debouncedSyncUrl(state);
});

// Debounced URL hash sync
const debouncedSyncUrl = createDebouncedSearch((state) => {
  const hash = encodeAllState({
    searchQuery: state.searchQuery,
    selectedCategories: state.selectedCategories,
    filterMode: state.filterMode,
    viewportStart: state.viewportStart,
    spp: state.scale.getSecondsPerPixel(),
  });
  const newHash = hash || (window.location.hash ? '' : undefined);
  if (newHash !== undefined && newHash !== window.location.hash) {
    window.history.replaceState(null, '', hash || window.location.pathname + window.location.search);
  }
}, 500);

// Restore state from URL hash on browser back/forward
window.addEventListener('hashchange', () => {
  const restored = decodeSearchState(window.location.hash);
  if (restored.searchQuery || restored.selectedCategories.length > 0) {
    store.dispatch({ type: 'RESTORE_FROM_URL', ...restored });
  } else {
    store.dispatch({ type: 'CLEAR_ALL_FILTERS' });
  }

  const { viewportStart, spp } = decodeViewportState(window.location.hash);
  if (viewportStart !== null && spp !== null) {
    const scale = RationalScale.fromSecondsPerPixel(spp);
    store.dispatch({ type: 'SET_VIEWPORT', viewportStart, scale });
  }
});

initInput(canvas, store, {
  onOpenSearch: () => {
    if (!searchBar.isVisible()) {
      searchBar.show();
    }
  },
  onToggleHelp: toggleHelp,
  onToggleFilter: toggleFilter,
  onMousePosition: (x, y) => {
    mouseX = x;
    mouseY = y;
    if (tooltip.isVisible()) {
      const state = store.getState();
      const event = state.events.find(e => e.id === state.hoveredEventId);
      if (event) {
        tooltip.update(event, x, y);
      }
    }
  },
  onContextMenu: ({ x, y, target, targetType }) => {
    tooltip.hide();
    if (targetType === 'event' && target) {
      const actions = buildEventActions(target, store, {
        onShowDetails: (ev) => {
          eventPanel.update([ev]);
          eventPanel.show();
        },
      });
      contextMenu.show(x, y, actions);
    }
    // Background right-click: no menu for now (per spec: implementation choice)
  },
}, focusManager);

async function init() {
  const params = new URLSearchParams(window.location.search);
  const exampleName = params.get('example') || DEFAULT_EXAMPLE;

  const result = await loadExample(exampleName);

  if (result.errors.length > 0) {
    console.warn(result.summary, result.errors);
  }

  let events;
  if (result.events.length > 0) {
    events = result.events;
    store.dispatch({ type: 'SET_EVENTS', events });
  } else {
    console.warn('Loader failed, using generated samples');
    events = generateSampleEvents();
    store.dispatch({ type: 'SET_EVENTS', events });
  }

  // Restore viewport from URL hash if present, otherwise fit all content
  const { viewportStart: urlVs, spp: urlSpp } = decodeViewportState(window.location.hash);
  if (urlVs !== null && urlSpp !== null) {
    const scale = RationalScale.fromSecondsPerPixel(urlSpp);
    store.dispatch({ type: 'SET_VIEWPORT', viewportStart: urlVs, scale });
  } else {
    const state = store.getState();
    const { viewportStart, scale } = fitToContent(events, state.canvasWidth);
    store.dispatch({ type: 'SET_VIEWPORT', viewportStart, scale });
  }

  // Restore search/filter state from URL hash (if present)
  const urlState = decodeSearchState(window.location.hash);
  if (urlState.searchQuery || urlState.selectedCategories.length > 0) {
    store.dispatch({ type: 'RESTORE_FROM_URL', ...urlState });
  }

  // Focus canvas for keyboard navigation
  canvas.focus();
}

init();

let lastRenderedRevision = -1;

function loop() {
  const state = store.getState();
  if (state.revision !== lastRenderedRevision) {
    draw(state);
    lastRenderedRevision = state.revision;
  }
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
