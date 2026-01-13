# Deep Time Coordinate System

## Purpose

The time coordinate system represents temporal positions using BigInt to support timescales from nanoseconds to billions of years, handling geological, astronomical, and cosmological events with precision.

## Requirements

### Requirement: BigInt Temporal Coordinates

The system SHALL represent all temporal coordinates as BigInt offsets from a configurable zero point to support unlimited temporal range.

#### Scenario: Present moment representation
- **WHEN** the zero point is set to the present moment and representing the current time
- **THEN** the coordinate SHALL be 0n (BigInt zero)

#### Scenario: Historical event representation
- **WHEN** representing the year 500 BC with zero point at present moment
- **THEN** the coordinate SHALL be a negative BigInt
- **AND** the magnitude SHALL represent seconds before present

#### Scenario: Future event representation
- **WHEN** representing the year 2100 AD with zero point at present moment
- **THEN** the coordinate SHALL be a positive BigInt
- **AND** the magnitude SHALL represent seconds after present

#### Scenario: Deep time representation
- **WHEN** representing Earth's formation (4.5 billion years ago) with zero point at Big Bang
- **THEN** the coordinate SHALL be approximately 9.3 billion years from Big Bang
- **AND** the BigInt SHALL accurately represent this magnitude
- **AND** precision SHALL be maintained

### Requirement: Time Unit Constants

The system SHALL define constants for standard time units as BigInt values.

#### Scenario: Standard time unit definitions
- **WHEN** time unit constants are accessed
- **THEN** SECOND SHALL equal 1n
- **AND** MINUTE SHALL equal 60n
- **AND** HOUR SHALL equal 3600n
- **AND** DAY SHALL equal 86400n
- **AND** YEAR SHALL equal 31557600n (approximately)
- **AND** BILLION_YEARS SHALL equal 31557600000000000n

### Requirement: Time String Parsing

The system SHALL parse various time string formats into BigInt coordinates.

#### Scenario: ISO 8601 parsing
- **WHEN** parsing "2024-01-15T14:30:00Z"
- **THEN** it SHALL convert to a BigInt offset from zero point
- **AND** the conversion SHALL be accurate to the second

#### Scenario: Common date format parsing
- **WHEN** parsing "January 15, 2024"
- **THEN** it SHALL convert to a BigInt coordinate
- **AND** the date SHALL be interpreted correctly

#### Scenario: BC/AD notation parsing
- **WHEN** parsing "500 BC"
- **THEN** it SHALL convert to a negative BigInt offset
- **AND** the coordinate SHALL represent 500 years before year 0

#### Scenario: Geological notation parsing (millions)
- **WHEN** parsing "65 Ma" (million years ago)
- **THEN** it SHALL convert to a BigInt representing 65 million years before present
- **AND** precision SHALL be maintained

#### Scenario: Geological notation parsing (billions)
- **WHEN** parsing "4.5 Ga" (billion years ago)
- **THEN** it SHALL convert to a BigInt representing 4.5 billion years
- **AND** the value SHALL be accurate

#### Scenario: Year zero handling
- **WHEN** parsing dates around the BC/AD boundary where historical calendars have no year 0 (1 BC → 1 AD)
- **THEN** the conversion SHALL account for the missing year
- **AND** temporal math SHALL be correct

### Requirement: Time Formatting for Display

The system SHALL format BigInt coordinates into human-readable strings appropriate for the temporal scale.

#### Scenario: Modern date formatting
- **WHEN** formatting a BigInt coordinate representing 2024-06-15 for display
- **THEN** it SHALL output "June 15, 2024" or similar readable format
- **AND** the format SHALL be culturally appropriate

#### Scenario: Historical date formatting
- **WHEN** formatting a BigInt coordinate representing 500 BC for display
- **THEN** it SHALL output "500 BC" or "500 BCE"
- **AND** the BC/BCE designation SHALL be clear

#### Scenario: Geological time formatting (millions)
- **WHEN** formatting a BigInt coordinate representing 65 million years ago for display at macro zoom
- **THEN** it SHALL output "65 Ma" or "65 million years ago"
- **AND** the format SHALL be concise

