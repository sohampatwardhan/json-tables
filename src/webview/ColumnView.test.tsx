import "./testSetup.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import { render, fireEvent, cleanup } from "@testing-library/preact";
import { ColumnView } from "./ColumnView.tsx";
import type { JsonNode } from "../shared/types.ts";

const sampleTree: JsonNode = {
  kind: "object",
  path: [],
  children: [
    {
      kind: "object",
      key: "user",
      path: ["user"],
      children: [
        { kind: "string", key: "name", path: ["user", "name"], value: "Ada" },
        {
          kind: "object",
          key: "address",
          path: ["user", "address"],
          children: [{ kind: "string", key: "city", path: ["user", "address", "city"], value: "London" }],
        },
      ],
    },
    { kind: "number", key: "count", path: ["count"], value: 3 },
  ],
};

function Harness() {
  return null;
}
void Harness;

test("selecting an object entry appends exactly one column", () => {
  let selectedPath: string[] = [];
  const { container, rerender } = render(
    <ColumnView root={sampleTree} selectedPath={selectedPath} onSelectPath={(p) => (selectedPath = p)} />,
  );
  const columnsBefore = container.querySelectorAll(".column-view__column").length;
  assert.equal(columnsBefore, 1, "starts with just the root column");

  const userButton = Array.from(container.querySelectorAll(".column-view__entry")).find((el) =>
    el.textContent?.includes("user"),
  );
  assert.ok(userButton);
  fireEvent.click(userButton as Element);
  assert.deepEqual(selectedPath, ["user"]);

  rerender(<ColumnView root={sampleTree} selectedPath={selectedPath} onSelectPath={(p) => (selectedPath = p)} />);
  const columnsAfter = container.querySelectorAll(".column-view__column").length;
  assert.equal(columnsAfter, 2, "exactly one new column appears after selecting an object entry");
  cleanup();
});

test("selecting a scalar entry never appends a column, and shows it in the detail pane", () => {
  const { container } = render(
    <ColumnView root={sampleTree} selectedPath={[]} onSelectPath={() => {
      throw new Error("onSelectPath must not be called for a scalar entry");
    }} />,
  );
  const columnsBefore = container.querySelectorAll(".column-view__column").length;

  const countButton = Array.from(container.querySelectorAll(".column-view__entry")).find((el) =>
    el.textContent?.includes("count"),
  );
  assert.ok(countButton);
  fireEvent.click(countButton as Element);

  const columnsAfter = container.querySelectorAll(".column-view__column").length;
  assert.equal(columnsAfter, columnsBefore, "scalar selection must never add a column");
  const detail = container.querySelector(".column-view__detail-value");
  assert.equal(detail?.textContent, "3");
  cleanup();
});

test("dragging a column's resize handle changes only that column's width", () => {
  const { container } = render(
    <ColumnView root={sampleTree} selectedPath={["user"]} onSelectPath={() => {}} />,
  );
  const columns = Array.from(container.querySelectorAll<HTMLElement>(".column-view__column"));
  assert.equal(columns.length, 2, "root column + \"user\" column");
  const [firstColumn, secondColumn] = columns;
  const firstWidthBefore = firstColumn.style.width;
  const secondWidthBefore = secondColumn.style.width;

  const handle = secondColumn.querySelector(".column-view__resize-handle") as Element;
  fireEvent.pointerDown(handle, { clientX: 100 });
  fireEvent.pointerMove(window, { clientX: 160 });
  fireEvent.pointerUp(window, { clientX: 160 });

  assert.equal(firstColumn.style.width, firstWidthBefore, "the other column's width must be unaffected");
  assert.notEqual(secondColumn.style.width, secondWidthBefore, "the dragged column's width must change");
  cleanup();
});
