# State Management - Delta

## ADDED Requirements

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
