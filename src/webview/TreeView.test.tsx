import "./testSetup.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import { render, fireEvent, cleanup } from "@testing-library/preact";
import { TreeNode, defaultExpandedPaths, pathKey } from "./TreeView.tsx";
import type { JsonNode } from "../shared/types.ts";

const sampleTree: JsonNode = {
  kind: "object",
  path: [],
  children: [
    {
      kind: "object",
      key: "a",
      path: ["a"],
      children: [
        {
          kind: "object",
          key: "b",
          path: ["a", "b"],
          children: [{ kind: "number", key: "c", path: ["a", "b", "c"], value: 1 }],
        },
      ],
    },
    { kind: "string", key: "s", path: ["s"], value: "hello" },
    { kind: "null", key: "n", path: ["n"], value: null },
  ],
};

test("defaultExpandedPaths includes every object/array node at depth < 2", () => {
  const expanded = defaultExpandedPaths(sampleTree);
  assert.ok(expanded.has(pathKey([])), "root (depth 0) is expanded by default");
  assert.ok(expanded.has(pathKey(["a"])), "depth-1 node is expanded by default");
  assert.ok(!expanded.has(pathKey(["a", "b"])), "depth-2 node is collapsed by default");
});

test("renders a chevron and child-count badge for object/array nodes", () => {
  const expanded = defaultExpandedPaths(sampleTree);
  const { container } = render(
    <TreeNode node={sampleTree} expandedPaths={expanded} onToggle={() => {}} />,
  );
  const badges = Array.from(container.querySelectorAll(".tree-node__badge")).map((el) => el.textContent);
  assert.ok(badges.includes("{3}"), `expected root badge {3} among ${JSON.stringify(badges)}`);
  cleanup();
});

test("renders leaf values with a data-kind attribute matching their type", () => {
  const expanded = defaultExpandedPaths(sampleTree);
  const { container } = render(
    <TreeNode node={sampleTree} expandedPaths={expanded} onToggle={() => {}} />,
  );
  const stringValue = container.querySelector('[data-kind="string"]');
  const nullValue = container.querySelector('[data-kind="null"]');
  assert.equal(stringValue?.textContent, '"hello"');
  assert.equal(nullValue?.textContent, "null");
  cleanup();
});

test("clicking a chevron toggles only that node's own path", () => {
  let currentExpanded = defaultExpandedPaths(sampleTree);
  const onToggle = (key: string) => {
    const next = new Set(currentExpanded);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    currentExpanded = next;
    rerender();
  };

  const { container, rerender: doRerender } = render(
    <TreeNode node={sampleTree} expandedPaths={currentExpanded} onToggle={onToggle} />,
  );
  function rerender() {
    doRerender(<TreeNode node={sampleTree} expandedPaths={currentExpanded} onToggle={onToggle} />);
  }

  assert.ok(currentExpanded.has(pathKey(["a"])), "precondition: \"a\" starts expanded");
  const toggleButtons = Array.from(container.querySelectorAll(".tree-node__toggle"));
  const aToggle = toggleButtons.find((btn) => btn.textContent?.includes("a"));
  assert.ok(aToggle, "expected a toggle button for node \"a\"");
  fireEvent.click(aToggle as Element);

  assert.ok(!currentExpanded.has(pathKey(["a"])), "\"a\" should now be collapsed");
  assert.ok(currentExpanded.has(pathKey([])), "root's own state must be unaffected by toggling \"a\"");
  cleanup();
});
