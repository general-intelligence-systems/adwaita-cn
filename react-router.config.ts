import type { Config } from "@react-router/dev/config"
import { createGetUrl, getSlugs } from "fumadocs-core/source"
import { glob } from "node:fs/promises"

const getUrl = createGetUrl("/docs")

// Vite's `base` prefixes the asset URLs; this prefixes the routes, so that a
// <Link to="/docs"> renders as /adwaita-cn/docs.
const configured = process.env.DOCS_BASE_PATH ?? "/"
const basename =
  configured === "/" ? "/" : `/${configured.split("/").filter(Boolean).join("/")}/`

export default {
  basename,

  // No server: every route is rendered to HTML at build time and the output of
  // build/client is what Pages serves.
  ssr: false,

  async prerender({ getStaticPaths }) {
    const paths = [...getStaticPaths()]

    // getStaticPaths finds the routes with no parameters -- the home page, and
    // /api/search, which is how the search index gets written to a file. The
    // docs route is a splat, so its pages come from the content instead.
    for await (const entry of glob("**/*.mdx", { cwd: "content/docs" })) {
      paths.push(getUrl(getSlugs(entry)))
    }

    return paths
  },
} satisfies Config
