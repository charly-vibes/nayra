import { projectToScreen } from '../core/time.js';
import { EVENT_HEIGHT } from '../rendering/renderer.js';

export function findEventAtPoint(x, y, events, viewportStart, scale, canvasHeight) {
  const axisY = canvasHeight / 2;
  const eventTop = axisY - EVENT_HEIGHT / 2;
  const eventBottom = axisY + EVENT_HEIGHT / 2;

  if (y < eventTop || y > eventBottom) return null;

  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    const eventX = projectToScreen(event.start, viewportStart, scale);

    let eventWidth;
    if (event.end !== undefined && event.end > event.start) {
      const endX = projectToScreen(event.end, viewportStart, scale);
      eventWidth = Math.max(endX - eventX, 4);
    } else {
      eventWidth = 4;
    }

    if (x >= eventX && x <= eventX + eventWidth) {
      return event;
    }
  }
  return null;
}
