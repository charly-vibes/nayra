# State Management

## Purpose

The state management system provides centralized, predictable state handling through a unidirectional data flow architecture. The system SHALL maintain immutable state, notify subscribers of changes efficiently, and support state persistence through URL encoding.
## Requirements
### Requirement: Central Store Initialization

The system SHALL initialize a central store with complete application state.

#### Scenario: Store creation with default state
- **WHEN** the store is created
- **THEN** the state SHALL include viewportStart as BigInt
- **AND** the state SHALL include viewportEnd as BigInt
- **AND** the state SHALL include zoomLevel as Number
- **AND** the state SHALL include events as Array
- **AND** the state SHALL include selectedEventIds as Set
- **AND** the state SHALL include hoveredEventId as nullable ID

#### Scenario: Immutable state updates
- **WHEN** an action updates the state with the store having a current state
- **THEN** a new state object SHALL be created
- **AND** the previous state SHALL remain unchanged
- **AND** references to unchanged parts SHALL be preserved (structural sharing)

### Requirement: Unidirectional Data Flow

The system SHALL enforce unidirectional data flow from actions through state to views.

#### Scenario: Action dispatch and state update
- **WHEN** I dispatch a "PAN_VIEWPORT" action with offset data on the initialized store
- **THEN** the store SHALL update viewportStart and viewportEnd
- **AND** all subscribers SHALL be notified
- **AND** the UI SHALL re-render

#### Scenario: Single state update per action
- **WHEN** I dispatch an action on the initialized store
- **THEN** the state SHALL be updated exactly once
- **AND** subscribers SHALL be notified exactly once
- **AND** the data flow SHALL be unidirectional (action → state → view)

### Requirement: Subscriber Management

The system SHALL provide subscription mechanisms for state change notifications.

#### Scenario: Subscribe to changes
- **WHEN** I subscribe a listener function to the initialized store
- **THEN** the listener SHALL be added to the subscriber list
- **AND** the listener SHALL be called on state changes

#### Scenario: Notify subscribers
- **WHEN** the state is updated with multiple subscribers registered
- **THEN** all subscribers SHALL be called
- **AND** subscribers SHALL receive the new state
- **AND** subscribers SHALL be called in registration order

#### Scenario: Unsubscribe from changes
- **WHEN** I unsubscribe a listener subscribed to the store
- **THEN** the listener SHALL be removed from the subscriber list
- **AND** the listener SHALL not be called on future state changes

### Requirement: Viewport State Actions

The system SHALL provide actions for viewport manipulation.

#### Scenario: Set viewport bounds
- **WHEN** I dispatch a "SET_VIEWPORT" action with start and end times
- **THEN** viewportStart SHALL be updated
- **AND** viewportEnd SHALL be updated
- **AND** the dirty flag SHALL be set

#### Scenario: Update zoom level
- **WHEN** I dispatch a "SET_ZOOM" action with a new zoom level
- **THEN** zoomLevel SHALL be updated
- **AND** viewportEnd SHALL be recalculated based on viewportStart and new zoom
- **AND** the dirty flag SHALL be set

### Requirement: Selection State Actions

The system SHALL provide actions for event selection management.

#### Scenario: Select single event
- **WHEN** I dispatch a "SELECT_EVENT" action with an event ID
- **THEN** the event ID SHALL be added to selectedEventIds
- **AND** previous selections SHALL be cleared (unless multi-select)
- **AND** the dirty flag SHALL be set

#### Scenario: Toggle event selection
- **WHEN** I dispatch a "TOGGLE_EVENT_SELECTION" action with an event ID
- **THEN** if the event is not selected, it SHALL be added to selectedEventIds
- **AND** if the event is selected, it SHALL be removed from selectedEventIds
- **AND** the dirty flag SHALL be set

#### Scenario: Clear all selections
- **WHEN** I dispatch a "CLEAR_SELECTION" action
- **THEN** selectedEventIds SHALL be emptied
- **AND** the dirty flag SHALL be set

### Requirement: Hover State Actions

The system SHALL provide actions for hover state management.

#### Scenario: Set hover state
- **WHEN** I dispatch a "SET_HOVER" action with an event ID
- **THEN** hoveredEventId SHALL be updated to the new ID
- **AND** the dirty flag SHALL be set

