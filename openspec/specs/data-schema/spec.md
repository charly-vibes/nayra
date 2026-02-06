# data-schema Specification

## Purpose
TBD - created by archiving change add-data-schema. Update Purpose after archive.
## Requirements
### Requirement: Event Structure

The system SHALL accept events as JSON objects with a defined set of required and optional fields.

**Required Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier for the event |
| `start` | string | Start time (see Time Formats requirement) |
| `label` | string | Short display title (recommended <100 characters) |

**Optional Fields:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `end` | string | null | End time for span events; omit for point events |
| `description` | string | null | Longer description, supports markdown |
| `category` | string | null | Primary classification for coloring (e.g., "war", "science") |
| `tags` | string[] | [] | Secondary classification for filtering (e.g., ["europe", "naval"]) |
| `priority` | number | 2 | Display priority 0-4 (0=critical, 4=background) |
| `precision` | string | null | Date precision: "day", "month", "year", "decade", "century" |
| `url` | string | null | Link to more information |
| `source` | string | null | Data provenance (e.g., "wikidata:Q12345") |
| `metadata` | object | {} | Arbitrary key-value pairs for extensions |

**Category vs Tags:**
- `category`: Single primary classification used for visual grouping and coloring. One event = one category.
- `tags`: Multiple secondary labels for filtering and search. One event can have many tags.

#### Scenario: Minimal valid event
- **WHEN** an event JSON contains only `id`, `start`, and `label`
- **THEN** the event SHALL be accepted as valid
- **AND** optional fields SHALL use default values

#### Scenario: Point event (no duration)
- **WHEN** an event has a `start` but no `end` field
- **THEN** the event SHALL be treated as a point event (instantaneous)
- **AND** it SHALL render as a marker rather than a bar

#### Scenario: Span event (has duration)
- **WHEN** an event has both `start` and `end` fields
- **THEN** the event SHALL be treated as a span event
- **AND** duration SHALL be calculated as `end - start`
- **AND** it SHALL render as a horizontal bar

#### Scenario: Invalid end before start
- **WHEN** an event has `end` earlier than `start`
- **THEN** the event SHALL be rejected
- **AND** an error message SHALL identify the invalid event by ID

#### Scenario: Same-day span event
- **WHEN** an event has `start` and `end` with identical values
- **THEN** it SHALL be accepted as valid
- **AND** it SHALL be treated as a zero-duration span event
- **AND** it MAY render visually as a point event

### Requirement: Time Formats

The system SHALL accept multiple human-readable time formats to accommodate different data sources and user expertise levels.

**Supported Formats:**

| Format | Example | Use Case |
|--------|---------|----------|
| ISO 8601 | `2024-03-15T10:30:00Z` | Precise modern dates |
| ISO 8601 Date | `2024-03-15` | Modern dates (day precision) |
| Year only | `1969` | Historical events |
| Negative year | `-44` | BCE dates (44 BCE, historical convention) |
| BCE/BC notation | `44 BCE` or `44 BC` | Human-readable ancient dates |
| CE/AD notation | `1066 CE` or `1066 AD` | Explicit era marking |
| Month-Year | `March 1969` or `1969-03` | Month precision |
| Geological (Ma) | `65 Ma` or `65 MYA` | Million years ago |
| Geological (Ga) | `4.5 Ga` or `4.5 BYA` | Billion years ago |
| Relative | `13.8 billion years ago` | Descriptive deep time |

**Year Numbering Convention:**
The system uses **historical year numbering** (no year zero). In this convention:
- Year 1 CE immediately follows year 1 BCE
- `-1` means 1 BCE, `-2` means 2 BCE, etc.
- This matches how historians write dates, NOT the astronomical convention

Note: Wikidata uses ISO 8601 (astronomical convention where year 0 exists). The Wikidata transformer automatically adjusts BCE dates by 1 year.

#### Scenario: ISO 8601 datetime parsing
- **WHEN** a time string `2024-03-15T10:30:00Z` is provided
- **THEN** it SHALL parse to the exact timestamp
- **AND** timezone SHALL be respected (UTC if Z suffix)

#### Scenario: Timezone-naive datetime
- **WHEN** a time string `2024-03-15T10:30:00` (no Z suffix or offset) is provided
- **THEN** it SHALL be treated as UTC
- **AND** no timezone conversion SHALL be applied

#### Scenario: Negative year parsing
- **WHEN** a time string `-44` is provided
- **THEN** it SHALL parse as 44 BCE (historical convention)
- **AND** the internal BigInt coordinate SHALL be negative

