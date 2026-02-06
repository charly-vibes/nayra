# Event Information Visualization Implementation Plan

**Date**: 2026-02-05

## Overview

Implement event information visualization: tooltips on hover (500ms delay) and detail panels on selection. This enables users to see contextual information about timeline events.

## Current State

- **Event data model** has all displayable fields: `label`, `description`, `start/end`, `category`, `tags`, `priority`, `precision`, `url`, `source`, `metadata` ([event.schema.json](file:///var/home/sasha/para/areas/dev/gh/charly/nayra/src/data/event.schema.json))
- **State management** tracks `hoveredEventId` and `selectedEventIds` ([store.js:10-11](file:///var/home/sasha/para/areas/dev/gh/charly/nayra/src/core/store.js#L10-L11))
- **Hit detection** finds events at coordinates ([hit-detection.js](file:///var/home/sasha/para/areas/dev/gh/charly/nayra/src/interaction/hit-detection.js))
- **Input handling** dispatches hover/selection actions ([input.js:46-58](file:///var/home/sasha/para/areas/dev/gh/charly/nayra/src/interaction/input.js#L46-L58))
- **UI component pattern** established by searchbar.js and help.js

**Missing:**
- Time formatting utility for user-facing display
- Tooltip component
- Detail panel component
- Integration wiring in main.js

## Desired End State

- Tooltip appears 500ms after hovering an event, showing title + time
- Tooltip hides immediately on mouse-out
- Detail panel opens on event selection, showing full event info
- Escape key closes detail panel (event remains selected)

**How to verify:**
- `just test` passes
- Hover event → wait 500ms → tooltip appears with title/time
- Move mouse away → tooltip disappears immediately
- Click event → detail panel shows full info
- Press Escape → panel closes, event still selected

## Out of Scope

- Multi-event selection summary panel (future enhancement)
- Tooltip animation/transitions
- Markdown rendering in descriptions

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Mouse position not available in store subscription | Track mouse position in input.js, expose via callback |
| Deep time formatting complexity | Use existing renderer formatTime() as reference |
| Z-index conflicts with other overlays | Use z-index 1001 (tooltip) and 1000 (panel) |

---

## Phase 1: Time Formatting Utility

Create shared time formatting for user-facing display.

### Changes Required

**File: `src/ui/format.js` (NEW)**
- Create `formatTimeRange(event)` function
- Handle deep time (Ga, Ma), historical dates, precision
- Export for use by tooltip and panel

**Tests: `test/unit/ui/format.test.js`**
- Test Ga/Ma formatting (4.5 Ga, 100 Ma)
- Test year formatting (2024, 500 BCE)
- Test time ranges with start/end
- Test precision hints (approximate, exact)

### Success Criteria

#### Automated:
- [ ] Unit tests pass: `just test test/unit/ui/format.test.js`
- [ ] Build succeeds: `just build`

#### Manual:
- [ ] N/A (unit tested)

---

## Phase 2: Tooltip Component

Create hover tooltip following UI component pattern.

### Changes Required

**File: `src/ui/tooltip.js` (NEW)**
- Create `createTooltip(container)` factory
- Return `{ show(), hide(), update(event, x, y), destroy() }`
- Style: `#2a2a3e` background, `#4a4a6a` border, 6px radius
- Position: offset from cursor, clamped to viewport
- Set `pointer-events: none` to avoid capturing mouse

**Tests: `test/unit/ui/tooltip.test.js`**
- Creates DOM element with correct styles
- `update()` sets content and position
- `show()/hide()` toggles visibility
- Position clamping at viewport edges

### Success Criteria

#### Automated:
- [ ] Unit tests pass: `just test test/unit/ui/tooltip.test.js`
- [ ] Build succeeds

#### Manual:
- [ ] Tooltip renders with correct styling (visual check)

---

## Phase 3: Detail Panel Component

Create selection detail panel following help.js modal pattern.

### Changes Required

**File: `src/ui/event-panel.js` (NEW)**
- Create `createEventPanel(container, { onClose })` factory
- Return `{ show(), hide(), update(events), isVisible(), destroy() }`
- Overlay with modal panel (centered, max-width 500px)
- Display: title, time, description, category, tags, url, source
- Handle single event display (multi-event summary deferred)
- Escape key listener to close (call `onClose` callback)
- Accessibility: `role="dialog"`, `aria-modal="true"`, `aria-label`

**Tests: `test/unit/ui/event-panel.test.js`**
- Creates overlay and panel elements
- `update(events)` renders event content
- `show()/hide()` toggles display
- Escape key triggers hide + onClose callback
- Accessibility attributes present

### Success Criteria

#### Automated:
- [ ] Unit tests pass: `just test test/unit/ui/event-panel.test.js`
- [ ] Build succeeds

#### Manual:
- [ ] Panel renders centered with correct styling
- [ ] All event fields display correctly

---

## Phase 4: Integration

Wire tooltip and panel into main.js with state subscriptions.

### Changes Required

**File: `src/main.js`**
- Import `createTooltip` and `createEventPanel`
- Create tooltip and panel instances
- Track mouse position for tooltip positioning
- Subscribe to store for `hoveredEventId` changes (500ms delay)
- Subscribe to store for `selectedEventIds` changes

**File: `src/interaction/input.js`**
- Add callback `onMousePosition(x, y)` to track cursor for tooltip
- Provide mouse position on mousemove (only when not dragging)

**Tests: `test/e2e/event-info.spec.js`**
- Hover event 500ms → tooltip appears
- Move away → tooltip hides immediately
- Click event → panel opens with details
- Press Escape → panel closes, event selected

### Success Criteria

#### Automated:
- [ ] E2E tests pass: `just test test/e2e/event-info.spec.js`
- [ ] All tests pass: `just test`
- [ ] Build succeeds: `just build`

#### Manual:
- [ ] Hover Big Bang → tooltip shows "Big Bang" + time
- [ ] Click event → panel shows full details
- [ ] Escape closes panel

---

## Testing Strategy

**Following TDD:**

1. **Phase 1**: Write format tests first → implement formatTimeRange
2. **Phase 2**: Write tooltip unit tests → implement component
3. **Phase 3**: Write panel unit tests → implement component
4. **Phase 4**: Write E2E tests → wire integration

**Test files:**
```
test/
├── unit/ui/
│   ├── format.test.js
│   ├── tooltip.test.js
│   └── event-panel.test.js
└── e2e/
    └── event-info.spec.js
```

---

## File Structure After Implementation

```
src/ui/
├── help.js          # Existing
├── searchbar.js     # Existing
├── format.js        # NEW: Time formatting
├── tooltip.js       # NEW: Hover tooltip
└── event-panel.js   # NEW: Selection panel
```

---

## References

- Research: [research/2026-02-05-event-information-visualization.md](file:///var/home/sasha/para/areas/dev/gh/charly/nayra/research/2026-02-05-event-information-visualization.md)
- Spec requirements: [openspec/specs/user-interaction/spec.md#L112-L137](file:///var/home/sasha/para/areas/dev/gh/charly/nayra/openspec/specs/user-interaction/spec.md#L112-L137)
- UI pattern: [src/ui/searchbar.js](file:///var/home/sasha/para/areas/dev/gh/charly/nayra/src/ui/searchbar.js)
