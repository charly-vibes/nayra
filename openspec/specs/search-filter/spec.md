# Search and Filtering

## Purpose

The search and filtering system enables users to quickly locate specific events within large datasets. The system SHALL provide real-time text search, category-based filtering, boolean operators, result navigation, and search persistence through URL encoding while maintaining sub-100ms search performance on 10,000+ events.

## Requirements

### Requirement: Text Search Interface

The system SHALL provide an accessible text search interface.

#### Scenario: Open search interface
- **WHEN** I press Ctrl+F or click the search button
- **THEN** a search input field SHALL appear
- **AND** the input SHALL be focused
- **AND** I SHALL be able to type immediately

#### Scenario: Search by title
- **WHEN** I type "World War" in the open search interface
- **THEN** events with "World War" in the title SHALL be highlighted
- **AND** other events MAY be dimmed or hidden
- **AND** the search SHALL be case-insensitive by default

#### Scenario: Search by description
- **WHEN** I type a term that appears in event descriptions in the open search interface
- **THEN** events with matching descriptions SHALL be highlighted
- **AND** the search SHALL include description text

#### Scenario: Real-time search filtering
- **WHEN** I type each character in the open search interface
- **THEN** the search results SHALL update immediately
- **AND** the filtering SHALL feel instantaneous
- **AND** no lag SHALL be perceptible

#### Scenario: Clear search results
- **WHEN** I clear the search input with a search active and showing results
- **THEN** all events SHALL return to normal display
- **AND** highlights SHALL be removed
- **AND** the full timeline SHALL be visible again

#### Scenario: Close search interface
- **WHEN** I press Escape or click outside the search box with the search interface open
- **THEN** the search interface SHALL close
- **AND** any active search SHALL be cleared
- **AND** focus SHALL return to the timeline

### Requirement: Search Results Navigation

The system SHALL enable navigation through search results.

#### Scenario: Navigate to first result
- **WHEN** I press Enter or click "Next" with a search returning multiple results
- **THEN** the viewport SHALL pan to the first matching event
- **AND** the event SHALL be centered or highlighted
- **AND** the event MAY be selected

#### Scenario: Navigate to next result
- **WHEN** I press Enter or click "Next" again while viewing a search result
- **THEN** the viewport SHALL pan to the next chronological match
- **AND** the new event SHALL be highlighted

#### Scenario: Navigate to previous result
- **WHEN** I press Shift+Enter or click "Previous" while viewing a search result
- **THEN** the viewport SHALL pan to the previous chronological match
- **AND** the previous event SHALL be highlighted

#### Scenario: Wrap around navigation
- **WHEN** I click "Next" while viewing the last search result
- **THEN** the navigation SHALL wrap to the first result
- **AND** the user SHALL be notified of the wraparound

#### Scenario: Display result count
- **WHEN** results are found with a search active
- **THEN** the UI SHALL display the total count (e.g., "5 results")
- **AND** the current result position (e.g., "Result 2 of 5")
- **AND** the count SHALL update as the search term changes

#### Scenario: No results handling
- **WHEN** no events match the search term with a search active
- **THEN** the UI SHALL display "No results found"
- **AND** the timeline SHALL show all events (dimmed or unhighlighted)
- **AND** the user SHALL be informed clearly

### Requirement: Advanced Search Features

The system SHALL support boolean operators and complex queries.

#### Scenario: AND operator
- **WHEN** I search for "World AND War" with the search interface supporting advanced syntax
- **THEN** only events containing both "World" and "War" SHALL match
- **AND** the search SHALL be logically correct

#### Scenario: OR operator
- **WHEN** I search for "Napoleon OR Bonaparte" with the search interface supporting advanced syntax
- **THEN** events containing either term SHALL match
- **AND** the results SHALL include both variants

#### Scenario: NOT operator
- **WHEN** I search for "War NOT World" with the search interface supporting advanced syntax
- **THEN** events containing "War" but not "World" SHALL match
- **AND** the filtering SHALL be correct

#### Scenario: Exact phrase matching
- **WHEN** I search for "\"World War II\"" with the search interface supporting quotes
- **THEN** only events with the exact phrase SHALL match
- **AND** partial matches SHALL be excluded

