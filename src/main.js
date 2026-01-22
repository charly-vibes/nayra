import { createStore } from './core/store.js';
import { init as initRenderer, draw } from './rendering/renderer.js';
import { initInput } from './interaction/input.js';
import { generateSampleEvents } from './data/samples.js';
import { createSearchBar } from './ui/searchbar.js';
import { parseTimeQuery } from './core/time-parser.js';
import { RationalScale } from './core/scale.js';
import { YEAR } from './core/time.js';

const canvas = document.getElementById('timeline-canvas');
const store = createStore();

initRenderer(canvas, store.dispatch);

const searchBar = createSearchBar(document.body, (query) => {
  const result = parseTimeQuery(query);
  if (result.success) {
    const state = store.getState();
    // Calculate scale so span takes ~80% of viewport width
    const targetWidth = state.canvasWidth * 0.8;
    const secondsPerPixel = Number(result.span) / targetWidth;
    const newScale = RationalScale.fromSecondsPerPixel(secondsPerPixel);
    // Center the target time
    const halfWidthTime = newScale.pxToTime(state.canvasWidth / 2);
    const viewportStart = result.time - halfWidthTime;
    store.dispatch({ type: 'SET_VIEWPORT', viewportStart, scale: newScale });
  }
});

initInput(canvas, store, {
  onOpenSearch: () => {
    if (!searchBar.isVisible()) {
      searchBar.show();
    }
  },
});

const events = generateSampleEvents();
store.dispatch({ type: 'SET_EVENTS', events });

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
