# Search and Filtering - Delta

## MODIFIED Requirements

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
- **WHEN** I type in the open search interface
- **THEN** the search results SHALL update after a debounce period of 150ms
- **AND** the filtering SHALL feel responsive without overwhelming the system on each keystroke
- **AND** no lag SHALL be perceptible

#### Scenario: Clear search results
- **WHEN** I clear the search input with a search active and showing results
- **THEN** all events SHALL return to normal display
- **AND** highlights SHALL be removed
- **AND** the full timeline SHALL be visible again

#### Scenario: Close search interface
- **WHEN** I press Escape while the search input is focused
- **THEN** the search interface SHALL close
- **AND** any active search SHALL be cleared
- **AND** focus SHALL return to the timeline
