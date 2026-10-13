# Architecture

Adwaita, ported to the web, by reading the toolkit rather than looking at it.

Everything here comes out of two sources and nothing else: libadwaita's own SCSS, and a
running GTK. Nothing is transcribed from a screenshot, and nothing is guessed from a doc
comment.

## The two generators

They do not know about each other. Neither reads the other's output, and there is no
stage that joins them.

### 1. The stylesheet → Tailwind

    bin/03-adwaita-tailwind
      reads  bin/01-fetch-adwaita.out/src/libadwaita/src/stylesheet/**.scss
      writes bin/03-adwaita-tailwind.out/scss-widgets.json     48 widgets, 1670 rules
             bin/03-adwaita-tailwind.out/scss-contexts.json    1230 selectors
             registry/adwaita/theme.css

**The source and not the compiled sheet.** `adwaita.css` is 4,135 flat selectors with no
record of which widget any of them belongs to, so the only thing to key a rule by is its
subject — and a subject is not an owner. `headerbar button`, `.linked > button` and
`button.destructive-action` all report as `button`, which alone is reached at 78 different
specificities. Keyed by subject, the context that chose between them is gone.

The source states the owner by the file: `widgets/_toggle-group.scss` is AdwToggleGroup's
rules and nothing else's. Dart Sass is asked for a source map, and the map says which
partial every rule in the compiled output came from.

**The compiler is Dart Sass and not a parser of ours.** Variables, nesting, `&`, the five
mixins, `@at-root`, 22 placeholders and 122 `@extend`s are the preprocessor's job, and each
is a way to get the answer subtly wrong by hand: `:not(.raised)` is a filter and not a class
on the subject, `$popover_radius: $menu_radius + 6` is arithmetic, and an `@extend` reaches
across partials.

One patch is applied, on a copy: `calc(#{$button_radius} - var(---group-padding);` in
`_toggle-group.scss` is missing its closing bracket. libadwaita builds with sassc, which
lets it through; Dart Sass refuses the file and the browser drops the declaration.

Output is one entry per selector, with the state split out as its own key:

```json
"switch": [
  { "selector": "switch",
    "classes": ["rounded-[14px]", "p-[3px]",
                "bg-[color-mix(in_srgb,currentColor_15%,transparent)]",
                "duration-200", "ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"] },
  { "selector": "switch:hover",    "classes": ["bg-[color-mix(in_srgb,currentColor_20%,transparent)]"] },
  { "selector": "switch:disabled", "classes": ["[filter:Opacity(var(--disabled-opacity))]"] },
  { "selector": "switch > slider", "classes": ["min-w-5", "min-h-5", "rounded-full",
                "shadow-[0_2px_4px_RGB(0_0_6/20%)]"] }
]
```

`registry/adwaita/theme.css` is the other half of the same conversion: the palette as
`@theme` tokens, the states and node paths as `@custom-variant`, and the layout managers —
which are in GTK's C and in no stylesheet anywhere — as `@utility`.

### 2. The toolkit → widget trees

    bin/lib/widgets.c       built and run by bin/01-fetch-adwaita
      writes bin/01-fetch-adwaita.out/widgets.json             166 widgets

**A widget's CSS nodes are made in its own C, and nothing declarative states the result.**
The stylesheet mentions whichever nodes it has a rule for; a doc comment draws a picture of
some of them. Both were being read as the structure, which is how a GtkDropDown came out as
a chevron with no button under it.

So this builds every widget in both libraries and walks it, asking
`gtk_widget_get_css_name` and `gtk_widget_get_css_classes` — which is what GTK's own cascade
matches against — at the moment the widget exists.

```json
{ "class": "GtkButton",
  "given": {
    "selector": "button.text-button", "path": "button.text-button",
    "node": "button", "type": "GtkButton", "classes": ["text-button"],
    "layout": "GtkBinLayout", "arranges": "bin",
    "children": [
      { "selector": "label", "path": "button.text-button > label",
        "node": "label", "type": "GtkLabel", "classes": [] } ] } }
```

`bare` is the widget with nothing handed to it; `given` is the same widget as a caller would
actually build it — a button with a label in it, a drop down with its button and its
popover. `slots` records where what a caller hands over actually lands, by marking a widget,
putting it in, and reading back the path and child index it came out at.

## The applications are the success criterion

A component that looks right on its own and wrong in a window is wrong. So the measurement
is whole applications, built twice.

    bin/apps/<name>/app.c      the scene, in real GTK and libadwaita
    bin/apps/<name>/App.tsx    the same scene, in the registry's components

**Both sides are asked the same questions, and the answers are compared as data.**

`bin/lib/app-trees.c` walks what `app.c` built and writes, for every CSS node in it: the
selector it is addressed by, the path of selectors from the window down, where the toolkit
put it, what it asked for, what arranges its children, and what it actually draws — the
background, the radius, the border, the shadow, the font and the colour, read off the frame
GTK rendered rather than out of a stylesheet.

The same questions are then put to the components in the browser, which answers them with
`getBoundingClientRect` and `getComputedStyle`. The two are written in one shape.

    bin/02-app-trees
      writes bin/02-app-trees.out/toolkit.json      what the toolkit laid out
             bin/02-app-trees.out/components.json   what the components laid out
      exits  0 when every node matches within tolerance, 1 when any does not

What comes out is a diff — *this node is 11px narrower, this one has no background, this
one's radius is 6px where the toolkit's is 9* — rather than two pictures somebody has to
hold up against each other.

`bin/14-app-screenshots` renders both sides side by side as one PNG per application, for
the cases where a number does not say what is wrong but a picture does.

### Why the scenes are C and not Ruby

The toolkit side has to be the toolkit. A Ruby binding is another layer that can be wrong,
it needs a gem environment to run anywhere the comparison runs, and it cannot be handed to
`app-trees.c` as a widget tree without crossing a language boundary first. In C the scene
and the walk are one program: it builds the window, walks it, prints the JSON, exits.

**Current state: 1 of 16 ported.** `bin/apps/controls/app.c` exists. The other fifteen —
calendar, chat, clocks, console, editor, factory, feedback, files, library, mail, music,
paint, photos, preferences, software — are still `app.rb` and need porting.

## Pipeline

    01-fetch-adwaita     vendors the SCSS, the compiled sheets, the .ui templates and the
                         icons; builds and runs bin/lib/widgets.c        → widgets.json
    02-app-trees         builds bin/apps/*/app.c, walks both sides       → toolkit.json,
                                                                           components.json
    03-adwaita-tailwind  the SCSS → Tailwind                             → scss-*.json,
                                                                           theme.css
    04-gtk-tailwind      GTK's own sheet through the same converter
    11-generate-components  the components, from the trees and the classes
    14-app-screenshots   both sides, side by side                        → <name>.png
    16-icons             the symbolic icon set, as masks
    17-node-trees        node trees out of the built page
    18-vendor-lucide     the fallback icon set

Each stage reads files and writes files into `<stage>.out/`, and never runs another stage to
get at its working.

## Conventions

- Every script carries a man page as its header comment: NAME, SYNOPSIS, DESCRIPTION,
  FILES, EXIT STATUS, SEE ALSO.
- A comment says *why*, in sentences, and records what went wrong when the obvious thing was
  tried. The code already says what it does.
- Generated files say they are generated, and name the script that wrote them.
- A stage's output directory is its name plus `.out`.