#### Scenario: Temporal range search
- **WHEN** I search for "1940-1945" or "between 1940 and 1945" with the search interface supporting temporal queries
- **THEN** events within that time range SHALL be highlighted
- **AND** events outside the range SHALL be filtered

### Requirement: Category Filtering

The system SHALL support filtering by event categories and tags.

#### Scenario: Filter by single category
- **WHEN** I select a category filter (e.g., "Military") with events having category metadata
- **THEN** only events in that category SHALL be displayed
- **AND** other events SHALL be hidden or dimmed
- **AND** the filter SHALL apply immediately

#### Scenario: Filter by multiple categories (OR)
- **WHEN** I add another category (e.g., "Military" OR "Political") with one category filter selected
- **THEN** events in either category SHALL be displayed
- **AND** the filter SHALL use OR logic

#### Scenario: Filter by multiple categories (AND)
- **WHEN** I select multiple filters with AND logic and events can have multiple tags
- **THEN** only events matching all selected categories SHALL be shown
- **AND** the filtering SHALL be strict

#### Scenario: Clear category filters
- **WHEN** I click "Clear filters" or deselect all categories with category filters active
- **THEN** all events SHALL be displayed again
- **AND** the timeline SHALL return to normal state

### Requirement: Combined Search and Filtering

The system SHALL support simultaneous text search and category filtering.

#### Scenario: Apply both search and filter
- **WHEN** both are active with a search term entered and a category filter selected
- **THEN** only events matching BOTH criteria SHALL be displayed
- **AND** the combination SHALL use AND logic
- **AND** the filtering SHALL be accurate

#### Scenario: Clear search independently
- **WHEN** I clear the search term with both search and filters active
- **THEN** category filters SHALL remain active
- **AND** events SHALL still be filtered by category
- **AND** the search SHALL be removed independently

### Requirement: Search Performance

The system SHALL maintain fast search performance on large datasets.

#### Scenario: Efficient search on large datasets
- **WHEN** I perform a text search on a timeline with 10,000 events
- **THEN** the search SHALL complete within 100ms
- **AND** results SHALL update in real-time as I type
- **AND** the application SHALL remain responsive

#### Scenario: Indexed search for very large datasets
- **WHEN** performing searches on a timeline with 100,000+ events
- **THEN** an inverted index or similar structure SHALL be used
- **AND** searches SHALL remain fast (< 200ms)
- **AND** IndexedDB or Web Worker MAY assist

### Requirement: Search Persistence

The system SHALL persist search state through URL encoding.

#### Scenario: Preserve search in URL
- **WHEN** the URL is updated with a search active
- **THEN** the search term SHALL be encoded in the hash
- **AND** sharing the URL SHALL restore the search
- **AND** the filtered view SHALL be reproducible

#### Scenario: Restore search from URL
- **WHEN** the timeline loads with a URL containing a search parameter
- **THEN** the search SHALL be applied automatically
- **AND** the results SHALL be displayed
- **AND** the search input SHALL show the term

### Requirement: Search Accessibility

The system SHALL provide accessible search functionality.

#### Scenario: Keyboard-accessible search
- **WHEN** navigating with keyboard only with the search interface open
- **THEN** all search controls SHALL be accessible
- **AND** Tab SHALL navigate through results and controls
- **AND** Enter SHALL activate search actions

#### Scenario: Screen reader announcements
- **WHEN** search results are updated with a screen reader active
- **THEN** an ARIA live region SHALL announce the result count
- **AND** the announcement SHALL be clear (e.g., "5 results found")
- **AND** users SHALL be informed of search state changes

## Technical Notes

- Real-time search SHALL use debouncing (e.g., 150ms delay) to prevent excessive computation while typing
- Inverted index SHALL map terms to event IDs for O(1) lookup in very large datasets
- Search highlighting SHALL be implemented through state flags rather than DOM manipulation for performance
- URL encoding SHALL use query parameters or hash fragments to preserve search state

## Related

- User Interaction: Search interface integrated with event selection and navigation
- State Management: Search state managed through central store
- Performance: Search must complete within 100ms for 10K events
- Accessibility: Search interface must be keyboard and screen reader accessible
