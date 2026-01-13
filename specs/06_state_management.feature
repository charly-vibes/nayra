Feature: State Management
  As a timeline visualization system
  I need centralized state management
  So that the UI remains synchronized and predictable

  Background:
    Given the timeline application is initialized
    And a central store is created

  # Central Store Pattern

  Scenario: Initialize store with default state
    When the store is created
    Then the state should include viewportStart as BigInt
    And the state should include viewportEnd as BigInt
    And the state should include zoomLevel as Number
    And the state should include events as Array
    And the state should include selectedEventIds as Set
    And the state should include hoveredEventId as nullable ID

  Scenario: Store maintains immutable state
    Given the store has a current state
    When an action updates the state
    Then a new state object should be created
    And the previous state should remain unchanged
    And references to unchanged parts should be preserved (structural sharing)

  # Unidirectional Data Flow

  Scenario: Dispatch action to update state
    Given the store is initialized
    When I dispatch a "PAN_VIEWPORT" action with offset data
    Then the store should update viewportStart and viewportEnd
    And all subscribers should be notified
    And the UI should re-render

  Scenario: Action triggers single state update
    Given the store is initialized
    When I dispatch an action
    Then the state should be updated exactly once
    And subscribers should be notified exactly once
    And the data flow should be unidirectional (action → state → view)

  # Subscriber Pattern

  Scenario: Subscribe to store changes
    Given the store is initialized
    When I subscribe a listener function
    Then the listener should be added to the subscriber list
    And the listener should be called on state changes

  Scenario: Notify subscribers on state change
    Given multiple subscribers are registered
    When the state is updated
    Then all subscribers should be called
    And subscribers should receive the new state
    And subscribers should be called in registration order

  Scenario: Unsubscribe from store
    Given a listener is subscribed to the store
    When I unsubscribe the listener
    Then the listener should be removed from the subscriber list
    And the listener should not be called on future state changes

  # State Actions

  Scenario: Update viewport (pan)
    When I dispatch a "SET_VIEWPORT" action with start and end times
    Then viewportStart should be updated
    And viewportEnd should be updated
    And the dirty flag should be set

  Scenario: Update zoom level
    When I dispatch a "SET_ZOOM" action with a new zoom level
    Then zoomLevel should be updated
    And viewportEnd should be recalculated based on viewportStart and new zoom
    And the dirty flag should be set

  Scenario: Select event
    When I dispatch a "SELECT_EVENT" action with an event ID
    Then the event ID should be added to selectedEventIds
    And previous selections should be cleared (unless multi-select)
    And the dirty flag should be set

  Scenario: Multi-select event
    When I dispatch a "TOGGLE_EVENT_SELECTION" action with an event ID
    Then if the event is not selected, it should be added to selectedEventIds
    And if the event is selected, it should be removed from selectedEventIds
    And the dirty flag should be set

  Scenario: Clear selection
    When I dispatch a "CLEAR_SELECTION" action
    Then selectedEventIds should be emptied
    And the dirty flag should be set

  Scenario: Set hover state
    When I dispatch a "SET_HOVER" action with an event ID
    Then hoveredEventId should be updated to the new ID
    And the dirty flag should be set

  Scenario: Clear hover state
    When I dispatch a "SET_HOVER" action with null
    Then hoveredEventId should be set to null
    And the dirty flag should be set

  Scenario: Load events data
    When I dispatch a "SET_EVENTS" action with event data
    Then the events array should be updated
    And events should be sorted by start time
    And the dirty flag should be set

  # Derived State

  Scenario: Calculate visible events from viewport
    Given the store state includes viewport bounds
    And the store state includes all events
    When querying for visible events
    Then only events within the viewport time range should be returned
    And the query should be efficient (using binary search or spatial index)

  Scenario: Get selected events
    Given selectedEventIds contains event IDs
    When querying for selected event objects
    Then the full event objects should be returned
    And the lookup should be efficient

  # State Persistence

  Scenario: Serialize state to URL hash
    Given the store has a current viewport and zoom state
    When serializing to URL
    Then viewportStart should be encoded in the hash
    And zoomLevel should be encoded in the hash
    And the hash should be compact and URL-safe

  Scenario: Deserialize state from URL hash
    Given a URL hash contains encoded state
    When loading the application
    Then viewportStart should be restored from the hash
    And zoomLevel should be restored from the hash
    And the timeline should display the saved view

  Scenario: Persist selection to URL (optional)
    Given events are selected
    When updating the URL
    Then selectedEventIds may be encoded in the hash
    And sharing the URL should restore the selection

  # Performance and Efficiency

  Scenario: State updates are efficient
    Given the store manages 10,000 events
    When an action updates the state
    Then the state update should complete within 1ms
    And only changed properties should trigger re-renders

  Scenario: Subscribers only re-render when relevant state changes
    Given a subscriber only depends on viewport state
    When an unrelated state property changes (e.g., selectedEventIds)
    Then the subscriber may choose not to re-render
    And the system should support selective subscription (optional optimization)

  # Error Handling

  Scenario: Handle invalid action
    When I dispatch an unknown action type
    Then the store should ignore the action or log a warning
    And the state should remain unchanged
    And the application should remain stable

  Scenario: Handle invalid state values
    When an action attempts to set an invalid state (e.g., negative zoom)
    Then the action should be rejected or sanitized
    And the state should remain valid
    And an error may be logged
