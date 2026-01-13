---
description: Implement approved plans following TDD methodology
---

# Implement Plan

Execute an approved implementation plan following nayra's Test-Driven Development methodology.

## Prerequisites

1. An approved plan must exist in `plans/`
2. User has confirmed to proceed with implementation

## Process

### Step 1: Load the Plan

1. Read the plan file completely
2. Understand all phases and success criteria
3. Create a todo list with all phases

### Step 2: TDD Cycle for Each Phase

For each phase in the plan:

#### Red (Write Failing Test)

1. Write test that implements the spec scenario
2. Run `just test` - confirm it fails for the expected reason
3. Document the failure

#### Green (Make it Pass)

1. Write the simplest production code to pass the test
2. Focus only on making the test green
3. Resist the urge to add extra features
4. Run `just test` - confirm it passes

#### Refactor (Clean Up)

1. Improve code quality while keeping tests green
2. Consider performance implications (60 FPS target)
3. Optimize Canvas rendering if needed
4. Run `just test` after each refactoring
5. Run `just lint` to ensure code quality

### Step 3: Verify Success Criteria

After completing a phase:

#### Automated Checks:
- [ ] `just test` passes
- [ ] `just lint` passes
- [ ] Performance benchmarks met (if applicable)

#### Manual Checks:
- [ ] Visual verification in browser
- [ ] Test with 1,000+ events (if rendering feature)
- [ ] Check frame rate during pan/zoom
- [ ] Verify in browser developer tools

### Step 4: Mark Phase Complete

1. Update todo list
2. Note any discoveries or deviations from plan
3. Move to next phase

### Step 5: Final Verification

After all phases complete:

1. Run full test suite: `just test-all`
2. Build production version: `just build`
3. Manual testing checklist:
   - [ ] Canvas renders correctly
   - [ ] Smooth pan/zoom
   - [ ] Events display properly
   - [ ] Time coordinates accurate
   - [ ] No console errors
4. Prepare commit (but don't execute without approval)

## Guidelines

1. **Follow TDD strictly**: Test first, then implementation
2. **Keep tests green**: Never move forward with failing tests
3. **Atomic commits**: Separate refactoring from features
4. **Performance awareness**: Profile Canvas rendering, check frame rates
5. **Browser testing**: Test in target browsers
6. **Document surprises**: Note anything that differs from plan

## Common Patterns

### Canvas Rendering
- Use `requestAnimationFrame` for rendering loop
- Implement dirty checking to avoid unnecessary redraws
- Clear and redraw only when state changes

### State Management
- Use Observer pattern for state updates
- Maintain unidirectional data flow
- Keep state immutable

### Performance
- Spatial indexing for collision detection
- Viewport culling for large datasets
- Batch Canvas operations
- Profile with browser DevTools

## When to Stop

Stop and consult if you encounter:
- Fundamental architectural issues
- Performance problems that can't be solved with current approach
- Browser compatibility issues
- Scope creep beyond the approved plan
