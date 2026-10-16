# dsh-codegraph-search

[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin)

A Search tab for the DeepSeek Harness (dsh) web GUI's **built-in right sidebar** —
no `dsh-better-sidebar` required. One panel, two modes:

- **Keyword** — search file **names** and **contents** in the current session's
  workspace, grouped per file with line numbers.
- **Code graph** — query symbols by name / qualified name and expand their
  callers and callees.

Clicking a hit opens the file in the built-in text preview, jumping to the line.

## Modes

**Keyword**

- File names and content lines; per-file groups with match counts, collapsible.
- **Progressive results**: the host streams each file group over NDJSON the
  moment it is found (`POST /workspace-search/search` with `stream: true`), so
  hits appear while the walk is still running and the status line counts up
  live. Rendering is throttled — the first rows show immediately, then the list
  is updated at most once per 250 ms — so a fast walk never re-renders per file,
  and the final list is sorted exactly like the buffered response. Code-graph
  queries stay a single buffered response.
- Matched text is highlighted: the query inside file names, matched lines, and
  code-graph symbol names / signatures, using the same matching rules the search
  itself used (literal case folding, or the regex and `Aa` state).
- VS Code-style filters: **files to include / files to exclude** (comma-separated
  globs, supports `**`, `*`, `?`, `{a,b}`), `Aa` case toggle, `.*` regex toggle.
- Type filter: quick extension chips (`.ts .tsx .js .py .json .md`) plus a
  free-form extension field.
- Skips hidden files/dirs, `.git`, `node_modules`, `.hg`, `.svn`, `dist`,
  `build`, `.next`, `target`, symlinks, binary files, and files over 1 MiB.

**Code graph**

- Needs the `codegraph` CLI on the server and a `codegraph init`-ed workspace
  (the index lives in `.codegraph/`).
- Symbol results show kind, signature and location; each row lazily expands
  callers / callees. Missing CLI, missing index, timeout and parse failures are
  reported with their own message and a copyable fix command.

## Usage

- The panel scopes to the **current session's workspace** automatically.
- `Enter` searches; results also refresh ~250 ms after a filter or mode change.
- `Esc` clears the query.
- Switching tabs no longer re-runs the search: results, scroll position and
  expansion state are preserved.

## Requirements

- dsh web (the built-in right sidebar, `@deepseek-ai/dsh-client-ui-sidebar-right`)
- Node.js >= 22
- `codegraph` CLI — only for the code graph mode

## Install

```sh
dsh plugin --profile web add dsh-codegraph-search
```

Or, from a local checkout:

```sh
dsh plugin --profile web add /path/to/dsh-codegraph-search
```

The profile installs it as a local `link:` dependency. No extra sidebar plugin
is needed; the tab registers directly with dsh's built-in right sidebar, and the
sidebar's guide page shows a "Code search" entry.

## Configuration

All fields optional (profile patch layer, `id: code-search`):

```yaml
- id: code-search
  config:
    maxFiles: 5000          # hard cap on files scanned per search
    maxMatches: 300         # hard cap on total content matches
    maxLineLength: 300      # hard cap on one reported line
    maxFileBytes: 1048576   # files above this skip the content scan
    codegraphBin: codegraph # CLI used by the code graph mode
    codegraphTimeoutMs: 15000
    codegraphMaxResults: 50
```

Every cap is reported honestly in the status line ("file scan truncated" /
"matches truncated") instead of silently dropping results.

## How it works

Dual-face bundle.

- **Host half** (`lib/index.js`) registers an HTTP route on dsh's `webServer`
  (`ctx.webServer.register`, prefix `/workspace-search`) — `POST
  /workspace-search/search` and `POST /workspace-search/graph`. It deliberately
  does **not** inject `connection`: that service does not exist in the web host
  profile.
- **Client half** (`lib/client.js`) registers a tab type on
  `ctx.sidebarRightTabs` (kind `search`), renders its body into the keyed
  `sidebar.right.pane.tab` seat, and contributes a guide-page entry. Copy is
  routed through the Client locale service (zh/en) and the stylesheet is mounted
  through `ctx.effect`, using the GUI's own design tokens.

## License

MIT
