import "./testSetup.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import { render, cleanup, fireEvent } from "@testing-library/preact";
import { TableView } from "./TableView.tsx";
import type { JsonNode } from "../shared/types.ts";

test("renders a plain object as one row per key", () => {
  const node: JsonNode = {
    kind: "object",
    path: [],
    children: [
      { kind: "string", key: "name", path: ["name"], value: "Ada" },
      { kind: "number", key: "age", path: ["age"], value: 30 },
    ],
  };
  const { container } = render(<TableView node={node} />);
  const rows = container.querySelectorAll(".kv-row");
  assert.equal(rows.length, 2);
  assert.equal(rows[0].querySelector(".kv-key")?.textContent, "name");
  assert.equal(rows[1].querySelector(".kv-key")?.textContent, "age");
  cleanup();
});

test("renders an array of objects as a grid with unioned column headers", () => {
  const node: JsonNode = {
    kind: "array",
    path: [],
    children: [
      {
        kind: "object",
        index: 0,
        path: ["0"],
        children: [
          { kind: "string", key: "name", path: ["0", "name"], value: "Ada" },
          { kind: "string", key: "role", path: ["0", "role"], value: "Engineer" },
        ],
      },
      {
        kind: "object",
        index: 1,
        path: ["1"],
        children: [{ kind: "string", key: "name", path: ["1", "name"], value: "Grace" }],
      },
    ],
  };
  const { container } = render(<TableView node={node} />);
  const headers = Array.from(container.querySelectorAll(".table-view__grid thead th")).map(
    (el) => el.textContent,
  );
  assert.deepEqual(headers, ["name", "role"], "headers are unioned across all elements");
  const rows = container.querySelectorAll(".table-view__grid tbody tr");
  assert.equal(rows.length, 2);
  const secondRowCells = rows[1].querySelectorAll("td");
  assert.equal(secondRowCells[0].textContent, '"Grace"');
  assert.equal(secondRowCells[1].textContent, "", "missing field renders an empty cell, not a shift");
  cleanup();
});

test("renders a nested object and array as nested tables showing key-value pairs", () => {
  const node: JsonNode = {
    kind: "object",
    path: [],
    children: [
      {
        kind: "object",
        key: "address",
        path: ["address"],
        children: [{ kind: "string", key: "city", path: ["address", "city"], value: "London" }],
      },
      {
        kind: "array",
        key: "tags",
        path: ["tags"],
        children: [{ kind: "string", index: 0, path: ["tags", "0"], value: "a" }],
      },
    ],
  };
  const { container } = render(<TableView node={node} />);
  const nestedTables = container.querySelectorAll(".table-view__nested table");
  assert.ok(nestedTables.length >= 2, "renders nested tables for nested container nodes");
  assert.ok(container.textContent?.includes("London"), "nested object content renders inline as key-value pairs");
  assert.ok(container.textContent?.includes('"a"'), "nested array content renders inline");
  cleanup();
});

test("collapses nested table when not in expandedPaths", () => {
  const node: JsonNode = {
    kind: "object",
    path: [],
    children: [
      {
        kind: "object",
        key: "address",
        path: ["address"],
        children: [{ kind: "string", key: "city", path: ["address", "city"], value: "London" }],
      },
    ],
  };
  const { container } = render(<TableView node={node} expandedPaths={new Set()} />);
  const nestedTable = container.querySelector(".table-view__nested table");
  assert.equal(nestedTable, null, "nested table should be collapsed");
  const toggle = container.querySelector(".table-view__toggle");
  assert.ok(toggle, "toggle button should be present");
  cleanup();
});

test("hides badges on expanded tables when showBadges is false", () => {
  const node: JsonNode = {
    kind: "object",
    path: [],
    children: [
      {
        kind: "object",
        key: "address",
        path: ["address"],
        children: [{ kind: "string", key: "city", path: ["address", "city"], value: "London" }],
      },
    ],
  };
  const { container } = render(
    <TableView node={node} expandedPaths={new Set(["address"])} showBadges={false} />,
  );
  const toggle = container.querySelector(".table-view__toggle");
  assert.equal(toggle, null, "toggle button badge should be hidden when showBadges is false");
  const nestedTable = container.querySelector(".table-view__nested table");
  assert.ok(nestedTable, "nested table remains visible");
  cleanup();
});

test("calls onToggle when toggle button is clicked", () => {
  const node: JsonNode = {
    kind: "object",
    path: [],
    children: [
      {
        kind: "object",
        key: "address",
        path: ["address"],
        children: [{ kind: "string", key: "city", path: ["address", "city"], value: "London" }],
      },
    ],
  };
  let toggledKey = "";
  const { container } = render(
    <TableView
      node={node}
      expandedPaths={new Set(["address"])}
      onToggle={(key) => {
        toggledKey = key;
      }}
    />,
  );
  const toggle = container.querySelector(".table-view__toggle");
  assert.ok(toggle);
  fireEvent.click(toggle);
  assert.equal(toggledKey, "address");
  cleanup();
});

test("renders the value directly for a scalar-root document, not an empty table", () => {
  const node: JsonNode = { kind: "number", path: [], value: 42 };
  const { container } = render(<TableView node={node} />);
  assert.equal(container.querySelector(".table-view__kv"), null, "no empty table renders");
  const scalarRoot = container.querySelector(".table-view__scalar-root");
  assert.equal(scalarRoot?.textContent, "42");
  cleanup();
});

test("falls back to a key-value table for a plain array of scalars", () => {
  const node: JsonNode = {
    kind: "array",
    path: [],
    children: [
      { kind: "number", index: 0, path: ["0"], value: 1 },
      { kind: "number", index: 1, path: ["1"], value: 2 },
    ],
  };
  const { container } = render(<TableView node={node} />);
  const rows = container.querySelectorAll(".kv-row");
  assert.equal(rows.length, 2);
  assert.equal(rows[0].querySelector(".kv-key")?.textContent, "0");
  cleanup();
});
