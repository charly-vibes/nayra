# User Interaction and Input Handling

## Purpose

The user interaction system provides responsive, multi-modal input handling for event exploration and manipulation. The system SHALL support mouse, touch, and keyboard input with accurate hit detection, visual feedback, and accessibility features, maintaining sub-16ms response times for all interactions.

## Requirements

### Requirement: Mouse Interaction

The system SHALL provide responsive mouse-based interaction with visual feedback.

#### Scenario: Event hover state
- **WHEN** I move my mouse over an event
- **THEN** the event SHALL show a hover state
- **AND** the cursor SHALL change to a pointer
- **AND** a tooltip MAY appear with event details

#### Scenario: Event selection
- **WHEN** I click on an event
- **THEN** the event SHALL be selected
- **AND** the event SHALL show a selected visual state
- **AND** other events SHALL be deselected
- **AND** event details MAY be displayed in a panel

#### Scenario: Multi-select with modifier
- **WHEN** I Ctrl+Click (or Cmd+Click on macOS) on event B with event A already selected
- **THEN** both event A and event B SHALL be selected
- **AND** the selection SHALL be visually indicated
- **AND** I SHALL be able to select additional events

#### Scenario: Deselect via background click
- **WHEN** I click on the timeline background (not on an event) with an event selected
- **THEN** the selected event SHALL be deselected
- **AND** the selection visual state SHALL be removed

#### Scenario: Double-click zoom to event
- **WHEN** I double-click on an event
- **THEN** the viewport SHALL animate to center on that event
- **AND** the zoom level SHALL adjust to show the event clearly
- **AND** the animation SHALL be smooth

### Requirement: Touch Interaction

The system SHALL support touch gestures on mobile and tablet devices.

#### Scenario: Tap to select on touch device
- **WHEN** I tap on an event on a touch device
- **THEN** the event SHALL be selected
- **AND** touch feedback SHALL be provided

#### Scenario: Pinch to zoom on touch device
- **WHEN** I perform a pinch gesture on a timeline displayed on a touch device
- **THEN** the timeline SHALL zoom in or out
- **AND** the zoom SHALL center on the gesture midpoint
- **AND** the interaction SHALL feel responsive

#### Scenario: Swipe to pan on touch device
- **WHEN** I swipe horizontally on a timeline displayed on a touch device
- **THEN** the timeline SHALL pan in the swipe direction
- **AND** momentum scrolling SHALL apply after release

### Requirement: Hit Detection

The system SHALL provide accurate, efficient hit detection for all interactive elements.

#### Scenario: Accurate event hit detection
- **WHEN** I click at screen coordinates (X, Y) with events rendered on the canvas
- **THEN** the system SHALL determine which event (if any) is at that position
- **AND** the determination SHALL use spatial hash lookup
- **AND** the hit detection SHALL complete within 1ms

#### Scenario: Overlapping event hit detection
- **WHEN** I click at a position with multiple overlapping events
- **THEN** the frontmost (topmost lane) event SHALL be selected
- **AND** the hit detection SHALL handle z-ordering correctly

#### Scenario: Shape-aware hit detection
- **WHEN** I click near an event edge with events having different shapes (points vs bars)
- **THEN** the hit detection SHALL use geometric intersection
- **AND** clicks just outside the event SHALL not trigger selection
- **AND** precision SHALL be maintained (i.e., based on geometry, not bounding box)

### Requirement: Keyboard Navigation

The system SHALL provide full keyboard navigation support for accessibility.

#### Scenario: Tab navigation forward
- **WHEN** I press Tab on a focused timeline
- **THEN** focus SHALL move to the next event chronologically
- **AND** the focused event SHALL be highlighted
- **AND** the viewport SHALL pan to keep the focused event visible

#### Scenario: Tab navigation backward
- **WHEN** I press Shift+Tab on a focused timeline
- **THEN** focus SHALL move to the previous event chronologically
- **AND** the focused event SHALL be highlighted

#### Scenario: Activate focused event
- **WHEN** I press Enter or Space with an event having keyboard focus
- **THEN** the event SHALL be selected
- **AND** event details SHALL be displayed