#### Scenario: Year zero rejection
- **WHEN** a time string `0` or `-0` is provided
- **THEN** a validation error SHALL be raised
- **AND** the error message SHALL explain that year zero does not exist in historical convention
- **AND** the hint SHALL suggest using `1 BCE` or `1 CE`

#### Scenario: BCE notation parsing
- **WHEN** a time string `44 BCE` or `44 BC` is provided
- **THEN** it SHALL parse as year 44 before common era
- **AND** case SHALL be insensitive (`bce`, `BCE`, `Bce` all valid)

#### Scenario: Geological Ma notation
- **WHEN** a time string `65 Ma` is provided
- **THEN** it SHALL parse as 65 million years ago
- **AND** the internal BigInt SHALL represent approximately -65,000,000 years in seconds

#### Scenario: Geological Ga notation
- **WHEN** a time string `4.5 Ga` is provided
- **THEN** it SHALL parse as 4.5 billion years ago
- **AND** the internal BigInt SHALL represent approximately -4,500,000,000 years in seconds

#### Scenario: Unknown format handling
- **WHEN** a time string cannot be parsed by any known format
- **THEN** an error SHALL be raised
- **AND** the error message SHALL include the unparseable string
- **AND** the error message SHALL list supported formats

### Requirement: Dataset Structure

The system SHALL accept datasets as JSON files containing an array of events with optional metadata.

**Simple Format (array only):**
```json
[
  { "id": "1", "start": "1969-07-20", "label": "Moon Landing" },
  { "id": "2", "start": "1066", "label": "Battle of Hastings" }
]
```

**Extended Format (with metadata):**
```json
{
  "name": "Space Exploration Timeline",
  "description": "Major events in human spaceflight",
  "version": "1.0",
  "source": "NASA Historical Archive",
  "license": "CC-BY-4.0",
  "events": [
    { "id": "1", "start": "1969-07-20", "label": "Moon Landing" }
  ]
}
```

#### Scenario: Simple array format
- **WHEN** a JSON file contains a top-level array
- **THEN** it SHALL be interpreted as a list of events
- **AND** dataset metadata SHALL be empty

#### Scenario: Extended format with metadata
- **WHEN** a JSON file contains an object with an `events` array
- **THEN** the `events` array SHALL be loaded
- **AND** top-level fields (`name`, `description`, etc.) SHALL be stored as dataset metadata

#### Scenario: Empty dataset
- **WHEN** a dataset contains zero events
- **THEN** it SHALL be accepted as valid
- **AND** the timeline SHALL display an empty state message

### Requirement: Wikidata Compatibility

The system SHALL support importing data transformed from Wikidata SPARQL query results with minimal transformation.

**Wikidata Property Mapping:**
| Wikidata Property | Nayra Field | Notes |
|-------------------|-------------|-------|
| `?item` (URI) | `id` | Extract Q-number: `wd:Q123` → `Q123` |
| `?itemLabel` | `label` | From `SERVICE wikibase:label` |
| `?itemDescription` | `description` | From `SERVICE wikibase:label` |
| P580 (`?startTime`) | `start` | Point in time (start) |
| P582 (`?endTime`) | `end` | Point in time (end) |
| P31 (`?instanceOf`) | `category` | Instance of (for classification) |
| `?article` | `url` | Wikipedia article URL |

**Example SPARQL Result → Nayra Event:**

SPARQL result binding:
```json
{
  "item": { "value": "http://www.wikidata.org/entity/Q11750" },
  "itemLabel": { "value": "Apollo 11" },
  "startTime": { "value": "1969-07-16T00:00:00Z" },
  "endTime": { "value": "1969-07-24T00:00:00Z" }
}
```

Transformed Nayra event:
```json
{
  "id": "Q11750",
  "label": "Apollo 11",
  "start": "1969-07-16",
  "end": "1969-07-24",
  "source": "wikidata:Q11750"
}
```

#### Scenario: Wikidata URI to ID extraction
- **WHEN** a source field contains `http://www.wikidata.org/entity/Q11750`
- **THEN** the ID SHALL be extracted as `Q11750`
- **AND** the source field SHALL be set to `wikidata:Q11750`

#### Scenario: Wikidata date format parsing
- **WHEN** a Wikidata date `1969-07-16T00:00:00Z` is provided
- **THEN** it SHALL parse correctly as ISO 8601
- **AND** the time component SHALL be preserved if non-midnight

#### Scenario: Wikidata precision handling
- **WHEN** Wikidata returns a date with year-only precision (e.g., `1969-01-01T00:00:00Z` with precision=9)
- **THEN** the transformer SHALL set `precision: "year"`
- **AND** the `start` field SHALL be simplified to `1969`
- **AND** display formatting SHALL show only the year

