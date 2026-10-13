import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import path from "node:path"
import { defineConfig } from "vite"

// The page bin/14-app-screenshots shoots: every application the registry builds, one
// per case, so that a component can be put beside the widget it was built from.
export default defineConfig({
  root: path.resolve(import.meta.dirname, "bin/web"),
  base: "./",
  plugins: [react(), tailwindcss()],
  build: {
    outDir: path.resolve(import.meta.dirname, "bin/14-app-screenshots.out/web"),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      // What the registry's own sources import, so a component resolves here
      // the same way it will in whichever project installs it.
      "@": path.resolve(import.meta.dirname, "registry/adwaita"),
    },
  },
})
