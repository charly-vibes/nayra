# User Interaction and Input Handling

## Purpose

The user interaction system provides responsive, multi-modal input handling for event exploration and manipulation. The system SHALL support mouse, touch, and keyboard input with accurate hit detection, visual feedback, and accessibility features, maintaining sub-16ms response times for all interactions.
## Requirements
### Requirement: Mouse Interaction

The system SHALL provide responsive mouse-based interaction with visual feedback.

#### Scenario: Event hover state
- **WHEN** I move my mouse over an event
- **THEN** the event SHALL show a hover state
- **AND** the cursor SHALL change to a pointer
- **AND** a tooltip MAY appear with event details

#### Scenario: Event selection
- **WHEN** I click on an event
- **THEN** the event SHALL be selected
- **AND** the event SHALL show a selected visual state
- **AND** other events SHALL be deselected
- **AND** event details MAY be displayed in a panel

#### Scenario: Multi-select with modifier
- **WHEN** I Ctrl+Click (or Cmd+Click on macOS) on event B with event A already selected
- **THEN** both event A and event B SHALL be selected
- **AND** the selection SHALL be visually indicated
- **AND** I SHALL be able to select additional events

#### Scenario: Deselect via background click
- **WHEN** I click on the timeline background (not on an event) with an event selected
- **THEN** the selected event SHALL be deselected
- **AND** the selection visual state SHALL be removed

#### Scenario: Double-click zoom to event
- **WHEN** I double-click on an event
- **THEN** the viewport SHALL animate to center on that event
- **AND** the zoom level SHALL adjust to show the event clearly
- **AND** the animation SHALL be smooth

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

### Requirement: Hit Detection

The system SHALL provide accurate, efficient hit detection for all interactive elements.

#### Scenario: Accurate event hit detection
- **WHEN** I click at screen coordinates (X, Y) with events rendered on the canvas
- **THEN** the system SHALL determine which event (if any) is at that position
- **AND** the determination SHALL use spatial hash lookup
- **AND** the hit detection SHALL complete within 1ms

#### Scenario: Overlapping event hit detection
- **WHEN** I click at a position with multiple overlapping events
- **THEN** the frontmost (topmost lane) event SHALL be selected
- **AND** the hit detection SHALL handle z-ordering correctly

#### Scenario: Shape-aware hit detection
- **WHEN** I click near an event edge with events having different shapes (points vs bars)
- **THEN** the hit detection SHALL use geometric intersection
- **AND** clicks just outside the event SHALL not trigger selection
- **AND** precision SHALL be maintained (i.e., based on geometry, not bounding box)

### Requirement: Keyboard Navigation

The system SHALL provide full keyboard navigation support for accessibility.

#### Scenario: Tab navigation forward
- **WHEN** I press Tab on a focused timeline
- **THEN** focus SHALL move to the next event chronologically
- **AND** the focused event SHALL be highlighted
- **AND** the viewport SHALL pan to keep the focused event visible

#### Scenario: Tab navigation backward
- **WHEN** I press Shift+Tab on a focused timeline
- **THEN** focus SHALL move to the previous event chronologically
- **AND** the focused event SHALL be highlighted

#### Scenario: Activate focused event
- **WHEN** I press Enter or Space with an event having keyboard focus
- **THEN** the event SHALL be selected
- **AND** event details SHALL be displayed

#### Scenario: Home key navigation
- **WHEN** I press Home on a focused timeline
- **THEN** the viewport SHALL pan to the first event chronologically
- **AND** the first event SHALL be focused

#### Scenario: End key navigation
- **WHEN** I press End on a focused timeline
- **THEN** the viewport SHALL pan to the last event chronologically
- **AND** the last event SHALL be focused

### Requirement: Tooltips and Details

The system SHALL display contextual information through tooltips and detail panels.

#### Scenario: Tooltip display on hover
- **WHEN** I hover over an event for 500ms
- **THEN** a tooltip SHALL appear
- **AND** the tooltip SHALL show event title and time
- **AND** the tooltip SHALL position near the cursor without obscuring the event

#### Scenario: Tooltip hiding
- **WHEN** I move the mouse away from the event with a tooltip displayed
- **THEN** the tooltip SHALL disappear
- **AND** the disappearance SHALL be immediate or with a short delay

