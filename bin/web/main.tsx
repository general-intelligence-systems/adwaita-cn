// The applications, built from the registry's components.
//
// This is the whole page. The comparison that matters is the same screen built
// twice -- once by the toolkit and once from the components -- so what is rendered
// here is what comparison/apps/<name>/app.rb builds beside it, at the size the
// manifest gives it.
//
// The applications are not listed here: import.meta.glob picks them up and the
// manifest says which exist, so this page cannot fall out of step with the side
// that reads the same manifest.

import { Component, type ComponentType, type ReactNode } from "react"
import { createRoot } from "react-dom/client"

import manifest from "../apps/manifest.json"

const apps = import.meta.glob<{ default: ComponentType }>("../apps/*/App.tsx", {
  eager: true,
})

// One application throwing must not take the page with it, because a blank page is
// every application missing rather than one.
class Guard extends Component<{ name: string; children: ReactNode }, { failed: string | null }> {
  state = { failed: null as string | null }

  static getDerivedStateFromError(error: Error) {
    return { failed: error.message }
  }

  render() {
    return this.state.failed ? (
      <div data-app={this.props.name} data-threw={this.state.failed} />
    ) : (
      this.props.children
    )
  }
}

function App({ name, width, height }: { name: string; width: number; height: number }) {
  const found = apps[`../apps/${name}/App.tsx`]

  if (!found) return <div data-app={name} data-missing="" />

  const Screen = found.default

  return (
    <Guard name={name}>
      <div
        data-app={name}
        style={{ width, height, overflow: "hidden", background: "var(--window-bg-color)" }}
        className="flex flex-col"
      >
        <Screen />
      </div>
    </Guard>
  )
}

createRoot(document.getElementById("root")!).render(
  <>
    {manifest.apps.map((one) => (
      <App key={one.name} name={one.name} width={one.width} height={one.height} />
    ))}
  </>,
)
