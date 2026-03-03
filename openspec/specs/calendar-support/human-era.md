# Spec: Human Era (Holocene Calendar) Support

## Context
The "Human Era" (Holocene Calendar) is a calendar system that adds exactly 10,000 years to the current Gregorian calendar. It was popularized by Kurzgesagt as a way to better represent the entirety of human history, starting with the construction of Göbekli Tepe (Year 0 HE).

## Goals
- Allow users to toggle between the standard Gregorian calendar (BCE/CE) and the Human Era calendar (HE).
- Display axis labels in HE when the mode is active.
- Format event dates in HE when the mode is active.
- Persist the calendar preference in the URL and store.

## Proposed Changes

### 1. State Management (`src/core/store.js`)
- Add `calendar: 'gregorian' | 'holocene'` to the global state.
- Add `SET_CALENDAR` action to the reducer.
- Default to `'gregorian'`.

### 2. Time Constants (`src/core/time.js`)
- Add `HOLOCENE_OFFSET = 10000n * YEAR` (in seconds).
- Note: Year 0 HE is 10,000 BCE. Year 10,000 HE is 1 CE.
- For HE display: `Year_HE = Year_Gregorian + 10,000`.

### 3. Time Formatting (`src/ui/format.js`)
- Update `formatYear` and `formatTimeRange` to respect the `calendar` state.
- When `calendar === 'holocene'`:
    - Gregorian Year 2024 CE becomes "12,024 HE".
    - Gregorian Year 500 BCE becomes "9,500 HE".
    - Deep time (Ga/Ma) remains unchanged as it predates human history anyway.

### 4. Grid Labels (`src/rendering/renderer.js`)
- Update `formatTime` and `drawGridAndLabels` to accept the `calendar` preference.
- Adjust axis label formatting for HE.

### 5. URL State (`src/core/url-state.js`)
- Add `cal` (calendar) parameter to the URL hash (e.g., `cal=he`).

### 6. User Interface
- Add a toggle in the Help/Settings menu to switch between calendars.
- Provide a keyboard shortcut (e.g., `k` for "Kurzgesagt/Calendar") to toggle modes.

## Technical Details

### HE Calculation
The Holocene calendar does not have a "Year 0" in most implementations (it follows 1 BCE -> 1 CE transition logic), but Kurzgesagt typically treats it as a continuous count.
- Gregorian 1 CE = 10,001 HE? 
- No, standard Holocene adds exactly 10,000. 
- 1 BCE -> 9,001 HE?
- 1 CE -> 10,001 HE.
- 10,000 BCE -> 1 HE.

Actually, the Kurzgesagt video specifically mentions Göbekli Tepe as "Year 0". 
Let's stick to the simple `Year_HE = Year_Gregorian + 10,000` rule for years > 0 and handle BCE accordingly.

BCE years are negative in our internal representation (e.g., 10,000 BCE is stored as approximately -10,000 years from 1 CE epoch).
Internal `year` (astronomical): 1 CE = 1, 1 BCE = 0, 2 BCE = -1.
If we use astronomical years internally:
`HE = AstronomicalYear + 10,000`.
- 1 CE (astronomical 1) -> 10,001 HE.
- 10,000 BCE (astronomical -9,999) -> 1 HE.

Wait, if Göbekli Tepe is 10,000 BCE and that is "Year 0", then:
`HE = AstronomicalYear + 9,999`? No.
If 10,000 BCE is 0 HE:
- 10,000 BCE is astronomical -9,999.
- -9,999 + X = 0 => X = 9,999.
- 1 CE is astronomical 1. 1 + 9,999 = 10,000 HE.

This matches the "10,000 years added" logic.

## Validation Plan
- Unit test for `formatYear` with Holocene mode.
- Integration test for UI toggle.
- Verify URL persistence.
