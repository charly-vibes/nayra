## Context

Nayra is a read-only canvas-based timeline visualizer. Adding edit mode is the first modal behavior in the app — it changes the meaning of existing gestures (click, drag) and introduces new UI surfaces (edit panel, mode toggle). The design must keep the two modes cleanly separated so that view-mode users are never surprised by accidental edits, and edit-mode users get clear affordances.

## Goals / Non-Goals

**Goals:**
- Clear visual distinction between view and edit modes
- Explicit confirmation before entering edit mode (not a casual toggle)
- Full CRUD: create, read, update, delete events
- Direct manipulation: drag events to reposition, drag span edges to resize
- Form-based field editing for all event properties
- Persist edits to IndexedDB; export as JSON
- Dirty-state tracking with unsaved-changes warning on exit

**Non-Goals:**
- Undo/redo (deferred — separate change)
- Collaborative editing / conflict resolution
- Schema editing (changing field definitions)
- Bulk operations (multi-select edit/delete)
- Inline label editing on canvas (use form panel instead)

## Decisions

### 1. Mode as top-level state, not a component flag

**Decision:** `mode: 'view' | 'edit'` lives in the central store, dispatched via actions.

**Why:** Every layer (input, renderer, UI) needs to know the current mode. A store field is the existing pattern for cross-cutting state (like `calendar`, `filterMode`). Subscribers react to mode changes the same way they react to viewport changes.

**Alternatives considered:**
- Component-local flag in input handler — rejected: renderer and UI also need to know
- URL param — rejected: edit mode is session state, not shareable (an edit-mode URL could confuse recipients who don't have the same data)

### 2. Confirmation gate on mode entry

**Decision:** Clicking the edit button shows a brief confirmation message ("You are entering edit mode. Changes will modify your dataset.") with Proceed / Cancel. Direct keyboard shortcut (`e`) also triggers this confirmation.

**Why:** User explicitly asked for "a message to proceed." Prevents accidental entry. Edit mode reinterprets gestures (drag = reposition instead of pan), so entering unknowingly would be disorienting.

### 3. Gesture reinterpretation in edit mode

**Decision:** In edit mode:
- Click on empty canvas → create event at that time position
- Click on event → select for editing (opens edit panel)
- Drag event body → reposition in time (horizontal only)
- Drag span edge → resize duration
- Pan → requires holding Space + drag (like design tools) or two-finger touch
- Zoom → unchanged (scroll wheel / pinch)

**Why:** Direct manipulation is the most intuitive editing paradigm for a visual timeline. Remapping drag from pan to reposition requires a modifier for panning, but this is a well-known pattern (Figma, Photoshop). Touch: two-finger pan is already natural; one-finger becomes select/drag.

**Alternatives considered:**
- Keep drag as pan, use a separate drag handle on events — rejected: adds visual clutter, less direct
- Double-click to enter per-event edit — rejected: double-click already zooms to event; too many overloads

### 4. Edit panel as sidebar form

**Decision:** A form panel slides in from the right when an event is selected in edit mode. Contains fields for all editable properties (label, start, end, description, category, tags, priority, precision, url, source). Includes Save, Delete, and Cancel buttons.

**Why:** Canvas text input is fragile and inaccessible. A DOM form panel is keyboard-navigable, screen-reader friendly, and consistent with the existing event-panel overlay pattern. Sidebar keeps the timeline visible.

**Alternatives considered:**
- Modal dialog — rejected: blocks the view, can't see context
- Inline canvas editing — rejected: accessibility nightmare, complex to implement
- Popover near event — rejected: occluded by nearby events at dense zoom levels

### 5. Persistence: IndexedDB + JSON export

**Decision:** Edits are auto-saved to IndexedDB on every mutation. Users can export the full dataset as a downloadable JSON file. On page load, if IndexedDB has data, offer to restore it.

**Why:** IndexedDB is already in the tech stack (project.md). Auto-save prevents data loss. JSON export is the natural round-trip format since that's how data is loaded.

**Alternatives considered:**
- localStorage — rejected: 5MB limit too small for large datasets
- Only export, no auto-save — rejected: losing work on accidental tab close is unacceptable

### 6. Dirty tracking via boolean flag

**Decision:** Track a `hasUnsavedChanges: boolean` in the store. Any committed mutation (add, update, delete) sets it to `true`. Exporting JSON clears it to `false`. When the user tries to leave edit mode or close the tab with unsaved changes, show a warning.

**Why:** Simple, low-overhead. A boolean is sufficient without undo/redo — we only need to know "has anything changed?", not "which events changed." Avoids the semantic problem of tracking IDs of deleted events.

## Risks / Trade-offs

- **Gesture conflict:** Remapping drag in edit mode may confuse users who switch frequently. Mitigation: strong visual indicators (colored border, mode badge), and Space+drag for panning follows established design-tool conventions.
- **Performance:** Edit panel DOM updates on every field change won't affect canvas FPS (separate rendering paths). IndexedDB writes are async and non-blocking.
- **Data integrity:** No undo means destructive edits (delete, overwrite) are permanent until the next export. Mitigation: delete confirmation dialog; IndexedDB acts as implicit backup; dirty tracking warns before exit.
- **Accessibility:** Edit panel form must be fully keyboard-navigable and announce mode changes. Mode toggle button needs clear aria-label and live region announcement.

## Resolved Questions

- **Event IDs:** Newly created events get auto-generated UUIDs. The ID field is displayed as read-only in the edit panel to prevent duplicate collisions. Users never need to think about IDs.
- **Discard all changes:** Deferred to the undo/redo change proposal. For now, the user can reload the page (beforeunload warning will fire) or re-import the original JSON file. Dataset switching protection warns before overwriting unsaved edits.
