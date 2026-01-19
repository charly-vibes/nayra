# Core Canvas Rendering

## Purpose

The core rendering system provides efficient HTML5 Canvas-based visualization capable of displaying 10,000+ events at 60 FPS using a hybrid layered architecture with dirty checking.
## Requirements
### Requirement: Canvas DPI Scaling

The system SHALL initialize canvas elements with proper DPI scaling based on devicePixelRatio to ensure sharp rendering on high-DPI displays.

#### Scenario: High DPI display initialization
- **WHEN** a canvas with logical dimensions 1200x800 is initialized on a device with devicePixelRatio of 2.0
- **THEN** the canvas buffer width SHALL be 2400 pixels
- **AND** the canvas buffer height SHALL be 1600 pixels
- **AND** the CSS width SHALL remain 1200px
- **AND** the CSS height SHALL remain 800px
- **AND** the rendering context SHALL be scaled by 2.0

#### Scenario: Standard DPI display initialization
- **WHEN** a canvas with logical dimensions 1200x800 is initialized on a device with devicePixelRatio of 1.0
- **THEN** the canvas buffer width SHALL be 1200 pixels
- **AND** the canvas buffer height SHALL be 800 pixels
- **AND** the rendering SHALL be sharp and clear

### Requirement: Hybrid Layer Architecture

The system SHALL implement a four-layer rendering architecture consisting of background offscreen canvas, active scene canvas, transparent interaction canvas, and DOM overlay layer.

#### Scenario: Layer initialization
- **WHEN** the timeline is initialized
- **THEN** a background offscreen canvas SHALL be created for static elements
- **AND** an active scene canvas SHALL be created for dynamic rendering
- **AND** a transparent interaction canvas SHALL be created for input capture
- **AND** a DOM layer SHALL be created for tooltips and UI

#### Scenario: Static background rendering
- **WHEN** the background layer is rendered for a viewport showing years 1900 to 2000
- **THEN** grid lines SHALL be drawn on the offscreen canvas
- **AND** axis labels SHALL be drawn on the offscreen canvas
- **AND** the offscreen canvas SHALL be blitted to the main canvas

#### Scenario: Selective layer updates
- **WHEN** an event is selected while the timeline is displaying events with a rendered background
- **THEN** only the active scene canvas SHALL be redrawn
- **AND** the background layer SHALL NOT be recalculated
- **AND** the frame SHALL complete within 16.67ms (60 FPS)

### Requirement: Dirty Checking Render Loop

The system SHALL implement a continuous render loop using requestAnimationFrame with dirty checking to minimize CPU usage when idle.

#### Scenario: Continuous render loop
- **WHEN** the application starts
- **THEN** requestAnimationFrame SHALL be called
- **AND** the render loop SHALL continue indefinitely
- **AND** CPU usage SHALL be minimal when idle

#### Scenario: Idle state optimization
- **WHEN** the render loop is running and the timeline is in an idle state with no state changes
- **THEN** the canvas SHALL NOT be redrawn
- **AND** CPU usage SHALL remain near 0%

#### Scenario: State change triggers redraw
- **WHEN** the viewport is panned while the render loop is running
- **THEN** the dirty flag SHALL be set
- **AND** the canvas SHALL be redrawn on the next frame
- **AND** the dirty flag SHALL be cleared after redraw

### Requirement: 60 FPS Performance

The system SHALL maintain a frame rate of 60 FPS (frame times under 16.67ms) during all interactive operations with 10,000+ events.

#### Scenario: Pan operation performance
- **WHEN** the user pans the viewport horizontally on a timeline with 10,000 events
- **THEN** the frame rate SHALL remain at or above 60 FPS
- **AND** frame times SHALL NOT exceed 16.67ms

#### Scenario: Zoom operation performance
- **WHEN** the user zooms in or out on a timeline with 10,000 events
- **THEN** the frame rate SHALL remain at or above 60 FPS
- **AND** visual updates SHALL feel smooth

#### Scenario: Large dataset performance
- **WHEN** a timeline with 15,000 events is rendered
- **THEN** performance SHALL NOT degrade
- **AND** the frame rate SHALL remain at 60 FPS during interaction

