# Change: Update cluster semantics for stable grouping and expansion

## Why
Cluster markers currently behave inconsistently across zoom levels: events can appear to drop out of clusters, cluster counts do not reliably match the events represented by the marker, and clicking a cluster can zoom to an unintuitive range. This makes clustered views hard to trust and hard to explore.

## What Changes
- Define cluster membership in terms of the events represented by a cluster's on-screen footprint at the current scale
- Require cluster counts and cluster tooltip contents to match the exact represented event set
- Define cluster tooltip content for grouped markers, including count, time span, and contained events
- Define cluster click behavior to expand the represented time range to 80% of the visible viewport and center on the cluster
- Preserve surrounding temporal context by keeping 10% viewport padding on each side of the expanded represented range
- Require stable cluster-to-event transitions so events are not spuriously lost while zooming

## Impact
- Affected specs: `event-layout`, `user-interaction`, `viewport-navigation`
- Affected code: `src/layout/event-clustering.js`, `src/rendering/renderer.js`, `src/interaction/hit-detection.js`, `src/interaction/input.js`, `src/ui/tooltip.js`
