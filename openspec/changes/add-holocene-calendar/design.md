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

Both must delegate to `toDisplayYear(year, calendar)` instead of the inline BCE/CE logic. Pseudocode for the shared helper:

```
function toDisplayYear(astronomicalYear, calendar):
  if calendar !== 'holocene':
    if astronomicalYear < 1: return `${1 - astronomicalYear} BCE`
    return String(astronomicalYear)
  heYear = astronomicalYear + 10000
  if heYear >= 1: return `${heYear} HE`
  return `${1 - heYear} BHE`   // before 10,000 BCE
```

HE years are always positive; the `year < 1` BCE check is never used in HE mode. Sub-year precision (`day`, `month`) is suppressed to year-only in HE mode (see Day/Month Precision decision below).

### `timeToYear` in `formatTimeRange` also needs HE awareness
`formatTimeRange` calls `timeToYear()` directly for range labels (lines 96–99), bypassing `formatYear`. The range year values must also be offset. Either pass `calendar` into `formatTimeRange` and apply the offset to both `startYear` and `endYear`, or extract a shared `toDisplayYear(timeValue, calendar)` helper.

Range label format: `"9,501 – 12,024 HE"` (suffix once, at end).

### Deep time threshold
HE only applies in the `year` scale (below `MILLION_YEARS`). Geological scales (Ma, Ga) are unchanged — they predate human existence and the offset is meaningless at that precision.

### URL parameter
- Key: `cal`, value: `he` when active. Absence defaults to `gregorian`. Invalid values silently fall back to `gregorian`.
- Both `encodeAllState` and `encodeSearchState` emit `cal=he` when active, so all shareable URLs (search-only or full-viewport) preserve calendar mode.
- Both `decodeViewportState` and `decodeSearchState` read `cal` and return `calendar: 'holocene' | 'gregorian'`.
- `RESTORE_FROM_URL` action in `store.js` must include `calendar`.

### Day/month precision in HE mode
`formatYear` handles `precision === 'day'` → "Jan 1, 2024" and `precision === 'month'` → "Jan 2024". In HE mode these precisions are suppressed to year-only — month names do not combine naturally with the HE count — returning e.g. `"12,024 HE"` regardless of precision.

### `needsCirca` prefix with HE suffix
The "c. " circa prefix is retained in HE mode: `"c. 12,024 HE"`. This preserves the precision signal without ambiguity.

### Keyboard shortcut
`k` (mnemonic: K for Kurzgesagt / Kalender) toggles calendar mode. Verified free: only `?`, `Tab`, `Enter`, `Space`, and arrow keys are currently bound.

## Risks / Trade-offs
- **Year 10,000 HE is not a round milestone:** Because the codebase uses astronomical years (1 BCE = 0, 1 CE = 1), the sequence is continuous — 1 BCE → 10,000 HE, 1 CE → 10,001 HE with no gap. Users expecting "Year 10,000" to mark exactly the 1 CE boundary will be surprised; it actually marks 1 BCE. Acceptable — this is standard Holocene calendar behaviour.
- **BCE display eliminated in HE mode:** Events previously labelled "500 BCE" display as "9,501 HE". No parenthetical Gregorian date is required.
- **Pre-10,000 BCE events get BHE notation:** Events earlier than 10,000 BCE (astronomical year < −9,999) produce HE years below 1. These are displayed as "X BHE" (Before Human Era), analogous to BCE. For example, 50,000 BCE → "39,999 BHE". This is a new notation not in common use; a tooltip explanation may be warranted.

## Migration Plan
No migration required. This change is purely additive — `gregorian` is the default and all existing URLs and data are unaffected.

## Open Questions
- Should the calendar toggle appear as a button in the help modal, a dedicated UI widget, or both?
  - **Decision:** Button in the help/settings modal (simplest; consistent with existing settings UI). No dedicated widget in MVP.
- Should `encodeSearchState` (search-only hash) also include `cal`?
  - **Decision:** Yes — include `cal` in all URL outputs. Partial persistence (search URLs losing calendar mode) is a confusing UX bug that outweighs the added complexity of one extra param.