#### Scenario: Home key navigation
- **WHEN** I press Home on a focused timeline
- **THEN** the viewport SHALL pan to the first event chronologically
- **AND** the first event SHALL be focused

#### Scenario: End key navigation
- **WHEN** I press End on a focused timeline
- **THEN** the viewport SHALL pan to the last event chronologically
- **AND** the last event SHALL be focused

### Requirement: Tooltips and Details

The system SHALL display contextual information through tooltips and detail panels.

#### Scenario: Tooltip display on hover
- **WHEN** I hover over an event for 500ms
- **THEN** a tooltip SHALL appear
- **AND** the tooltip SHALL show event title and time
- **AND** the tooltip SHALL position near the cursor without obscuring the event

#### Scenario: Tooltip hiding
- **WHEN** I move the mouse away from the event with a tooltip displayed
- **THEN** the tooltip SHALL disappear
- **AND** the disappearance SHALL be immediate or with a short delay

#### Scenario: Detail panel display
- **WHEN** I select an event
- **THEN** a detail panel SHALL appear
- **AND** the panel SHALL show full event information
- **AND** the panel SHALL include title, description, time range, and metadata

#### Scenario: Detail panel closing
- **WHEN** I click the close button or press Escape with an event detail panel displayed
- **THEN** the detail panel SHALL close
- **AND** the event SHALL remain selected

### Requirement: Search Interface Integration

The system SHALL integrate search functionality with user interaction.

#### Scenario: Open search interface
- **WHEN** I press Ctrl+F or click the search icon
- **THEN** a search input field SHALL appear
- **AND** the field SHALL be focused for immediate typing

#### Scenario: Text search execution
- **WHEN** I type a search term in the open search interface
- **THEN** matching events SHALL be highlighted
- **AND** non-matching events MAY be dimmed
- **AND** the search SHALL update in real-time as I type

#### Scenario: Search result navigation
- **WHEN** I press Enter or click "Next" with search results displayed
- **THEN** the viewport SHALL pan to the next matching event
- **AND** the event SHALL be highlighted or selected

#### Scenario: Clear search
- **WHEN** I clear the search field or press Escape with a search active
- **THEN** all events SHALL return to normal display
- **AND** highlights SHALL be removed

### Requirement: Context Menu

The system SHALL provide contextual actions through right-click menus.

#### Scenario: Context menu display
- **WHEN** I right-click on an event
- **THEN** a context menu SHALL appear
- **AND** the menu SHALL offer relevant actions (e.g., "Details", "Zoom to event", "Copy link")

#### Scenario: Context menu action execution
- **WHEN** I click "Zoom to event" with a context menu open for an event
- **THEN** the viewport SHALL animate to focus on that event
- **AND** the context menu SHALL close

### Requirement: Drag and Drop (Conditional)

The system SHALL support event repositioning through drag and drop when an explicit edit mode is enabled.

#### Scenario: Event repositioning via drag in edit mode
- **WHEN** I drag a selected event horizontally on a timeline that has editing enabled
- **THEN** the event SHALL move in time
- **AND** a preview SHALL show the new position
- **AND** the change SHALL be applied on release

### Requirement: Input Performance

The system SHALL maintain responsive input handling under all conditions.

#### Scenario: Responsive input handling
- **WHEN** I interact with the timeline (click, hover, drag) displaying 10,000 events
- **THEN** input handling SHALL respond within 16ms
- **AND** interactions SHALL feel immediate
- **AND** no input lag SHALL be perceptible

#### Scenario: Smooth hover state updates
- **WHEN** I move my mouse across events
- **THEN** hover states SHALL update smoothly
- **AND** the frame rate SHALL remain at 60 FPS
- **AND** visual feedback SHALL be immediate

## Technical Notes

- Hit detection SHALL use spatial hash indexing to achieve O(1) average-case performance
- Event handlers SHALL be debounced or throttled as appropriate to maintain performance
- Touch events SHALL use preventDefault() carefully to avoid interfering with browser gestures
- Keyboard focus SHALL be visually distinct with WCAG-compliant focus indicators

## Related

- Event Layout: Spatial hash from layout system enables efficient hit detection
- Accessibility: Keyboard navigation and ARIA attributes provide screen reader support
- Performance: All input handling must complete within 16ms
- State Management: Selection state managed through central store
