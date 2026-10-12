// An oxlint plugin which checks JSX against lint/rules.json.
//
// THIS RULE KNOWS NOTHING. Every fact it uses is in the rule file, which bin/09-lint-rules
// generates from the declaration of which components exist and from GTK's own introspection
// data. There are no heuristics here and that is deliberate: an earlier version inferred
// whether a name was meant to be a GTK component by how much it resembled one, and reported
// <ShellHeader> as a misspelling of <ListHeader>. A lint which fires on correct code is worse
// than no lint, so existence is declared rather than guessed.
//
// A name in the rule file is checked. A name absent from it is not mentioned.

import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const rules = JSON.parse(readFileSync(join(here, "rules.json"), "utf8"))

const react = new Set(rules.react)

// Attributes which belong to the DOM or to React rather than to the widget.
const passthrough = (prop) =>
  react.has(prop) ||
  prop.startsWith("data-") ||
  prop.startsWith("aria-") ||
  /^on[A-Z]/.test(prop)

const nameOf = (node) => (node?.type === "JSXIdentifier" ? node.name : null)

// Does it exist? Asked of the import rather than of the name: a named import from one of the
// sources the rule file lists has to be a component the rule file knows. A component imported
// from anywhere else is somebody else's and is not mentioned.
const componentExists = {
  create(context) {
    return {
      ImportDeclaration(node) {
        const source = node.source.value
        if (typeof source !== "string") return
        if (!rules.sources.some((prefix) => source.startsWith(prefix))) return

        for (const specifier of node.specifiers) {
          if (specifier.type !== "ImportSpecifier") continue

          const name = specifier.imported?.name ?? specifier.local?.name
          if (!name || rules.components[name]) continue

          context.report({
            message: `\`${name}\` is not a component of this registry.`,
            node: specifier,
          })
        }
      },
    }
  },
}

const exactProps = {
  create(context) {
    return {
      JSXOpeningElement(node) {
        const name = nameOf(node.name)
        const component = name && rules.components[name]

        // Not a declared component, or a style class with no schema to check against.
        if (!component || !component.props) return

        for (const attribute of node.attributes) {
          if (attribute.type !== "JSXAttribute") continue

          const prop = nameOf(attribute.name)
          if (!prop || passthrough(prop)) continue

          const rule = component.props[prop]

          if (!rule) {
            context.report({
              message: `${component.class} has no property \`${prop}\`.`,
              node: attribute.name,
            })
            continue
          }

          if (!rule.writable) {
            context.report({
              message: `\`${prop}\` on ${component.class} is read-only.`,
              node: attribute.name,
            })
            continue
          }

          if (rule.values && attribute.value?.type === "Literal") {
            const value = attribute.value.value
            if (typeof value === "string" && !rule.values.includes(value)) {
              context.report({
                message:
                  `\`${value}\` is not a value of ${rule.enum}. ` +
                  `Expected one of: ${rule.values.join(", ")}.`,
                node: attribute.value,
              })
            }
          }
        }
      },
    }
  },
}

export default {
  meta: { name: "adwaita" },
  rules: { "component-exists": componentExists, "exact-props": exactProps },
}
