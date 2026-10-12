import { createFromSource } from "fumadocs-core/search/server"

import { source } from "~/lib/source"

const server = createFromSource(source, {
  language: "english",
})

// staticGET exports the whole index rather than answering a query, which is the
// only shape that survives a build with no server behind it.
export async function loader() {
  return server.staticGET()
}
