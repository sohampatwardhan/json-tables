import { parseTree, type Node as JsoncNode, type ParseError } from "jsonc-parser";
import type { JsonNode, NodeKind, ViewModel } from "./shared/types.ts";

const NODE_KIND_BY_JSONC_TYPE: Record<string, NodeKind> = {
  object: "object",
  array: "array",
  string: "string",
  number: "number",
  boolean: "boolean",
  null: "null",
};

/**
 * Converts jsonc-parser's own `Node` tree into this extension's `JsonNode` shape. jsonc-parser
 * represents an object's entries as intermediate `property` nodes (each with exactly two
 * children: the key's string node and the value node) rather than flattening key/value onto the
 * object directly — this walk un-nests that representation into `key`-bearing `JsonNode`s.
 */
function convertNode(node: JsoncNode, path: string[]): JsonNode {
  if (node.type === "object") {
    const children = (node.children ?? []).map((propertyNode) => {
      const [keyNode, valueNode] = propertyNode.children ?? [];
      const key = String(keyNode?.value ?? "");
      const child = convertNode(valueNode, [...path, key]);
      child.key = key;
      return child;
    });
    return { kind: "object", path, children };
  }

  if (node.type === "array") {
    const children = (node.children ?? []).map((childNode, index) =>
      convertNode(childNode, [...path, String(index)]),
    );
    for (const [index, child] of children.entries()) {
      child.index = index;
    }
    return { kind: "array", path, children };
  }

  const kind = NODE_KIND_BY_JSONC_TYPE[node.type];
  return { kind, path, value: node.value };
}

/** Counts `\n` characters in `text` up to `offset` to derive a 0-indexed `{line, column}` pair. */
function offsetToLineColumn(text: string, offset: number): { line: number; column: number } {
  let line = 0;
  let lastNewlineIndex = -1;
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text[i] === "\n") {
      line++;
      lastNewlineIndex = i;
    }
  }
  return { line, column: offset - lastNewlineIndex - 1 };
}

function describeError(error: ParseError): string {
  // jsonc-parser's ParseErrorCode enum values aren't self-describing at runtime (they're const
  // enums, inlined to numbers); a fixed lookup keeps the message readable without importing the
  // non-const `printParseErrorCode` helper just for this.
  const codes: Record<number, string> = {
    1: "Invalid symbol",
    2: "Invalid number format",
    3: "Property name expected",
    4: "Value expected",
    5: "Colon expected",
    6: "Comma expected",
    7: "Closing brace expected",
    8: "Closing bracket expected",
    9: "End of file expected",
    10: "Invalid comment",
    11: "Unexpected end of comment",
    12: "Unexpected end of string",
    13: "Unexpected end of number",
    14: "Invalid unicode escape",
    15: "Invalid escape character",
    16: "Invalid character",
  };
  return codes[error.error] ?? "Invalid JSON";
}

/**
 * Parses `text` (JSON or JSONC) into a `ViewModel`. Never returns a partial tree alongside a
 * parse error — `parseTree`'s `errors` out-parameter is checked before its return value is
 * trusted at all, so the caller can always assume `status: "ok"` means a complete tree.
 *
 * `line`/`column` are derived locally by counting newlines up to the error's offset, not via
 * jsonc-parser's `getLocation` (which resolves a JSON *path* at an offset, for completion/hover
 * providers — it has no line/column output; see 03_design.md's Current Technology Evidence for
 * how this was discovered). Keeping this function free of any VS Code API import is what makes
 * it a pure, directly unit-testable function.
 */
export function buildViewModel(text: string): ViewModel {
  const errors: ParseError[] = [];
  const root = parseTree(text, errors, { allowTrailingComma: true });

  if (errors.length > 0 || root === undefined) {
    const firstError = errors[0];
    const offset = firstError?.offset ?? 0;
    const { line, column } = offsetToLineColumn(text, offset);
    const message = firstError ? describeError(firstError) : "Document is empty";
    return { status: "error", message, line, column };
  }

  return { status: "ok", root: convertNode(root, []) };
}
