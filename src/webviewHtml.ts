import { randomBytes } from "node:crypto";

/**
 * A per-load CSP nonce, from `crypto.randomBytes` rather than `Math.random()` — `Math.random`'s
 * output is predictable enough to make a poor nonce source even though this webview's CSP
 * mainly guards content this extension already controls, not third-party network content;
 * `randomBytes` costs nothing extra and removes the ambiguity entirely.
 */
export function generateNonce(): string {
  return randomBytes(16).toString("base64");
}

/**
 * Builds the webview's HTML shell. A pure function of already-resolved webview URIs and a
 * nonce — never touches `vscode` itself — so the CSP header's exact shape is independently
 * unit-testable. Under `default-src 'none'`, only the nonce'd `<script>` and `<link>` below are
 * allowed to load; any other script/style reference would be silently dropped by the browser.
 */
export function renderWebviewHtml(options: {
  scriptUri: string;
  styleUri: string;
  nonce: string;
}): string {
  const { scriptUri, styleUri, nonce } = options;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" nonce="${nonce}" href="${styleUri}">
  <title>JSON Tables</title>
</head>
<body>
  <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}
