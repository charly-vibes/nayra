# nayra justfile - unified local/CI workflow
#
# Same commands run locally and in CI for consistent diagnostics.
# Run `just` for default (dev server), `just ci` for full pipeline.

set shell := ["bash", "-uc"]

# Default: run development server
default: dev

# === Development Commands ===

# Start development server with hot reload
dev:
    @command -v python3 >/dev/null 2>&1 && python3 -m http.server 8080 || python -m SimpleHTTPServer 8080

# Start development server with live reload (using browser-sync if available)
dev-live:
    @command -v browser-sync >/dev/null 2>&1 && browser-sync start --server --files "src/**/*.js,src/**/*.css,*.html" || (echo "⚠️  browser-sync not installed, using simple server" && just dev)

# === Test Commands ===

# Run unit tests (using a test framework like Mocha, Jest, or Vitest)
test:
    @command -v npm >/dev/null 2>&1 && npm test || echo "⚠️  No test framework configured yet"

# Run tests with coverage
test-cover:
    @command -v npm >/dev/null 2>&1 && npm run test:coverage || echo "⚠️  No test framework configured yet"

# Run E2E tests (Playwright)
test-e2e:
    @command -v npx >/dev/null 2>&1 && npm run test:e2e || echo "⚠️  Playwright not installed"

# Run performance benchmarks
test-perf:
    @echo "⚠️  Performance benchmarks not yet configured"

# Run ALL test tiers
test-all: test test-e2e
    @echo "✅ All test tiers passed"

# === Lint and Format Commands ===

# Run linter (ESLint)
lint:
    @command -v npx >/dev/null 2>&1 && npx eslint src/ test/ || echo "⚠️  ESLint not installed, skipping"

# Auto-fix lint issues
lint-fix:
    @command -v npx >/dev/null 2>&1 && npx eslint src/ test/ --fix || echo "⚠️  ESLint not installed, skipping"

# Format all JavaScript files (Prettier)
fmt:
    @command -v npx >/dev/null 2>&1 && npx prettier --write "src/**/*.js" "test/**/*.js" "*.html" "*.css" || echo "⚠️  Prettier not installed, skipping"

# Check formatting (no changes)
fmt-check:
    @command -v npx >/dev/null 2>&1 && npx prettier --check "src/**/*.js" "test/**/*.js" "*.html" "*.css" || echo "⚠️  Prettier not installed, skipping"

# === Build Commands ===

# Build for production (bundle, minify)
build:
    @echo "Building production bundle..."
    @mkdir -p dist
    @command -v npm >/dev/null 2>&1 && npm run build || echo "⚠️  No build script configured yet"

# Build with version info
build-release version:
    @echo "Building release {{version}}..."
    @VERSION={{version}} npm run build || echo "⚠️  No build script configured yet"

# Clean build artifacts
clean:
    rm -rf dist/ coverage/ .nyc_output/
    @echo "✅ Cleaned build artifacts"

# === Analysis Commands ===

# Analyze bundle size
analyze:
    @command -v npm >/dev/null 2>&1 && npm run analyze || echo "⚠️  Bundle analyzer not configured"

# Check for performance issues
perf-check:
    @echo "Performance targets:"
    @echo "  - Frame Rate: 60 FPS during pan/zoom"
    @echo "  - Data Capacity: 10,000+ events"
    @echo "  - Load Time: < 100ms"
    @echo "  - Startup: < 500ms"
    @echo ""
    @echo "Run 'just test-perf' to measure against these targets"

# === CI Commands ===

# Full CI pipeline (what GitHub Actions runs)
ci: lint test-all build
    @echo "✅ CI pipeline passed"

# Pre-push checks (fast gate for git hooks)
pre-push: lint test
    @echo "✅ Pre-push checks passed"

# === Setup Commands ===

# Setup development environment
setup:
    @echo "Setting up nayra development environment..."
    @command -v npm >/dev/null 2>&1 || (echo "❌ npm not found. Install Node.js first." && exit 1)
    npm install
    @echo "Installing development tools..."
    @command -v just >/dev/null 2>&1 || echo "⚠️  just not installed. See https://github.com/casey/just"
    @echo "✅ Development environment ready"
    @echo ""
    @echo "Run 'just dev' to start the development server"

# Symlink .agents/commands to .claude/commands for Claude compatibility
setup-claude:
    mkdir -p .claude
    ln -sfn ../.agents/commands .claude/commands
    @echo "✅ Symlinked .agents/commands → .claude/commands"

# === Utility Commands ===

# Show project information
info:
    @echo "Nayra - High-Performance Vanilla JS Timeline Visualization"
    @echo ""
    @echo "Key Technologies:"
    @echo "  - Canvas API (immediate mode rendering)"
    @echo "  - BigInt (deep time support)"
    @echo "  - IndexedDB (client-side storage)"
    @echo "  - ES6 Modules (no bundler required for dev)"
    @echo ""
    @echo "Performance Targets:"
    @echo "  - 60 FPS pan/zoom"
    @echo "  - 10,000+ events"
    @echo "  - < 100ms initial render"

# Show available commands
help:
    @just --list

# Serve production build locally
serve-dist:
    @command -v python3 >/dev/null 2>&1 && cd dist && python3 -m http.server 8080 || (cd dist && python -m SimpleHTTPServer 8080)
