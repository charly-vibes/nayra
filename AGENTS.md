<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# AGENTS.md - Nayra Development Workflow

This document outlines the development philosophy and process for building `nayra`. It is designed to ensure high-quality, maintainable code through a structured, test-driven methodology.

## Project Structure

```
nayra/
├── specs/           # Gherkin .feature files (living documentation)
├── research/        # Research documents (YYYY-MM-DD-topic.md)
├── plans/           # Implementation plans (YYYY-MM-DD-description.md)
├── handoffs/        # Session handoff documents for context transfer
├── debates/         # Design debates and decision records
├── openspec/        # OpenSpec specs and change proposals
├── .beads/          # Beads issue database (git-tracked)
├── .agents/commands/  # Agent workflow commands
├── .claude/commands/  # Claude Code slash commands (symlinked)
├── src/             # Source code (vanilla JS modules)
├── test/            # Test files
└── docs/            # Documentation
```

## Running Locally

Use `just` commands to build and test nayra during development:

```bash
# Run development server with hot reload
just dev

# Run tests
just test

# Run linter and formatter
just lint
just fmt

# Build for production
just build
```

## Available Commands

Commands are available as slash commands in Claude Code:

- `/create_plan` - Create implementation plans → outputs to `plans/`
- `/implement_plan` - Execute approved plans following TDD
- `/research_codebase` - Document codebase as-is → outputs to `research/`
- `/commit` - Create git commits with user approval
- `/create_handoff` - Create handoff document → outputs to `handoffs/`
- `/resume_handoff` - Resume work from a handoff document

## Core Philosophy

1.  **Framework-Free Performance**: `nayra` is a high-performance vanilla JavaScript timeline visualization tool. We avoid frameworks to maintain direct control over the rendering pipeline, achieving 60 FPS rendering of tens of thousands of data points. The architecture prioritizes Canvas API performance, precise mathematical control, and minimal abstraction overhead.

2.  **Tidy First**: We follow Kent Beck's "Tidy First?" approach rigorously:
    - **Before adding new code**, look for small structural improvements (tidyings)
    - Tidyings are tiny, safe refactorings: rename, extract, inline, reorder
    - Each tidying is a separate commit (prefixed with `refactor:`)
    - Tidyings make the subsequent behavior change easier to write and review
    - If you can't tidy first, note it and proceed—but prefer tidying
    - A clean workspace is a productive workspace

3.  **Spec-Driven Development (SDD)**: All new functionality begins with a specification. We use Gherkin (`.feature` files) to describe how a feature should behave from the user's perspective. These specs are human-readable, serve as living documentation, and form the foundation of our test suite. For larger changes, use OpenSpec (`openspec/`) to create formal change proposals.

4.  **Beads for Execution**: Use Beads (`bd`) as persistent agent memory and issue tracking. Plan with OpenSpec, execute with Beads. At session start, run `bd quickstart` to understand current work. File issues for discovered work with `bd create`. Query ready work with `bd ready --json`.

5.  **Test-Driven Development (TDD)**: The specs are implemented as automated tests *before* the feature code is written. The development cycle is "Red, Green, Refactor":
    *   **Red**: Write a failing test that implements a single scenario from the spec.
    *   **Green**: Write the simplest possible production code to make the test pass.
    *   **Refactor**: Clean up the production and test code while keeping the test green.

## Technical Principles

Based on our architectural analysis (see `Vanilla JS Data Visualization Backend Review.md`):

1. **Hybrid Rendering**: Use Canvas for high-performance visualization, DOM for UI controls and accessibility
2. **Deep Time Support**: Use BigInt for temporal coordinates spanning billions of years
3. **Floating Origin**: Maintain precision by using viewport-relative coordinates
4. **Spatial Indexing**: Implement efficient collision detection for thousands of events
5. **Immediate Mode Graphics**: Canvas-based rendering with manual state management
6. **No Backend Required**: Static data delivery with IndexedDB for client-side storage
7. **Accessibility First**: Maintain parallel DOM for screen readers

## Agent/Developer Workflow

All contributions to `nayra` must follow this process:

### Session Startup

At the start of each session, run `bd quickstart` to understand current work context and priorities.

### Planning with OpenSpec + Beads

