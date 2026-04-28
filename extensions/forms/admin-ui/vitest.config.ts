import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // External runtime deps that are not installed — provide empty shims.
      // The actual mock values are set in setup.tsx via window.__SQUILLA_SHARED__.
      "@squilla/icons": resolve(__dirname, "src/__tests__/__mocks__/@squilla/icons.ts"),
      "@squilla/ui": resolve(__dirname, "src/__tests__/__mocks__/@squilla/ui.ts"),
      "@squilla/api": resolve(__dirname, "src/__tests__/__mocks__/@squilla/api.ts"),
      "react-router-dom": resolve(__dirname, "src/__tests__/__mocks__/react-router-dom.ts"),
      "sonner": resolve(__dirname, "src/__tests__/__mocks__/sonner.ts"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.tsx"],
  },
});
