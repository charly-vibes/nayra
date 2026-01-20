import { createStore } from './core/store.js';
import { init as initRenderer, draw } from './rendering/renderer.js';

const canvas = document.getElementById('timeline-canvas');
const store = createStore();

initRenderer(canvas, store.dispatch);

draw(store.getState());
store.subscribe((state) => {
  draw(state);
});
