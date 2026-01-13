# Project Context

## Purpose

Nayra is a high-performance vanilla JavaScript timeline visualization tool designed for exploring events across vast temporal scales—from nanoseconds to billions of years ("Deep Time"). The project aims to achieve 60 FPS rendering of 10,000+ events using Canvas API while maintaining WCAG 2.1 Level AA accessibility compliance.

**Key Goals**:
- Visualize events spanning geological, astronomical, and cosmological timescales
- Provide smooth, responsive interaction (pan, zoom, search) at 60 FPS
- Support datasets from hundreds to 100,000+ events
- Ensure full accessibility for screen reader and keyboard-only users
- Maintain zero framework dependencies (pure vanilla JavaScript)

## Tech Stack

### Core Technologies
- **Vanilla JavaScript** (ES6+) - No frameworks (React/Vue/Angular)
- **HTML5 Canvas API** - Primary rendering technology (2D context)
- **BigInt** - Temporal coordinate system for deep time support
- **IndexedDB** - Client-side data persistence for large datasets
- **Web Workers** - Offload heavy computation (layout, data processing)

### Development Tools
- **Just** - Unified command runner for local and CI workflows
- **ESLint** - JavaScript linting
- **Prettier** - Code formatting
- **Vitest** (recommended) - Test framework for TDD
- **Browser DevTools** - Performance profiling and debugging

### Build & Deployment
- **Bundler** - TBD (Webpack/Rollup/esbuild/Vite)
- **Compression** - GZIP/Brotli for static JSON data
- **CDN** - Static file hosting for event data
- **GitHub Pages** (or similar) - Static site deployment

### Browser Targets
- Chrome/Edge 90+
- Firefox 90+
- Safari 14+

## Project Conventions

### Code Style

**Language**: Pure vanilla JavaScript (ES6+)
- No TypeScript, no JSX
- ES6 modules (`import`/`export`)
- Modern syntax (arrow functions, destructuring, template literals)

**Formatting** (Prettier):
- 2-space indentation
- Single quotes for strings
- Semicolons required
- 80-character line length (flexible to 120 for readability)

**Naming Conventions**:
- **Classes**: PascalCase (e.g., `TimelineStore`, `TimeScale`)
- **Functions/Methods**: camelCase (e.g., `calculateViewport`, `renderEvents`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `TIME_UNIT`, `MAX_ZOOM_LEVEL`)
- **Private members**: Prefix with underscore (e.g., `_listeners`, `_spatialHash`)
- **Files**: PascalCase for classes (e.g., `TimelineStore.js`), kebab-case for utilities (e.g., `time-utils.js`)

**Comments**:
- Use JSDoc for public APIs
- Inline comments only where logic isn't self-evident
- No obvious comments (e.g., "// increment counter")
- Document "why" not "what"

**Forbidden**:
- No global variables (use modules and closures)
- No `var` (use `const` by default, `let` when reassignment needed)
- No jQuery or other utility libraries
- No polyfills (target modern browsers only)

### Architecture Patterns

**Rendering Architecture**: Hybrid "Sandwich" Layering
1. **Foreground** (DOM/HTML): Tooltips, dialogs, search UI
2. **Interaction** (Transparent Canvas): Mouse/touch event capture
3. **Active Scene** (HTML5 Canvas): Dynamic event rendering
4. **Background** (Offscreen Canvas): Static grid/axis (blitted)

**State Management**: Observer Pattern (Redux-like)
- Single `TimelineStore` as central source of truth
- Immutable state updates (create new state objects)
- Unidirectional data flow: Action → State → View
- Subscriber pattern for view updates
- Dirty flag to trigger re-renders only when needed

**Temporal Coordinates**: BigInt-based
- All times stored as `BigInt` offsets from a zero point (e.g., present or Big Bang)
- Floating origin technique to prevent precision loss when converting to Canvas floats
- `TimeScale` utility handles parsing/formatting across timescales

**Module Organization**:
```
src/
├── core/           # Store, TimeScale, Canvas setup
├── rendering/      # Rendering pipeline, layers
├── interaction/    # Input handling, hit detection
├── layout/         # Interval packing, spatial hash
├── data/           # Data loading, IndexedDB
├── accessibility/  # Parallel DOM, keyboard nav
└── utils/          # General utilities
```

**Key Patterns**:
- **Spatial Indexing**: Hash grid for O(1) hit detection
- **Level of Detail (LOD)**: Macro/Meso/Micro rendering strategies
- **1D Bin Packing**: Greedy interval coloring for lane assignment (O(N log N))
- **Dirty Checking**: Only redraw canvas when state changes
- **Web Workers**: Offload layout and data processing

### Testing Strategy

**Methodology**: Test-Driven Development (TDD)
- **Red**: Write tests from Gherkin scenarios (they fail)
- **Green**: Implement minimum code to pass tests
- **Refactor**: Clean up while keeping tests green

**Test Framework**: Vitest (recommended)

**Test Organization**:
```
test/
├── unit/           # Unit tests for modules
├── integration/    # Integration tests for features
├── accessibility/  # A11y tests (keyboard, screen reader)
├── performance/    # Performance benchmarks
└── e2e/            # End-to-end tests
```

