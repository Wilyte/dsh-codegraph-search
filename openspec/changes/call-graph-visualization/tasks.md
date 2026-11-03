## 1. Plan

- [x] 1.1 Write the proposal, capability spec, and design for the change
- [x] 1.2 Validate the change with `openspec validate call-graph-visualization`

## 2. Implementation

- [x] 2.1 Add localized copy for the graph toolbar, empty state, and labels
- [x] 2.2 Add a measured ego-graph component (HTML nodes + SVG edges)
- [x] 2.3 Render the graph for expanded symbols, with graph/list toggle in the store
- [x] 2.4 Add design-token styles for nodes, edges, toolbar, and empty state

## 3. Self-test

- [x] 3.1 Syntax-check the client bundle (`node --check lib/client.js`)
- [x] 3.2 Run the panel in a dsh web server against an indexed workspace
- [x] 3.3 Verify graph layout for a symbol with callers and callees, empty and error states
- [x] 3.4 Verify node activation opens the file, hover/focus highlights edges, and keyboard operation
- [x] 3.5 Verify list/graph switching, narrow-pane truncation, and resize behaviour
- [x] 3.6 Capture before/after screenshots and record them for the PR

## 4. Documentation

- [x] 4.1 Document the graph view in the README and add the screenshot
- [x] 4.2 Mark tasks complete and re-validate the change