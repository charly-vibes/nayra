# Tasks: Add Touch Input Support

## 1. Foundation

- [ ] 1.1 Add `touch-action: none` CSS to canvas element in `src/main.js`
- [ ] 1.2 Create `src/interaction/gestures.js` with `GestureRecognizer` class skeleton
- [ ] 1.3 Add pointer tracking (Map of pointerId → `{ x, y, timestamp, initialX, initialY }`)
- [ ] 1.4 Add maximum pointer limit (ignore pointers beyond first 2 for gestures)

## 2. Migrate to PointerEvents

- [ ] 2.1 Replace `mousedown` with `pointerdown` in `input.js`
- [ ] 2.2 Replace `mousemove` with `pointermove` in `input.js`
- [ ] 2.3 Replace `mouseup` with `pointerup` in `input.js`
- [ ] 2.4 Replace `mouseleave` with `pointerleave` and add `pointercancel` handler
- [ ] 2.5 Add `setPointerCapture(pointerId)` on pointerdown (wrap in try-catch for InvalidStateError)
- [ ] 2.6 **Retain `wheel` event listener** (not part of PointerEvents migration)
- [ ] 2.7 Verify tap-to-select works via pointer events (tap = pointerdown + pointerup without drag)

## 3. Pinch-to-Zoom

- [ ] 3.1 Detect two active pointers in GestureRecognizer
- [ ] 3.2 Calculate initial distance and midpoint on second pointer down
- [ ] 3.3 Track distance delta during pointermove to compute zoom factor
- [ ] 3.4 Dispatch zoom action to store with midpoint anchor
- [ ] 3.5 Handle 3+ pointer scenario: ignore additional pointers, continue with original two
- [ ] 3.6 Handle pointer removal during pinch: transition to single-pointer pan
- [ ] 3.7 Write unit tests for pinch gesture recognition

## 4. Double-Tap to Zoom

- [ ] 4.1 Track last tap time and position in GestureRecognizer
- [ ] 4.2 Detect double-tap: two taps within 300ms, <20px apart
- [ ] 4.3 On double-tap, zoom in and center on tap position (or zoom out if already zoomed)
- [ ] 4.4 Write unit tests for double-tap detection

## 5. Swipe-to-Pan with Momentum

- [ ] 5.1 Track pointer velocity (sample last 3-5 positions within 100ms window)
- [ ] 5.2 Calculate velocity on pointerup from recent samples
- [ ] 5.3 Implement momentum loop using requestAnimationFrame (rAF)
- [ ] 5.4 Apply friction decay (start with 0.95 per frame) until velocity < threshold
- [ ] 5.5 Check `prefers-reduced-motion`: if enabled, skip momentum (stop immediately on release)
- [ ] 5.6 Write unit tests for momentum calculations

## 6. Long-Press Context Menu

- [ ] 6.1 Start 500ms timer on single pointerdown
- [ ] 6.2 Cancel timer if pointer moves >10px or pointerup occurs before threshold
- [ ] 6.3 On timer completion, trigger context menu callback
- [ ] 6.4 Handle long-press on empty area: trigger timeline-level context menu or no-op (consistent behavior)
- [ ] 6.5 Integrate with existing context menu system (or provide stub callback for testing)
- [ ] 6.6 Write unit tests for long-press detection and cancellation

## 7. Edge Cases & Resilience

- [ ] 7.1 Add `resize` and `orientationchange` listeners to call `GestureRecognizer.reset()`
- [ ] 7.2 Handle hybrid devices: use `pointerType` to ignore mouse events during active touch
- [ ] 7.3 Clear all pending timers in `pointercancel` handler
- [ ] 7.4 Validate `pointerId` is in active map before processing events (defensive check)

## 8. Testing & Polish

- [ ] 8.1 Update `test/unit/input.test.js` with PointerEvent tests
- [ ] 8.2 Add integration tests for touch gestures (mock PointerEvents)
- [ ] 8.3 Test on real touch device or Chrome DevTools touch emulation
- [ ] 8.4 Verify 60 FPS maintained during pinch/pan operations (profile with DevTools, ensure <16.67ms frame times)
- [ ] 8.5 Verify mouse and pen input work correctly after full integration
- [ ] 8.6 Test on Safari iOS for browser back/forward gesture conflicts
- [ ] 8.7 Document touch gestures in README or help panel
