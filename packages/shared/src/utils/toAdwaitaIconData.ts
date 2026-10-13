import { toKebabCase } from './toKebabCase';
import type { AdwaitaIconData, AdwaitaIconNode } from '../build/types';

/**
 * Converts legacy `(name, iconNode, aliases?)` icon arguments into icon data object format.
 */
export function toAdwaitaIconData(
  iconName: string,
  iconNode: AdwaitaIconNode[],
  aliases: string[] = [],
): AdwaitaIconData {
  if (iconNode == null) {
    throw new Error('[adwaita]: iconNode is required when icon name is used');
  }

  return {
    name: toKebabCase(iconName),
    size: 24,
    node: iconNode,
    ...(aliases.length > 0 ? { aliases } : {}),
  };
}
