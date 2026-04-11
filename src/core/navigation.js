import { RationalScale } from './scale.js';

const MIN_SECONDS_PER_PIXEL = 0.001;
const MAX_SECONDS_PER_PIXEL = 1e15;
const MIN_POINT_EVENT_SPAN = 86400n; // 1 day fallback for point events
const ZOOM_PADDING = 0.2; // 20% padding each side

/**
 * Calculate viewport to fit a time range centered with padding.
 *
 * @param {bigint} start
 * @param {bigint} end
 * @param {number} canvasWidth - Canvas width in pixels
 * @param {{ maxSecondsPerPixel?: number, minSpan?: bigint, targetVisibleFraction?: number }} [options]
 * @returns {{ viewportStart: bigint, scale: RationalScale }}
 */
export function zoomToRange(start, end, canvasWidth, options = {}) {
  const rawSpan = end > start ? end - start : 0n;
  const minimumSpan = options.minSpan ?? (rawSpan === 0n ? MIN_POINT_EVENT_SPAN : 0n);
  const span = rawSpan > minimumSpan ? rawSpan : minimumSpan;
  const center = start + rawSpan / 2n;

  let visibleSpan;
  if (options.targetVisibleFraction != null) {
    visibleSpan = BigInt(Math.ceil(Number(span) / options.targetVisibleFraction));
  } else {
    const paddingTime = BigInt(Math.ceil(Number(span) * ZOOM_PADDING));
    visibleSpan = span + paddingTime * 2n;
  }

  const spp = Number(visibleSpan) / canvasWidth;
  const maxSecondsPerPixel = options.maxSecondsPerPixel ?? MAX_SECONDS_PER_PIXEL;
  const clampedSpp = Math.max(MIN_SECONDS_PER_PIXEL, Math.min(maxSecondsPerPixel, spp));
  const scale = RationalScale.fromSecondsPerPixel(clampedSpp);
  const viewportStart = center - scale.pxToTime(canvasWidth / 2);

  return { viewportStart, scale };
}

/**
 * Calculate viewport to fit a single event centered with padding.
 *
 * @param {{ start: bigint, end?: bigint }} event
 * @param {number} canvasWidth - Canvas width in pixels
 * @returns {{ viewportStart: bigint, scale: RationalScale }}
 */
export function zoomToEvent(event, canvasWidth) {
  const start = event.start;
  const end = event.end != null ? event.end : event.start;
  return zoomToRange(start, end, canvasWidth);
}
