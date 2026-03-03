# Change: Add Human Era (Holocene Calendar) Support

## Why
Users exploring deep human history — especially Kurzgesagt-style timelines — benefit from a continuous year count that avoids BCE/CE confusion. The Human Era (HE) calendar adds exactly 10,000 to the astronomical year, placing Göbekli Tepe at Year 1 HE and making the entire span of recorded history positive.

## What Changes
- Add `calendar: 'gregorian' | 'holocene'` to global store state with `SET_CALENDAR` action
- Update `src/ui/format.js`: `formatYear` and `formatTimeRange` to apply HE conversion when active
- Update `src/rendering/renderer.js`: grid axis labels respect calendar preference
- Add `cal=he` URL hash parameter; update `encodeAllState`, `encodeSearchState`, `decodeViewportState`, and `decodeSearchState` in `src/core/url-state.js`; update `RESTORE_FROM_URL` action in `src/core/store.js`
- Add calendar toggle in Help/Settings UI and `k` keyboard shortcut

## Impact
- Affected specs: `calendar-support`
- Affected code: `src/core/store.js`, `src/ui/format.js`, `src/core/url-state.js`, `src/rendering/renderer.js`, `src/ui/help.js`, `src/interaction/input.js`
- No breaking changes; `gregorian` is the default
