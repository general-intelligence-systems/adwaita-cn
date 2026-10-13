import { toKebabCase } from './toKebabCase.mjs';

function toAdwaitaIconData(iconName, iconNode, aliases = []) {
  if (iconNode == null) {
    throw new Error("[adwaita]: iconNode is required when icon name is used");
  }
  return {
    name: toKebabCase(iconName),
    size: 24,
    node: iconNode,
    ...aliases.length > 0 ? { aliases } : {}
  };
}

export { toAdwaitaIconData };
//# sourceMappingURL=toAdwaitaIconData.mjs.map
