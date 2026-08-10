/** 32 hex characters, sufficient entropy for a per-load CSP nonce (not a security token beyond that). */
export function generateNonce(): string {
  let nonce = "";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    nonce += chars[Math.floor(Math.random() * chars.length)];
  }
  return nonce;
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
