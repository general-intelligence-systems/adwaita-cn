import { RootProvider } from "fumadocs-ui/provider/react-router"
import type { ReactNode } from "react"
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router"

import DocsSearchDialog from "~/components/search"

import "./app.css"

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="flex min-h-screen flex-col">
        {/* The provider carries the theme and the search dialog. Replacing the
            dialog is how the static search client gets used instead of the
            default one, which expects a server to query. */}
        <RootProvider search={{ SearchDialog: DocsSearchDialog }}>
          {children}
        </RootProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}
