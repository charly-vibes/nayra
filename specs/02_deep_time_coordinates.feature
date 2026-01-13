Feature: Deep Time Coordinate System
  As a timeline visualization system
  I need to represent time using BigInt coordinates
  So that I can handle geological and astronomical timescales

  Background:
    Given the timeline uses BigInt for temporal coordinates
    And a zero point is defined (present moment or Big Bang)

  # BigInt Temporal Coordinate System

  Scenario: Represent present moment
    Given the zero point is the present moment
    When representing the current time
    Then the coordinate should be 0n (BigInt zero)

  Scenario: Represent historical events (BC/BCE)
    Given the zero point is the present moment
    When representing the year 500 BC
    Then the coordinate should be a negative BigInt
    And the magnitude should represent seconds before present

  Scenario: Represent future events
    Given the zero point is the present moment
    When representing the year 2100 AD
    Then the coordinate should be a positive BigInt
    And the magnitude should represent seconds after present

  Scenario: Represent deep time (billions of years)
    Given the zero point is the Big Bang
    When representing Earth's formation (4.5 billion years ago)
    Then the coordinate should be approximately 9.3 billion years from Big Bang
    And the BigInt should accurately represent this magnitude
    And precision should be maintained

  # Time Unit Constants

  Scenario: Define time unit constants
    When time unit constants are defined
    Then SECOND should equal 1n
    And MINUTE should equal 60n
    And HOUR should equal 3600n
    And DAY should equal 86400n
    And YEAR should equal 31557600n (approximately)
    And BILLION_YEARS should equal 31557600000000000n

  # Time Parsing

  Scenario: Parse ISO 8601 date strings
    When parsing "2024-01-15T14:30:00Z"
    Then it should convert to a BigInt offset from zero point
    And the conversion should be accurate to the second

  Scenario: Parse common date formats
    When parsing "January 15, 2024"
    Then it should convert to a BigInt coordinate
    And the date should be interpreted correctly

  Scenario: Parse BC/AD notation
    When parsing "500 BC"
    Then it should convert to a negative BigInt offset
    And the coordinate should represent 500 years before year 0

  Scenario: Parse geological time notation
    When parsing "65 Ma" (million years ago)
    Then it should convert to a BigInt representing 65 million years before present
    And precision should be maintained

  Scenario: Parse billions of years notation
    When parsing "4.5 Ga" (billion years ago)
    Then it should convert to a BigInt representing 4.5 billion years
    And the value should be accurate

  Scenario: Handle "Year Zero" absence in historical dating
    Given historical calendars have no year 0 (1 BC → 1 AD)
    When parsing dates around the BC/AD boundary
    Then the conversion should account for the missing year
    And temporal math should be correct

  # Time Formatting

  Scenario: Format modern dates (AD)
    Given a BigInt coordinate representing 2024-06-15
    When formatting for display
    Then it should output "June 15, 2024" or similar readable format
    And the format should be culturally appropriate

  Scenario: Format historical dates (BC/BCE)
    Given a BigInt coordinate representing 500 BC
    When formatting for display
    Then it should output "500 BC" or "500 BCE"
    And the BC/BCE designation should be clear

  Scenario: Format geological time (millions of years)
    Given a BigInt coordinate representing 65 million years ago
    When formatting for display at macro zoom
    Then it should output "65 Ma" or "65 million years ago"
    And the format should be concise

  Scenario: Format cosmological time (billions of years)
    Given a BigInt coordinate representing 4.5 billion years ago
    When formatting for display at macro zoom
    Then it should output "4.5 Ga" or "4.5 billion years ago"
    And the magnitude should be clear

  Scenario: Adaptive formatting based on magnitude
    Given various temporal coordinates
    When formatting for display
    Then recent times should show full dates
    And ancient times should show appropriate units (Ma, Ga)
    And the format should optimize readability

  # Floating-Point Precision (Floating Origin)

  Scenario: Convert BigInt to screen coordinates without jitter
    Given a viewport showing years 4,000,000,000 BC to 3,999,999,000 BC
    And events positioned throughout this range
    When calculating screen pixel positions
    Then coordinates should be calculated relative to viewport start
    And pixel positions should have sub-pixel precision
    And events should not exhibit visual jitter

  Scenario: Handle viewport offset calculation
    Given a viewport starting at BigInt coordinate T_start
    And an event at BigInt coordinate T_event
    When calculating the screen position
    Then the delta should be calculated as T_event - T_start
    And the delta should be converted to Number for Canvas API
    And precision loss should be avoided

  Scenario: Maintain precision across zoom levels
    Given events spanning billions of years
    When zooming from macro to micro view
    Then event positions should remain precise
    And sub-pixel rendering should work correctly
    And no coordinate snapping should occur

  # Temporal Arithmetic

  Scenario: Add time durations
    Given a BigInt coordinate T1
    And a BigInt duration D
    When calculating T1 + D
    Then the result should be accurate
    And overflow should not occur

  Scenario: Calculate time differences
    Given two BigInt coordinates T1 and T2
    When calculating T2 - T1
    Then the duration between them should be accurate
    And negative durations should be handled correctly

  Scenario: Compare temporal coordinates
    Given two BigInt coordinates T1 and T2
    When comparing T1 < T2
    Then the comparison should work correctly
    And sorting should order events chronologically

  # Edge Cases

  Scenario: Handle maximum representable time
    Given BigInt has effectively unlimited range
    When representing the age of the universe (13.8 billion years)
    Then the coordinate should be represented accurately
    And no overflow should occur

  Scenario: Handle minimum representable time
    Given deep past timescales
    When representing events billions of years before Big Bang (theoretical)
    Then the system should handle arbitrarily large negative values
    And precision should be maintained

  Scenario: Handle sub-second precision
    Given an event with millisecond precision
    When storing the coordinate
    Then sub-second precision should be preserved
    And the coordinate should be accurate to milliseconds or better
