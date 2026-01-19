# [Feature Name] Implementation Plan

**Date**: YYYY-MM-DD

## Overview

[Brief description of what we're implementing]

## Related

- Spec: `specs/XX_feature.feature` (if applicable)
- Research: `research/YYYY-MM-DD-topic.md` (if applicable)
- Related issues/tickets: [references]

## Current State

[What exists now, what's missing, what needs to change]

## Desired End State

[What will exist after implementation]

**How to verify:**
- [Specific verification steps]
- [Expected behaviors]

## Out of Scope

[What we're explicitly NOT doing to prevent scope creep]

## Risks & Mitigations

[Identified risks and how we'll handle them]

## Phase 1: [Name]

### Changes Required

**File: `path/to/file.ext`**
- Changes: [Specific modifications needed]
- Tests: [What tests to write first (TDD)]

**File: `another/file.ext`**
- Changes: [Specific modifications needed]
- Tests: [What tests to write first (TDD)]

### Implementation Approach

[How we'll implement this phase - key decisions, patterns to use]

### Success Criteria

#### Automated:
- [ ] Tests pass: `npm test` (or relevant command)
- [ ] Type checking passes (if applicable)
- [ ] Linting passes (if applicable)
- [ ] Build succeeds (if applicable)

#### Manual:
- [ ] [Specific manual verification step 1]
- [ ] [Specific manual verification step 2]

### Dependencies

[Any dependencies on other work or external factors]

---

## Phase 2: [Name]

[Continue with same structure for each phase]

---

## Testing Strategy

**Following TDD:**
1. Write tests first for each behavior
2. Watch tests fail (Red)
3. Implement minimal code to pass (Green)
4. Refactor while keeping tests green

**Test types needed:**
- Unit tests: [What to unit test]
- Integration tests: [What integration scenarios]
- E2E tests: [If applicable]

## Rollback Strategy

[How to safely rollback if something goes wrong]

## References

- [Related documentation]
- [Similar implementations in the codebase]
- [External resources]
