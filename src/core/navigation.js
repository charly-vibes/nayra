import { RationalScale } from './scale.js';

const MIN_SECONDS_PER_PIXEL = 0.001;
const MAX_SECONDS_PER_PIXEL = 1e15;
const MIN_POINT_EVENT_SPAN = 86400n; // 1 day fallback for point events
const ZOOM_PADDING = 0.2; // 20% padding each side

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
  const span = end > start ? end - start : MIN_POINT_EVENT_SPAN;

  const paddingTime = BigInt(Math.ceil(Number(span) * ZOOM_PADDING));
  const paddedStart = start - paddingTime;
  const paddedEnd = end + paddingTime;
  const paddedSpan = paddedEnd - paddedStart;

  const spp = Number(paddedSpan) / canvasWidth;
  const clampedSpp = Math.max(MIN_SECONDS_PER_PIXEL, Math.min(MAX_SECONDS_PER_PIXEL, spp));
  const scale = RationalScale.fromSecondsPerPixel(clampedSpp);

  return { viewportStart: paddedStart, scale };
}
