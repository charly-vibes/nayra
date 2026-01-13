---
description: Create handoff document for session context transfer
---

# Create Handoff Document

Create a handoff document to transfer context to the next work session.

## When to Use

Create a handoff when:
- Ending a work session with incomplete work
- Switching between different features
- Need to document current state for future reference

## Process

### Step 1: Gather Context

Review the current session:
- What was attempted
- What was completed
- What is in progress
- What blockers exist
- Current state of the codebase

### Step 2: Write the Handoff

Save to `handoffs/YYYY-MM-DD-HH-MM-topic.md`:

```markdown
---
date: [ISO timestamp]
session_duration: [minutes]
status: [in_progress|blocked|completed]
---

# Handoff: [Topic]

**Date**: [Date and Time]
**Duration**: [X minutes]

## What We Were Doing

[Clear description of the goal]

## What Got Done

- [x] Task 1
- [x] Task 2
- [ ] Task 3 (in progress)

## Current State

### Files Changed
- `src/module.js` - [description of changes]
- `test/module.test.js` - [description of changes]

### Tests Status
- [ ] All tests passing: `just test`
- [x] Some tests failing (see below)
- [ ] New tests written but not yet passing

### Build Status
- [x] Linting passes
- [ ] Build succeeds

## What's Next

### Immediate Next Steps
1. [Concrete next action]
2. [Another concrete action]

### Open Questions
- [ ] Question that needs answering
- [ ] Decision that needs to be made

### Known Issues
- Issue 1: [description and context]
- Issue 2: [description and context]

## Context for Next Session

### Relevant Files
- `src/module.js:45-67` - Critical section for next work
- `plans/YYYY-MM-DD-feature.md` - Original plan

### Key Decisions Made
- Decision 1: [what and why]
- Decision 2: [what and why]

### Performance Notes
- Current frame rate: [X FPS]
- Memory usage: [observations]
- Bottlenecks identified: [list]

### Things to Watch Out For
- [Warning or gotcha discovered]
- [Another thing to be aware of]

## How to Resume

```bash
# Get back to working state
git pull
just test  # Current status: [passing/failing]

# Next action:
# [Specific command or file to start with]
```

## Related
- Plan: `plans/YYYY-MM-DD-feature.md`
- Research: `research/YYYY-MM-DD-topic.md`
- Spec: `specs/XX_feature.feature`
```

### Step 3: Verify Completeness

Ensure the handoff includes:
- [ ] Clear description of current state
- [ ] Concrete next steps
- [ ] All relevant file references
- [ ] Performance or technical notes
- [ ] How to resume work

### Step 4: Present Summary

Provide a brief summary to the user.

## Guidelines

1. **Be specific**: Include exact file paths, line numbers, commands
2. **Be honest**: Document blockers and issues clearly
3. **Be actionable**: Next steps should be concrete, not vague
4. **Include context**: Why decisions were made
5. **Note performance**: Frame rates, memory, bottlenecks
6. **Reference plans**: Link to original plans and specs
