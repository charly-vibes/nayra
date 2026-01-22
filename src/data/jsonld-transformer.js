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
 */
function transformEvent(node) {
  const id = extractId(node);
  const label = extractValue(node['name'] || node['schema:name']);
  const startDate = extractValue(node['startDate'] || node['schema:startDate']);

  // Required fields
  if (!id || !label || !startDate) {
    return null;
  }

  const event = {
    id,
    label,
    start: startDate,
  };

  // Optional fields
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
