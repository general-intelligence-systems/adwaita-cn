import type { AdwaitaBuildParams, AdwaitaIconData, AdwaitaIconNode, SVGProps } from './types';
import defaultAttributes from './defaultAttributes';
import { mergeClasses } from '../utils/mergeClasses';

function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Creates an Adwaita icon node (an svgson-like format) from an Adwaita icon object.
 *
 * @param icon The icon to build.
 * @param params Additional build parameters.
 */
function buildAdwaitaIconNode(
  icon: AdwaitaIconData,
  params: AdwaitaBuildParams = {},
): AdwaitaIconNode {
  const attributeNames = params.attributeNames ?? {};
  const getAttributeName = (attributeName: string) =>
    attributeNames[attributeName] ?? attributeName;

  const viewBoxWidth = icon.size ?? icon.width ?? defaultAttributes['width'];
  const viewBoxHeight = icon.size ?? icon.height ?? defaultAttributes['height'];

  // `adw-` is the namespace, and roughly a tenth of the set is already in it: libadwaita's
  // own icons are named `adw-sidebar`, `adw-entry-edit` and so on, and prefixing those again
  // gives `adw-adw-sidebar`.
  const prefixed = (name: string) => (name.startsWith('adw-') ? name : `adw-${name}`);

  const aliasClassNames =
    icon.aliases
      ?.filter((alias: string): alias is string => typeof alias === 'string' && alias.trim() !== '')
      .map(prefixed) ?? [];
  const iconClassNames = [...(icon.name ? [prefixed(icon.name)] : []), ...aliasClassNames];
  const classNamesFromClassName = params.className?.split(' ').filter(Boolean) ?? [];
  const className =
    params.includeDefaultClasses === false
      ? mergeClasses(...classNamesFromClassName)
      : mergeClasses('adw', ...iconClassNames, ...classNamesFromClassName);

  const attributes = {
    ...Object.entries(defaultAttributes).reduce((attrs, [attrName, value]) => {
      attrs[getAttributeName(attrName)] = value;
      return attrs;
    }, {} as SVGProps),
    // `color` rather than `fill`, so that the stroked libadwaita icons take the colour too.
    // A status icon names its own colour per path and so is unaffected, which is the point:
    // a flat battery stays red inside a button whose foreground is white.
    ...('color' in params &&
      params.color && {
        [getAttributeName('color')]: params.color,
      }),
    ...('size' in params &&
      isDefined(params.size) && {
        [getAttributeName('width')]: params.size,
        [getAttributeName('height')]: params.size,
      }),
    ...('width' in params &&
      isDefined(params.width) && {
        [getAttributeName('width')]: params.width,
      }),
    ...('height' in params &&
      isDefined(params.height) && {
        [getAttributeName('height')]: params.height,
      }),
    ...(className && {
      [getAttributeName('class')]: className,
    }),
    [getAttributeName('viewBox')]: `0 0 ${viewBoxWidth} ${viewBoxHeight}`,
    ...(params.hasA11yProp === false
      ? {
          [getAttributeName('aria-hidden')]: 'true',
        }
      : {}),
    ...('attributes' in params && params.attributes),
  };

  // The child attributes are renamed too, which lucide does not need to do: its icons carry
  // nothing but geometry on a path, so there is no `stroke-width` below the root to rename.
  // Adwaita's do -- the libadwaita icons are stroked per path, and a handful carry
  // `fill-opacity` -- and React will not accept the SVG spelling of those.
  const renameAttributes = (attrs: SVGProps): SVGProps =>
    Object.entries(attrs).reduce((renamed, [attrName, value]) => {
      renamed[getAttributeName(attrName)] = value;
      return renamed;
    }, {} as SVGProps);

  const renameNode = ([name, attrs, children]: AdwaitaIconNode): AdwaitaIconNode =>
    children
      ? [name, renameAttributes(attrs), children.map(renameNode)]
      : [name, renameAttributes(attrs)];

  return ['svg', attributes, icon.node.map(renameNode)];
}

export default buildAdwaitaIconNode;
