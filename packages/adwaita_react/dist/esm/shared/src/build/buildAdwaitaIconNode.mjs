import defaultAttributes from './defaultAttributes.mjs';
import { mergeClasses } from '../utils/mergeClasses.mjs';

function isDefined(value) {
  return value !== null && value !== void 0;
}
function buildAdwaitaIconNode(icon, params = {}) {
  const attributeNames = params.attributeNames ?? {};
  const getAttributeName = (attributeName) => attributeNames[attributeName] ?? attributeName;
  const viewBoxWidth = icon.size ?? icon.width ?? defaultAttributes["width"];
  const viewBoxHeight = icon.size ?? icon.height ?? defaultAttributes["height"];
  const prefixed = (name) => name.startsWith("adw-") ? name : `adw-${name}`;
  const aliasClassNames = icon.aliases?.filter((alias) => typeof alias === "string" && alias.trim() !== "").map(prefixed) ?? [];
  const iconClassNames = [...icon.name ? [prefixed(icon.name)] : [], ...aliasClassNames];
  const classNamesFromClassName = params.className?.split(" ").filter(Boolean) ?? [];
  const className = params.includeDefaultClasses === false ? mergeClasses(...classNamesFromClassName) : mergeClasses("adw", ...iconClassNames, ...classNamesFromClassName);
  const attributes = {
    ...Object.entries(defaultAttributes).reduce((attrs, [attrName, value]) => {
      attrs[getAttributeName(attrName)] = value;
      return attrs;
    }, {}),
    // `color` rather than `fill`, so that the stroked libadwaita icons take the colour too.
    // A status icon names its own colour per path and so is unaffected, which is the point:
    // a flat battery stays red inside a button whose foreground is white.
    ..."color" in params && params.color && {
      [getAttributeName("color")]: params.color
    },
    ..."size" in params && isDefined(params.size) && {
      [getAttributeName("width")]: params.size,
      [getAttributeName("height")]: params.size
    },
    ..."width" in params && isDefined(params.width) && {
      [getAttributeName("width")]: params.width
    },
    ..."height" in params && isDefined(params.height) && {
      [getAttributeName("height")]: params.height
    },
    ...className && {
      [getAttributeName("class")]: className
    },
    [getAttributeName("viewBox")]: `0 0 ${viewBoxWidth} ${viewBoxHeight}`,
    ...params.hasA11yProp === false ? {
      [getAttributeName("aria-hidden")]: "true"
    } : {},
    ..."attributes" in params && params.attributes
  };
  const renameAttributes = (attrs) => Object.entries(attrs).reduce((renamed, [attrName, value]) => {
    renamed[getAttributeName(attrName)] = value;
    return renamed;
  }, {});
  const renameNode = ([name, attrs, children]) => children ? [name, renameAttributes(attrs), children.map(renameNode)] : [name, renameAttributes(attrs)];
  return ["svg", attributes, icon.node.map(renameNode)];
}

export { buildAdwaitaIconNode as default };
//# sourceMappingURL=buildAdwaitaIconNode.mjs.map
