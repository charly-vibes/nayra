# Browser Support Matrix

## Target Browsers

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 90+ | Primary development target |
| Edge | 90+ | Chromium-based; same as Chrome |
| Firefox | 90+ | Full feature parity |
| Safari | 14+ | BigInt available since Safari 14 |

Mobile browsers (iOS Safari 14+, Chrome for Android 90+) are also supported.

## Required API Availability

| API | Chrome 90 | Edge 90 | Firefox 90 | Safari 14 | Purpose |
|-----|-----------|---------|------------|-----------|---------|
| `<canvas>` 2D context | ✅ | ✅ | ✅ | ✅ | Timeline rendering |
| `BigInt` | ✅ | ✅ | ✅ | ✅ | Deep time coordinates (billions of years) |
| `IndexedDB` | ✅ | ✅ | ✅ | ✅ | Client-side data persistence |
| `ResizeObserver` | ✅ | ✅ | ✅ | ✅ | Responsive canvas sizing |
| `Web Workers` | ✅ | ✅ | ✅ | ✅ | Async layout for 10k+ events |
| `requestAnimationFrame` | ✅ | ✅ | ✅ | ✅ | Smooth 60 FPS render loop |
| `Pointer Events` | ✅ | ✅ | ✅ | ✅ | Unified mouse/touch/pen input |
| ES6 modules (`import`) | ✅ | ✅ | ✅ | ✅ | Module loading (no bundler needed) |

## Feature Detection

Nayra runs feature detection at startup via [`src/utils/feature-detection.js`](../src/utils/feature-detection.js).
If any **required** API is missing, a user-friendly error screen is shown (see [`src/ui/browser-error.js`](../src/ui/browser-error.js)):

- Names the missing feature(s)
- Explains why the feature is needed
- Suggests upgrading to Chrome 90+, Firefox 90+, or Safari 14+

## High-DPI Display Support

Nayra correctly handles high-DPI (Retina) displays via [`src/rendering/dpi-scaling.js`](../src/rendering/dpi-scaling.js):

- Reads `window.devicePixelRatio` (1x, 2x, 3x)
- Scales the canvas backing store by the DPR
- Applies an inverse CSS transform so logical pixel coordinates are preserved
- Result: crisp, non-blurry rendering on all displays

## Performance Targets (Per Browser)

| Browser | Target FPS | 10k Events | Notes |
|---------|-----------|------------|-------|
| Chrome 90+ | 60 FPS | ✅ | Best-case baseline |
| Edge 90+ | 60 FPS | ✅ | Same Blink engine as Chrome |
| Firefox 90+ | 60 FPS | ✅ | Canvas may be marginally slower |
| Safari 14+ | 60 FPS | ✅ | WebKit canvas; performance comparable |

## System Preferences

Nayra respects browser/OS user preferences:

| Preference | Media Query | Behaviour |
|------------|------------|-----------|
| Reduced Motion | `prefers-reduced-motion: reduce` | Disables momentum scrolling |
| High Contrast | `prefers-contrast: more` | Increases event border visibility |

## Cross-Browser Testing

Automated cross-browser tests run on every pull request via GitHub Actions (`.github/workflows/browser-tests.yml`).

Tests run on:
- **Chromium** (Chrome/Edge)
- **Firefox**
- **WebKit** (Safari)

To run cross-browser tests locally:
```bash
# Install all browser engines
npx playwright install

# Run full cross-browser suite
npx playwright test test/e2e/cross-browser.spec.js

# Run on a specific browser
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run high-DPI tests
npx playwright test test/e2e/high-dpi.spec.js --project=chromium-hidpi
```

See [`test/e2e/cross-browser.spec.js`](../test/e2e/cross-browser.spec.js) and [`test/e2e/high-dpi.spec.js`](../test/e2e/high-dpi.spec.js).

## Related Documentation

- [`docs/troubleshooting.md`](troubleshooting.md) — Common browser-specific issues
- [`openspec/specs/browser-compatibility/spec.md`](../openspec/specs/browser-compatibility/spec.md) — Full specification
