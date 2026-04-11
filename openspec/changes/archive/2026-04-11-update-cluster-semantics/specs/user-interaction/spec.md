## ADDED Requirements
### Requirement: Cluster Tooltips

The system SHALL display contextual tooltip information for cluster markers without altering the existing event tooltip and detail panel behavior.

#### Scenario: Cluster tooltip display on hover
- **WHEN** I hover over a cluster marker
- **THEN** a tooltip SHALL appear
- **AND** the tooltip SHALL show the represented event count
- **AND** the tooltip SHALL show the represented time span
- **AND** the tooltip SHALL list the represented events in chronological order
- **AND** each listed event SHALL include at least its label and formatted time

#### Scenario: Cluster tooltip truncation
- **WHEN** a cluster represents more events than can be shown comfortably in the tooltip
- **THEN** the tooltip MAY show a truncated list of represented events
- **AND** the tooltip SHALL indicate how many represented events are not shown
- **AND** the displayed count SHALL still equal the full represented event set

#### Scenario: Cluster tooltip remains on-screen near viewport edges
- **WHEN** I hover over a cluster marker near the viewport edge
- **THEN** the tooltip SHALL remain fully on-screen
- **AND** the tooltip SHALL preserve the represented event count and displayed subset

### Requirement: Cluster Marker Interaction

The system SHALL provide responsive mouse-based interaction with visual feedback for cluster markers without altering existing event click-selection behavior.

#### Scenario: Cluster hover state
- **WHEN** I move my mouse over a cluster marker
- **THEN** the cursor SHALL change to a pointer
- **AND** the cluster marker SHALL be hit-tested using the same on-screen geometry used for rendering
- **AND** a cluster tooltip MAY appear with represented event details
