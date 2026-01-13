Feature: Event Layout Algorithms
  As a timeline visualization system
  I need to layout overlapping events efficiently
  So that all events are visible and the layout is computed quickly

  Background:
    Given events are loaded into the timeline
    And events may have overlapping time ranges

  # 1D Bin Packing (Waterfall Layout)

  Scenario: Layout non-overlapping events in single lane
    Given events with time ranges that don't overlap
    When the layout algorithm runs
    Then all events should be placed in lane 0
    And no additional lanes should be created
    And the layout height should be minimal

  Scenario: Layout overlapping events in multiple lanes
    Given event A spans time 0 to 100
    And event B spans time 50 to 150
    And event C spans time 120 to 200
    When the layout algorithm runs
    Then event A should be in lane 0
    And event B should be in lane 1 (overlaps A)
    And event C should be in lane 0 (doesn't overlap A, which ends before C starts)
    And the layout should use 2 lanes total

  Scenario: Greedy interval coloring algorithm
    Given a set of events with various overlapping intervals
    When the layout algorithm runs
    Then events should be sorted by start time
    And each event should be placed in the first available lane
    And a lane is available if its last event ends before the current event starts
    And new lanes should be created only when necessary

  Scenario: Layout algorithm runs efficiently
    Given 10,000 events with random time ranges
    When the layout algorithm runs
    Then the algorithm should complete in O(N log N) time
    And the dominant cost should be the initial sort
    And the layout should complete within 100ms

  Scenario: Handle simultaneous events
    Given multiple events starting at exactly the same time
    When the layout algorithm runs
    Then events should be sorted by start time, then by duration (or other tie-breaker)
    And longer events should be placed in lower lanes (closer to timeline axis)
    And the layout should be deterministic

  # Spatial Indexing for Hit Detection

  Scenario: Build spatial hash for events
    Given events are positioned in screen coordinates
    When the spatial hash is built
    Then the screen should be divided into vertical buckets
    And each bucket should be approximately 50px wide
    And events should be mapped to all buckets they intersect

  Scenario: Query spatial hash for mouse position
    Given the spatial hash is built
    And the mouse is at screen position X
    When querying for events under the mouse
    Then only events in the bucket containing X should be checked
    And the query should run in O(1) average time
    And the correct event (if any) should be returned

  Scenario: Spatial hash handles overlapping events
    Given multiple events in the same bucket
    When querying for events at a position
    Then all candidate events should be checked via geometric intersection
    And the frontmost event should be returned
    And the query should complete quickly

  Scenario: Update spatial hash on viewport change
    Given the viewport has changed (pan or zoom)
    When events are re-positioned
    Then the spatial hash should be rebuilt
    And the rebuild should complete within 16ms (one frame)
    And hit detection should remain accurate

  # Label Collision Detection

  Scenario: Detect overlapping labels
    Given events with labels at close horizontal positions
    When rendering labels
    Then labels should be checked for spatial collisions
    And only labels in the same spatial hash bucket should be compared
    And the collision check should run in near-linear time

  Scenario: Prioritize labels based on importance
    Given overlapping labels for multiple events
    When selecting which labels to display
    Then high-priority events should have labels shown
    And low-priority events should have labels hidden
    And priority should be based on event importance or zoom level

  Scenario: Hide labels that cannot fit
    Given very dense event clusters
    When labels would overlap excessively
    Then some labels should be hidden
    And visible labels should remain readable
    And the visual should not be cluttered

  # Level of Detail (LOD) Strategies

  Scenario: Macro view (centuries visible)
    Given the viewport spans several centuries
    When the timeline is rendered
    Then only high-priority events should be rendered
    And cluster markers should show aggregate counts (e.g., "50 events")
    And individual event labels should be hidden
    And rendering should be fast

  Scenario: Meso view (decades visible)
    Given the viewport spans several decades
    When the timeline is rendered
    Then medium-priority events should be included
    And labels should be simplified
    And duration bars may be simplified to points
    And the display should be balanced between detail and clarity

  Scenario: Micro view (days/hours visible)
    Given the viewport spans days or hours
    When the timeline is rendered
    Then all events should be visible
    And full detailed labels should be shown
    And duration bars should show exact time spans
    And maximum detail should be provided

  Scenario: Transition between LOD levels
    Given the user is zooming continuously
    When the zoom level crosses an LOD threshold
    Then the rendering strategy should switch smoothly
    And no jarring visual changes should occur
    And the transition should feel natural

  # Clustering

  Scenario: Cluster nearby events at macro zoom
    Given many events within a small temporal range
    And the viewport is at macro zoom level
    When rendering the timeline
    Then nearby events should be grouped into clusters
    And cluster markers should show the count
    And clicking a cluster should zoom to show constituent events

  Scenario: Expand clusters on zoom
    Given a cluster marker is displayed
    When the user zooms in
    Then the cluster should gradually expand
    And individual events should become visible
    And the transition should be smooth

  # Web Worker Offloading

  Scenario: Offload layout calculation to Web Worker
    Given a large dataset (10,000+ events)
    When layout calculation is needed
    Then the calculation should run in a Web Worker
    And the main thread should not be blocked
    And the UI should remain responsive

  Scenario: Receive layout results from Web Worker
    Given the layout calculation is running in a Web Worker
    When the calculation completes
    Then the results should be posted back to the main thread
    And the main thread should update the display
    And the update should trigger a redraw

  # Lane Height and Visual Spacing

  Scenario: Calculate lane positions
    Given events are assigned to lanes
    When calculating vertical positions
    Then lane 0 should be closest to the timeline axis
    And each subsequent lane should be offset vertically
    And spacing between lanes should be consistent
    And the total height should accommodate all lanes

  Scenario: Adjust lane height based on zoom
    Given the timeline is at different zoom levels
    When rendering events
    Then lane height may adjust to provide appropriate visual density
    And events should remain readable
    And the layout should use screen space efficiently
