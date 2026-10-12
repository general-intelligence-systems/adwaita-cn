import tailwindcss from "@tailwindcss/vite"
import path from "node:path"
import { defineConfig } from "vite"

// The screenshot harness, which is the only thing at the root that a browser
// loads. The documentation site has its own config in docs/.
export default defineConfig({
  root: path.resolve(import.meta.dirname, "harness"),
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      // What the registry's own sources import, so a component resolves here
      // the same way it will in whichever project installs it.
      "@": path.resolve(import.meta.dirname, "registry/adwaita"),
    },
  },
})
