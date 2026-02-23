# Browser Troubleshooting

## "Browser Not Supported" error screen

Nayra shows this screen when a required browser API is unavailable.

**Missing: BigInt**
BigInt is required for deep time (billion-year) coordinate arithmetic.
- Safari: upgrade to 14+
- Firefox: upgrade to 68+
- Chrome: upgrade to 67+

**Missing: Canvas 2D**
The Canvas API is required for timeline rendering. All modern browsers support it.
Check that hardware acceleration is not disabled in browser settings.

**Missing: IndexedDB**
IndexedDB is used for client-side data persistence.
- Ensure the page is not loaded from `file://` (some browsers restrict IndexedDB on file:// origins)
- Try serving from a local HTTP server: `python3 -m http.server 8000`
- Private/incognito mode may restrict IndexedDB in Safari — use normal mode

---

## Blurry canvas on Retina / high-DPI displays

Nayra applies DPI scaling automatically. If the canvas looks blurry:
- Hard-reload the page (`Cmd+Shift+R` / `Ctrl+Shift+R`) to force canvas resize
- Check the browser zoom level is 100% — non-integer zoom can interact with devicePixelRatio

---

## Slow performance / dropped frames

**All browsers**: Ensure hardware acceleration is enabled in browser settings.

**Firefox**: Canvas performance can be lower than Chrome on some hardware.
Try enabling `gfx.canvas.accelerated` in `about:config`.

**Safari**: Avoid running alongside many other GPU-intensive tabs.

---

## Touch gestures not working (mobile)

Nayra uses the Pointer Events API for touch input, with fallback to touch events.

- Ensure `touch-action: none` is not overridden by browser extensions
- On iOS Safari: swipe from screen edge can trigger browser navigation — start gestures from the centre of the canvas

---

## Web Workers fail to load

If the layout Web Worker fails (console error mentioning `worker`):
- Ensure the page is served over HTTP/HTTPS (Workers are blocked on `file://`)
- Check for Content Security Policy headers that restrict worker-src

---

## Reduced motion not being respected

Nayra reads `prefers-reduced-motion` at runtime. If momentum scrolling still occurs:
- Check the OS-level setting: macOS → Accessibility → Display → Reduce Motion
- Or set the browser preference directly in Firefox: `ui.prefersReducedMotion` in `about:config`

---

## Running tests locally

```bash
# Unit and integration tests
npm test

# E2E tests (Chromium only, fast)
npm run test:e2e

# All browsers
npx playwright install
npx playwright test

# Single browser
npx playwright test --project=webkit
```
