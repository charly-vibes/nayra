/**
 * Transforms JSON-LD events using Schema.org vocabulary to Nayra event format.
 *
 * Property mapping (Schema.org -> Nayra):
 * - @id or schema:identifier -> id
 * - schema:name -> label
 * - schema:description -> description
 * - schema:startDate -> start
 * - schema:endDate -> end
 * - schema:url -> url
 */

class TransformError {
  constructor({ code, event, field, hint }) {
    this.code = code;
    this.event = event;
    this.field = field;
    this.hint = hint;
  }

  toString() {
    return `Transform Error: ${this.code}\n  Event: ${this.event}\n  Field: ${this.field}\n  Hint: ${this.hint}`;
  }
}

/**
 * Extract value from a JSON-LD property that may be a literal or an object with @value
 */
function extractValue(prop) {
  if (prop === undefined || prop === null) {
    return null;
  }
  if (typeof prop === 'object' && '@value' in prop) {
    return prop['@value'];
  }
  return prop;
}

/**
 * Extract ID from a JSON-LD node
 */
function extractId(node) {
  // Try @id first
  if (node['@id']) {
    return node['@id'];
  }
  // Then try schema:identifier
  const identifier = node['identifier'] || node['schema:identifier'];
  if (identifier) {
    return extractValue(identifier);
  }
  return null;
}

/**
 * Transform a single JSON-LD event to Nayra format
 * @returns {{ event: object|null, error: TransformError|null }}
 */
function transformEventWithError(node, index) {
  const id = extractId(node);
  const label = extractValue(node['name'] || node['schema:name']);
  const startDate = extractValue(node['startDate'] || node['schema:startDate']);
  const eventId = id || `index:${index}`;

  if (!id) {
    return {
      event: null,
      error: new TransformError({
        code: 'MISSING_REQUIRED',
        event: `index:${index}`,
        field: 'id',
        hint: 'Provide @id or schema:identifier',
      }),
    };
  }

  if (!label) {
    return {
      event: null,
      error: new TransformError({
        code: 'MISSING_REQUIRED',
        event: eventId,
        field: 'name',
        hint: 'Provide schema:name',
      }),
    };
  }

  if (!startDate) {
    return {
      event: null,
      error: new TransformError({
        code: 'MISSING_REQUIRED',
        event: eventId,
        field: 'startDate',
        hint: 'Provide schema:startDate',
      }),
    };
  }

  const event = {
    id,
    label,
    start: startDate,
  };

  const description = extractValue(node['description'] || node['schema:description']);
  if (description) {
    event.description = description;
  }

  const endDate = extractValue(node['endDate'] || node['schema:endDate']);
  if (endDate) {
    event.end = endDate;
  }

  const url = extractValue(node['url'] || node['schema:url']);
  if (url) {
    event.url = url;
  }

  return { event, error: null };
}

/**
 * Transform a single JSON-LD event to Nayra format (legacy, silent)
 */
function transformEvent(node) {
  const { event } = transformEventWithError(node, 0);
  return event;
}

/**
 * Check if a node is a Schema.org Event type
 */
function isEventType(node) {
  const type = node['@type'] || node['type'];
  if (!type) {
    return false;
  }
  const types = Array.isArray(type) ? type : [type];
  return types.some(t =>
    t === 'Event' ||
    t === 'schema:Event' ||
    t === 'https://schema.org/Event'
  );
}

/**
 * Transform JSON-LD data to Nayra events array
 *
 * Handles:
 * - Single event with @context and @type: Event
 * - Array of events in @graph
 * - Array of events at top level
 *
 * @param {object|array} data - JSON-LD data
 * @returns {object[]} Array of Nayra events
 */
export function transformJsonLd(data) {
  const events = [];

  // Handle array at top level
  if (Array.isArray(data)) {
    for (const node of data) {
      if (isEventType(node)) {
        const event = transformEvent(node);
        if (event) {
          events.push(event);
        }
      }
    }
    return events;
  }

  // Handle @graph array
  if (data['@graph'] && Array.isArray(data['@graph'])) {
    for (const node of data['@graph']) {
      if (isEventType(node)) {
        const event = transformEvent(node);
        if (event) {
          events.push(event);
        }
      }
    }
    return events;
  }

  // Handle single event object
  if (isEventType(data)) {
    const event = transformEvent(data);
    if (event) {
      events.push(event);
    }
    return events;
  }

  return events;
}

/**
 * Collect event nodes from JSON-LD data structure
 */
function collectEventNodes(data) {
  const nodes = [];

  if (Array.isArray(data)) {
    for (const node of data) {
      if (isEventType(node)) {
        nodes.push(node);
      }
    }
  } else if (data['@graph'] && Array.isArray(data['@graph'])) {
    for (const node of data['@graph']) {
      if (isEventType(node)) {
        nodes.push(node);
      }
    }
  } else if (isEventType(data)) {
    nodes.push(data);
  }

  return nodes;
}

/**
 * Transform JSON-LD data with error reporting
 *
 * @param {object|array} data - JSON-LD data
 * @param {object} options - Options
 * @param {boolean} options.strict - If true, throws on first error
 * @returns {{ valid: object[], errors: TransformError[], summary: string }}
 */
export function transformJsonLdWithReport(data, options = {}) {
  const nodes = collectEventNodes(data);
  const valid = [];
  const errors = [];

  for (let i = 0; i < nodes.length; i++) {
    const { event, error } = transformEventWithError(nodes[i], i);

    if (error) {
      if (options.strict) {
        throw new Error(`Missing required field: ${error.field}`);
      }
      errors.push(error);
    } else {
      valid.push(event);
    }
  }

  const total = nodes.length;
  const skipped = total - valid.length;

  return {
    valid,
    errors,
    summary: `Transformed ${valid.length} of ${total} events (${skipped} skipped)`,
  };
}
