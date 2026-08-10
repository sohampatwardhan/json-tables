# Interactive JSON Explorer

[![Visual Studio Marketplace](https://img.shields.io/badge/Visual_Studio_Marketplace-Install-blue?style=flat-square&logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=sohampatwardhan.json-explorer-viewer)
[![Version](https://img.shields.io/github/v/tag/sohampatwardhan/json-explorer-vscode?label=version&style=flat-square&color=blue)](https://marketplace.visualstudio.com/items?itemName=sohampatwardhan.json-explorer-viewer)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

Visualize and edit any `.json` or `.jsonc` file with interactive **Tree**, **Column** (macOS Finder-style), or **Table** (Key-Value) views, right beside your VS Code editor.

[**View on Visual Studio Marketplace**](https://marketplace.visualstudio.com/items?itemName=sohampatwardhan.json-explorer-viewer)

![JSON Explorer Icon](media/icon.png)

## Installation

### Via VS Code Extensions Marketplace
1. Open VS Code.
2. Open the Extensions sidebar (<kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>X</kbd> on macOS or <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>X</kbd> on Windows/Linux).
3. Search for **Interactive JSON Explorer** (or `sohampatwardhan.json-explorer-viewer`).
4. Click **Install**.

### Via Command Line
```bash
code --install-extension sohampatwardhan.json-explorer-viewer
```

## Features

- **Three Switchable View Modes**:
  - **Tree View** — Hierarchical collapsible tree auto-expanded two levels deep, with child count badges, type syntax coloring, and Expand/Collapse All controls.
  - **Column View** — macOS Finder-style multi-column drill-down with independent resizable columns, child count badges (`438 ›`), inline scalar previews, active blue row selection, and a right-side inspector pane.
  - **Table View** — Key-Value flex layout with distinctive grey key headers, nested collapsible tables, and auto-unioned grid headers for arrays of objects.
- **Interactive Inline Editing & Key Renaming**:
  - Double-click any key or value to edit in place.
  - Automatic type parsing (`boolean`, `number`, `null`, `string`).
  - Native VS Code `WorkspaceEdit` integration with full **Undo/Redo** (`Cmd+Z` / `Ctrl+Z`) support.
- **Dynamic Responsive Layout**:
  - Automatically scales and wraps content to fit side-by-side split editors or resized windows.
- **Theme-Aware**:
  - Fully adaptive to Light, Dark, High Contrast, and custom VS Code color themes.
- **Native Editor Integration**:
  - Click the **`$(json)`** (`{ }`) button in the editor title bar or run **JSON Explorer: Visualize JSON** from the Command Palette.

## Usage

1. Open any `.json` or `.jsonc` file in VS Code.
2. Click the **`$(json)`** (`{ }`) icon in the editor tab bar (top right) or press <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> and run **JSON Explorer: Visualize JSON**.
3. Switch between **Tree**, **Column**, and **Table** modes using the top toolbar.
4. Double-click any key to rename it, or double-click any value to edit it.

## Building from source

```bash
npm install
npm run compile   # builds dist/extension.js and dist/webview/main.js
npm test          # runs the 44-test unit/component suite
npx vsce package  # builds json-explorer-viewer-<version>.vsix
```

Install the resulting `.vsix` into VS Code via:
```bash
code --install-extension json-explorer-viewer-0.2.0.vsix --force
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for full release history and notes.

## License

[MIT](LICENSE)
