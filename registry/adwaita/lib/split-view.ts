// AdwNavigationSplitView's arithmetic, which no stylesheet can state.
//
// The sidebar is a fraction of the window clamped between a minimum and a maximum, and
// both of those are lengths in `sp` while the fraction is of the whole: a 900px window
// with the defaults gives the sidebar 225px, which is neither 25% of what is left nor
// any `minmax()` a grid can be written with, because the maximum is also capped by what
// the content needs to be legible.
//
// Ported from libadwaita's adw-navigation-split-view.c, `adw_navigation_split_view_size_allocate`.

import { useEffect, useLayoutEffect, useRef, useState } from "react"

import { type ClampUnit, lengthToPx } from "./clamp"

/** Adw.NavigationSplitView's own defaults, from its properties. */
export const MIN_SIDEBAR_WIDTH = 180
export const MAX_SIDEBAR_WIDTH = 280
export const SIDEBAR_WIDTH_FRACTION = 0.25

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

/**
 * `CLAMP ((int) (width * fraction), sidebar_min, sidebar_max)`, with the minimum raised
 * to what the sidebar itself needs and the maximum lowered to what the content needs.
 */
export function splitSidebarWidth(
  width: number,
  {
    minSidebarWidth = MIN_SIDEBAR_WIDTH,
    maxSidebarWidth = MAX_SIDEBAR_WIDTH,
    sidebarWidthFraction = SIDEBAR_WIDTH_FRACTION,
    unit = "sp" as ClampUnit,
    sidebarMinimum = 0,
    contentMinimum = 0,
  } = {},
) {
  const lower = Math.max(sidebarMinimum, Math.ceil(lengthToPx(minSidebarWidth, unit)))
  const upper = Math.min(
    Math.max(lower, Math.ceil(lengthToPx(maxSidebarWidth, unit))),
    width - contentMinimum,
  )

  return Math.min(Math.max(Math.trunc(width * sidebarWidthFraction), lower), Math.max(lower, upper))
}

/** The two columns a split view lays its sidebar and its content out in. */
export function useSplitView<T extends HTMLElement>(options: {
  minSidebarWidth?: number
  maxSidebarWidth?: number
  sidebarWidthFraction?: number
  unit?: ClampUnit
}) {
  const ref = useRef<T>(null)
  const [columns, setColumns] = useState<string | undefined>(undefined)

  const { minSidebarWidth, maxSidebarWidth, sidebarWidthFraction, unit } = options

  useIsomorphicLayoutEffect(() => {
    const element = ref.current

    if (!element) return undefined

    const measure = () => {
      // What each side cannot be made narrower than, which is the only way to read a
      // widget's minimum width here: lay both tracks out at `min-content` and look.
      element.style.gridTemplateColumns = "min-content min-content"

      const [sidebar, content] = [...element.children].map((one) => one.getBoundingClientRect().width)

      const found = `${splitSidebarWidth(element.clientWidth, {
        minSidebarWidth,
        maxSidebarWidth,
        sidebarWidthFraction,
        unit,
        sidebarMinimum: sidebar ?? 0,
        contentMinimum: content ?? 0,
      })}px 1fr`

      // Written to the element as well as to the state: when the answer has not changed
      // React does not re-render, and the `min-content` the measuring pass put there
      // would have stayed -- which is a split view whose two sides are as narrow as their
      // contents rather than as wide as the window.
      element.style.gridTemplateColumns = found
      setColumns(found)
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(element)

    return () => observer.disconnect()
  }, [minSidebarWidth, maxSidebarWidth, sidebarWidthFraction, unit])

  return { ref, columns }
}
