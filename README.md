# adwaita-cn

A [shadcn registry](https://ui.shadcn.com/docs/registry) of components built to GNOME
Adwaita's geometry.

Install one with the shadcn CLI, the same as any other registry:

```bash
npx shadcn@latest add https://<host>/r/button.json
```

## What this is, and what it is not

**It is the measurements.** A component looks like Adwaita because of its radii, its minimum
heights, its padding, its focus ring and the easing on its transitions. A button's corner is
9px, a card's is 12px, a popover's is 15px, and everything animates for 200ms on
`cubic-bezier(0.25, 0.46, 0.45, 0.94)`. Those numbers are not approximated here: they are read
out of libadwaita's own stylesheet.

**It is not the palette.** Every colour is a CSS variable with libadwaita's default as its
value, and the point of that is to override them. Point `--accent-bg-color` at a brand and the
components keep Adwaita's shape and lose its blue.

## Where the numbers come from

Nothing here is hand-measured, and nothing is copied from a screenshot. Three scripts, run in
order:

```bash
bin/fetch-adwaita                                              # the stylesheets
bin/adwaita-tailwind                > vendor/adwaita/widgets.json     # pass 1
bin/adwaita-components widgets.json > vendor/adwaita/components.json  # pass 2
```

Two passes, two outputs. `widgets.json` is one entry per selector; `components.json` is one
entry per component, which is the list to build from.

**`bin/fetch-adwaita`** extracts the stylesheets rather than downloading them, and the reason
is worth knowing. What GNOME publishes is SCSS, which needs a build to become CSS and which
carries mixins and `@if` rather than values. What a GTK application actually loads is one
compiled sheet with every variable resolved, and that sheet ships inside the library's
GResource bundle. So the script reads it back out of the installed libraries with
`gresource(1)`, and the result is literally the CSS the running toolkit uses. Two sheets,
because Adwaita is only the top half: libadwaita's own, and GTK's `Default` theme underneath it.
GTK 4 no longer ships an Adwaita of its own — `gtk/theme/` holds `Default` and `Empty`, and
Adwaita moved out to libadwaita.

**`bin/adwaita-tailwind`** parses both sheets and maps every declaration to the Tailwind classes
which reproduce it, dropping colour on the way through. Measurements are arbitrary-valued on
purpose: `rounded-[9px]`, never `rounded-lg`. Tailwind's scale has 8px and 10px either side of
Adwaita's button radius, and a button one pixel out is the most recognisable way for a port to
look almost-but-not-Adwaita.

**`bin/adwaita-components`** folds that map into the component list, which is the second pass
because a selector is not a component. `button.flat`, `button.pill` and
`button.suggested-action` are one component with three variants. `trough`, `slider` and `arrow`
are render nodes inside a widget, and the web has no element to hang them on. `.title-1` and
`.monospace` are typography. The script carries the tables which say which is which, because a
GTK node name does not, and it reports anything the tables do not mention rather than dropping
it.

From 340 selectors that leaves **57 components**, with 98 nodes set aside. The exclusions are
in `components.json` too, each with the reason, so nothing goes missing quietly.

## The widget schemas

The classes and their props come from the toolkit too, not from the documentation:

```bash
bin/fetch-gir                                     # Gtk-4.0.gir and Adw-1.gir, into vendor/gir/
bin/gtk-schemas > vendor/gir/schemas.json         # 359 classes, 158 enums
```

A GIR file is GObject introspection data — what language bindings are generated from — so every
class, every property, its type, its default and whether it is writable are stated by the
library itself. `bin/gtk-schemas` resolves inheritance, which is the whole reason not to read
the docs instead: `ActionRow` declares six properties and accepts forty-eight, with `title`
from `Adw.PreferencesRow` and `visible` from `Gtk.Widget`. Each one records which class declared
it.

**There is no Adw/Gtk split.** A component is one component, so the namespaces consolidate under
the bare class name and Adw takes precedence — 348 classes, with eleven names claimed by both.
Adw wins *outright* rather than by merging, because `Adw.Dialog` descends from `Gtk.Widget`
rather than `Gtk.Window` and is a different API sharing a name; folding Gtk's extra properties
in would have the schema claim props the widget does not accept. Each displaced class is named
in `shadows`.

Three of the eleven need an exception: `Window`, `ApplicationWindow` and `Application` each
subclass the very Gtk class they shadow, so a bare parent pointer would make `Window` its own
parent. Those three already inherit everything the Gtk class has, so the parent emitted is the
one beyond it and `parentThrough` records what was stepped over. `--qualified` turns
consolidation off.

`bin/gtk-enums` turns the enumerations into TypeScript:

```bash
bin/gtk-enums > registry/adwaita/lib/enums.ts     # 137 unions
```

A string-literal union and its value array from one source, because both are wanted and keeping
them in step by hand is how they drift — the type annotates a prop at no runtime cost, the array
populates a select and is what a lint checks against:

```ts
export const toolbarStyleValues = ["flat", "raised", "raised-border"] as const
export type ToolbarStyle = (typeof toolbarStyleValues)[number]
```

**The values are GTK's nicks.** A member is written `raised_border` in the introspection data
and the string the property system accepts is `raised-border`. Generating from the names would
produce a type that insists on a value GTK rejects.

Bitfields are left out: a flag set is several members at once, so its TypeScript is an array of
the union rather than the union, and a prop typed as one is almost always wrong. `--flags`
emits them, each marked.

Types come out as something a JavaScript lint can check: `utf8` is a string, `gboolean` a
boolean, an enumeration becomes its list of values (`Adw.ToolbarStyle` → `flat`, `raised`,
`raised_border`), and a widget or model becomes `node`. Names are given both ways, GTK's
`subtitle-lines` and React's `subtitleLines`.

## Layout

```
bin/                       the five scripts above
vendor/adwaita/            the extracted stylesheets, the class map, the component list
vendor/gir/                the introspection data, and the widget schemas
registry.json              the registry index: one entry per component
registry/adwaita/ui/       the components
registry/adwaita/lib/      cn()
registry/adwaita/adwaita.css   the variables the components read
public/r/                  `shadcn build` output, gitignored
```

`registry.json` is the source of truth and `shadcn build` compiles it into `public/r/`: one
JSON per item plus an index, which is what the CLI fetches. Serve `public/` from anything.

## Adding a component

1. Find it in `vendor/adwaita/components.json`, which carries its variants, its states and
   every class it needs.
2. Cross-check against `vendor/adwaita/widgets.json` if the context matters.
3. Write it under `registry/adwaita/ui/`, with the measurements from the map rather than from
   taste.
4. Add it to `registry.json`, with its `registryDependencies` on `adwaita-theme`.
5. `pnpm registry:build`.

The source ships as source. There is no bundler here on purpose: a registry distributes files
the CLI copies into a project, and a built artefact is the one thing it cannot use.
