# Change: Address Specification Gaps

## Why

During spec review, several gaps were identified that could lead to ambiguity during implementation or missing test coverage. These range from missing scenarios for common interactions (window resize, trackpad gestures) to unclear edge cases (negative durations) and accessibility requirements (skip links).

## What Changes

- **time-coordinates**: Clarify negative/invalid duration handling
- **event-layout**: Define Web Worker message schema
- **viewport-navigation**: Add trackpad two-finger scroll scenario
- **user-interaction**: Add long-press context menu for touch devices
- **accessibility**: Add skip-to-content landmark requirement
- **search-filter**: Standardize debounce timing to 150ms
- **state-management**: Clarify undo/redo is out of scope
- **data-loading**: Clarify Service Worker/offline is out of scope

## Impact

- Affected specs: 9 capabilities (all modifications, no new capabilities)
- Affected code: None yet (specs only, pre-implementation)
- Breaking changes: None
