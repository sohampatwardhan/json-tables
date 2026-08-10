/**
 * Shared data contract between the extension host and the webview. Every type here crosses
 * the `postMessage` boundary as plain JSON — the VS Code webview API structurally clones
 * messages, so no class instance, function, or non-JSON value may appear anywhere inside them.
 */

/** The seven JSON value shapes a {@link JsonNode} can represent. */
export type NodeKind = "object" | "array" | "string" | "number" | "boolean" | "null";

/**
 * One node in the parsed JSON tree. `path` is the key/index chain from the root, joined into a
 * stable string id (e.g. `"users.0.name"`) — the Tree/Column views use it to key expansion and
 * selection state, so it must stay stable across a live-refresh rebuild as long as the
 * document's shape is unchanged.
 */
export interface JsonNode {
  kind: NodeKind;
  /** The object key this node is stored under, if its parent is an object. */
  key?: string;
  /** The array index this node is stored at, if its parent is an array. */
  index?: number;
  /** Present only for scalar kinds (`string`/`number`/`boolean`/`null`). */
  value?: string | number | boolean | null;
  /** Present only for `object`/`array` kinds. */
  children?: JsonNode[];
  path: string[];
}

/**
 * The result of parsing a document's text: either a complete tree, or a parse error. The two
 * variants are mutually exclusive on purpose — `buildViewModel` never returns a partial tree
 * alongside an error, so the renderer never has to guess which fields are trustworthy.
 */
export type ViewModel =
  | { status: "ok"; root: JsonNode }
  | { status: "error"; message: string; line: number; column: number };

/** The three interactive rendering modes the webview can switch between. */
export type ViewMode = "tree" | "column" | "table";

/** Messages the extension host sends to the webview. */
export type HostMessage =
  | { type: "init"; viewModel: ViewModel; viewMode: ViewMode }
  | { type: "update"; viewModel: ViewModel };

/** Messages the webview sends to the extension host. */
export type WebviewMessage =
  | { type: "ready" }
  | { type: "viewModeChanged"; viewMode: ViewMode }
  | { type: "editValue"; path: string[]; value: any }
  | { type: "renameKey"; path: string[]; newKey: string };
