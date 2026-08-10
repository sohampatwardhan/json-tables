import * as esbuild from "esbuild";

const watch = process.argv.includes("--watch");
const production = process.argv.includes("--production");

/** @type {import("esbuild").BuildOptions} */
const extensionConfig = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/extension.js",
  platform: "node",
  format: "cjs",
  target: "node18",
  external: ["vscode"],
  // esbuild's `platform: "node"` default mainFields is `["main"]` only. jsonc-parser's `main`
  // points to a UMD build whose factory receives `require` through a renamed parameter
  // (`n(require, y)` calling `function(n, e) { ... n("./impl/format") ... }`) — esbuild can only
  // statically bundle a literal `require(...)` call, not one routed through a variable, so that
  // inner require is left unresolved and fails at actual runtime (`Cannot find module
  // './impl/format'`, relative to dist/extension.js, which has no such file). Preferring `module`
  // (jsonc-parser's real ESM build, with ordinary static imports) avoids the UMD indirection
  // entirely. Caught by simulating activate() against a fake `vscode` module locally — see
  // 04_tasks.md's task 1.1 amendment.
  mainFields: ["module", "main"],
  sourcemap: !production,
  minify: production,
};

/** @type {import("esbuild").BuildOptions} */
const webviewConfig = {
  entryPoints: ["src/webview/main.tsx"],
  bundle: true,
  outfile: "dist/webview/main.js",
  platform: "browser",
  format: "iife",
  target: "es2022",
  jsx: "automatic",
  jsxImportSource: "preact",
  sourcemap: !production,
  minify: production,
};

async function run() {
  if (watch) {
    const [extensionCtx, webviewCtx] = await Promise.all([
      esbuild.context(extensionConfig),
      esbuild.context(webviewConfig),
    ]);
    await Promise.all([extensionCtx.watch(), webviewCtx.watch()]);
    console.log("watching for changes...");
  } else {
    await Promise.all([esbuild.build(extensionConfig), esbuild.build(webviewConfig)]);
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
