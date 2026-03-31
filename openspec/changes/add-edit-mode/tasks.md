## 1. Store: edit mode state and mutation actions
- [ ] 1.1 Add `mode`, `editingEventId`, `hasUnsavedChanges` fields to initial state
- [ ] 1.2 Implement `SET_MODE` action (view/edit toggle)
- [ ] 1.3 Implement `ADD_EVENT` action (append + re-sort)
- [ ] 1.4 Implement `UPDATE_EVENT` action (replace + re-sort)
- [ ] 1.5 Implement `DELETE_EVENT` action (remove + clean up selection)
- [ ] 1.6 Implement `SET_EDITING_EVENT` action
- [ ] 1.7 Implement `CLEAR_DIRTY` action
- [ ] 1.8 Guard mutations: reject in view mode with console warning
- [ ] 1.9 Validate required fields (id, label, start) on ADD_EVENT and UPDATE_EVENT
- [ ] 1.10 Write tests for all new actions, guards, and validation

## 2. Mode toggle UI and confirmation gate
- [ ] 2.1 Create mode toggle button component (pencil/eye icon, 44x44px)
- [ ] 2.2 Implement confirmation dialog ("You are entering edit mode...")
- [ ] 2.3 Implement exit-with-unsaved-changes warning (Export / Discard / Cancel)
- [ ] 2.4 Wire `e` keyboard shortcut to trigger confirmation
- [ ] 2.5 Add aria-label, live region announcements for mode changes
- [ ] 2.6 Write tests for toggle flow and confirmation states

## 3. Visual mode indicators
- [ ] 3.1 Render colored border/outline on canvas when in edit mode
- [ ] 3.2 Add persistent "Edit Mode" badge overlay
- [ ] 3.3 Implement cursor changes (crosshair on empty, pointer on event, resize on span edges)
- [ ] 3.4 Add dirty indicator (dot/badge) on mode toggle button
- [ ] 3.5 Write tests for visual indicator presence based on state

## 4. Edit panel (sidebar form)
- [ ] 4.1 Create edit panel component (slide-in from right)
- [ ] 4.2 Implement form fields: label, start, end, description, category, tags, priority, precision, url, source
- [ ] 4.3 Implement time format validation with inline error display
- [ ] 4.4 Implement Save / Delete / Cancel button actions
- [ ] 4.5 Wire panel open on event click in edit mode
- [ ] 4.6 Wire panel open with new event on empty-canvas click
- [ ] 4.7 Focus trap and keyboard navigation (Tab through fields, Escape to close)
- [ ] 4.8 Delete confirmation dialog
- [ ] 4.9 Write tests for form validation, save, delete, cancel flows

## 5. Direct manipulation: drag to reposition
- [ ] 5.1 Detect drag on event body in edit mode (distinguish from Space+drag pan)
- [ ] 5.2 Render ghost preview at new position during drag
- [ ] 5.3 Show time tooltip near cursor during drag
- [ ] 5.4 Apply position change on release (dispatch `UPDATE_EVENT`)
- [ ] 5.5 Preserve span duration during repositioning
- [ ] 5.6 Write tests for drag reposition flow

## 6. Direct manipulation: resize span events
- [ ] 6.1 Detect hover on span event edges (hit zone ~8px from edge)
- [ ] 6.2 Show resize cursor on edge hover
- [ ] 6.3 Drag start edge → update start time, drag end edge → update end time
- [ ] 6.4 Enforce minimum duration constraint
- [ ] 6.5 Render resize preview during drag
- [ ] 6.6 Write tests for resize behavior and constraints

## 7. Panning and context menu in edit mode
- [ ] 7.1 Implement Space+drag to pan in edit mode
- [ ] 7.2 Implement two-finger touch pan in edit mode
- [ ] 7.3 Add "Edit Event" and "Delete Event" to context menu when in edit mode
- [ ] 7.4 Wire Delete key / Backspace to trigger delete confirmation
- [ ] 7.5 Write tests for modified input behavior

## 8. Persistence: IndexedDB auto-save
- [ ] 8.1 Create IndexedDB persistence module (open/read/write dataset)
- [ ] 8.2 Auto-save full dataset on committed mutations only (not mid-drag transient state)
- [ ] 8.3 On app load, detect saved data and offer restore dialog (Restore / Dismiss)
- [ ] 8.4 Handle IndexedDB unavailability gracefully (warn, continue without auto-save)
- [ ] 8.5 Add dataset switching protection (warn before overwriting unsaved edits on new data load)
- [ ] 8.6 Write tests for save/restore/unavailability/switching flows

## 9. Persistence: JSON export
- [ ] 9.1 Implement export function (serialize dataset to Nayra JSON format)
- [ ] 9.2 Trigger browser download of JSON file
- [ ] 9.3 Add export button to edit toolbar / edit panel
- [ ] 9.4 Clear dirty state after successful export
- [ ] 9.5 Wire export action from exit-warning dialog
- [ ] 9.6 Write tests for export format and dirty-state clearing

## 10. Browser exit protection
- [ ] 10.1 Register `beforeunload` handler when `dirtyEventIds` is non-empty
- [ ] 10.2 Unregister handler when dirty state is cleared
- [ ] 10.3 Write tests for beforeunload behavior

## 11. Integration / E2E tests
- [ ] 11.1 End-to-end flow: enter edit mode → create event → drag reposition → export → re-import → verify
- [ ] 11.2 Round-trip: edit existing event → auto-save to IndexedDB → reload → restore → verify
- [ ] 11.3 Mode transitions: view → edit → make changes → exit with warning → export → exit clean

## 12. Project scope update
- [ ] 12.1 Update `openspec/project.md` "Out of Scope" section: move "Event editing" to in-scope (gated behind edit mode)

## Dependencies
- Tasks 2–3 depend on task 1 (store state)
- Tasks 4–7 depend on tasks 1–2 (store + mode toggle)
- Tasks 5–6 depend on tasks 1 and 3 (store + visual indicators/cursors)
- Tasks 8–10 depend on task 1 (mutation actions to trigger saves)
- Tasks 8–9 can be parallelized with tasks 4–7
- Task 11 depends on all preceding tasks
- Task 12 can be done at any time
