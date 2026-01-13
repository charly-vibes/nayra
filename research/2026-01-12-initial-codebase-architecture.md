---
date: 2026-01-12T21:45:00Z
topic: "Initial Codebase Architecture and Specifications"
status: complete
---

# Research: Initial Codebase Architecture and Specifications

**Date**: 2026-01-12

## Research Question

Document the current state of the nayra codebase, its project structure, development infrastructure, and architectural specifications as defined in the technical reference documentation.

## Summary

Nayra is a high-performance vanilla JavaScript timeline visualization tool in its initial setup phase. The project infrastructure is established with development workflow tooling, agent commands, and comprehensive architectural specifications, but implementation has not yet begun. The architecture is defined to achieve 60 FPS rendering of 10,000+ events using Canvas API, BigInt temporal coordinates for "Deep Time" support, and a hybrid rendering approach that combines Canvas for visualization with DOM for accessibility.

Current state:
- **Infrastructure**: Complete (justfile, AGENTS.md, agent commands)
- **Source Code**: Not yet implemented (empty src/ directory)
- **Specs**: No feature files yet (empty specs/ directory)
- **Tests**: Not yet implemented (empty test/ directory)
- **Documentation**: Technical architecture defined in reference document

## Detailed Findings

### Project Structure

The project follows a structured organization designed for Spec-Driven Development (SDD) and Test-Driven Development (TDD):

```
nayra/
├── .agents/commands/     # Agent workflow commands (6 commands defined)
├── .claude/              # Claude Code integration
├── specs/                # Gherkin .feature files (currently empty)
├── research/             # Research documents (this document)
├── plans/                # Implementation plans (currently empty)
├── handoffs/             # Session handoff documents (currently empty)
├── debates/              # Design debates and decisions (currently empty)
├── src/                  # Source code - NOT YET CREATED
├── test/                 # Test files - NOT YET CREATED
├── docs/                 # Documentation - NOT YET CREATED
├── justfile              # Unified local/CI workflow commands
├── AGENTS.md             # Development workflow and philosophy
├── README.md             # Project overview and quick start
└── Vanilla JS Data Visualization Backend Review.md  # Technical reference
```

### Development Infrastructure

#### Justfile Commands

The project uses `just` for unified command execution (local and CI). Available commands:

**Development**:
- `just dev` - Start HTTP server on port 8080 (Python SimpleHTTPServer)
- `just dev-live` - Start with browser-sync for live reload (if installed)

**Testing** (placeholders - not yet configured):
- `just test` - Run unit tests
- `just test-cover` - Run tests with coverage
- `just test-visual` - Visual regression tests
- `just test-perf` - Performance benchmarks
- `just test-all` - Run all test tiers

**Code Quality**:
- `just lint` - Run ESLint on src/ and test/
- `just lint-fix` - Auto-fix lint issues
- `just fmt` - Format with Prettier
- `just fmt-check` - Check formatting without changes

**Build**:
- `just build` - Build for production (not yet configured)
- `just build-release <version>` - Build with version info
- `just clean` - Remove dist/, coverage/, .nyc_output/

**CI**:
- `just ci` - Full CI pipeline (lint, test-all, build)
- `just pre-push` - Fast checks for git hooks (lint, test)

**Setup**:
- `just setup` - Install npm dependencies and tools
- `just setup-claude` - Symlink .agents/commands to .claude/commands

#### Agent Commands

Six workflow commands are defined in `.agents/commands/`:

1. **create_plan.md** - Create implementation plans
2. **implement_plan.md** - Execute approved plans following TDD
3. **research_codebase.md** - Document codebase as-is
4. **commit.md** - Create git commits with user approval
5. **create_handoff.md** - Create session handoff documents
6. **resume_handoff.md** - Resume from handoff documents

### Development Philosophy

From `AGENTS.md`:

1. **Framework-Free Performance**: Direct control over rendering pipeline, no React/Vue/Angular
2. **Tidy First**: Kent Beck's approach - small refactorings before feature work, separate commits
3. **Spec-Driven Development (SDD)**: Gherkin `.feature` files as living documentation
4. **Test-Driven Development (TDD)**: Red-Green-Refactor cycle

