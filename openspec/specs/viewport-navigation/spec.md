# Viewport Navigation

## Purpose

The viewport navigation system enables users to explore events at different temporal scales through panning and zooming operations. The system SHALL maintain smooth 60 FPS performance during all navigation operations and support multiple input methods including mouse, keyboard, touch, and gesture controls.
## Requirements
### Requirement: Horizontal Panning

The system SHALL allow users to pan the timeline horizontally to explore different time periods.

#### Scenario: Mouse drag panning to the left
- **WHEN** I click and drag horizontally to the left on a timeline viewport
- **THEN** the viewport SHALL move forward in time
- **AND** events SHALL scroll smoothly
- **AND** the frame rate SHALL remain at 60 FPS

#### Scenario: Mouse drag panning to the right
- **WHEN** I click and drag horizontally to the right on a timeline viewport
- **THEN** the viewport SHALL move backward in time
- **AND** events SHALL scroll smoothly

#### Scenario: Keyboard arrow navigation forward
- **WHEN** I press the right arrow key on a focused timeline
- **THEN** the viewport SHALL pan forward by a fixed increment
- **AND** the animation SHALL be smooth

#### Scenario: Keyboard arrow navigation backward
- **WHEN** I press the left arrow key on a focused timeline
- **THEN** the viewport SHALL pan backward by a fixed increment

#### Scenario: Fast panning with modifier key
- **WHEN** I press Shift+Right Arrow on a focused timeline
- **THEN** the viewport SHALL pan forward by a larger increment than without Shift
- **AND** the pan SHALL be faster than without Shift

### Requirement: Inertial Scrolling

The system SHALL provide momentum-based scrolling that continues after drag release with natural deceleration.

#### Scenario: Initiate momentum scrolling
- **WHEN** I release the mouse while dragging the timeline quickly
- **THEN** the timeline SHALL continue scrolling
- **AND** the scroll velocity SHALL gradually decrease
- **AND** the deceleration SHALL feel natural

#### Scenario: Stop momentum scrolling
- **WHEN** I click or press the mouse down while the timeline is scrolling with momentum
- **THEN** the inertial scrolling SHALL stop immediately

#### Scenario: Natural decay to stop
- **WHEN** sufficient time passes during momentum scrolling
- **THEN** the velocity SHALL decay to zero
- **AND** the scrolling SHALL stop smoothly

### Requirement: Zoom Operations

The system SHALL support zooming in and out while maintaining the temporal point under the cursor as an anchor.

#### Scenario: Mouse wheel zoom in
- **WHEN** I scroll the mouse wheel forward on a timeline with my mouse at a specific temporal point
- **THEN** the zoom level SHALL increase
- **AND** the temporal point under the cursor SHALL remain stationary
- **AND** the viewport SHALL zoom toward my cursor position

#### Scenario: Mouse wheel zoom out
- **WHEN** I scroll the mouse wheel backward on a timeline with my mouse at a specific temporal point
- **THEN** the zoom level SHALL decrease
- **AND** the temporal point under the cursor SHALL remain stationary
- **AND** the viewport SHALL zoom away from my cursor position

#### Scenario: Anchor point preservation
- **WHEN** I zoom in or out with my mouse at pixel position X where temporal coordinate is T_anchor
- **THEN** the temporal coordinate T_anchor SHALL remain at pixel position X
- **AND** other temporal coordinates SHALL scale relative to this anchor

#### Scenario: Keyboard zoom in
- **WHEN** I press "+" or "=" on a focused timeline
- **THEN** the timeline SHALL zoom in
- **AND** the zoom SHALL center on the viewport center

#### Scenario: Keyboard zoom out
- **WHEN** I press "-" on a focused timeline
- **THEN** the timeline SHALL zoom out
- **AND** the zoom SHALL center on the viewport center

#### Scenario: Touch pinch gesture zoom
- **WHEN** I perform a pinch-to-zoom gesture on a timeline displayed on a touch device
- **THEN** the zoom level SHALL change proportionally
- **AND** the zoom SHALL center on the gesture's midpoint

### Requirement: Zoom Level Constraints

The system SHALL enforce minimum and maximum zoom levels to maintain stability and usability.

#### Scenario: Maximum zoom limit
- **WHEN** I attempt to zoom in further at a very high zoom level
- **THEN** the zoom SHALL be limited to the maximum level
- **AND** a visual or haptic indicator MAY be shown

#### Scenario: Minimum zoom limit
- **WHEN** I attempt to zoom out further while showing the entire time range
- **THEN** the zoom SHALL be limited to the minimum level
- **AND** the entire dataset SHALL remain visible

