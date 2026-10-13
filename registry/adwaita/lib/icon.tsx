// The icon a GTK `icon-name` names, as the component which draws it.
//
// A widget's icon is a STRING in GTK -- `gtk_button_set_icon_name (button, "list-add-symbolic")`
// -- and not a component a caller passes, so the registry's components take the same string
// and resolve it here. adwaita_react ships the whole Adwaita symbolic set keyed by the name
// GTK calls it, with and without the `-symbolic` suffix, so `icon-name` out of a .ui file and
// the shorter spelling both land on the same drawing.
//
// SYNCHRONOUS, and that is the point. The name is not known until the prop arrives, so the
// map is imported rather than lazily loaded: a lazy icon resolves a frame after the button
// around it, which is a header bar that renders empty and then pops. The cost is the set,
// for anyone who passes a name at all. A project which would rather pay in latency can
// swap this file for `DynamicIcon` from `adwaita_react/dynamic`, which takes the same
// names; nothing else in the registry has to change.

import * as React from "react"
import * as adwaita from "adwaita_react"

import { cn } from "@/lib/utils"

// The package is lucide-react, so it exports what lucide-react exports: one component per
// icon under its own PascalCase name, and every icon again under the name GTK calls it.
// `AcAdapter` and `AcAdapterSymbolic` are both there, so both spellings of a name resolve
// through the same table.
const components = adwaita as unknown as Record<string, React.ElementType | undefined>

// lucide's own `toPascalCase`, which is how the component names were generated: split on
// anything that is not alphanumeric, because an icon name is a GTK icon name and not an
// identifier -- `application-rss+xml-symbolic` is a real icon in the set.
function toPascalCase(name: string) {
  return name
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")
}

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, "ref" | "name"> {
  /** The name GTK draws the icon by, such as `list-add-symbolic`. */
  name?: string
}

/**
 * One symbolic icon, in the colour of whatever draws it.
 *
 * Nothing is rendered for a name the set does not have, which is what GTK does with an icon
 * name it cannot look up at the size it wants -- a missing icon is a gap, not a broken image.
 */
function Icon({ name, className, ...props }: IconProps) {
  const Drawn = name ? components[toPascalCase(name)] : undefined

  if (!Drawn) return null

  // The size comes from `--adw-icon-size` rather than from a prop, because that is where
  // the stylesheet puts it: `-gtk-icon-size` is a real property in Adwaita -- a status
  // page's illustration is 128px, a check mark 14px -- and bin/03 carries each one over as
  // that variable. Reading it here means those rules keep driving the drawing, on a node
  // that knows nothing about icons.
  //
  // `shrink-0` because an icon is a fixed square: GTK gives it its natural size and takes
  // the space from its siblings, and a flex child left to shrink came out an ellipse in
  // every button whose label was long enough to squeeze it.
  return (
    <Drawn
      aria-hidden
      className={cn("shrink-0 size-[var(--adw-icon-size,16px)]", className)}
      {...props}
    />
  )
}

export { Icon }
