import { useState } from "preact/hooks";
import type { JsonNode } from "../shared/types";

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
          return (
            <li key={label}>
              <button
                type="button"
                class="column-view__entry"
                aria-selected={selectedKey === label}
                onClick={() => onSelectEntry(columnIndex, entry)}
              >
                <span class="column-view__entry-label">{label}</span>
                {isContainer && <span class="column-view__entry-arrow">{"›"}</span>}
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
 * pane for the currently selected scalar (if any). Selecting an object/array entry always
 * extends `selectedPath` by exactly one segment; selecting a scalar entry never does — the two
 * are mutually exclusive so a scalar selection can never be mistaken for a drill-down.
 */
export function ColumnView({ root, selectedPath, onSelectPath }: ColumnViewProps) {
  const [detailValue, setDetailValue] = useState<JsonNode | undefined>(undefined);

  const columnNodes: JsonNode[] = [root];
  for (let i = 0; i < selectedPath.length; i++) {
    const next = findNodeAtPath(root, selectedPath.slice(0, i + 1));
    if (next === undefined) break;
    columnNodes.push(next);
  }

  function handleSelectEntry(columnIndex: number, entry: JsonNode) {
    if (entry.kind === "object" || entry.kind === "array") {
      setDetailValue(undefined);
      onSelectPath([...selectedPath.slice(0, columnIndex), entry.key ?? String(entry.index)]);
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
          <span class="column-view__detail-value" data-kind={detailValue.kind}>
            {detailValue.kind === "string" ? `"${String(detailValue.value)}"` : String(detailValue.value)}
          </span>
        ) : (
          <span class="column-view__detail-empty">Select a value to preview it here.</span>
        )}
      </div>
    </div>
  );
}
