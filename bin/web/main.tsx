// The applications, built from the registry's components.
//
// This is the whole page. The comparison that matters is the same screen built
// twice -- once by the toolkit and once from the components -- so what is rendered
// here is what bin/apps/<name>/app.rb builds beside it, at the size the manifest
// gives it.
//
// One element per scene rather than per application: a real application is a window
// and the dialogs it opens, and each of those is a shot of its own. A scene's element
// carries `data-shot`, which is what both renderers look it up by.
//
// The applications are not listed here: import.meta.glob picks them up and the
// manifest says which exist, so this page cannot fall out of step with the side
// that reads the same manifest.

import { Component, type ComponentType, type ReactNode } from "react"
import { createRoot } from "react-dom/client"

import manifest from "../apps/manifest.json"

const apps = import.meta.glob<Record<string, ComponentType>>("../apps/*/App.tsx", {
  eager: true,
})

// One scene throwing must not take the page with it, because a blank page is every
// scene missing rather than one.
class Guard extends Component<{ shot: string; children: ReactNode }, { failed: string | null }> {
  state = { failed: null as string | null }

  static getDerivedStateFromError(error: Error) {
    return { failed: error.message }
  }

  render() {
    return this.state.failed ? (
      <div data-shot={this.props.shot} data-threw={this.state.failed} />
    ) : (
      this.props.children
    )
  }
}

// `main` is the file's default export, and `page-setup` is its PageSetup export.
function exported(module: Record<string, ComponentType>, scene: string) {
  if (scene === "main") return module.default

  return module[scene.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join("")]
}

// A window gives its child the whole content area: GTK allocates the child the window's
// own rectangle and it fills it, because `halign` and `valign` are FILL until something
// says otherwise. Without `grow` on the child every application stopped short of the
// bottom of its own window.
function Scene({
  app,
  scene,
  mode,
  width,
  height,
}: {
  app: string
  scene: string
  mode: string
  width: number
  height: number
}) {
  const shot = scene === "main" ? app : `${app}-${scene}`
  const found = apps[`../apps/${app}/App.tsx`]
  const Screen = found && exported(found, scene)

  if (!Screen) return <div data-shot={shot} data-missing="" />

  // An overlay is whatever size its own contents ask for. The toolkit shoots the
  // dialog's card rather than the window it was presented over, so pinning this side
  // to the window's rectangle put a 300x142 card beside a 480x360 one and called the
  // difference a layout fault.
  const overlay = mode === "overlay"

  return (
    <Guard shot={shot}>
      <div
        data-shot={shot}
        style={
          overlay
            ? { display: "inline-block", background: "var(--window-bg-color)" }
            : { width, height, overflow: "hidden", background: "var(--window-bg-color)" }
        }
        // `min-h-0` as well as `grow`: a window gives its child the window's height and the
        // child scrolls what will not fit, and a flex child which may not shrink below its
        // content took the height of the content instead -- 709px of application in a 620px
        // window, with whatever sat at the bottom pushed off the edge.
        className={overlay ? undefined : "flex flex-col [&>*]:grow [&>*]:min-h-0"}
      >
        <Screen />
      </div>
    </Guard>
  )
}

createRoot(document.getElementById("root")!).render(
  <>
    {manifest.apps.flatMap((one) =>
      one.scenes.map((scene) => (
        <Scene
          key={`${one.name}-${scene.name}`}
          app={one.name}
          scene={scene.name}
          mode={scene.mode}
          width={one.width}
          height={one.height}
        />
      )),
    )}
  </>,
)
