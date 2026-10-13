'use client';

import { createElement, forwardRef, useEffect, useState, type JSX } from 'react';
import { AdwaitaIcon, AdwaitaIconData, AdwaitaProps } from './types';
import dynamicIconImports from './dynamicIconImports';
import Icon from './Icon';

export type DynamicIconModule = {
  default: AdwaitaIcon;
  __iconData?: AdwaitaIconData;
};

export type IconName = keyof typeof dynamicIconImports;

export const iconNames = Object.keys(dynamicIconImports) as Array<IconName>;

interface DynamicIconComponentProps extends AdwaitaProps {
  name: IconName;
  fallback?: () => JSX.Element | null;
}

async function getIconData(name: IconName) {
  if (!(name in dynamicIconImports)) {
    throw new Error('[adwaita_react]: Name in Adwaita DynamicIcon not found');
  }

  // TODO: Replace this with a generic iconNode package.
  const icon = (await dynamicIconImports[name]()) as DynamicIconModule;

  if (icon.__iconData != null) {
    return icon.__iconData;
  }

  throw new Error('[adwaita_react]: Failed to resolve icon data for DynamicIcon');
}

/**
 * Dynamic Adwaita icon component
 *
 * @component Icon
 * @param {object} props
 * @param {string} props.color - The color of the icon
 * @param {number} props.size - The size of the icon
 * @param {number} props.strokeWidth - The stroke width of the icon
 * @param {boolean} props.absoluteStrokeWidth - Whether to use absolute stroke width
 * @param {boolean} props.nonScalingStroke - Whether to use non scaling strokes
 * @param {string} props.className - The class name of the icon
 * @param {AdwaitaIconNode[]} props.children - The children of the icon
 * @param {AdwaitaIconNode[]} props.iconNode - The icon node of the icon
 *
 * @returns {ForwardRefExoticComponent} AdwaitaIcon
 */
const DynamicIcon = forwardRef<SVGSVGElement, DynamicIconComponentProps>(
  ({ name, fallback: Fallback, ...props }, ref) => {
    const [iconData, setIconData] = useState<AdwaitaIconData>();

    useEffect(() => {
      getIconData(name)
        .then(setIconData)
        .catch((error) => {
          console.error(error);
        });
    }, [name]);

    if (iconData == null) {
      if (Fallback == null) {
        return null;
      }

      return createElement(Fallback);
    }

    return createElement(Icon, {
      ref,
      ...props,
      icon: iconData,
    });
  },
);

export default DynamicIcon;
