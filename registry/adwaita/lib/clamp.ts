// AdwClampLayout's arithmetic, which no stylesheet can state.
//
// A clamp fills what it is given and limits the child inside it, but not by stopping at
// the maximum: between the tightening threshold and the maximum it eases the child's
// width on a cubic, so a clamp 480px wide gives its child 443 rather than the 480 a
// `max-width` would leave it with or the 507 the maximum is. The curve is the whole
// point of the widget -- it is what makes a window feel like it tightens rather than
// snaps -- so the component measures itself and does the same sum the layout manager
// does.
//
// Ported from libadwaita's adw-clamp-layout.c, `child_size_from_clamp`.

import { useEffect, useLayoutEffect, useRef, useState } from "react"

/** `maximum-size` and `tightening-threshold` are in these, and default to the last. */
export type ClampUnit = "px" | "pt" | "sp"

/** Adw.Clamp's own defaults, from its properties. */
export const CLAMP_MAXIMUM_SIZE = 600
export const CLAMP_TIGHTENING_THRESHOLD = 400

/**
 * The desktop's resolution, which is what a length in `sp` is scaled by:
 * `adw_length_unit_to_px` is `value * dpi / 96`, and GTK reads the dpi off
 * `gtk-xft-dpi`. A clamp whose sizes are in `sp` -- which is the default, and what
 * AdwPreferencesPage's is -- is therefore a different number of pixels wide on a
 * desktop at 81 dpi than on one at 96, and taking it as 96 made every clamped page
 * 60px too wide.
 *
 * Overridable, because a project's desktop is not this one's: set `--adw-dpi` on the
 * document and the components read it.
 */
export const DEFAULT_DPI = 81

function dpi() {
  if (typeof document === "undefined") return DEFAULT_DPI

  const named = getComputedStyle(document.documentElement).getPropertyValue("--adw-dpi")
  const found = Number.parseFloat(named)

  return Number.isFinite(found) && found > 0 ? found : DEFAULT_DPI
}

/** `adw_length_unit_to_px`. */
export function lengthToPx(value: number, unit: ClampUnit = "sp") {
  switch (unit) {
    case "px":
      return value
    case "pt":
      return (value * dpi()) / 72
    default:
      return (value * dpi()) / 96
  }
}

const easeOutCubic = (t: number) => (t - 1) * (t - 1) * (t - 1) + 1

/**
 * `child_size_from_clamp`: the width this clamp gives its child when it is itself
 * `forSize` wide.
 */
export function clampChildSize(
  forSize: number,
  {
    maximumSize = CLAMP_MAXIMUM_SIZE,
    tighteningThreshold = CLAMP_TIGHTENING_THRESHOLD,
    unit = "sp" as ClampUnit,
    minimum = 0,
  } = {},
) {
  const maximumPx = lengthToPx(maximumSize, unit)
  const thresholdPx = lengthToPx(tighteningThreshold, unit)

  const lower = Math.max(Math.min(thresholdPx, maximumPx), minimum)
  const max = Math.max(lower, maximumPx)
  // ADW_EASE_OUT_TAN_CUBIC is 3: the tangent of the ease at 0, which is where the
  // curve has to meet the straight line below the threshold for the two to join
  // without a kink.
  const upper = lower + 3 * (max - lower)

  if (forSize <= lower) return forSize
  if (forSize >= upper) return Math.ceil(max)

  return Math.floor(lower + (max - lower) * easeOutCubic((forSize - lower) / (upper - lower)))
}

// On the server there is nothing to measure, and useLayoutEffect warns about it.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

/**
 * The columns a clamp lays its child out in: the gap that centres it, and then the width
 * the layout manager would give it.
 */
export function useClamp<T extends HTMLElement>(options: {
  maximumSize?: number
  tighteningThreshold?: number
  unit?: ClampUnit
}) {
  const ref = useRef<T>(null)
  const [columns, setColumns] = useState<string | undefined>(undefined)

  const { maximumSize, tighteningThreshold, unit } = options

  useIsomorphicLayoutEffect(() => {
    const element = ref.current

    if (!element) return undefined

    const measure = () => {
      const size = clampChildSize(element.clientWidth, { maximumSize, tighteningThreshold, unit })

      // `lower` is the greater of the tightening threshold and the child's own minimum,
      // so a child which cannot be made narrower than 349px is 349px wide in a clamp
      // whose maximum is 338. The browser knows that number as `min-content`, and the
      // only way to read it is to lay the track out and look: the column is asked for
      // at least `min-content` first, and then measured.
      // Two tracks even while measuring, because the child is placed in the second one:
      // with a single track it landed in an implicit column sized to its own content and
      // the clamp read that back as the width to give it.
      element.style.gridTemplateColumns = `0px minmax(min-content, ${size}px)`

      // The child's MARGIN box, which is what the layout manager hands it: GTK allocates
      // the child `child_size` and the CSS margins come off inside that allocation, so
      // AdwPreferencesPage's box is 443px wide and draws in the 419 left after its own
      // `margin: 24px 12px`. Reading the border box instead took those 24px off again
      // on every pass, and the clamp walked its child in by 12px at a time.
      const child = element.firstElementChild
      const style = child ? getComputedStyle(child) : null
      const taken = child
        ? child.getBoundingClientRect().width +
          Number.parseFloat(style!.marginLeft || "0") +
          Number.parseFloat(style!.marginRight || "0")
        : size

      // `(width - child_allocation.width) / 2` in C, which is integer division: a clamp
      // 480px wide around a 443px child starts it at 18 and not at the 18.5 centring it
      // in a grid gives. Half a pixel is half a pixel on everything the clamp holds.
      const found = `${Math.max(0, Math.floor((element.clientWidth - taken) / 2))}px ${taken}px`

      // Written to the element as well as to the state: when the answer has not changed
      // React does not re-render, so the `minmax(min-content, ...)` the measuring pass
      // put there would have stayed.
      element.style.gridTemplateColumns = found
      setColumns(found)
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(element)

    return () => observer.disconnect()
  }, [maximumSize, tighteningThreshold, unit])

  return { ref, columns }
}
