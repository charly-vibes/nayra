## ADDED Requirements

### Requirement: Create Event

The system SHALL allow users to create new events when in edit mode.

#### Scenario: Click to create event
- **WHEN** I click on an empty area of the canvas in edit mode
- **THEN** a new event SHALL be created at the clicked time position
- **AND** the edit panel SHALL open with the new event's fields pre-populated (start time from click position, auto-generated ID)
- **AND** the label field SHALL be focused for immediate typing

#### Scenario: Created event appears on canvas
- **WHEN** I save a newly created event from the edit panel
- **THEN** the event SHALL appear on the canvas at the correct time position
- **AND** the event SHALL be included in the dataset

#### Scenario: Created event precision matches zoom level
- **WHEN** I click to create an event at a deep-time zoom level (macro LOD)
- **THEN** the start time SHALL be set to the exact calculated time at the click position
- **AND** the precision field SHALL be pre-populated to match the current LOD (e.g., "billion_years" at geological scale, "year" at historical scale)

#### Scenario: Cancel event creation
- **WHEN** I click Cancel on the edit panel for a new event that has not been saved
- **THEN** the event SHALL be discarded and not added to the dataset

### Requirement: Edit Event Fields

The system SHALL allow users to modify event properties through a form panel when in edit mode. The edit panel is a single shared component used for both creating new events and editing existing ones.

#### Scenario: Open edit panel
- **WHEN** I click on an existing event in edit mode
- **THEN** the edit panel SHALL open on the right side of the screen
- **AND** the panel SHALL display editable fields for: label, start, end, description, category, tags, priority, precision, url, source
- **AND** the event ID SHALL be displayed as read-only (not editable) to prevent duplicate ID conflicts

#### Scenario: Modify event field
- **WHEN** I change a field value in the edit panel and click Save
- **THEN** the event SHALL be updated with the new value
- **AND** the canvas SHALL re-render to reflect the change
- **AND** the event SHALL be marked as dirty (unsaved)

#### Scenario: Validate time input
- **WHEN** I enter an invalid time format in the start or end field
- **THEN** the field SHALL show a validation error
- **AND** the Save button SHALL be disabled until the error is resolved

#### Scenario: Validate end after start
- **WHEN** I enter an end time that is before the start time
- **THEN** a validation error SHALL be shown
- **AND** the Save button SHALL be disabled

#### Scenario: Edit panel keyboard navigation
- **WHEN** the edit panel is open
- **THEN** I SHALL be able to Tab through all fields
- **AND** Escape SHALL close the panel (with unsaved-changes warning if dirty)

### Requirement: Delete Event

The system SHALL allow users to delete events when in edit mode.

#### Scenario: Delete from edit panel
- **WHEN** I click the Delete button in the edit panel
- **THEN** a confirmation dialog SHALL appear: "Delete [event label]?"
- **AND** confirming SHALL remove the event from the dataset and canvas
- **AND** the edit panel SHALL close

#### Scenario: Delete via keyboard
- **WHEN** an event is selected in edit mode and I press the Delete or Backspace key
- **THEN** the same delete confirmation SHALL appear

#### Scenario: Delete via context menu
- **WHEN** I right-click an event in edit mode
- **THEN** the context menu SHALL include a "Delete Event" option

### Requirement: Drag to Reposition

The system SHALL allow users to drag events to change their time position when in edit mode.

#### Scenario: Drag threshold
- **WHEN** I press on an event and move less than 5 pixels in edit mode
- **THEN** the gesture SHALL be treated as a click (select), not a drag

#### Scenario: Drag event horizontally
- **WHEN** I press on an event and move more than 5 pixels horizontally in edit mode
- **THEN** a ghost preview SHALL show the event at the new time position
- **AND** the original event SHALL remain visible at reduced opacity
- **AND** releasing the drag SHALL move the event to the new time

#### Scenario: Drag preserves duration
- **WHEN** I drag a span event to a new position
- **THEN** the event's duration SHALL remain unchanged
- **AND** both start and end times SHALL shift by the same amount

#### Scenario: Drag snap feedback
- **WHEN** I drag an event
- **THEN** the new time position SHALL be displayed near the cursor or in a tooltip

### Requirement: Resize Span Events

The system SHALL allow users to resize span events by dragging their edges when in edit mode. Point events (no end time) cannot be resized via drag; to add duration, use the edit panel to set an end time.

#### Scenario: Point event resize not available
- **WHEN** I hover over a point event in edit mode
- **THEN** no resize cursor SHALL appear
- **AND** dragging SHALL reposition the event, not resize it

#### Scenario: Drag start edge
- **WHEN** I drag the left (start) edge of a span event in edit mode
- **THEN** the event's start time SHALL change while the end time remains fixed
- **AND** a preview SHALL show the new extent

#### Scenario: Drag end edge
- **WHEN** I drag the right (end) edge of a span event in edit mode
- **THEN** the event's end time SHALL change while the start time remains fixed

#### Scenario: Minimum event duration
- **WHEN** I resize a span event so that start equals or exceeds end
- **THEN** the resize SHALL be prevented
- **AND** the event SHALL snap to a minimum visible duration

### Requirement: Panning in Edit Mode

The system SHALL allow viewport panning in edit mode without conflicting with event manipulation.

#### Scenario: Drag on empty canvas
- **WHEN** I click on an empty area and drag (move more than 5 pixels) in edit mode
- **THEN** no event SHALL be created
- **AND** the drag SHALL be ignored (no pan, no selection rectangle)
- **AND** an event SHALL only be created on a click without drag

#### Scenario: Space-drag to pan
- **WHEN** I hold Space and drag in edit mode
- **THEN** the viewport SHALL pan as in view mode

#### Scenario: Two-finger pan on touch
- **WHEN** I use two fingers to drag in edit mode on a touch device
- **THEN** the viewport SHALL pan as in view mode

#### Scenario: Zoom unchanged
- **WHEN** I scroll or pinch-zoom in edit mode
- **THEN** zoom SHALL behave identically to view mode
