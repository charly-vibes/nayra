## 1. Specification
- [x] 1.1 Confirm current clustering, tooltip, and cluster-click behavior against the new requirements in `event-layout`, `user-interaction`, and `viewport-navigation`
- [x] 1.2 Finalize cluster data shape needed by rendering, hit detection, tooltip, and navigation as defined in `event-layout`

## 2. Implementation
- [x] 2.1 Rework cluster construction to derive membership from the represented screen footprint at the current scale per `event-layout`
- [x] 2.2 Ensure macro clusters are built from viewport-visible filtered events rather than a partial subset that can misstate counts per `event-layout`
- [x] 2.3 Update rendering and hit detection to use the same cluster geometry and represented-event set per `event-layout` and `user-interaction`
- [x] 2.4 Add cluster tooltip rendering that shows aggregate metadata and contained events per `user-interaction`
- [x] 2.5 Update cluster click navigation so the represented cluster range fills 80% of the viewport with centered 10% padding per `viewport-navigation`
- [x] 2.6 Ensure clustered-to-expanded transitions do not spuriously drop represented events during zoom changes per `event-layout`

## 3. Validation
- [x] 3.1 Add unit tests for cluster membership, count accuracy, tooltip payloads, span-event membership, and click-to-expand calculations
- [x] 3.2 Add integration coverage for clustered zoom transitions, adjacent dense groups, and deep-time example datasets
- [x] 3.3 Run `openspec validate update-cluster-semantics --strict`
- [x] 3.4 Run targeted test suites covering clustering, interaction, navigation, and tooltip behavior
