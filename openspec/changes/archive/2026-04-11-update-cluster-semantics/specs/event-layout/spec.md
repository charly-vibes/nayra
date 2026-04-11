## MODIFIED Requirements
### Requirement: Event Clustering

The system SHALL cluster nearby viewport-visible events at macro zoom levels using the same screen-space footprint and hit geometry that the cluster marker represents to the user.

#### Scenario: Cluster membership matches represented footprint
- **WHEN** rendering the timeline at macro zoom level with many visible events in a small temporal region
- **THEN** the system SHALL build cluster membership from the events represented within the cluster marker's current screen-space footprint
- **AND** the cluster `count` SHALL equal the number of represented events
- **AND** the cluster time span SHALL cover the earliest and latest represented events

#### Scenario: Span event participates by visible geometry
- **WHEN** a duration event's rendered span intersects a cluster footprint at the current scale
- **THEN** that duration event SHALL be included in the cluster's represented event set
- **AND** the cluster SHALL NOT rely solely on the event start time for membership

#### Scenario: Unclustered event remains visible outside cluster footprint
- **WHEN** a visible event falls outside every cluster marker footprint at the current scale
- **THEN** that event SHALL remain an individual rendered event
- **AND** it SHALL NOT be counted in any adjacent cluster

#### Scenario: Adjacent dense groups partition deterministically
- **WHEN** two dense event groups are near each other at macro zoom level
- **THEN** the system SHALL partition represented events into non-overlapping cluster envelopes
- **AND** each represented event SHALL belong to at most one cluster at that scale
- **AND** the partitioning SHALL be deterministic for the same viewport and filters

#### Scenario: Cluster transitions preserve represented events
- **WHEN** the user zooms in or out across cluster transition thresholds
- **THEN** events SHALL move between clustered and expanded representations according to the current footprint rules
- **AND** represented events SHALL NOT disappear spuriously during the transition
- **AND** cluster counts SHALL remain consistent with the represented event set at each zoom level
