## ADDED Requirements
### Requirement: Cluster Expansion Navigation

The system SHALL provide cluster-specific expansion navigation without altering existing wheel, keyboard, or pinch zoom behavior.

#### Scenario: Cluster click expands represented range
- **WHEN** I click on a cluster marker
- **THEN** the viewport SHALL center on the cluster midpoint
- **AND** the cluster's represented time span SHALL expand to fill the central 80% of the visible viewport width
- **AND** the viewport SHALL preserve 10% padding on each side of the represented range
- **AND** the resulting zoom SHALL use the represented cluster range rather than an unrelated larger fit range

#### Scenario: Cluster click with very small represented span
- **WHEN** I click a cluster marker whose represented events occupy a very small or zero-duration time span
- **THEN** the viewport SHALL still zoom in meaningfully
- **AND** the system SHALL derive a minimum expansion span from the represented cluster footprint at the current scale
- **AND** the cluster midpoint SHALL remain centered after the zoom

#### Scenario: Cluster click honors zoom constraints at deep-time scales
- **WHEN** I click a cluster marker whose computed expansion would exceed global zoom constraints
- **THEN** the system SHALL clamp the zoom to the allowed range
- **AND** the cluster midpoint SHALL remain centered after clamping
- **AND** the expansion SHALL remain based on the represented cluster range rather than an unrelated fit target
