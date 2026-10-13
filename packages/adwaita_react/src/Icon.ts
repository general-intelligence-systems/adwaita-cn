'use client';

import { createElement, forwardRef } from 'react';
import { buildAdwaitaIconForReact, hasA11yProp, mergeClasses } from '@adwaita/shared';
import { AdwaitaIconData, AdwaitaIconNode, AdwaitaProps } from './types';
import { useAdwaitaContext } from './context';

type IconComponentProps = AdwaitaProps &
  (
    | {
        iconNode: AdwaitaIconNode[];
        icon?: never;
      }
    | {
        icon: AdwaitaIconData;
        iconNode?: never;
      }
  );

/**
 * Adwaita icon component
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
const Icon = forwardRef<SVGSVGElement, IconComponentProps>(
  (
    {
      color,
      size,
      width,
      height,
      strokeWidth,
      absoluteStrokeWidth,
      nonScalingStroke,
      className = '',
      children,
      iconNode = [],
      icon = {
        node: iconNode,
        aliases: [],
        // 16 and not lucide's 24: a symbolic icon is drawn on GTK's 16px grid, which is
        // what icons/ is normalised to and what the default attributes state.
        size: 16,
      },
      ...rest
    },
    ref,
  ) => {
    const {
      size: contextSize = 16,
      strokeWidth: contextStrokeWidth = 2,
      absoluteStrokeWidth: contextAbsoluteStrokeWidth = false,
      nonScalingStroke: contextNonScalingStroke = false,
      color: contextColor = 'currentColor',
      className: contextClass = '',
    } = useAdwaitaContext() ?? {};

    const hasAccessibleProp = Boolean(children) || hasA11yProp(rest);

    const [name, svgAttributes, builtIconNode = []] = buildAdwaitaIconForReact(icon, {
      color: color ?? contextColor,
      width: width ?? size ?? contextSize,
      height: height ?? size ?? contextSize,
      strokeWidth: strokeWidth ?? contextStrokeWidth,
      absoluteStrokeWidth: absoluteStrokeWidth ?? contextAbsoluteStrokeWidth,
      nonScalingStroke: nonScalingStroke ?? contextNonScalingStroke,
      className: mergeClasses(contextClass, className),
      hasA11yProp: hasAccessibleProp,
      attributes: rest,
    });

    return createElement(
      name,
      {
        ref,
        ...svgAttributes,
      },
      [
        ...builtIconNode.map(([tag, attrs]) => createElement(tag, attrs)),
        ...(Array.isArray(children) ? children : [children]),
      ],
    );
  },
);

export default Icon;
