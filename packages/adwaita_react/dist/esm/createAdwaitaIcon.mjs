import { forwardRef, createElement } from 'react';
import { toAdwaitaIconData } from './shared/src/utils/toAdwaitaIconData.mjs';
import { toPascalCase } from './shared/src/utils/toPascalCase.mjs';
import Icon from './Icon.mjs';

function createAdwaitaIcon(iconDataOrName, iconNode = [], aliases = []) {
  const iconData = typeof iconDataOrName === "string" ? toAdwaitaIconData(iconDataOrName, iconNode, aliases) : iconDataOrName;
  const Component = forwardRef(
    ({ className, ...props }, ref) => createElement(Icon, {
      ref,
      icon: iconData,
      className,
      ...props
    })
  );
  if (iconData.name) {
    Component.displayName = toPascalCase(iconData.name);
  }
  return Component;
}

export { createAdwaitaIcon as default };
//# sourceMappingURL=createAdwaitaIcon.mjs.map
