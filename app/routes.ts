import { index, route, type RouteConfig } from "@react-router/dev/routes"

export default [
  index("routes/home.tsx"),
  route("docs/*", "routes/docs.tsx"),

  // Not an API, despite the path: prerendering this route writes the search
  // index to a file the browser downloads.
  route("api/search", "routes/search.ts"),
] satisfies RouteConfig