#### Scenario: Wikidata BCE date adjustment
- **WHEN** Wikidata returns a BCE date like `-0043-03-15` (astronomical year -43 = 44 BCE)
- **THEN** the transformer SHALL adjust to historical convention
- **AND** the result SHALL be `44 BCE` or equivalent

### Requirement: JSON-LD and Schema.org Support

The system SHALL accept events in JSON-LD format using Schema.org vocabulary, enabling interoperability with the semantic web ecosystem.

**Schema.org Property Mapping:**
| RDF Property | Nayra Field |
|--------------|-------------|
| `@id` or `schema:identifier` | `id` |
| `schema:name` | `label` |
| `schema:description` | `description` |
| `schema:startDate` | `start` |
| `schema:endDate` | `end` |
| `schema:url` | `url` |

**Example JSON-LD Event:**
```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "@id": "moon-landing",
  "name": "Apollo 11 Moon Landing",
  "startDate": "1969-07-20",
  "endDate": "1969-07-21"
}
```

#### Scenario: JSON-LD event import
- **WHEN** a JSON-LD file with `@context` and Schema.org Event types is loaded
- **THEN** the events SHALL be extracted using the property mapping
- **AND** `@id` values SHALL become event IDs

#### Scenario: JSON-LD array of events
- **WHEN** a JSON-LD file contains `@graph` with multiple events
- **THEN** all events in the graph SHALL be extracted
- **AND** each event SHALL be validated independently

**Future Consideration:** Support for additional ontologies (Dublin Core, CIDOC-CRM, Simple Event Model) may be added based on user demand.

### Requirement: Validation and Error Reporting

The system SHALL validate imported data and provide clear, actionable error messages.

**Validation Rules:**
1. Required fields (`id`, `start`, `label`) MUST be present
2. `id` MUST be a non-empty string
3. `id` values MUST be unique within a dataset
4. `end` MUST be greater than or equal to `start` (if present)
5. `priority` MUST be a number between 0 and 4 (if present)
6. `precision` MUST be one of: "day", "month", "year", "decade", "century" (if present)
7. Time strings MUST parse to valid dates

**Error Message Format:**
```
Validation Error: [RULE_CODE]
  Event: [id or index]
  Field: [field name]
  Value: [provided value]
  Expected: [what was expected]
  Hint: [how to fix]
```

#### Scenario: Missing required field
- **WHEN** an event is missing the `start` field
- **THEN** a validation error SHALL be raised
- **AND** the error SHALL identify the event by ID (or index if no ID)
- **AND** the error SHALL name the missing field

#### Scenario: Empty ID rejection
- **WHEN** an event has an empty string `""` as its `id`
- **THEN** a validation error SHALL be raised
- **AND** the hint SHALL suggest providing a meaningful identifier

#### Scenario: Duplicate ID detection
- **WHEN** two events have the same `id` value
- **THEN** a validation error SHALL be raised
- **AND** the error SHALL list both occurrences
- **AND** the hint SHALL suggest making IDs unique

#### Scenario: Invalid precision value
- **WHEN** an event has a `precision` value not in the allowed list
- **THEN** a validation error SHALL be raised
- **AND** the error SHALL list the allowed values: "day", "month", "year", "decade", "century"

#### Scenario: Partial import with warnings
- **WHEN** some events fail validation but others are valid
- **THEN** valid events SHALL be imported
- **AND** invalid events SHALL be skipped
- **AND** a summary SHALL report: "Imported X of Y events (Z errors)"

### Requirement: Example Data Files

The system SHALL provide example data files demonstrating different timescales and use cases.

#### Scenario: Recent history example
- **WHEN** loading `examples/space-exploration.json`
- **THEN** it SHALL contain events from 1957-present
- **AND** it SHALL demonstrate point events (launches) and span events (missions)

#### Scenario: Ancient history example
- **WHEN** loading `examples/ancient-civilizations.json`
- **THEN** it SHALL contain events using BCE notation
- **AND** it SHALL demonstrate approximate dates (year-only precision)

#### Scenario: Deep time example
- **WHEN** loading `examples/earth-history.json`
- **THEN** it SHALL contain geological events using Ma/Ga notation
- **AND** it SHALL span from Big Bang (13.8 Ga) to present

#### Scenario: Wikidata export example
- **WHEN** loading `examples/wikidata-wars.json`
- **THEN** it SHALL demonstrate the Wikidata property mapping
- **AND** it SHALL include `source` fields with Wikidata Q-numbers

