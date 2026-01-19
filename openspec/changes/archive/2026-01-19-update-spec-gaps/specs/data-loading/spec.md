# Data Loading and Persistence - Delta

## MODIFIED Requirements

### Requirement: External Data Sources (Future Consideration)

The system SHALL optionally support loading data from external sources like SPARQL endpoints. The recommended approach for initial implementation is the pre-generated static file method.

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

## ADDED Requirements

### Requirement: Out of Scope - Offline Support

The system SHALL NOT implement Service Worker-based offline support in the initial version. This is explicitly out of scope.

#### Scenario: No Service Worker registration
- **WHEN** the application loads
- **THEN** no Service Worker SHALL be registered
- **AND** the application SHALL require network connectivity for initial data load

#### Scenario: Cached data only via IndexedDB
- **WHEN** data has been previously loaded and cached in IndexedDB
- **THEN** the cached data SHALL be available on subsequent visits
- **AND** this caching is independent of Service Worker functionality
- **AND** cache invalidation SHALL follow standard IndexedDB patterns

#### Scenario: Network failure handling
- **WHEN** the network is unavailable and no cached data exists
- **THEN** an error message SHALL be displayed
- **AND** the user SHALL be informed that network connectivity is required
- **AND** a retry option SHALL be offered when possible
