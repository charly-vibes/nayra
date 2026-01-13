# Event Layout Algorithms

## Purpose

The event layout system efficiently positions overlapping events in multiple lanes to ensure all events are visible and accessible. The system SHALL use greedy interval coloring algorithms achieving O(N log N) time complexity, spatial indexing for efficient hit detection, and level-of-detail strategies to maintain performance with large datasets.

## Requirements

### Requirement: 1D Bin Packing

The system SHALL layout overlapping events in multiple lanes using efficient bin packing algorithms.

#### Scenario: Non-overlapping events in single lane
- **WHEN** the layout algorithm runs on events with time ranges that don't overlap
- **THEN** all events SHALL be placed in lane 0
- **AND** no additional lanes SHALL be created
- **AND** the layout height SHALL be minimal

#### Scenario: Overlapping events in multiple lanes
- **WHEN** the layout algorithm runs on event A (time 0-100), event B (time 50-150), and event C (time 120-200)
- **THEN** event A SHALL be in lane 0
- **AND** event B SHALL be in lane 1 (overlaps A)
- **AND** event C SHALL be in lane 0 (doesn't overlap A)
- **AND** the layout SHALL use 2 lanes total

#### Scenario: Greedy interval coloring
- **WHEN** the layout algorithm runs on a set of events with various overlapping intervals
- **THEN** events SHALL be sorted by start time
- **AND** each event SHALL be placed in the first available lane
- **AND** a lane SHALL be available if its last event ends before the current event starts
- **AND** new lanes SHALL be created only when necessary

#### Scenario: Efficient layout computation
- **WHEN** the layout algorithm runs on 10,000 events with random time ranges
- **THEN** the algorithm SHALL complete in O(N log N) time
- **AND** the dominant cost SHALL be the initial sort
- **AND** the layout SHALL complete within 100ms

#### Scenario: Simultaneous event handling
- **WHEN** the layout algorithm runs on multiple events starting at exactly the same time
- **THEN** events SHALL be sorted by start time, then by duration or other tie-breaker
- **AND** longer events SHALL be placed in lower lanes (closer to timeline axis)
- **AND** the layout SHALL be deterministic

### Requirement: Spatial Indexing

The system SHALL use spatial hash structures for efficient hit detection and collision queries.

#### Scenario: Spatial hash construction
- **WHEN** the spatial hash is built with events positioned in screen coordinates
- **THEN** the screen SHALL be divided into vertical buckets
- **AND** each bucket SHALL be approximately 50px wide
- **AND** events SHALL be mapped to all buckets they intersect

#### Scenario: Spatial hash query
- **WHEN** querying for events at mouse position X with the spatial hash built
- **THEN** only events in the bucket containing X SHALL be checked
- **AND** the query SHALL run in O(1) average time
- **AND** the correct event SHALL be returned

#### Scenario: Overlapping event handling
- **WHEN** querying for events at a position with multiple events in the same bucket
- **THEN** all candidate events SHALL be checked via geometric intersection
- **AND** the frontmost event SHALL be returned
- **AND** the query SHALL complete quickly

#### Scenario: Spatial hash updates
- **WHEN** the viewport changes via pan or zoom and events are re-positioned
- **THEN** the spatial hash SHALL be rebuilt
- **AND** the rebuild SHALL complete within 16ms (one frame)
- **AND** hit detection SHALL remain accurate

### Requirement: Label Collision Detection

The system SHALL detect and resolve label collisions to maintain readability.

#### Scenario: Overlapping label detection
- **WHEN** rendering labels for events with labels at close horizontal positions
- **THEN** labels SHALL be checked for spatial collisions
- **AND** only labels in the same spatial hash bucket SHALL be compared
- **AND** the collision check SHALL run in near-linear time

#### Scenario: Label prioritization
- **WHEN** selecting which labels to display with overlapping labels for multiple events
- **THEN** high-priority events SHALL have labels shown
- **AND** low-priority events SHALL have labels hidden
- **AND** priority SHALL be based on event importance or zoom level

#### Scenario: Dense cluster label hiding
- **WHEN** labels would overlap excessively in very dense event clusters
- **THEN** some labels SHALL be hidden
- **AND** visible labels SHALL remain readable
- **AND** the visual SHALL not be cluttered

### Requirement: Level of Detail Strategies

The system SHALL adapt rendering detail based on viewport zoom level.

#### Scenario: Macro view rendering
- **WHEN** the timeline is rendered with the viewport spanning several centuries
- **THEN** only high-priority events SHALL be rendered
- **AND** cluster markers SHALL show aggregate counts (e.g., "50 events")
- **AND** individual event labels SHALL be hidden
- **AND** rendering SHALL be fast

#### Scenario: Meso view rendering
- **WHEN** the timeline is rendered with the viewport spanning several decades
- **THEN** medium-priority events SHALL be included
- **AND** labels SHALL be simplified
- **AND** duration bars MAY be simplified to points
- **AND** the display SHALL be balanced between detail and clarity

#### Scenario: Micro view rendering
- **WHEN** the timeline is rendered with the viewport spanning days or hours
- **THEN** all events SHALL be visible
- **AND** full detailed labels SHALL be shown
- **AND** duration bars SHALL show exact time spans
- **AND** maximum detail SHALL be provided

#### Scenario: LOD level transitions
- **WHEN** the zoom level crosses an LOD threshold during continuous zooming
- **THEN** the rendering strategy SHALL switch smoothly
- **AND** no jarring visual changes SHALL occur
- **AND** the transition SHALL feel natural

### Requirement: Event Clustering

The system SHALL cluster nearby events at macro zoom levels to reduce visual complexity.

#### Scenario: Cluster creation at macro zoom
- **WHEN** rendering the timeline at macro zoom level with many events within a small temporal range
- **THEN** nearby events SHALL be grouped into clusters
- **AND** cluster markers SHALL show the count
- **AND** clicking a cluster SHALL zoom to show constituent events

#### Scenario: Cluster expansion on zoom
- **WHEN** the user zooms in with a cluster marker displayed
- **THEN** the cluster SHALL gradually expand
- **AND** individual events SHALL become visible
- **AND** the transition SHALL be smooth

### Requirement: Web Worker Offloading

The system SHALL offload heavy layout computation to Web Workers to maintain UI responsiveness.

#### Scenario: Web Worker layout calculation
- **WHEN** layout calculation is needed for a large dataset (10,000+ events)
- **THEN** the calculation SHALL run in a Web Worker
- **AND** the main thread SHALL not be blocked
- **AND** the UI SHALL remain responsive

#### Scenario: Web Worker result integration
- **WHEN** the layout calculation completes in a Web Worker
- **THEN** the results SHALL be posted back to the main thread
- **AND** the main thread SHALL update the display
- **AND** the update SHALL trigger a redraw

### Requirement: Lane Positioning

The system SHALL calculate consistent vertical positions for event lanes.

#### Scenario: Lane position calculation
- **WHEN** calculating vertical positions with events assigned to lanes
- **THEN** lane 0 SHALL be closest to the timeline axis
- **AND** each subsequent lane SHALL be offset vertically
- **AND** spacing between lanes SHALL be consistent
- **AND** the total height SHALL accommodate all lanes

#### Scenario: Zoom-based lane height adjustment
- **WHEN** rendering events at different zoom levels
- **THEN** lane height MAY adjust to provide appropriate visual density
- **AND** events SHALL remain readable
- **AND** the layout SHALL use screen space efficiently

## Technical Notes

- The greedy interval coloring algorithm SHALL sort events by start time in O(N log N) and assign lanes in O(N) for total O(N log N) complexity
- Spatial hash bucket width of approximately 50px provides optimal balance between bucket count and events per bucket
- Level-of-detail thresholds SHALL be configurable to tune performance vs. visual detail trade-off
- Web Workers SHALL use transferable objects when possible to minimize serialization overhead

## Related

- Viewport Navigation: Layout recalculation triggered by viewport changes
- Performance: Layout must complete within 100ms for 10,000 events
- User Interaction: Spatial hash enables efficient hit detection
- Rendering: Layout output drives event positioning on canvas
