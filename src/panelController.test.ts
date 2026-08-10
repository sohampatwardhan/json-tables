import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { debounce } from "./debounce.ts";
import { renderWebviewHtml } from "./webviewHtml.ts";

test("debounce collapses a burst of calls into exactly one trailing invocation", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  let calls = 0;
  const debounced = debounce(() => calls++, 150);

  debounced();
  mock.timers.tick(50);
  debounced();
  mock.timers.tick(50);
  debounced();
  mock.timers.tick(50);
  assert.equal(calls, 0, "no call should have fired yet — each one reset the timer");

  mock.timers.tick(150);
  assert.equal(calls, 1, "exactly one call fires once the burst settles");

  mock.timers.reset();
});

test("debounce fires again for a call that arrives after the previous one settled", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  let calls = 0;
  const debounced = debounce(() => calls++, 150);

  debounced();
  mock.timers.tick(150);
  assert.equal(calls, 1);

  debounced();
  mock.timers.tick(150);
  assert.equal(calls, 2);

  mock.timers.reset();
});

test("renderWebviewHtml's CSP nonce matches the script and style tag nonces", () => {
  const html = renderWebviewHtml({
    scriptUri: "https://example.test/main.js",
    styleUri: "https://example.test/main.css",
    nonce: "abc123",
  });
  const cspMatch = html.match(/nonce-([A-Za-z0-9]+)/);
  assert.ok(cspMatch, "CSP meta tag must contain a nonce directive");
  const nonce = cspMatch![1];
  assert.equal(nonce, "abc123");

  const scriptTag = html.match(/<script[^>]*>/)?.[0] ?? "";
  const linkTag = html.match(/<link[^>]*>/)?.[0] ?? "";
  assert.ok(scriptTag.includes(`nonce="${nonce}"`), "script tag must carry the same nonce");
  assert.ok(linkTag.includes(`nonce="${nonce}"`), "link tag must carry the same nonce");
  assert.ok(html.includes("default-src 'none'"), "CSP must default-deny everything else");
});

test("renderWebviewHtml embeds the given script and style URIs verbatim", () => {
  const html = renderWebviewHtml({
    scriptUri: "vscode-webview://abc/main.js",
    styleUri: "vscode-webview://abc/main.css",
    nonce: "xyz",
  });
  assert.ok(html.includes('src="vscode-webview://abc/main.js"'));
  assert.ok(html.includes('href="vscode-webview://abc/main.css"'));
});
