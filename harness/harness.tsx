import type { ComponentType } from "react"
import { createRoot } from "react-dom/client"

// THE TEMPLATE'S SCRIPT: it loads one example into index.html, named by the
// fragment. bin/15-screenshots navigates to #button/pill, waits for
// [data-ready], and clips its screenshot to the box.
//
// The glob is eager, so every example is in the bundle and switching from one
// to the next is a render rather than a fetch -- a screenshot taken while a
// chunk is still arriving is a screenshot of nothing. It is also what keeps
// this in step with examples/: a file bin/13-generate-examples writes appears
// here with no edit.
const modules = import.meta.glob<{ default: ComponentType }>("../examples/**/*.tsx", {
  eager: true,
})

// "../examples/button/pill.tsx" -> "button/pill".
const examples = new Map(
  Object.entries(modules).map(([path, module]) => [
    path.replace(/^.*\/examples\//, "").replace(/\.tsx$/, ""),
    module.default,
  ]),
)

const container = document.querySelector("#example")

if (!container) throw new Error("harness: no #example in the template")

const root = createRoot(container)

function render() {
  const id = decodeURIComponent(location.hash.replace(/^#/, ""))
  const Example = examples.get(id)

  container?.removeAttribute("data-ready")

  if (!Example) {
    root.render(<div data-missing={id}>no example: {id}</div>)
  } else {
    root.render(<Example />)
  }

  // The next frame, by which time React has committed and the browser has laid
  // the result out. The harness waits for this rather than for a timeout.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => container?.setAttribute("data-ready", id))
  })
}

addEventListener("hashchange", render)
render()

// So the harness can enumerate without reading the manifest twice.
Object.assign(window, { examples: [...examples.keys()] })