### Commit Standards

All commits must follow Conventional Commits specification:

| Type | Usage |
|------|-------|
| `feat:` | New user-facing feature |
| `fix:` | Bug fix |
| `refactor:` | Tidy First commits (structural improvements) |
| `test:` | Adding/updating tests |
| `docs:` | Documentation changes |
| `chore:` | Build, CI, tooling |
| `style:` | Formatting only |
| `perf:` | Performance improvements |

Rules:
- Tidyings always get separate `refactor:` commits
- One logical change per commit
- Imperative mood ("Add" not "Added")
- 72 character subject line limit
- No period at end of subject

### Performance Targets

Defined benchmarks that all implementations must meet:

| Metric | Target |
|--------|--------|
| Frame Rate | 60 FPS during pan/zoom |
| Data Capacity | 10,000+ events without degradation |
| Initial Render | < 100ms on modern hardware |
| Startup Time | < 500ms |
| Memory | Efficient handling of deep time (billions of years) |

### Browser Support Requirements

Target modern browsers with:
- Canvas API (2D rendering context)
- ES6+ modules and syntax
- BigInt primitive type
- IndexedDB for data persistence
- Service Workers (optional, for offline support)

Tested on:
- Chrome/Edge 90+
- Firefox 90+
- Safari 14+

## Architecture Documentation

### Rendering Architecture: The Hybrid "Sandwich" Pattern

From `Vanilla JS Data Visualization Backend Review.md`, the architecture uses a layered approach:

| Layer | Technology | Purpose | Rationale |
|-------|-----------|---------|-----------|
| **Foreground** | DOM/HTML | Tooltips, Dialogs, Search UI | High accessibility, native text selection, CSS styling |
| **Interaction** | Transparent Canvas | Mouse/Touch event capture | Decouples rendering from input; unified input handling |
| **Active Scene** | HTML5 Canvas | Event markers, spans, connections | High-performance rendering of thousands of dynamic objects |
| **Background** | Offscreen Canvas | Grid lines, static axis | Blitting static images faster than recalculating geometry |

#### Why Canvas over SVG/DOM?

**SVG/DOM Limitations (Retained Mode)**:
- Browser maintains internal scene graph for every element
- Memory overhead becomes prohibitive beyond 1,000-3,000 objects
- Layout reflows on every pan/zoom operation
- Performance degrades with 10,000+ elements (target capacity)
- Synchronous DOM manipulation causes "jank"

**Canvas Advantages (Immediate Mode)**:
- No internal object memory or scene graph
- GPU-friendly raster bitmap operations
- Can render 10,000-100,000 shapes at 60 FPS
- Drawing commands batched for minimal CPU-GPU overhead

**Trade-offs**:
Canvas requires manual implementation of:
1. Hit detection (mathematical intersection tests)
2. State management (JavaScript array mimicking scene graph)
3. Redraw logic (explicit clear and redraw on state changes)
4. Accessibility (shadow DOM or parallel accessible tree)

#### High-DPI Display Handling

Critical implementation detail for Canvas:
- Detect `window.devicePixelRatio` (e.g., 2.0 on Retina displays)
- Scale canvas buffer: `width = logicalWidth * dpr`
- Scale rendering context: `ctx.scale(dpr, dpr)`
- Maintain CSS dimensions at logical pixel size
- Failure results in blurry rendering on high-DPI displays

### Time Coordinate System: Deep Time Support

#### The Problem with JavaScript Date

Native `Date` object limitations:
- Range: ±100 million days from Unix Epoch (1970-01-01)
- Approximately: April 271,821 BC to September 275,760 AD
- Insufficient for geological/astronomical scales:
  - Earth formation: 4.5 billion years ago
  - Universe age: 13.8 billion years ago
  - Dinosaur extinction: 65 million years ago