#### Scenario: Detail panel display
- **WHEN** I select an event
- **THEN** a detail panel SHALL appear
- **AND** the panel SHALL show full event information
- **AND** the panel SHALL include title, description, time range, and metadata

#### Scenario: Detail panel closing
- **WHEN** I click the close button or press Escape with an event detail panel displayed
- **THEN** the detail panel SHALL close
- **AND** the event SHALL remain selected

### Requirement: Search Interface Integration

The system SHALL integrate search functionality with user interaction.

#### Scenario: Open search interface
- **WHEN** I press Ctrl+F or click the search icon
- **THEN** a search input field SHALL appear
- **AND** the field SHALL be focused for immediate typing

#### Scenario: Text search execution
- **WHEN** I type a search term in the open search interface
- **THEN** matching events SHALL be highlighted
- **AND** non-matching events MAY be dimmed
- **AND** the search SHALL update in real-time as I type

#### Scenario: Search result navigation
- **WHEN** I press Enter or click "Next" with search results displayed
- **THEN** the viewport SHALL pan to the next matching event
- **AND** the event SHALL be highlighted or selected

#### Scenario: Clear search
- **WHEN** I clear the search field or press Escape with a search active
- **THEN** all events SHALL return to normal display
- **AND** highlights SHALL be removed

### Requirement: Context Menu

The system SHALL provide contextual actions through right-click menus.

#### Scenario: Context menu display
- **WHEN** I right-click on an event
- **THEN** a context menu SHALL appear
- **AND** the menu SHALL offer relevant actions (e.g., "Details", "Zoom to event", "Copy link")

#### Scenario: Context menu action execution
- **WHEN** I click "Zoom to event" with a context menu open for an event
- **THEN** the viewport SHALL animate to focus on that event
- **AND** the context menu SHALL close

### Requirement: Drag and Drop (Conditional)

The system SHALL support event repositioning through drag and drop when an explicit edit mode is enabled.

#### Scenario: Event repositioning via drag in edit mode
- **WHEN** I drag a selected event horizontally on a timeline that has editing enabled
- **THEN** the event SHALL move in time
- **AND** a preview SHALL show the new position
- **AND** the change SHALL be applied on release

### Requirement: Input Performance

The system SHALL maintain responsive input handling under all conditions.

#### Scenario: Responsive input handling
- **WHEN** I interact with the timeline (click, hover, drag) displaying 10,000 events
- **THEN** input handling SHALL respond within 16ms
- **AND** interactions SHALL feel immediate
- **AND** no input lag SHALL be perceptible

#### Scenario: Smooth hover state updates
- **WHEN** I move my mouse across events
- **THEN** hover states SHALL update smoothly
- **AND** the frame rate SHALL remain at 60 FPS
- **AND** visual feedback SHALL be immediate

### Requirement: Touch Context Menu

The system SHALL provide context menu access on touch devices through long-press gesture.

#### Scenario: Long-press to open context menu
- **WHEN** I long-press (hold for 500ms) on an event on a touch device
- **THEN** a context menu SHALL appear
- **AND** haptic feedback MAY be provided if supported
- **AND** the menu SHALL offer the same actions as right-click context menu

#### Scenario: Long-press cancellation
- **WHEN** I move my finger during a long-press before the threshold
- **THEN** the long-press SHALL be cancelled
- **AND** the gesture SHALL be treated as a pan instead
- **AND** no context menu SHALL appear

#### Scenario: Long-press on empty area
- **WHEN** I long-press on the timeline background (not on an event)
- **THEN** a context menu MAY appear with timeline-level actions
- **OR** no menu SHALL appear (implementation choice)
- **AND** the behavior SHALL be consistent

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

## Technical Notes

- Hit detection SHALL use spatial hash indexing to achieve O(1) average-case performance
- Event handlers SHALL be debounced or throttled as appropriate to maintain performance
- Touch events SHALL use preventDefault() carefully to avoid interfering with browser gestures
- Keyboard focus SHALL be visually distinct with WCAG-compliant focus indicators

## Related

- Event Layout: Spatial hash from layout system enables efficient hit detection
- Accessibility: Keyboard navigation and ARIA attributes provide screen reader support
- Performance: All input handling must complete within 16ms
- State Management: Selection state managed through central store
