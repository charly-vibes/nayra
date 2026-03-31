## ADDED Requirements

### Requirement: Edit Mode State

The store SHALL track application mode and edit-related state.

#### Scenario: Mode state field
- **WHEN** the store is initialized
- **THEN** the state SHALL include a `mode` field with value `'view'`

#### Scenario: Enter edit mode action
- **WHEN** a `SET_MODE` action is dispatched with value `'edit'`
- **THEN** the state `mode` SHALL become `'edit'`
- **AND** subscribers SHALL be notified

#### Scenario: Exit edit mode action
- **WHEN** a `SET_MODE` action is dispatched with value `'view'`
- **THEN** the state `mode` SHALL become `'view'`
- **AND** `editingEventId` SHALL be cleared to `null`

### Requirement: Event Mutation Actions

The store SHALL support actions that create, update, and delete events in the dataset.

#### Scenario: Add event action
- **WHEN** an `ADD_EVENT` action is dispatched with a valid event object
- **THEN** the event SHALL be appended to the events array
- **AND** the events array SHALL remain sorted by start time
- **AND** `revision` SHALL increment

#### Scenario: Update event action
- **WHEN** an `UPDATE_EVENT` action is dispatched with an event ID and changed fields
- **THEN** the matching event SHALL be replaced with the updated version
- **AND** if the start time changed, the events array SHALL be re-sorted
- **AND** `revision` SHALL increment

#### Scenario: Delete event action
- **WHEN** a `DELETE_EVENT` action is dispatched with an event ID
- **THEN** the event SHALL be removed from the events array
- **AND** if the event was selected, it SHALL be removed from `selectedEventIds`
- **AND** `revision` SHALL increment

#### Scenario: Reject invalid event on add
- **WHEN** an `ADD_EVENT` action is dispatched with an event missing required fields (id, label, or start)
- **THEN** the action SHALL be rejected
- **AND** a validation error SHALL be logged to the console
- **AND** the state SHALL remain unchanged

#### Scenario: Reject invalid event on update
- **WHEN** an `UPDATE_EVENT` action is dispatched with changes that remove required fields or set an invalid time
- **THEN** the action SHALL be rejected
- **AND** a validation error SHALL be logged to the console

#### Scenario: Reject mutation in view mode
- **WHEN** a mutation action (`ADD_EVENT`, `UPDATE_EVENT`, `DELETE_EVENT`) is dispatched while `mode` is `'view'`
- **THEN** the action SHALL be ignored
- **AND** a warning SHALL be logged to the console

### Requirement: Editing Focus State

The store SHALL track which event is currently being edited.

#### Scenario: Set editing event
- **WHEN** a `SET_EDITING_EVENT` action is dispatched with an event ID
- **THEN** `editingEventId` SHALL be set to that ID
- **AND** the event SHALL also be added to `selectedEventIds`

#### Scenario: Clear editing event
- **WHEN** a `SET_EDITING_EVENT` action is dispatched with `null`
- **THEN** `editingEventId` SHALL be cleared

### Requirement: Dirty State Tracking

The store SHALL track whether the dataset has unsaved changes.

#### Scenario: Mark dirty on mutation
- **WHEN** an `ADD_EVENT`, `UPDATE_EVENT`, or `DELETE_EVENT` action succeeds
- **THEN** `hasUnsavedChanges` SHALL be set to `true`

#### Scenario: Clear dirty state
- **WHEN** a `CLEAR_DIRTY` action is dispatched
- **THEN** `hasUnsavedChanges` SHALL be set to `false`

#### Scenario: Initial dirty state
- **WHEN** the store is initialized
- **THEN** `hasUnsavedChanges` SHALL be `false`
