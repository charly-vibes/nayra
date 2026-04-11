import { createAriaAnnouncer } from './accessibility/aria-announcer.js';
import { createDomSync } from './accessibility/dom-sync.js';
import { createLiveAnnouncer } from './accessibility/live-announcer.js';
import { createSkipLinks } from './accessibility/skip-links.js';
import { extractCategories } from './core/filter-engine.js';
import { RationalScale } from './core/scale.js';
import { createDebouncedSearch } from './core/search-engine.js';
import { createStore } from './core/store.js';
import { parseTimeQuery } from './core/time-parser.js';
import { decodeSearchState, decodeViewportState, encodeAllState } from './core/url-state.js';
import { DEFAULT_EXAMPLE } from './data/examples.js';
import { loadExample, loadFromFile } from './data/loader.js';
import { generateSampleEvents } from './data/samples.js';
import { createFocusManager } from './interaction/focus-manager.js';
import { fitToContent, initInput, resetZoom } from './interaction/input.js';
import { draw, init as initRenderer } from './rendering/renderer.js';
import { createBrowserError } from './ui/browser-error.js';
import { createCategoryFilter } from './ui/category-filter.js';
import { buildEventActions, createContextMenu } from './ui/context-menu.js';
import { createDropzone } from './ui/dropzone.js';
import { createEventPanel } from './ui/event-panel.js';
import { createHelpMenu } from './ui/help.js';
import { createHelpButton } from './ui/help-button.js';
import { computePanToEvent } from './ui/search-navigation.js';
import { createSearchBar } from './ui/searchbar.js';
import { createTooltip } from './ui/tooltip.js';
import { createZoomControls } from './ui/zoom-controls.js';
import { detectFeatures, REQUIRED_FEATURES } from './utils/feature-detection.js';

// Feature detection: show a graceful error UI if required APIs are missing
const features = detectFeatures();
const missing = REQUIRED_FEATURES.filter((key) => !features[key].supported);
if (missing.length > 0) {
  createBrowserError(document.body, missing);
  throw new Error(`Nayra: missing required browser features: ${missing.join(', ')}`);
}

const canvas = document.getElementById('timeline-canvas');
const store = createStore();
let currentExample = null;

// Skip navigation links: first focusable elements on the page (WCAG 2.4.1)
createSkipLinks(document.body, [
  { label: 'Skip to timeline', targetId: 'timeline-canvas' },
  {
    label: 'Skip to search',
    onClick: () => {
      searchBar.show();
    },
  },
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
    currentExample = exampleOrFile;
    result = await loadExample(exampleOrFile);
  } else {
    currentExample = null;
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

const _dropzone = createDropzone(canvas.parentElement, { onLoad: handleExampleLoad });

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
let clusterHoverTimeout = null;
let hoveredCluster = null;
let lastHoveredClusterKey = null;

function handleHoverChange(hoveredEventId) {
  if (hoveredCluster !== null) {
    return;
  }

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
        const event = state.events.find((e) => e.id === hoveredEventId);
        if (event && state.hoveredEventId === hoveredEventId) {
          tooltip.update(event, mouseX, mouseY, state.calendar);
          tooltip.show();
        }
      }, 500);
    }
  }
}

function getClusterKey(cluster) {
  if (!cluster) return null;
  const eventIds = cluster.events?.map((event) => event.id).join(',') ?? '';
  return `${cluster.minTime}:${cluster.maxTime}:${cluster.count}:${eventIds}`;
}

function handleClusterHoverChange(cluster) {
  const clusterKey = getClusterKey(cluster);
  if (clusterKey === lastHoveredClusterKey) {
    return;
  }

  lastHoveredClusterKey = clusterKey;
  hoveredCluster = cluster;

  if (clusterHoverTimeout) {
    clearTimeout(clusterHoverTimeout);
    clusterHoverTimeout = null;
  }

  if (cluster === null) {
    tooltip.hide();
    handleHoverChange(store.getState().hoveredEventId);
    return;
  }

  tooltip.hide();
  clusterHoverTimeout = setTimeout(() => {
    if (hoveredCluster === cluster) {
      tooltip.update(cluster, mouseX, mouseY, store.getState().calendar);
      tooltip.show();
    }
  }, 500);
}

