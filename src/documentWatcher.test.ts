import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { watchDocument, type WorkspaceEvents } from "./documentWatcher.ts";

type ChangeListener = (event: { document: unknown }) => void;
type CloseListener = (document: unknown) => void;

function createFakeWorkspace() {
  let changeListeners: ChangeListener[] = [];
  let closeListeners: CloseListener[] = [];
  const workspace: WorkspaceEvents = {
    onDidChangeTextDocument: ((listener: ChangeListener) => {
      changeListeners.push(listener);
      return {
        dispose: () => {
          changeListeners = changeListeners.filter((registered) => registered !== listener);
        },
      };
    }) as unknown as WorkspaceEvents["onDidChangeTextDocument"],
    onDidCloseTextDocument: ((listener: CloseListener) => {
      closeListeners.push(listener);
      return {
        dispose: () => {
          closeListeners = closeListeners.filter((registered) => registered !== listener);
        },
      };
    }) as unknown as WorkspaceEvents["onDidCloseTextDocument"],
  };
  return {
    workspace,
    fireChange(document: unknown) {
      for (const listener of changeListeners) listener({ document });
    },
    fireClose(document: unknown) {
      for (const listener of closeListeners) listener(document);
    },
  };
}

test("watchDocument fires onChange only for the matching document", () => {
  const fake = createFakeWorkspace();
  const targetDoc = { uri: "target" };
  const otherDoc = { uri: "other" };
  const onChange = mock.fn();
  const onClose = mock.fn();

  watchDocument(fake.workspace, targetDoc as never, onChange, onClose);

  fake.fireChange(otherDoc);
  assert.equal(onChange.mock.callCount(), 0, "must not fire for a different document");

  fake.fireChange(targetDoc);
  assert.equal(onChange.mock.callCount(), 1, "must fire for the watched document");
});

test("watchDocument fires onClose only for the matching document", () => {
  const fake = createFakeWorkspace();
  const targetDoc = { uri: "target" };
  const otherDoc = { uri: "other" };
  const onChange = mock.fn();
  const onClose = mock.fn();

  watchDocument(fake.workspace, targetDoc as never, onChange, onClose);

  fake.fireClose(otherDoc);
  assert.equal(onClose.mock.callCount(), 0, "must not fire for a different document");

  fake.fireClose(targetDoc);
  assert.equal(onClose.mock.callCount(), 1, "must fire for the watched document");
});

test("watchDocument stops firing after its subscription is disposed", () => {
  const fake = createFakeWorkspace();
  const targetDoc = { uri: "target" };
  const onChange = mock.fn();
  const onClose = mock.fn();

  const subscription = watchDocument(fake.workspace, targetDoc as never, onChange, onClose);
  subscription.dispose();

  fake.fireChange(targetDoc);
  fake.fireClose(targetDoc);
  assert.equal(onChange.mock.callCount(), 0, "disposed watcher must not fire onChange");
  assert.equal(onClose.mock.callCount(), 0, "disposed watcher must not fire onClose");
});