### Requirement: Viewport State Management

The system SHALL maintain accurate viewport state including temporal boundaries and zoom level.

#### Scenario: Viewport state components
- **WHEN** the viewport state is queried
- **THEN** it SHALL return viewportStart as BigInt
- **AND** it SHALL return viewportEnd as BigInt
- **AND** it SHALL return zoomLevel as Number

#### Scenario: Viewport bounds calculation
- **WHEN** calculating the visible time range with zoomLevel Z, offsetX O, and canvas width W
- **THEN** viewportStart SHALL equal O
- **AND** viewportEnd SHALL equal O + (W / Z)
- **AND** the calculation SHALL use BigInt arithmetic

### Requirement: Smooth Animations

The system SHALL provide smooth, 60 FPS animations for all viewport changes.

#### Scenario: Zoom animation
- **WHEN** I zoom from level 1.0 to level 2.0
- **THEN** the zoom SHALL animate smoothly over multiple frames
- **AND** each frame SHALL be rendered at 60 FPS
- **AND** the animation SHALL use requestAnimationFrame

#### Scenario: Pan animation
- **WHEN** I pan from position X to position Y
- **THEN** the pan SHALL animate smoothly
- **AND** the animation SHALL feel responsive

### Requirement: Viewport Persistence

The system SHALL preserve and restore viewport state through URL encoding.

#### Scenario: Store viewport in URL
- **WHEN** the viewport changes
- **THEN** the URL hash SHALL update to reflect the state
- **AND** the hash SHALL encode viewportStart and zoomLevel

#### Scenario: Restore viewport from URL
- **WHEN** the timeline loads with a URL hash containing viewport state
- **THEN** the viewport SHALL be restored to the encoded position
- **AND** the zoom level SHALL match the encoded value
- **AND** events SHALL be visible at the expected location

### Requirement: Edge Case Handling

The system SHALL handle edge cases gracefully without performance degradation.

#### Scenario: Panning beyond data boundaries
- **WHEN** I pan the viewport to show time periods outside the event data range (e.g., before 1900 when data starts at 1900)
- **THEN** the viewport SHALL allow panning into empty space
- **AND** the timeline SHALL remain stable

#### Scenario: Extreme zoom levels
- **WHEN** I zoom to show nanosecond-level granularity
- **THEN** the rendering SHALL remain stable
- **AND** precision SHALL be maintained via floating origin

#### Scenario: Combined rapid operations
- **WHEN** I rapidly zoom and pan simultaneously
- **THEN** the viewport SHALL update smoothly
- **AND** no visual glitches SHALL occur
- **AND** the frame rate SHALL remain at 60 FPS

### Requirement: Trackpad Gesture Support

The system SHALL support trackpad two-finger gestures for panning and zooming on devices with precision touchpads.

#### Scenario: Two-finger horizontal scroll for panning
- **WHEN** I perform a two-finger horizontal scroll on a trackpad
- **THEN** the viewport SHALL pan horizontally
- **AND** the pan direction SHALL match the scroll direction (natural or inverted based on OS setting)
- **AND** the movement SHALL feel smooth and proportional to gesture speed

#### Scenario: Pinch-to-zoom on trackpad
- **WHEN** I perform a pinch gesture on a precision trackpad (e.g., MacBook, Windows Precision Touchpad)
- **THEN** the timeline SHALL zoom in or out
- **AND** the zoom SHALL anchor at the cursor position
- **AND** the gesture SHALL be detected via wheel events with ctrlKey modifier

#### Scenario: Momentum scrolling from trackpad
- **WHEN** I perform a quick swipe and release on a trackpad
- **THEN** the viewport SHALL continue scrolling with momentum
- **AND** the deceleration SHALL match the inertial scrolling behavior
- **AND** clicking SHALL stop the momentum immediately

## Technical Notes

- All viewport calculations SHALL use BigInt arithmetic for temporal coordinates to maintain precision across extreme time ranges
- The floating origin technique SHALL be employed to prevent floating-point precision issues at extreme zoom levels
- requestAnimationFrame SHALL be used for all animations to ensure synchronization with display refresh rate
- Inertial scrolling SHALL use physics-based easing functions for natural feel

## Related

- Event Rendering: Viewport changes trigger event re-rendering within visible bounds
- State Management: Viewport state is managed through central store
- Performance: All navigation operations must meet 60 FPS target
- Accessibility: Keyboard navigation provides alternative to mouse/touch input