function handleSelectionChange(_selectedEventIds) {
  // Panel opens only via Enter/Space, double-click, or context menu — not on single click
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
  const activeFilterCount = (state.searchQuery ? 1 : 0) + state.selectedCategories.length;
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
    calendar: state.calendar,
    example: currentExample,
  });
  const newHash = hash || (window.location.hash ? '' : undefined);
  if (newHash !== undefined && newHash !== window.location.hash) {
    window.history.replaceState(null, '', hash || window.location.pathname + window.location.search);
  }
}, 500);

// Restore state from URL hash on browser back/forward
window.addEventListener('hashchange', () => {
  const restored = decodeSearchState(window.location.hash);
  if (restored.searchQuery || restored.selectedCategories.length > 0 || restored.calendar === 'holocene') {
    store.dispatch({ type: 'RESTORE_FROM_URL', ...restored });
  } else {
    store.dispatch({ type: 'CLEAR_ALL_FILTERS' });
  }

  const { viewportStart, spp, calendar } = decodeViewportState(window.location.hash);
  if (viewportStart !== null && spp !== null) {
    const scale = RationalScale.fromSecondsPerPixel(spp);
    store.dispatch({ type: 'SET_VIEWPORT', viewportStart, scale });
  }
  if (calendar) {
    store.dispatch({ type: 'SET_CALENDAR', calendar });
  }
});

initInput(
  canvas,
  store,
  {
    onOpenSearch: () => {
      if (!searchBar.isVisible()) {
        searchBar.show();
      }
    },
    onOpenSelectedEvent: (eventId) => {
      const state = store.getState();
      const event = state.events.find((e) => e.id === eventId);
      if (event) {
        eventPanel.update([event], state.calendar);
        eventPanel.show();
      }
    },
    onToggleHelp: toggleHelp,
    onToggleFilter: toggleFilter,
    onMousePosition: (x, y) => {
      mouseX = x;
      mouseY = y;
      if (tooltip.isVisible()) {
        const state = store.getState();
        if (hoveredCluster) {
          tooltip.update(hoveredCluster, x, y, state.calendar);
        } else {
          const event = state.events.find((e) => e.id === state.hoveredEventId);
          if (event) {
            tooltip.update(event, x, y, state.calendar);
          }
        }
      }
    },
    onHoverClusterChange: handleClusterHoverChange,
    onContextMenu: ({ x, y, target, targetType }) => {
      tooltip.hide();
      if (targetType === 'event' && target) {
        const actions = buildEventActions(target, store, {
          onShowDetails: (ev) => {
            eventPanel.update([ev], store.getState().calendar);
            eventPanel.show();
          },
        });
        contextMenu.show(x, y, actions);
      }
      // Background right-click: no menu for now (per spec: implementation choice)
    },
  },
  focusManager,
);

async function init() {
  const hashState = decodeViewportState(window.location.hash);
  const params = new URLSearchParams(window.location.search);
  const exampleName = hashState.example || params.get('example') || DEFAULT_EXAMPLE;
  currentExample = exampleName;

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

  // Restore search/filter/calendar state from URL hash (if present)
  const urlState = decodeSearchState(window.location.hash);
  if (urlState.searchQuery || urlState.selectedCategories.length > 0 || urlState.calendar === 'holocene') {
    store.dispatch({ type: 'RESTORE_FROM_URL', ...urlState });
  }

  // Focus canvas for keyboard navigation
  canvas.focus();
}

init();

let lastRenderedRevision = -1;
let rafId = null;

function loop() {
  rafId = null;
  const state = store.getState();
  if (state.revision !== lastRenderedRevision) {
    draw(state);
    lastRenderedRevision = state.revision;
  }
}

function scheduleRender() {
  if (rafId === null) {
    rafId = requestAnimationFrame(loop);
  }
}

// Trigger render on state changes
store.subscribe(() => scheduleRender());

// Initial render
scheduleRender();
