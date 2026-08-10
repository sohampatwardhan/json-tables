import type { JsonNode } from "../shared/types.ts";

function scalarText(node: JsonNode): string {
  if (node.kind === "string") return `"${String(node.value)}"`;
  return String(node.value);
}

/** Renders any node's value as a table cell: a nested table for objects/arrays, scalar text otherwise. */
function Cell({ node }: { node: JsonNode }) {
  if (node.kind === "object" || node.kind === "array") {
    if (!node.children || node.children.length === 0) {
      return (
        <span class="table-view__empty" data-kind={node.kind}>
          {node.kind === "array" ? "[]" : "{}"}
        </span>
      );
    }
    return (
      <div class="table-view__nested">
        <TableView node={node} />
      </div>
    );
  }
  return <span data-kind={node.kind}>{scalarText(node)}</span>;
}

/**
 * Renders a JSON object as a two-column table: one row per key. Also handles a plain array of
 * scalars (falling back to each element's index as the row label) since `TableView` routes
 * anything that isn't an array-of-objects here.
 */
export function KeyValueTable({ node }: { node: JsonNode }) {
  return (
    <table class="table-view__kv">
      <tbody>
        {(node.children ?? []).map((child, index) => {
          const rowLabel = child.key ?? String(child.index ?? index);
          return (
            <tr key={rowLabel}>
              <th scope="row">{rowLabel}</th>
              <td>
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
 * Renders an array of objects as a grid: one row per element, with column headers unioned across
 * every element's keys (so an element missing a key just shows an empty cell rather than
 * shifting other columns).
 */
export function ArrayGrid({ node }: { node: JsonNode }) {
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
    <table class="table-view__grid">
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
 * Chooses `ArrayGrid` for an array of objects, `KeyValueTable` for anything else with children
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
  return <KeyValueTable node={node} />;
}

