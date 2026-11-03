## Context

Code-graph mode (`lib/client.js`) renders symbols in the right sidebar. The
chevron on a result row calls `toggleGraph`, which fetches callers and callees
from `POST /workspace-search/graph` and renders two text groups. The host
endpoint already caps each side (`limit: 20` from the client) and returns
`{name, qualifiedName, kind, path, filePath, startLine, endLine, signature}`
rows. The pane can be resized by dragging the sidebar, can shrink to roughly
280 px, and follows the GUI's light/dark design tokens. The client bundle is
plain React (`createElement`), no JSX, no build step, and no third-party
dependencies are used or desired.

Constraints:

- Keep the two existing host requests; do not add a graph-specific endpoint.
- Stay within one module (`lib/client.js`) and its existing state store.
- Node text must remain selectable/readable by assistive technology.
- The right sidebar is narrow; a natural 3-column layout is the only one that
  fits without horizontal scrolling.

## Goals / Non-Goals

**Goals:**

- Render a directed caller → symbol → callee diagram for an expanded symbol.
- Keep the existing lists as a switchable text alternative.
- Interactive nodes (hover/focus edge highlight, click/keyboard opens the file).
- Responsive width, design-token styling, empty/loading/error states.
- Zero new dependencies and no host changes.

**Non-Goals:**

- Multi-hop exploration (re-centring the graph on a node) or graph editing.
- Whole-project call graphs, panning/zooming, or layout algorithms.
- Changing the `codegraph` CLI contract or the graph endpoint.
- Animating node entry/exit.

## Decisions

### HTML nodes over an SVG edge overlay, measured with ResizeObserver

Alternatives:

- *Pure SVG with `<text>`*: compact, but SVG text cannot truncate with CSS
  ellipsis the way the rest of the panel does, and getting buttons/focus rings
  right duplicates the panel's button styles.
- *Third-party layout/graph library*: violates the no-dependency constraint and
  would dwarf the feature.
- *A flow list with CSS connectors*: cheap, but not a node-link diagram and hard
  to make edges follow wrapped rows.

Chosen: absolutely positioned HTML `<button>` nodes over a single `<svg>` that
draws cubic Bézier edges. The canvas width is measured with `ResizeObserver`
(pixel coordinates, no non-uniform `viewBox` scaling, so strokes and arrow
markers stay crisp). Node boxes have a fixed height and columns of width
`min(128, (W - 52) / 3)`, so labels ellipsize naturally. Nodes and edges share
computed pixel coordinates, which keeps the layout aligned after a resize.

### Layered left/centre/right layout, vertically distributed by count

Alternatives considered: a radial ego graph (unreadable at 20 neighbours in a
280 px pane), a horizontal tree (overflows), and top/bottom layers (wastes the
wide dimension and makes long labels overlap).

Chosen: callers stacked on the left, the symbol in the centre, callees stacked
on the right. Each side's nodes are distributed evenly over the canvas height
(`(i + 0.5) / n`), edges leave the caller's right edge and enter the centre's
left edge, then leave the centre's right edge and enter the callee's left edge.
With one caller and five callees (the common case) this reads as a clean fan.
Canvas height is `max(96, max(n) * 34 + 8)`; the pane scrolls for large sets.

### Node activation opens the file; hover/focus highlights edges

Alternatives: clicking a node re-centres the graph (useful but requires an
extra request, breadcrumb, and separate file action; out of scope), or clicking
selects the node (no obvious payoff).

Chosen: reuse the list view's file-opening behaviour, so both views behave the
same. `mouseenter`/`focus` set a local hover key; edges whose endpoints match
get a brand-coloured stroke, all other edges dim. This needs no store changes.

### Graph/list preference in the shared store, not per symbol

Alternatives: per-symbol view state (more state to reset on every search; the
user would have to re-pick the view for each row) or a URL/preference (overkill
for a pane).

Chosen: one `cgView` field on the module store, default `"graph"`. Switching
re-renders every expanded section from already-fetched data, so no refetch and
the choice survives pane remounts.

### Place the toggle in a small toolbar above the diagram

The expanded section already draws group headings. A two-button segmented
toolbar (graph/list) sits above the content, with `aria-pressed` on each button.
This avoids another row-level control and keeps the chevron semantics unchanged.

## Risks / Trade-offs

- **Tall diagrams for 20 callers and 20 callees** → canvas height grows to
  ~690 px and the results pane scrolls; acceptable for a sidebar, no capping
  needed because the host already caps each side at 20.
- **ResizeObserver feedback loop** → only update state when the measured width
  actually changes; one update per resize tick.
- **Arrow markers and CSS variables** → markers are defined once and their fill
  comes from a CSS class, with a separate class for the highlighted state;
  Chromium is the supported shell for the dsh web GUI.
- **Hover-only affordance** → node focus produces the same emphasis, and the
  button's `title`/`aria-label` carry the full symbol path, so keyboard users
  get the information without hover.
- **Graph is decorative for screen readers** → the container is labelled and
  nodes are buttons; edges are `aria-hidden`. The list view remains the complete
  textual representation.

## Migration Plan

No data or host changes. The feature ships in the client bundle; existing
sessions pick it up on the next page load. Rollback is reverting the client
commit; no cleanup needed.

## Open Questions

None. Multi-hop exploration and whole-project graphs are explicitly out of
scope and can be a follow-up change.