## MODIFIED Requirements

### Requirement: Drag and Drop (Conditional)

The system SHALL support event repositioning, span resizing, and click-to-create through direct manipulation when an explicit edit mode is enabled.

#### Scenario: Event repositioning via drag in edit mode
- **WHEN** I drag a selected event horizontally on a timeline that has editing enabled
- **THEN** the event SHALL move in time
- **AND** a ghost preview SHALL show the new position
- **AND** the change SHALL be applied on release

#### Scenario: Span resize via edge drag in edit mode
- **WHEN** I drag the start or end edge of a span event in edit mode
- **THEN** the corresponding time boundary SHALL change
- **AND** a preview SHALL show the new extent

#### Scenario: Click-to-create in edit mode
- **WHEN** I click on an empty canvas area in edit mode
- **THEN** a new event SHALL be created at the clicked time position
- **AND** the edit panel SHALL open for the new event

#### Scenario: Drag threshold in edit mode
- **WHEN** I press on an event and move less than 5 pixels in edit mode
- **THEN** the gesture SHALL be treated as a click (select), not a drag (reposition)

#### Scenario: Panning requires modifier in edit mode
- **WHEN** edit mode is active
- **THEN** click-drag on events SHALL reposition them (not pan)
- **AND** click-drag on empty canvas SHALL be ignored (no pan, no action)
- **AND** Space+drag SHALL pan the viewport
- **AND** two-finger touch drag SHALL pan the viewport

#### Scenario: Context menu includes edit actions in edit mode
- **WHEN** I right-click an event in edit mode
- **THEN** the context menu SHALL include "Edit Event" and "Delete Event" options in addition to the existing view-mode options
