# Contributing to Nayra

Nayra is a high-performance vanilla JavaScript timeline visualization tool. This document covers how work is tracked, how specs are managed, and how to contribute code.

## Table of Contents

- [Tools Overview](#tools-overview)
- [Issue Tracking with Beads](#issue-tracking-with-beads)
- [Spec Management with OpenSpec](#spec-management-with-openspec)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Git Conventions](#git-conventions)

---

## Tools Overview

| Tool | Purpose | Command |
|------|---------|---------|
| **Beads** | Issue tracking (in-repo) | `bd` |
| **OpenSpec** | Spec-driven change proposals | `openspec` |
| **Just** | Task runner | `just` |

---

## Issue Tracking with Beads

This repo uses [Beads](https://github.com/steveyegge/beads) — a git-native issue tracker that lives in `.beads/` alongside the code. No external service required.

### Finding Work

```bash
bd ready                    # Issues ready to work (no blockers)
bd list --status=open       # All open issues
bd list --status=in_progress # Your active work
bd show <issue-id>          # Full details and dependencies
```

### Working on an Issue

```bash
bd update <id> --status=in_progress   # Claim it
# ... do the work ...
bd close <id>                         # Mark complete
bd close <id1> <id2> <id3>           # Close multiple at once
```

### Creating Issues

```bash
bd create --title="Fix viewport anchor on zoom" --type=bug --priority=2
```

Priorities: `0` = critical, `1` = high, `2` = medium, `3` = low, `4` = backlog.

### Dependencies

```bash
bd dep add <issue> <depends-on>   # issue blocks depends-on
bd blocked                        # Show all blocked issues
```

### Sync

Beads state lives on `main`. On ephemeral branches, pull updates before committing:

```bash
bd sync --from-main
```

---

## Spec Management with OpenSpec

All features and breaking changes must go through an OpenSpec proposal before implementation. Specs are the source of truth for what the system does.

```
openspec/
├── project.md          # Project context and conventions
├── specs/              # Current truth — what IS built
│   └── <capability>/
│       └── spec.md
└── changes/            # Proposals — what SHOULD change
    ├── <change-name>/
    │   ├── proposal.md
    │   ├── tasks.md
    │   ├── design.md   # (optional)
    │   └── specs/      # Delta changes per capability
    └── archive/        # Completed changes
```

### When to Create a Proposal

**Do create a proposal for:**
- New features or capabilities
- Breaking changes (API, schema, behavior)
- Architecture or pattern changes
- Performance work that changes observable behavior

**Skip the proposal for:**
- Bug fixes (restoring specified behavior)
- Typos, comments, formatting
- Tests for existing behavior

### Three-Stage Workflow

**Stage 1 — Propose:**
```bash
openspec list                   # Check active changes
openspec list --specs           # Check existing capabilities
# Scaffold: proposal.md, tasks.md, specs/<capability>/spec.md
openspec validate <change-id> --strict
```

**Stage 2 — Implement:**
Read `proposal.md`, `design.md` (if present), then `tasks.md`. Follow the checklist in order. Do not start until the proposal is approved.

**Stage 3 — Archive:**
```bash
openspec archive <change-id> --yes    # Move to archive/, update specs/
openspec validate --strict            # Confirm clean state
```

### Key Commands

```bash
openspec list                          # Active changes
openspec list --specs                  # Existing capabilities
openspec show <item>                   # View change or spec
openspec validate <change-id> --strict # Validate before submitting
openspec archive <change-id> --yes     # Archive after deployment
```

For full authoring guidance see [`openspec/AGENTS.md`](openspec/AGENTS.md).

---

## Development Workflow

### Setup

```bash
just setup          # Install dependencies
just setup-claude   # Symlink agent commands (if using Claude Code)
```

### Daily Commands

```bash
just dev            # Start dev server (http://localhost:8080)
just test           # Run unit tests
just lint           # Run ESLint
just fmt            # Format with Prettier
just ci             # Full pipeline (lint + test + build)
just pre-push       # Fast pre-push gate
```

### TDD Cycle

All implementation follows test-driven development:

1. **Read the spec** — `openspec/specs/<capability>/spec.md`
2. **Write a failing test** — derived from a `#### Scenario:` block
3. **Implement minimum code** to make it pass
4. **Refactor** — clean up, keep tests green

Coverage targets: 80%+ overall, 100% on critical paths (rendering, layout, state).

---

## Coding Standards

- **Language**: Vanilla JavaScript (ES6+). No TypeScript, no frameworks.
- **Formatting**: Prettier — 2-space indent, single quotes, semicolons, 80-char lines.
- **Naming**:
  - Classes: `PascalCase`
  - Functions/methods: `camelCase`
  - Constants: `SCREAMING_SNAKE_CASE`
  - Private members: `_underscore` prefix
  - Class files: `PascalCase.js`, utilities: `kebab-case.js`
- **No globals** — use ES6 modules and closures.
- **No `var`** — use `const` by default, `let` when needed.

---

## Git Conventions

### Commit Format

[Conventional Commits](https://www.conventionalcommits.org/) specification:

| Prefix | When |
|--------|------|
| `feat:` | New user-facing feature |
| `fix:` | Bug fix |
| `refactor:` | Structural improvement, no behavior change |
| `test:` | Adding or updating tests |
| `docs:` | Documentation only |
| `chore:` | Build, CI, tooling |
| `style:` | Formatting only |
| `perf:` | Performance improvement |

Rules:
- Imperative mood: "Add" not "Added"
- Subject ≤ 72 characters, no trailing period
- Blank line between subject and body
- Body explains *why*, not *what*
- Separate `refactor:` commits before feature work ("Tidy First")

### Branching

- `main` is always deployable
- Feature branches: `feature/<short-description>`
- Merge frequently — no long-lived branches

### Pull Request Process

1. Create a feature branch from `main`
2. Implement following TDD (tests before code)
3. `just ci` must pass before opening a PR
4. PR description includes summary and test plan
5. Merge to `main` after review
