Feature: Search and Filtering
  As a user
  I need to search and filter timeline events
  So that I can find specific events quickly

  Background:
    Given a timeline with events is displayed
    And events have searchable text (title, description, metadata)

  # Text Search

  Scenario: Open search interface
    Given the timeline is displayed
    When I press Ctrl+F or click the search button
    Then a search input field should appear
    And the input should be focused
    And I should be able to type immediately

  Scenario: Search events by title
    Given the search interface is open
    When I type "World War"
    Then events with "World War" in the title should be highlighted
    And other events may be dimmed or hidden
    And the search should be case-insensitive by default

  Scenario: Search events by description
    Given the search interface is open
    When I type a term that appears in event descriptions
    Then events with matching descriptions should be highlighted
    And the search should include description text

  Scenario: Real-time search (live filtering)
    Given the search interface is open
    When I type each character
    Then the search results should update immediately
    And the filtering should feel instantaneous
    And no lag should be perceptible

  Scenario: Clear search results
    Given a search is active with results
    When I clear the search input
    Then all events should return to normal display
    And highlights should be removed
    And the full timeline should be visible again

  Scenario: Close search interface
    Given the search interface is open
    When I press Escape or click outside the search box
    Then the search interface should close
    And any active search should be cleared
    And focus should return to the timeline

  # Search Results Navigation

  Scenario: Navigate to first search result
    Given a search returns multiple results
    When I press Enter or click "Next"
    Then the viewport should pan to the first matching event
    And the event should be centered or highlighted
    And the event may be selected

  Scenario: Navigate to next search result
    Given I am viewing a search result
    When I press Enter or click "Next" again
    Then the viewport should pan to the next chronological match
    And the new event should be highlighted

  Scenario: Navigate to previous search result
    Given I am viewing a search result
    When I press Shift+Enter or click "Previous"
    Then the viewport should pan to the previous chronological match
    And the previous event should be highlighted

  Scenario: Wrap around search results
    Given I am viewing the last search result
    When I click "Next"
    Then the navigation should wrap to the first result
    And the user should be notified of the wraparound

  Scenario: Display search result count
    Given a search is active
    When results are found
    Then the UI should display the total count (e.g., "5 results")
    And the current result position (e.g., "Result 2 of 5")
    And the count should update as the search term changes

  Scenario: Handle no search results
    Given a search is active
    When no events match the search term
    Then the UI should display "No results found"
    And the timeline should show all events (dimmed or unhighlighted)
    And the user should be informed clearly

  # Advanced Search Features

  Scenario: Search with boolean operators (AND)
    Given the search interface supports advanced syntax
    When I search for "World AND War"
    Then only events containing both "World" and "War" should match
    And the search should be logically correct

  Scenario: Search with boolean operators (OR)
    Given the search interface supports advanced syntax
    When I search for "Napoleon OR Bonaparte"
    Then events containing either term should match
    And the results should include both variants

  Scenario: Search with negation (NOT)
    Given the search interface supports advanced syntax
    When I search for "War NOT World"
    Then events containing "War" but not "World" should match
    And the filtering should be correct

  Scenario: Search with exact phrase matching
    Given the search interface supports quotes
    When I search for "\"World War II\""
    Then only events with the exact phrase should match
    And partial matches should be excluded

  Scenario: Search by date or time range
    Given the search interface supports temporal queries
    When I search for "1940-1945" or "between 1940 and 1945"
    Then events within that time range should be highlighted
    And events outside the range should be filtered

  # Filtering by Category/Tag

  Scenario: Filter events by category
    Given events have category metadata (e.g., "Military", "Political", "Cultural")
    When I select a category filter (e.g., "Military")
    Then only events in that category should be displayed
    And other events should be hidden or dimmed
    And the filter should apply immediately

  Scenario: Filter by multiple categories (OR)
    Given I have selected one category filter
    When I add another category (e.g., "Military" OR "Political")
    Then events in either category should be displayed
    And the filter should use OR logic

  Scenario: Filter by multiple categories (AND)
    Given events can have multiple tags
    When I select multiple filters with AND logic
    Then only events matching all selected categories should be shown
    And the filtering should be strict

  Scenario: Clear category filters
    Given category filters are active
    When I click "Clear filters" or deselect all categories
    Then all events should be displayed again
    And the timeline should return to normal state

  # Combining Search and Filters

  Scenario: Apply both text search and category filter
    Given I have entered a search term
    And I have selected a category filter
    When both are active
    Then only events matching BOTH criteria should be displayed
    And the combination should use AND logic
    And the filtering should be accurate

  Scenario: Clear search while keeping filters
    Given both search and filters are active
    When I clear the search term
    Then category filters should remain active
    And events should still be filtered by category
    And the search should be removed independently

  # Performance

  Scenario: Search performs efficiently on large datasets
    Given a timeline with 10,000 events
    When I perform a text search
    Then the search should complete within 100ms
    And results should update in real-time as I type
    And the application should remain responsive

  Scenario: Use indexed search for very large datasets
    Given a timeline with 100,000+ events
    When performing searches
    Then an inverted index or similar structure should be used
    And searches should remain fast (< 200ms)
    And IndexedDB or Web Worker may assist

  # Search Persistence

  Scenario: Preserve search in URL hash
    Given a search is active
    When the URL is updated
    Then the search term should be encoded in the hash
    And sharing the URL should restore the search
    And the filtered view should be reproducible

  Scenario: Restore search from URL on load
    Given a URL contains a search parameter
    When the timeline loads
    Then the search should be applied automatically
    And the results should be displayed
    And the search input should show the term

  # Accessibility

  Scenario: Search interface is keyboard accessible
    Given the search interface is open
    When navigating with keyboard only
    Then all search controls should be accessible
    And Tab should navigate through results and controls
    And Enter should activate search actions

  Scenario: Announce search results to screen readers
    Given a screen reader is active
    When search results are updated
    Then an ARIA live region should announce the result count
    And the announcement should be clear (e.g., "5 results found")
    And users should be informed of search state changes