**Coverage Requirements**:
- All 266 Gherkin scenarios from `specs/*.feature` must have corresponding tests
- Unit test coverage target: 80%+
- Critical paths (rendering, layout, state) must have 100% coverage

**Performance Testing**:
- Frame rate benchmarks (must maintain 60 FPS)
- Data capacity tests (10,000+ events)
- Initial render < 100ms, startup < 500ms
- Memory leak detection (extended use scenarios)

**Accessibility Testing**:
- Automated: axe-core, Lighthouse
- Manual: Keyboard-only navigation, screen readers (NVDA, JAWS, VoiceOver)

**Test Commands** (via `just`):
- `just test` - Run unit tests
- `just test-cover` - Run with coverage report
- `just test-visual` - Visual regression tests
- `just test-perf` - Performance benchmarks
- `just test-all` - Run all test tiers

### Git Workflow

**Branching Strategy**:
- `main` branch is always deployable
- Feature branches for new work (e.g., `feature/viewport-navigation`)
- No long-lived branches (merge frequently)

**Commit Conventions**: Conventional Commits specification

| Type | Usage | Example |
|------|-------|---------|
| `feat:` | New user-facing feature | `feat: add zoom with anchor point` |
| `fix:` | Bug fix | `fix: correct BigInt overflow in time parsing` |
| `refactor:` | Tidy First commits | `refactor: extract viewport calculation to utility` |
| `test:` | Adding/updating tests | `test: add scenarios for deep time coordinates` |
| `docs:` | Documentation changes | `docs: update README with usage examples` |
| `chore:` | Build, CI, tooling | `chore: configure Vitest for testing` |
| `style:` | Formatting only (no logic change) | `style: format with Prettier` |
| `perf:` | Performance improvements | `perf: optimize spatial hash construction` |

**Commit Rules**:
- One logical change per commit
- Imperative mood ("Add" not "Added" or "Adds")
- 72 character subject line limit
- No period at end of subject line
- Separate subject from body with blank line
- Body explains "why" not "what"
- **Tidy First commits**: Separate `refactor:` commits for structural improvements before feature work
- All commits include co-authorship: `Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>`

**Pre-commit Checks** (`just pre-push`):
- Linting must pass (`just lint`)
- Tests must pass (`just test`)
- Formatting must be clean (`just fmt-check`)

**Pull Request Process**:
1. Create feature branch from `main`
2. Implement feature following TDD (tests first)
3. Run `just ci` to verify all checks pass
4. Create PR with summary and test plan
5. Review and merge to `main`
6. Deploy from `main`

## Domain Context

### Timeline Visualization Concepts

**Event Types**:
- **Point events**: Instantaneous moments (zero duration)
- **Span events**: Events with duration (start and end times)
- **Clusters**: Aggregated groups of nearby events (at macro zoom)

**Temporal Scales**:
- **Micro**: Days/hours - show all events with full detail
- **Meso**: Decades - medium-priority events, simplified labels
- **Macro**: Centuries/millennia - high-priority only, cluster markers

**Deep Time**:
- Events spanning billions of years (geological, astronomical)
- Calendar systems: BC/AD (or BCE/CE), Julian/Gregorian
- "Year Zero" absence in historical calendars (1 BC → 1 AD)
- Geological notation: "Ma" (million years ago), "Ga" (billion years ago)

**Viewport Concepts**:
- **Pan**: Horizontal scrolling through time
- **Zoom**: Changing temporal scale (seconds per pixel)
- **Anchor point**: The temporal coordinate that remains stationary during zoom (Google Maps pattern)
- **Floating origin**: Calculating screen coordinates relative to viewport start to avoid float precision loss

**Layout Concepts**:
- **Lane**: Vertical position for events (lane 0 is closest to axis)
- **Waterfall layout**: Visual pattern where overlapping events cascade vertically
- **Greedy interval coloring**: Algorithm to assign lanes minimizing total lanes used
- **Spatial hash**: Grid-based indexing for fast hit detection

### Performance Context

**60 FPS Requirement**: Each frame must complete within 16.67ms
- **Layout**: O(N log N) acceptable (sort dominates)
- **Hit detection**: O(1) average (spatial hash)
- **Rendering**: O(visible events) - cull off-screen events

**Canvas vs SVG/DOM**:
- Canvas is "immediate mode" (no scene graph) - scales to 100,000+ shapes at 60 FPS
- SVG/DOM is "retained mode" (browser maintains scene graph) - degrades beyond 1,000-3,000 elements
- Trade-off: Canvas requires manual hit detection and accessibility

**Optimization Strategies**:
- Dirty checking: Only redraw when state changes
- Offscreen canvas: Pre-render static background, blit to main canvas
- LOD culling: Filter events before layout based on priority
- Viewport culling: Skip off-screen events during render
- Web Workers: Offload layout and data processing to background threads

### Accessibility Context

**WCAG 2.1 Level AA Compliance** (mandatory, not optional):

