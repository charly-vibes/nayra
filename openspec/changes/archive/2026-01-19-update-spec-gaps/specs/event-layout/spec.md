# Event Layout Algorithms - Delta

## ADDED Requirements

### Requirement: Web Worker Message Protocol

The system SHALL define a structured message protocol for communication between main thread and layout Web Workers.

#### Scenario: Layout request message format
- **WHEN** the main thread requests layout computation
- **THEN** the message SHALL include an array of events with id, start (BigInt as string), and end (BigInt as string)
- **AND** the message SHALL include viewport bounds (start, end as strings)
- **AND** the message SHALL include zoom level as a number
- **AND** BigInt values SHALL be serialized as strings for transfer

#### Scenario: Layout result message format
- **WHEN** the Web Worker completes layout computation
- **THEN** the result SHALL include an array of positioned events with id, lane, screenX, and width
- **AND** the result SHALL include total lane count
- **AND** the result SHALL include computation duration for profiling
- **AND** results SHALL use transferable ArrayBuffer when beneficial for performance

#### Scenario: Layout cancellation
- **WHEN** a new layout request arrives before the previous completes
- **THEN** the previous computation MAY be cancelled
- **AND** the Worker SHALL process only the most recent request
- **AND** stale results SHALL be discarded
