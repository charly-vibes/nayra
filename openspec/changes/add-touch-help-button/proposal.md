# Change: Add Touch-Accessible Help Button

## Why

The help menu is only accessible via the `?` keyboard shortcut, which is unavailable on touch-only devices (tablets, phones, touchscreen laptops without keyboard). Touch users have no way to discover available features, load example datasets, or learn navigation gestures.

## What Changes

- Add a floating "?" button (FAB-style) that toggles the help menu
- Position it in the bottom-right corner, always visible over the canvas
- Button meets WCAG touch target size requirements (44x44px)
- Styled consistently with the existing help menu theme
- Provides press feedback for touch responsiveness

## Impact

- Affected specs: `user-interaction` (new requirement for help button UI)
- Affected code:
  - New `src/ui/help-button.js` component
  - `src/main.js` - Wiring the button to the existing help menu toggle
