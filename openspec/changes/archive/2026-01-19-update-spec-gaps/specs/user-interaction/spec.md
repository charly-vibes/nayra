# User Interaction and Input Handling - Delta

## ADDED Requirements

### Requirement: Touch Context Menu

The system SHALL provide context menu access on touch devices through long-press gesture.

#### Scenario: Long-press to open context menu
- **WHEN** I long-press (hold for 500ms) on an event on a touch device
- **THEN** a context menu SHALL appear
- **AND** haptic feedback MAY be provided if supported
- **AND** the menu SHALL offer the same actions as right-click context menu

#### Scenario: Long-press cancellation
- **WHEN** I move my finger during a long-press before the threshold
- **THEN** the long-press SHALL be cancelled
- **AND** the gesture SHALL be treated as a pan instead
- **AND** no context menu SHALL appear

#### Scenario: Long-press on empty area
- **WHEN** I long-press on the timeline background (not on an event)
- **THEN** a context menu MAY appear with timeline-level actions
- **OR** no menu SHALL appear (implementation choice)
- **AND** the behavior SHALL be consistent
