# Requirements: JSON Visualizer VS Code Extension

<!-- spec-nav:start -->
**Spec navigation:** [State](00_state.md) · [Discovery](01_discovery.md) · [Requirements](02_requirements.md) · [Design](03_design.md) · [Tasks](04_tasks.md)
<!-- spec-nav:end -->

## Introduction

This extension lets a developer visualize the JSON/JSONC file currently open in VS Code as an
interactive Tree, Finder-style Column, or Key-Value/Table view — read-only, theme-aware, and
opened from the editor itself — as approved in [`01_discovery.md`](01_discovery.md). "Panel"
below means the Webview panel the extension opens beside the source editor. "View model" means
the structured, already-parsed representation of the document's JSON built for rendering.

> [!IMPORTANT]
> Approval gate: approve these requirements before work begins on [`03_design.md`](03_design.md).

## Requirements

### Requirement 1: Contextual entry point

**User Story:** As a developer with a JSON file open, I want a one-click way to visualize it
from the editor itself, so that I don't have to leave VS Code or use an external tool.

#### Acceptance Criteria

1. **R1.1** WHEN the active editor's language is JSON or JSONC, THE Command_Handler SHALL display a "Visualize JSON" control in the editor title area.
2. **R1.2** WHILE the active editor's language is not JSON or JSONC, THE Command_Handler SHALL keep the "Visualize JSON" control hidden.
3. **R1.3** WHEN a developer activates the "Visualize JSON" control, THE Command_Handler SHALL open a visualization panel beside the source editor.
4. **R1.4** THE Command_Handler SHALL open the visualization panel alongside the source editor without replacing it as the default editor for `.json`/`.jsonc` files.

### Requirement 2: View-model construction and parse-error handling

**User Story:** As a developer, I want the extension to read the exact contents of my file and
tell me clearly if it can't be parsed, so that the visualization never shows stale or misleading
data.

#### Acceptance Criteria

1. **R2.1** WHEN a visualization panel opens for a document, THE View_Model_Builder SHALL parse the document's current full text into a structured view model.
2. **R2.2** IF the document's text is not valid JSON (or JSONC per its own comment/trailing-comma rules), THEN THE View_Model_Builder SHALL produce an error view model containing the parse error's message and location, instead of a partial or crashed result.
3. **R2.3** WHEN the View_Model_Builder produces an error view model, THE Renderer SHALL display the parse error inline in the panel instead of a blank or crashed panel.

### Requirement 3: Tree view

**User Story:** As a developer, I want to browse the JSON as a collapsible tree, so that I can
drill into nested structures at my own pace.

#### Acceptance Criteria

1. **R3.1** WHILE the Tree view mode is active, THE Renderer SHALL display each JSON object and array as a collapsible node showing its key/index and child count.
2. **R3.2** WHILE the Tree view mode is active, THE Renderer SHALL auto-expand every node at nesting depth less than 2.
3. **R3.3** WHILE the Tree view mode is active, THE Renderer SHALL leave every node at nesting depth 2 or greater collapsed by default.
4. **R3.4** WHEN a developer clicks a node's chevron, THE Renderer SHALL toggle that node's own expanded/collapsed state without changing any sibling node's state.
5. **R3.5** WHEN a developer activates the "expand all" control, THE Renderer SHALL expand every node in the Tree view.
6. **R3.6** WHEN a developer activates the "collapse all" control, THE Renderer SHALL collapse every node in the Tree view.
7. **R3.7** WHILE the Tree view mode is active, THE Renderer SHALL color-code null, boolean, number, and string leaf values by type, using the active VS Code color theme's variables.

### Requirement 4: Column view

**User Story:** As a developer, I want a Finder-style drill-down through nested objects and
arrays, so that I can inspect one branch of a large structure without the rest of the tree
scrolling out of view.

#### Acceptance Criteria

