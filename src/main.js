import { createStore } from './core/store.js';
import { init as initRenderer, draw } from './rendering/renderer.js';
import { initInput } from './interaction/input.js';
import { generateSampleEvents } from './data/samples.js';

const canvas = document.getElementById('timeline-canvas');
const store = createStore();

initRenderer(canvas, store.dispatch);
initInput(canvas, store);

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
