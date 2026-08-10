# Discovery: JSON Visualizer VS Code Extension

<!-- spec-nav:start -->
**Spec navigation:** [State](00_state.md) · [Discovery](01_discovery.md) · [Requirements](02_requirements.md) · [Design](03_design.md) · [Tasks](04_tasks.md) · [Execution](05_execution.md)
<!-- spec-nav:end -->

## Problem and Outcome

VS Code shows `.json` files as raw, syntax-highlighted text. There is no built-in way to browse
structured JSON the way a spreadsheet or note-taking tool would: as a navigable tree, a
Finder-style drill-down, or a table of records. [`THRIVE-Project-Manager`](/Users/soham/GitRepos/THRIVE-Project-Manager)'s
note editor already solved this for its own notes with a custom `DataTreeRenderer` that offers
three interchangeable read-only view modes for parsed JSON/YAML data.

**Outcome:** a VS Code extension, built Marketplace-publish-ready but installed locally for now,
that lets a developer open any `.json`/`.jsonc` file and, with one click from the editor title
bar, see the same document rendered as an interactive Tree view, a macOS Finder-style Column
view, or a Key-Value/Table view — without leaving the source file or risking any edits to it.

## Users and Current Workaround

- **Primary user:** a developer (initially the extension's author) inspecting config files, API
  fixtures, or data exports who currently either reads raw JSON text, reformats it externally, or
  pastes it into a web-based JSON viewer outside the editor.
- **Current workaround:** VS Code's built-in JSON language features (folding, outline view,
  Ctrl+click navigation) plus ad hoc external tools (browser JSON viewers, `jq`). None of these
  give the tree/column/table interaction THRIVE's note viewer already provides for other content
  types.

## Scope and Non-Goals

**In scope (v1):**
- An editor-title command/button, shown only when the active editor is a `.json`/`.jsonc` file,
  that opens a read-only visualization panel beside the source.
- Three view modes ported from THRIVE's `DataTreeRenderer`: **Tree**, **Column** (Finder-style
  drill-down with resizable panes), and **Key-Value/Table** (nested tables for objects, card
  grids for arrays of objects).
- Expand/collapse per node plus a global expand-all/collapse-all control (Tree view), matching
  THRIVE's default of auto-expanding the first two levels.
- Type-coded value coloring (null/boolean/number/string) consistent with VS Code's active color
  theme (light/dark/high-contrast), not a fixed palette.
- Inline parse-error display when the document is not valid JSON, instead of a crash or blank
  panel.
- Live refresh: the panel updates when the underlying file changes (edit or external change),
  without requiring the user to reopen it.
- Packaging structured so a later Marketplace publish is just an account + `vsce publish` away:
  [`package.json`](../../package.json) metadata, README, icon, and semantic versioning from `0.1.0`. No VS Code
  publisher account exists yet; v1 ships as a locally built/installed `.vsix` or via the
  Extension Development Host.

**Out of scope (v1, explicit non-goals):**
- Editing JSON values from the visualization and writing changes back to the file — read-only
  only.
- Replacing VS Code's default text editor for `.json` files (no custom editor provider); the
  source always stays the primary, editable view.
- Search/filter within the visualization and copy-path/copy-value actions — THRIVE's own JSON
  renderer does not have these either; candidates for a later iteration.
- Performance engineering for very large files (virtualization, streaming/incremental parse,
  circular-reference handling) — v1 targets small/typical config and data files, matching
  THRIVE's own synchronous `JSON.parse` approach.
- YAML support — THRIVE's renderer handles both JSON and YAML through one component, but this
  extension's scope is JSON/JSONC only for v1.

## Constraints and Success Measures

**Constraints:**
- Must render inside a VS Code Webview, subject to its Content Security Policy — no arbitrary
  remote script/style loading.
- Must adopt VS Code's own theme variables (`--vscode-*` CSS custom properties) rather than a
  fixed design system, so the visualization matches whatever color theme the user has active —
  a stricter requirement than THRIVE's OS-level `prefers-color-scheme` toggle.
- Must be structured for a future Marketplace publish (`LICENSE`, `README`, icon, semantic
  versioning) even though v1 has no publisher account and is installed locally by the author.

**Success measures:**
- A developer can open a typical (sub-few-MB) `.json` file, click the editor-title button, and
  see a rendered Tree/Column/Table view in well under a second.
- All three THRIVE view modes are present and produce a correct, navigable rendering for object,
  array, and scalar-only documents.
- Malformed JSON shows a clear inline error message; it never crashes the panel or the extension
  host.
- Editing the source file while the panel is open updates the panel without a manual refresh.
- `vsce package` succeeds and produces an installable `.vsix`, even without a publisher account
  yet (Marketplace `vsce publish` validation is deferred to whenever the author sets one up).

## Approaches Considered

The product decision (contextual editor-title command opening a side panel, three THRIVE view
modes, read-only) is already settled with the user. The remaining material decision is which
UI technology renders the three interactive view modes inside the Webview.

