import { HomeLayout } from "fumadocs-ui/layouts/home"
import { Link } from "react-router"

import { baseOptions } from "~/lib/layout.shared"
import { itemUrl } from "~/lib/site"

import registry from "../../registry.json"

// registry.json is the single list of what this project publishes, so the index
// reads it rather than keeping a second one in step with it.
const items = registry.items

export default function Home() {
  return (
    <HomeLayout {...baseOptions()}>
      <main className="mx-auto w-full max-w-5xl px-4 py-16">
        <h1 className="text-3xl font-semibold">adwaita-cn</h1>
        <p className="text-fd-muted-foreground mt-2 max-w-2xl">
          A shadcn registry of components built to GNOME Adwaita&rsquo;s
          geometry: the radii, the easing, the opacities and the props, read out
          of libadwaita and GTK themselves.
        </p>

        <p className="mt-8">
          <Link
            to="/docs"
            className="bg-fd-primary text-fd-primary-foreground rounded-lg px-4 py-2 text-sm font-medium"
          >
            Read the docs
          </Link>
        </p>

        <h2 className="mt-16 text-xl font-semibold">
          {items.length} items
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <li
              key={item.name}
              className="border-fd-border bg-fd-card rounded-xl border p-4"
            >
              <h3 className="font-medium">{item.title ?? item.name}</h3>
              <p className="text-fd-muted-foreground mt-1 text-sm">
                {item.description}
              </p>
              <code className="mt-3 block overflow-x-auto text-xs">
                pnpm dlx shadcn@latest add {itemUrl(item.name)}
              </code>
            </li>
          ))}
        </ul>
      </main>
    </HomeLayout>
  )
}
