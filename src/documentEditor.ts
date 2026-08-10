import * as vscode from "vscode";
import { modify, parseTree, findNodeAtLocation } from "jsonc-parser";
import { toJsonPath } from "./shared/valueParser.ts";

/** Modifies the value in `document` at `rawPath` to `newValue` using `vscode.workspace.applyEdit`. */
export async function editDocumentValue(
  document: vscode.TextDocument,
  rawPath: string[],
  newValue: any,
): Promise<boolean> {
  const jsonPath = toJsonPath(rawPath);
  const edits = modify(document.getText(), jsonPath, newValue, {
    formattingOptions: {
      insertSpaces: true,
      tabSize: 2,
    },
  });
  if (!edits || edits.length === 0) return false;

  const workspaceEdit = new vscode.WorkspaceEdit();
  for (const edit of edits) {
    const start = document.positionAt(edit.offset);
    const end = document.positionAt(edit.offset + edit.length);
    workspaceEdit.replace(document.uri, new vscode.Range(start, end), edit.content);
  }
  return vscode.workspace.applyEdit(workspaceEdit);
}

/** Renames a property key in `document` at `rawPath` from its old name to `newKey`. */
export async function renameDocumentKey(
  document: vscode.TextDocument,
  rawPath: string[],
  newKey: string,
): Promise<boolean> {
  const text = document.getText();
  const root = parseTree(text);
  if (!root) return false;

  const jsonPath = toJsonPath(rawPath);
  const valueNode = findNodeAtLocation(root, jsonPath);
  if (!valueNode || !valueNode.parent || valueNode.parent.type !== "property") return false;

  const keyNode = valueNode.parent.children?.[0];
  if (!keyNode) return false;

  const start = document.positionAt(keyNode.offset);
  const end = document.positionAt(keyNode.offset + keyNode.length);
  const workspaceEdit = new vscode.WorkspaceEdit();
  workspaceEdit.replace(document.uri, new vscode.Range(start, end), JSON.stringify(newKey));
  return vscode.workspace.applyEdit(workspaceEdit);
}
