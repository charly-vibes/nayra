import { parseTimeQuery } from '../core/time-parser.js';

const VALID_PRECISIONS = ['day', 'month', 'year', 'decade', 'century', 'million_years', 'billion_years'];

class ValidationError {
  constructor({ code, event, field, value, expected, hint, occurrences }) {
    this.code = code;
    this.event = event;
    this.field = field;
    this.value = value;
    this.expected = expected;
    this.hint = hint;
    if (occurrences) {
      this.occurrences = occurrences;
    }
  }

  toString() {
    return `Validation Error: ${this.code}
  Event: ${this.event}
  Field: ${this.field}
  Value: ${this.value}
  Expected: ${this.expected}
  Hint: ${this.hint}`;
  }
}

function validateEvent(event, index, seenIds) {
  const errors = [];
  const eventId = event.id || `index:${index}`;

  if (event.id === undefined) {
    errors.push(new ValidationError({
      code: 'MISSING_REQUIRED',
      event: `index:${index}`,
      field: 'id',
      value: undefined,
      expected: 'non-empty string',
      hint: 'Every event must have an id field',
    }));
  } else if (event.id === '') {
    errors.push(new ValidationError({
      code: 'EMPTY_ID',
      event: `index:${index}`,
      field: 'id',
      value: '""',
      expected: 'non-empty string',
      hint: 'Provide a meaningful identifier for this event',
    }));
  }

  if (event.start === undefined) {
    errors.push(new ValidationError({
      code: 'MISSING_REQUIRED',
      event: eventId,
      field: 'start',
      value: undefined,
      expected: 'date string',
      hint: 'Every event must have a start date',
    }));
  }

  if (event.label === undefined) {
    errors.push(new ValidationError({
      code: 'MISSING_REQUIRED',
      event: eventId,
      field: 'label',
      value: undefined,
      expected: 'string',
      hint: 'Every event must have a label',
    }));
  }

  if (event.priority !== undefined) {
    if (typeof event.priority !== 'number' || event.priority < 0 || event.priority > 4) {
      errors.push(new ValidationError({
        code: 'INVALID_PRIORITY',
        event: eventId,
        field: 'priority',
        value: event.priority,
        expected: 'number between 0 and 4',
        hint: 'Priority must be 0 (critical) through 4 (background)',
      }));
    }
  }

  if (event.precision !== undefined) {
    if (!VALID_PRECISIONS.includes(event.precision)) {
      errors.push(new ValidationError({
        code: 'INVALID_PRECISION',
        event: eventId,
        field: 'precision',
        value: event.precision,
        expected: `one of: ${VALID_PRECISIONS.join(', ')}`,
        hint: 'Use a valid precision value',
      }));
    }
  }

  if (event.start !== undefined && event.end !== undefined) {
    const startParsed = parseTimeQuery(event.start);
    const endParsed = parseTimeQuery(event.end);

    if (startParsed.success && endParsed.success) {
      if (endParsed.time < startParsed.time) {
        errors.push(new ValidationError({
          code: 'INVALID_END_BEFORE_START',
          event: eventId,
          field: 'end',
          value: event.end,
          expected: 'end date >= start date',
          hint: 'End date must not be earlier than start date',
        }));
      }
    }
  }

  return errors;
}

export function validate(events) {
  const valid = [];
  const errors = [];
  const seenIds = new Map();

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const eventErrors = validateEvent(event, i, seenIds);

    if (eventErrors.length > 0) {
      errors.push(...eventErrors);
      continue;
    }

    if (seenIds.has(event.id)) {
      const firstIndex = seenIds.get(event.id);
      errors.push(new ValidationError({
        code: 'DUPLICATE_ID',
        event: event.id,
        field: 'id',
        value: event.id,
        expected: 'unique identifier',
        hint: 'Each event must have a unique id',
        occurrences: [firstIndex, i],
      }));
      continue;
    }

    seenIds.set(event.id, i);
    valid.push(event);
  }

  const total = events.length;
  const imported = valid.length;
  const errorCount = total - imported;

  return {
    valid,
    errors,
    summary: `Imported ${imported} of ${total} events (${errorCount} errors)`,
  };
}
