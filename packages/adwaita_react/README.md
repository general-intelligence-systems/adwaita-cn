# adwaita_react

The Adwaita symbolic icon set as React components, built to lucide-react's structure.

```jsx
import { ViewRefresh, BatteryLevel0 } from 'adwaita_react';

<ViewRefresh />
<ViewRefresh size={24} color="white" className="opacity-70" />
<BatteryLevel0 />
```

## Why it is shaped like lucide-react

An icon is shipped as data rather than as markup -- the node a renderer hands to
`createElement`:

```js
['path', { fill: 'currentColor', d: 'M8 0 ...' }]
```

which is what makes `size`, `color`, `className` and a `ref` ordinary props rather than
string surgery on an SVG. That is lucide's design, and the layout here is lucide's too:
`icons/` holds the icon source, `createAdwaitaIcon` builds a component from one icon's data,
`Icon` renders it, `@adwaita/shared` holds the attribute building both of them share.

## Where it differs, and why

Adwaita is not Feather, so the defaults are not lucide's:

| | lucide-react | adwaita_react |
| --- | --- | --- |
| grid | 24px | 16px, which is what GTK draws a symbolic icon at |
| paint | `fill: none`, `stroke: currentColor` | `fill: currentColor` |
| `color` prop sets | `stroke` | `color` |
| stroke props | `strokeWidth`, `nonScalingStroke` | none |

`color` sets the `color` attribute rather than a paint because the set is not all one kind of
drawing. The GNOME icons are filled paths; libadwaita's own -- `adw-avatar-default`,
`adw-rotate-cw` -- are stroked ones. Both are written as `currentColor`, which resolves
against `color`, so one prop drives either.

The 38 status icons are the exception, and deliberately so. A flat battery is red because it
is urgent, not because the theme is, so those paths name their own colour and ignore `color`:
`<BatteryLevel0 color="white" />` is still red. Their data carries `monochrome: false`.

## GTK names

Every icon is also exported under the name GTK draws it by, because that is the name a port
actually has -- `icon-name="view-refresh-symbolic"` out of a `.ui` file, not `view-refresh`:

```jsx
import { ViewRefreshSymbolic } from 'adwaita_react';          // the alias
import { DynamicIcon } from 'adwaita_react/dynamic';

<DynamicIcon name="view-refresh-symbolic" />                  // resolved at runtime
```

`DynamicIcon` is the one that matters for a port: a widget names its icon at runtime, so the
string cannot be an import a bundler sees. `dynamicIconImports` is keyed by both names.

## Building it

The icon source and the components are both generated, by the two ruby scripts under `bin/`
that the rest of this repository's pipeline is written in:

```
bin/16-extract-icons     bin/01-fetch-adwaita.out/icons/*.svg  ->  icons/*.{svg,json}
bin/17-generate-icons     icons/*.{svg,json}                   ->  src/icons/*.ts
```

`bin/16` is where the work is. The vendored icons are not a clean set: Inkscape and RDF
furniture, `<g>` wrappers holding the fill their children inherit and the translate that puts
the drawing back on the canvas, grappa's multi-state annotations, the theme's foreground
hardcoded as `#2e3436`, and two files that are not vector icons at all. `bin/16` flattens,
strips, recolours and reports; its header documents each decision.

`icons/` is committed, `src/icons/` is not.
