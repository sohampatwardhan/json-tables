import * as vscode from "vscode";
import { PanelController } from "./panelController.ts";

/**
 * Registers the `jsonExplorer.visualize` command (and alias `jsonTables.visualize`).
 * Contributed in `package.json`, gated to `.json`/`.jsonc` editors by its `editor/title` `when` clause.
 */
export function registerVisualizeCommand(context: vscode.ExtensionContext): vscode.Disposable {
  const handler = () => {
    const document = vscode.window.activeTextEditor?.document;
    if (document) {
      PanelController.createOrReveal(context, document);
    }
  };

  const primary = vscode.commands.registerCommand("jsonExplorer.visualize", handler);
  const alias = vscode.commands.registerCommand("jsonTables.visualize", handler);

  return vscode.Disposable.from(primary, alias);
}

