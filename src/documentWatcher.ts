import type * as vscode from "vscode";

/**
 * The subset of `vscode.workspace` this module needs. Callers pass the real `vscode.workspace`
 * at runtime; tests pass a fake. Accepting it as a parameter — rather than importing `vscode` as
 * a value at module scope — keeps this module runnable under a plain Node.js test process, which
 * has no `vscode` module to resolve (it's injected by the Extension Host, not installable).
 */
export interface WorkspaceEvents {
  onDidChangeTextDocument: typeof vscode.workspace.onDidChangeTextDocument;
  onDidCloseTextDocument: typeof vscode.workspace.onDidCloseTextDocument;
}

/**
 * Watches one specific document for edits and closure, filtering `workspace`'s document-wide
 * change/close events down to just this document before invoking the given callbacks. Kept
 * separate from `PanelController` so this filtering logic is independently testable without a
 * real webview or panel.
 *
 * The returned disposable must be disposed exactly once the document's panel is torn down —
 * ignoring further callbacks instead of disposing would leak a listener per visualized document
 * for the lifetime of the VS Code session.
 */
export function watchDocument(
  workspace: WorkspaceEvents,
  document: vscode.TextDocument,
  onChange: () => void,
  onClose: () => void,
): vscode.Disposable {
  const changeSubscription = workspace.onDidChangeTextDocument((event) => {
    if (event.document === document) {
      onChange();
    }
  });
  const closeSubscription = workspace.onDidCloseTextDocument((closedDocument) => {
    if (closedDocument === document) {
      onClose();
    }
  });

  return {
    dispose(): void {
      changeSubscription.dispose();
      closeSubscription.dispose();
    },
  };
}
