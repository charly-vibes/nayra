## ADDED Requirements

### Requirement: IndexedDB Auto-Save

The system SHALL automatically persist event data to IndexedDB during edit mode to prevent data loss.

#### Scenario: Auto-save on committed mutation
- **WHEN** an event is created, modified, or deleted in edit mode and the change is committed (e.g., drag released, save clicked)
- **THEN** the full dataset SHALL be written to IndexedDB asynchronously
- **AND** the save SHALL not block the UI or degrade canvas performance
- **AND** transient states (mid-drag previews) SHALL NOT trigger auto-save

#### Scenario: Restore from IndexedDB on load
- **WHEN** the application loads and IndexedDB contains a saved dataset
- **THEN** the system SHALL offer to restore the saved data
- **AND** the user SHALL be able to choose Restore (load saved data) or Dismiss (discard saved data and proceed with normal loading from URL params or empty state)

#### Scenario: IndexedDB unavailable
- **WHEN** IndexedDB is not available (private browsing, storage quota exceeded)
- **THEN** the system SHALL warn the user that auto-save is disabled
- **AND** editing SHALL still function (export remains available)

### Requirement: JSON Export

The system SHALL allow users to export the current dataset as a downloadable JSON file.

#### Scenario: Export full dataset
- **WHEN** I trigger the export action (button in edit panel or toolbar)
- **THEN** a JSON file SHALL be downloaded containing all events in the standard Nayra data format
- **AND** the file SHALL be valid for re-import via drag-and-drop or file picker

#### Scenario: Export clears dirty state
- **WHEN** I export the dataset
- **THEN** the dirty-change indicators SHALL be cleared
- **AND** exiting edit mode SHALL no longer warn about unsaved changes

#### Scenario: Export from exit warning
- **WHEN** I try to exit edit mode with unsaved changes and choose Export
- **THEN** the JSON file SHALL be downloaded
- **AND** the application SHALL exit edit mode after download completes

### Requirement: Dirty State Tracking

The system SHALL track whether the dataset has unsaved changes since the last export.

#### Scenario: Mark dirty on mutation
- **WHEN** an event is created, modified, or deleted in edit mode
- **THEN** `hasUnsavedChanges` SHALL be set to `true`

#### Scenario: Unsaved changes warning on tab close
- **WHEN** the user tries to close or navigate away from the page while `hasUnsavedChanges` is `true`
- **THEN** the browser's beforeunload warning SHALL be triggered

#### Scenario: Dirty indicator on toggle
- **WHEN** `hasUnsavedChanges` is `true`
- **THEN** the mode toggle button SHALL show a visual indicator (e.g., a dot or badge)

### Requirement: Dataset Switching Protection

The system SHALL warn before overwriting unsaved edits when loading new data.

#### Scenario: Load new data with unsaved changes
- **WHEN** the user loads a new dataset (via file picker, drag-and-drop, or example link) while `hasUnsavedChanges` is `true`
- **THEN** a warning SHALL appear: "Loading new data will discard your unsaved changes."
- **AND** the user SHALL be able to choose Export (save first), Discard (proceed), or Cancel

#### Scenario: Load new data without unsaved changes
- **WHEN** the user loads a new dataset while `hasUnsavedChanges` is `false`
- **THEN** the new dataset SHALL load immediately without warning
