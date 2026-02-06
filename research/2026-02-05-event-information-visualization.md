# Research: Event Information Visualization

## Summary

This document analyzes the Nayra codebase to understand how to implement event information visualization (tooltips, detail panels). The codebase has all foundational pieces in place: event data model with rich metadata, hit detection, hover/selection state management, and a proven UI component pattern. Implementation requires creating a new tooltip/panel component following the existing DOM overlay pattern.

## Key Components

### Component 1: Event Data Model

**Location:** [`src/data/event.schema.json:8-66`](file:///var/home/sasha/para/areas/dev/gh/charly/nayra/src/data/event.schema.json#L8-L66)

**Purpose:** Defines the event schema with displayable properties.

**Available Fields for Display:**
| Field | Type | Notes |
|-------|------|-------|
| `label` | string | Short display title (required) |
| `description` | string | Longer text, supports markdown |
| `start` / `end` | timeString | Date range for the event |
| `category` | string | Primary classification |
| `tags` | string[] | Secondary classification |
| `priority` | number | 0-4 importance level |
| `precision` | enum | Date precision hint |
| `url` | string | External link |
| `source` | string | Data provenance |
| `metadata` | object | Arbitrary extension data |

---

### Component 2: State Management (Selection & Hover)

**Location:** [`src/core/store.js:10-11`](file:///var/home/sasha/para/areas/dev/gh/charly/nayra/src/core/store.js#L10-L11) (initial state), [`src/core/store.js:69-87`](file:///var/home/sasha/para/areas/dev/gh/charly/nayra/src/core/store.js#L69-L87) (reducers)

**Purpose:** Manages UI interaction state.

**Relevant State:**
```javascript
// Line 10-11
selectedEventIds: new Set(),  // Set of selected event IDs
hoveredEventId: null,         // Currently hovered event ID
```

**Relevant Actions:**
- `SELECT_EVENT` → Sets single selection (line 69-70)
- `TOGGLE_EVENT_SELECTION` → Adds/removes from multi-selection (line 72-80)
- `CLEAR_SELECTION` → Clears all selections (line 82-83)
- `SET_HOVER` → Updates hovered event (line 85-86)

**Subscription Pattern:**
```javascript
// Line 36-42
store.subscribe((state) => {
  // React to state changes
});
```

---

### Component 3: Hit Detection

**Location:** [`src/interaction/hit-detection.js:4-28`](file:///var/home/sasha/para/areas/dev/gh/charly/nayra/src/interaction/hit-detection.js#L4-L28)

**Purpose:** Determines which event is at a given screen coordinate.

**Function Signature:**
```javascript
findEventAtPoint(x, y, events, viewportStart, scale, canvasHeight) → Event | null
```

**How It Works:**
1. Checks if `y` is within the event row band (centered on axis)
2. Iterates events in reverse order (later events on top)
3. Projects each event's `start` (and `end`) to screen X coordinates
4. Returns the first event whose X range contains the click point

---

### Component 4: Input Handling (Hover & Click Events)

**Location:** [`src/interaction/input.js:40-118`](file:///var/home/sasha/para/areas/dev/gh/charly/nayra/src/interaction/input.js#L40-L118)

**Purpose:** Listens to mouse events and updates store.

**Hover Detection (lines 46-59):**
```javascript
const event = findEventAtPoint(x, y, state.events, ...);
const eventId = event ? event.id : null;
if (eventId !== state.hoveredEventId) {
  store.dispatch({ type: 'SET_HOVER', eventId });
}
canvas.style.cursor = event ? 'pointer' : 'grab';
```

**Selection on Click (lines 94-102):**
```javascript
if (event) {
  if (e.ctrlKey || e.metaKey) {
    store.dispatch({ type: 'TOGGLE_EVENT_SELECTION', eventId: event.id });
  } else {
    store.dispatch({ type: 'SELECT_EVENT', eventId: event.id });
  }
} else {
  store.dispatch({ type: 'CLEAR_SELECTION' });
}
```

---

### Component 5: Visual Feedback (Rendering)

**Location:** [`src/rendering/renderer.js:102-119`](file:///var/home/sasha/para/areas/dev/gh/charly/nayra/src/rendering/renderer.js#L102-L119)

**Purpose:** Draws events with hover/selection visual states.

**How It Works:**
```javascript
const isHovered = state.hoveredEventId === event.id;
const isSelected = state.selectedEventIds && state.selectedEventIds.has(event.id);
const fillColor = getEventFillColor(event.id, isHovered, isSelected);
const strokeStyle = getEventStrokeStyle(isSelected);
```

- Hovered events get a lightened fill color (`lightenColor(baseColor, 0.2)`)
- Selected events get a yellow border (`#ffcc00`, 2px)

---

### Component 6: UI Component Pattern (DOM Overlay)

**Location:** [`src/ui/searchbar.js:1-74`](file:///var/home/sasha/para/areas/dev/gh/charly/nayra/src/ui/searchbar.js#L1-L74) and [`src/ui/help.js:224-486`](file:///var/home/sasha/para/areas/dev/gh/charly/nayra/src/ui/help.js#L224-L486)

**Purpose:** Provides the pattern for DOM-based UI overlays.

**Common Pattern:**
```javascript
export function createComponent(container, options = {}) {
  // 1. Create DOM element
  const element = document.createElement('div');
  element.style.position = 'fixed';
  element.style.zIndex = '1000';
  element.style.display = 'none';
  
  // 2. Build inner structure
  // ...
  
  // 3. Append to container
  container.appendChild(element);
  
  // 4. Return control interface
  return {
    element,
    show() { element.style.display = 'block'; },
    hide() { element.style.display = 'none'; },
    isVisible() { return element.style.display !== 'none'; },
    destroy() { container.removeChild(element); },
    // ...custom methods
  };
}
```

**Style Conventions:**
- Background: `#2a2a3e`
- Border: `1px solid #4a4a6a`
- Border radius: `8px` (small), `12px` (modal)
- Box shadow: `0 4px 20px rgba(0, 0, 0, 0.5)`
- Text color: `#e0e0e0`
- Font: `system-ui, -apple-system, sans-serif`
- Z-index: `1000`

---

### Component 7: Application Bootstrap

**Location:** [`src/main.js:1-96`](file:///var/home/sasha/para/areas/dev/gh/charly/nayra/src/main.js#L1-L96)

**Purpose:** Shows how UI components are wired into the application.

**Integration Pattern:**
```javascript
// 1. Create store
const store = createStore();

// 2. Initialize renderer
initRenderer(canvas, store.dispatch);

// 3. Create UI components
const searchBar = createSearchBar(document.body, onSubmit);
const helpMenu = createHelpMenu(document.body, { onLoad });

// 4. Initialize input with callbacks
initInput(canvas, store, {
  onOpenSearch: () => searchBar.show(),
  onToggleHelp: () => helpMenu.isVisible() ? helpMenu.hide() : helpMenu.show(),
});

// 5. Subscribe to state changes (implicit in render loop)
```

---

## Data Flow

```
User hovers over event
        ↓
mousemove listener (input.js:40-59)
        ↓
findEventAtPoint() (hit-detection.js:4-28)
        ↓
store.dispatch({ type: 'SET_HOVER', eventId })
        ↓
State updated: state.hoveredEventId = eventId
        ↓
store.subscribe() listeners notified
        ↓
[NEW] Tooltip component reacts to state change
        ↓
Show tooltip with event.label, event.description, etc.
```

---

## Requirements (from spec)

**Location:** [`openspec/specs/user-interaction/spec.md:112-137`](file:///var/home/sasha/para/areas/dev/gh/charly/nayra/openspec/specs/user-interaction/spec.md#L112-L137)

**Tooltip Requirements:**
- Show after 500ms hover delay
- Display event title and time
- Position near cursor without obscuring event
- Disappear immediately on mouse-out

**Detail Panel Requirements:**
- Show when event is selected
- Display full event information: title, description, time range, metadata
- Close button and Escape key to close
- Event remains selected after panel closes

---

## Patterns and Conventions

### 1. Event Lookup Pattern
To get full event data from an ID:
```javascript
const state = store.getState();
const event = state.events.find(e => e.id === state.hoveredEventId);
```

### 2. Screen Position Calculation
To position a tooltip near an event:
```javascript
import { projectToScreen } from './core/time.js';

const x = projectToScreen(event.start, state.viewportStart, state.scale);
const y = canvasHeight / 2;  // Events are centered on axis
```

### 3. Mouse Position Tracking

The store subscription doesn't have access to mouse coordinates. Track them separately:

```javascript
// In main.js or a dedicated module
let mouseX = 0, mouseY = 0;

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX;  // Use clientX for fixed-position tooltip
  mouseY = e.clientY;
});

// Then in subscription:
store.subscribe((state) => {
  if (state.hoveredEventId) {
    const event = state.events.find(e => e.id === state.hoveredEventId);
    tooltip.update(event, mouseX, mouseY);
    tooltip.show();
  } else {
    tooltip.hide();
  }
});
```

### 4. Hover Delay (500ms per spec)

```javascript
let hoverTimer = null;

store.subscribe((state) => {
  if (state.hoveredEventId) {
    // Clear any existing timer
    if (hoverTimer) clearTimeout(hoverTimer);
    
    // Start 500ms delay before showing
    hoverTimer = setTimeout(() => {
      const event = state.events.find(e => e.id === state.hoveredEventId);
      tooltip.update(event, mouseX, mouseY);
      tooltip.show();
    }, 500);
  } else {
    // Hide immediately on mouseout
    if (hoverTimer) clearTimeout(hoverTimer);
    hoverTimer = null;
    tooltip.hide();
  }
});
```

### 5. Time Formatting

No existing utility for event time display. Need to create `formatTimeRange(event)`:

```javascript
// src/ui/format.js (NEW)
import { YEAR, MILLION_YEARS, BILLION_YEARS } from '../core/time.js';

export function formatTimeRange(event) {
  // Format start time based on magnitude
  const startStr = formatEventTime(event.start, event.precision);
  if (event.end && event.end > event.start) {
    const endStr = formatEventTime(event.end, event.precision);
    return `${startStr} – ${endStr}`;
  }
  return startStr;
}

function formatEventTime(bigintTime, precision) {
  // Handle deep time (Ga, Ma) vs historical dates
  // Similar logic to renderer.js formatTime() but user-facing
}
```

---

## Implementation Approach

### Component 1: Tooltip (for hover)

Create `src/ui/tooltip.js` following the searchbar pattern:

```javascript
import { formatTimeRange } from './format.js';

export function createTooltip(container) {
  const element = document.createElement('div');
  element.className = 'event-tooltip';
  element.style.cssText = `
    position: fixed;
    z-index: 1001;
    display: none;
    background: #2a2a3e;
    border: 1px solid #4a4a6a;
    border-radius: 6px;
    padding: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    pointer-events: none;
    max-width: 300px;
  `;
  
  container.appendChild(element);
  
  function clampPosition(x, y) {
    // Prevent tooltip from going off-screen
    const pad = 10;
    const maxX = window.innerWidth - element.offsetWidth - pad;
    const maxY = window.innerHeight - element.offsetHeight - pad;
    return {
      x: Math.min(Math.max(pad, x), maxX),
      y: Math.min(Math.max(pad, y), maxY),
    };
  }
  
  return {
    update(event, x, y) {
      element.innerHTML = `
        <div style="font-weight: 600; color: #fff;">${event.label}</div>
        <div style="font-size: 12px; color: #8a8aaa;">${formatTimeRange(event)}</div>
        ${event.description ? `<div style="margin-top: 8px; color: #c0c0d0;">${event.description}</div>` : ''}
      `;
      // Position with offset, clamped to viewport
      const pos = clampPosition(x + 10, y + 10);
      element.style.left = `${pos.x}px`;
      element.style.top = `${pos.y}px`;
    },
    show() { element.style.display = 'block'; },
    hide() { element.style.display = 'none'; },
    destroy() { container.removeChild(element); },
  };
}
```

### Component 2: Detail Panel (for selection)

Create `src/ui/event-panel.js` following the help modal pattern:

```javascript
import { formatTimeRange } from './format.js';

export function createEventPanel(container, options = {}) {
  const { onClose } = options;
  
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: none;
    justify-content: center;
    align-items: center;
  `;
  
  const panel = document.createElement('div');
  panel.style.cssText = `
    background: #2a2a3e;
    border: 1px solid #4a4a6a;
    border-radius: 12px;
    padding: 24px;
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  `;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  
  overlay.appendChild(panel);
  container.appendChild(overlay);
  
  function onKeyDown(e) {
    if (e.key === 'Escape') {
      hide();
      if (onClose) onClose();
    }
  }
  
  function show() {
    overlay.style.display = 'flex';
    document.addEventListener('keydown', onKeyDown);
    panel.focus();  // For accessibility
  }
  
  function hide() {
    overlay.style.display = 'none';
    document.removeEventListener('keydown', onKeyDown);
  }
  
  return {
    update(events) {
      // Handle single or multiple selection
      if (events.length === 1) {
        const event = events[0];
        panel.innerHTML = buildSingleEventContent(event);
      } else {
        panel.innerHTML = buildMultiEventContent(events);
      }
      panel.setAttribute('aria-label', `Event details: ${events.map(e => e.label).join(', ')}`);
    },
    show,
    hide,
    isVisible() { return overlay.style.display !== 'none'; },
    destroy() {
      document.removeEventListener('keydown', onKeyDown);
      container.removeChild(overlay);
    },
  };
}

function buildSingleEventContent(event) {
  return `
    <h2 style="margin: 0 0 12px; color: #fff;">${event.label}</h2>
    <div style="color: #8a8aaa; margin-bottom: 16px;">${formatTimeRange(event)}</div>
    ${event.description ? `<p style="color: #c0c0d0; line-height: 1.6;">${event.description}</p>` : ''}
    ${event.category ? `<div style="margin-top: 12px;"><span style="color: #6a6a8a;">Category:</span> ${event.category}</div>` : ''}
    ${event.tags?.length ? `<div><span style="color: #6a6a8a;">Tags:</span> ${event.tags.join(', ')}</div>` : ''}
    ${event.url ? `<a href="${event.url}" target="_blank" style="color: #00d9ff; margin-top: 12px; display: inline-block;">More info →</a>` : ''}
    ${event.source ? `<div style="margin-top: 12px; font-size: 12px; color: #6a6a8a;">Source: ${event.source}</div>` : ''}
  `;
}

function buildMultiEventContent(events) {
  return `
    <h2 style="margin: 0 0 12px; color: #fff;">${events.length} Events Selected</h2>
    <ul style="margin: 0; padding: 0 0 0 20px; color: #c0c0d0;">
      ${events.map(e => `<li style="margin-bottom: 8px;">${e.label}</li>`).join('')}
    </ul>
  `;
}
```

**Accessibility Notes (per [`openspec/specs/accessibility/spec.md:106-111`](file:///var/home/sasha/para/areas/dev/gh/charly/nayra/openspec/specs/accessibility/spec.md#L106-L111)):**
- Panel uses `role="dialog"` and `aria-modal="true"`
- Escape key closes the panel
- Focus moves to panel on open
- Consider adding focus trap for Tab key navigation

### Integration Points

1. **main.js:** Create tooltip/panel instances
2. **input.js:** Track mouse position for tooltip positioning
3. **store subscription:** React to `hoveredEventId` / `selectedEventIds` changes
4. **Optional:** Add 500ms debounce for tooltip appearance per spec

---

## Entry Points

| Purpose | File | Line |
|---------|------|------|
| Create UI components | `src/main.js` | 17-47 |
| Wire input callbacks | `src/main.js` | 49-62 |
| Update hover state | `src/interaction/input.js` | 46-58 |
| Update selection state | `src/interaction/input.js` | 94-102 |
| Subscribe to state | `src/core/store.js` | 36-42 |

---

## File Structure for Implementation

```
src/ui/
├── help.js          # Existing modal pattern
├── searchbar.js     # Existing overlay pattern
├── format.js        # NEW: Time formatting utilities
├── tooltip.js       # NEW: Hover tooltip
└── event-panel.js   # NEW: Selection detail panel
```

---

## References

- Event schema: [`src/data/event.schema.json`](file:///var/home/sasha/para/areas/dev/gh/charly/nayra/src/data/event.schema.json)
- Store: [`src/core/store.js`](file:///var/home/sasha/para/areas/dev/gh/charly/nayra/src/core/store.js)
- Hit detection: [`src/interaction/hit-detection.js`](file:///var/home/sasha/para/areas/dev/gh/charly/nayra/src/interaction/hit-detection.js)
- Input handling: [`src/interaction/input.js`](file:///var/home/sasha/para/areas/dev/gh/charly/nayra/src/interaction/input.js)
- UI patterns: [`src/ui/searchbar.js`](file:///var/home/sasha/para/areas/dev/gh/charly/nayra/src/ui/searchbar.js), [`src/ui/help.js`](file:///var/home/sasha/para/areas/dev/gh/charly/nayra/src/ui/help.js)
- Spec requirements: [`openspec/specs/user-interaction/spec.md`](file:///var/home/sasha/para/areas/dev/gh/charly/nayra/openspec/specs/user-interaction/spec.md#L112-L137)
