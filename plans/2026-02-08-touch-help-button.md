# Touch-Accessible Help Button Implementation Plan

**Date**: 2026-02-08

## Overview

Add a floating "?" button to the bottom-right corner of the viewport so touch-only users can open the help menu. Currently the help menu requires pressing `?` on a keyboard, which is inaccessible on tablets and touchscreen devices.

## Current State

- **Help menu** exists at [`src/ui/help.js`](file:///var/home/sasha/para/areas/dev/gh/charly/nayra/src/ui/help.js) with `show()`, `hide()`, `isVisible()` API
- **Toggle logic** wired in [`src/main.js:120-126`](file:///var/home/sasha/para/areas/dev/gh/charly/nayra/src/main.js#L120-L126) via `onToggleHelp` callback
- **UI component pattern** established: factory function returns `{ element, destroy }`, appended to container
- **No existing button UI** — all overlays are keyboard/mouse triggered

## Desired End State

- A 48x48px circular `<button type="button">` with "?" text, fixed to the bottom-right corner
- Tapping/clicking toggles the help menu (same as pressing `?`)
- Meets WCAG touch target minimum (44x44px)
- Styled consistently with help menu (`#2a2a3e` bg, `#00d9ff` accent)
- Has press feedback and proper `aria-label="Help"`
- `z-index: 900` (below help menu overlay at 1000)
- Uses `env(safe-area-inset-*)` for mobile viewport safe areas
- Stops pointer event propagation to prevent canvas gesture interference

**How to verify:**
- `just test` passes
- Tap button → help menu opens
- Tap again → help menu closes
- Button is keyboard-focusable and activatable via Enter/Space
- Tapping button does not trigger canvas pan/zoom/selection

## Out of Scope

- Hiding the button on desktop/mouse-only devices (keep it always visible for simplicity)
- Animating the button appearance
- Button position customization
- `aria-expanded` state tracking (can be added later)

## Implementation Phases

### Phase 1: Create Help Button Component (TDD)

1. **Red**: Write test in `test/unit/help-button.test.js`
   - Button renders as `<button type="button">` with `aria-label="Help"`
   - Click triggers `onToggleHelp` callback
   - Inline styles set width/height to 48px (assert style values, not layout)
   - `pointerdown` calls `stopPropagation` (prevents canvas gesture interference)
   - `destroy()` removes button from DOM and cleans up listeners
2. **Green**: Create `src/ui/help-button.js`
   - `createHelpButton(container, { onToggleHelp })` factory
   - Fixed position, bottom-right with `env(safe-area-inset-*)` offsets
   - 48x48px circular button, `z-index: 900`
   - Dark theme styling matching help menu
   - `touch-action: manipulation` for clean touch behavior
   - `stopPropagation` on `pointerdown` to isolate from canvas
   - Press feedback via pointerdown/pointerup scale transform
3. **Refactor**: Clean up styling, ensure consistency

### Phase 2: Wire into Main

1. Import `createHelpButton` in `src/main.js`
2. Pass existing toggle logic as callback
3. Manual verification on touch device or Chrome DevTools touch emulation

## Success Criteria

| Metric | Target |
|--------|--------|
| Touch target size | ≥44x44 CSS pixels |
| Keyboard accessible | Focusable + Enter/Space activation |
| All tests pass | `just test` exits 0 |
| Visual consistency | Matches help menu theme |
