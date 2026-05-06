import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Build config: a single ESM bundle that loads on the *public* site
// (not inside the admin SPA), so we cannot rely on the admin SPA's
// import map to satisfy `react` / `@squilla/ui` etc. Everything we
// need ships in this bundle. Output paths line up with
// extensions/visual-editor/cmd/plugin/assets/ where //go:embed picks
// them up.
export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    // Emit straight into the plugin's embedded assets dir.
    outDir: path.resolve(__dirname, "../cmd/plugin/assets"),
    emptyOutDir: false,
    lib: {
      entry: "src/main.tsx",
      formats: ["es"],
      // Match the script tag emitted by the Go plugin.
      fileName: () => "editor.js",
    },
    rollupOptions: {
      output: {
        // CSS lands as editor.css — Go plugin serves it under
        // /admin/api/ext/visual-editor/static/editor.css when the
        // editor module asks for it (or the editor injects it via
        // <link> in shadow root from a fetched URL).
        assetFileNames: "editor.css",
      },
    },
    cssCodeSplit: false,
    // Sourcemaps help debug in the browser without bloating the
    // shipped bundle (separate .map file).
    sourcemap: true,
    target: "es2020",
  },
  resolve: {
    alias: {
      // Future: alias to admin-ui/src/components/ui/custom-field-input.tsx
      // when Step 6 wires up the side panel. Keeping the path explicit
      // (not a generic "@admin-ui") so the dependency is visible in
      // grep / IDE tooling.
    },
  },
});
