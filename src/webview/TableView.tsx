import { useState } from "preact/hooks";
import type { JsonNode } from "../shared/types.ts";

function scalarText(node: JsonNode): string {
  if (node.kind === "string") return `"${String(node.value)}"`;
  return String(node.value);
}

/** Renders any node's value as a cell: an expandable nested table for objects/arrays, scalar text otherwise. */
function Cell({ node }: { node: JsonNode }) {
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
        {!isCollapsed && <NestedTable node={node} />}
      </div>
    );
  }
  return <span class="val-mono" data-kind={node.kind}>{scalarText(node)}</span>;
}

/** Renders a nested table for nested objects/arrays inside a key-value value cell or grid cell. */
export function NestedTable({ node }: { node: JsonNode }) {
  const isArrayOfObjects =
    node.kind === "array" &&
    (node.children?.length ?? 0) > 0 &&
    (node.children ?? []).every((child) => child.kind === "object");

  if (isArrayOfObjects) {
    return <ArrayGrid node={node} isNested={true} />;
  }

  return (
    <table class="table-view__nested-table">
      <tbody>
        {(node.children ?? []).map((child, index) => {
          const rowLabel = child.key ?? String(child.index ?? index);
          return (
            <tr key={rowLabel}>
              <td class="nested-key">{rowLabel}</td>
              <td class="nested-value">
                <Cell node={child} />
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
export function KeyValueView({ node }: { node: JsonNode }) {
  return (
    <div class="table-view__kv kv-container">
      {(node.children ?? []).map((child, index) => {
        const rowLabel = child.key ?? String(child.index ?? index);
        return (
          <div key={rowLabel} class="kv-row">
            <div class="kv-key">{rowLabel}</div>
            <div class="kv-value">
              <Cell node={child} />
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
export function ArrayGrid({ node, isNested }: { node: JsonNode; isNested?: boolean }) {
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
              return <td key={header}>{field ? <Cell node={field} /> : null}</td>;
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
export function TableView({ node }: { node: JsonNode }) {
  if (node.kind !== "object" && node.kind !== "array") {
    return (
      <div class="table-view__scalar-root">
        <Cell node={node} />
      </div>
    );
  }
  const isArrayOfObjects =
    node.kind === "array" &&
    (node.children?.length ?? 0) > 0 &&
    (node.children ?? []).every((child) => child.kind === "object");
  if (isArrayOfObjects) {
    return <ArrayGrid node={node} />;
  }
  return <KeyValueView node={node} />;
}
