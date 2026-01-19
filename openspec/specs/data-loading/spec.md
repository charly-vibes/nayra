# Data Loading and Persistence

## Purpose

The data loading system efficiently fetches, validates, and persists event data from various sources. The system SHALL support static JSON files with compression, IndexedDB caching, external data sources like SPARQL endpoints, and progressive loading for large datasets while maintaining application responsiveness.

## Requirements

### Requirement: Static JSON Loading

The system SHALL load event data from static JSON files efficiently.

#### Scenario: Basic JSON file loading
- **WHEN** the application loads with a JSON file existing at a URL
- **THEN** the JSON file SHALL be fetched
- **AND** the data SHALL be parsed
- **AND** events SHALL be loaded into the store
- **AND** the timeline SHALL render the events

#### Scenario: GZIP compression support
- **WHEN** the application fetches a GZIP-compressed JSON file
- **THEN** the browser SHALL automatically decompress it (via Accept-Encoding header)
- **AND** the decompressed data SHALL be parsed
- **AND** loading SHALL be efficient

#### Scenario: Brotli compression support
- **WHEN** the application fetches a Brotli-compressed JSON file
- **THEN** the browser SHALL automatically decompress it
- **AND** the data SHALL be loaded efficiently
- **AND** the file size SHALL be significantly reduced (5-10x smaller than raw JSON)

#### Scenario: Large dataset parsing
- **WHEN** a JSON file containing 100,000 events is loaded
- **THEN** parsing SHALL complete within a reasonable time (< 5 seconds)
- **AND** the JavaScript engine SHALL handle the data efficiently
- **AND** the application SHALL remain responsive

### Requirement: Data Validation

The system SHALL validate event data structure and handle errors gracefully.

#### Scenario: Event structure validation
- **WHEN** parsing events from loaded JSON data
- **THEN** each event SHALL have required fields (id, start time)
- **AND** optional fields SHALL be handled (end time, title, description)
- **AND** invalid events SHALL be logged or rejected
- **AND** the application SHALL remain stable

#### Scenario: Missing required fields
- **WHEN** validating an event missing a required field (e.g., start time)
- **THEN** the event SHALL be rejected
- **AND** an error SHALL be logged
- **AND** other valid events SHALL still load

#### Scenario: Malformed JSON handling
- **WHEN** attempting to load a JSON file with syntax errors
- **THEN** parsing SHALL fail gracefully
- **AND** an error message SHALL be displayed to the user
- **AND** the application SHALL not crash

### Requirement: Event Preprocessing

The system SHALL preprocess event data for efficient use.

#### Scenario: Sort events by start time
- **WHEN** the data is processed with events loaded in arbitrary order
- **THEN** events SHALL be sorted by start time
- **AND** the sorted order SHALL be maintained in the store
- **AND** layout algorithms SHALL use the sorted data

#### Scenario: Time string conversion
- **WHEN** parsing events with time data in string format (ISO 8601, "500 BC", etc.)
- **THEN** time strings SHALL be converted to BigInt coordinates
- **AND** the conversion SHALL use the TimeScale utility
- **AND** all events SHALL have consistent temporal coordinates

#### Scenario: Duration calculation
- **WHEN** parsing events with start and end times
- **THEN** the duration SHALL be calculated (end - start)
- **AND** the duration SHALL be stored as BigInt
- **AND** point events (no end time) SHALL have duration 0

### Requirement: Progressive Loading

The system SHALL support progressive loading for very large datasets.

#### Scenario: Chunked data loading
- **WHEN** loading a very large dataset (500,000+ events)
- **THEN** data SHALL be loaded in chunks
- **AND** each chunk SHALL be processed incrementally
- **AND** the UI SHALL remain responsive during loading
- **AND** a progress indicator SHALL be shown

#### Scenario: Progressive rendering
- **WHEN** each chunk is processed with data loading in chunks
- **THEN** events from that chunk SHALL be rendered
- **AND** the timeline SHALL update progressively
- **AND** users SHALL see data appearing incrementally

### Requirement: IndexedDB Integration

The system SHALL use IndexedDB for client-side data persistence and caching.

#### Scenario: Check cache on startup
- **WHEN** initialization occurs
- **THEN** the application SHALL check if data exists in IndexedDB
- **AND** it SHALL verify if the cached data is stale (e.g., by checking a version number or ETag)
- **AND** if cached data exists and is not stale, it SHALL be used
- **AND** fetching from network SHALL be skipped

