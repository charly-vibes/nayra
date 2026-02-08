## ADDED Requirements

### Requirement: Help Button

The system SHALL provide a persistent, touch-accessible button to toggle the help menu, enabling discoverability on devices without a physical keyboard.

#### Scenario: Help button visibility
- **WHEN** the timeline is displayed
- **THEN** a "?" help button SHALL be visible in the bottom-right corner
- **AND** the button SHALL be positioned fixed with z-index 900 (below the help menu overlay at z-index 1000)
- **AND** the button SHALL respect mobile safe areas via `env(safe-area-inset-*)` offsets

#### Scenario: Help button toggles help menu
- **WHEN** I tap or click the help button
- **THEN** the help menu SHALL open if it is closed
- **OR** the help menu SHALL close if it is open

#### Scenario: Help button does not interfere with canvas
- **WHEN** I tap or click the help button
- **THEN** pointer events on the button SHALL NOT be forwarded to the canvas interaction handlers
- **AND** tapping the button SHALL NOT initiate pan, zoom, or selection gestures

#### Scenario: Help button touch target size
- **WHEN** the help button is displayed
- **THEN** the button SHALL have a minimum touch target of 44x44 CSS pixels
- **AND** the button SHALL provide visual press feedback on interaction

#### Scenario: Help button accessibility
- **WHEN** the help button is rendered
- **THEN** it SHALL be a `<button type="button">` element
- **AND** it SHALL have an `aria-label` describing its purpose
- **AND** it SHALL be focusable via keyboard (Tab)
- **AND** it SHALL be activatable via Enter or Space (native button semantics)
