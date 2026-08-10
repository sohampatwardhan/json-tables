/**
 * Registers a jsdom `window`/`document` on `globalThis` for webview component tests.
 * `@testing-library/preact` expects a browser-like global environment (no framework here
 * provides one automatically, unlike Jest's `jsdom` test environment) — importing this module
 * first in a test file installs it before any component renders.
 */
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});

const globalTarget = globalThis as unknown as Record<string, unknown>;
for (const key of Object.getOwnPropertyNames(dom.window)) {
  if (key in globalTarget) continue;
  try {
    globalTarget[key] = (dom.window as unknown as Record<string, unknown>)[key];
  } catch {
    // Some jsdom window properties throw on access outside a real browser context
    // (cross-origin-style guards); skipping them is safe since tests never touch them.
  }
}
// `window`/`document`/`navigator` must go through defineProperty: Node.js 21+ already defines a
// getter-only global `navigator`, and a plain assignment throws past it. Event/MessageEvent/
// CustomEvent must be *overridden* (not skipped like the loop above does for existing keys):
// Node.js also ships its own built-in Event/MessageEvent globals, and jsdom's `dispatchEvent`
// rejects an event constructed from any realm other than its own — a test that does
// `new MessageEvent(...)` needs jsdom's constructor, not Node's, for `window.dispatchEvent` to
// accept the result.
for (const [key, value] of Object.entries({
  window: dom.window,
  document: dom.window.document,
  navigator: dom.window.navigator,
  Event: dom.window.Event,
  MessageEvent: dom.window.MessageEvent,
  CustomEvent: dom.window.CustomEvent,
})) {
  Object.defineProperty(globalTarget, key, { value, configurable: true, writable: true });
}
