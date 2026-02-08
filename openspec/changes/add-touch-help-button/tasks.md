# Tasks: Add Touch-Accessible Help Button

## 1. Implementation

- [ ] 1.1 Create `src/ui/help-button.js` with `createHelpButton(container, { onToggleHelp })` factory
- [ ] 1.2 Render a `<button type="button">` element, fixed position, bottom-right corner, 48x48px circular
- [ ] 1.3 Style consistently with help menu theme (`#2a2a3e` background, `#00d9ff` accent, `#4a4a6a` border)
- [ ] 1.4 Set `z-index: 900` (below help menu overlay at 1000)
- [ ] 1.5 Use `env(safe-area-inset-*)` for bottom/right offsets to avoid mobile viewport edges
- [ ] 1.6 Add `touch-action: manipulation` and `-webkit-tap-highlight-color: transparent` for clean touch UX
- [ ] 1.7 Call `e.stopPropagation()` on `pointerdown` to prevent canvas gesture interference
- [ ] 1.8 Add press feedback (scale transform on pointerdown/pointerup)
- [ ] 1.9 Set `aria-label="Help"` for accessibility
- [ ] 1.10 `destroy()` removes element from DOM and cleans up all event listeners

## 2. Integration

- [ ] 2.1 Import `createHelpButton` in `src/main.js`
- [ ] 2.2 Wire button's `onToggleHelp` to existing help menu show/hide logic

## 3. Testing

- [ ] 3.1 Write unit test: button renders as `<button type="button">` with `aria-label="Help"`
- [ ] 3.2 Write unit test: click triggers `onToggleHelp` callback
- [ ] 3.3 Write unit test: inline styles set width/height to at least 44px (assert style values, not layout)
- [ ] 3.4 Write unit test: pointerdown calls `stopPropagation`
- [ ] 3.5 Write unit test: destroy removes button from DOM
- [ ] 3.6 Verify `just test` passes
