/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  test: {
    globals: true,
    environment: "jsdom",
  },
});
