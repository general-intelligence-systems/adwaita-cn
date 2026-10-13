// Gtk.Widget's properties, resolved to what the DOM can carry.
//
// Every component in this registry accepts WidgetProps, because every GTK widget has
// them. Most are layout instructions the browser already has an answer for: `halign`
// is `self-start`, `marginTop` is a margin, `widthRequest` is a `min-width`. This turns
// a widget's properties into the className, style and attributes which say the same
// thing, and hands back whatever was not one of them for the component to spread.

import type { CSSProperties } from "react"

import type { WidgetProps } from "./widget-props"

const ALIGN = {
  fill: "self-stretch",
  start: "self-start",
  end: "self-end",
  center: "self-center",
  baseline: "self-baseline",
  "baseline-fill": "self-stretch",
  "baseline-center": "self-baseline",
} as const

const OVERFLOW = { visible: "overflow-visible", hidden: "overflow-hidden" } as const

export interface ResolvedWidget<T> {
  /** `visible: false` — the widget is not rendered at all. */
  hidden: boolean
  className: string | undefined
  style: CSSProperties | undefined
  attributes: Record<string, unknown>
  rest: T
}

export function widget<T extends WidgetProps>(props: T): ResolvedWidget<Omit<T, keyof WidgetProps>> {
  const {
    canFocus,
    canTarget,
    cssClasses,
    cssName: _cssName,
    cursor: _cursor,
    focusOnClick: _focusOnClick,
    focusable,
    halign,
    hasTooltip: _hasTooltip,
    heightRequest,
    hexpand,
    hexpandSet: _hexpandSet,
    layoutManager: _layoutManager,
    limitEvents: _limitEvents,
    marginBottom,
    marginEnd,
    marginStart,
    marginTop,
    name,
    opacity,
    overflow,
    receivesDefault: _receivesDefault,
    sensitive,
    tooltipMarkup,
    tooltipText,
    valign,
    vexpand,
    vexpandSet: _vexpandSet,
    visible,
    widthRequest,
    ...rest
  } = props

  const style: CSSProperties = {}

  if (marginTop !== undefined) style.marginTop = marginTop
  if (marginBottom !== undefined) style.marginBottom = marginBottom
  if (marginStart !== undefined) style.marginInlineStart = marginStart
  if (marginEnd !== undefined) style.marginInlineEnd = marginEnd
  if (widthRequest !== undefined) style.minWidth = widthRequest
  if (heightRequest !== undefined) style.minHeight = heightRequest
  if (opacity !== undefined) style.opacity = opacity

  const attributes: Record<string, unknown> = {}

  // A widget's name is what its CSS selector matches on, which is an id.
  if (name !== undefined) attributes.id = name
  // GTK renders the tooltip itself; the browser renders `title`.
  if (tooltipText !== undefined) attributes.title = tooltipText
  else if (tooltipMarkup !== undefined) attributes.title = tooltipMarkup
  // An insensitive widget is disabled, and says so to assistive technology whether or
  // not the element it lands on is one that takes `disabled`.
  if (sensitive === false) {
    attributes["aria-disabled"] = true
    attributes["data-disabled"] = ""
  }
  if (canFocus === false || focusable === false) attributes.tabIndex = -1
  if (canTarget === false) attributes["aria-hidden"] = true

  return {
    hidden: visible === false,
    className:
      [
        halign ? ALIGN[halign] : undefined,
        valign ? ALIGN[valign] : undefined,
        hexpand ? "grow" : undefined,
        vexpand ? "grow" : undefined,
        overflow ? OVERFLOW[overflow] : undefined,
        typeof cssClasses === "string" ? cssClasses : undefined,
      ]
        .filter(Boolean)
        .join(" ") || undefined,
    style: Object.keys(style).length > 0 ? style : undefined,
    attributes,
    rest: rest as Omit<T, keyof WidgetProps>,
  }
}
