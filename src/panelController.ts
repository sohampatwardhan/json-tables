import * as vscode from "vscode";
import { buildViewModel } from "./viewModelBuilder.ts";
import { watchDocument } from "./documentWatcher.ts";
import { debounce } from "./debounce.ts";
import { generateNonce, renderWebviewHtml } from "./webviewHtml.ts";
import type { HostMessage, ViewMode, WebviewMessage } from "./shared/types.ts";

const LAST_VIEW_MODE_KEY = "jsonTables.lastViewMode";
const DEBOUNCE_MS = 150;

/**
 * Owns one Webview panel per visualized document. Never writes to the document — no method
 * here calls `workspace.applyEdit`/`TextEditor.edit`, and the only messages this class sends are
 * `init`/`update` (data), never anything the webview could mistake for an edit request.
 */
export class PanelController {
  private static readonly instances = new Map<string, PanelController>();

  private readonly document: vscode.TextDocument;
  private readonly context: vscode.ExtensionContext;
  private readonly panel: vscode.WebviewPanel;
  private readonly watcherSubscription: vscode.Disposable;
  private readonly debouncedOnDocumentChanged: () => void;

  private constructor(context: vscode.ExtensionContext, document: vscode.TextDocument, panel: vscode.WebviewPanel) {
    this.context = context;
    this.document = document;
    this.panel = panel;
    this.debouncedOnDocumentChanged = debounce(() => this.onDocumentChanged(), DEBOUNCE_MS);
    this.watcherSubscription = watchDocument(
      vscode.workspace,
      document,
      this.debouncedOnDocumentChanged,
      () => this.dispose(),
    );
    panel.onDidDispose(() => this.dispose());
    panel.webview.onDidReceiveMessage((message: WebviewMessage) => this.onWebviewMessage(message));
  }

  /** Reveals the existing panel for `document` if one is open, otherwise creates a new one. */
  static createOrReveal(context: vscode.ExtensionContext, document: vscode.TextDocument): void {
    const key = document.uri.toString();
    const existing = PanelController.instances.get(key);
    if (existing) {
      existing.panel.reveal(vscode.ViewColumn.Beside);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "jsonTables.visualizer",
      "JSON Tables",
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, "dist", "webview")],
      },
    );

    const nonce = generateNonce();
    const scriptUri = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(context.extensionUri, "dist", "webview", "main.js"),
    );
    const styleUri = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(context.extensionUri, "dist", "webview", "main.css"),
    );
    panel.webview.html = renderWebviewHtml({
      scriptUri: scriptUri.toString(),
      styleUri: styleUri.toString(),
      nonce,
    });

    const controller = new PanelController(context, document, panel);
    PanelController.instances.set(key, controller);
    // sendInit() is deliberately NOT called here: the webview's script has not loaded yet
    // (assigning `panel.webview.html` triggers an async page load), so a message posted this
    // early could arrive before `main.tsx` has attached its listener. Waiting for the webview's
    // own `ready` message (below) makes the handshake deterministic instead of relying on
    // message-delivery timing.
  }

  private sendInit(): void {
    const viewModel = buildViewModel(this.document.getText());
    const viewMode = this.context.globalState.get<ViewMode>(LAST_VIEW_MODE_KEY, "tree");
    this.postMessage({ type: "init", viewModel, viewMode });
  }

  private onDocumentChanged(): void {
    const viewModel = buildViewModel(this.document.getText());
    this.postMessage({ type: "update", viewModel });
  }

  private onWebviewMessage(message: WebviewMessage): void {
    if (message.type === "ready") {
      this.sendInit();
    } else if (message.type === "viewModeChanged") {
      void this.context.globalState.update(LAST_VIEW_MODE_KEY, message.viewMode);
    }
  }

  private postMessage(message: HostMessage): void {
    void this.panel.webview.postMessage(message);
  }

  dispose(): void {
    this.watcherSubscription.dispose();
    PanelController.instances.delete(this.document.uri.toString());
  }
}
