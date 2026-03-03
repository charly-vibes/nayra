# Design: Add Human Era (Holocene Calendar)

## Context
The Human Era (HE) calendar was popularised by Kurzgesagt. It adds 10,000 to the CE year to produce a continuous positive count starting with the earliest human civilisation. Göbekli Tepe (~10,000 BCE) becomes Year 1 HE; 2024 CE becomes 12,024 HE.

The codebase represents time as BigInt seconds from the Unix epoch (1970 CE = astronomical year 1970). The `formatYear` helper in `src/ui/format.js` already derives an astronomical year — which equals the CE year for positive values and has year 0 = 1 BCE, year −1 = 2 BCE, etc.

## Goals / Non-Goals
- Goals: display HE year labels in axis grid and event tooltips; persist preference in URL; toggle with keyboard/UI
- Non-Goals: change internal storage format; support other calendar systems; display sub-year precision in HE

## Decisions

### Formula: `HE = AstronomicalYear + 10,000`
The offset is exactly **10,000** added to the astronomical year (where 1 BCE = 0, 2 BCE = −1, etc.).

Verification:
| Gregorian | Astronomical | HE |
|-----------|-------------|-----|
| 2024 CE   | 2024        | 12,024 HE ✓ |
| 1 CE      | 1           | 10,001 HE |
| 1 BCE     | 0           | 10,000 HE |
| 500 BCE   | −499        | 9,501 HE |
| 10,000 BCE| −9,999      | 1 HE (Year 1, Göbekli Tepe era) ✓ |

`+9,999` was considered but produces 12,023 HE for 2024 CE — incorrect.

The example "500 BCE → 9,500 HE" from the initial draft was wrong; the correct value is **9,501 HE**.

### No `HOLOCENE_OFFSET` constant in `time.js`
HE conversion is a display-layer year arithmetic operation (`year + 10000`), not a timestamp offset. Adding a seconds-based constant would be misleading and unused by the display logic.

### Both code paths in `formatYear` must be updated
`formatYear` in `src/ui/format.js` has two branches:
1. **BigInt path** (line 36): used when time is outside JavaScript `Date` range. Derives `year = 1970 + yearsFromEpoch`.
2. **Date path** (line 43): used for timestamps within `Date` range. Derives `year = date.getUTCFullYear()`.

Both must apply `if (calendar === 'holocene') year += 10000` before formatting. The `year < 1` BCE check must run **before** the HE offset in the original year variable, and the HE year is always displayed as a plain positive integer with the `HE` suffix (never "BCE").

### `timeToYear` in `formatTimeRange` also needs HE awareness
`formatTimeRange` calls `timeToYear()` directly for range labels (lines 96–99), bypassing `formatYear`. The range year values must also be offset. Either pass `calendar` into `formatTimeRange` and apply the offset to both `startYear` and `endYear`, or extract a shared `toDisplayYear(timeValue, calendar)` helper.

Range label format: `"9,501 – 12,024 HE"` (suffix once, at end).

### Deep time threshold
HE only applies in the `year` scale (below `MILLION_YEARS`). Geological scales (Ma, Ga) are unchanged — they predate human existence and the offset is meaningless at that precision.

### URL parameter
- Key: `cal`, value: `he` when active. Absence defaults to `gregorian`. Invalid values silently fall back to `gregorian`.
- `encodeAllState` and `encodeSearchState` both emit `cal=he` when active.
- `decodeViewportState` and `decodeSearchState` both read `cal` and return `calendar: 'holocene' | 'gregorian'`.
- `RESTORE_FROM_URL` action in `store.js` must include `calendar`.

### Keyboard shortcut
`k` (mnemonic: K for Kurzgesagt / Kalender) toggles calendar mode. Verified free: only `?`, `Tab`, `Enter`, `Space`, and arrow keys are currently bound.

## Risks / Trade-offs
- **Confusion at year 0 boundary:** 1 BCE → 10,000 HE, 1 CE → 10,001 HE. This is a 1-year gap in the HE sequence at the BCE/CE boundary because the Gregorian calendar has no year 0. Acceptable — same behavior as the standard Holocene calendar definition.
- **BCE display eliminated in HE mode:** Events in BCE display as "9,501 HE" not "500 BCE". A parenthetical Gregorian date is not required.

## Open Questions
- Should the calendar toggle appear as a button in the help modal, a dedicated UI widget, or both?
- Should `encodeSearchState` (search-only hash) also include `cal`? Currently scoped to `encodeAllState` only.