| Approach | Benefits | Costs / risks | Reversibility | Decision |
|---|---|---|---|---|
| **Preact + esbuild (JSX via `h`/`htm` pragma)** | ~3-4 KB runtime keeps panel-open time fast; component/hooks model closely mirrors THRIVE's `TreeNode`/`ColumnView`/`KVTable` structure, so their expand/collapse and drag-resize logic ports with minimal translation; still a single dependency to audit for Marketplace publishing. | One more third-party runtime dependency (small surface); slightly smaller ecosystem/examples than React. | High — swappable for React or vanilla later without changing the extension-host/Webview message contract. | **Chosen** |
| **React 18** (mirrors THRIVE's exact stack) | Maximum fidelity to THRIVE's existing components; some JSX/logic could be adapted almost directly; large ecosystem. | React + ReactDOM add materially more bundle weight and webview startup latency than this read-only, small-file scope needs; heavier than the problem justifies (YAGNI). | High — same message-contract boundary as above. | Rejected for v1; revisit only if editing/complex global state is added later |
| **Vanilla TypeScript + direct DOM manipulation** | Zero framework runtime; fewest dependencies to audit (helps Marketplace supply-chain hygiene); full control. | Hand-rolling three stateful, interactive view modes — including Column view's resizable drag handles and per-node expand state — in imperative DOM code is materially more implementation and maintenance effort than a component model buys back in bundle savings. | High, but at a much higher rewrite cost if hand-rolled state management proves buggy. | Rejected; effort/risk outweighs the marginal bundle savings over Preact |

## Chosen Direction

Build a VS Code extension with two cooperating parts, connected only by `postMessage`:

1. **Extension host** (TypeScript, Node/VS Code Extension API): registers a command and an
   `editor/title` menu contribution gated by `when: resourceLangId == json || resourceLangId ==
   jsonc`, reads the active document's text, parses it (`JSON.parse`, with the parse error
   surfaced rather than thrown past the boundary), and manages the `WebviewPanel` lifecycle
   (`retainContextWhenHidden`, CSP-compliant local resource loading).
2. **Webview panel** (Preact, bundled with `esbuild`): receives the view model over
   `postMessage`, renders the Tree/Column/Key-Value views ported from THRIVE's
   `DataTreeRenderer`, and re-renders on each `update` message the host sends after
   `onDidChangeTextDocument` (debounced) fires for the visualized file.

Styling uses VS Code's `--vscode-*` theme CSS variables in place of THRIVE's Tailwind/CSS-variable
palette, so the panel matches the user's active color theme automatically.

## Architecture and Flow Outline

```mermaid
block
  columns 3
  block:editor_ui["VS Code Editor"]
    file[/"Active .json/.jsonc File"/]
    button["Editor Title: Visualize JSON"]
  end
  block:extension_host["Extension Host"]
    command["Command Handler"]
    parser["Parse + Build View Model"]
    panel["Webview Panel Controller"]
  end
  block:webview_panel["Webview Panel"]
    renderer["Tree / Column / Table Renderer"]
  end
  file-- "open or edit" -->command
  button-- "click" -->command
  command-- "raw text" -->parser
  parser-- "view model" -->panel
  panel-- "postMessage: render/update" -->renderer
```

The three subsystems are independently testable: the extension host owns document access and
message dispatch; the Webview owns rendering only and never touches the filesystem directly;
the editor UI's title button is a declarative [`package.json`](../../package.json) contribution with no logic of its
own.

## Failure and Verification Strategy

- **Malformed JSON:** `JSON.parse` failures are caught in the extension host; the view model sent
  to the Webview carries an explicit error state, and the renderer shows the parse error message
  inline (matching THRIVE's inline-error pattern) instead of a blank or crashed panel.
- **Missing/closed document:** if the visualized document is closed or the panel is disposed, the
  host tears down its `onDidChangeTextDocument` listener to avoid leaking updates to a dead panel.
- **Verification approach:** manual/exploratory testing in the Extension Development Host against
  representative fixtures (object-only, array-of-objects, deeply nested, scalar-only, and
  intentionally malformed JSON) for each of the three view modes and both light/dark themes;
  automated unit tests for the parse/view-model-building logic in the extension host, where
  behavior is deterministic and doesn't require a live Webview.

## Open Decisions

- **Marketplace publisher identity:** deferred by the user — v1 targets personal/local install
  only (`.vsix` or Extension Development Host); a publisher account and `vsce publish` are a
  future fast-follow, not a v1 blocker.
- **View-mode persistence:** whether the last-used view mode (Tree/Column/Table) is remembered
  globally across sessions (default: yes, via `ExtensionContext.globalState`, defaulting to Tree)
  or reset per file — default proposed above, open to revision during requirements.
- **`.jsonc` scope:** whether comments/trailing commas in `.jsonc` need a tolerant parser (e.g.
  `jsonc-parser`) instead of strict `JSON.parse` — default proposed is to support `.jsonc` using a
  tolerant parser so the editor-title button's `when` clause promise ("works on `.jsonc` too")
  actually holds; confirm during requirements.

## Approval

Status: **Approved on 2026-08-09**
