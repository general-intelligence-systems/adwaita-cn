import { createElement, forwardRef } from 'react';
import { toAdwaitaIconData, toPascalCase } from '@adwaita/shared';
import { AdwaitaIcon, AdwaitaIconData, AdwaitaIconNode, AdwaitaProps } from './types';
import Icon from './Icon';

/**
 * Creates a Adwaita icon component from icon data.
 *
 * @param icon Icon data object.
 * @returns Adwaita icon component.
 */
function createAdwaitaIcon(icon: AdwaitaIconData): AdwaitaIcon;

/**
 * Creates a Adwaita icon component from the legacy icon arguments.
 *
 * @param iconName Icon name.
 * @param iconNode Icon node.
 * @param aliases Optional icon aliases.
 * @returns Adwaita icon component.
 */
function createAdwaitaIcon(
  iconName: string,
  iconNode: AdwaitaIconNode[],
  aliases?: string[],
): AdwaitaIcon;

function createAdwaitaIcon(
  iconDataOrName: AdwaitaIconData | string,
  iconNode: AdwaitaIconNode[] = [],
  aliases: string[] = [],
): AdwaitaIcon {
  const iconData =
    typeof iconDataOrName === 'string'
      ? toAdwaitaIconData(iconDataOrName, iconNode, aliases)
      : iconDataOrName;

  const Component = forwardRef<SVGSVGElement, AdwaitaProps>(({ className, ...props }, ref) =>
    createElement(Icon, {
      ref,
      icon: iconData,
      className,
      ...props,
    }),
  );

  if (iconData.name) {
    Component.displayName = toPascalCase(iconData.name);
  }

  return Component;
}

export default createAdwaitaIcon;
