// Side-effect CSS imports (e.g. `import "./theme.css"`) are handled by esbuild's bundler at
// build time; TypeScript itself has no built-in understanding of CSS modules, so this ambient
// declaration is what lets `tsc --noEmit` type-check the import statement.
declare module "*.css";
