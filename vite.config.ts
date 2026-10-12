import { reactRouter } from "@react-router/dev/vite"
import tailwindcss from "@tailwindcss/vite"
import { fumadocsMdx } from "fumadocs-mdx/vite"
import path from "node:path"
import { defineConfig } from "vite"

// GitHub Pages serves this repository at /adwaita-cn/, not at /. The prefix is a
// deployment detail rather than a property of the site, so it arrives as an
// environment variable: unset for `pnpm dev`, set by bin/12-build-pages.
//
// Vite's `base` is also where Fumadocs picks the prefix up. Its search client
// reads import.meta.env.BASE_URL to find the exported index, which is why this
// project is Vite rather than Next -- under Next's basePath that prefix has to
// be threaded to the client by hand.
const base = process.env.DOCS_BASE_PATH ?? "/"

export default defineConfig({
  base,
  plugins: [fumadocsMdx(), tailwindcss(), reactRouter()],
  resolve: {
    alias: {
      // The two halves of the repository. `@` is what the registry's own
      // sources import (`@/lib/utils`), so a component resolves the same here
      // as it will in whichever project installs it; `~` is the docs site.
      "@": path.resolve(import.meta.dirname, "registry/adwaita"),
      "~": path.resolve(import.meta.dirname, "app"),
    },
  },
})
