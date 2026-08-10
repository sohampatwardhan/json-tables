# Changelog

All notable changes to the **JSON Tables** extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-08-10

### Changed
- **Consistent Key Column Width**: Set top-level Key-Value key columns to a uniform width (`160px`) throughout the Table view for clean, perfectly aligned vertical divider lines across all rows.
- **Per-Table Horizontal Scrolling**: Switched back to per-table horizontal scrolling on nested tables and multi-column array grids so wide tables scroll independently without disrupting page layout.

## [0.1.9] - 2026-08-10

### Changed
- **Compact Index & Key Columns**: Tightened key columns and array index cells (`0`, `1`, `2`, ...) to shrink-wrap exact content width (`width: 1%; min-width: 24px`) without wasting space on large empty gaps.
- **No Unnecessary Scrollbars on Simple Tables**: Improved word and hash wrapping (`word-break: break-word`) in monospace values so long strings (like sha256 hashes) wrap cleanly and avoid triggering premature horizontal scrollbars.

## [0.1.8] - 2026-08-10

### Fixed
- **Viewport-Level Horizontal Scrollbar**: Moved horizontal scrolling to the viewport container level (`.table-view-container`) so the scrollbar stays pinned right at the bottom of the window/viewport (always visible while scrolling) rather than hidden at the bottom of tall table cells.

## [0.1.7] - 2026-08-10

### Fixed
- **Table Column Crunching & Horizontal Scroll**: Prevented table and grid columns with long strings or nested arrays from aggressively collapsing into 1-character vertical strips; added minimum column width guards and smooth horizontal scrolling (`overflow-x: auto`) for multi-column and deeply nested structures while keeping simple tables compact.

## [0.1.6] - 2026-08-10

### Changed
- **Default Hidden Badges**: Key-Value tables now hide per-table chevron count badges by default when fully expanded, providing a completely clean and seamless nested table appearance.
- **Contextual Badges Toggle**: The toolbar button to show/hide badges is now visible only when the Table view is in its fully expanded state, and automatically hidden in collapsed or partially collapsed states.

## [0.1.5] - 2026-08-10

### Changed
- **Editor Action Icon**: Updated the editor tab bar action button icon from `$(table)` to the native JSON curly braces codicon `$(json)` (`{ }`).

## [0.1.4] - 2026-08-10

### Changed
- **Natural Table Widths**: Nested tables and key-value cells now fit their content dimensions naturally (`width: fit-content; max-width: 100%`) instead of forcibly stretching across the entire window width, eliminating excessive empty whitespace.

## [0.1.3] - 2026-08-10

### Changed
- **Default Expanded State**: Key-Value tables and nested sub-tables now open in a fully expanded view by default, showing all nested objects and data immediately without requiring manual clicks.

## [0.1.2] - 2026-08-10

### Added
- **Table View Expand All & Collapse All**: Toolbar controls for Table view mode to recursively expand or collapse all nested tables and objects at once.
- **Show/Hide Badges Toggle**: Added a toolbar toggle to show or hide the per-table expand/collapse chevron count badges (`▼ {count}`), allowing a clean, seamless embedded table layout.

## [0.1.1] - 2026-08-10

### Changed
- **Active Tab Opening**: Clicking the `$(table)` editor title button now opens the JSON visualizer directly in a new tab within the active editor group rather than splitting into a side pane.
- **Dynamic Tab Header & Icon**: Sets tab title to `JSON: <filename>` and shows the JSON Tables icon on the tab header.

## [0.1.0] - 2026-08-10

### Added
- **Interactive Tree View**:
  - Hierarchical collapsible tree visualization for arbitrary JSON documents.
  - Type-colored syntax highlighting for primitive values (`string`, `number`, `boolean`, `null`).
  - Child count badges for object and array nodes (`{n}` / `[n]`).
  - **Expand All** and **Collapse All** toolbar actions.
- **macOS Finder-Style Column View**:
  - Multi-column horizontal drill-down view with independent column width resizers.
  - Live item count badges displayed next to drill-down chevrons (e.g. `438 ›`).
  - Inline scalar value previews displayed directly inside column rows.
  - Active selection blue highlighting (`aria-selected`) when selecting containers or leaf scalar keys.
  - Detailed value inspector pane on the right showing key name, data type badge, and formatted multiline value.
- **Fluid Key-Value Table View**:
  - Responsive top-level Key-Value flex rows with distinctive grey key column headers.
  - Nested collapsible tables with expandable chevron headers and count badges.
  - Tabular Array Grid view with auto-unioned column headers for arrays of objects.
  - Responsive content scaling dynamically adapting to split-screen and window dimensions.
- **Interactive Value Editing & Key Renaming**:
  - Double-click any value or key across Table, Column, and Tree views to edit inline.
  - Automatic type parsing (`boolean`, `number`, `null`, quoted/unquoted `string`).
  - Integrated with VS Code's `WorkspaceEdit` API with full **Undo / Redo** (`Cmd+Z` / `Ctrl+Z`) support.
- **VS Code Navigation & Theme Integration**:
  - Editor title action button with native `$(table)` codicon for `.json` and `.jsonc` files.
  - Full theme-token adaptive styling supporting Light+, Dark+, High Contrast, and custom VS Code themes.
  - Automatic live reload and debounced synchronization as the source file is modified.
- **Testing & Verification**:
  - 44 automated unit and component tests passing.
