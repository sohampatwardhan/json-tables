import * as vscode from "vscode";
import { PanelController } from "./panelController.ts";

/**
 * Registers the `jsonTables.visualize` command (contributed in `package.json`, gated to
 * `.json`/`.jsonc` editors by its `editor/title` `when` clause). A no-op when there's no active
 * editor — the command is only ever invoked from a context where one exists, but defending
 * against `undefined` keeps this safe to invoke from the Command Palette too.
 */
export function registerVisualizeCommand(context: vscode.ExtensionContext): vscode.Disposable {
  return vscode.commands.registerCommand("jsonTables.visualize", () => {
    const document = vscode.window.activeTextEditor?.document;
    if (document) {
      PanelController.createOrReveal(context, document);
    }
  });
}