- Does not handle calendar shifts (Julian vs Gregorian)
- No "Year Zero" in historical dating

#### BigInt Temporal Coordinates Solution

Implementation approach:
1. Define a "Zero Point" (e.g., present moment or Big Bang)
2. Represent all time as `BigInt` offset from zero in base unit (seconds)
3. Example: Age of universe ≈ 4.35 × 10^17 seconds (easily handled by BigInt)

**Time Service Requirements**:
- **Parsing**: Convert varied formats ("2000 BC", "1.5 BYA", ISO strings) to BigInt
- **Formatting**: BigInt → human-readable with BC/AD, Ma (million years), Ga (billion years)
- **Calendar Logic**: Handle year 0 absence, Julian/Gregorian conversion

Time unit constants:
```javascript
TIME_UNIT = {
    SECOND: 1n,
    YEAR: 31557600n,  // Approx seconds in a year
    BILLION_YEARS: 31557600000000000n
};
```

#### Floating-Point Precision and the "Jitter" Problem

**The Issue**:
- Canvas API uses floating-point coordinates
- IEEE 754 has variable precision (gaps increase with magnitude)
- Mapping 4,000,000,000 (4 billion years) directly to pixels causes precision loss
- Results in visual "jitter" as events snap to representable float values

**The Solution: Floating Origin (Local Coordinates)**:
1. Determine viewport window (BigInt start time)
2. Calculate relative offset: `delta = EventTime - ViewportStartTime`
3. Scale to pixels: `screenX = Number(delta) * zoomFactor`
4. Pass manageable number (-1000 to +4000) to Canvas API

This maintains sub-pixel precision regardless of absolute temporal position.

#### Infinite Zoom Mechanics

User expectation: Zoom centers on mouse cursor (Google Maps pattern)

State maintained:
- `zoomLevel`: Float (pixels per time unit)
- `offsetX`: Temporal offset of left screen edge

Zoom algorithm:
1. **Capture Anchor**: `T_mouse = (X_mouse / Zoom_old) + Offset_old`
2. **Apply Zoom**: `zoomLevel *= factor` (e.g., 1.1 or 0.9)
3. **Compensate Offset**: `Offset_new = T_mouse - (X_mouse / Zoom_new)`

Executed in `requestAnimationFrame` loop for smooth, inertial zooming.

### State Management: Observer Pattern

No framework, but structured architecture following Redux/Vuex patterns:

#### Central Store Pattern

**Store Structure**:
```javascript
class TimelineStore {
    state = {
        viewportStart: 0n,           // BigInt for Deep Time
        viewportEnd: 1000n,
        zoomLevel: 1.0,
        events: [],                   // Sorted array
        selectedEventIds: new Set(),
        hoveredEventId: null
    };
    listeners = new Set();
}
```

**Unidirectional Data Flow**:
1. Input handler dispatches Action
2. Action updates Store state
3. Store notifies Subscribers
4. Subscribers re-render (Canvas, HTML overlay, URL hash)

**Benefits**:
- Decouples input from rendering
- Maintains synchronization across UI components
- Avoids "spaghetti code"
- Treats state as immutable

#### Main Loop and Dirty Checking

**Render Loop**:
```javascript
let isDirty = false;
store.subscribe(() => { isDirty = true; });

function renderLoop() {
    if (isDirty) {
        drawScene(store.state);
        isDirty = false;
    }
    requestAnimationFrame(renderLoop);
}
```

**Purpose**:
- Idle at ~0% CPU when not interacting
- Battery-efficient on mobile devices
- Only redraw when state changes
- Avoids naive `setInterval` implementations

### Algorithmic Layout

#### 1D Bin Packing for Vertical Layout (Waterfall)

**Problem**: Overlapping time intervals need visual separation

**Solution**: Greedy Interval Coloring algorithm

