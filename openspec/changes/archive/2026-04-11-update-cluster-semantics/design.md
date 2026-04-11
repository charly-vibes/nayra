## Context

Cluster behavior currently combines several concerns without a single shared definition:
- layout decides which events are grouped
- rendering decides where the marker appears
- hit detection decides what is clickable
- tooltip behavior is still event-centric
- navigation decides how far a cluster click zooms

That makes clustered markers difficult to reason about and causes mismatches between what the user sees and what the system considers part of the cluster.

## Goals

- Make a cluster mean exactly "the events represented by this marker at this zoom level"
- Use one shared cluster geometry for rendering, hit detection, tooltip content, and click navigation
- Make cluster counts trustworthy
- Make cluster expansion deterministic and visually intuitive

## Non-Goals

- Introducing animated cluster morphing in this change
- Changing the overall LOD strategy outside clustered-marker behavior
- Redesigning the general event detail panel

## Decision

### Cluster membership

Clusters will be defined from viewport-visible events after active filters are applied. For this change, "viewport-visible events" means events whose rendered geometry intersects the current viewport, regardless of whether macro label suppression would hide their labels.

Cluster construction must be deterministic:
1. project each viewport-visible event into screen space
2. derive a cluster envelope using a fixed base horizontal footprint
3. sweep left-to-right to partition events into non-overlapping cluster candidate groups
4. compute the final marker geometry for each candidate group
5. expose the final cluster geometry and represented-event set to rendering, hit detection, tooltip, and navigation

A cluster represents the events assigned to its final non-overlapping envelope. No event may belong to more than one cluster at a given scale.

Each cluster must expose a shared data shape sufficient for every downstream consumer:
- represented events
- represented count
- represented time span
- cluster center in time and screen coordinates
- cluster screen footprint
- cluster hit geometry

### Event participation rules

Point events participate in cluster membership using their projected point position.

Span events participate in cluster membership using their rendered screen geometry intersecting the cluster envelope. This prevents long duration events from being dropped merely because their start time falls outside the envelope while part of the rendered span is inside it.

### Tooltip semantics

Cluster tooltips will be distinct from event tooltips. They must display:
- the represented event count
- the represented time span
- the represented events in chronological order

If the represented set is long, the tooltip may truncate the list but must do so explicitly, for example with a `+N more` summary.

### Click-to-expand rule

Cluster clicks will no longer use ad hoc fit logic. Instead, the represented cluster time span will be expanded so that it fills 80% of the viewport width, and the viewport will center on the cluster midpoint.

Conceptually:
- `targetVisibleSpan = representedSpan / 0.8`
- `targetSpp = targetVisibleSpan / canvasWidth`
- `viewportCenter = cluster midpoint`

The represented range must occupy the central 80% of the viewport, leaving 10% padding on each side unless constrained by minimum-span or zoom-limit logic.

For degenerate or near-zero spans, the implementation must use a minimum represented span derived from the cluster's screen footprint so that clicking still causes a meaningful expansion.

The resulting expansion must still honor global zoom constraints. If clamping is required, the implementation must preserve the cluster midpoint at the viewport center.

## Tradeoffs

### Why footprint-based semantics

Using screen-space footprint aligns the data model with what the user can actually see and click. This is preferable to chaining nearby events with pairwise distance rules, which can create unstable membership and surprising cluster counts.

### Why current-viewport visible events

Cluster semantics should describe what the current marker represents on screen. Using the visible event set for the current viewport avoids hidden off-screen membership and prevents the tooltip count from diverging from the rendered cluster marker.

### Why 80% expansion

Expanding the represented range to 80% of the viewport keeps the grouped events readable while preserving enough surrounding context to orient the user after the click.

## Risks

- Recomputing cluster membership from viewport-visible events may increase per-frame work in dense timelines
- Tooltip payloads for large clusters may need bounded rendering to remain performant
- The 80% expansion rule must handle very large and very small spans without precision issues
- Deterministic partitioning must remain stable when nearby dense groups nearly overlap

## Mitigations

- Keep clustering screen-space based and bounded to viewport-visible events
- Cap tooltip list length while preserving exact count
- Cover degenerate spans and deep-time scales with targeted tests
- Use a left-to-right non-overlapping envelope sweep so adjacent dense groups partition consistently
