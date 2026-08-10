import { useEffect, useState } from "preact/hooks";
import { TreeNode, defaultExpandedPaths, collectExpandablePaths } from "./TreeView";
import { ColumnView } from "./ColumnView";
import { TableView } from "./TableView";
import type { HostMessage, JsonNode, ViewMode, ViewModel, WebviewMessage } from "../shared/types";

const VIEW_MODES: ViewMode[] = ["tree", "column", "table"];

interface AppProps {
  /** Injected rather than calling `acquireVsCodeApi()` directly, so tests can supply a fake. */
  postMessage: (message: WebviewMessage) => void;
}

/**
 * The webview's root component. Owns all client-side state (`viewModel`, `viewMode`,
 * `expandedPaths`, Column view's `selectedPath`) and the `window` message listener that receives
 * `HostMessage`s from the extension host. Emits `viewModeChanged` back to the host on every
 * toggle so the next panel opened in this VS Code installation can default to it (R6.2/R6.3).
 */
export function App({ postMessage }: AppProps) {
  const [viewModel, setViewModel] = useState<ViewModel>({ status: "ok", root: emptyRoot() });
  const [viewMode, setViewMode] = useState<ViewMode>("tree");
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string[]>([]);

  useEffect(() => {
    function onMessage(event: MessageEvent<HostMessage>) {
      const message = event.data;
      if (message.type === "init") {
        setViewMode(message.viewMode);
        setViewModel(message.viewModel);
        if (message.viewModel.status === "ok") {
          setExpandedPaths(defaultExpandedPaths(message.viewModel.root));
        }
      } else if (message.type === "update") {
        setViewModel(message.viewModel);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  function handleViewModeChange(mode: ViewMode) {
    setViewMode(mode);
    postMessage({ type: "viewModeChanged", viewMode: mode });
  }

  function handleToggle(key: string) {
    setExpandedPaths((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleExpandAll() {
    if (viewModel.status !== "ok") return;
    setExpandedPaths(new Set(collectExpandablePaths(viewModel.root)));
  }

  function handleCollapseAll() {
    setExpandedPaths(new Set());
  }

  if (viewModel.status === "error") {
    return (
      <div class="app__error-banner">
        <p>{viewModel.message}</p>
        <p>
          Line {viewModel.line + 1}, column {viewModel.column + 1}
        </p>
      </div>
    );
  }

  return (
    <div class="app">
      <div class="app__toolbar" role="tablist">
        {VIEW_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={viewMode === mode}
            onClick={() => handleViewModeChange(mode)}
          >
            {mode}
          </button>
        ))}
        {viewMode === "tree" && (
          <>
            <button type="button" onClick={handleExpandAll}>
              Expand all
            </button>
            <button type="button" onClick={handleCollapseAll}>
              Collapse all
            </button>
          </>
        )}
      </div>
      <div class="app__content">
        {viewMode === "tree" && (
          <TreeNode node={viewModel.root} expandedPaths={expandedPaths} onToggle={handleToggle} />
        )}
        {viewMode === "column" && (
          <ColumnView root={viewModel.root} selectedPath={selectedPath} onSelectPath={setSelectedPath} />
        )}
        {viewMode === "table" && <TableView node={viewModel.root} />}
      </div>
    </div>
  );
}

function emptyRoot(): JsonNode {
  return { kind: "object", path: [], children: [] };
}
