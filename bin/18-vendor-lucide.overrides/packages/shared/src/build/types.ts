/* eslint-disable  @typescript-eslint/no-explicit-any */
export type SVGProps = Record<string, any>;

/**
 * A Adwaita icon node (an svgson-like internal format)
 */
export type AdwaitaIconNode<
  TName extends string = string,
  TProps extends Record<string, unknown> = SVGProps,
> =
  | [name: TName, attributes: TProps]
  | [name: TName, attributes: TProps, children: AdwaitaIconNode<TName, TProps>[]];

/**
 * A Adwaita icon object that fully describes an icon to be displayed.
 */
export type AdwaitaIconData<
  TName extends string = string,
  TProps extends Record<string, unknown> = SVGProps,
> = {
  name?: string;
  node: AdwaitaIconNode<TName, TProps>[];
  aliases?: string[];

  /**
   * The name GTK draws this icon by, such as `ac-adapter-symbolic`.
   *
   * Adwaita's own, and not something lucide has: every icon in the set ends `-symbolic`, so
   * the package publishes it without the suffix and keeps the GTK spelling here, because
   * that is the name an `icon-name` property out of a .ui file actually carries.
   */
  gtkIconName?: string;

  /**
   * False where the icon names its own colours rather than taking the widget's.
   *
   * A symbolic icon is one colour -- the foreground of whatever draws it -- but the status
   * icons are the exception: a battery at 0% is red because it is urgent, not because the
   * theme is, so those keep their paint and say so here.
   */
  monochrome?: boolean;
} & (
  | { size?: number; width?: never; height?: never }
  | { size?: never; width?: number; height?: number }
);

/**
 * Build parameters for creating a Adwaita icon instance for display.
 */
export type AdwaitaBuildParams<TProps extends Record<string, unknown> = SVGProps> = {
  /**
   * The color of the icon.
   */
  color?: string;
  /**
   * The stroke width.
   */
  strokeWidth?: string | number;
  /**
   * Whether to use absolute stroke width.
   * @deprecated Use `nonScalingStroke` instead.
   */
  absoluteStrokeWidth?: boolean;
  /**
   * Adds [`vector-effect="non-scaling-stroke"`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/vector-effect) to child elements.
   */
  nonScalingStroke?: boolean;
  /**
   * Extra CSS class names to pass to the SVG element.
   */
  className?: string;
  /**
   * Include default Adwaita classes on the SVG element.
   *
   * @default true
   */
  includeDefaultClasses?: boolean;
  /**
   * Whether the rendered icon already has accessibility props.
   * If false, `aria-hidden="true"` is added automatically.
   */
  hasA11yProp?: boolean;
  /**
   * Any extra attributes to pass to the SVG element.
   */
  attributes?: TProps;
  /**
   * The attribute names to use for various HTML attributes.
   */
  attributeNames?: Record<string, string>;
} & (
  | { size?: string | number | null; width?: never; height?: never }
  | { size?: never; width?: string | number | null; height?: string | number | null }
);
