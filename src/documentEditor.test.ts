import { test } from "node:test";
import assert from "node:assert/strict";
import { toJsonPath, parseInputValue } from "./shared/valueParser.ts";
import { modify, applyEdits, parseTree, findNodeAtLocation } from "jsonc-parser";

test("toJsonPath converts numeric strings to numbers", () => {
  assert.deepEqual(toJsonPath(["users", "0", "name"]), ["users", 0, "name"]);
  assert.deepEqual(toJsonPath(["packages", "node_modules/foo", "version"]), ["packages", "node_modules/foo", "version"]);
});

test("parseInputValue correctly identifies primitives", () => {
  assert.equal(parseInputValue("true"), true);
  assert.equal(parseInputValue("false"), false);
  assert.equal(parseInputValue("null"), null);
  assert.equal(parseInputValue("42"), 42);
  assert.equal(parseInputValue("-3.14"), -3.14);
  assert.equal(parseInputValue('"hello world"'), "hello world");
  assert.equal(parseInputValue("regular string"), "regular string");
});

test("jsonc-parser modifies top-level and nested values", () => {
  const json = JSON.stringify({ name: "old", nested: { count: 1 } }, null, 2);
  const edits1 = modify(json, ["name"], "new", { formattingOptions: { insertSpaces: true, tabSize: 2 } });
  const res1 = JSON.parse(applyEdits(json, edits1));
  assert.equal(res1.name, "new");

  const edits2 = modify(json, ["nested", "count"], 99, { formattingOptions: { insertSpaces: true, tabSize: 2 } });
  const res2 = JSON.parse(applyEdits(json, edits2));
  assert.equal(res2.nested.count, 99);
});

test("renaming key in JSON AST replaces the property key correctly", () => {
  const json = JSON.stringify({ title: "My Title", obj: { oldKey: "value" } }, null, 2);
  const root = parseTree(json);
  assert.ok(root);

  const valueNode = findNodeAtLocation(root, ["obj", "oldKey"]);
  assert.ok(valueNode?.parent);
  const keyNode = valueNode.parent.children?.[0];
  assert.ok(keyNode);

  const newJson = json.substring(0, keyNode.offset) + JSON.stringify("newKey") + json.substring(keyNode.offset + keyNode.length);
  const parsed = JSON.parse(newJson);
  assert.deepEqual(parsed, { title: "My Title", obj: { newKey: "value" } });
});
