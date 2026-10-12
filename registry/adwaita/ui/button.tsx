// Button — Gtk.Button
//
// shadcn's Button, with libadwaita's measurements. The shape is shadcn's: a real
// `<button>`, `data-slot`, `asChild` through Radix's Slot, and the classes in a cva
// rather than inline. The classes are Adwaita's, read out of its stylesheet by
// bin/05-adwaita-components, including the states — hover, active, disabled,
// focus-visible and checked — which the base generator used to drop.
//
// Adwaita's style classes become cva variants, because that is what they are: `.flat`,
// `.suggested-action`, `.destructive-action`, `.osd`, `.card`. The ones which only change
// geometry become sizes: `.pill`, `.circular`.

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"
import type { WidgetProps } from "@/lib/widget-props"

const buttonVariants = cva(
  // button, from Adwaita: the geometry, the 200ms easing, and the focus ring.
  cn(
    "inline-flex shrink-0 items-center justify-center gap-[6px] whitespace-nowrap",
    "min-h-6 min-w-4 px-2.5 py-[5px] rounded-[9px] font-bold",
    "outline-none outline-offset-[4px]",
    "transition-[outline-color,outline-width,outline-offset,background,box-shadow] duration-200 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
    "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[color-mix(in_srgb,var(--accent-color)_50%,transparent)]",
    "disabled:pointer-events-none disabled:[filter:opacity(var(--disabled-opacity))]",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ),
  {
    variants: {
      variant: {
        // The default button: a 10% tint of the current colour.
        default: cn(
          "bg-[color-mix(in_srgb,currentColor_10%,transparent)]",
          "hover:bg-[color-mix(in_srgb,currentColor_15%,transparent)]",
          "active:bg-[color-mix(in_srgb,currentColor_30%,transparent)]",
          "data-[state=checked]:bg-[color-mix(in_srgb,currentColor_30%,transparent)]",
          "data-[state=checked]:hover:bg-[color-mix(in_srgb,currentColor_35%,transparent)]",
          "data-[state=checked]:active:bg-[color-mix(in_srgb,currentColor_40%,transparent)]",
        ),
        // .flat — looks like a label or an icon until hovered.
        flat: cn(
          "bg-transparent shadow-none",
          "hover:bg-[color-mix(in_srgb,currentColor_7%,transparent)]",
          "active:bg-[color-mix(in_srgb,currentColor_16%,transparent)]",
          "disabled:[filter:opacity(30%)]",
          "data-[state=checked]:bg-[color-mix(in_srgb,currentColor_10%,transparent)]",
          "data-[state=checked]:hover:bg-[color-mix(in_srgb,currentColor_13%,transparent)]",
          "data-[state=checked]:active:bg-[color-mix(in_srgb,currentColor_19%,transparent)]",
        ),
        // .suggested-action — accent colours, for the affirmative button in a dialog.
        suggested: cn(
          "bg-[var(--accent-bg-color)] text-[var(--accent-fg-color)] shadow-none",
          "outline-offset-[5px] focus-visible:outline-offset-[1px]",
          "hover:bg-[image:image(color-mix(in_srgb,currentColor_10%,transparent))]",
          "active:bg-[image:image(RGB(0_0_6/20%))]",
          "data-[state=checked]:bg-[var(--accent-bg-color)]",
          "data-[state=checked]:bg-[image:image(RGB(0_0_6/15%))]",
          "data-[state=checked]:hover:bg-[image:image(RGB(0_0_6/5%))]",
          "data-[state=checked]:active:bg-[image:image(RGB(0_0_6/30%))]",
        ),
        // .destructive-action — destructive colours, to warn of damaging consequences.
        destructive: cn(
          "text-[var(--destructive-color)] bg-[color-mix(in_srgb,currentColor_15%,transparent)]",
          "hover:bg-[color-mix(in_srgb,currentColor_20%,transparent)]",
          "active:bg-[color-mix(in_srgb,currentColor_35%,transparent)]",
          "data-[state=checked]:bg-[color-mix(in_srgb,currentColor_35%,transparent)]",
          "data-[state=checked]:hover:bg-[color-mix(in_srgb,currentColor_40%,transparent)]",
          "data-[state=checked]:active:bg-[color-mix(in_srgb,currentColor_45%,transparent)]",
        ),
        // .osd — dark and partly transparent, for a control overlapping content.
        osd: cn(
          "min-h-8 min-w-8 bg-[RGB(0_0_0/65%)] bg-clip-padding text-[RGB(255_255_255/90%)]",
          "outline-offset-[5px] focus-visible:outline-offset-[1px]",
          "hover:text-white hover:bg-[color-mix(in_srgb,black_calc(0.85_*_65%),currentColor_calc(0.15_*_65%))]",
          "active:text-white active:bg-[color-mix(in_srgb,black_calc(0.75_*_65%),currentColor_calc(0.25_*_65%))]",
          "data-[state=checked]:bg-[color-mix(in_srgb,black_calc(0.8_*_65%),currentColor_calc(0.2_*_65%))]",
          "data-[state=checked]:hover:bg-[color-mix(in_srgb,black_calc(0.75_*_65%),currentColor_calc(0.25_*_65%))]",
          "data-[state=checked]:active:bg-[color-mix(in_srgb,black_calc(0.65_*_65%),currentColor_calc(0.35_*_65%))]",
        ),
        // .card — rounded corners and a shadow. `.activatable` is this, plus its states.
        card: cn(
          "p-0 font-[inherit] rounded-[12px] bg-clip-padding",
          "bg-[var(--card-bg-color)] text-[var(--card-fg-color)]",
          "shadow-[0_0_0_1px_RGB(0_0_6/3%),0_1px_3px_1px_RGB(0_0_6/7%),0_2px_6px_2px_RGB(0_0_6/3%)]",
          "outline-offset-[5px] focus-visible:outline-offset-[-1px]",
          "hover:bg-[image:image(color-mix(in_srgb,currentColor_4%,transparent))]",
          "active:bg-[image:image(color-mix(in_srgb,currentColor_8%,transparent))]",
          "data-[state=checked]:bg-[image:image(color-mix(in_srgb,var(--accent-bg-color)_25%,transparent))]",
          "data-[state=checked]:hover:bg-[image:image(color-mix(in_srgb,var(--accent-bg-color)_32%,transparent))]",
          "data-[state=checked]:active:bg-[image:image(color-mix(in_srgb,var(--accent-bg-color)_39%,transparent))]",
        ),
      },
      size: {
        default: "",
        // .pill — for an important standalone button.
        pill: "px-8 py-2.5 rounded-full",
        // .circular — round, for an icon or one or two characters.
        circular: "p-0 min-h-8.5 min-w-8.5 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends Omit<React.ComponentProps<"button">, keyof WidgetProps>,
    WidgetProps,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** utf8, from Gtk.Button. The button's text, when it has no children. */
  label?: string
  /** utf8, from Gtk.Button. Named icon, rendered before the label. */
  iconName?: string
  /** gboolean, from Gtk.Button. FALSE draws the button without its frame. */
  hasFrame?: boolean
  /** gboolean, from Gtk.Button. Lets the label ellipsize rather than force a width. */
  canShrink?: boolean
  /** gboolean, from Gtk.Button. Reads `_` in the label as a mnemonic marker. */
  useUnderline?: boolean
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  label,
  iconName,
  hasFrame = true,
  canShrink = false,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant ?? "default"}
      data-size={size ?? "default"}
      className={cn(
        buttonVariants({ variant: hasFrame ? variant : "flat", size }),
        canShrink && "min-w-0 [&>*]:truncate",
        className,
      )}
      {...props}
    >
      {iconName ? <span aria-hidden className={cn("icon", iconName)} /> : null}
      {children ?? label}
    </Comp>
  )
}

export { Button, buttonVariants }
