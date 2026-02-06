# Tracer Bullet Implementation Plan

**Date**: 2026-01-19

## Overview

A tracer-bullet implementation that proves the core architecture is viable: Canvas rendering at 60 FPS, BigInt time coordinates, unidirectional state management, and basic pan/zoom interaction. This is the minimal end-to-end slice that validates all critical technical risks before building the full system.

## Related

- Specs: `openspec/specs/core-rendering/spec.md`, `openspec/specs/time-coordinates/spec.md`, `openspec/specs/state-management/spec.md`
- Research: `Vanilla JS Data Visualization Backend Review.md`

## Current State

- **No source code exists** - greenfield project
- Comprehensive specs define requirements
- justfile configured but no `src/` or `test/` directories
- Development server ready (`just dev`)

## Desired End State

A working timeline that:
1. Renders 100 hardcoded events on Canvas at 60 FPS
2. Uses BigInt coordinates for time with rational scale (proving deep-time math works at Ga scales)
3. Pans horizontally via mouse drag (exact BigInt math via `pxToTime`)
4. Zooms via scroll wheel (centered on cursor, clamped to bounds)
5. Shows FPS counter to validate performance
6. Handles High-DPI displays correctly (with ResizeObserver)
7. **Validates deep-time architecture** with events spanning Big Bang to present

**How to verify:**
- `just dev` → opens browser → timeline renders
- Drag to pan → smooth, no jank
- Scroll to zoom → smooth, centered on cursor
- FPS counter stays ≥55 FPS
- Works on Retina/HiDPI displays
- **Deep-time test**: Navigate to 4.5 Ga, pan 1px → stable movement, no jitter
- **Deep-time test**: Zoom in/out 10+ times at Ga scale → anchor stays pinned

## Out of Scope

- Event selection/hover states
- Tooltips or DOM overlays
- Accessibility (parallel DOM)
- Data loading from JSON/IndexedDB
- Layout algorithm (waterfall lanes)
- Level of Detail / label decluttering
- URL state persistence
- Multiple canvas layers (background/foreground)
- Tests (will add after architecture is proven)

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| BigInt→Number precision loss during zoom | Use rational scale (BigInt numer/denom) for px↔time conversions; floating-origin for projection |
| `Number(delta)` unsafe at macro zoom | Cull events before projection; clamp viewport span; validate with deep-time test data |
| Canvas API unfamiliar | Reference review doc code samples |
| State management complexity | Keep store minimal (~50 lines); derive viewportEnd instead of storing |
| Zoom factor edge cases (0, infinity, NaN) | Clamp zoomFactor to [MIN_ZOOM, MAX_ZOOM] in store |

---

## Phase 1: Project Scaffolding

### Changes Required

**File: `index.html`**
- Create: Minimal HTML with canvas container
- No external dependencies

**File: `src/main.js`**
- Create: Entry point, wire up modules

**Directory structure:**
```
src/
├── main.js           # Entry point
├── core/
│   ├── store.js      # State management (rational scale, revision counter)
│   ├── time.js       # BigInt time utilities & constants
│   └── scale.js      # Rational scale (numer/denom) for px↔time
├── rendering/
│   └── renderer.js   # Canvas rendering with culling
├── interaction/
│   └── input.js      # Mouse/wheel handlers
└── data/
    └── samples.js    # Sample event generators (recent, geological, cosmological)
```

### Implementation Approach

Create minimal directory structure. ES6 modules with no bundler (native browser import).

### Success Criteria

#### Automated:
- [ ] `just dev` serves the page without errors

#### Manual:
- [ ] Browser shows blank canvas container
- [ ] No console errors

---

## Phase 2: BigInt Time Coordinates & Rational Scale

### Changes Required

**File: `src/core/time.js`**
- Define time unit constants (SECOND, MINUTE, HOUR, DAY, YEAR, BILLION_YEARS as BigInt)
- Define deep-time epochs: `UNIX_EPOCH = 0n`, `EARTH_FORMATION = -4_500_000_000n * YEAR`, `BIG_BANG = -13_800_000_000n * YEAR`
- `project(time, viewportStart, scale)` → screen X coordinate
- Uses floating-origin: `delta = time - viewportStart`, then rational conversion
- `isVisible(time, viewportStart, viewportDuration)` → boolean for culling

**File: `src/core/scale.js`**
- Rational scale representation: `{ numer: BigInt, denom: BigInt }` (pixels per time unit)
- `pxToTime(px, scale)` → BigInt time delta (exact integer math)
- `timeToPx(time, scale)` → Number pixel position
- `zoomScale(scale, factor)` → new scale (multiply numer or denom)
- Discrete zoom ladder for stable conversions

### Implementation Approach

Avoid unsafe `Number(bigint)` for values > 2^53. Use rational scale so px↔time conversions use BigInt multiply/divide, converting to Number only for final screen coordinates.

