Feature: Browser Compatibility
  As a timeline application
  I need to work across modern browsers
  So that users can access the timeline regardless of their browser choice

  Background:
    Given the timeline application uses modern web APIs

  # Core API Requirements

  Scenario: Canvas API 2D context is supported
    Given the browser is one of the target browsers
    When checking for Canvas API support
    Then the browser should support canvas element
    And the 2D rendering context should be available
    And canvas drawing methods should work correctly

  Scenario: ES6+ module support
    Given the application uses ES6 modules
    When loading the application
    Then the browser should support ES6 import/export syntax
    And dynamic imports should work (if used)
    And module loading should not cause errors

  Scenario: BigInt primitive type is supported
    Given the application uses BigInt for temporal coordinates
    When performing temporal calculations
    Then the browser should support BigInt natively
    And BigInt arithmetic operations should work
    And no polyfill should be needed

  Scenario: IndexedDB is available
    Given the application uses IndexedDB for data persistence
    When accessing IndexedDB
    Then the API should be available
    And database operations should work correctly
    And asynchronous access should be supported

  # Target Browser Versions

  Scenario: Chrome/Edge 90+ is supported
    Given the browser is Chrome or Edge version 90 or higher
    When loading and using the application
    Then all features should work correctly
    And performance should meet targets (60 FPS)
    And no compatibility issues should occur

  Scenario: Firefox 90+ is supported
    Given the browser is Firefox version 90 or higher
    When loading and using the application
    Then all features should work correctly
    And rendering should be consistent with Chrome
    And performance should be comparable

  Scenario: Safari 14+ is supported
    Given the browser is Safari version 14 or higher
    When loading and using the application
    Then all features should work correctly
    And BigInt support should be available (Safari 14+)
    And rendering should be consistent with other browsers

  # Feature Detection and Graceful Degradation

  Scenario: Detect required features on startup
    When the application initializes
    Then it should check for required API support
    And it should detect Canvas API availability
    And it should detect BigInt support
    And it should detect IndexedDB availability

  Scenario: Display error message if required features are missing
    Given the browser lacks a required feature (e.g., BigInt)
    When the application attempts to start
    Then an error message should be displayed
    And the message should explain which feature is missing
    And the message should suggest upgrading the browser
    And the application should fail gracefully

  Scenario: Provide fallback for optional features
    Given the browser lacks an optional feature (e.g., Service Workers)
    When the application runs
    Then the core functionality should still work
    And the optional feature should be skipped
    And no errors should prevent basic usage

  # High-DPI Display Support

  Scenario: Detect devicePixelRatio correctly across browsers
    Given the application runs on various devices
    When detecting display characteristics
    Then window.devicePixelRatio should be read correctly
    And the value should be accurate on Retina and high-DPI displays
    And canvas scaling should work across all browsers

  Scenario: Render sharp graphics on high-DPI displays
    Given a device with devicePixelRatio of 2.0 or higher
    When the timeline is rendered
    Then graphics should appear sharp and clear
    And no blurriness should be visible
    And text should be crisp

  # requestAnimationFrame Consistency

  Scenario: Use requestAnimationFrame for rendering loop
    Given the application uses requestAnimationFrame
    When the render loop runs
    Then requestAnimationFrame should be called correctly
    And the callback should execute at the display refresh rate
    And frame timing should be consistent across browsers

  Scenario: Handle page visibility changes
    Given the timeline is running
    When the browser tab becomes hidden or inactive
    Then requestAnimationFrame should throttle or pause
    And the application should conserve resources
    And rendering should resume when the tab becomes visible

  # Touch and Pointer Events

  Scenario: Support touch events on mobile browsers
    Given the application runs on a mobile browser (iOS Safari, Chrome Mobile)
    When using touch gestures
    Then touch events should be handled correctly
    And pinch-to-zoom should work
    And swipe-to-pan should work
    And the experience should be responsive

  Scenario: Support Pointer Events API
    Given the browser supports Pointer Events (modern standard)
    When handling input
    Then the application should use Pointer Events if available
    And the API should unify mouse, touch, and pen input
    And fallback to mouse/touch events if Pointer Events are unavailable

  # CSS and Layout Consistency

  Scenario: Consistent layout across browsers
    Given the timeline uses CSS for layout
    When rendered in different browsers
    Then the layout should appear consistent
    And flexbox or grid should work correctly
    And no major visual differences should exist

  Scenario: Respect system preferences (dark mode, reduced motion)
    Given the user has system preferences set
    When the application loads
    Then prefers-color-scheme should be detected correctly
    And prefers-reduced-motion should be respected
    And the application should adapt to user preferences

  # Performance Across Browsers

  Scenario: Meet performance targets on Chrome/Edge
    Given the application runs on Chrome or Edge
    When rendering 10,000 events
    Then frame rate should be >= 60 FPS
    And performance targets should be met

  Scenario: Meet performance targets on Firefox
    Given the application runs on Firefox
    When rendering 10,000 events
    Then frame rate should be >= 60 FPS
    And performance should be comparable to Chrome

  Scenario: Meet performance targets on Safari
    Given the application runs on Safari
    When rendering 10,000 events
    Then frame rate should be >= 60 FPS
    And performance should be reasonable (Safari canvas may be slightly slower)

  # Web Worker Support

  Scenario: Web Workers function correctly across browsers
    Given the application uses Web Workers
    When offloading computation
    Then Workers should be created successfully
    And postMessage communication should work
    And Workers should execute in all target browsers

  # CORS and Data Loading

  Scenario: Handle CORS correctly when loading external data
    Given data is fetched from external sources (CDN, Wikidata)
    When making cross-origin requests
    Then CORS headers should be handled correctly
    And browsers should allow the requests
    And data should load successfully

  # Testing and Validation

  Scenario: Automated cross-browser testing
    Given the application is deployed
    When running automated tests
    Then tests should execute on Chrome, Firefox, and Safari
    And all tests should pass on all target browsers
    And compatibility should be verified

  Scenario: Manual testing on target browsers
    Given the application is feature-complete
    When manually tested on target browsers
    Then all functionality should work
    And visual consistency should be verified
    And any browser-specific issues should be documented and fixed
