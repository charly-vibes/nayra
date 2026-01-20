import { projectToScreen, isVisible } from '../core/time.js';

let ctx = null;
let canvas = null;
let resizeObserver = null;
let lastFrameTime = performance.now();
let fps = 0;
let frameCount = 0;
let fpsUpdateTime = 0;

const EVENT_HEIGHT = 20;
const EVENT_COLORS = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
  '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe',
];

export function init(canvasElement, dispatch) {
  canvas = canvasElement;
  ctx = canvas.getContext('2d');

  const rect = setupDPI();
  dispatch({ type: 'SET_CANVAS_WIDTH', width: rect.width });

  resizeObserver = new ResizeObserver(() => {
    const rect = setupDPI();
    dispatch({ type: 'SET_CANVAS_WIDTH', width: rect.width });
  });
  resizeObserver.observe(canvas);

  return { ctx, canvas };
}

export function destroy() {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  ctx = null;
  canvas = null;
}

function setupDPI() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return rect;
}

export function draw(state) {
  if (!ctx || !canvas) return;

  const now = performance.now();
  updateFPS(now);

  const width = canvas.width / (window.devicePixelRatio || 1);
  const height = canvas.height / (window.devicePixelRatio || 1);
  const viewportEnd = state.viewportStart + state.scale.pxToTime(width);

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, width, height);

  const axisY = height / 2;
  ctx.strokeStyle = '#4a4a6a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, axisY);
  ctx.lineTo(width, axisY);
  ctx.stroke();

  let visibleCount = 0;
  for (const event of state.events) {
    const duration = event.end !== undefined ? event.end - event.start : 0n;
    if (!isVisible(event.start, duration, state.viewportStart, viewportEnd)) {
      continue;
    }
    visibleCount++;
    drawEvent(event, state, axisY, width);
  }

  drawFPS(width);
}

function drawEvent(event, state, axisY, canvasWidth) {
  const x = projectToScreen(event.start, state.viewportStart, state.scale);

  let eventWidth;
  if (event.end !== undefined && event.end > event.start) {
    const endX = projectToScreen(event.end, state.viewportStart, state.scale);
    eventWidth = Math.max(endX - x, 4);
  } else {
    eventWidth = 4;
  }

  if (x > canvasWidth || x + eventWidth < 0) return;

  const colorIndex = hashCode(event.id) % EVENT_COLORS.length;
  const color = EVENT_COLORS[colorIndex];

  const y = axisY - EVENT_HEIGHT / 2;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, eventWidth, EVENT_HEIGHT);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, eventWidth, EVENT_HEIGHT);
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function updateFPS(now) {
  frameCount++;
  const elapsed = now - fpsUpdateTime;
  if (elapsed >= 500) {
    fps = Math.round((frameCount * 1000) / elapsed);
    frameCount = 0;
    fpsUpdateTime = now;
  }
  lastFrameTime = now;
}

function drawFPS(canvasWidth) {
  const text = `${fps} FPS`;
  ctx.font = '12px monospace';
  ctx.fillStyle = fps >= 55 ? '#4ecdc4' : fps >= 30 ? '#ffeaa7' : '#ff6b6b';
  ctx.textAlign = 'left';
  ctx.fillText(text, 10, 20);
}
