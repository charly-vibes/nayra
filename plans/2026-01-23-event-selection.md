# Event Selection Implementation Plan

**Date**: 2026-01-23

## Overview

Implement event selection and hover states for the timeline. This enables users to click events to select them, see visual feedback on hover, and manage multi-selection with modifier keys. This is foundational for tooltips, detail panels, and accessibility features.

## Related

- Spec: `openspec/specs/user-interaction/spec.md` (Requirements: Mouse Interaction, Hit Detection)
- Store: Already has `selectedEventIds`, `hoveredEventId`, and actions (`SELECT_EVENT`, `TOGGLE_EVENT_SELECTION`, `CLEAR_SELECTION`, `SET_HOVER`)
- Tracer Bullet: `plans/2026-01-19-tracer-bullet.md`

## Current State

- **Store**: Selection and hover state/actions exist and are tested (22 tests in store.test.js)
- **Renderer**: Draws events as colored rectangles, no visual distinction for hover/selected
- **Input**: Handles pan (drag), zoom (wheel), keyboard shortcuts; no click-to-select or hover detection
- **Hit Detection**: None - no way to find which event is at a given screen coordinate

## Desired End State

1. **Hover state**: Moving mouse over event shows hover visual (lighter fill, pointer cursor)
2. **Click to select**: Clicking an event selects it (shows selected visual with border/glow)
3. **Multi-select**: Ctrl/Cmd+Click adds/removes from selection
4. **Deselect**: Clicking background clears selection
5. **Hit detection**: O(1) average-case lookup using spatial hash or linear scan (100 events is fine for now)

**How to verify:**
- Hover over event → visual feedback, cursor changes to pointer
- Click event → event shows selected state, other events deselected
- Ctrl+Click second event → both selected
- Click background → all deselected
- `just test` passes

## Out of Scope

- Tooltips (separate feature)
- Detail panels (separate feature)
- Double-click to zoom (separate feature)
- Touch gestures (separate feature)
- Keyboard navigation (Tab/arrow keys - separate feature)
- Context menus (separate feature)
- Spatial hash optimization (linear scan is fine for ≤1000 events; optimize later if needed)

**Note on Spec Deviation**: The [user-interaction spec](../openspec/specs/user-interaction/spec.md) says hit detection "SHALL use spatial hash lookup". This plan intentionally uses linear scan for simplicity. At ≤1000 events, linear scan is <1ms and maintains 60fps. Spatial hash can be added later as a performance optimization without changing the API.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Hit detection too slow | Linear scan is O(n) but with 100 events at 60fps, even 1000 events is <1ms; defer spatial hash |
| Drag vs click ambiguity | Use distance threshold: if mouse moves <3px between down/up, treat as click |
| Cursor flicker on drag | Only change cursor on hover when not dragging |

---

## Phase 1: Hit Detection Module

### Changes Required

**File: `src/interaction/hit-detection.js`** (new)
- `findEventAtPoint(x, y, events, viewportStart, scale, canvasHeight)` → returns event or null
- `scale` is a `RationalScale` instance (same as in store state)
- Uses `projectToScreen` from `core/time.js` to project event positions
- Linear scan over visible events (cull first, then check bounds)
- Returns topmost event if overlapping (last in draw order)

**File: `test/unit/hit-detection.test.js`** (new)
- Test: No events → returns null
- Test: Click on event → returns that event
- Test: Click on gap → returns null
- Test: Overlapping events → returns topmost
- Test: Point events (4px width) → hit detection works
- Test: Span events → hit detection uses full width

### Implementation Approach

Simple bounding-box hit test. Project event to screen coordinates, check if point is within bounds. Events are drawn at `axisY - EVENT_HEIGHT/2` with `EVENT_HEIGHT = 20`, so Y bounds are known.

