---
description: Create detailed implementation plans for nayra features
---

# Create Implementation Plan

Create detailed implementation plans following nayra's Spec-Driven Development methodology.

## When Invoked

1. **If a spec file is provided**: Read it fully and begin planning
2. **If no parameters**: Ask for the feature/task description

## Process

### Step 1: Understand the Requirement

1. Read any mentioned spec files in `specs/` completely
2. Check existing research in `research/` for related work
3. Review debates in `debates/` for past discussions on the topic
4. Understand the scope and constraints
5. Consider performance implications (60 FPS target, 10,000+ events)

### Step 2: Research the Codebase

1. Find relevant existing patterns and code
2. Identify integration points
3. Note conventions to follow (vanilla JS, Canvas API, BigInt for time)
4. Track research in a todo list

### Step 3: Design Options (if applicable)

Present design options with pros/cons. Get alignment before detailed planning.

Consider:
- Canvas vs DOM rendering approach
- Performance trade-offs
- Memory implications
- Browser compatibility

### Step 4: Write the Plan

Save to `plans/YYYY-MM-DD-description.md`:

```markdown
# [Feature Name] Implementation Plan

## Overview
[Brief description of what we're implementing]

## Related
- Spec: `specs/XX_feature.feature`
- Research: `research/YYYY-MM-DD-topic.md` (if applicable)
- Technical Reference: `Vanilla JS Data Visualization Backend Review.md`

## Current State
[What exists now, what's missing]

## Desired End State
[What will exist after implementation, how to verify]

## Performance Requirements
- Frame rate: [target FPS]
- Data capacity: [number of events]
- Memory: [constraints]

## Out of Scope
[What we're NOT doing to prevent scope creep]

## Phase 1: [Name]

### Changes Required
- File: `src/[module].js`
- Changes: [Description]

### Success Criteria

#### Automated:
- [ ] Tests pass: `just test`
- [ ] Linting passes: `just lint`
- [ ] Performance benchmarks met

#### Manual:
- [ ] Visual verification in browser
- [ ] [Verification step]

---

## Phase 2: [Name]
[Continue phases as needed]

---

## Testing Strategy
[Following TDD - tests before implementation]

## Performance Considerations
[Canvas optimization, spatial indexing, etc.]

## Browser Compatibility
[Target browsers and fallbacks]

## References
- Related spec: `specs/XX_feature.feature`
- Technical doc: `Vanilla JS Data Visualization Backend Review.md`
```

### Step 5: Review and Iterate

Present the plan for feedback. Iterate until approved.

## Guidelines

1. **Align with Spec-Driven Development**: Plans should reference or result in `.feature` specs
2. **Follow TDD**: Plan tests before implementation
3. **Be specific**: Include file paths and concrete changes
4. **Track progress**: Use todo list throughout planning
5. **No open questions**: Resolve all questions before finalizing
6. **Consider performance**: Always think about 60 FPS target and Canvas rendering implications
