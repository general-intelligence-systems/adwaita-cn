"use strict";
"use client";
import { forwardRef, createElement } from 'react';
import { mergeClasses } from './shared/src/utils/mergeClasses.mjs';
import buildAdwaitaIconForReact from './shared/src/build/buildAdwaitaIconForReact.mjs';
import { hasA11yProp } from './shared/src/utils/hasA11yProp.mjs';
import { useAdwaitaContext } from './context.mjs';

const Icon = forwardRef(
  ({
    color,
    size,
    width,
    height,
    strokeWidth,
    absoluteStrokeWidth,
    nonScalingStroke,
    className = "",
    children,
    iconNode = [],
    icon = {
      node: iconNode,
      aliases: [],
      // 16 and not lucide's 24: a symbolic icon is drawn on GTK's 16px grid, which is
      // what icons/ is normalised to and what the default attributes state.
      size: 16
    },
    ...rest
  }, ref) => {
    const {
      size: contextSize = 16,
      strokeWidth: contextStrokeWidth = 2,
      absoluteStrokeWidth: contextAbsoluteStrokeWidth = false,
      nonScalingStroke: contextNonScalingStroke = false,
      color: contextColor = "currentColor",
      className: contextClass = ""
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
      attributes: rest
    });
    return createElement(
      name,
      {
        ref,
        ...svgAttributes
      },
      [
        ...builtIconNode.map(([tag, attrs]) => createElement(tag, attrs)),
        ...Array.isArray(children) ? children : [children]
      ]
    );
  }
);

export { Icon as default };
//# sourceMappingURL=Icon.mjs.map
