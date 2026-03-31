## ADDED Requirements

### Requirement: Mode Toggle

The system SHALL provide a clearly visible toggle to switch between view mode and edit mode.

#### Scenario: Edit mode button visible
- **WHEN** the timeline is loaded with events
- **THEN** a mode toggle button SHALL be visible in the UI chrome
- **AND** the button SHALL indicate the current mode (view or edit)
- **AND** the button SHALL have a minimum touch target of 44x44px

#### Scenario: Enter edit mode via button
- **WHEN** I click the edit mode button while in view mode
- **THEN** a confirmation message SHALL appear: "You are entering edit mode. Changes will modify your dataset."
- **AND** the message SHALL offer Proceed and Cancel actions

#### Scenario: Enter edit mode via keyboard
- **WHEN** I press `e` while in view mode and no input field is focused
- **THEN** the same confirmation message SHALL appear

#### Scenario: Confirm edit mode entry
- **WHEN** I click Proceed on the confirmation message
- **THEN** the application SHALL enter edit mode
- **AND** the mode toggle button SHALL update to show edit state

#### Scenario: Cancel edit mode entry
- **WHEN** I click Cancel on the confirmation message
- **THEN** the application SHALL remain in view mode

#### Scenario: Exit edit mode without unsaved changes
- **WHEN** I click the mode toggle button while in edit mode and `hasUnsavedChanges` is `false`
- **THEN** the application SHALL return to view mode immediately

#### Scenario: Exit edit mode with unsaved changes
- **WHEN** I click the mode toggle button while in edit mode and `hasUnsavedChanges` is `true`
- **THEN** a warning SHALL appear: "You have unsaved changes. Export to keep them."
- **AND** the warning SHALL offer Export, Discard, and Cancel actions

#### Scenario: Edit mode available with empty dataset
- **WHEN** the timeline is loaded with no events
- **THEN** the mode toggle button SHALL still be visible and functional
- **AND** entering edit mode SHALL allow creating events from scratch

### Requirement: Visual Mode Indicators

The system SHALL provide clear visual indicators when edit mode is active so users always know which mode they are in.

#### Scenario: Edit mode border
- **WHEN** edit mode is active
- **THEN** the canvas SHALL display a colored border or outline distinguishing it from view mode

#### Scenario: Edit mode badge
- **WHEN** edit mode is active
- **THEN** a persistent badge or label SHALL be visible indicating "Edit Mode"

#### Scenario: Crosshair cursor on empty canvas
- **WHEN** edit mode is active and I hover over an empty area of the canvas
- **THEN** the cursor SHALL change to a crosshair to indicate click-to-create

#### Scenario: Pointer cursor on event
- **WHEN** edit mode is active and I hover over an existing event
- **THEN** the cursor SHALL change to a pointer to indicate selectable

#### Scenario: Resize cursor on span edge
- **WHEN** edit mode is active and I hover over a span event edge
- **THEN** the cursor SHALL change to a col-resize cursor

### Requirement: Mode Accessibility

The system SHALL announce mode changes to assistive technologies.

#### Scenario: Screen reader mode announcement
- **WHEN** the application enters or exits edit mode
- **THEN** a live region SHALL announce the mode change (e.g., "Entered edit mode" / "Returned to view mode")

#### Scenario: Mode toggle keyboard accessible
- **WHEN** I navigate to the mode toggle button via Tab
- **THEN** I SHALL be able to activate it with Enter or Space
- **AND** the button SHALL have an accessible label describing its action (e.g., "Enter edit mode" / "Exit edit mode")
