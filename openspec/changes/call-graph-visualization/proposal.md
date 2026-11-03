## Why

Code-graph mode can find a symbol and list its callers and callees, but the
relations are only text: users must read two flat lists and mentally rebuild the
call structure. A node-link diagram makes "who calls this, and what does it
call" visible at a glance, which is exactly the question a rename or refactor
starts with. The feature belongs in the existing result-row expansion, so no new
mode or extra step is needed.

## What Changes

- Expand a code-graph result row into a responsive, interactive node-link graph
  of the symbol's callers (left), the symbol itself (centre), and its callees
  (right), with directed edges.
- Keep the existing callers/callees lists as a "list" view; add a compact
  graph/list switch in the expanded section, defaulting to the graph.
- Nodes are real buttons: hovering or focusing one highlights its edges,
  activating it opens the symbol's source file at its line. Edges are
  `aria-hidden`, and the list view remains the textual alternative.
- Add localized copy, design-token styling, an empty state, and reuse the
  existing `/workspace-search/graph` host endpoint (no host or dependency
  changes).

## Capabilities

### New Capabilities

- `call-graph-visualization`: interactive caller/callee node-link diagram inside
  code-graph mode, its layout, interactions, and graph/list switch.

### Modified Capabilities

<!-- No published specification exists in this repository, so the feature ships
as a new capability. -->

## Impact

- `lib/client.js`: code-graph result rendering, one local component, styles,
  and dictionaries.
- `README.md`: usage copy and a panel screenshot.
- No `lib/index.js` changes, no new npm dependencies, no data-model changes.
- Reuses the existing two `/workspace-search/graph` calls per expansion.