```javascript
// Rational scale: pixels = time * numer / denom
export function timeToPx(timeDelta, scale) {
    // timeDelta is BigInt, result is Number for canvas
    return Number(timeDelta * scale.numer / scale.denom);
}

export function pxToTime(px, scale) {
    // px is Number, result is BigInt
    return BigInt(Math.round(px)) * scale.denom / scale.numer;
}

// Projection with floating origin
export function project(time, viewportStart, scale) {
    const delta = time - viewportStart; // BigInt subtraction (small value)
    return timeToPx(delta, scale);
}
```

### Success Criteria

#### Manual:
- [ ] Can project times at 4.5 Ga (Earth formation) without precision loss
- [ ] `pxToTime(timeToPx(delta, scale), scale)` round-trips correctly for deep-time values
- [ ] Module loads without errors

---

## Phase 3: State Management Store

### Changes Required

**File: `src/core/store.js`**
- Create store with initial state:
  - `viewportStart: BigInt` (e.g., year 2000 in seconds from epoch)
  - `scale: { numer: BigInt, denom: BigInt }` (rational scale, not float zoomFactor)
  - `canvasWidth: Number` (for deriving viewportEnd)
  - `revision: Number` (incremented on change, replaces isDirty)
  - `events: Array<{id, start, end, label}>`
- Derived getter: `viewportEnd = viewportStart + pxToTime(canvasWidth, scale)`
- `dispatch(action, payload)` for PAN, ZOOM, SET_EVENTS, RESIZE
- Zoom clamping: `MIN_SCALE` and `MAX_SCALE` constants
- `subscribe(listener)` → returns unsubscribe function (use Set, not array)
- Immutable updates (object spread)

### Implementation Approach

~60 lines. No framework patterns—just functions and objects. Use revision counter instead of dirty flag to avoid render loop dispatching.

```javascript
// Minimal store skeleton
const MIN_SCALE = { numer: 1n, denom: 1_000_000_000n }; // ~1px per billion seconds
const MAX_SCALE = { numer: 1000n, denom: 1n };          // 1000px per second

let state = { 
    viewportStart: 0n, 
    scale: { numer: 1n, denom: 1000n }, 
    canvasWidth: 800,
    revision: 0, 
    events: [] 
};
const listeners = new Set();

export function getState() { return state; }
export function getViewportEnd() { 
    return state.viewportStart + pxToTime(state.canvasWidth, state.scale); 
}
export function dispatch(action, payload) { /* update state, clamp scale, bump revision, notify */ }
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
```

### Success Criteria

#### Manual:
- [ ] dispatch('PAN', { delta: 1000n }) updates viewportStart
- [ ] dispatch('ZOOM', ...) clamps scale within bounds
- [ ] Subscribers notified on state change
- [ ] getViewportEnd() returns correct derived value

---

## Phase 4: Canvas Renderer with Culling

### Changes Required

**File: `src/rendering/renderer.js`**
- `init(canvas)` → set up DPI scaling with ResizeObserver
- `resize(canvas)` → re-init DPI on size change, dispatch RESIZE to store
- `draw(state)` → clear canvas, cull events, draw visible as rectangles
- Handle devicePixelRatio for sharp rendering (use `setTransform` to avoid cumulative scale)
- Show FPS counter (top-left corner)
- **Cull before projection**: only project events where `isVisible(event.start, viewportStart, viewportDuration)`

**File: `index.html`**
- Add `<canvas id="timeline">` element

### Implementation Approach

Single canvas (no layers yet). Draw events as colored rectangles. FPS calculated from frame timestamps. Culling ensures we never call `project()` on events far outside viewport.

```javascript
// DPI setup pattern (safe for repeated calls)
function setupDPI(canvas, ctx) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // Reset transform, apply DPR
    return rect;
}

// ResizeObserver for responsive canvas
const resizeObserver = new ResizeObserver(() => {
    const rect = setupDPI(canvas, ctx);
    dispatch('RESIZE', { width: rect.width });
});
resizeObserver.observe(canvas);
```

### Success Criteria

#### Manual:
- [ ] Canvas renders at correct DPI
- [ ] Resize window → canvas re-scales correctly
- [ ] Events appear as colored rectangles
- [ ] FPS counter visible
- [ ] Only visible events are drawn (verify with console.log count)

---

## Phase 5: Render Loop with Revision Checking

### Changes Required

**File: `src/main.js`**
- Wire up requestAnimationFrame loop
- Check `state.revision !== lastRenderedRevision` before drawing
- Cache `lastRenderedRevision` after draw (no dispatch needed)

### Implementation Approach

Use revision counter instead of dirty flag to avoid dispatching from render loop.

```javascript
let lastRenderedRevision = -1;

function loop() {
    const state = getState();
    if (state.revision !== lastRenderedRevision) {
        draw(state);
        lastRenderedRevision = state.revision;
    }
    requestAnimationFrame(loop);
}
```

