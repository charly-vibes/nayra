# User Interaction Spec Delta

## MODIFIED Requirements

### Requirement: Touch Interaction

The system SHALL support touch gestures on mobile and tablet devices using the PointerEvents API for unified input handling.

> **Note**: The original scenarios (tap-to-select, pinch-to-zoom, swipe-to-pan) remain unchanged. This modification adds the PointerEvents implementation detail and new scenarios below.

#### Scenario: Momentum respects reduced motion preference
- **WHEN** I swipe horizontally with `prefers-reduced-motion: reduce` enabled
- **THEN** the timeline SHALL pan without momentum
- **AND** the pan SHALL stop immediately on pointer release

#### Scenario: Pointer capture during drag
- **WHEN** I start dragging on the canvas
- **THEN** the system SHALL capture the pointer
- **AND** drag events SHALL continue even if pointer leaves canvas bounds

#### Scenario: Third finger during pinch gesture
- **WHEN** I place a third finger on the screen during an active pinch gesture
- **THEN** the pinch gesture SHALL continue with the original two pointers
- **AND** the third pointer SHALL be ignored until the gesture completes

#### Scenario: Double-tap to zoom on touch device
- **WHEN** I double-tap on the timeline on a touch device
- **THEN** the viewport SHALL zoom in centered on the tap position
- **AND** the animation SHALL be smooth

#### Scenario: Screen rotation during gesture
- **WHEN** the screen orientation changes during an active gesture
- **THEN** the active gesture SHALL be cancelled
- **AND** the system SHALL reset to idle state

## ADDED Requirements

### Requirement: Unified Pointer Input

The system SHALL use the PointerEvents API to handle mouse, touch, and pen input through a single code path.

#### Scenario: Mouse input via PointerEvents
- **WHEN** I interact with the timeline using a mouse
- **THEN** the system SHALL handle input via pointer events
- **AND** all existing mouse functionality SHALL work unchanged

#### Scenario: Pen/stylus input via PointerEvents
- **WHEN** I interact with the timeline using a pen or stylus
- **THEN** the system SHALL handle input via pointer events
- **AND** pan and selection SHALL work as expected

#### Scenario: Multi-touch pointer tracking
- **WHEN** I place two fingers on the touch device
- **THEN** the system SHALL track both pointers independently
- **AND** removing one finger SHALL not disrupt tracking of the other

#### Scenario: Wheel zoom preserved
- **WHEN** I use a scroll wheel or trackpad to zoom
- **THEN** the system SHALL zoom via the wheel event listener
- **AND** the wheel event SHALL NOT be affected by PointerEvents migration

#### Scenario: Hybrid device handling
- **WHEN** I use both mouse and touch simultaneously on a hybrid device
- **THEN** the system SHALL use `pointerType` to distinguish input sources
- **AND** mouse hover events SHALL be ignored during active touch gestures

### Requirement: Gesture Error Handling

The system SHALL handle gesture edge cases gracefully without corrupting state.

#### Scenario: Pointer capture failure
- **WHEN** `setPointerCapture()` fails with an error
- **THEN** the system SHALL catch the error
- **AND** the system SHALL fall back to non-captured drag tracking
- **AND** drag functionality SHALL still work within canvas bounds

#### Scenario: Pointer event with unknown ID
- **WHEN** a pointer event fires for an unknown `pointerId`
- **THEN** the system SHALL ignore the event
- **AND** no error SHALL be thrown

#### Scenario: Gesture reset on orientation change
- **WHEN** the device orientation changes
- **THEN** all active gesture state SHALL be cleared
- **AND** pending long-press timers SHALL be cancelled
