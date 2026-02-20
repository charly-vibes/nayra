import { createStore } from './core/store.js';
import { init as initRenderer, draw } from './rendering/renderer.js';
import { initInput, fitToContent, resetZoom } from './interaction/input.js';
import { generateSampleEvents } from './data/samples.js';
import { loadExample, loadFromFile } from './data/loader.js';
import { DEFAULT_EXAMPLE } from './data/examples.js';
import { createSearchBar } from './ui/searchbar.js';
import { createHelpMenu } from './ui/help.js';
import { createHelpButton } from './ui/help-button.js';
import { createZoomControls } from './ui/zoom-controls.js';
import { createTooltip } from './ui/tooltip.js';
import { createEventPanel } from './ui/event-panel.js';
import { createDropzone } from './ui/dropzone.js';
import { parseTimeQuery } from './core/time-parser.js';
import { RationalScale } from './core/scale.js';

const canvas = document.getElementById('timeline-canvas');
const store = createStore();

initRenderer(canvas, store.dispatch);

const searchBar = createSearchBar(document.body, (query) => {
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

const zoomControls = createZoomControls(document.body, {
  onZoomIn: handleZoomIn,
  onZoomOut: handleZoomOut,
  onFitToContent: handleFitToContent,
  onResetZoom: handleResetZoom,
});

const dropzone = createDropzone(canvas.parentElement, { onLoad: handleExampleLoad });

const tooltip = createTooltip(document.body);
const eventPanel = createEventPanel(document.body, {
  onClose: () => {
    // Panel closed, but keep selection
  },
});

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

store.subscribe((state) => {
  handleHoverChange(state.hoveredEventId);
  
  const currentIds = [...state.selectedEventIds].sort().join(',');
  const prevIds = [...lastSelectedIds].sort().join(',');
  if (currentIds !== prevIds && state.selectedEventIds.size > 0) {
    handleSelectionChange(state.selectedEventIds);
  }
  lastSelectedIds = new Set(state.selectedEventIds);
});

initInput(canvas, store, {
  onOpenSearch: () => {
    if (!searchBar.isVisible()) {
      searchBar.show();
    }
  },
  onToggleHelp: toggleHelp,
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
});

async function init() {
  const params = new URLSearchParams(window.location.search);
  const exampleName = params.get('example') || DEFAULT_EXAMPLE;

  const result = await loadExample(exampleName);

  if (result.errors.length > 0) {
    console.warn(result.summary, result.errors);
  }

  if (result.events.length > 0) {
    store.dispatch({ type: 'SET_EVENTS', events: result.events });
  } else {
    console.warn('Loader failed, using generated samples');
    const fallback = generateSampleEvents();
    store.dispatch({ type: 'SET_EVENTS', events: fallback });
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