**Parallel DOM Strategy**:
- Canvas is opaque to screen readers (just a bitmap)
- Solution: Maintain hidden DOM structure (`<ul>` with `<button>` elements) for visible events
- Synchronize with canvas on every render
- Use `clip` or `opacity` to hide visually (not `display: none`)

**Contrast Requirements**:
- Text: 4.5:1 for normal text, 3:1 for large text (18pt+)
- UI components: 3:1 minimum
- Don't rely solely on color to convey information

**Keyboard Navigation**:
- Tab through events chronologically
- Auto-pan viewport to keep focused event visible
- Enter/Space to activate, Escape to close
- Arrow keys for pan, +/- for zoom

**Touch Accessibility**:
- Touch targets: 44x44px (AAA) or minimum 24x24px (AA)
- Adequate spacing to prevent accidental activation

**Motion**: Respect `prefers-reduced-motion` (disable animations)

## Important Constraints

### Technical Constraints

1. **No Frameworks**: Pure vanilla JavaScript only - no React, Vue, Angular, jQuery, etc.
2. **Canvas Primary**: Canvas API for rendering, not SVG or pure DOM (performance requirement)
3. **BigInt Required**: JavaScript `Date` object insufficient for deep time - must use BigInt
4. **Browser Support**: Chrome/Edge 90+, Firefox 90+, Safari 14+ (no polyfills for older browsers)
5. **Accessibility Mandatory**: WCAG 2.1 Level AA compliance is non-negotiable
6. **60 FPS Target**: All interactions must maintain frame rate with 10,000+ events
7. **No Backend**: Static architecture preferred - no server-side API (use static JSON + CDN)

### Performance Constraints

| Metric | Hard Requirement |
|--------|-----------------|
| Frame rate | ≥ 60 FPS during pan/zoom |
| Data capacity | ≥ 10,000 events without degradation |
| Initial render | < 100ms |
| Startup time | < 500ms (with cached data) |
| Memory | No leaks, linear scaling with event count |

### Development Constraints

1. **Spec-Driven Development**: All features must have Gherkin specs before implementation
2. **Test-Driven Development**: Tests must be written before implementation code
3. **Tidy First**: Refactorings get separate commits before feature work
4. **Conventional Commits**: All commits must follow the specification
5. **One Logical Change**: Each commit contains exactly one logical change

### Design Constraints

1. **Deep Time Support**: Must handle timescales from nanoseconds to 13.8 billion years (age of universe)
2. **Calendar Accuracy**: Must handle BC/AD, Julian/Gregorian calendar shifts, "Year Zero" absence
3. **Precision**: Must maintain sub-pixel precision at all zoom levels (floating origin technique)
4. **Visual Clarity**: Labels must be readable, events must be distinguishable, no clutter

### Out of Scope

These are explicitly **not** in scope:
- Event editing (read-only timeline)
- User accounts / authentication
- Real-time collaboration
- Server-side API / backend
- Native mobile apps (web-only)
- Advanced visualizations (charts, maps - timeline only)
- Export to PDF/PNG/SVG (basic JSON export only)

## External Dependencies

### Data Sources (Optional)

**Wikidata SPARQL Endpoint**:
- URL: `https://query.wikidata.org/sparql`
- Supports CORS (direct browser queries allowed)
- Use case: Fetch historical events for public timelines
- **Recommended**: Pre-generate static JSON in CI/CD rather than live queries

### Browser APIs (Required)

- **Canvas API** (2D rendering context)
- **BigInt** primitive type
- **ES6 Modules** (`import`/`export`)
- **IndexedDB** for client-side persistence
- **Web Workers** for background computation
- **requestAnimationFrame** for render loop
- **window.devicePixelRatio** for high-DPI displays

### External Services (Optional)

- **CDN**: For hosting static JSON data files
- **GitHub Pages** (or Netlify/Vercel): Static site hosting

### No External Libraries

The project intentionally has **zero runtime dependencies**:
- No UI frameworks
- No utility libraries (lodash, etc.)
- No charting libraries
- No date libraries

Development dependencies only:
- Test framework (Vitest)
- Linters (ESLint)
- Formatter (Prettier)
- Bundler (TBD)

## Reference Documents

- **Technical Architecture**: `Vanilla JS Data Visualization Backend Review.md`
- **Development Workflow**: `AGENTS.md`
- **Specifications**: `specs/*.feature` (11 files, 266 scenarios)
- **Implementation Plan**: `plans/2026-01-12-comprehensive-specifications-plan.md`
- **Research**: `research/2026-01-12-initial-codebase-architecture.md`
- **Quick Start**: `README.md`

## Current Status

**Phase**: Initial setup and specification complete
- ✅ Development infrastructure (justfile, AGENTS.md)
- ✅ Comprehensive Gherkin specifications (266 scenarios)
- ✅ Implementation roadmap (8 phases, 16 weeks)
- ⏳ Source code (not yet implemented - empty `src/` directory)
- ⏳ Tests (not yet implemented - empty `test/` directory)

**Next Steps**: Begin Phase 1 implementation (TimeScale, TimelineStore, Canvas setup) following TDD methodology.
