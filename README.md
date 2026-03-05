# nayra

> **nayra** (Aymara): *"eye," "sight," "past," "in front of"* — In the Aymara language, the past is in front of you because you can see it; the future is behind you because it is unknown. [Learn more →](docs/name.md)

**High-Performance Vanilla JavaScript Timeline Visualization**

Nayra is a framework-free timeline visualization tool designed to render interactive timelines spanning from microseconds to cosmological epochs, maintaining 60 FPS performance with 10,000+ data points.

## Key Features

- 🚀 **60 FPS Performance**: Canvas-based immediate mode rendering
- 🌌 **Deep Time Support**: BigInt temporal coordinates for billions of years
- 🎯 **Framework-Free**: Pure vanilla JavaScript, direct DOM/Canvas control
- 📊 **10,000+ Events**: Spatial indexing and efficient collision detection
- ♿ **Accessible**: Full keyboard navigation, WCAG 2.1 AA compliant focus indicators
- 💾 **No Backend Required**: Static data delivery with IndexedDB storage
- 🔍 **Infinite Zoom**: Smooth pan and zoom with floating-origin precision

## Architecture

Nayra implements a hybrid rendering architecture:

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **UI Controls** | DOM/HTML | Tooltips, dialogs, search (accessible) |
| **Interaction** | Transparent Canvas | Unified mouse/touch event capture |
| **Visualization** | HTML5 Canvas | High-performance event rendering |
| **Background** | Offscreen Canvas | Static grid lines and axis |

### Technical Highlights

- **Immediate Mode Graphics**: Canvas API for rendering 10,000+ objects at 60 FPS
- **BigInt Coordinates**: Handle temporal scales from microseconds to billions of years
- **Floating Origin**: Viewport-relative coordinates prevent floating-point precision loss
- **Spatial Hash**: O(N) collision detection for label decluttering
- **Observer Pattern**: Unidirectional data flow for state management
- **Greedy Interval Packing**: O(N log N) waterfall layout for overlapping events

## Getting Started

### Prerequisites

