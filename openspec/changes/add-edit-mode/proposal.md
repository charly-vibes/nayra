# Change: Add interactive edit mode for timeline events

## Why

Nayra is currently read-only — events can only be loaded from JSON files or built-in examples. Users who want to build or curate timelines must hand-edit JSON externally. An explicit edit mode would let users create, modify, and delete events directly on the canvas, making Nayra useful as an authoring tool — not just a viewer.

## What Changes

- **New capability: `edit-mode`** — A clearly-distinguished application mode (view vs edit) with explicit entry/exit, visual indicators, and a confirmation gate before entering.
- **New capability: `event-editing`** — CRUD operations on events: add new events (click on empty canvas area), edit fields via a form panel, delete events, drag to reposition in time, and drag span edges to resize.
- **New capability: `edit-persistence`** — Save edits to IndexedDB for session persistence and export modified datasets as JSON files.
- **Modified: `user-interaction`** — Expand the existing conditional drag-and-drop requirement; add click-to-create and edge-drag-to-resize interactions.
- **Modified: `state-management`** — Add edit-mode state, event mutation actions, and dirty-tracking for unsaved changes.
- **Scope change: `project.md`** — "Event editing (read-only timeline)" moves from Out of Scope to in-scope (gated behind edit mode).

## Impact

- Affected specs: `edit-mode` (new), `event-editing` (new), `edit-persistence` (new), `user-interaction`, `state-management`
- Affected code: `src/core/store.js`, `src/interaction/input.js`, `src/ui/` (new edit panel, mode toggle), `src/data/` (new persistence layer)
- Deferred: Undo/redo remains out of scope (can be added later as a separate change)
