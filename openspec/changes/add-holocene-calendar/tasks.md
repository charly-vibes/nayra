## 1. State Management
- [ ] 1.1 Add `calendar: 'gregorian'` default to `createStore` initial state (`src/core/store.js`)
- [ ] 1.2 Add `SET_CALENDAR` case to reducer returning `{ ...state, calendar: action.calendar }`
- [ ] 1.3 Update `RESTORE_FROM_URL` case to destructure and apply `calendar` from action

## 2. URL State
- [ ] 2.1 Update `encodeAllState` to emit `cal: calendar === 'holocene' ? 'he' : null` (`src/core/url-state.js`)
- [ ] 2.2 Update `encodeSearchState` to emit the same `cal` param (prevents search-only URLs losing calendar mode)
- [ ] 2.3 Update `decodeViewportState` to read `params.cal` and return `calendar: params.cal === 'he' ? 'holocene' : 'gregorian'`
- [ ] 2.4 Update `decodeSearchState` to also read `params.cal` and return `calendar: params.cal === 'he' ? 'holocene' : 'gregorian'`

## 3. Display Formatting
- [ ] 3.1 Add `toDisplayYear(astronomicalYear, calendar)` helper in `src/ui/format.js`:
      - if `calendar === 'holocene'`: `heYear = astronomicalYear + 10000`; if `heYear >= 1` return `"${heYear} HE"`; else return `"${1 - heYear} BHE"`
      - else: existing BCE/CE logic (`year < 1` → `"${1 - year} BCE"`, else `String(year)`)
- [ ] 3.2 Thread `calendar` parameter into `formatYear`; replace inline BCE/CE logic in both BigInt and Date code paths with `toDisplayYear`; in HE mode suppress `day`/`month` precision to year-only
- [ ] 3.3 Thread `calendar` parameter into `formatTimeRange`; apply `toDisplayYear` to `startYear`/`endYear` from `timeToYear()`; suffix range as `"9,501 – 12,024 HE"` (suffix once at end)
- [ ] 3.4 Verify: 2024 CE → 12,024 HE, 500 BCE → 9,501 HE, 10,000 BCE → 1 HE, 50,000 BCE → 39,999 BHE

## 4. Renderer
- [ ] 4.1 Thread `calendar` from store state into `formatTime` / `drawGridAndLabels` in `src/rendering/renderer.js`
- [ ] 4.2 Pass calendar to `formatYear` calls in grid label rendering

## 5. UI & Keyboard
- [ ] 5.1 Verify `k` is not bound (confirmed free: only `?`, Tab, Enter, Space, arrows used)
- [ ] 5.2 Add `k` keydown handler in `src/interaction/input.js` dispatching `SET_CALENDAR` toggle
- [ ] 5.3 Add calendar toggle control in help/settings panel (`src/ui/help.js`)
- [ ] 5.4 Display current mode (e.g. "Human Era (HE)" vs "Gregorian") in the toggle label

## 6. Tests
- [ ] 6.1 Unit tests for `toDisplayYear`: CE years, BCE years, year 0 boundary (astronomical 0 → 10,000 HE), pre-HE years (50,000 BCE → 39,999 BHE), deep-time passthrough
- [ ] 6.2 Unit tests for `formatYear` in HE mode: day/month precision suppressed to year-only, circa prefix retained
- [ ] 6.3 Unit tests for `formatTimeRange` in HE mode: single year, year range, BCE range, BHE range
- [ ] 6.4 Unit tests for URL encode/decode round-trip with `cal=he` via both `encodeAllState` and `encodeSearchState`
- [ ] 6.5 Integration test: toggle `k` → axis labels switch → URL updates → reload restores HE mode
