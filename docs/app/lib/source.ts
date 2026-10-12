import { loader } from "fumadocs-core/source"
import { defineDocs } from "fumadocs-mdx/macro"

export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    // The frontmatter is read eagerly, so the page tree and the search index
    // are built without loading any content; the MDX itself arrives in its own
    // chunk when a page is opened.
    async: true,
  },
})

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
})
