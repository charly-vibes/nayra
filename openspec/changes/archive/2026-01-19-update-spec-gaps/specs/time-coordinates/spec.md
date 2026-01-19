# Deep Time Coordinate System - Delta

## ADDED Requirements

### Requirement: Duration Validation

The system SHALL validate event durations and handle edge cases gracefully.

#### Scenario: Zero duration events
- **WHEN** an event has identical start and end times
- **THEN** the duration SHALL be calculated as 0n (BigInt zero)
- **AND** the event SHALL be treated as a point event
- **AND** rendering SHALL use point event visual style

#### Scenario: Negative duration rejection
- **WHEN** an event is loaded with end time before start time (end < start)
- **THEN** the event SHALL be rejected during validation
- **AND** an error SHALL be logged indicating the invalid duration
- **AND** other valid events SHALL still load successfully

#### Scenario: Missing end time handling
- **WHEN** an event has a start time but no end time
- **THEN** the event SHALL be treated as a point event
- **AND** duration SHALL default to 0n
- **AND** no error SHALL be raised