**Algorithm**:
1. Sort events by start time (O(N log N))
2. Maintain list of "active lanes" (each tracks last event's end time)
3. For each event:
   - Find first lane where `Lane.EndTime < Event.StartTime`
   - If found, place event in that lane
   - If not found, create new lane
4. Result: "Waterfall" visual structure

**Complexity**: O(N log N) dominated by sort step

**Performance**: Should run in Web Worker for large datasets to avoid blocking main thread

#### Spatial Indexing for Label Collision

**Problem**: Checking every label against every other label is O(N²)

**Solution**: Spatial Hash (Grid)

**Implementation**:
- Divide screen into vertical buckets (e.g., 50px wide)
- Map each event to intersecting buckets
- On render, check only labels in same bucket
- Apply prioritization strategy (Level of Detail) for conflicts

**Complexity**: Near-linear O(N)

**Result**: Real-time label decluttering during zoom

#### Level of Detail (LOD) Strategies

Discrete zoom thresholds:

| View Level | Viewport Span | Rendering Strategy |
|-----------|---------------|-------------------|
| **Macro** | Centuries | High-priority events only, cluster markers ("50 events") |
| **Meso** | Decades | Medium-priority events, simplified labels |
| **Micro** | Days/Hours | All events, full detailed labels and duration bars |

Acts as "Render Cull" stage before layout algorithm processes data.

### Interaction Design

#### Hit Detection Strategies

**Geometric (Analytical) Hit Testing**:
- Maintain spatial index (Quadtree or Spatial Hash)
- On `mousemove`: Transform mouse coords to world coords, query index
- *Pros*: Precise, efficient hover states
- *Cons*: Complex math for irregular shapes

**Color Picking (GPU) Hit Testing**:
- Render "shadow scene" to off-screen canvas
- Each object drawn with unique color encoding its ID (#000001 = Event 1)
- On click: Sample pixel color at mouse position via `ctx.getImageData`
- Decode color to retrieve event ID
- *Pros*: Pixel-perfect, O(1) lookup
- *Cons*: `getImageData` is slow (CPU-GPU pipeline stall), not suitable for 60 FPS hover

**Recommended**: Geometric approach with 1D Spatial Hash for timeline (simple rectangle shapes)

#### Inertial Physics (Momentum Scrolling)

For native app feel:

**Implementation**:
1. **Track Velocity**: During drag, calculate `v = Δdistance / Δtime`
2. **Release**: On `mouseup`, if velocity > threshold, enter "Decay" state
3. **Animation Loop**: In `requestAnimationFrame`:
   - Apply velocity to viewport offset
   - Multiply velocity by friction coefficient (e.g., 0.95)
4. **Stop**: When velocity < epsilon, terminate loop

### Data Strategy: No Backend Required

#### Static Architecture

For read-heavy, infrequently-updated datasets:

**Approach**:
- Serialize data to static JSON files
- Host on CDN
- Client-side indexing (sorting, quadtree building)

**Compression**:
- 100,000 events: ~50-100MB raw JSON
- GZIP/Brotli: Reduce to 5-10MB (downloadable in seconds)

**Performance**:
- Modern JS engines iterate millions of objects in milliseconds
- Client-side search faster than network round-trip to backend

#### IndexedDB for Large Datasets

For datasets > 500MB or requiring persistence:

**Pattern**:
1. Check if data exists in IndexedDB on load
2. If not, fetch compressed data chunks from static host
3. Hydrate IndexedDB with data
4. Query using IndexedDB cursors/indices for visible viewport range only

**Benefits**:
- Browser acts as database server
- Gigabytes of structured data storage
- Asynchronous access
- No external SQL/NoSQL backend needed

#### External Knowledge Graphs (Wikidata/SPARQL)

For public historical data:

**Wikidata SPARQL Endpoint**:
- URL: `https://query.wikidata.org/sparql`
- Supports CORS (cross-origin requests from browser)
- Direct querying without proxy server

**Recommended Hybrid**:
- Use build script (CI/CD) to query Wikidata
- Generate static JSON file
- Deploy static file (reliability + data richness)

#### When IS a Backend Necessary?

Only required if:
1. **Real-time Collaboration**: Multiple users editing simultaneously
2. **Security**: Sensitive data that cannot be exposed to client
3. **Massive Scale**: Petabyte datasets where indices don't fit on client

For standard timeline visualization: Backend is unnecessary complexity

### Accessibility Implementation

#### The Problem

Canvas is opaque to screen readers (just a bitmap image).

#### The Solution: Parallel DOM

**Implementation**:
1. Create hidden `<ul>` list (using `clip` or `opacity`, not `display: none`)
2. Populate with `<button>` elements for each visible event
3. Provide full `aria-label`, `aria-description`, `tabindex` attributes

**Synchronization**:
- On render: Update list to match visible events
- On focus (Tab): Detect focused element, dispatch PAN action to center timeline
- On Enter: Trigger visual selection state on Canvas

**Keyboard Navigation**:
- Tab through events chronologically
- Auto-pan viewport to keep focused event visible
- Standard keyboard controls for blind users

**WCAG Compliance**: Ensures timeline is usable by assistive technology users

## Code References

Currently no source code exists. Expected structure based on README:

- `src/core/` - Core engine (Canvas, state, time)
- `src/rendering/` - Rendering pipeline
- `src/interaction/` - Input handling
- `src/utils/` - Utilities (BigInt time, spatial index)
- `test/` - Test files
- `specs/` - Gherkin feature specifications

Key files from technical review that should be implemented:

- `src/core/TimelineStore.js` - Central state management
- `src/core/TimeScale.js` - BigInt temporal coordinate system
- `src/rendering/Canvas*.js` - Canvas rendering layers
- `src/utils/SpatialHash.js` - Collision detection
- `src/layout/IntervalPacking.js` - Waterfall layout algorithm

## Related

- `Vanilla JS Data Visualization Backend Review.md` - Complete technical architecture reference
- `AGENTS.md` - Development workflow and philosophy
- `README.md` - Project overview and quick start
- `justfile` - Development commands

## Open Questions

Areas needing implementation decisions:

1. **Test Framework Selection**: Mocha, Jest, or Vitest? (Currently placeholder in justfile)
2. **Build System**: Which bundler for production? (Webpack, Rollup, esbuild, Vite?)
3. **Module System**: ES6 modules directly or with bundling?
4. **Web Worker Strategy**: Which computations move to workers? (Layout, data loading, SPARQL queries?)
5. **IndexedDB Library**: Use Dexie.js or raw IndexedDB API?
6. **Accessibility Testing**: Which tools for WCAG compliance verification?
7. **Performance Profiling**: Which tools for 60 FPS verification?
8. **First Feature**: Which component to implement first? (Recommended: Core rendering pipeline)

## Implementation Priority Recommendations

Based on architectural dependencies, suggested order:

1. **Foundation**:
   - TimeScale utility (BigInt coordinate system)
   - TimelineStore (state management)
   - Basic Canvas setup with DPI scaling

2. **Core Rendering**:
   - Canvas rendering loop with dirty checking
   - Viewport projection (floating origin)
   - Simple event rendering (rectangles)

3. **Interaction**:
   - Mouse/touch input handling
   - Pan and zoom with anchor point
   - Inertial physics

4. **Layout**:
   - Interval packing algorithm (waterfall)
   - Spatial hash for collision detection
   - LOD system

5. **Accessibility**:
   - Parallel DOM structure
   - Keyboard navigation
   - WCAG compliance

6. **Data**:
   - Static JSON loading
   - IndexedDB integration
   - Optional: SPARQL endpoint integration

## Technical Constraints

Must maintain throughout implementation:

1. **No Frameworks**: Pure vanilla JavaScript, no React/Vue/Angular
2. **60 FPS Target**: All interactions must maintain frame rate
3. **10,000+ Events**: Must handle without performance degradation
4. **BigInt Required**: For deep time support (no Date object for historical data)
5. **Canvas API**: Primary rendering technology (not SVG or pure DOM)
6. **Accessibility**: WCAG compliance mandatory, not optional
7. **Browser Support**: Chrome/Edge/Firefox/Safari 90+/14+
