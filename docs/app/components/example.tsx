import type { ComponentType } from "react"

const modules = import.meta.glob<{ default: ComponentType }>("../../../examples/**/*.tsx", {
  eager: true,
})

const sources = import.meta.glob<string>("../../../examples/**/*.tsx", {
  eager: true,
  query: "?raw",
  import: "default",
})

function slug(path: string) {
  return path.replace(/^.*\/examples\//, "").replace(/\.tsx$/, "")
}

const examples = new Map(
  Object.entries(modules).map(([path, module]) => [slug(path), module.default]),
)

const code = new Map(Object.entries(sources).map(([path, source]) => [slug(path), source]))

export const ids = [...examples.keys()].sort()

// The import, with the comment header dropped: the page says what the example
// is, so repeating it above the code says it twice.
function body(source: string) {
  return source.replace(/^(\/\/[^\n]*\n)+\n/, "").trimEnd()
}

export function Example({ id, preview = true }: { id: string; preview?: boolean }) {
  const Component = examples.get(id)
  const source = code.get(id)

  if (!Component || !source) {
    return <p className="text-fd-destructive">no example: {id}</p>
  }

  return (
    <figure className="my-6 overflow-hidden rounded-lg border border-fd-border">
      {preview && (
        <div className="flex min-h-28 items-center justify-center bg-[var(--window-bg-color)] p-8 text-[var(--window-fg-color)]">
          <Component />
        </div>
      )}

      <pre className="m-0 overflow-x-auto border-fd-border border-t bg-fd-secondary p-4 text-xs">
        <code>{body(source)}</code>
      </pre>
    </figure>
  )
}
