import type { JsonNode } from "../shared/types";

/** Joins a `JsonNode.path` into the stable string key `expandedPaths` is keyed by. */
export function pathKey(path: string[]): string {
  return path.join(".");
}

/** Every path whose node would show a chevron (objects/arrays), for expand-all/collapse-all. */
export function collectExpandablePaths(node: JsonNode, out: string[] = []): string[] {
  if (node.kind === "object" || node.kind === "array") {
    out.push(pathKey(node.path));
    for (const child of node.children ?? []) collectExpandablePaths(child, out);
  }
  return out;
}

/**
 * The `expandedPaths` set a freshly loaded document starts with: every object/array node at
 * nesting depth less than 2, matching THRIVE's own default of auto-expanding the first two
 * levels. `App` (task 4.2) calls this once per view model to seed its `expandedPaths` state —
 * `TreeNode` itself only ever reads that set, it never computes a depth-based fallback, so
 * there is exactly one place this default is defined.
 */
export function defaultExpandedPaths(root: JsonNode): Set<string> {
  const expanded = new Set<string>();
  const visit = (node: JsonNode) => {
    if ((node.kind === "object" || node.kind === "array") && node.path.length < 2) {
      expanded.add(pathKey(node.path));
    }
    for (const child of node.children ?? []) visit(child);
  };
  visit(root);
  return expanded;
}

interface TreeNodeProps {
  node: JsonNode;
  expandedPaths: Set<string>;
  onToggle: (key: string) => void;
}

/**
 * One row of the Tree view, recursing into its children when expanded. `expandedPaths` is owned
 * entirely by the caller (`App`) — this component never tracks expand/collapse state itself, so
 * a global expand-all/collapse-all control can mutate the whole tree's state in one place rather
 * than reaching into every node.
 */
export function TreeNode({ node, expandedPaths, onToggle }: TreeNodeProps) {
  const key = pathKey(node.path);
  const label = node.key ?? (node.index !== undefined ? String(node.index) : "");

  if (node.kind === "object" || node.kind === "array") {
    const expanded = expandedPaths.has(key);
    const count = node.children?.length ?? 0;
    const badge = node.kind === "array" ? `[${count}]` : `{${count}}`;
    return (
      <div class="tree-node" data-expanded={expanded}>
        <button
          type="button"
          class="tree-node__toggle"
          aria-expanded={expanded}
          onClick={() => onToggle(key)}
        >
          <span class={`tree-node__chevron ${expanded ? "tree-node__chevron--expanded" : ""}`}>
            {"›"}
          </span>
          {label && <span class="tree-node__label">{label}</span>}
          <span class="tree-node__badge">{badge}</span>
        </button>
        {expanded && (
          <div class="tree-node__children">
            {(node.children ?? []).map((child) => (
              <TreeNode key={pathKey(child.path)} node={child} expandedPaths={expandedPaths} onToggle={onToggle} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div class="tree-node tree-node--leaf">
      {label && <span class="tree-node__label">{label}: </span>}
      <span class="tree-node__value" data-kind={node.kind}>
        {node.kind === "string" ? `"${String(node.value)}"` : String(node.value)}
      </span>
    </div>
  );
}
