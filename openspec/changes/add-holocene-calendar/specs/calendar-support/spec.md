## ADDED Requirements

### Requirement: Calendar Mode Selection
The system SHALL support two calendar display modes: `gregorian` (default) and `holocene`. The active mode SHALL be stored in application state, persist across re-renders, and be restorable from the URL.

#### Scenario: Default mode is Gregorian
- **WHEN** the application loads without a `cal` URL parameter
- **THEN** calendar mode is `gregorian` and all year labels use BCE/CE notation

#### Scenario: Toggle to Human Era
- **WHEN** the user presses `k` or activates the calendar toggle in settings
- **THEN** calendar mode switches to `holocene` and all year labels immediately update to HE notation

#### Scenario: Toggle back to Gregorian
- **WHEN** calendar is `holocene` and the user presses `k` again
- **THEN** calendar mode switches to `gregorian` and labels revert to BCE/CE notation

---

### Requirement: Human Era Year Formatting
When calendar mode is `holocene`, the system SHALL display years using the Human Era convention: `HE_year = astronomical_year + 10,000`. Years at or after 10,000 BCE SHALL display as positive integers with an `HE` suffix. Years before 10,000 BCE SHALL display as positive integers with a `BHE` (Before Human Era) suffix. BCE/CE notation SHALL NOT appear in HE mode.

#### Scenario: CE year in HE mode
- **WHEN** calendar is `holocene` and an event or axis label has year 2024 CE (astronomical 2024)
- **THEN** it displays as `12,024 HE`

#### Scenario: BCE year in HE mode
- **WHEN** calendar is `holocene` and an event has year 500 BCE (astronomical −499)
- **THEN** it displays as `9,501 HE`

#### Scenario: Early human history in HE mode
- **WHEN** calendar is `holocene` and a timestamp corresponds to 10,000 BCE (astronomical −9,999)
- **THEN** it displays as `1 HE`

#### Scenario: Pre-Human Era year in HE mode
- **WHEN** calendar is `holocene` and a timestamp corresponds to 50,000 BCE (astronomical −49,999)
- **THEN** it displays as `39,999 BHE`

#### Scenario: Year range in HE mode
- **WHEN** calendar is `holocene` and an event spans from 500 BCE to 2024 CE
- **THEN** the range displays as `9,501 – 12,024 HE` (suffix once at end)

#### Scenario: Sub-year precision suppressed in HE mode
- **WHEN** calendar is `holocene` and an event has day or month precision
- **THEN** it displays as a year-only HE label (e.g. `12,024 HE`, not `Jan 1, 12,024 HE`)

#### Scenario: Deep time unaffected
- **WHEN** calendar is `holocene` and a timestamp is in the Ma or Ga range
- **THEN** it displays using geological notation unchanged (e.g. `3.8 Ga`, `66 Ma`)

---

### Requirement: Calendar URL Persistence
The active calendar mode SHALL be encoded in the URL hash as `cal=he` (Holocene) or omitted (Gregorian) in all URL outputs (full-state and search-only). On load, the app SHALL restore calendar mode from the URL.

#### Scenario: HE mode encoded in URL
- **WHEN** calendar is `holocene`
- **THEN** the URL hash includes `cal=he`

#### Scenario: Gregorian mode omitted from URL
- **WHEN** calendar is `gregorian`
- **THEN** the URL hash does not include a `cal` parameter

#### Scenario: HE mode restored on load
- **WHEN** the page loads with `#cal=he` in the URL
- **THEN** calendar initialises to `holocene` without user interaction

#### Scenario: Invalid `cal` value falls back to Gregorian
- **WHEN** the URL contains an unrecognised `cal` value (e.g. `cal=julian`)
- **THEN** calendar defaults to `gregorian` silently
