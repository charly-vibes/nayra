import { parseTimeQuery } from '../core/time-parser.js';

export function normalize(events) {
  const valid = [];
  const errors = [];

  for (const event of events) {
    const startResult = parseTimeQuery(event.start);

    if (!startResult.success) {
      errors.push({
        eventId: event.id,
        field: 'start',
        message: startResult.error,
      });
      continue;
    }

    const normalized = {
      ...event,
      start: startResult.time,
    };

    if (event.end !== undefined) {
      const endResult = parseTimeQuery(event.end);
      if (endResult.success) {
        normalized.end = endResult.time;
      } else {
        delete normalized.end;
        errors.push({
          eventId: event.id,
          field: 'end',
          message: endResult.error,
        });
      }
    }

    valid.push(normalized);
  }

  const errorCount = errors.length;
  const errorWord = errorCount === 1 ? 'error' : 'errors';
  const summary = `Normalized ${valid.length} of ${events.length} events (${errorCount} ${errorWord})`;

  return { valid, errors, summary };
}
