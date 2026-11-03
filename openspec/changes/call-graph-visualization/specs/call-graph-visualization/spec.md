## ADDED Requirements

### Requirement: Expanded code-graph results show a call graph

The code-graph result list SHALL render the callers and callees of an expanded
symbol as a directed node-link diagram, with the symbol itself at the centre,
its callers on the left, and its callees on the right. Each node SHALL show the
symbol's kind and name; each edge SHALL point from caller to callee. The diagram
SHALL use the existing graph endpoint data, with no extra requests per render.

#### Scenario: Symbol with callers and callees

- **WHEN** a user expands a code-graph result whose caller and callee fetches both succeed
- **THEN** the expanded section shows one centre node for the symbol, caller nodes on the left, callee nodes on the right, directed edges between them, and a count for each side

#### Scenario: Symbol without relations

- **WHEN** both the caller and callee responses are empty
- **THEN** the expanded section shows the centre node and an explicit "no callers or callees" message instead of an empty diagram

#### Scenario: Relations still loading

- **WHEN** one of the two relation requests has not settled yet
- **THEN** the expanded section shows the existing loading state and renders the diagram only after both requests settle

#### Scenario: Relation request fails

- **WHEN** either relation request fails
- **THEN** the expanded section shows an error message naming the failure and offers no partial, misleading graph

### Requirement: Graph and list views are switchable

The expanded section SHALL offer a graph/list switch, defaulting to the graph,
and SHALL keep the existing callers/callees lists available as the list view.
The selected view SHALL apply to every expanded symbol until the user changes it
again, including after the pane remounts.

#### Scenario: Switching to the list

- **WHEN** the user selects the list view on an expanded symbol
- **THEN** the caller and callee lists replace the diagram for that symbol and for other expanded symbols afterwards

#### Scenario: Switching back to the graph

- **WHEN** the user selects the graph view
- **THEN** the diagram replaces the lists again without re-fetching relations

### Requirement: Graph nodes are interactive and accessible

Every node SHALL be a keyboard-focusable button. Hovering or focusing a node
SHALL highlight the edges incident to it. Activating a node (click, Enter, or
Space) SHALL open that symbol's source file at its line through the existing
resource-opening path. The graph container SHALL carry an accessible label
naming the expanded symbol, and edge paths SHALL be hidden from assistive
technology.

#### Scenario: Activating a caller node

- **WHEN** the user activates a caller node with a pointer or keyboard
- **THEN** the panel opens that caller's file at the caller's start line

#### Scenario: Highlighting connections

- **WHEN** a node receives hover or keyboard focus
- **THEN** only the edges connected to that node are emphasised, and the emphasis clears when the pointer and focus leave

#### Scenario: Assistive technology

- **WHEN** a screen reader reads the expanded section
- **THEN** it announces the graph container's symbol name and the node buttons, and does not announce the decorative edge paths

### Requirement: The diagram follows the panel's design tokens

The diagram SHALL be built from plain DOM/SVG with the panel's existing design
tokens for colour, radius, and type, with no new runtime dependency. It SHALL
adapt to the pane width, remain usable in both light and dark themes, and
suppress transitions when the user asks for reduced motion.

#### Scenario: Narrow sidebar

- **WHEN** the right sidebar is narrower than the graph's natural layout
- **THEN** nodes truncate their text with an ellipsis while keeping the full name in the button's title and accessible label, and edges still connect the nodes

#### Scenario: Resizing the pane

- **WHEN** the sidebar is resized while a graph is open
- **THEN** the diagram re-lays out to the new width without re-fetching or losing the expanded state