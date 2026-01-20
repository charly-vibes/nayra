export const SECOND = 1n;
export const MINUTE = 60n;
export const HOUR = 3600n;
export const DAY = 86400n;
export const WEEK = 604800n;
export const YEAR = 31557600n;
export const MILLION_YEARS = 31557600000000n;
export const BILLION_YEARS = 31557600000000000n;

export function projectToScreen(time, viewportStart, scale) {
  const delta = time - viewportStart;
  return scale.timeToPx(delta);
}

export function isVisible(time, duration, viewportStart, viewportEnd) {
  const eventEnd = time + duration;
  return eventEnd >= viewportStart && time <= viewportEnd;
}

export function compareTimes(t1, t2) {
  if (t1 < t2) return -1;
  if (t1 > t2) return 1;
  return 0;
}

export function addDuration(time, duration) {
  return time + duration;
}

export function calculateDuration(start, end) {
  return end - start;
}

export function validateDuration(start, end) {
  if (end === undefined || end === null) {
    return { valid: true, duration: 0n, isPoint: true };
  }
  const duration = end - start;
  if (duration < 0n) {
    return { valid: false, duration: 0n, isPoint: false, error: 'End time before start time' };
  }
  return { valid: true, duration, isPoint: duration === 0n };
}
