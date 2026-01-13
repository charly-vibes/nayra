Feature: User Interaction and Input Handling
  As a user
  I need to interact with timeline events
  So that I can explore, select, and get details about events

  Background:
    Given a timeline is displayed with events
    And the interaction layer is initialized

  # Mouse Interaction

  Scenario: Hover over an event
    Given the timeline is displayed
    When I move my mouse over an event
    Then the event should show a hover state
    And the cursor should change to a pointer
    And a tooltip may appear with event details

  Scenario: Click to select an event
    Given the timeline is displayed
    When I click on an event
    Then the event should be selected
    And the event should show a selected visual state
    And other events should be deselected
    And event details may be displayed in a panel

  Scenario: Multi-select events with Ctrl+Click
    Given the timeline is displayed
    And I have selected event A
    When I Ctrl+Click on event B
    Then both event A and event B should be selected
    And the selection should be visually indicated
    And I should be able to select additional events

  Scenario: Deselect event by clicking background
    Given an event is selected
    When I click on the timeline background (not on an event)
    Then the selected event should be deselected
    And the selection visual state should be removed

  Scenario: Double-click to zoom to event
    Given the timeline is displayed
    When I double-click on an event
    Then the viewport should animate to center on that event
    And the zoom level should adjust to show the event clearly
    And the animation should be smooth

  # Touch Interaction

  Scenario: Tap to select event on touch device
    Given the timeline is displayed on a touch device
    When I tap on an event
    Then the event should be selected
    And touch feedback should be provided

  Scenario: Pinch to zoom on touch device
    Given the timeline is displayed on a touch device
    When I perform a pinch gesture
    Then the timeline should zoom in or out
    And the zoom should center on the gesture midpoint
    And the interaction should feel responsive

  Scenario: Swipe to pan on touch device
    Given the timeline is displayed on a touch device
    When I swipe horizontally
    Then the timeline should pan in the swipe direction
    And momentum scrolling should apply after release

  # Hit Detection

  Scenario: Accurate hit detection for events
    Given events are rendered on the canvas
    When I click at screen coordinates (X, Y)
    Then the system should determine which event (if any) is at that position
    And the determination should use spatial hash lookup
    And the hit detection should complete within 1ms

  Scenario: Hit detection for overlapping events
    Given multiple events overlap at a screen position
    When I click at that position
    Then the frontmost (topmost lane) event should be selected
    And the hit detection should handle z-ordering correctly

  Scenario: Hit detection respects event shapes
    Given events with different shapes (points vs bars)
    When I click near an event edge
    Then the hit detection should use geometric intersection
    And clicks just outside the event should not trigger selection
    And precision should be maintained

  # Keyboard Navigation

  Scenario: Navigate events with Tab key
    Given the timeline is focused
    When I press Tab
    Then focus should move to the next event chronologically
    And the focused event should be highlighted
    And the viewport should pan to keep the focused event visible

  Scenario: Navigate events with Shift+Tab
    Given the timeline is focused
    When I press Shift+Tab
    Then focus should move to the previous event chronologically
    And the focused event should be highlighted

  Scenario: Select focused event with Enter
    Given an event has keyboard focus
    When I press Enter or Space
    Then the event should be selected
    And event details should be displayed

  Scenario: Home key jumps to first event
    Given the timeline is focused
    When I press Home
    Then the viewport should pan to the first event chronologically
    And the first event should be focused

  Scenario: End key jumps to last event
    Given the timeline is focused
    When I press End
    Then the viewport should pan to the last event chronologically
    And the last event should be focused

  # Tooltips and Event Details

  Scenario: Display tooltip on hover
    Given the timeline is displayed
    When I hover over an event for 500ms
    Then a tooltip should appear
    And the tooltip should show event title and time
    And the tooltip should position near the cursor without obscuring the event

  Scenario: Hide tooltip when mouse moves away
    Given a tooltip is displayed
    When I move the mouse away from the event
    Then the tooltip should disappear
    And the disappearance should be immediate or with a short delay

  Scenario: Display detailed event panel on selection
    Given the timeline is displayed
    When I select an event
    Then a detail panel should appear
    And the panel should show full event information
    And the panel should include title, description, time range, and metadata

  Scenario: Close detail panel
    Given an event detail panel is displayed
    When I click the close button or press Escape
    Then the detail panel should close
    And the event should remain selected (or be deselected based on design)

  # Search and Filter Interaction

  Scenario: Open search interface
    Given the timeline is displayed
    When I press Ctrl+F or click the search icon
    Then a search input field should appear
    And the field should be focused for immediate typing

  Scenario: Search for events by text
    Given the search interface is open
    When I type a search term
    Then matching events should be highlighted
    And non-matching events may be dimmed
    And the search should update in real-time as I type

  Scenario: Navigate search results
    Given search results are displayed
    When I press Enter or click "Next"
    Then the viewport should pan to the next matching event
    And the event should be highlighted or selected

  Scenario: Clear search
    Given a search is active
    When I clear the search field or press Escape
    Then all events should return to normal display
    And highlights should be removed

  # Context Menu

  Scenario: Open context menu on right-click
    Given the timeline is displayed
    When I right-click on an event
    Then a context menu should appear
    And the menu should offer relevant actions (e.g., "Details", "Zoom to event", "Copy link")

  Scenario: Context menu actions
    Given a context menu is open for an event
    When I click "Zoom to event"
    Then the viewport should animate to focus on that event
    And the context menu should close

  # Drag and Drop (if applicable)

  Scenario: Drag event to reposition (if editable)
    Given the timeline supports editing
    And I select an event
    When I drag the event horizontally
    Then the event should move in time
    And a preview should show the new position
    And the change should be applied on release

  # Performance Requirements

  Scenario: Input handling remains responsive
    Given the timeline is displaying 10,000 events
    When I interact with the timeline (click, hover, drag)
    Then input handling should respond within 16ms
    And interactions should feel immediate
    And no input lag should be perceptible

  Scenario: Hover state updates at 60 FPS
    Given the timeline is displayed
    When I move my mouse across events
    Then hover states should update smoothly
    And the frame rate should remain at 60 FPS
    And visual feedback should be immediate