- Modern browser with Canvas API, ES6+, and BigInt support
- Node.js and npm (for development tools)
- `just` command runner (optional but recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/charly/nayra.git
cd nayra

# Setup development environment
just setup

# Start development server
just dev
```

### Loading Data

Nayra supports multiple ways to load timeline data:

**URL Parameter** (default method):
```
http://localhost:8080/?example=earth-history
```

Available built-in examples:
- `space-exploration` (default) - Key milestones from Sputnik to JWST
- `earth-history` - Major geological and biological events across billions of years
- `ancient-civilizations` - Rise and fall of great civilizations
- `wikidata-wars` - Historical conflicts from Wikidata SPARQL queries
- `multilane-demo` - Project timeline demonstrating overlapping tasks in multiple lanes

**Local Files**: Drag a JSON or JSON-LD file directly onto the timeline canvas to load it.

**File Picker**: Use the **Load from file...** button in the **Examples** tab of the help menu (`?`).

### Interaction & Navigation

Nayra supports both mouse/keyboard and touch input for navigation:

#### Mouse & Keyboard
- **Pan**: Click and drag to move through time
- **Zoom**: Scroll to zoom in/out at cursor position
- **Select**: Click on event to select, Ctrl+click to multi-select
- **Jump to Today**: Press `h`
- **Search**: Press `/`
- **Help Menu**: Press `?`

#### Zoom Controls
- **Zoom In**: Press `+` or `=`
- **Zoom Out**: Press `-`
- **Fit to Content**: Press `0` to show all events
- **Reset Zoom**: Press `1` to reset to default zoom level

#### Keyboard Navigation (Accessibility)
- **Tab / Shift+Tab**: Navigate forward/backward through events chronologically
- **Home / End**: Jump to first/last event in timeline
- **Enter / Space**: Activate (select) the focused event
- **Automatic viewport panning**: Keeps focused events visible during navigation

#### Touch Gestures
- **Pan**: Touch and drag to move through time
- **Pinch-to-Zoom**: Use two fingers to zoom in/out
- **Double-Tap**: Quickly tap twice to zoom in at that location
- **Tap**: Tap on event to select it
- **Long Press**: Press and hold for context actions (500ms threshold)
- **Momentum Scrolling**: Flick to pan with inertia

All touch gestures are implemented using the Pointer Events API for unified handling of mouse, touch, and pen input.

### Development Commands

Run `just` (default) for a development server, or `just ci` for the full test/build pipeline.

```bash
just dev          # Start development server
just ci           # Run full CI pipeline (lint + test + build)
```

Detailed development commands are in [CONTRIBUTING.md](CONTRIBUTING.md).

## Development Workflow

Nayra follows a rigorous Spec-Driven Development (SDD) and Test-Driven Development (TDD) methodology. See [CONTRIBUTING.md](CONTRIBUTING.md) for the complete development lifecycle, coding standards, and git conventions.

## Data Format

Nayra accepts event data as JSON. See the [full data schema spec](openspec/specs/data-schema/spec.md) for complete details.

### Event Structure

```json
{
  "id": "apollo-11",
  "start": "1969-07-16",
  "end": "1969-07-24",
  "label": "Apollo 11 Mission",
  "description": "First crewed Moon landing",
  "category": "space",
  "tags": ["nasa", "moon"],
  "priority": 0
}
```

**Required:** `id`, `start`, `label`  
**Optional:** `end`, `description`, `category`, `tags`, `priority` (0-4), `precision`, `url`, `source`, `metadata`

### Time Formats

| Format | Example | Use Case |
|--------|---------|----------|
| ISO 8601 | `2024-03-15` | Modern dates |
| Year | `1969`, `-44` | Historical (negative = BCE) |
| BCE/CE | `44 BCE`, `1066 CE` | Human-readable ancient dates |
| Geological | `65 Ma`, `4.5 Ga` | Million/billion years ago |

### Dataset Structure

**Simple (array):**
```json
[
  { "id": "1", "start": "1969-07-20", "label": "Moon Landing" }
]
```

**Extended (with metadata):**
```json
{
  "name": "Space Exploration",
  "events": [
    { "id": "1", "start": "1969-07-20", "label": "Moon Landing" }
  ]
}
```

### Wikidata Integration

Transform SPARQL query results using the built-in Wikidata transformer:

```javascript
import { transformWikidataResults } from './src/data/wikidata-transformer.js';

const events = transformWikidataResults(sparqlResults);
```

See `examples/` for sample data files and SPARQL queries.

## Project Structure

```
nayra/
├── src/                    # Source code (ES6 modules)
│   ├── core/              # Core engine (Canvas, state, time)
│   ├── data/              # Data loading, validation, transformation
│   ├── rendering/         # Rendering pipeline
│   ├── interaction/       # Input handling
│   ├── ui/                # UI components (search, help menu)
│   └── utils/             # Utilities (BigInt time, spatial index)
├── examples/              # Built-in example datasets (JSON)
├── test/                  # Test files
├── specs/                 # Gherkin feature specifications
├── research/              # Research documents (YYYY-MM-DD-topic.md)
├── plans/                 # Implementation plans
├── handoffs/              # Session handoff documents
├── debates/               # Design debates and decisions
├── .agents/commands/      # Agent workflow commands
└── docs/                  # [Documentation Index](docs/README.md)
```

## Performance Targets

Nayra is designed to meet these benchmarks:

- **Frame Rate**: 60 FPS during pan/zoom operations
- **Data Capacity**: 10,000+ events without performance degradation
- **Initial Render**: < 100ms on modern hardware
- **Startup Time**: Application ready in < 500ms
- **Memory**: Efficient handling of deep time (billions of years)

## Technical Reference

For deep technical analysis of the architecture and implementation strategies, see:

- [Architecture Review](docs/architecture.md) - Comprehensive technical analysis

Key topics covered:
- Canvas vs SVG vs DOM rendering trade-offs
- Deep Time mathematics and BigInt coordinate systems
- Floating-point precision and the "Jitter" problem
- Spatial indexing and collision detection algorithms
- Accessibility implementation with shadow DOM
- Client-side storage strategies (IndexedDB)

## Browser Support

| Browser | Minimum Version | Status |
|---------|----------------|--------|
| Chrome | 90+ | ✅ Fully supported |
| Edge | 90+ | ✅ Fully supported |
| Firefox | 90+ | ✅ Fully supported |
| Safari | 14+ | ✅ Fully supported |

### Required APIs

| API | Chrome 90 | Firefox 90 | Safari 14 | Purpose |
|-----|-----------|------------|-----------|---------|
| Canvas 2D | ✅ | ✅ | ✅ | Timeline rendering |
| BigInt | ✅ | ✅ | ✅ | Deep time coordinates |
| IndexedDB | ✅ | ✅ | ✅ | Data persistence |
| ResizeObserver | ✅ | ✅ | ✅ | Responsive canvas |
| Web Workers | ✅ | ✅ | ✅ | Layout offloading |
| requestAnimationFrame | ✅ | ✅ | ✅ | Render loop |
| Pointer Events | ✅ | ✅ | ✅ | Unified input |
| ES6 Modules | ✅ | ✅ | ✅ | Module loading |

Nayra detects required APIs at startup and shows a friendly error if any are missing.
See [`src/utils/feature-detection.js`](src/utils/feature-detection.js) and [`src/ui/browser-error.js`](src/ui/browser-error.js).

For detailed compatibility notes and known issues, see [docs/browser-support.md](docs/browser-support.md).

## Contributing

Contributions are welcome! We follow strict development practices (No Frameworks, TDD, Tidy First).

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for full details on:
- **Issue Tracking**: How we use [Beads](https://github.com/steveyegge/beads).
- **Spec Management**: How we use [OpenSpec](openspec/project.md).
- **Coding Standards**: Conventions for vanilla JavaScript development.
- **Git Protocol**: Commit message formats and branching strategy.

## Available Commands

Claude Code slash commands for development workflow:

- `/create_plan` - Create implementation plans → `plans/`
- `/implement_plan` - Execute approved plans (TDD)
- `/research_codebase` - Document codebase as-is → `research/`
- `/commit` - Create git commits with approval
- `/create_handoff` - Create session handoff → `handoffs/`
- `/resume_handoff` - Resume from handoff document

## License

[Add your license here]

## Acknowledgments

Built on the architectural principles outlined in our technical review document, following industry best practices for high-performance Canvas rendering and vanilla JavaScript development.

---

**Note**: This project deliberately avoids JavaScript frameworks (React, Vue, Angular) to maintain direct control over the rendering pipeline and achieve optimal performance for data-dense visualizations.
