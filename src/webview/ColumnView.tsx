import { useState } from "preact/hooks";
import type { JsonNode } from "../shared/types.ts";

const DEFAULT_COLUMN_WIDTH = 200;
const MIN_COLUMN_WIDTH = 80;

/** Walks from `root` down `path` (a sequence of object keys / array indices as strings). */
function findNodeAtPath(root: JsonNode, path: string[]): JsonNode | undefined {
  let current: JsonNode | undefined = root;
  for (const segment of path) {
    if (!current?.children) return undefined;
    current =
      current.kind === "array"
        ? current.children[Number(segment)]
        : current.children.find((child) => child.key === segment);
  }
  return current;
}

function entryLabel(node: JsonNode, index: number): string {
  return node.key ?? String(node.index ?? index);
}

function formatScalarPreview(node: JsonNode): string {
  if (node.kind === "string") return `"${String(node.value)}"`;
  return String(node.value);
}

interface ColumnProps {
  node: JsonNode;
  columnIndex: number;
  selectedKey: string | undefined;
  onSelectEntry: (columnIndex: number, entry: JsonNode) => void;
}

/** One column: the entries of `node`, with its own independently resizable width. */
function Column({ node, columnIndex, selectedKey, onSelectEntry }: ColumnProps) {
  const [width, setWidth] = useState(DEFAULT_COLUMN_WIDTH);

  function startResize(event: PointerEvent) {
    const startX = event.clientX;
    const startWidth = width;
    function onMove(moveEvent: PointerEvent) {
      const next = Math.max(MIN_COLUMN_WIDTH, startWidth + (moveEvent.clientX - startX));
      setWidth(next);
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <div class="column-view__column" style={{ width: `${width}px` }}>
      <ul class="column-view__entries">
        {(node.children ?? []).map((entry, index) => {
          const label = entryLabel(entry, index);
          const isContainer = entry.kind === "object" || entry.kind === "array";
          const count = entry.children?.length ?? 0;
          return (
            <li key={label}>
              <button
                type="button"
                class="column-view__entry"
                aria-selected={selectedKey === label}
                onClick={() => onSelectEntry(columnIndex, entry)}
              >
                <span class="column-view__entry-label" title={label}>
                  {label}
                </span>
                {isContainer ? (
                  <span class="column-view__entry-meta">
                    <span class="column-view__entry-count">{count}</span>
                    <span class="column-view__entry-arrow">{"›"}</span>
                  </span>
                ) : (
                  <span
                    class="column-view__entry-value"
                    data-kind={entry.kind}
                    title={formatScalarPreview(entry)}
                  >
                    {formatScalarPreview(entry)}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <div
        class="column-view__resize-handle"
        onPointerDown={(event) => startResize(event as unknown as PointerEvent)}
      />
    </div>
  );
}

interface ColumnViewProps {
  root: JsonNode;
  selectedPath: string[];
  onSelectPath: (path: string[]) => void;
}

/**
 * A macOS Finder-style drill-down: one column per already-selected path segment, plus a detail
 * pane for the currently selected scalar (if any). Selecting any entry highlights it in blue.
 * Selecting a container appends a new column for its children, while selecting a scalar displays
 * its value in the detail pane column.
 */
export function ColumnView({ root, selectedPath, onSelectPath }: ColumnViewProps) {
  const [detailValue, setDetailValue] = useState<JsonNode | undefined>(() => {
    if (selectedPath.length === 0) return undefined;
    const lastNode = findNodeAtPath(root, selectedPath);
    return lastNode && lastNode.kind !== "object" && lastNode.kind !== "array" ? lastNode : undefined;
  });

  const columnNodes: JsonNode[] = [root];
  for (let i = 0; i < selectedPath.length; i++) {
    const next = findNodeAtPath(root, selectedPath.slice(0, i + 1));
    if (next === undefined) break;
    if (next.kind === "object" || next.kind === "array") {
      columnNodes.push(next);
    }
  }

  function handleSelectEntry(columnIndex: number, entry: JsonNode) {
    const segment = entry.key ?? String(entry.index);
    const nextPath = [...selectedPath.slice(0, columnIndex), segment];
    onSelectPath(nextPath);

    if (entry.kind === "object" || entry.kind === "array") {
      setDetailValue(undefined);
    } else {
      setDetailValue(entry);
    }
  }

  return (
    <div class="column-view">
      {columnNodes.map((node, index) => (
        <Column
          key={index}
          node={node}
          columnIndex={index}
          selectedKey={selectedPath[index]}
          onSelectEntry={handleSelectEntry}
        />
      ))}
      <div class="column-view__detail-pane">
        {detailValue ? (
          <div class="column-view__detail-card">
            <div class="column-view__detail-header">
              <span class="column-view__detail-key">
                {detailValue.key ?? String(detailValue.index ?? "")}
              </span>
              <span class="column-view__detail-badge" data-kind={detailValue.kind}>
                {detailValue.kind}
              </span>
            </div>
            <div class="column-view__detail-body">
              <pre class="column-view__detail-value" data-kind={detailValue.kind}>
                {detailValue.kind === "string"
                  ? `"${String(detailValue.value)}"`
                  : String(detailValue.value)}
              </pre>
            </div>
          </div>
        ) : (
          <div class="column-view__detail-empty">Select a value to preview it here.</div>
        )}
      </div>
    </div>
  );
}
