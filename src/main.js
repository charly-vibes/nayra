import { createStore } from './core/store.js';
import { init as initRenderer, draw } from './rendering/renderer.js';
import { initInput } from './interaction/input.js';
import { generateSampleEvents } from './data/samples.js';
import { loadExample } from './data/loader.js';
import { DEFAULT_EXAMPLE } from './data/examples.js';
import { createSearchBar } from './ui/searchbar.js';
import { createHelpMenu } from './ui/help.js';
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

const helpMenu = createHelpMenu(document.body);

initInput(canvas, store, {
  onOpenSearch: () => {
    if (!searchBar.isVisible()) {
      searchBar.show();
    }
  },
  onToggleHelp: () => {
    if (helpMenu.isVisible()) {
      helpMenu.hide();
    } else {
      helpMenu.show();
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
