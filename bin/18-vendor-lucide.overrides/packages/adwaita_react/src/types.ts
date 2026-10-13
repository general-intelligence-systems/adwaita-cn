import type { SVGProps, ForwardRefExoticComponent, RefAttributes } from 'react';
import type {
  AdwaitaIconData as SharedAdwaitaIconData,
  AdwaitaIconNode as SharedAdwaitaIconNode,
} from '@adwaita/shared/types';

export type SVGAttributes = Partial<SVGProps<SVGSVGElement>>;

/**
 * The attributes a shape inside an icon carries.
 *
 * Adwaita's own, and wider than lucide's. lucide's shapes carry nothing but geometry on a
 * path, so React's spelling of the SVG attributes is enough; Adwaita's do not -- the
 * libadwaita icons are stroked per path and a handful carry `fill-opacity` -- and those are
 * SVG-spelled, because an icon node is data read straight off the SVG and is not tied to a
 * renderer. The same node is what `buildAdwaitaSvg` and `buildAdwaitaDataUri` write back
 * out as markup; `buildAdwaitaIconForReact` renames them on the way into `createElement`.
 */
export type IconNodeAttributes = Record<string, string | number>;

export type AdwaitaIconNode = SharedAdwaitaIconNode<string, IconNodeAttributes>;

export type AdwaitaIconData = SharedAdwaitaIconData<string, IconNodeAttributes>;

/**
 * @deprecated Use AdwaitaIconNode instead.
 */
export type IconNode = AdwaitaIconNode[];

type ElementAttributes = RefAttributes<SVGSVGElement> & SVGAttributes;

export interface AdwaitaProps extends ElementAttributes {
  size?: string | number;
  /**
   * @deprecated Use `nonScalingStroke` instead.
   */
  absoluteStrokeWidth?: boolean;
  nonScalingStroke?: boolean;
}

export type AdwaitaIcon = ForwardRefExoticComponent<
  Omit<AdwaitaProps, 'ref'> & RefAttributes<SVGSVGElement>
>;
