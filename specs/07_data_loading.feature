Feature: Data Loading and Persistence
  As a timeline application
  I need to load event data efficiently
  So that users can visualize datasets of various sizes

  Background:
    Given the timeline application is initialized

  # Static JSON Loading

  Scenario: Load events from static JSON file
    Given a JSON file exists at a URL
    When the application loads
    Then the JSON file should be fetched
    And the data should be parsed
    And events should be loaded into the store
    And the timeline should render the events

  Scenario: Handle compressed JSON (GZIP)
    Given a GZIP-compressed JSON file is available
    When the application fetches the file
    Then the browser should automatically decompress it (via Accept-Encoding header)
    And the decompressed data should be parsed
    And loading should be efficient

  Scenario: Handle Brotli compression
    Given a Brotli-compressed JSON file is available
    When the application fetches the file
    Then the browser should automatically decompress it
    And the data should be loaded efficiently
    And the file size should be significantly reduced (5-10x smaller than raw JSON)

  Scenario: Parse large JSON datasets
    Given a JSON file containing 100,000 events
    When the file is loaded
    Then parsing should complete within a reasonable time (< 5 seconds)
    And the JavaScript engine should handle the data efficiently
    And the application should remain responsive

  # Data Validation

  Scenario: Validate event data structure
    Given JSON data is loaded
    When parsing events
    Then each event should have required fields (id, start time)
    And optional fields should be handled (end time, title, description)
    And invalid events should be logged or rejected
    And the application should remain stable

  Scenario: Handle missing required fields
    Given an event is missing a required field (e.g., start time)
    When validating the event
    Then the event should be rejected
    And an error should be logged
    And other valid events should still load

  Scenario: Handle malformed JSON
    Given a JSON file with syntax errors
    When attempting to load the file
    Then parsing should fail gracefully
    And an error message should be displayed to the user
    And the application should not crash

  # Event Preprocessing

  Scenario: Sort events by start time after loading
    Given events are loaded in arbitrary order
    When the data is processed
    Then events should be sorted by start time
    And the sorted order should be maintained in the store
    And layout algorithms should use the sorted data

  Scenario: Convert time strings to BigInt coordinates
    Given events with time data in string format (ISO 8601, "500 BC", etc.)
    When parsing events
    Then time strings should be converted to BigInt coordinates
    And the conversion should use the TimeScale utility
    And all events should have consistent temporal coordinates

  Scenario: Calculate event durations
    Given events with start and end times
    When parsing events
    Then the duration should be calculated (end - start)
    And the duration should be stored as BigInt
    And point events (no end time) should have duration 0

  # Progressive Loading

  Scenario: Load data in chunks for large datasets
    Given a very large dataset (500,000+ events)
    When loading the data
    Then data should be loaded in chunks
    And each chunk should be processed incrementally
    And the UI should remain responsive during loading
    And a progress indicator should be shown

  Scenario: Display events as they load
    Given data is loading in chunks
    When each chunk is processed
    Then events from that chunk should be rendered
    And the timeline should update progressively
    And users should see data appearing incrementally

  # IndexedDB Integration

  Scenario: Check for cached data in IndexedDB on startup
    Given the application is loading
    When initialization occurs
    Then the application should check if data exists in IndexedDB
    And if cached data exists and is valid, it should be used
    And fetching from network should be skipped

  Scenario: Store fetched data in IndexedDB
    Given data is fetched from a remote source
    When the data is successfully loaded
    Then the data should be stored in IndexedDB
    And future loads should use the cached data
    And cache invalidation rules should be applied

  Scenario: Handle IndexedDB storage errors
    Given the application attempts to write to IndexedDB
    When storage fails (quota exceeded, permission denied, etc.)
    Then the error should be caught gracefully
    And the application should fall back to in-memory storage
    And an error may be logged

  Scenario: Query IndexedDB for viewport range
    Given a large dataset is stored in IndexedDB
    And the viewport shows a specific time range
    When querying for visible events
    Then only events within the viewport range should be fetched
    And IndexedDB indices should be used for efficient querying
    And the query should be asynchronous (non-blocking)

  # External Data Sources (SPARQL/Wikidata)

  Scenario: Fetch data from Wikidata SPARQL endpoint
    Given a SPARQL query is defined
    When the application loads data from Wikidata
    Then the query should be sent to https://query.wikidata.org/sparql
    And CORS should be handled (endpoint supports CORS)
    And the response should be parsed (JSON or XML format)
    And events should be extracted from the results

  Scenario: Handle SPARQL query errors
    Given a SPARQL query is sent
    When the endpoint returns an error (timeout, invalid query, etc.)
    Then the error should be caught
    And a user-friendly error message should be displayed
    And the application should remain stable

  Scenario: Hybrid approach: Pre-generate static JSON from SPARQL
    Given a build script queries Wikidata
    When the build runs (CI/CD pipeline)
    Then SPARQL query results should be fetched
    And results should be saved as a static JSON file
    And the static file should be deployed with the application
    And the application should load the pre-generated file (more reliable than live queries)

  # Loading States and UX

  Scenario: Show loading indicator
    Given data is being fetched
    When the application is loading
    Then a loading indicator should be displayed
    And the indicator should show progress if possible
    And the user should understand that data is loading

  Scenario: Display error message on load failure
    Given data fetching fails
    When the error occurs
    Then an error message should be displayed
    And the message should explain the issue
    And a retry option may be offered

  Scenario: Handle empty datasets
    Given a data source returns zero events
    When the data is loaded
    Then the timeline should display an empty state message
    And the message should guide the user (e.g., "No events to display")
    And the application should remain stable

  # Performance Requirements

  Scenario: Load 10,000 events efficiently
    Given a JSON file with 10,000 events
    When the file is loaded and parsed
    Then loading should complete within 2 seconds
    And the timeline should be interactive
    And performance should not degrade

  Scenario: Startup time under 500ms for cached data
    Given data is cached in IndexedDB
    When the application starts
    Then startup should complete within 500ms
    And the timeline should be immediately usable

  # Data Export (optional)

  Scenario: Export visible events to JSON
    Given the timeline is displaying a filtered or searched set of events
    When the user requests export
    Then visible events should be serialized to JSON
    And the JSON should be downloadable
    And the format should match the input schema
