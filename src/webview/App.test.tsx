import "./testSetup.ts";
import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { render, fireEvent, cleanup, act } from "@testing-library/preact";
import { App } from "./App.tsx";
import type { HostMessage } from "../shared/types.ts";

function sendHostMessage(message: HostMessage) {
  act(() => {
    window.dispatchEvent(new MessageEvent("message", { data: message }));
  });
}

const sampleTree = {
  kind: "object" as const,
  path: [],
  children: [
    { kind: "string" as const, key: "a", path: ["a"], value: "x" },
    { kind: "object" as const, key: "b", path: ["b"], children: [{ kind: "number" as const, key: "c", path: ["b", "c"], value: 1 }] },
  ],
};

test("renders the inline error banner and no view for an error view model", () => {
  const { container } = render(<App postMessage={mock.fn()} />);
  sendHostMessage({
    type: "init",
    viewMode: "tree",
    viewModel: { status: "error", message: "Unexpected token", line: 2, column: 4 },
  });

  const banner = container.querySelector(".app__error-banner");
  assert.ok(banner, "error banner must render");
  assert.ok(banner!.textContent?.includes("Unexpected token"));
  assert.equal(container.querySelector(".app__content"), null, "no view renders alongside the error");
  cleanup();
});

test("an init message renders the initial view mode and view model", () => {
  const { container } = render(<App postMessage={mock.fn()} />);
  sendHostMessage({ type: "init", viewMode: "table", viewModel: { status: "ok", root: sampleTree } });

  assert.ok(container.querySelector(".table-view__kv"), "table view mode renders TableView");
  cleanup();
});

test("an update message replaces the view model without changing the current view mode", () => {
  const { container } = render(<App postMessage={mock.fn()} />);
  sendHostMessage({ type: "init", viewMode: "table", viewModel: { status: "ok", root: sampleTree } });
  sendHostMessage({
    type: "update",
    viewModel: { status: "ok", root: { ...sampleTree, children: [] } },
  });

  assert.ok(container.querySelector(".table-view__kv"), "still in table mode after an update message");
  const rows = container.querySelectorAll(".table-view__kv tbody tr");
  assert.equal(rows.length, 0, "the updated (now-empty) view model is what's rendered");
  cleanup();
});

test("toggling view mode re-renders locally and notifies the host, without a new data request", () => {
  const postMessage = mock.fn();
  const { container } = render(<App postMessage={postMessage} />);
  sendHostMessage({ type: "init", viewMode: "tree", viewModel: { status: "ok", root: sampleTree } });

  const tableTab = Array.from(container.querySelectorAll('[role="tab"]')).find(
    (el) => el.textContent === "table",
  );
  assert.ok(tableTab);
  fireEvent.click(tableTab as Element);

  assert.ok(container.querySelector(".table-view__kv"), "switched to table view locally");
  assert.equal(postMessage.mock.callCount(), 1);
  assert.deepEqual(postMessage.mock.calls[0].arguments[0], { type: "viewModeChanged", viewMode: "table" });
  cleanup();
});

test("expand-all and collapse-all mutate the full expandedPaths set", () => {
  const { container } = render(<App postMessage={mock.fn()} />);
  sendHostMessage({ type: "init", viewMode: "tree", viewModel: { status: "ok", root: sampleTree } });

  const collapseAll = Array.from(container.querySelectorAll("button")).find(
    (el) => el.textContent === "Collapse all",
  );
  fireEvent.click(collapseAll as Element);
  assert.equal(container.querySelectorAll(".tree-node__children").length, 0, "everything collapsed");

  const expandAll = Array.from(container.querySelectorAll("button")).find(
    (el) => el.textContent === "Expand all",
  );
  fireEvent.click(expandAll as Element);
  // sampleTree has 2 expandable nodes (root, "b") — both should now show their children container.
  assert.equal(container.querySelectorAll(".tree-node__children").length, 2, "everything expanded");
  cleanup();
});