#### Scenario: Clear hover state
- **WHEN** I dispatch a "SET_HOVER" action with null
- **THEN** hoveredEventId SHALL be set to null
- **AND** the dirty flag SHALL be set

### Requirement: Event Data Actions

The system SHALL provide actions for event data management.

#### Scenario: Load events
- **WHEN** I dispatch a "SET_EVENTS" action with event data
- **THEN** the events array SHALL be updated
- **AND** events SHALL be sorted by start time
- **AND** the dirty flag SHALL be set

### Requirement: Derived State Queries

The system SHALL provide efficient queries for derived state.

#### Scenario: Query visible events
- **WHEN** querying for visible events with the store state including viewport bounds and all events
- **THEN** only events within the viewport time range SHALL be returned
- **AND** the query SHALL be efficient (using binary search or spatial index)

#### Scenario: Query selected events
- **WHEN** querying for selected event objects with selectedEventIds containing event IDs
- **THEN** the full event objects SHALL be returned
- **AND** the lookup SHALL be efficient

### Requirement: State Persistence

The system SHALL persist and restore state through URL encoding.

#### Scenario: Serialize to URL hash
- **WHEN** serializing to URL with the store having current viewport and zoom state
- **THEN** viewportStart SHALL be encoded in the hash
- **AND** zoomLevel SHALL be encoded in the hash
- **AND** the hash SHALL be compact and URL-safe

#### Scenario: Deserialize from URL hash
- **WHEN** loading the application with a URL hash containing encoded state
- **THEN** viewportStart SHALL be restored from the hash
- **AND** zoomLevel SHALL be restored from the hash
- **AND** the timeline SHALL display the saved view

#### Scenario: Persist selection to URL
- **WHEN** updating the URL with events selected
- **THEN** selectedEventIds MAY be encoded in the hash
- **AND** sharing the URL SHALL restore the selection

### Requirement: Performance and Efficiency

The system SHALL maintain efficient state updates regardless of data size.

#### Scenario: Efficient state updates
- **WHEN** an action updates the state with the store managing 10,000 events
- **THEN** the state update SHALL complete within 1ms
- **AND** only changed properties SHALL trigger re-renders

#### Scenario: Selective subscription
- **WHEN** an unrelated state property changes (e.g., selectedEventIds) with a subscriber depending only on viewport state
- **THEN** the subscriber MAY choose not to re-render
- **AND** the system SHALL support selective subscription as optional optimization

### Requirement: Error Handling

The system SHALL handle invalid actions and state gracefully.

#### Scenario: Unknown action handling
- **WHEN** I dispatch an unknown action type
- **THEN** the store SHALL ignore the action or log a warning
- **AND** the state SHALL remain unchanged
- **AND** the application SHALL remain stable

#### Scenario: Invalid state value handling
- **WHEN** an action attempts to set an invalid state (e.g., negative zoom)
- **THEN** the action SHALL be rejected or sanitized
- **AND** the state SHALL remain valid
- **AND** an error MAY be logged

### Requirement: Out of Scope - Undo/Redo

The system SHALL NOT implement undo/redo functionality in the initial version. This is explicitly out of scope.

#### Scenario: No undo action
- **WHEN** I press Ctrl+Z on a focused timeline
- **THEN** no undo action SHALL occur
- **AND** the browser's default behavior MAY be allowed or prevented
- **AND** no error SHALL be raised

#### Scenario: No redo action
- **WHEN** I press Ctrl+Y or Ctrl+Shift+Z on a focused timeline
- **THEN** no redo action SHALL occur
- **AND** the browser's default behavior MAY be allowed or prevented

#### Scenario: State history not maintained
- **WHEN** state changes occur (viewport pan, selection change, etc.)
- **THEN** previous states SHALL NOT be stored for undo purposes
- **AND** memory usage SHALL not grow with action count

## Technical Notes

- State immutability SHALL be enforced through object spreading or immutable data structures
- Structural sharing optimization SHALL reuse unchanged state subtrees to minimize memory allocation
- Dirty flag pattern SHALL prevent unnecessary re-renders when state hasn't changed
- BigInt temporal coordinates SHALL be serialized to string format for URL encoding

## Related

- Viewport Navigation: Viewport actions drive navigation state
- User Interaction: Selection and hover actions track interaction state
- Data Loading: Events loaded into store through SET_EVENTS action
- Performance: State updates must complete within 1ms
