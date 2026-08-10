import "./testSetup.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import { render, cleanup } from "@testing-library/preact";
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
  const rows = container.querySelectorAll(".table-view__kv tbody tr");
  assert.equal(rows.length, 2);
  assert.equal(rows[0].querySelector("th")?.textContent, "name");
  assert.equal(rows[1].querySelector("th")?.textContent, "age");
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

test("renders a nested object/array cell as a preview badge, never inline", () => {
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
  const objectBadge = container.querySelector('[data-kind="object"]');
  const arrayBadge = container.querySelector('[data-kind="array"]');
  assert.equal(objectBadge?.textContent, "{1}");
  assert.equal(arrayBadge?.textContent, "[1]");
  assert.equal(container.textContent?.includes("London"), false, "nested content never renders inline");
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
  const rows = container.querySelectorAll(".table-view__kv tbody tr");
  assert.equal(rows.length, 2);
  assert.equal(rows[0].querySelector("th")?.textContent, "0");
  cleanup();
});