1. **Plan with OpenSpec** → Create `proposal.md`, `tasks.md`, spec deltas for large features
2. **Import into Beads** → Ask: *"File Beads epics and issues for all work in this proposal, with dependencies"*
3. **Execute with Beads** → Query `bd ready --json` to find unblocked work
4. **Archive with OpenSpec** → After deployment, archive the change and update specs

### Implementation Cycle (TDD)

1.  **Create/Update a Spec File**: In the `specs/` directory, create or modify a `.feature` file that describes the desired functionality. Use clear, user-centric Gherkin syntax.
    *   *Example*: `specs/01_canvas_rendering.feature`

2.  **Implement the Failing Test**: Write the test code that executes the scenario defined in the spec. Run the test suite and confirm that it fails for the expected reason.

3.  **Write Production Code**: Implement the feature, focusing only on what is necessary to make the failing test pass.

4.  **Run Tests**: Run the test suite again and confirm that all tests now pass.

5.  **Refactor**: With passing tests as a safety net, refactor the code for clarity, efficiency, and adherence to style guidelines. Re-run tests to ensure nothing was broken.

6.  **Repeat**: Continue this cycle for all scenarios in the spec file. Once all scenarios for a feature are implemented, the feature is considered complete.

### Beads During Development

- **File discovered work**: When you find bugs or TODOs during implementation, run `bd create "title" -d "description"` to track them. **Always include a description** (`-d`) explaining the context and acceptance criteria.
- **Update issues**: Use `bd update <id>` with flags (not `bd edit` which opens an editor). Examples:
  - `bd update nayra-abc123 -d "new description"` - update description
  - `bd update nayra-abc123 --title "new title"` - update title
  - `bd update nayra-abc123 -s in_progress` - change status
  - `bd update nayra-abc123 -p P1` - change priority
- **Link dependencies**: Use `bd link` to connect related issues
- **Update status**: Use `bd close` when work is complete

This structured approach ensures that `nayra` is built on a solid foundation of clear specifications and comprehensive tests, making it robust and easy to maintain.

## Commit Workflow

**NEVER commit without explicit user approval.** Before running any `git add` or `git commit`:

1. Run `git status` and `git diff` to understand all changes
2. Present a clear commit plan to the user:
   ```
   I plan to create [N] commit(s):

   Commit 1: [type]: [message]
   - file1.js
   - file2.js

   Shall I proceed?
   ```
3. Wait for user confirmation before executing
4. Use `git add` with specific files (avoid `-A` or `.`)

See `.agents/commands/commit.md` for the full commit process.

## Conventional Commits

All commits MUST follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

| Type | Description |
|------|-------------|
| `feat:` | New feature for the user |
| `fix:` | Bug fix |
| `refactor:` | Code restructuring (Tidy First commits) |
| `test:` | Adding or updating tests |
| `docs:` | Documentation changes |
| `chore:` | Build, CI, tooling changes |
| `style:` | Formatting, whitespace (no code change) |
| `perf:` | Performance improvements |

### Examples

```bash
# Tidy First refactoring (always separate commits)
refactor: extract TimeScale into dedicated module
refactor: rename ViewPort to Viewport for consistency

# Feature implementation
feat(canvas): add hybrid Canvas-DOM rendering architecture
feat(time): implement BigInt temporal coordinate system

# Bug fixes
fix(zoom): handle floating-point precision in deep time

# Performance
perf(render): implement spatial hash for collision detection

# Tests
test(canvas): add scenarios for 60 FPS rendering

# Documentation
docs: add Canvas architecture reference to README
```

### Rules

1. **Tidyings get `refactor:` prefix** - Always separate from feature commits
2. **One logical change per commit** - Atomic, focused commits
3. **Imperative mood** - "Add feature" not "Added feature"
4. **No period at end** of subject line
5. **72 character limit** on subject line

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Use `bd create` to track anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Use `bd close` for finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

## Performance Targets

Nayra must meet these performance benchmarks:

- **Frame Rate**: Maintain 60 FPS during pan/zoom operations
- **Data Capacity**: Render 10,000+ events without degradation
- **Load Time**: Initial render < 100ms on modern hardware
- **Memory**: Efficient memory usage for deep time (billions of years)
- **Startup**: Application ready in < 500ms

## Browser Support

Target modern browsers with:
- Canvas API support
- ES6+ module support
- BigInt support (for deep time)
- IndexedDB support (for data persistence)
- Service Worker support (optional, for offline)
