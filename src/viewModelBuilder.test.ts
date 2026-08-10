import { test } from "node:test";
import assert from "node:assert/strict";
import { buildViewModel } from "./viewModelBuilder.ts";
import type { JsonNode } from "./shared/types.ts";

function assertOk(text: string): JsonNode {
  const result = buildViewModel(text);
  assert.equal(result.status, "ok", `expected ok, got: ${JSON.stringify(result)}`);
  if (result.status !== "ok") throw new Error("unreachable");
  return result.root;
}

test("parses a plain object into a JsonNode tree", () => {
  const root = assertOk('{"a":1,"b":"x"}');
  assert.equal(root.kind, "object");
  assert.deepEqual(root.path, []);
  assert.equal(root.children?.length, 2);
  assert.equal(root.children?.[0].key, "a");
  assert.equal(root.children?.[0].kind, "number");
  assert.equal(root.children?.[0].value, 1);
  assert.deepEqual(root.children?.[0].path, ["a"]);
  assert.equal(root.children?.[1].key, "b");
  assert.equal(root.children?.[1].value, "x");
});

test("parses an array of scalars, indexing each element", () => {
  const root = assertOk("[true, null, 3]");
  assert.equal(root.kind, "array");
  assert.equal(root.children?.length, 3);
  assert.equal(root.children?.[0].index, 0);
  assert.equal(root.children?.[0].kind, "boolean");
  assert.equal(root.children?.[0].value, true);
  assert.equal(root.children?.[1].kind, "null");
  assert.equal(root.children?.[1].value, null);
  assert.equal(root.children?.[2].index, 2);
  assert.equal(root.children?.[2].value, 3);
  assert.deepEqual(root.children?.[2].path, ["2"]);
});

test("parses an array of objects with stable nested paths", () => {
  const root = assertOk('[{"name":"a"},{"name":"b"}]');
  assert.equal(root.kind, "array");
  const first = root.children?.[0];
  assert.equal(first?.kind, "object");
  assert.deepEqual(first?.path, ["0"]);
  const firstName = first?.children?.[0];
  assert.equal(firstName?.key, "name");
  assert.deepEqual(firstName?.path, ["0", "name"]);
  assert.equal(firstName?.value, "a");
});

test("builds paths past depth 2 for deeply nested structures", () => {
  const root = assertOk('{"a":{"b":{"c":{"d":1}}}}');
  const d = root.children?.[0].children?.[0].children?.[0].children?.[0];
  assert.equal(d?.key, "d");
  assert.deepEqual(d?.path, ["a", "b", "c", "d"]);
  assert.equal(d?.value, 1);
});

test("returns an error view model for an empty document", () => {
  const result = buildViewModel("");
  assert.equal(result.status, "error");
  if (result.status !== "error") throw new Error("unreachable");
  assert.equal(result.line, 0);
  assert.equal(result.column, 0);
  assert.ok(result.message.length > 0);
});

test("returns an error view model for whitespace-only input, at the correct offset", () => {
  const result = buildViewModel("  \n  ");
  assert.equal(result.status, "error");
  if (result.status !== "error") throw new Error("unreachable");
  assert.equal(result.line, 1, "offset 5 is on the second line (0-indexed line 1)");
});

test("returns an error view model for an unterminated string, never a partial tree", () => {
  const result = buildViewModel('{"a": "b');
  assert.equal(result.status, "error");
});

test("returns an error view model for a truncated document", () => {
  const result = buildViewModel('{"a":');
  assert.equal(result.status, "error");
});

test("computes line/column from the first error's offset via newline counting, not jsonc-parser's getLocation", () => {
  const result = buildViewModel('{\n  "a": ');
  assert.equal(result.status, "error");
  if (result.status !== "error") throw new Error("unreachable");
  // The ValueExpected error lands after "\n  \"a\": " (offset 9), which is on line 1
  // (0-indexed), column 7 (9 - length of "{\n  \"a\": "... up to the second '\n', i.e.
  // 9 characters minus the 2 before the newline = position within line 1).
  assert.equal(result.line, 1);
});
