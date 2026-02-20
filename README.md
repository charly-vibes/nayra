# nayra

**High-Performance Vanilla JavaScript Timeline Visualization**

Nayra is a framework-free timeline visualization tool designed to render interactive timelines spanning from microseconds to cosmological epochs, maintaining 60 FPS performance with 10,000+ data points.

## Key Features

- 🚀 **60 FPS Performance**: Canvas-based immediate mode rendering
- 🌌 **Deep Time Support**: BigInt temporal coordinates for billions of years
- 🎯 **Framework-Free**: Pure vanilla JavaScript, direct DOM/Canvas control
- 📊 **10,000+ Events**: Spatial indexing and efficient collision detection
- ♿ **Accessible**: Parallel DOM for screen readers (WCAG compliant)
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
http://localhost:5173/?example=earth-history
```

Available built-in examples:
- `space-exploration` (default) - Key milestones from Sputnik to JWST
- `earth-history` - Major geological and biological events across billions of years
- `ancient-civilizations` - Rise and fall of great civilizations
- `wikidata-wars` - Historical conflicts from Wikidata SPARQL queries

**Local Files**: Drag a JSON file onto the canvas (coming soon)

**File Picker**: Use the Examples tab in the help menu (coming soon)

### Interaction & Navigation

Nayra supports both mouse/keyboard and touch input for navigation:

#### Mouse & Keyboard
- **Pan**: Click and drag to move through time
- **Zoom**: Scroll to zoom in/out at cursor position
- **Select**: Click on event to select, Ctrl+click to multi-select
- **Jump to Today**: Press `Home` or `h`
- **Search**: Press `/`
- **Help Menu**: Press `?`

#### Touch Gestures
- **Pan**: Touch and drag to move through time
- **Pinch-to-Zoom**: Use two fingers to zoom in/out
- **Double-Tap**: Quickly tap twice to zoom in at that location
- **Tap**: Tap on event to select it
- **Long Press**: Press and hold for context actions (500ms threshold)
- **Momentum Scrolling**: Flick to pan with inertia

All touch gestures are implemented using the Pointer Events API for unified handling of mouse, touch, and pen input.

### Development Commands

```bash
just dev          # Start development server with hot reload
just test         # Run test suite
just lint         # Run linter (ESLint)
just fmt          # Format code (Prettier)
just build        # Build for production
just ci           # Run full CI pipeline
```

## Development Workflow

Nayra follows a rigorous Spec-Driven Development (SDD) and Test-Driven Development (TDD) methodology:

1. **Create Spec**: Write `.feature` files in `specs/` describing user-facing behavior
2. **Write Test**: Implement failing tests based on spec scenarios
3. **Implement**: Write minimal code to make tests pass
4. **Refactor**: Clean up while keeping tests green
5. **Verify**: Ensure 60 FPS performance and 10,000+ event capacity

See [AGENTS.md](AGENTS.md) for complete development guidelines.

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
└── docs/                  # Documentation
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

- [Vanilla JS Data Visualization Backend Review.md](Vanilla%20JS%20Data%20Visualization%20Backend%20Review.md) - Comprehensive technical analysis

Key topics covered:
- Canvas vs SVG vs DOM rendering trade-offs
- Deep Time mathematics and BigInt coordinate systems
- Floating-point precision and the "Jitter" problem
- Spatial indexing and collision detection algorithms
- Accessibility implementation with shadow DOM
- Client-side storage strategies (IndexedDB)

## Browser Support

Nayra targets modern browsers with:

- ✅ Canvas API (2D rendering context)
- ✅ ES6+ modules and syntax
- ✅ BigInt primitive type
- ✅ IndexedDB for data persistence
- ✅ Service Workers (optional, for offline support)

Tested on:
- Chrome/Edge 90+
- Firefox 90+
- Safari 14+

## Contributing

We follow strict development practices:

1. **Tidy First**: Refactor before adding features (separate commits)
2. **Test-Driven**: Write tests before implementation
3. **Conventional Commits**: Use `feat:`, `fix:`, `refactor:`, etc.
4. **Performance-Aware**: Always consider 60 FPS target
5. **No Frameworks**: Maintain vanilla JS architecture

See [AGENTS.md](AGENTS.md) for complete contribution guidelines.

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
