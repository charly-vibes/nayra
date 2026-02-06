# Change: Add Touch Input Support via PointerEvents API

## Why

The current input system only handles mouse events, leaving the timeline unusable on tablets and touchscreen devices. The user-interaction spec requires tap-to-select, pinch-to-zoom, swipe-to-pan, and long-press context menu gestures. Migrating to the PointerEvents API unifies mouse, touch, and pen input under a single event model, reducing code complexity while enabling full touch support.

## What Changes

- Replace mouse event listeners with pointer event listeners in `src/interaction/input.js`
- Implement gesture recognition for pinch-to-zoom (two-pointer distance tracking)
- Implement momentum scrolling for swipe-to-pan (velocity tracking + deceleration)
- Implement double-tap to zoom (touch equivalent of double-click)
- Implement long-press detection (500ms timer with movement cancellation)
- Add `touch-action: none` CSS to canvas element to prevent browser gesture interference
- Ensure backwards compatibility with mouse and pen input
- **Retain existing `wheel` event listener** (wheel is not part of PointerEvents API)

## Impact

- Affected specs: `user-interaction` (Touch Interaction, Touch Context Menu requirements)
- Affected code:
  - `src/interaction/input.js` - Primary refactor target
  - `src/main.js` - Canvas initialization (CSS)
  - `test/unit/input.test.js` - Test updates

## Success Criteria

| Metric | Target |
|--------|--------|
| Pinch-to-zoom frame rate | 60 FPS with 10,000 events |
| Zoom anchor precision | Midpoint ±2px |
| Momentum friction | Natural feel (0.92-0.98 decay range) |
| Long-press threshold | 500ms ±50ms |
| Long-press cancel distance | >10px movement |
| Touch multi-select | Deferred to v2 (non-goal for this change) |
| Reduced motion | Momentum disabled when `prefers-reduced-motion: reduce`
