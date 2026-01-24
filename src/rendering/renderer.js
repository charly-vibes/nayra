import { projectToScreen, isVisible, YEAR, MILLION_YEARS, BILLION_YEARS } from '../core/time.js';
import { lightenColor } from './colors.js';

let ctx = null;
let canvas = null;
let resizeObserver = null;
let lastFrameTime = performance.now();
let fps = 0;
let frameCount = 0;
let fpsUpdateTime = 0;

export const EVENT_HEIGHT = 20;
export const EVENT_COLORS = [
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

  drawGridAndLabels(state, width, height, axisY);

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

  const isHovered = state.hoveredEventId === event.id;
  const isSelected = state.selectedEventIds && state.selectedEventIds.has(event.id);

  const fillColor = getEventFillColor(event.id, isHovered, isSelected);
  const strokeStyle = getEventStrokeStyle(isSelected);

  const y = axisY - EVENT_HEIGHT / 2;
  ctx.fillStyle = fillColor;
  ctx.fillRect(x, y, eventWidth, EVENT_HEIGHT);

  ctx.strokeStyle = strokeStyle.color;
  ctx.lineWidth = strokeStyle.lineWidth;
  if (isSelected) {
    ctx.strokeRect(x - 1, y - 1, eventWidth + 2, EVENT_HEIGHT + 2);
  } else {
    ctx.strokeRect(x, y, eventWidth, EVENT_HEIGHT);
  }
}

export function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function getEventColor(eventId) {
  const colorIndex = hashCode(eventId) % EVENT_COLORS.length;
  return EVENT_COLORS[colorIndex];
}

export function getEventFillColor(eventId, isHovered, isSelected) {
  const baseColor = getEventColor(eventId);
  if (isHovered) {
    return lightenColor(baseColor, 0.2);
  }
  return baseColor;
}

export function getEventStrokeStyle(isSelected) {
  if (isSelected) {
    return { color: '#ffcc00', lineWidth: 2 };
  }
  return { color: 'rgba(255, 255, 255, 0.3)', lineWidth: 1 };
}

export function cullEvents(events, viewportStart, viewportEnd) {
  const visible = [];
  for (const event of events) {
    const duration = event.end !== undefined ? event.end - event.start : 0n;
    if (isVisible(event.start, duration, viewportStart, viewportEnd)) {
      visible.push(event);
    }
  }
  return visible;
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

const TIME_INTERVALS = [
  { value: 1n, label: 's', threshold: 60 },
  { value: 60n, label: 'min', threshold: 3600 },
  { value: 3600n, label: 'h', threshold: 86400 },
  { value: 86400n, label: 'd', threshold: 86400 * 30 },
  { value: YEAR, label: 'y', threshold: Number(YEAR) * 100 },
  { value: YEAR * 100n, label: 'y', threshold: Number(YEAR) * 1000 },
  { value: YEAR * 1000n, label: 'ky', threshold: Number(YEAR) * 1000000 },
  { value: MILLION_YEARS, label: 'Ma', threshold: Number(MILLION_YEARS) * 1000 },
  { value: BILLION_YEARS, label: 'Ga', threshold: Infinity },
];

export function getGridInterval(secondsPerPixel, targetPixelSpacing = 100) {
  const targetSeconds = secondsPerPixel * targetPixelSpacing;

  for (const interval of TIME_INTERVALS) {
    if (targetSeconds < interval.threshold) {
      const multipliers = [1n, 2n, 5n, 10n, 20n, 50n, 100n];
      for (const mult of multipliers) {
        const candidate = interval.value * mult;
        const pixels = Number(candidate) / secondsPerPixel;
        if (pixels >= targetPixelSpacing * 0.5 && pixels <= targetPixelSpacing * 2) {
          return { interval: candidate, unit: interval.label, multiplier: mult };
        }
      }
      return { interval: interval.value, unit: interval.label, multiplier: 1n };
    }
  }
  return { interval: BILLION_YEARS, unit: 'Ga', multiplier: 1n };
}

export function formatTime(timeValue, unit, interval) {
  if (unit === 'Ga') {
    const gaWhole = timeValue / BILLION_YEARS;
    const gaRemainder = timeValue % BILLION_YEARS;
    const decimal = Number(gaRemainder * 10n / BILLION_YEARS);
    const gaNum = Number(gaWhole) + decimal / 10;
    if (gaNum < 0) {
      return `${Math.abs(gaNum).toFixed(1)} Ga`;
    }
    return `+${gaNum.toFixed(1)} Ga`;
  }

  if (unit === 'Ma') {
    const maWhole = timeValue / MILLION_YEARS;
    const maNum = Number(maWhole);
    if (maNum < 0) {
      return `${Math.abs(maNum)} Ma`;
    }
    return `+${maNum} Ma`;
  }

  if (unit === 'ky') {
    const kyWhole = timeValue / (YEAR * 1000n);
    const kyNum = Number(kyWhole);
    if (kyNum < 0) {
      return `${Math.abs(kyNum)} kya`;
    }
    return `${kyNum} ky`;
  }

  const secondsFromEpoch = Number(timeValue);
  if (!Number.isFinite(secondsFromEpoch) || Math.abs(secondsFromEpoch) > 8.64e15 / 1000) {
    const years = timeValue / YEAR;
    return `${Number(years)} y`;
  }

  const date = new Date(secondsFromEpoch * 1000);

  if (unit === 'y') {
    return `${date.getUTCFullYear()}`;
  }

  if (unit === 'd' || unit === 'h' || unit === 'min') {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return date.toISOString().substring(0, 19);
}

function drawGridAndLabels(state, width, height, axisY) {
  const secondsPerPixel = state.scale.getSecondsPerPixel();
  const { interval, unit } = getGridInterval(secondsPerPixel);
  const viewportEnd = state.viewportStart + state.scale.pxToTime(width);

  const firstGridTime = (state.viewportStart / interval) * interval;
  const startGrid = firstGridTime < state.viewportStart ? firstGridTime + interval : firstGridTime;

  ctx.strokeStyle = 'rgba(100, 100, 140, 0.3)';
  ctx.lineWidth = 1;
  ctx.font = '10px monospace';
  ctx.fillStyle = '#8888aa';
  ctx.textAlign = 'center';

  let gridTime = startGrid;
  let gridCount = 0;
  const maxGridLines = 50;

  while (gridTime <= viewportEnd && gridCount < maxGridLines) {
    const x = projectToScreen(gridTime, state.viewportStart, state.scale);

    if (x >= 0 && x <= width) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      const label = formatTime(gridTime, unit, interval);
      ctx.fillText(label, x, axisY + 30);
    }

    gridTime = gridTime + interval;
    gridCount++;
  }
}