1. **R4.1** WHILE the Column view mode is active, THE Renderer SHALL display each level of the currently drilled-down path as its own column of entries.
2. **R4.2** WHEN a developer selects an object or array entry in a column, THE Renderer SHALL open a new column to its right showing that entry's children.
3. **R4.3** WHEN a developer selects a scalar entry in a column, THE Renderer SHALL show that value in a detail pane instead of opening a new column.
4. **R4.4** WHEN a developer drags a column's resize handle, THE Renderer SHALL adjust that column's width accordingly.

### Requirement 5: Key-Value/Table view

**User Story:** As a developer, I want plain objects and arrays of similar objects rendered as
tables, so that I can scan many records or fields at a glance like a spreadsheet.

#### Acceptance Criteria

1. **R5.1** WHILE the Key-Value/Table view mode is active and the current node is a JSON object, THE Renderer SHALL display its keys and values as rows of a table.
2. **R5.2** WHILE the Key-Value/Table view mode is active and the current node is an array of objects, THE Renderer SHALL display the array as a grid with one row per array element.
3. **R5.3** WHILE the Key-Value/Table view mode is active, THE Renderer SHALL show a preview badge indicating type and size for any cell whose value is itself an object or array, rather than the full nested content.

### Requirement 6: View mode switching and default

**User Story:** As a developer, I want to switch freely between Tree, Column, and Table, so that
I can pick whichever fits what I'm looking for at the moment.

#### Acceptance Criteria

1. **R6.1** WHEN a developer selects a different view mode from the panel's toggle, THE Renderer SHALL re-render the same underlying view model in the newly selected mode.
2. **R6.2** WHEN a developer opens the first visualization panel of a VS Code installation, THE Renderer SHALL default to Tree view mode.
3. **R6.3** WHEN a developer opens any subsequent visualization panel, THE Renderer SHALL default to the view mode most recently selected in that VS Code installation.

### Requirement 7: Theme integration

**User Story:** As a developer, I want the visualization to match my VS Code color theme, so
that it looks native rather than clashing with my editor.

#### Acceptance Criteria

1. **R7.1** THE Renderer SHALL style all panel content using VS Code's active color theme's CSS variables.
2. **R7.2** WHEN the developer switches VS Code's active color theme while a panel is open, THE Renderer SHALL update the panel's colors to match the new theme without the panel being closed and reopened.

### Requirement 8: Live refresh

**User Story:** As a developer, I want the visualization to stay in sync with the file, so that
I don't have to close and reopen the panel after every edit.

#### Acceptance Criteria

1. **R8.1** WHEN the visualized document's text changes while its panel is open, THE View_Model_Builder SHALL parse the document's updated full text into a new view model.
2. **R8.2** WHEN the View_Model_Builder produces a new view model for a document whose panel is open, THE Extension_Host SHALL send that view model to the panel.
3. **R8.3** WHEN the Renderer receives an updated view model for the document currently shown, THE Renderer SHALL re-render the active view mode with the new data.
4. **R8.4** WHEN the document associated with an open visualization panel is closed, THE Extension_Host SHALL stop sending further updates for that panel.
5. **R8.5** IF the document's updated text is not valid JSON, THEN THE Renderer SHALL display the parse error inline instead of the previous valid rendering.

### Requirement 9: Read-only guarantee

**User Story:** As a developer, I want to be certain that browsing the visualization can never
change my file, so that I can use it without worrying about accidental edits.

#### Acceptance Criteria

1. **R9.1** THE Renderer SHALL render every JSON value as non-editable content.
2. **R9.2** IF a developer clicks or otherwise interacts with a value shown in the panel, THEN THE Renderer SHALL leave the visualized document's text unchanged.

### Requirement 10: Local packaging without a publisher account

**User Story:** As the extension's author, I want to build and install the extension locally
without a Marketplace publisher account, so that I can use it myself before deciding whether to
publish it.

#### Acceptance Criteria

1. **R10.1** WHEN the extension is packaged with the standard VS Code packaging tool, THE Package_Build SHALL produce an installable `.vsix` file without requiring a configured Marketplace publisher account.
2. **R10.2** WHEN the packaged `.vsix` is installed into a VS Code instance, THE Command_Handler SHALL behave identically to running the extension from the Extension Development Host.

## Approval

Status: **Approved on 2026-08-09**
