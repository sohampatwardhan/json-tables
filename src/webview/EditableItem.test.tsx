import "./testSetup.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import { render, fireEvent, cleanup } from "@testing-library/preact";
import { EditableKey, EditableValue } from "./EditableItem.tsx";
import type { JsonNode } from "../shared/types.ts";

test("EditableKey enters edit mode on double-click and commits on Enter", () => {
  let renamed: { path: string[]; newKey: string } | null = null;
  const { container } = render(
    <EditableKey
      path={["user", "name"]}
      currentKey="name"
      onRenameKey={(path, newKey) => {
        renamed = { path, newKey };
      }}
    />,
  );

  const span = container.querySelector(".key-editable");
  assert.ok(span);
  assert.equal(span.textContent, "name");

  fireEvent.dblClick(span);

  const input = container.querySelector("input");
  assert.ok(input, "input rendered after double click");
  assert.equal(input.value, "name");

  fireEvent.input(input, { target: { value: "fullName" } });
  fireEvent.keyDown(input, { key: "Enter" });

  assert.deepEqual(renamed, { path: ["user", "name"], newKey: "fullName" });
  cleanup();
});

test("EditableValue enters edit mode on double-click and commits parsed value on Enter", () => {
  let edited: { path: string[]; value: any } | null = null;
  const node: JsonNode = { kind: "number", key: "age", path: ["user", "age"], value: 30 };

  const { container } = render(
    <EditableValue
      node={node}
      onEditValue={(path, value) => {
        edited = { path, value };
      }}
    />,
  );

  const span = container.querySelector(".val-editable");
  assert.ok(span);
  assert.equal(span.textContent, "30");

  fireEvent.dblClick(span);

  const input = container.querySelector("input");
  assert.ok(input, "input rendered after double click");
  assert.equal(input.value, "30");

  fireEvent.input(input, { target: { value: "45" } });
  fireEvent.keyDown(input, { key: "Enter" });

  assert.deepEqual(edited, { path: ["user", "age"], value: 45 });
  cleanup();
});

test("EditableValue handles string quoting cleanly", () => {
  let edited: { path: string[]; value: any } | null = null;
  const node: JsonNode = { kind: "string", key: "city", path: ["city"], value: "London" };

  const { container } = render(
    <EditableValue
      node={node}
      onEditValue={(path, value) => {
        edited = { path, value };
      }}
    />,
  );

  const span = container.querySelector(".val-editable");
  assert.ok(span);

  fireEvent.dblClick(span);
  const input = container.querySelector("input");
  assert.ok(input);

  fireEvent.input(input, { target: { value: "Paris" } });
  fireEvent.keyDown(input, { key: "Enter" });

  assert.deepEqual(edited, { path: ["city"], value: "Paris" });
  cleanup();
});
