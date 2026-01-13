---
description: Resume work from a handoff document
---

# Resume from Handoff

Resume work from a previous session using a handoff document.

## When Invoked

1. **If handoff file provided**: Load it and resume
2. **If no file**: Ask user which handoff to resume from

## Process

### Step 1: Load the Handoff

1. Read the handoff document completely
2. Understand what was done and what's next
3. Note any blockers or issues

### Step 2: Verify Current State

Run the commands from "How to Resume" section:
```bash
git pull
git status
just test
```

Compare actual state to documented state. Report any differences.

### Step 3: Create Todo List

Based on "What's Next" section, create a todo list:
- [ ] Immediate next steps from handoff
- [ ] Address any known issues
- [ ] Answer open questions

### Step 4: Resume Work

1. Start with the first item on todo list
2. Follow TDD methodology
3. Keep performance targets in mind
4. Update todo list as you progress

### Step 5: Handle Divergence

If current state differs from handoff:
1. Document the differences
2. Adjust plan accordingly
3. Inform user of changes

## Guidelines

1. **Trust the handoff**: It contains valuable context
2. **Verify state**: Always check actual vs documented state
3. **Ask questions**: If handoff is unclear, ask user
4. **Update context**: Note any new discoveries
5. **Track progress**: Use todo list throughout
6. **Performance check**: Re-verify performance metrics

## Common Scenarios

### Handoff Says "In Progress"
- Tests are likely failing
- Implementation is partial
- Continue where left off

### Handoff Says "Blocked"
- Address the blocker first
- May need to ask user for input
- Don't proceed until unblocked

### Handoff Says "Completed"
- Verify completion criteria
- May be ready for commit
- Check for follow-up work

## Output

Provide clear status:
```
Resumed from: handoffs/YYYY-MM-DD-HH-MM-topic.md

Current State:
- Tests: [passing/failing]
- Build: [passing/failing]

Next Actions:
1. [First concrete action]
2. [Second concrete action]

Ready to proceed.
```
