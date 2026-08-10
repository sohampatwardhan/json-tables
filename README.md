# JSON Tables

Visualize any `.json`/`.jsonc` file as an interactive **Tree**, **Column**, or **Table** view,
right beside the source editor — without ever editing the file.

## Usage

Open a `.json` or `.jsonc` file, then click the **Visualize JSON** icon in the editor's title
bar (or run **JSON Tables: Visualize JSON** from the Command Palette). A panel opens beside your
file with three switchable views:

- **Tree** — a collapsible tree, auto-expanded two levels deep, with expand-all/collapse-all
  controls and type-colored leaf values.
- **Column** — a Finder-style drill-down: select an object or array to open a new column to its
  right; select a scalar to preview it in the detail pane.
- **Table** — plain objects render as key/value rows; arrays of objects render as a grid with
  columns unioned across every element's keys.

The panel is **read-only** — nothing you do in it ever changes your file — and stays in sync as
you edit the source. It matches your active VS Code color theme automatically.

## Status

This is a personal project, not yet published to the VS Code Marketplace. Install it locally
from a built `.vsix` (see below) or run it from source via the Extension Development Host
(press `F5` in this repository).

## Building from source

```bash
npm install
npm run compile   # builds dist/extension.js and dist/webview/main.js
npm test          # runs the unit/component test suite
npx vsce package  # produces json-tables-<version>.vsix
```

Install the resulting `.vsix` in VS Code via **Extensions: Install from VSIX...**.

## License

MIT — see the `LICENSE` file in this repository.