### Requirement: Fast Initial Render

The system SHALL complete initial render within 100ms on modern hardware.

#### Scenario: Initial load performance
- **WHEN** a timeline with 1,000 events is first loaded
- **THEN** the initial render SHALL complete within 100ms
- **AND** the application SHALL be interactive immediately

### Requirement: Event Visual Rendering

The system SHALL render events visually as markers for point events and duration bars for span events.

#### Scenario: Point event rendering
- **WHEN** events with zero duration are rendered
- **THEN** point events SHALL be displayed as vertical markers
- **AND** markers SHALL be visually distinct from span events

#### Scenario: Span event rendering
- **WHEN** events with start and end times are rendered at micro zoom level
- **THEN** span events SHALL be displayed as horizontal bars
- **AND** bar width SHALL represent the time duration
- **AND** bar height SHALL indicate the event's lane

### Requirement: Level of Detail Rendering

The system SHALL apply Level of Detail (LOD) strategies based on zoom level to optimize rendering performance.

#### Scenario: Macro zoom level rendering
- **WHEN** the timeline is rendered at macro zoom level with centuries visible
- **THEN** only high-priority events SHALL be visible
- **AND** cluster markers SHALL show "N events" for groups
- **AND** detailed labels SHALL be hidden

#### Scenario: Micro zoom level rendering
- **WHEN** the timeline is rendered at micro zoom level with days/hours visible
- **THEN** all events SHALL be visible
- **AND** full labels SHALL be displayed
- **AND** duration bars SHALL show exact spans

### Requirement: Visual Styling and States

The system SHALL apply visual styling to events based on category, selection state, and hover state while maintaining accessibility standards.

#### Scenario: Category-based styling
- **WHEN** events with category metadata are rendered
- **THEN** events SHALL be colored by category
- **AND** colors SHALL be visually distinct
- **AND** contrast SHALL meet WCAG accessibility standards

#### Scenario: Selection state display
- **WHEN** an event is selected and the timeline is rendered
- **THEN** the selected event SHALL have a distinct visual style
- **AND** the selection SHALL be clearly visible
- **AND** other events SHALL remain visually de-emphasized

#### Scenario: Hover state display
- **WHEN** the mouse is hovering over an event and the timeline is rendered
- **THEN** the hovered event SHALL have a hover visual style
- **AND** the cursor SHALL change to indicate interactivity

### Requirement: Responsive Canvas Resize

The system SHALL handle window and container resize events, re-initializing canvas dimensions and DPI scaling while preserving viewport state.

#### Scenario: Window resize triggers canvas update
- **WHEN** the browser window is resized
- **THEN** the canvas buffer dimensions SHALL be recalculated based on new container size
- **AND** DPI scaling SHALL be reapplied based on current devicePixelRatio
- **AND** the viewport temporal range SHALL be preserved
- **AND** a redraw SHALL be triggered

#### Scenario: Container resize without window change
- **WHEN** the timeline container is resized (e.g., sidebar toggle) without a window resize event
- **THEN** a ResizeObserver SHALL detect the change
- **AND** the canvas SHALL resize accordingly
- **AND** performance SHALL not degrade during resize

#### Scenario: Resize debouncing
- **WHEN** rapid resize events occur (e.g., user dragging window edge)
- **THEN** canvas reinitialization SHALL be debounced
- **AND** the final resize SHALL be applied after events settle
- **AND** intermediate states SHALL not cause visual glitches

## Technical Notes

- **Canvas API**: Uses 2D rendering context, not WebGL
- **DPI Handling**: Critical for sharp rendering on Retina and high-DPI displays
- **Layering**: Reduces redraw overhead by isolating static (background) from dynamic (events) elements
- **Dirty Checking**: Prevents unnecessary redraws, crucial for battery efficiency
- **Performance Target**: 16.67ms frame budget for 60 FPS

## Related

- State Management (state-management/spec.md) - Provides dirty flag and state change notifications
- Viewport Navigation (viewport-navigation/spec.md) - Triggers redraws via pan/zoom
- Event Layout (event-layout/spec.md) - Provides positioned events for rendering
- Performance (performance/spec.md) - Defines benchmarks and measurement
