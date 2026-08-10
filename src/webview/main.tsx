import { render } from "preact";
import { App } from "./App";
import "./theme.css";

declare function acquireVsCodeApi(): { postMessage: (message: unknown) => void };

const vscode = acquireVsCodeApi();

render(<App postMessage={(message) => vscode.postMessage(message)} />, document.body);

// Sent only after `render` has mounted `App` (which attaches its own message listener in a
// `useEffect` during mount) — the extension host waits for this before sending `init`, so the
// handshake is deterministic rather than depending on how fast the page loads.
vscode.postMessage({ type: "ready" });
