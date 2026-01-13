Feature: Core Canvas Rendering
  As a timeline visualization system
  I need to render events efficiently using HTML5 Canvas
  So that I can display 10,000+ events at 60 FPS

  Background:
    Given the timeline is initialized
    And the Canvas API is available
    And devicePixelRatio is detected

  # Canvas Setup and Configuration

  Scenario: Initialize Canvas with proper DPI scaling
    Given a canvas element with logical dimensions 1200x800
    And a devicePixelRatio of 2.0
    When the canvas is initialized
    Then the canvas buffer width should be 2400 pixels
    And the canvas buffer height should be 1600 pixels
    And the CSS width should be 1200px
    And the CSS height should be 800px
    And the rendering context should be scaled by 2.0

  Scenario: Handle standard DPI displays
    Given a canvas element with logical dimensions 1200x800
    And a devicePixelRatio of 1.0
    When the canvas is initialized
    Then the canvas buffer width should be 1200 pixels
    And the canvas buffer height should be 800 pixels
    And the rendering should be sharp and clear

  # Hybrid Layer Architecture

  Scenario: Initialize layered rendering architecture
    When the timeline is initialized
    Then there should be a background offscreen canvas for static elements
    And there should be an active scene canvas for dynamic rendering
    And there should be a transparent interaction canvas for input capture
    And there should be a DOM layer for tooltips and UI

  Scenario: Render static background to offscreen canvas
    Given a viewport showing years 1900 to 2000
    When the background layer is rendered
    Then grid lines should be drawn on the offscreen canvas
    And axis labels should be drawn on the offscreen canvas
    And the offscreen canvas should be blitted to the main canvas

  Scenario: Update only active scene on state changes
    Given the timeline is displaying events
    And the background layer has been rendered
    When an event is selected
    Then only the active scene canvas should be redrawn
    And the background layer should not be recalculated
    And the frame should complete within 16.67ms (60 FPS)

  # Dirty Checking and Render Loop

  Scenario: Render loop runs continuously
    When the application starts
    Then requestAnimationFrame should be called
    And the render loop should continue indefinitely
    And CPU usage should be minimal when idle

  Scenario: Redraw only when state changes (dirty checking)
    Given the render loop is running
    And the timeline is in an idle state
    When no state changes occur
    Then the canvas should not be redrawn
    And CPU usage should remain near 0%

  Scenario: Trigger redraw on state change
    Given the render loop is running
    And the timeline is displaying events
    When the viewport is panned
    Then the dirty flag should be set
    And the canvas should be redrawn on the next frame
    And the dirty flag should be cleared after redraw

  # Performance Requirements

  Scenario: Maintain 60 FPS during pan operations
    Given a timeline with 10,000 events
    When the user pans the viewport horizontally
    Then the frame rate should remain at or above 60 FPS
    And frame times should not exceed 16.67ms

  Scenario: Maintain 60 FPS during zoom operations
    Given a timeline with 10,000 events
    When the user zooms in or out
    Then the frame rate should remain at or above 60 FPS
    And visual updates should feel smooth

  Scenario: Initial render completes quickly
    Given a timeline with 1,000 events
    When the timeline is first loaded
    Then the initial render should complete within 100ms
    And the application should be interactive

  Scenario: Handle 10,000+ events without degradation
    Given a timeline with 15,000 events
    When the timeline is rendered
    Then performance should not degrade
    And frame rate should remain at 60 FPS during interaction

  # Event Rendering

  Scenario: Render point events as markers
    Given events with zero duration
    When the timeline is rendered
    Then point events should be displayed as vertical markers
    And markers should be visually distinct from span events

  Scenario: Render span events as duration bars
    Given events with start and end times
    When the timeline is rendered at micro zoom level
    Then span events should be displayed as horizontal bars
    And bar width should represent the time duration
    And bar height should indicate the event's lane

  Scenario: Apply Level of Detail based on zoom
    Given a timeline at macro zoom level (centuries visible)
    When the timeline is rendered
    Then only high-priority events should be visible
    And cluster markers should show "N events" for groups
    And detailed labels should be hidden

  Scenario: Show full detail at micro zoom level
    Given a timeline at micro zoom level (days/hours visible)
    When the timeline is rendered
    Then all events should be visible
    And full labels should be displayed
    And duration bars should show exact spans

  # Color and Visual Styling

  Scenario: Apply visual styling to events
    Given events with category metadata
    When events are rendered
    Then events should be colored by category
    And colors should be visually distinct
    And contrast should meet accessibility standards

  Scenario: Highlight selected events
    Given an event is selected
    When the timeline is rendered
    Then the selected event should have a distinct visual style
    And the selection should be clearly visible
    And other events should remain visually de-emphasized

  Scenario: Show hover state for events
    Given the mouse is hovering over an event
    When the timeline is rendered
    Then the hovered event should have a hover visual style
    And the cursor should change to indicate interactivity
