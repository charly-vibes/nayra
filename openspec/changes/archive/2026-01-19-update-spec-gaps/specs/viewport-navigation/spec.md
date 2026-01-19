# Viewport Navigation - Delta

## ADDED Requirements

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
