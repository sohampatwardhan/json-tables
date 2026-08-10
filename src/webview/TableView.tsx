import { useState } from "preact/hooks";
import type { JsonNode } from "../shared/types.ts";
import { EditableKey, EditableValue } from "./EditableItem.tsx";

interface EditProps {
  onEditValue?: (path: string[], value: any) => void;
  onRenameKey?: (path: string[], newKey: string) => void;
}

/** Renders any node's value as a cell: an expandable nested table for objects/arrays, scalar text otherwise. */
function Cell({
  node,
  onEditValue,
  onRenameKey,
}: {
  node: JsonNode;
} & EditProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (node.kind === "object" || node.kind === "array") {
    const count = node.children?.length ?? 0;
    if (count === 0) {
      return (
        <span class="table-view__empty" data-kind={node.kind}>
          {node.kind === "array" ? "[]" : "{}"}
        </span>
      );
    }
    return (
      <div class="table-view__nested">
        <button
          type="button"
          class="table-view__toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand nested table" : "Collapse nested table"}
          aria-expanded={!isCollapsed}
        >
          <span class={`table-view__chevron ${isCollapsed ? "" : "table-view__chevron--expanded"}`}>
            {"›"}
          </span>
          <span class="table-view__badge" data-kind={node.kind}>
            {node.kind === "array" ? `[${count}]` : `{${count}}`}
          </span>
        </button>
        {!isCollapsed && (
          <NestedTable node={node} onEditValue={onEditValue} onRenameKey={onRenameKey} />
        )}
      </div>
    );
  }

  if (onEditValue) {
    return <EditableValue node={node} onEditValue={onEditValue} />;
  }

  return (
    <span class="val-mono" data-kind={node.kind}>
      {node.kind === "string" ? `"${String(node.value)}"` : String(node.value)}
    </span>
  );
}

/** Renders a nested table for nested objects/arrays inside a key-value value cell or grid cell. */
export function NestedTable({
  node,
  onEditValue,
  onRenameKey,
}: {
  node: JsonNode;
} & EditProps) {
  const isArrayOfObjects =
    node.kind === "array" &&
    (node.children?.length ?? 0) > 0 &&
    (node.children ?? []).every((child) => child.kind === "object");

  if (isArrayOfObjects) {
    return <ArrayGrid node={node} isNested={true} onEditValue={onEditValue} onRenameKey={onRenameKey} />;
  }

  return (
    <table class="table-view__nested-table">
      <tbody>
        {(node.children ?? []).map((child, index) => {
          const rowLabel = child.key ?? String(child.index ?? index);
          return (
            <tr key={rowLabel}>
              <td class="nested-key">
                {child.key !== undefined && onRenameKey ? (
                  <EditableKey path={child.path} currentKey={child.key} onRenameKey={onRenameKey} />
                ) : (
                  rowLabel
                )}
              </td>
              <td class="nested-value">
                <Cell node={child} onEditValue={onEditValue} onRenameKey={onRenameKey} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/**
 * Renders top-level key-value rows: a fixed-width key column with a subtle blue tint
 * and border-right, paired with a flex-1 value column containing monospace values or nested tables.
 */
export function KeyValueView({
  node,
  onEditValue,
  onRenameKey,
}: {
  node: JsonNode;
} & EditProps) {
  return (
    <div class="table-view__kv kv-container">
      {(node.children ?? []).map((child, index) => {
        const rowLabel = child.key ?? String(child.index ?? index);
        return (
          <div key={rowLabel} class="kv-row">
            <div class="kv-key">
              {child.key !== undefined && onRenameKey ? (
                <EditableKey path={child.path} currentKey={child.key} onRenameKey={onRenameKey} />
              ) : (
                rowLabel
              )}
            </div>
            <div class="kv-value">
              <Cell node={child} onEditValue={onEditValue} onRenameKey={onRenameKey} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Renders an array of objects as a grid: one row per element, with column headers unioned across
 * every element's keys (so an element missing a key just shows an empty cell rather than
 * shifting other columns).
 */
export function ArrayGrid({
  node,
  isNested,
  onEditValue,
  onRenameKey,
}: {
  node: JsonNode;
  isNested?: boolean;
} & EditProps) {
  const elements = node.children ?? [];
  const headers: string[] = [];
  const seen = new Set<string>();
  for (const element of elements) {
    for (const field of element.children ?? []) {
      if (field.key !== undefined && !seen.has(field.key)) {
        seen.add(field.key);
        headers.push(field.key);
      }
    }
  }

  return (
    <table class={`table-view__grid ${isNested ? "table-view__grid--nested" : ""}`}>
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header} scope="col">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {elements.map((element, index) => (
          <tr key={element.index ?? index}>
            {headers.map((header) => {
              const field = element.children?.find((child) => child.key === header);
              return (
                <td key={header}>
                  {field ? (
                    <Cell node={field} onEditValue={onEditValue} onRenameKey={onRenameKey} />
                  ) : null}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Chooses `ArrayGrid` for an array of objects, `KeyValueView` for anything else with children
 * (a plain object or array of scalars), or the value itself for a scalar root.
 */
export function TableView({
  node,
  onEditValue,
  onRenameKey,
}: {
  node: JsonNode;
} & EditProps) {
  if (node.kind !== "object" && node.kind !== "array") {
    return (
      <div class="table-view__scalar-root">
        <Cell node={node} onEditValue={onEditValue} onRenameKey={onRenameKey} />
      </div>
    );
  }
  const isArrayOfObjects =
    node.kind === "array" &&
    (node.children?.length ?? 0) > 0 &&
    (node.children ?? []).every((child) => child.kind === "object");
  if (isArrayOfObjects) {
    return <ArrayGrid node={node} onEditValue={onEditValue} onRenameKey={onRenameKey} />;
  }
  return <KeyValueView node={node} onEditValue={onEditValue} onRenameKey={onRenameKey} />;
}
