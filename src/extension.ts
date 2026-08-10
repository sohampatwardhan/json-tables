import * as vscode from "vscode";
import { registerVisualizeCommand } from "./commandHandler.ts";

/** Extension entry point (`package.json`'s `main`). Registers every disposable command/listener. */
export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(registerVisualizeCommand(context));
}