```javascript
import { projectToScreen } from '../core/time.js';
import { EVENT_HEIGHT } from '../rendering/renderer.js';

export function findEventAtPoint(x, y, events, viewportStart, scale, canvasHeight) {
  const axisY = canvasHeight / 2;
  const eventTop = axisY - EVENT_HEIGHT / 2;
  const eventBottom = axisY + EVENT_HEIGHT / 2;
  
  if (y < eventTop || y > eventBottom) return null;
  
  // Iterate in reverse to get topmost (last drawn)
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    const eventX = projectToScreen(event.start, viewportStart, scale);
    
    // Calculate width same as renderer
    let eventWidth;
    if (event.end !== undefined && event.end > event.start) {
      const endX = projectToScreen(event.end, viewportStart, scale);
      eventWidth = Math.max(endX - eventX, 4);
    } else {
      eventWidth = 4; // Point events
    }
    
    if (x >= eventX && x <= eventX + eventWidth) {
      return event;
    }
  }
  return null;
}
```

### Success Criteria

#### Automated:
- [ ] `just test` passes with new hit-detection tests

#### Manual:
- [ ] N/A (unit tests only)

---

## Phase 2: Visual Feedback in Renderer

### Changes Required

**File: `src/rendering/colors.js`** (new)
- `lightenColor(hexColor, amount)` → returns lightened hex color
- `amount` is 0-1 (e.g., 0.2 = 20% lighter)
- Parses hex, adjusts RGB toward white, returns hex