#### Scenario: Cosmological time formatting (billions)
- **WHEN** formatting a BigInt coordinate representing 4.5 billion years ago for display at macro zoom
- **THEN** it SHALL output "4.5 Ga" or "4.5 billion years ago"
- **AND** the magnitude SHALL be clear

#### Scenario: Adaptive magnitude-based formatting
- **WHEN** formatting various temporal coordinates for display
- **THEN** recent times SHALL show full dates
- **AND** ancient times SHALL show appropriate units (Ma, Ga)
- **AND** the format SHALL optimize readability

### Requirement: Floating Origin for Screen Coordinates

The system SHALL convert BigInt coordinates to screen pixels using floating origin technique to prevent precision loss.

#### Scenario: Jitter-free coordinate conversion
- **WHEN** calculating screen pixel positions for events in a viewport showing years 4,000,000,000 BC to 3,999,999,000 BC
- **THEN** coordinates SHALL be calculated relative to viewport start
- **AND** pixel positions SHALL have sub-pixel precision
- **AND** events SHALL NOT exhibit visual jitter

#### Scenario: Viewport offset calculation
- **WHEN** calculating screen position for an event at BigInt coordinate T_event with viewport starting at T_start
- **THEN** the delta SHALL be calculated as T_event - T_start
- **AND** the delta SHALL be converted to Number for Canvas API
- **AND** precision loss SHALL be avoided

#### Scenario: Zoom level precision maintenance
- **WHEN** zooming from macro to micro view for events spanning billions of years
- **THEN** event positions SHALL remain precise
- **AND** sub-pixel rendering SHALL work correctly
- **AND** no coordinate snapping SHALL occur

### Requirement: Temporal Arithmetic Operations

The system SHALL provide accurate arithmetic operations on BigInt temporal coordinates.

#### Scenario: Duration addition
- **WHEN** calculating T1 + D for BigInt coordinate T1 and BigInt duration D
- **THEN** the result SHALL be accurate
- **AND** overflow SHALL NOT occur

#### Scenario: Duration calculation
- **WHEN** calculating T2 - T1 for two BigInt coordinates T1 and T2
- **THEN** the duration between them SHALL be accurate
- **AND** negative durations SHALL be handled correctly

#### Scenario: Temporal comparison
- **WHEN** comparing T1 < T2 for two BigInt coordinates
- **THEN** the comparison SHALL work correctly
- **AND** sorting SHALL order events chronologically

### Requirement: Edge Case Handling

The system SHALL handle extreme temporal values without precision loss or overflow.

#### Scenario: Maximum time representation
- **WHEN** representing the age of the universe (13.8 billion years) where BigInt has effectively unlimited range
- **THEN** the coordinate SHALL be represented accurately
- **AND** no overflow SHALL occur

#### Scenario: Minimum time representation
- **WHEN** representing events billions of years before Big Bang (theoretical deep past)
- **THEN** the system SHALL handle arbitrarily large negative values
- **AND** precision SHALL be maintained

#### Scenario: Sub-second precision
- **WHEN** storing the coordinate for an event with millisecond precision
- **THEN** sub-second precision SHALL be preserved
- **AND** the coordinate SHALL be accurate to milliseconds or better

## Technical Notes

- **Why BigInt**: JavaScript Date object limited to ±100 million days from Unix Epoch (approximately 271,821 BC to 275,760 AD) - insufficient for geological/astronomical scales
- **Zero Point**: Configurable (e.g., present moment, Big Bang, Unix Epoch) - all times stored as offsets
- **Floating Origin**: Converting BigInt→Number relative to viewport prevents precision loss in Canvas float coordinates
- **Calendar Systems**: Must handle Julian/Gregorian conversion, "Year Zero" absence (1 BC → 1 AD directly)
- **Precision**: BigInt maintains arbitrary precision; conversion to Number only at rendering boundary

## Related

- Core Rendering (core-rendering/spec.md) - Consumes screen coordinates from floating origin conversion
- Viewport Navigation (viewport-navigation/spec.md) - Provides viewport bounds for floating origin calculation
- Event Layout (event-layout/spec.md) - Uses temporal coordinates for positioning and sorting
- Data Loading (data-loading/spec.md) - Parses time strings into BigInt coordinates on load
