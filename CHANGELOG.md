# Changelog

All notable changes to the **JSON Tables** extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