**File: `src/rendering/renderer.js`**
- Import `lightenColor` from `colors.js`
- Modify `drawEvent()` to accept hover/selected state
- Hover state: Lighter fill color (increase luminance by 20%)
- Selected state: Thicker border (2px), accent color stroke (#ffffff or #ffcc00)
- Pass `hoveredEventId` and `selectedEventIds` from state to draw()

**File: `test/unit/colors.test.js`** (new)
- Test: lightenColor('#ff0000', 0.2) returns lighter red
- Test: lightenColor handles 3-char hex
- Test: lightenColor clamps to white at 1.0

**File: `test/unit/renderer.test.js`**
- Test: Hovered event has different visual treatment
- Test: Selected event has border/glow
- Test: Multiple selected events all show selected state

### Implementation Approach

Add `lightenColor` utility in `colors.js`:

```javascript
export function lightenColor(hex, amount) {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  
  // Handle 3-char hex
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map(c => c + c).join('')
    : cleanHex;
  
  const r = parseInt(fullHex.slice(0, 2), 16);
  const g = parseInt(fullHex.slice(2, 4), 16);
  const b = parseInt(fullHex.slice(4, 6), 16);
  
  // Lerp toward white
  const newR = Math.min(255, Math.round(r + (255 - r) * amount));
  const newG = Math.min(255, Math.round(g + (255 - g) * amount));
  const newB = Math.min(255, Math.round(b + (255 - b) * amount));
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}
```

Adjust `drawEvent` to check if `event.id === state.hoveredEventId` or `state.selectedEventIds.has(event.id)`:

```javascript
import { lightenColor } from './colors.js';

function drawEvent(event, state, axisY, canvasWidth) {
  // ... existing projection code ...
  
  const isHovered = state.hoveredEventId === event.id;
  const isSelected = state.selectedEventIds.has(event.id);
  
  let fillColor = getEventColor(event.id);
  if (isHovered) fillColor = lightenColor(fillColor, 0.2);
  
  ctx.fillStyle = fillColor;
  ctx.fillRect(x, y, eventWidth, EVENT_HEIGHT);
  
  if (isSelected) {
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 1, y - 1, eventWidth + 2, EVENT_HEIGHT + 2);
  } else {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, eventWidth, EVENT_HEIGHT);
  }
}
```

### Success Criteria

#### Automated:
- [ ] `just test` passes with updated renderer tests

#### Manual:
- [ ] (Deferred to Phase 3 integration)

---

## Phase 3: Input Handling for Selection

### Changes Required

**File: `src/interaction/input.js`**
- Track mouse position on `mousemove` (not just when dragging)
- On non-drag click: call `findEventAtPoint()`, dispatch `SELECT_EVENT` or `CLEAR_SELECTION`
- On Ctrl/Cmd+click: dispatch `TOGGLE_EVENT_SELECTION`
- On mousemove (not dragging): dispatch `SET_HOVER` with found event or null
- Distinguish click from drag: track distance moved between mousedown/mouseup
- Update cursor: `pointer` when hovering over event, `grab` otherwise
- On `mouseleave`: clear hover state and reset cursor

**File: `test/unit/input.test.js`**
- Test: Click on event dispatches SELECT_EVENT
- Test: Ctrl+click dispatches TOGGLE_EVENT_SELECTION
- Test: Click on background dispatches CLEAR_SELECTION
- Test: Mouse move over event dispatches SET_HOVER
- Test: Mouse move off event dispatches SET_HOVER with null
- Test: Mouse leave canvas dispatches SET_HOVER with null
- Test: Drag does not trigger selection (distance threshold)

### Implementation Approach

```javascript
const CLICK_THRESHOLD = 3; // pixels

function onMouseDown(e) {
  if (e.button !== 0) return;
  isDragging = false;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  lastX = e.clientX;
}

function onMouseMove(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const state = store.getState();
  
  // Hover detection (when not dragging)
  if (!isDragging) {
    const event = findEventAtPoint(x, y, state.events, state.viewportStart, state.scale, rect.height);
    const eventId = event ? event.id : null;
    if (eventId !== state.hoveredEventId) {
      store.dispatch({ type: 'SET_HOVER', eventId });
    }
    canvas.style.cursor = event ? 'pointer' : 'grab';
  }
  
  // Drag detection
  if (e.buttons === 1) {
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (Math.abs(dx) > CLICK_THRESHOLD || Math.abs(dy) > CLICK_THRESHOLD) {
      isDragging = true;
      canvas.style.cursor = 'grabbing';
    }
    if (isDragging) {
      const delta = e.clientX - lastX;
      if (delta !== 0) {
        store.dispatch({ type: 'PAN', offset: state.scale.pxToTime(-delta) });
        lastX = e.clientX;
      }
    }
  }
}

function onMouseUp(e) {
  if (!isDragging) {
    // This was a click, not a drag
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const state = store.getState();
    const event = findEventAtPoint(x, y, state.events, state.viewportStart, state.scale, rect.height);
    
    if (event) {
      if (e.ctrlKey || e.metaKey) {
        store.dispatch({ type: 'TOGGLE_EVENT_SELECTION', eventId: event.id });
      } else {
        store.dispatch({ type: 'SELECT_EVENT', eventId: event.id });
      }
    } else {
      store.dispatch({ type: 'CLEAR_SELECTION' });
    }
  }
  isDragging = false;
  // Restore cursor based on hover
}

function onMouseLeave() {
  if (isDragging) {
    isDragging = false;
  }
  // Clear hover state when mouse leaves canvas
  const state = store.getState();
  if (state.hoveredEventId !== null) {
    store.dispatch({ type: 'SET_HOVER', eventId: null });
  }
  canvas.style.cursor = 'grab';
}
```

### Success Criteria

#### Automated:
- [ ] `just test` passes
- [ ] `just lint` passes

#### Manual:
- [ ] `just dev` → hover over event → cursor changes to pointer, event lightens
- [ ] Click event → event shows yellow border (selected)
- [ ] Click another event → first deselected, second selected
- [ ] Ctrl+click another → both selected
- [ ] Click background → all deselected
- [ ] Drag to pan → no accidental selection

---

## Testing Strategy

**Following TDD:**
1. Phase 1: Write hit-detection tests first, then implement
2. Phase 2: Write renderer visual feedback tests, then implement
3. Phase 3: Write input selection tests, then implement

**Test types needed:**
- Unit tests: hit-detection.js, renderer.js updates, input.js updates
- Integration tests: Full selection flow (click → state change → visual update)

## Rollback Strategy

All changes are additive. If issues arise:
1. Remove hover/selection visual logic from renderer (events still render)
2. Remove selection dispatches from input.js (pan/zoom still work)
3. Delete hit-detection.js module

No breaking changes to existing functionality.

## References

- [src/rendering/renderer.js](../src/rendering/renderer.js) - Current event drawing
- [src/core/store.js](../src/core/store.js) - Selection state/actions (already implemented)
- [test/unit/store.test.js](../test/unit/store.test.js) - Existing selection tests
- [openspec/specs/user-interaction/spec.md](../openspec/specs/user-interaction/spec.md) - Full requirements