#### Scenario: Store fetched data
- **WHEN** data is successfully loaded from a remote source
- **THEN** the data SHALL be stored in IndexedDB
- **AND** future loads SHALL use the cached data
- **AND** cache invalidation rules SHALL be applied

#### Scenario: Storage error handling
- **WHEN** storage fails (quota exceeded, permission denied, etc.) while attempting to write to IndexedDB
- **THEN** the error SHALL be caught gracefully
- **AND** the application SHALL fall back to in-memory storage
- **AND** an error MAY be logged

#### Scenario: Viewport range queries
- **WHEN** querying for visible events with a large dataset stored in IndexedDB and the viewport showing a specific time range
- **THEN** only events within the viewport range SHALL be fetched
- **AND** IndexedDB indices SHALL be used for efficient querying
- **AND** the query SHALL be asynchronous (non-blocking)

### Requirement: External Data Sources

The system SHALL support loading data from external sources like SPARQL endpoints.

#### Scenario: Wikidata SPARQL query
- **WHEN** the application loads data from Wikidata with a SPARQL query defined
- **THEN** the query SHALL be sent to https://query.wikidata.org/sparql
- **AND** CORS SHALL be handled (endpoint supports CORS)
- **AND** the response SHALL be parsed (JSON or XML format)
- **AND** events SHALL be extracted from the results

#### Scenario: SPARQL error handling
- **WHEN** the endpoint returns an error (timeout, invalid query, etc.) with a SPARQL query sent
- **THEN** the error SHALL be caught
- **AND** a user-friendly error message SHALL be displayed
- **AND** the application SHALL remain stable

#### Scenario: Pre-generated static approach
- **WHEN** the build runs (CI/CD pipeline) with a build script querying Wikidata
- **THEN** SPARQL query results SHALL be fetched
- **AND** results SHALL be saved as a static JSON file
- **AND** the static file SHALL be deployed with the application
- **AND** the application SHALL load the pre-generated file

### Requirement: Loading States and UX

The system SHALL provide clear feedback during data loading operations.

#### Scenario: Loading indicator display
- **WHEN** the application is loading with data being fetched
- **THEN** a loading indicator SHALL be displayed
- **AND** the indicator SHALL show progress if possible
- **AND** the user SHALL understand that data is loading

#### Scenario: Error message display
- **WHEN** the error occurs with data fetching failing
- **THEN** an error message SHALL be displayed
- **AND** the message SHALL explain the issue
- **AND** a retry option MAY be offered

#### Scenario: Empty dataset handling
- **WHEN** the data is loaded from a data source returning zero events
- **THEN** the timeline SHALL display an empty state message
- **AND** the message SHALL guide the user (e.g., "No events to display")
- **AND** the application SHALL remain stable

### Requirement: Performance Requirements

The system SHALL meet specific performance targets for data loading.

#### Scenario: 10,000 event loading
- **WHEN** a JSON file with 10,000 events is loaded and parsed
- **THEN** loading SHALL complete within 2 seconds
- **AND** the timeline SHALL be interactive
- **AND** performance SHALL not degrade

#### Scenario: Cached data startup
- **WHEN** the application starts with data cached in IndexedDB
- **THEN** startup SHALL complete within 500ms
- **AND** the timeline SHALL be immediately usable

### Requirement: Data Export

The system SHALL support exporting visible event data.

#### Scenario: Export visible events
- **WHEN** the user requests export with the timeline displaying a filtered or searched set of events
- **THEN** visible events SHALL be serialized to JSON
- **AND** the JSON SHALL be downloadable
- **AND** the format SHALL match the input schema

## Technical Notes

- Compression SHALL reduce file size by 5-10x, with Brotli preferred over GZIP for static assets
- IndexedDB indices SHALL be created on start time fields for efficient range queries
- Progressive loading SHALL use requestIdleCallback or Web Workers to avoid blocking main thread
- Cache invalidation SHALL use ETags or Last-Modified headers when available

## Related

- State Management: Loaded events stored through SET_EVENTS action
- Performance: Loading 10,000 events must complete within 2 seconds
- Event Layout: Sorted event data required for layout algorithms
- Browser Compatibility: IndexedDB and fetch API support required
