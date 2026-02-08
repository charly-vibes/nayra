# Tasks: Add Touch-Accessible Help Button

## 1. Implementation

- [x] 1.1 Create `src/ui/help-button.js` with `createHelpButton(container, { onToggleHelp })` factory
- [x] 1.2 Render a `<button type="button">` element, fixed position, bottom-right corner, 48x48px circular
- [x] 1.3 Style consistently with help menu theme (`#2a2a3e` background, `#00d9ff` accent, `#4a4a6a` border)
- [x] 1.4 Set `z-index: 900` (below help menu overlay at 1000)
- [x] 1.5 Use `env(safe-area-inset-*)` for bottom/right offsets to avoid mobile viewport edges
- [x] 1.6 Add `touch-action: manipulation` and `-webkit-tap-highlight-color: transparent` for clean touch UX
- [x] 1.7 Call `e.stopPropagation()` on `pointerdown` to prevent canvas gesture interference
- [x] 1.8 Add press feedback (scale transform on pointerdown/pointerup)
- [x] 1.9 Set `aria-label="Help"` for accessibility
- [x] 1.10 `destroy()` removes element from DOM and cleans up all event listeners

## 2. Integration

- [x] 2.1 Import `createHelpButton` in `src/main.js`
- [x] 2.2 Wire button's `onToggleHelp` to existing help menu show/hide logic

## 3. Testing

- [x] 3.1 Write unit test: button renders as `<button type="button">` with `aria-label="Help"`
- [x] 3.2 Write unit test: click triggers `onToggleHelp` callback
- [x] 3.3 Write unit test: inline styles set width/height to at least 44px (assert style values, not layout)
- [x] 3.4 Write unit test: pointerdown calls `stopPropagation`
- [x] 3.5 Write unit test: destroy removes button from DOM
- [x] 3.6 Verify `just test` passes