### Success Criteria

#### Manual:
- [ ] Timeline renders on load
- [ ] CPU usage minimal when not interacting
- [ ] Smooth updates when state changes
- [ ] No dispatch calls from render loop

---

## Phase 6: Pan Interaction

### Changes Required

**File: `src/interaction/input.js`**
- mousedown → start drag, save start position
- mousemove → if dragging, dispatch PAN with delta
- mouseup → end drag

### Implementation Approach

Convert pixel delta to time delta using rational `pxToTime()` (exact BigInt math).

```javascript
canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    const state = getState();
    const timeDelta = pxToTime(-dx, state.scale); // Returns BigInt, exact
    dispatch('PAN', { delta: timeDelta });
    lastX = e.clientX;
});
```

### Success Criteria

#### Manual:
- [ ] Drag left/right pans timeline
- [ ] Movement feels natural (1:1 pixel tracking)
- [ ] No jitter or lag
- [ ] Pan works at deep-time scales (test at 4.5 Ga viewport)

---

## Phase 7: Zoom Interaction

### Changes Required

**File: `src/interaction/input.js`**
- wheel event → zoom centered on cursor position (use `{ passive: false }` for `preventDefault()`)
- Implement anchor-point zoom math using rational scale

### Implementation Approach

1. Calculate world time under cursor before zoom (using `pxToTime`)
2. Apply zoom by adjusting scale (multiply numer or divide denom)
3. Recalculate viewportStart to keep anchor fixed (using `pxToTime` with new scale)
4. Store clamps scale to bounds

```javascript
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const state = getState();
    
    // World time at cursor (exact BigInt)
    const anchor = state.viewportStart + pxToTime(mouseX, state.scale);
    
    // Apply zoom by scaling numer (discrete steps for stability)
    const zoomIn = e.deltaY < 0;
    const newScale = zoomScale(state.scale, zoomIn ? 1.1 : 0.9);
    
    // Compensate viewport to keep anchor under cursor
    const newStart = anchor - pxToTime(mouseX, newScale);
    
    dispatch('ZOOM', { scale: newScale, viewportStart: newStart });
}, { passive: false });
```

### Success Criteria

#### Manual:
- [ ] Scroll wheel zooms in/out
- [ ] Zoom centers on cursor position
- [ ] Smooth zoom at all zoom levels
- [ ] No precision jitter at extreme zoom (test at Ga scale)
- [ ] Zoom clamps at min/max bounds

---

## Phase 8: Deep-Time Sample Data & Validation

### Changes Required

**File: `src/main.js`**
- Generate 100 sample events spanning multiple time scales:
  - 50 events in "recent history" (1900-2100 CE)
  - 25 events in "geological time" (millions of years ago)
  - 25 events in "cosmological time" (billions of years ago, near Big Bang/Earth formation)
- Events have random start times, some with duration
- Validate event data: reject `end < start`

**File: `src/rendering/renderer.js`**
- Add axis labels (adaptive: years, Ma, Ga depending on scale)
- Draw grid lines

**File: `src/data/samples.js`** (new)
- `generateRecentEvents(count)` → events 1900-2100 CE
- `generateGeologicalEvents(count)` → events in Ma range
- `generateCosmologicalEvents(count)` → events near Earth formation (4.5 Ga) and Big Bang (13.8 Ga)

### Implementation Approach

Include deep-time data from the start to validate architecture. Test both extremes: recent (where precision matters for daily events) and cosmological (where BigInt math is essential).

### Success Criteria

#### Automated:
- [ ] Page loads without console errors

#### Manual:
- [ ] 100 events visible (when viewport includes them)
- [ ] Can pan across full timeline (recent to Big Bang)
- [ ] Can zoom from decades to days in recent history
- [ ] Can zoom from Ga to Ma in deep time
- [ ] **Deep-time validation**: At 4.5 Ga viewport, 1px pan produces stable movement (no jitter/jumps)
- [ ] **Deep-time validation**: Zoom anchoring stays pinned over 10+ wheel steps at Ga scale
- [ ] FPS ≥ 55 at all times
- [ ] Works on HiDPI display

---

## Testing Strategy

**Deferred to post-tracer-bullet.** The purpose of this phase is to validate architecture, not test coverage. Once proven:
1. Add vitest or similar
2. Unit test time.js projection math
3. Unit test store dispatch/subscribe
4. Integration test for pan/zoom behavior

## Rollback Strategy

This is greenfield—if approach fails:
1. Document what didn't work in `research/`
2. Consider alternative architectures (e.g., WebGL, different state pattern)
3. No production impact since nothing is deployed

## References

- [Vanilla JS Data Visualization Backend Review.md](../Vanilla%20JS%20Data%20Visualization%20Backend%20Review.md) - Architecture patterns and code samples
- [MDN Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [BigInt MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)
