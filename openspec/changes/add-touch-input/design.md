# Design: Touch Input via PointerEvents API

## Context

Nayra requires touch support for tablet and touchscreen users. The existing [`src/interaction/input.js`](file:///var/home/sasha/para/areas/dev/gh/charly/nayra/src/interaction/input.js) uses mouse-only events (`mousedown`, `mousemove`, `mouseup`, `wheel`). Touch devices require gesture recognition for pinch-zoom and momentum scrolling—patterns not available via simple event mapping.

**Stakeholders**: End users on tablets/touchscreens, accessibility (touch targets minimum 44×44px per WCAG 2.1 Level AAA, 24×24px for Level AA).

## Goals / Non-Goals

**Goals**:
- Unified input handling for mouse, touch, and pen via PointerEvents API
- Pinch-to-zoom centered on gesture midpoint
- Swipe-to-pan with momentum scrolling after release
- Double-tap to zoom (touch equivalent of double-click)
- Long-press (500ms) to trigger context menu
- Maintain 60 FPS during all touch interactions

**Non-Goals**:
- Multi-touch gestures beyond pinch (no rotate, no three-finger gestures)
- Custom haptic feedback (browser-dependent)
- Touch gesture customization/configuration
- Touch multi-select (deferred to v2; mouse uses Ctrl/Cmd+click which has no touch equivalent)

## Decisions

### Decision: Use PointerEvents API instead of parallel touch handlers

**Rationale**: PointerEvents unify mouse, touch, and pen under a single API (`pointerdown`, `pointermove`, `pointerup`). Each pointer has a unique `pointerId` enabling multi-touch tracking. This avoids duplicating logic across `mouse*` and `touch*` event handlers.

**Alternatives considered**:
1. **Add parallel touch handlers** - More code, potential inconsistencies between mouse/touch behavior
2. **Use Hammer.js** - Contradicts framework-free philosophy, adds external dependency

### Decision: Implement custom gesture recognizer

**Rationale**: Pinch and momentum require state tracking (active pointers, velocities). A lightweight `GestureRecognizer` class will:
- Track active pointers by `pointerId` (Map of pointerId → `{ x, y, timestamp, initialX, initialY }`)
- Calculate pinch distance/midpoint for zoom
- Track velocity samples for momentum scrolling (last 3-5 samples within 100ms)
- Manage long-press timer with movement cancellation
- Manage double-tap detection (two taps within 300ms, <20px apart)

### Decision: CSS `touch-action: none` on canvas

**Rationale**: Prevents browser default gestures (scroll, pinch-zoom) from interfering with custom handlers. Applied only to the canvas element to preserve normal behavior elsewhere.

### Decision: Use setPointerCapture for reliable drag tracking

**Rationale**: Pointer capture ensures `pointermove` and `pointerup` events continue to fire even when the pointer leaves the canvas bounds. This is essential for:
- Drag operations that extend beyond the canvas edge
- Pinch gestures where one finger may leave canvas
- Consistent behavior across mouse, touch, and pen

**Implementation**:
- Call `element.setPointerCapture(pointerId)` on `pointerdown`
- Wrap in try-catch to handle `InvalidStateError` if element not in DOM
- Release happens automatically on `pointerup`/`pointercancel`

### Decision: Retain wheel event listener

**Rationale**: The `wheel` event is NOT part of the PointerEvents API—it remains a separate event type for scroll wheel and trackpad zoom. The existing `onWheel` handler in `input.js` must be preserved alongside the new pointer event handlers.

### Decision: Respect prefers-reduced-motion for momentum

**Rationale**: WCAG requires respecting user motion preferences. When `prefers-reduced-motion: reduce` is set:
- Momentum scrolling is disabled
- Pan stops immediately on pointer release
- Animations (if any) are disabled or reduced

### Decision: Ignore 3+ simultaneous pointers

**Rationale**: The gesture recognizer only uses the first two pointers for pinch-to-zoom. When a third (or more) pointer is added:
- Continue tracking the original two pointers for the active gesture
- Ignore additional pointers until gesture completes
- This prevents accidental gesture cancellation from palm touches

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   initInput(canvas)                  │
├─────────────────────────────────────────────────────┤
│  PointerEvent Listeners                              │
│  ├─ pointerdown  → GestureRecognizer.addPointer()   │
│  ├─ pointermove  → GestureRecognizer.updatePointer()│
│  ├─ pointerup    → GestureRecognizer.removePointer()│
│  └─ pointercancel→ GestureRecognizer.reset()        │
├─────────────────────────────────────────────────────┤
│  GestureRecognizer                                   │
│  ├─ Single pointer: pan (with velocity tracking)    │
│  ├─ Two pointers: pinch-to-zoom                     │
│  ├─ Long-press timer (500ms, cancelled on move)     │
│  └─ Momentum: deceleration loop via rAF             │
└─────────────────────────────────────────────────────┘
```

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| Pointer event not supported | Breaks on old browsers | Target browsers (Chrome 90+, Firefox 90+, Safari 14.1+) all support PointerEvents |
| Momentum physics feels wrong | Poor UX | Tune friction coefficient; use 0.95 decay per frame as starting point (range 0.92-0.98) |
| Long-press conflicts with pan | Accidental context menus | Cancel timer if movement exceeds 10px threshold |
| `touch-action: none` breaks page scroll | Can't scroll page on touch | Only apply to canvas, not document |
| 3+ simultaneous touches | Gesture corruption | Ignore pointers beyond first two; continue active gesture |
| setPointerCapture fails | Inconsistent drag tracking | Wrap in try-catch; fall back to non-captured tracking |
| Browser back/forward gestures | Conflict on edge swipes (Safari iOS) | Test on Safari iOS; may need edge region handling |
| Screen rotation during gesture | Invalid coordinates | Listen for `resize`/`orientationchange`; call `GestureRecognizer.reset()` |
| Fast gesture transitions (pan→pinch→pan) | State ambiguity | Snapshot state on pointer add/remove; define transition semantics |
| Hybrid devices (touch + mouse) | Conflicting inputs | Use `pointerType` to distinguish; ignore mouse during active touch |
| Movement threshold on high-DPI | 10px too sensitive | Consider scaling by `devicePixelRatio` or use physical distance (~3mm) |

## Migration Plan

1. Add `touch-action: none` CSS to canvas
2. Replace mouse listeners with pointer listeners (one-to-one mapping—this is a replacement, not addition)
3. **Retain `wheel` event listener** (not part of PointerEvents)
4. Add `GestureRecognizer` class with pointer tracking
5. Implement pinch-to-zoom gesture
6. Implement double-tap to zoom gesture
7. Implement momentum scrolling (with `prefers-reduced-motion` check)
8. Implement long-press detection
9. Add `resize`/`orientationchange` handlers for gesture reset

**Rollback**: Revert to mouse-only handlers if critical issues arise (low risk given browser support).

## Open Questions

- What friction coefficient feels natural? (Requires user testing; start with 0.95 decay, range 0.92-0.98)
