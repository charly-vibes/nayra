Feature: Viewport Navigation (Pan and Zoom)
  As a user
  I need to pan and zoom the timeline
  So that I can explore events at different temporal scales

  Background:
    Given a timeline is displayed
    And events are loaded

  # Panning (Horizontal Scrolling)

  Scenario: Pan timeline by dragging
    Given the timeline is displaying a viewport
    When I click and drag horizontally to the left
    Then the viewport should move forward in time
    And events should scroll smoothly
    And the frame rate should remain at 60 FPS

  Scenario: Pan timeline to the right
    Given the timeline is displaying a viewport
    When I click and drag horizontally to the right
    Then the viewport should move backward in time
    And events should scroll smoothly

  Scenario: Pan with keyboard arrow keys
    Given the timeline is focused
    When I press the right arrow key
    Then the viewport should pan forward by a fixed increment
    And the animation should be smooth

  Scenario: Pan with left arrow key
    Given the timeline is focused
    When I press the left arrow key
    Then the viewport should pan backward by a fixed increment

  Scenario: Fast pan with Shift+Arrow
    Given the timeline is focused
    When I press Shift+Right Arrow
    Then the viewport should pan forward by a larger increment
    And the pan should be faster than without Shift

  # Inertial Scrolling (Momentum)

  Scenario: Initiate inertial scrolling
    Given I am dragging the timeline
    When I release the mouse while moving quickly
    Then the timeline should continue scrolling
    And the scroll velocity should gradually decrease
    And the deceleration should feel natural

  Scenario: Stop inertial scrolling by clicking
    Given the timeline is scrolling with momentum
    When I click or press the mouse down
    Then the inertial scrolling should stop immediately

  Scenario: Inertial scrolling decays to zero
    Given the timeline is scrolling with momentum
    When sufficient time passes
    Then the velocity should decay to zero
    And the scrolling should stop smoothly

  # Zoom Operations

  Scenario: Zoom in with mouse wheel
    Given the timeline is displaying a viewport
    And my mouse is positioned at a specific temporal point
    When I scroll the mouse wheel forward (zoom in)
    Then the zoom level should increase
    And the temporal point under my cursor should remain stationary
    And the viewport should zoom toward my cursor position

  Scenario: Zoom out with mouse wheel
    Given the timeline is displaying a viewport
    And my mouse is positioned at a specific temporal point
    When I scroll the mouse wheel backward (zoom out)
    Then the zoom level should decrease
    And the temporal point under my cursor should remain stationary
    And the viewport should zoom away from my cursor position

  Scenario: Zoom centers on mouse position (anchor point)
    Given the timeline is displayed
    And my mouse is at pixel position X
    And the temporal coordinate at X is T_anchor
    When I zoom in or out
    Then the temporal coordinate T_anchor should remain at pixel position X
    And other temporal coordinates should scale relative to this anchor

  Scenario: Zoom with keyboard shortcuts
    Given the timeline is focused
    When I press "+" or "="
    Then the timeline should zoom in
    And the zoom should center on the viewport center

  Scenario: Zoom out with keyboard shortcuts
    Given the timeline is focused
    When I press "-"
    Then the timeline should zoom out
    And the zoom should center on the viewport center

  Scenario: Zoom with pinch gesture on touch devices
    Given the timeline is displayed on a touch device
    When I perform a pinch-to-zoom gesture
    Then the zoom level should change proportionally
    And the zoom should center on the gesture's midpoint

  # Zoom Level Constraints

  Scenario: Prevent zooming in beyond maximum
    Given the timeline is at a very high zoom level
    When I attempt to zoom in further
    Then the zoom should be limited to the maximum level
    And a visual or haptic indicator may be shown

  Scenario: Prevent zooming out beyond minimum
    Given the timeline is showing the entire time range
    When I attempt to zoom out further
    Then the zoom should be limited to the minimum level
    And the entire dataset should remain visible

  # Viewport State Management

  Scenario: Viewport state includes start and end times
    Given the timeline viewport is positioned
    When the viewport state is queried
    Then it should return viewportStart as BigInt
    And it should return viewportEnd as BigInt
    And it should return zoomLevel as Number

  Scenario: Viewport bounds are calculated correctly
    Given a viewport with zoomLevel Z and offsetX O
    And a canvas width W
    When calculating the visible time range
    Then viewportStart should equal O
    And viewportEnd should equal O + (W / Z)
    And the calculation should use BigInt arithmetic

  # Smooth Animations

  Scenario: Animate zoom smoothly
    Given the timeline is at zoom level 1.0
    When I zoom in to level 2.0
    Then the zoom should animate smoothly over multiple frames
    And each frame should be rendered at 60 FPS
    And the animation should use requestAnimationFrame

  Scenario: Animate pan smoothly
    Given the timeline is at position X
    When I pan to position Y
    Then the pan should animate smoothly
    And the animation should feel responsive

  # Viewport Persistence

  Scenario: Store viewport state in URL hash
    Given the timeline viewport is at a specific position and zoom
    When the viewport changes
    Then the URL hash should update to reflect the state
    And the hash should encode viewportStart and zoomLevel

  Scenario: Restore viewport from URL hash
    Given a URL with a hash containing viewport state
    When the timeline loads
    Then the viewport should be restored to the encoded position
    And the zoom level should match the encoded value
    And events should be visible at the expected location

  # Edge Cases

  Scenario: Pan beyond data boundaries
    Given the timeline has events from year 1900 to 2000
    When I pan the viewport to show years before 1900
    Then the viewport should allow panning into empty space
    And the timeline should remain stable

  Scenario: Zoom to extreme levels
    Given the timeline is displayed
    When I zoom to show nanosecond-level granularity
    Then the rendering should remain stable
    And precision should be maintained via floating origin

  Scenario: Rapid zoom and pan combination
    Given the timeline is displayed
    When I rapidly zoom and pan simultaneously
    Then the viewport should update smoothly
    And no visual glitches should occur
    And the frame rate should remain at 60 FPS
