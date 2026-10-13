'use strict';

var react = require('react');

const defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "currentColor"
};

const mergeClasses = (...classes) => classes.filter((className, index, array) => {
  return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
}).join(" ").trim();

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

function buildAdwaitaIconForReact(icon, params = {}) {
  return buildAdwaitaIconNode(icon, {
    ...params,
    attributeNames: {
      ...params.attributeNames,
      class: "className",
      "stroke-width": "strokeWidth",
      "stroke-linecap": "strokeLinecap",
      "stroke-linejoin": "strokeLinejoin",
      "vector-effect": "vectorEffect",
      // Wider than lucide's list, because Adwaita's shapes carry more than geometry.
      // lucide's icons are a bare `d` on a path and the root holds all the presentation;
      // the GNOME set paints per shape -- 116 of its paths carry `fill-opacity`, the
      // stroked libadwaita icons carry their own joins and caps -- and React rejects the
      // SVG spelling of every one of them with a warning and no attribute.
      "fill-opacity": "fillOpacity",
      "fill-rule": "fillRule",
      "stroke-opacity": "strokeOpacity",
      "stroke-dasharray": "strokeDasharray",
      "stroke-dashoffset": "strokeDashoffset",
      "stroke-miterlimit": "strokeMiterlimit",
      "paint-order": "paintOrder",
      "clip-path": "clipPath",
      "clip-rule": "clipRule",
      "color-interpolation": "colorInterpolation",
      "shape-rendering": "shapeRendering",
      "stop-color": "stopColor",
      "stop-opacity": "stopOpacity"
    }
  });
}

const hasA11yProp = (props) => {
  for (const prop in props) {
    if (prop.startsWith("aria-") || prop === "role" || prop === "title") {
      return true;
    }
  }
  return false;
};

const toCamelCase = (string) => {
  let out = "";
  let upperNext = false;
  for (const ch of string) {
    if (ch === "-" || ch === "_" || ch <= " ") {
      upperNext = out.length > 0;
      continue;
    }
    if (out.length === 0) {
      out += ch.toLowerCase();
    } else {
      out += upperNext ? ch.toUpperCase() : ch;
    }
    upperNext = false;
  }
  return out;
};

const toKebabCase = (string) => string?.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

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

const toPascalCase = (string) => {
  const camelCase = toCamelCase(string);
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
};

const AdwaitaContext = react.createContext({});
function AdwaitaProvider({
  children,
  size,
  color,
  strokeWidth,
  absoluteStrokeWidth,
  nonScalingStroke,
  className
}) {
  const value = react.useMemo(
    () => ({
      size,
      color,
      strokeWidth,
      absoluteStrokeWidth,
      nonScalingStroke,
      className
    }),
    [size, color, strokeWidth, absoluteStrokeWidth, nonScalingStroke, className]
  );
  return react.createElement(AdwaitaContext.Provider, { value }, children);
}
const useAdwaitaContext = () => react.useContext(AdwaitaContext);

const Icon = react.forwardRef(
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
    return react.createElement(
      name,
      {
        ref,
        ...svgAttributes
      },
      [
        ...builtIconNode.map(([tag, attrs]) => react.createElement(tag, attrs)),
        ...Array.isArray(children) ? children : [children]
      ]
    );
  }
);

function createAdwaitaIcon(iconDataOrName, iconNode = [], aliases = []) {
  const iconData = typeof iconDataOrName === "string" ? toAdwaitaIconData(iconDataOrName, iconNode, aliases) : iconDataOrName;
  const Component = react.forwardRef(
    ({ className, ...props }, ref) => react.createElement(Icon, {
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

const __iconData$9u = { "name": "ac-adapter", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.015625 -1.449219 0.355469 c -0.738281 0.371093 -1.550781 1.3125 -1.550781 2.644531 v 8 s -0.015625 0.707031 0.355469 1.449219 c 0.371093 0.738281 1.3125 1.550781 2.644531 1.550781 h 6 s 0.707031 0.015625 1.449219 -0.355469 c 0.738281 -0.371093 1.550781 -1.3125 1.550781 -2.644531 v -8 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 z m -2 4 h 6 c 0.554688 0 1 0.445312 1 1 v 8 c 0 0.554688 -0.445312 1 -1 1 h -6 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 z m 3.875 0.992188 c -0.042969 0 -0.082031 0.003906 -0.125 0.007812 c -0.179688 0.050781 -0.34375 0.148438 -0.46875 0.28125 l -3.03125 3 c -0.234375 0.230469 -0.34375 0.582031 -0.28125 0.90625 v 0.8125 h 2.46875 l -1.1875 1.273438 c -0.210938 0.21875 -0.320312 0.539062 -0.28125 0.84375 v 0.09375 v 0.78125 h 1 c 0.265625 0.003906 0.53125 -0.097657 0.71875 -0.28125 l 3 -2.992188 c 0.1875 -0.191406 0.289062 -0.453125 0.28125 -0.71875 c 0.003906 -0.042969 0.003906 -0.082031 0 -0.125 v -0.875 h -2.5625 l 1.3125 -1.28125 c 0.214844 -0.21875 0.320312 -0.539062 0.28125 -0.84375 c 0 -0.03125 0 -0.0625 0 -0.09375 v -0.78125 h -0.9375 c -0.019531 0 -0.042969 0 -0.0625 0 c -0.042969 -0.003906 -0.082031 -0.007812 -0.125 -0.007812 z m 0 0", "key": "x2fhpo" }]], "aliases": ["ac-adapter-symbolic"], "gtkIconName": "ac-adapter-symbolic" };
__iconData$9u.node;
const AcAdapter = createAdwaitaIcon(__iconData$9u);

const __iconData$9t = { "name": "accessories-calculator", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M2.031 0c-.542 0-1 .329-1 .938v14.124c0 .587.377.938 1 .938h13.031c.52 0 .938-.351.938-.938V.938A.908.908 0 0015.062 0zM3 2.031h11.031V5H3zM3.188 6h1.624A.18.18 0 015 6.188v1.625A.18.18 0 014.812 8H3.188A.179.179 0 013 7.812V6.188a.18.18 0 01.188-.187zm3 0h1.625A.18.18 0 018 6.188v1.625A.18.18 0 017.812 8H6.188A.179.179 0 016 7.812V6.188a.18.18 0 01.188-.187zm3 0h1.624a.18.18 0 01.188.188v1.625a.18.18 0 01-.188.187H9.188A.179.179 0 019 7.812V6.188a.18.18 0 01.188-.187zm3 0h1.624a.18.18 0 01.188.188v1.625a.18.18 0 01-.188.187h-1.624A.179.179 0 0112 7.812V6.188a.18.18 0 01.188-.187zm-9 3h1.624A.18.18 0 015 9.188v1.624a.18.18 0 01-.188.188H3.188A.179.179 0 013 10.812V9.188C3 9.076 3.077 9 3.188 9zm3 0h1.625A.18.18 0 018 9.188v1.624a.18.18 0 01-.188.188H6.188A.179.179 0 016 10.812V9.188C6 9.076 6.077 9 6.188 9zm3 0h1.624a.18.18 0 01.188.188v1.624a.18.18 0 01-.188.188H9.188A.179.179 0 019 10.812V9.188C9 9.076 9.077 9 9.188 9zm3 0h1.624a.18.18 0 01.188.188v1.624a.18.18 0 01-.188.188h-1.624a.179.179 0 01-.188-.188V9.188A.18.18 0 0112.188 9zm-9 3h1.624a.18.18 0 01.188.188v1.624a.18.18 0 01-.188.188H3.188A.179.179 0 013 13.812v-1.624A.18.18 0 013.188 12zm3 0h1.625a.18.18 0 01.187.188v1.624a.18.18 0 01-.188.188H6.188A.179.179 0 016 13.812v-1.624A.18.18 0 016.188 12zm3 0h1.624a.18.18 0 01.188.188v1.624a.18.18 0 01-.188.188H9.188A.179.179 0 019 13.812v-1.624A.18.18 0 019.188 12zm3 0h1.624a.18.18 0 01.188.188v1.624a.18.18 0 01-.188.188h-1.624a.179.179 0 01-.188-.188v-1.624a.18.18 0 01.188-.188z", "key": "1qpiy4" }]], "aliases": ["accessories-calculator-symbolic"], "gtkIconName": "accessories-calculator-symbolic" };
__iconData$9t.node;
const AccessoriesCalculator = createAdwaitaIcon(__iconData$9t);

const __iconData$9s = { "name": "accessories-character-map", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M3.702 1C2.17 1 .984 2.32.984 3.844v8.344c0 1.524 1.185 2.843 2.718 2.843h8.58c1.532 0 2.75-1.32 2.75-2.844V3.845c0-1.525-1.218-2.844-2.75-2.844zm.782 1.031c3.526.256 5.317.134 7.047 0 .754-.058 1.532.616 1.532 1.438v7.375c0 .665-.532 1.095-1.188 1.187-2.836.397-4.753.44-7.673 0-.655-.099-1.187-.522-1.187-1.187V3.5c0-.822.714-1.524 1.469-1.469z", "key": "85g5rt" }], ["path", { "fill": "currentColor", "d": "M10.564 5.977l-2.939.044.016 1 2.879-.043c.2.018.33.076.396.135.067.06.105.121.105.293l-.008.604H8.517l.037.002a1.457 1.457 0 00-1.164.43 1.558 1.558 0 00-.416 1.023c-.013.367.092.75.352 1.053.26.303.687.496 1.162.482h3.482l.051-3.59v-.004c0-.402-.16-.786-.435-1.035-.276-.249-.63-.364-.998-.393zM8.48 9.01h2.519l-.014.99H8.457c-.22.007-.302-.051-.371-.133a.553.553 0 01-.112-.367.587.587 0 01.141-.371c.079-.083.163-.134.363-.12zm2.862-5.985l-3 1 .316.95 3-1z", "key": "lvowfm" }]], "aliases": ["accessories-character-map-symbolic"], "gtkIconName": "accessories-character-map-symbolic" };
__iconData$9s.node;
const AccessoriesCharacterMap = createAdwaitaIcon(__iconData$9s);

const __iconData$9r = { "name": "accessories-dictionary", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M9.57 1.184c-.567.078-1.251.35-2.015.753-1.541-.844-2.741-.896-3.748-.638-1.07.274-1.938.722-3.291.681L0 1.965v10.81h.5c1.322 0 2.48-.601 3.555-.867 1.075-.265 1.992-.296 3.144.738l.338.305.336-.308c1.119-1.033 2.01-1.004 3.074-.74 1.065.263 2.224.864 3.55.872l.503.004V1.982L14.482 2c-1.516.055-2.27-.394-3.25-.684a3.84 3.84 0 00-1.662-.132zm.11.96c.478-.07.854.01 1.267.131.726.215 1.679.602 3.053.664v8.707c-.875-.127-1.778-.459-2.812-.714-1.12-.277-2.408-.163-3.655.8-1.278-.967-2.586-1.074-3.717-.795-1.043.258-1.946.59-2.816.711v-8.73c1.274-.073 2.247-.444 3.055-.65.924-.237 1.727-.287 3.242.623l.252.152.254-.147C8.62 2.43 9.2 2.214 9.68 2.145z", "key": "1yucx6" }], ["path", { "fill": "currentColor", "d": "M7 2.397h1V12H7z", "key": "13wszg" }], ["path", { "fill": "currentColor", "d": "M0 2.5V16h15V2.518h-2V14H2V2.5z", "key": "7pexzn" }]], "aliases": ["accessories-dictionary-symbolic"], "gtkIconName": "accessories-dictionary-symbolic" };
__iconData$9r.node;
const AccessoriesDictionary = createAdwaitaIcon(__iconData$9r);

const __iconData$9q = { "name": "accessories-text-editor", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M5.5 6.007a.5.5 0 100 1h6a.5.5 0 100-1zm0 2a.5.5 0 100 1h5a.5.5 0 100-1zm0 2a.5.5 0 100 1h6a.5.5 0 100-1zm0 2a.5.5 0 100 1h3a.5.5 0 100-1z", "key": "ymczf6" }], ["path", { "fill": "currentColor", "d": "M4 1.007c-1.09 0-2 .91-2 2v11c0 1.09.91 2 2 2h9c1.09 0 2-.91 2-2v-11c0-1.09-.91-2-2-2v13H4v-13z", "key": "6ltofl" }], ["path", { "fill": "currentColor", "d": "M5.492 0A.5.5 0 005 .506v3a.5.5 0 101 0v-3A.5.5 0 005.492 0zm2 0A.5.5 0 007 .506v3a.5.5 0 101 0v-3A.5.5 0 007.492 0zm2 0A.5.5 0 009 .506v3a.5.5 0 101 0v-3A.5.5 0 009.492 0zm2 0A.5.5 0 0011 .506v3a.5.5 0 101 0v-3A.5.5 0 0011.492 0z", "key": "8q7135" }]], "aliases": ["accessories-text-editor-symbolic"], "gtkIconName": "accessories-text-editor-symbolic" };
__iconData$9q.node;
const AccessoriesTextEditor = createAdwaitaIcon(__iconData$9q);

const __iconData$9p = { "name": "action-unavailable", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8.003906 0 c -4.410156 0 -7.99999975 3.589844 -7.99999975 8 s 3.58984375 8 7.99999975 8 s 8 -3.589844 8 -8 s -3.589844 -8 -8 -8 z m 0 2 c 3.332032 0 6 2.667969 6 6 c 0 1.300781 -0.40625 2.503906 -1.105468 3.480469 l -8.378907 -8.375 c 0.980469 -0.699219 2.183594 -1.105469 3.484375 -1.105469 z m -4.894531 2.519531 l 8.378906 8.375 c -0.980469 0.699219 -2.183593 1.105469 -3.484375 1.105469 c -3.332031 0 -6 -2.667969 -6 -6 c 0 -1.300781 0.40625 -2.503906 1.105469 -3.480469 z m 0 0", "key": "yh3tas" }]], "aliases": ["action-unavailable-symbolic"], "gtkIconName": "action-unavailable-symbolic" };
__iconData$9p.node;
const ActionUnavailable = createAdwaitaIcon(__iconData$9p);

const __iconData$9o = { "name": "address-book-new", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 5 0 c -1.292969 0 -2.40625 0.839844 -2.824219 2 h -1.175781 v 2 h 1 v 1 h -1 v 2 h 1 v 1 h -1 v 2 h 1 v 1 h -1 v 2 h 1.175781 c 0.417969 1.160156 1.53125 2 2.824219 2 h 1 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 v -9 c 0 -0.554688 0.445312 -1 1 -1 h 7 c 0.570312 0 0.886719 0.441406 1 1 v 3 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -3 c 0 -1.644531 -1.355469 -3 -3 -3 z m 3.523438 4 c -0.078126 0 -0.15625 0.003906 -0.238282 0.011719 c -0.214844 0.015625 -0.429687 0.046875 -0.640625 0.101562 c -1.710937 0.433594 -2.839843 2.082031 -2.617187 3.832031 c 0.152344 1.214844 0.925781 2.222657 1.972656 2.722657 v -0.667969 h 1.332031 c -1.1875 -0.078125 -2.160156 -0.980469 -2.3125 -2.179688 c -0.160156 -1.257812 0.640625 -2.425781 1.867188 -2.738281 c 0.617187 -0.15625 1.28125 -0.078125 1.808593 0.164063 c 0.527344 0.242187 0.890626 0.628906 1.003907 1.058594 c 0.0625 0.230468 0.082031 0.472656 0.070312 0.695312 h 1.007813 c 0.011718 -0.320312 -0.027344 -0.644531 -0.109375 -0.953125 c -0.210938 -0.785156 -0.820313 -1.371094 -1.554688 -1.710937 c -0.484375 -0.21875 -1.027343 -0.339844 -1.585937 -0.335938 z m -0.023438 2.007812 c -0.824219 0 -1.5 0.675782 -1.5 1.5 c 0 0.820313 0.675781 1.5 1.5 1.5 c 0.175781 0 0.34375 -0.039062 0.5 -0.09375 v 0.042969 l 0.449219 0.046875 c 0.191406 0.019532 0.375 0.015625 0.550781 -0.003906 v -1.496094 c 0 -0.820312 -0.675781 -1.5 -1.5 -1.5 z m 0 1 c 0.28125 0 0.5 0.214844 0.5 0.5 c 0 0.28125 -0.21875 0.5 -0.5 0.5 s -0.5 -0.21875 -0.5 -0.5 c 0 -0.285156 0.21875 -0.5 0.5 -0.5 z m 2.5 0.992188 v 3 h -3 v 2 h 3 v 3 h 2 v -3 h 3 v -2 h -3 v -3 z m -1.15625 1.78125 s -0.605469 0.191406 -1.1875 0.21875 h 1.257812 z m 0 0", "key": "17cz2b" }]], "aliases": ["address-book-new-symbolic"], "gtkIconName": "address-book-new-symbolic" };
__iconData$9o.node;
const AddressBookNew = createAdwaitaIcon(__iconData$9o);

const __iconData$9n = { "name": "adw-adaptive-preview", "size": 16, "node": [["path", { "fill": "none", "stroke": "currentColor", "stroke-width": "2", "stroke-linecap": "butt", "stroke-linejoin": "round", "stroke-opacity": "1", "d": "M 11.0350285 6 L 12.9649715 6 C 14.0923767 6, 15 6.90762281, 15 8.03502846 L 15 12.9649715 C 15 14.0923767, 14.0923767 15, 12.9649715 15 L 11.0350285 15 C 9.90762234 15, 9 14.0923767, 9 12.9649715 L 9 8.03502846 C 9 6.90762281, 9.90762234 6, 11.0350285 6 Z M 7 15 L 4.03502798 15 C 2.90762258 15, 2 14.0923767, 2 12.9649715 L 2 3.03502822 C 2 1.90762258, 2.90762258 1, 4.03502798 1 L 10.9649715 1 C 12.0923767 1, 13 1.90762258, 13 3.03502822 L 13 4", "key": "1jad3a" }]], "aliases": ["adw-adaptive-preview-symbolic"], "gtkIconName": "adw-adaptive-preview-symbolic" };
__iconData$9n.node;
const AdwAdaptivePreview = createAdwaitaIcon(__iconData$9n);

const __iconData$9m = { "name": "adw-application-exit-rtl", "size": 16, "node": [["path", { "fill": "none", "stroke": "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "d": "M 6 5 L 6 4 C 6 2.89543056, 6.89543056 2, 8 2 L 12 2 C 13.1045694 2, 14 2.89543056, 14 4 L 14 12 C 14 13.1045694, 13.1045694 14, 12 14 L 8 14 C 6.89543056 14, 6 13.1045694, 6 12 L 6 11", "key": "19o40i" }], ["path", { "fill": "none", "stroke": "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "d": "M 3 6 L 1 8 L 3 10 M 9 8 L 1 8", "key": "p58xla" }]], "aliases": ["adw-application-exit-symbolic-rtl"], "gtkIconName": "adw-application-exit-symbolic-rtl" };
__iconData$9m.node;
const AdwApplicationExitRtl = createAdwaitaIcon(__iconData$9m);

const __iconData$9l = { "name": "adw-application-exit", "size": 16, "node": [["path", { "fill": "none", "stroke": "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "d": "M 10 5 L 10 4 C 10 2.89543056, 9.10456944 2, 8 2 L 4 2 C 2.89543056 2, 2 2.89543056, 2 4 L 2 12 C 2 13.1045694, 2.89543056 14, 4 14 L 8 14 C 9.10456944 14, 10 13.1045694, 10 12 L 10 11", "key": "whl97k" }], ["path", { "fill": "none", "stroke": "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "d": "M 13 6 L 15 8 L 13 10 M 7 8 L 15 8", "key": "yi7o8w" }]], "aliases": ["adw-application-exit-symbolic"], "gtkIconName": "adw-application-exit-symbolic" };
__iconData$9l.node;
const AdwApplicationExit = createAdwaitaIcon(__iconData$9l);

const __iconData$9k = { "name": "adw-avatar-default", "size": 16, "node": [["path", { "fill": "none", "stroke": "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-dasharray": "none", "paint-order": "stroke markers fill", "d": "M 15 15 A 4 4 45 0 0 11 11 L 5 11 A 4 4 135 0 0 1 15 M 12 5 C 12 7.20914, 10.2091 9, 8 9 C 5.79086 9, 4 7.20914, 4 5 C 4 2.79086, 5.79086 1, 8 1 C 10.2091 1, 12 2.79086, 12 5 Z", "key": "1dyo28" }]], "aliases": ["adw-avatar-default-symbolic"], "gtkIconName": "adw-avatar-default-symbolic" };
__iconData$9k.node;
const AdwAvatarDefault = createAdwaitaIcon(__iconData$9k);

const __iconData$9j = { "name": "adw-entry-apply", "size": 16, "node": [["path", { "fill": "none", "stroke": "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "d": "M 3 9 L 6 12 L 13 4", "key": "rtcyz4" }]], "aliases": ["adw-entry-apply-symbolic"], "gtkIconName": "adw-entry-apply-symbolic" };
__iconData$9j.node;
const AdwEntryApply = createAdwaitaIcon(__iconData$9j);

const __iconData$9i = { "name": "adw-entry-edit", "size": 16, "node": [["path", { "fill": "none", "stroke": "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "d": "M 2 13 L 3 14 M 2 11 L 5 14 M 10 3 L 13 6 M 2 14 L 2 11 L 10.458621 2.54137921 C 11.3099012 1.69009948, 12.6900988 1.69009948, 13.541379 2.54137921 C 14.3469534 3.3926599, 14.3099003 4.73580599, 13.4586191 5.54137945 L 5 14 Z", "key": "5yxl1l" }]], "aliases": ["adw-entry-edit-symbolic"], "gtkIconName": "adw-entry-edit-symbolic" };
__iconData$9i.node;
const AdwEntryEdit = createAdwaitaIcon(__iconData$9i);

const __iconData$9h = { "name": "adw-expander-arrow", "size": 16, "node": [["path", { "fill": "none", "stroke": "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "d": "M 3 10 L 8 4.99999952 L 13 10", "key": "fq3qi5" }]], "aliases": ["adw-expander-arrow-symbolic"], "gtkIconName": "adw-expander-arrow-symbolic" };
__iconData$9h.node;
const AdwExpanderArrow = createAdwaitaIcon(__iconData$9h);

const __iconData$9g = { "name": "adw-external-link", "size": 16, "node": [["path", { "fill": "none", "stroke": "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "d": "M 10 1 L 15 1 L 15 6 M 8 8 L 15 1 M 7 3 L 3 3 C 1.89543045 3, 1 3.89543056, 1 5 L 1 13 C 1 14.1045694, 1.89543045 15, 3 15 L 11 15 C 12.1045694 15, 13 14.1045694, 13 13 L 13 9", "key": "d8aid" }]], "aliases": ["adw-external-link-symbolic"], "gtkIconName": "adw-external-link-symbolic" };
__iconData$9g.node;
const AdwExternalLink = createAdwaitaIcon(__iconData$9g);

const __iconData$9f = { "name": "adw-mail-send", "size": 16, "node": [["path", { "fill": "none", "stroke": "currentColor", "stroke-width": "2", "stroke-linecap": "butt", "stroke-linejoin": "round", "d": "M 14.4896545 10.6758623 L 8 15 L 1.51724136 10.6689663 M 1 16 L 1 12 C 1 10.8954296, 1.89543045 10, 3 10 L 13 10 C 14.1045694 10, 15 10.8954296, 15 12 L 15 16", "key": "u1rqpf" }], ["path", { "fill": "none", "stroke": "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "d": "M 5 4 L 8 1 L 11 4 M 8 7 L 8 1", "key": "dgd3aa" }]], "aliases": ["adw-mail-send-symbolic"], "gtkIconName": "adw-mail-send-symbolic" };
__iconData$9f.node;
const AdwMailSend = createAdwaitaIcon(__iconData$9f);

const __iconData$9e = { "name": "adw-rotate-acw", "size": 16, "node": [["path", { "fill": "none", "stroke": "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "d": "M 5 10 L 3 12 L 1 10 M 3 12 L 3 8 C 3 5.28436613, 4.82398462 2.90730286, 7.44708586 2.20444489 C 10.0701866 1.50158751, 12.838335 2.64819217, 14.1961517 5 C 15.5539694 7.35180807, 15.1628838 10.3223982, 13.2426414 12.2426414", "key": "j156q" }]], "aliases": ["adw-rotate-acw-symbolic"], "gtkIconName": "adw-rotate-acw-symbolic" };
__iconData$9e.node;
const AdwRotateAcw = createAdwaitaIcon(__iconData$9e);

const __iconData$9d = { "name": "adw-rotate-cw", "size": 16, "node": [["path", { "fill": "none", "stroke": "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "d": "M 10.9981413 10 L 12.9981413 12 L 14.9981413 10 M 12.9981413 12 L 12.9981413 8 C 12.9981413 5.28436613, 11.1741562 2.90730286, 8.55105495 2.20444489 C 5.9279542 1.50158751, 3.15980577 2.64819217, 1.80198896 5 C 0.444171309 7.35180807, 0.835256875 10.3223982, 2.75549936 12.2426414", "key": "1juq6p" }]], "aliases": ["adw-rotate-cw-symbolic"], "gtkIconName": "adw-rotate-cw-symbolic" };
__iconData$9d.node;
const AdwRotateCw = createAdwaitaIcon(__iconData$9d);

const __iconData$9c = { "name": "adw-screenshot", "size": 16, "node": [["path", { "fill": "none", "stroke": "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "d": "M 5 9 C 5 10.6568546, 6.34314585 12, 8 12 C 9.65685463 12, 11 10.6568546, 11 9 C 11 7.34314585, 9.65685463 6, 8 6 C 6.34314585 6, 5 7.34314585, 5 9 Z M 3 15 L 13 15 C 14.1045694 15, 15 14.1045694, 15 13 L 15 6 C 15 4.89543056, 14.1045694 4, 13 4 L 12 4 L 10.7103453 2.71034479 C 10.2555189 2.25551844, 9.63864231 1.99999988, 8.99542046 2 L 7.00457907 2 C 6.36135769 2, 5.74448109 2.25551867, 5.28965521 2.71034479 L 4 4 L 3 4 C 1.89543045 4, 1 4.89543056, 1 6 L 1 13 C 1 14.1045694, 1.89543045 15, 3 15 Z", "key": "m44ejh" }]], "aliases": ["adw-screenshot-symbolic"], "gtkIconName": "adw-screenshot-symbolic" };
__iconData$9c.node;
const AdwScreenshot = createAdwaitaIcon(__iconData$9c);

const __iconData$9b = { "name": "adw-sidebar-rtl", "size": 16, "node": [["path", { "fill": "none", "stroke": "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "d": "M 1 4 L 1 12 C 1 13.1045694, 1.89543045 14, 3 14 L 13 14 C 14.1045694 14, 15 13.1045694, 15 12 L 15 4 C 15 2.89543056, 14.1045694 2, 13 2 L 3 2 C 1.89543045 2, 1 2.89543056, 1 4 Z", "key": "5g0wjq" }], ["path", { "fill": "currentColor", "fill-opacity": "0.2", "fill-rule": "nonzero", "stroke": "none", "d": "M 9.5 2 L 9.5 14 L 13 14 C 14.1045694 14, 15 13.1045694, 15 12 L 15 4 C 15 2.89543056, 14.1045694 2, 13 2 Z", "key": "qbgxsp" }], ["path", { "fill": "none", "stroke": "currentColor", "stroke-width": "1", "stroke-linecap": "butt", "stroke-linejoin": "round", "d": "M 9.5 2 L 9.5 14", "key": "1xnpu5" }]], "aliases": ["adw-sidebar-symbolic-rtl"], "gtkIconName": "adw-sidebar-symbolic-rtl" };
__iconData$9b.node;
const AdwSidebarRtl = createAdwaitaIcon(__iconData$9b);

const __iconData$9a = { "name": "adw-sidebar", "size": 16, "node": [["path", { "fill": "none", "stroke": "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "d": "M 15 4 L 15 12 C 15 13.1045694, 14.1045704 14, 13 14 L 3 14 C 1.89543056 14, 1 13.1045694, 1 12 L 1 4 C 1 2.89543056, 1.89543056 2, 3 2 L 13 2 C 14.1045704 2, 15 2.89543056, 15 4 Z", "key": "y749rn" }], ["path", { "fill": "currentColor", "fill-opacity": "0.2", "fill-rule": "nonzero", "stroke": "none", "d": "M 6.5 2 L 6.5 14 L 3 14 C 1.89543056 14, 1 13.1045694, 1 12 L 1 4 C 1 2.89543056, 1.89543056 2, 3 2 Z", "key": "7hblix" }], ["path", { "fill": "none", "stroke": "currentColor", "stroke-width": "1", "stroke-linecap": "butt", "stroke-linejoin": "round", "d": "M 6.5 2 L 6.5 14", "key": "1cjiml" }]], "aliases": ["adw-sidebar-symbolic"], "gtkIconName": "adw-sidebar-symbolic" };
__iconData$9a.node;
const AdwSidebar = createAdwaitaIcon(__iconData$9a);

const __iconData$99 = { "name": "adw-tab-counter", "size": 16, "node": [["rect", { "fill": "none", "stroke": "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-opacity": "1", "x": "1", "y": "1", "width": "14", "height": "14", "rx": "2.93631", "ry": "2.93631", "key": "1e87jg" }]], "aliases": ["adw-tab-counter-symbolic"], "gtkIconName": "adw-tab-counter-symbolic" };
__iconData$99.node;
const AdwTabCounter = createAdwaitaIcon(__iconData$99);

const __iconData$98 = { "name": "adw-tab-icon-missing", "size": 16, "node": [["path", { "fill": "none", "stroke": "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-opacity": "1", "d": "M 7 1 L 9 1 M 12.063693 1 C 13.6904068 1, 15 2.30959296, 15 3.93630695 M 15 7 L 15 9 M 15 12.063693 C 15 13.6904068, 13.6904068 15, 12.063693 15 M 9 15 L 7 15 M 3.93630695 15 C 2.30959296 15, 1 13.6904068, 1 12.063693 M 1 9 L 1 7 M 1 3.93630695 C 1 2.30959296, 2.30959296 1, 3.93630695 1", "key": "1pcdl9" }]], "aliases": ["adw-tab-icon-missing-symbolic"], "gtkIconName": "adw-tab-icon-missing-symbolic" };
__iconData$98.node;
const AdwTabIconMissing = createAdwaitaIcon(__iconData$98);

const __iconData$97 = { "name": "adw-tab-new", "size": 16, "node": [["path", { "fill": "none", "stroke": "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "d": "M 8 5 L 8 11 M 5 8 L 11 8 M 3.96499991 1 L 12.0349998 1 C 12.8217735 0.998669863, 13.5767059 1.31062567, 14.1330404 1.86695969 C 14.689374 2.42329359, 15.0013304 3.17822599, 15 3.96499991 L 15 12.0349998 C 15.0013304 12.8217735, 14.689374 13.5767059, 14.1330404 14.1330404 C 13.5767059 14.689374, 12.8217735 15.0013304, 12.0349998 15 L 3.96499991 15 C 3.17822599 15.0013304, 2.42329359 14.689374, 1.86695969 14.1330404 C 1.31062567 13.5767059, 0.998669863 12.8217735, 1 12.0349998 L 1 3.96499991 C 0.998669922 3.17822599, 1.31062579 2.42329359, 1.86695969 1.86695969 C 2.42329359 1.31062579, 3.17822599 0.998669922, 3.96499991 1", "key": "8nbmpr" }]], "aliases": ["adw-tab-new-symbolic"], "gtkIconName": "adw-tab-new-symbolic" };
__iconData$97.node;
const AdwTabNew = createAdwaitaIcon(__iconData$97);

const __iconData$96 = { "name": "adw-tab-overflow", "size": 16, "node": [["rect", { "fill": "none", "stroke": "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-opacity": "1", "x": "1", "y": "1", "width": "14", "height": "14", "rx": "2.93631", "ry": "2.93631", "key": "1e87jg" }], ["path", { "fill": "none", "stroke": "currentColor", "stroke-width": "1", "stroke-linecap": "butt", "stroke-linejoin": "miter", "stroke-opacity": "1", "d": "M 8 8 C 8 9.10456944, 8.89543056 10, 10 10 C 11.1045694 10, 12 9.10456944, 12 8 C 12 6.89543056, 11.1045694 6, 10 6 C 9.4250927 6, 9 6.28726196, 9 6.28726196 M 8 8 C 8 6.89543056, 7.10456944 6, 6 6 C 4.89543056 6, 4 6.89543056, 4 8 C 4 9.10456944, 4.89543056 10, 6 10 C 6.6464467 10, 7.11048555 9.66323662, 7.11048555 9.66323662", "key": "k4zehe" }]], "aliases": ["adw-tab-overflow-symbolic"], "gtkIconName": "adw-tab-overflow-symbolic" };
__iconData$96.node;
const AdwTabOverflow = createAdwaitaIcon(__iconData$96);

const __iconData$95 = { "name": "adw-tab-unpin", "size": 16, "node": [["path", { "fill": "none", "stroke": "currentColor", "stroke-width": "1", "stroke-linecap": "round", "stroke-linejoin": "round", "d": "M 8 15 L 8 10", "key": "1vs11w" }], ["path", { "fill": "none", "stroke": "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "d": "M 4 9 L 12 9 L 10 6 L 11.2572193 2.85695338 C 11.4240894 2.43977809, 11.3731556 1.96699727, 11.1212578 1.59493721 C 10.8693609 1.22287714, 10.4493113 0.999999702, 10 0.99999994 L 6 1 C 5.54237175 1, 5.11342001 1.22288549, 4.85036755 1.59735489 C 4.58731508 1.97182429, 4.52313042 2.45094609, 4.6783452 2.88144827 L 6 6 Z", "key": "q07k4w" }]], "aliases": ["adw-tab-unpin-symbolic"], "gtkIconName": "adw-tab-unpin-symbolic" };
__iconData$95.node;
const AdwTabUnpin = createAdwaitaIcon(__iconData$95);

const __iconData$94 = { "name": "airplane-mode-disabled", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1.53125 0.46875 l -1.058594 1.0625 l 5.46875 5.46875 l 3.773438 3.769531 v 0.003907 l 4.757812 4.757812 l 1.0625 -1.0625 l -4.96875 -4.964844 l 0.335938 -0.503906 h 3.09375 c 0.554687 0 1 -0.445312 1 -1 s -0.445313 -1 -1 -1 h -3.09375 l -3.6875 -5.5 c -0.265625 -0.457031 -0.285156 -0.5 -0.65625 -0.5 h -0.0625 c -0.792969 0 -0.78125 0.035156 -0.53125 1.03125 l 1.394531 4.265625 z m -0.222656 4.53125 c -0.425782 0 -0.28125 0.4375 -0.28125 0.4375 l 0.28125 2.5625 l -0.28125 2.5625 s -0.140625 0.4375 0.25 0.4375 h 0.25 c 0.210937 0 0.203125 -0.007812 0.34375 -0.21875 l 1.21875 -1.78125 h 2.726562 l -2 -2 h -0.726562 l -1.21875 -1.78125 c -0.140625 -0.207031 -0.121094 -0.21875 -0.34375 -0.21875 z m 5.84375 5.332031 l -1.1875 3.605469 c -0.261719 1.046875 -0.265625 1.0625 0.53125 1.0625 c 0.433594 0 0.433594 -0.011719 0.71875 -0.5 l 1.648437 -2.453125 z m 0 0", "key": "1m3lbw" }]], "aliases": ["airplane-mode-disabled-symbolic"], "gtkIconName": "airplane-mode-disabled-symbolic" };
__iconData$94.node;
const AirplaneModeDisabled = createAdwaitaIcon(__iconData$94);

const __iconData$93 = { "name": "airplane-mode", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 6.496094 1 c -0.792969 0 -0.78125 0.035156 -0.53125 1.03125 l 1.625 4.96875 h -4.5 l -1.21875 -1.78125 c -0.140625 -0.207031 -0.121094 -0.21875 -0.34375 -0.21875 h -0.21875 c -0.425782 0 -0.28125 0.4375 -0.28125 0.4375 l 0.28125 2.5625 l -0.28125 2.5625 s -0.140625 0.4375 0.25 0.4375 h 0.25 c 0.210937 0 0.203125 -0.007812 0.34375 -0.21875 l 1.21875 -1.78125 h 4.5 l -1.625 4.9375 c -0.261719 1.046875 -0.265625 1.0625 0.53125 1.0625 c 0.433594 0 0.433594 -0.011719 0.71875 -0.5 l 3.6875 -5.5 h 3.09375 c 0.554687 0 1 -0.445312 1 -1 s -0.445313 -1 -1 -1 h -3.09375 l -3.6875 -5.5 c -0.265625 -0.457031 -0.28125 -0.5 -0.65625 -0.5 z m 0 0", "key": "1a5da3" }]], "aliases": ["airplane-mode-symbolic"], "gtkIconName": "airplane-mode-symbolic" };
__iconData$93.node;
const AirplaneMode = createAdwaitaIcon(__iconData$93);

const __iconData$92 = { "name": "alarm", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3.335938 1.003906 c -0.4375 0.03125 -0.859376 0.175782 -1.222657 0.417969 c -1.152343 0.765625 -1.460937 2.320313 -0.691406 3.46875 l 4.15625 -2.777344 c -0.496094 -0.746093 -1.351563 -1.164062 -2.242187 -1.109375 z m 8 0 c -0.773438 0.054688 -1.484376 0.460938 -1.914063 1.109375 l 4.15625 2.777344 c 0.769531 -1.148437 0.460937 -2.703125 -0.691406 -3.46875 c -0.457031 -0.304687 -1 -0.453125 -1.550781 -0.417969 z m -3.835938 1.996094 c -3.578125 0 -6.5 2.925781 -6.5 6.5 c 0 1.6875 0.652344 3.230469 1.710938 4.386719 l -0.410157 0.398437 c -0.394531 0.386719 -0.402343 1.019532 -0.015625 1.414063 c 0.382813 0.394531 1.015625 0.40625 1.414063 0.019531 l 0.589843 -0.574219 c 0.945313 0.542969 2.042969 0.855469 3.210938 0.855469 c 1.1875 0 2.296875 -0.320312 3.257812 -0.882812 l 0.503907 0.554687 c 0.371093 0.410156 1 0.441406 1.410156 0.070313 c 0.410156 -0.371094 0.4375 -1.003907 0.070313 -1.410157 l -0.425782 -0.472656 c 1.042969 -1.15625 1.683594 -2.683594 1.683594 -4.359375 c 0 -3.574219 -2.921875 -6.5 -6.5 -6.5 z m 0 2 c 2.496094 0 4.5 2.003906 4.5 4.5 c 0 2.5 -2.003906 4.5 -4.5 4.5 s -4.5 -2 -4.5 -4.5 c 0 -2.496094 2.003906 -4.5 4.5 -4.5 z m 0 1 c -0.277344 0 -0.5 0.226562 -0.5 0.5 v 2.5 h -1.5 c -0.277344 0 -0.5 0.226562 -0.5 0.5 c 0 0.277344 0.222656 0.5 0.5 0.5 h 2 c 0.277344 0 0.5 -0.222656 0.5 -0.5 v -3 c 0 -0.273438 -0.222656 -0.5 -0.5 -0.5 z m 0 0", "key": "u43qnj" }]], "aliases": ["alarm-symbolic"], "gtkIconName": "alarm-symbolic" };
__iconData$92.node;
const Alarm = createAdwaitaIcon(__iconData$92);

const __iconData$91 = { "name": "applets-screenshooter", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M14 0c1.2 0 2 .798 2 2v4h-2V2.25c0-.124-.057-.25-.188-.25H2.188C2.056 2 2 2.126 2 2.25V14c-1.2 0-2-.923-2-2.125V2C0 .798.8 0 2 0z", "key": "1f7n6k" }], ["path", { "fill": "currentColor", "d": "M7.25 6c-.471 0-.743.542-.75 1v1H4c-.469.065-1 .542-1 1v6c0 .458.527 1 1 1h10c.473 0 1-.542 1-1V9c0-.458-.527-1-1-1h-2.5V7c0-.458-.341-1-.813-1zM9 9a3 3 0 110 6 3 3 0 010-6z", "key": "twnlzx" }], ["path", { "fill": "currentColor", "d": "M11 12a2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 012-2 2 2 0 012 2z", "key": "1kzgzu" }]], "aliases": ["applets-screenshooter-symbolic"], "gtkIconName": "applets-screenshooter-symbolic" };
__iconData$91.node;
const AppletsScreenshooter = createAdwaitaIcon(__iconData$91);

const __iconData$90 = { "name": "application-certificate", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 0 c -1.644531 0 -3 1.355469 -3 3 v 7 c 0 1.644531 1.355469 3 3 3 h 3 v -2 h -3 c -0.554688 0 -1 -0.445312 -1 -1 v -7 c 0 -0.570312 0.429688 -1 1 -1 h 10 c 0.570312 0 1 0.429688 1 1 v 7 c 0 0.554688 -0.445312 1 -1 1 h -1 v 2 h 1 c 1.644531 0 3 -1.355469 3 -3 v -7 c 0 -1.644531 -1.355469 -3 -3 -3 z m 6 4 c -1.65625 0 -3 1.34375 -3 3 c 0 0.851562 0.363281 1.664062 1 2.234375 v 6.765625 l 2 -1.5 l 2 1.5 v -6.765625 c 0.636719 -0.570313 1 -1.382813 1 -2.234375 c 0 -1.65625 -1.34375 -3 -3 -3 z m 0 0", "key": "km8t27" }]], "aliases": ["application-certificate-symbolic"], "gtkIconName": "application-certificate-symbolic" };
__iconData$90.node;
const ApplicationCertificate = createAdwaitaIcon(__iconData$90);

const __iconData$8$ = { "name": "application-exit-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 5 v 0.003906 c -0.265625 0 -0.519531 0.105469 -0.707031 0.289063 l -2 2 c -0.3906252 0.390625 -0.3906252 1.023437 0 1.414062 l 2 2 c 0.1875 0.183594 0.441406 0.289063 0.707031 0.285157 v 0.007812 h 1 v -2 h 5 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 h -5 v -2 z m 0 0", "key": "d7qa74" }], ["path", { "fill": "currentColor", "d": "m 12 1 c 1.644531 0 3 1.355469 3 3 v 8 c 0 1.644531 -1.355469 3 -3 3 h -4 c -1.644531 0 -3 -1.355469 -3 -3 v -1 c 0 -0.550781 0.449219 -1 1 -1 s 1 0.449219 1 1 v 1 c 0 0.570312 0.429688 1 1 1 h 4 c 0.570312 0 1 -0.429688 1 -1 v -8 c 0 -0.570312 -0.429688 -1 -1 -1 h -4 c -0.570312 0 -1 0.429688 -1 1 v 1 c 0 0.550781 -0.449219 1 -1 1 s -1 -0.449219 -1 -1 v -1 c 0 -1.644531 1.355469 -3 3 -3 z m 0 0", "key": "1d16u0" }]], "aliases": ["application-exit-rtl-symbolic"], "gtkIconName": "application-exit-rtl-symbolic" };
__iconData$8$.node;
const ApplicationExitRtl = createAdwaitaIcon(__iconData$8$);

const __iconData$8_ = { "name": "application-exit", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 13 5 v 0.003906 c 0.265625 0 0.519531 0.105469 0.707031 0.289063 l 2 2 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 l -2 2 c -0.1875 0.183594 -0.441406 0.289063 -0.707031 0.285157 v 0.007812 h -1 v -2 h -5 c -0.550781 0 -1 -0.449219 -1 -1 s 0.449219 -1 1 -1 h 5 v -2 z m 0 0", "key": "q96scx" }], ["path", { "fill": "currentColor", "d": "m 4 1 c -1.644531 0 -3 1.355469 -3 3 v 8 c 0 1.644531 1.355469 3 3 3 h 4 c 1.644531 0 3 -1.355469 3 -3 v -1 c 0 -0.550781 -0.449219 -1 -1 -1 s -1 0.449219 -1 1 v 1 c 0 0.570312 -0.429688 1 -1 1 h -4 c -0.570312 0 -1 -0.429688 -1 -1 v -8 c 0 -0.570312 0.429688 -1 1 -1 h 4 c 0.570312 0 1 0.429688 1 1 v 1 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -1 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 0", "key": "1hwte7" }]], "aliases": ["application-exit-symbolic"], "gtkIconName": "application-exit-symbolic" };
__iconData$8_.node;
const ApplicationExit = createAdwaitaIcon(__iconData$8_);

const __iconData$8Z = { "name": "application-rss+xml", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 2.003906 2.003906 v 1.011719 c 0.007813 0.546875 0.453125 0.984375 1 0.988281 c 0.003906 -0.003906 0.007813 -0.003906 0.011719 -0.003906 v 0.027344 c 4.972656 0 8.988281 4.015625 8.988281 8.988281 c 0.003906 0.546875 0.449219 0.988281 1 0.984375 h 0.011719 h 0.988281 v -0.984375 h -0.003906 c 0 -0.003906 0 -0.003906 0.003906 -0.007813 c -0.003906 -5.972656 -4.804687 -10.84375 -10.746094 -10.972656 c -0.078124 -0.019531 -0.160156 -0.03125 -0.242187 -0.03125 v -0.003906 z m 0 4 v 1.011719 c 0.007813 0.546875 0.453125 0.984375 1 0.988281 c 0.003906 -0.003906 0.007813 -0.003906 0.011719 -0.003906 v 0.015625 c 2.71875 0 4.914063 2.144531 4.996094 4.84375 c -0.007813 0.046875 -0.011719 0.09375 -0.011719 0.144531 c 0 0.550782 0.449219 1 1 1 c 0.007812 -0.003906 0.011719 -0.003906 0.015625 -0.003906 v 0.003906 h 0.984375 v -0.988281 h 0.015625 c 0 -3.792969 -3.046875 -6.898437 -6.820313 -6.992187 c 0 -0.003907 -0.003906 -0.003907 -0.003906 -0.003907 c -0.058594 -0.011719 -0.117187 -0.015625 -0.175781 -0.015625 v -0.003906 z m 2 4 c -1.105468 0 -2 0.894532 -2 2 c 0 1.101563 0.894532 2 2 2 c 1.101563 0 2 -0.898437 2 -2 c 0 -1.105468 -0.898437 -2 -2 -2 z m 0 0", "key": "flgjja" }]], "aliases": ["application-rss+xml-symbolic"], "gtkIconName": "application-rss+xml-symbolic" };
__iconData$8Z.node;
const ApplicationRssXml = createAdwaitaIcon(__iconData$8Z);

const __iconData$8Y = { "name": "application-x-addon", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7.03125 0.015625 c -1.109375 0 -2 0.890625 -2 2 v 1 h -3.015625 c -1.109375 0 -2 0.890625 -2 2 v 2 h 1.015625 c 1.105469 0 2 0.890625 2 2 s -0.894531 2 -2 2 h -1.015625 v 2.988281 c 0 1.105469 0.890625 2 2 2 h 3.015625 v -0.988281 c 0 -1.109375 0.890625 -2 2 -2 c 1.105469 0 2 0.890625 2 2 v 0.988281 h 2 c 1.105469 0 2 -0.894531 2 -2 v -2.988281 h 1 c 1.105469 0 2 -0.890625 2 -2 s -0.894531 -2 -2 -2 h -1 v -2 c 0 -1.109375 -0.894531 -2 -2 -2 h -2 v -1 c 0 -1.109375 -0.894531 -2 -2 -2 z m 0 0", "key": "kq9177" }]], "aliases": ["application-x-addon-symbolic"], "gtkIconName": "application-x-addon-symbolic" };
__iconData$8Y.node;
const ApplicationXAddon = createAdwaitaIcon(__iconData$8Y);

const __iconData$8X = { "name": "application-x-appliance", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1.984375 -0.015625 c -1.105469 0 -2 0.894531 -2 2 c 0.0039062 0.710937 0.382813 1.371094 1 1.726563 v 8.546874 c -0.617187 0.355469 -0.9960938 1.015626 -1 1.726563 c 0 1.105469 0.894531 2 2 2 c 0.710937 -0.003906 1.371094 -0.382813 1.726563 -1 h 8.546874 c 0.355469 0.617187 1.015626 0.996094 1.726563 1 c 1.105469 0 2 -0.894531 2 -2 c 0 -0.714844 -0.382813 -1.375 -1 -1.730469 v -8.542968 c 0.617187 -0.355469 0.996094 -1.015626 1 -1.726563 c 0 -1.105469 -0.894531 -2 -2 -2 c -0.710937 0.0039062 -1.371094 0.382813 -1.726563 1 h -8.542968 c -0.355469 -0.617187 -1.015625 -1 -1.730469 -1 z m 1.726563 3 h 8.546874 c 0.007813 0.015625 0.015626 0.03125 0.027344 0.046875 l -1.125 1.117188 c -0.210937 -0.109376 -0.441406 -0.164063 -0.675781 -0.164063 c -0.632813 0 -1.199219 0.402344 -1.410156 1 h -2.179688 c -0.214843 -0.601563 -0.777343 -1 -1.410156 -1 c -0.222656 0 -0.441406 0.050781 -0.644531 0.148437 l -1.136719 -1.136718 c 0.003906 -0.003906 0.003906 -0.007813 0.007813 -0.011719 z m -0.714844 0.71875 l 1.136718 1.136719 c -0.097656 0.207031 -0.148437 0.433594 -0.148437 0.660156 c 0 0.640625 0.402344 1.210938 1 1.425781 v 2.148438 c -0.597656 0.210937 -1 0.777343 -1 1.410156 c 0 0.222656 0.050781 0.445313 0.144531 0.644531 l -1.128906 1.132813 c -0.003906 -0.003907 -0.011719 -0.003907 -0.015625 -0.007813 v -8.542968 c 0.003906 -0.003907 0.007813 -0.007813 0.011719 -0.007813 z m 9.988281 0.042969 v 8.511718 c -0.003906 0.003907 -0.007813 0.003907 -0.011719 0.007813 l -1.132812 -1.132813 c 0.09375 -0.203124 0.144531 -0.425781 0.144531 -0.648437 c 0 -0.636719 -0.402344 -1.203125 -1 -1.414063 v -2.175781 c 0.597656 -0.210937 1 -0.777343 1 -1.410156 c 0 -0.210937 -0.046875 -0.421875 -0.132813 -0.613281 z m -6.082031 2.238281 h 2.171875 c 0.152343 0.425781 0.484375 0.757813 0.910156 0.910156 v 2.179688 c -0.425781 0.152343 -0.757813 0.484375 -0.910156 0.910156 h -2.175781 c -0.152344 -0.425781 -0.488282 -0.761719 -0.914063 -0.914063 v -2.144531 c 0.433594 -0.15625 0.769531 -0.503906 0.917969 -0.941406 z m -0.007813 5 h 2.179688 c 0.210937 0.597656 0.777343 1 1.410156 1 c 0.222656 0 0.445313 -0.050781 0.644531 -0.144531 l 1.136719 1.132812 c -0.003906 0.003906 -0.003906 0.007813 -0.007813 0.011719 h -8.542968 c -0.003906 -0.003906 -0.003906 -0.011719 -0.007813 -0.015625 l 1.128907 -1.128906 c 0.203124 0.09375 0.425781 0.144531 0.648437 0.144531 c 0.632813 0 1.199219 -0.402344 1.410156 -1 z m 0 0", "key": "1ruflw" }]], "aliases": ["application-x-appliance-symbolic"], "gtkIconName": "application-x-appliance-symbolic" };
__iconData$8X.node;
const ApplicationXAppliance = createAdwaitaIcon(__iconData$8X);

const __iconData$8W = { "name": "application-x-executable", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8.015625 0.015625 c -0.769531 0 -1.539063 0.292969 -2.121094 0.875 l -5.003906 5.003906 c -1.164063 1.164063 -1.164063 3.078125 0 4.242188 l 5.003906 5.003906 c 1.164063 1.164063 3.078125 1.164063 4.242188 0 l 5.007812 -5.003906 c 1.164063 -1.164063 1.164063 -3.078125 0 -4.242188 l -5.007812 -5.003906 c -0.582031 -0.582031 -1.351563 -0.875 -2.121094 -0.875 z m 0.101563 1.988281 c 0.210937 0.023438 0.414062 0.117188 0.585937 0.28125 l -0.339844 0.113282 c -0.074219 -0.136719 -0.15625 -0.269532 -0.246093 -0.394532 z m -1.570313 1.058594 c 0.300781 0.421875 0.464844 0.929688 0.46875 1.453125 c 0 1.378906 -1.121094 2.5 -2.5 2.5 c -0.523437 -0.003906 -1.03125 -0.171875 -1.449219 -0.472656 z m 3.441406 0.503906 l 3.742188 3.742188 c 0.402343 0.402344 0.402343 1.011718 0 1.414062 l -0.253907 0.25 c -0.039062 -0.046875 -0.074218 -0.09375 -0.117187 -0.140625 l 0.621094 -0.855469 l -0.808594 -0.585937 l -0.621094 0.851563 c -0.167969 -0.078126 -0.347656 -0.136719 -0.535156 -0.175782 v -1.050781 h -1 v 1.050781 c -0.183594 0.039063 -0.363281 0.097656 -0.53125 0.175782 l -0.621094 -0.851563 l -0.804687 0.585937 l 0.617187 0.855469 c -0.125 0.136719 -0.238281 0.289063 -0.332031 0.453125 l -1 -0.324218 l -0.308594 0.949218 l 1 0.324219 c -0.011718 0.09375 -0.019531 0.1875 -0.019531 0.28125 s 0.007813 0.1875 0.019531 0.28125 l -1 0.324219 l 0.308594 0.949218 l 1 -0.324218 c 0.09375 0.164062 0.207031 0.316406 0.332031 0.453125 l -0.617187 0.855469 l 0.195312 0.140624 l -0.53125 0.53125 c -0.402344 0.40625 -1.011718 0.40625 -1.414062 0 l -4.902344 -4.902343 l 0.027344 -0.039063 l 0.210937 -0.289062 c 0.328125 0.152344 0.679688 0.269531 1.046875 0.339844 v 1.179687 h 1.648438 v -1.179687 c 0.363281 -0.070313 0.714844 -0.1875 1.046875 -0.339844 l 0.207031 0.289062 l 0.484375 0.667969 l 1.335937 -0.972656 l -0.484374 -0.667969 l -0.210938 -0.289062 c 0.25 -0.269532 0.46875 -0.566407 0.648438 -0.890626 l 0.339843 0.113282 l 0.785157 0.253906 l 0.507812 -1.566406 l -0.785156 -0.257813 l -0.335938 -0.109375 c 0.019532 -0.179687 0.035156 -0.363281 0.035156 -0.550781 s -0.015624 -0.371094 -0.035156 -0.550781 l 0.335938 -0.109375 l 0.785156 -0.257813 z m 1.527344 5.449219 c 0.527344 0 0.984375 0.265625 1.25 0.667969 l -2.078125 2.082031 c -0.40625 -0.269531 -0.671875 -0.722656 -0.671875 -1.25 c 0 -0.835937 0.667969 -1.5 1.5 -1.5 z m 0 0", "key": "at9pka" }], ["path", { "fill": "currentColor", "d": "m 4.039062 -18.988281 c -1.449218 0 -2.679687 1.046875 -2.964843 2.421875 c -0.019531 0.097656 -0.035157 0.199218 -0.046875 0.300781 c -0.007813 0.101563 -0.015625 0.203125 -0.015625 0.304687 v 7.910157 c 0 1.660156 1.367187 3.027343 3.027343 3.027343 h 7.949219 c 1.660157 0 3.027344 -1.367187 3.027344 -3.027343 v -7.910157 c 0 -0.105468 -0.003906 -0.207031 -0.015625 -0.304687 c -0.011719 -0.101563 -0.027344 -0.203125 -0.046875 -0.300781 c -0.285156 -1.375 -1.511719 -2.421875 -2.964844 -2.421875 z m 0 2.003906 h 2.976563 v 3 h -2.976563 c -0.585937 0 -1.027343 -0.441406 -1.027343 -1.027344 v -0.949219 c 0.003906 -0.035156 0.003906 -0.070312 0.007812 -0.105468 c 0.003907 -0.035156 0.007813 -0.070313 0.011719 -0.105469 c 0.007812 -0.035156 0.019531 -0.066406 0.027344 -0.097656 c 0.125 -0.421875 0.503906 -0.714844 0.980468 -0.714844 z m 4.976563 0 h 2.972656 c 0.585938 0 1.023438 0.4375 1.027344 1.023437 v 0.949219 c 0 0.585938 -0.441406 1.027344 -1.027344 1.027344 h -2.972656 z m 4 3.71875 v 5.214844 c 0 0.585937 -0.441406 1.027343 -1.027344 1.027343 h -7.949219 c -0.585937 0 -1.027343 -0.441406 -1.027343 -1.027343 v -5.175781 c 0.324219 0.148437 0.671875 0.246093 1.027343 0.246093 h 2.976563 v 3.035157 l 2 0.992187 v -4.027344 h 2.972656 c 0.34375 0 0.695313 -0.113281 1.027344 -0.285156 z m -5 33.28125 c -0.851563 0 -1.699219 0.328125 -2.351563 0.976563 l -4.671874 4.671874 c -1.300782 1.300782 -1.300782 3.402344 0 4.703126 l 4.671874 4.671874 c 1.300782 1.300782 3.402344 1.300782 4.699219 0 l 4.675781 -4.671874 c 1.300782 -1.300782 1.300782 -3.402344 0 -4.703126 l -4.675781 -4.671874 c -0.648437 -0.648438 -1.496093 -0.976563 -2.347656 -0.976563 z m 0 1.984375 c 0.335937 0 0.675781 0.132812 0.941406 0.402344 l 3.03125 3.027344 c -0.066406 0.039062 -0.136719 0.070312 -0.210937 0.09375 c -0.019532 0.003906 -0.039063 0.011718 -0.0625 0.015624 c -0.441406 0.148438 -1.003906 0.019532 -1.277344 -0.359374 l -0.140625 -0.195313 c -0.15625 -0.210937 -0.390625 -0.355469 -0.652344 -0.398437 c -0.066406 -0.011719 -0.132812 -0.015626 -0.199219 -0.011719 c -0.195312 0.007812 -0.382812 0.074219 -0.542968 0.191406 c -0.449219 0.324219 -0.550782 0.949219 -0.226563 1.394531 l 0.144531 0.199219 c 0.273438 0.378906 0.226563 0.953125 -0.050781 1.332031 c -0.011719 0.015625 -0.023437 0.03125 -0.035156 0.050782 c -0.273437 0.378906 -0.808594 0.597656 -1.253906 0.453124 l -0.226563 -0.074218 c -0.523437 -0.167969 -1.089844 0.117187 -1.257812 0.644531 c -0.171875 0.523437 0.113281 1.089844 0.636718 1.261719 l 0.226563 0.070312 c 0.445313 0.144532 0.738281 0.640625 0.746094 1.105469 c 0.003906 0.023437 0.003906 0.042969 0.003906 0.066406 c 0.015625 0.464844 -0.304687 0.960938 -0.75 1.105469 l -0.226563 0.074219 c -0.179687 0.058593 -0.332031 0.164062 -0.445312 0.296875 l -3.785156 -3.785156 c -0.535156 -0.535157 -0.535156 -1.355469 0 -1.890626 l 4.667968 -4.667968 c 0.269532 -0.269532 0.609376 -0.402344 0.945313 -0.402344 z m 5.585937 5.234375 c 0.058594 0 0.117188 0.003906 0.175782 0.007813 c 0.382812 0.523437 0.335937 1.234374 -0.144532 1.71875 l -3.753906 3.75 c -0.027344 -0.066407 -0.050781 -0.136719 -0.070312 -0.203126 c -0.003906 -0.011718 -0.007813 -0.023437 -0.011719 -0.035156 c -0.003906 -0.007812 -0.007813 -0.011718 -0.011719 -0.019531 c -0.285156 -0.84375 -0.152344 -1.644531 0 -2.4375 c 0.003906 -0.003906 0.007813 -0.007813 0.011719 -0.015625 c 0.003906 -0.011719 0.007813 -0.027344 0.011719 -0.039062 c 0.261718 -0.789063 0.757812 -1.464844 1.410156 -1.945313 c 0.011719 -0.003906 0.023438 -0.011719 0.03125 -0.015625 c 0.019531 -0.015625 0.042969 -0.03125 0.058594 -0.046875 c 0.648437 -0.453125 1.4375 -0.71875 2.292968 -0.71875 z m 0 0", "key": "m7bwq8" }]], "aliases": ["application-x-executable-symbolic"], "gtkIconName": "application-x-executable-symbolic" };
__iconData$8W.node;
const ApplicationXExecutable = createAdwaitaIcon(__iconData$8W);

const __iconData$8V = { "name": "application-x-firmware", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4.015625 0.015625 c -0.554687 0 -1 0.445313 -1 1 v 2 c 0 0.0625 0.007813 0.125 0.019531 0.1875 c -0.441406 0.148437 -0.867187 0.394531 -1.222656 0.808594 c -0.476562 0.496093 -0.691406 1.117187 -0.757812 1.640625 c -0.070313 0.535156 -0.039063 1.003906 -0.039063 1.359375 c -0.003906 0.550781 0.445313 1 0.996094 1.003906 s 1 -0.445313 1.003906 -0.996094 c 0.003906 -0.445312 -0.015625 -0.835937 0.019531 -1.113281 s 0.089844 -0.402344 0.210938 -0.523438 l 0.03125 -0.03125 l 0.03125 -0.035156 c 0.207031 -0.25 0.648437 -0.335937 1.308594 -0.300781 h 0.050781 c 2.5 0.007813 4.984375 -0.015625 7.464843 0.011719 c 0.492188 0.035156 0.953126 0.644531 0.890626 1.15625 l -0.007813 0.058594 v 0.054687 c -0.015625 1.332031 0.023437 2.632813 -0.019531 3.890625 c -0.066406 0.472656 -0.65625 0.894531 -1.15625 0.835938 l -0.054688 -0.007813 h -0.769531 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 h 0.699219 c 1.570312 0.128906 3.066406 -0.953125 3.269531 -2.585937 l 0.007813 -0.046876 v -0.042968 c 0.054687 -1.375 0.011718 -2.71875 0.023437 -4.023438 c 0.117187 -1.382812 -0.71875 -2.695312 -2.011719 -3.136718 c 0.007813 -0.054688 0.011719 -0.109376 0.011719 -0.164063 v -2 c 0 -0.554687 -0.445313 -1 -1 -1 s -1 0.445313 -1 1 v 2 c -0.667969 0 -1.335937 0 -2 0 v -2 c 0 -0.554687 -0.445313 -1 -1 -1 s -1 0.445313 -1 1 v 2 c -0.667969 0 -1.335937 0 -2 0 v -2 c 0 -0.554687 -0.445313 -1 -1 -1 z m 1 7 v 2 c -2.199219 0 -4 1.800781 -4 4 v 2 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -2 c 0 -1.117187 0.882813 -2 2 -2 v 2 c 0.523437 -0.035156 1.085937 0.109375 1.554687 -0.167969 c 0.648438 -0.582031 1.238282 -1.230468 1.863282 -1.839844 c 0.429687 -0.339843 0.777344 -0.917968 0.46875 -1.457031 c -0.398438 -0.53125 -0.925782 -0.957031 -1.378906 -1.441406 c -0.472657 -0.398437 -0.832032 -1.070313 -1.507813 -1.09375 c -0.332031 0 -0.667969 0 -1 0 z m 0 0", "key": "osu4hw" }]], "aliases": ["application-x-firmware-symbolic"], "gtkIconName": "application-x-firmware-symbolic" };
__iconData$8V.node;
const ApplicationXFirmware = createAdwaitaIcon(__iconData$8V);

const __iconData$8U = { "name": "application-x-sharedlib", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4.039062 -38.988281 c -1.449218 0 -2.679687 1.046875 -2.964843 2.421875 c -0.019531 0.097656 -0.035157 0.199218 -0.046875 0.300781 c -0.007813 0.101563 -0.015625 0.203125 -0.015625 0.304687 v 7.910157 c 0 1.660156 1.367187 3.027343 3.027343 3.027343 h 7.949219 c 1.660157 0 3.027344 -1.367187 3.027344 -3.027343 v -7.910157 c 0 -0.105468 -0.003906 -0.207031 -0.015625 -0.304687 c -0.011719 -0.101563 -0.027344 -0.203125 -0.046875 -0.300781 c -0.285156 -1.375 -1.511719 -2.421875 -2.964844 -2.421875 z m 0 2.003906 h 2.976563 v 3 h -2.976563 c -0.585937 0 -1.027343 -0.441406 -1.027343 -1.027344 v -0.949219 c 0.003906 -0.035156 0.003906 -0.070312 0.007812 -0.105468 c 0.003907 -0.035156 0.007813 -0.070313 0.011719 -0.105469 c 0.007812 -0.035156 0.019531 -0.066406 0.027344 -0.097656 c 0.125 -0.421875 0.503906 -0.714844 0.980468 -0.714844 z m 4.976563 0 h 2.972656 c 0.585938 0 1.023438 0.4375 1.027344 1.023437 v 0.949219 c 0 0.585938 -0.441406 1.027344 -1.027344 1.027344 h -2.972656 z m 4 3.71875 v 5.214844 c 0 0.585937 -0.441406 1.027343 -1.027344 1.027343 h -7.949219 c -0.585937 0 -1.027343 -0.441406 -1.027343 -1.027343 v -5.175781 c 0.324219 0.148437 0.671875 0.246093 1.027343 0.246093 h 2.976563 v 3.035157 l 2 0.992187 v -4.027344 h 2.972656 c 0.34375 0 0.695313 -0.113281 1.027344 -0.285156 z m -5 33.28125 c -0.851563 0 -1.699219 0.328125 -2.351563 0.976563 l -4.671874 4.671874 c -1.300782 1.300782 -1.300782 3.402344 0 4.703126 l 4.671874 4.671874 c 1.300782 1.300782 3.402344 1.300782 4.699219 0 l 4.675781 -4.671874 c 1.300782 -1.300782 1.300782 -3.402344 0 -4.703126 l -4.675781 -4.671874 c -0.648437 -0.648438 -1.496093 -0.976563 -2.347656 -0.976563 z m 0 1.984375 c 0.335937 0 0.675781 0.132812 0.941406 0.402344 l 3.03125 3.027344 c -0.066406 0.039062 -0.136719 0.070312 -0.210937 0.09375 c -0.019532 0.003906 -0.039063 0.011718 -0.0625 0.015624 c -0.441406 0.148438 -1.003906 0.019532 -1.277344 -0.359374 l -0.140625 -0.195313 c -0.15625 -0.210937 -0.390625 -0.355469 -0.652344 -0.398437 c -0.066406 -0.011719 -0.132812 -0.015626 -0.199219 -0.011719 c -0.195312 0.007812 -0.382812 0.074219 -0.542968 0.191406 c -0.449219 0.324219 -0.550782 0.949219 -0.226563 1.394531 l 0.144531 0.199219 c 0.273438 0.378906 0.226563 0.953125 -0.050781 1.332031 c -0.011719 0.015625 -0.023437 0.03125 -0.035156 0.050782 c -0.273437 0.378906 -0.808594 0.597656 -1.253906 0.453124 l -0.226563 -0.074218 c -0.523437 -0.167969 -1.089844 0.117187 -1.257812 0.644531 c -0.171875 0.523437 0.113281 1.089844 0.636718 1.261719 l 0.226563 0.070312 c 0.445313 0.144532 0.738281 0.640625 0.746094 1.105469 c 0.003906 0.023437 0.003906 0.042969 0.003906 0.066406 c 0.015625 0.464844 -0.304687 0.960938 -0.75 1.105469 l -0.226563 0.074219 c -0.179687 0.058593 -0.332031 0.164062 -0.445312 0.296875 l -3.785156 -3.785156 c -0.535156 -0.535157 -0.535156 -1.355469 0 -1.890626 l 4.667968 -4.667968 c 0.269532 -0.269532 0.609376 -0.402344 0.945313 -0.402344 z m 5.585937 5.234375 c 0.058594 0 0.117188 0.003906 0.175782 0.007813 c 0.382812 0.523437 0.335937 1.234374 -0.144532 1.71875 l -3.753906 3.75 c -0.027344 -0.066407 -0.050781 -0.136719 -0.070312 -0.203126 c -0.003906 -0.011718 -0.007813 -0.023437 -0.011719 -0.035156 c -0.003906 -0.007812 -0.007813 -0.011718 -0.011719 -0.019531 c -0.285156 -0.84375 -0.152344 -1.644531 0 -2.4375 c 0.003906 -0.003906 0.007813 -0.007813 0.011719 -0.015625 c 0.003906 -0.011719 0.007813 -0.027344 0.011719 -0.039062 c 0.261718 -0.789063 0.757812 -1.464844 1.410156 -1.945313 c 0.011719 -0.003906 0.023438 -0.011719 0.03125 -0.015625 c 0.019531 -0.015625 0.042969 -0.03125 0.058594 -0.046875 c 0.648437 -0.453125 1.4375 -0.71875 2.292968 -0.71875 z m 0 0", "key": "1ujpdv" }]], "aliases": ["application-x-sharedlib-symbolic"], "gtkIconName": "application-x-sharedlib-symbolic" };
__iconData$8U.node;
const ApplicationXSharedlib = createAdwaitaIcon(__iconData$8U);

const __iconData$8T = { "name": "applications-engineering", "size": 16, "node": [["path", { "fill": "currentColor", "fill-rule": "evenodd", "d": "m 7.996094 8 c -3.996094 0 -5.996094 3 -5.996094 6 h -1.75 c -0.25 0 -0.25 0.15625 -0.25 0.25 v 1.5 c 0 0.25 0.136719 0.25 0.25 0.25 h 15.492188 c 0.195312 0.007812 0.25 -0.128906 0.25 -0.25 v -1.5 c 0.023437 -0.144531 0 -0.25 -0.25 -0.25 h -1.746094 c 0 -3 -2 -6 -6 -6 z m 0 3 c 2.351562 0 3 1.761719 3 3 h -5.996094 c 0 -1.199219 0.699219 -3 2.996094 -3 z m 0 0", "key": "1uv34p" }], ["path", { "fill": "currentColor", "d": "m 14.988281 0.601562 c -0.28125 -0.242187 -0.625 -0.421874 -0.964843 -0.5624995 l -0.023438 2.2304685 c -0.003906 0.460938 -0.453125 0.730469 -1.003906 0.730469 h -1 c -0.554688 -0.007812 -1.003906 -0.308594 -1 -0.769531 l 0.023437 -2.230469 c -0.347656 0.132812 -0.691406 0.304688 -0.976562 0.535156 c -1.378907 1.117188 -1.398438 2.949219 -0.042969 4.097656 c 0.285156 0.242188 0.625 0.421876 0.96875 0.5625 c 0.027344 0.011719 0.027344 2.054688 0.027344 2.054688 c 1.488281 0.75 2.351562 1.75 3 2.75 v -4.75 c 0.34375 -0.132812 0.664062 -0.320312 0.953125 -0.550781 c 1.378906 -1.117188 1.394531 -2.949219 0.039062 -4.097657 z m 0 0", "key": "6rbsic" }]], "aliases": ["applications-engineering-symbolic"], "gtkIconName": "applications-engineering-symbolic" };
__iconData$8T.node;
const ApplicationsEngineering = createAdwaitaIcon(__iconData$8T);

const __iconData$8S = { "name": "applications-games", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 0 11 v 2.5 c 0 1.378906 1.121094 2.5 2.5 2.5 h 0.5 c 1.105469 0 2 -0.894531 2 -2 s 0.894531 -2 2 -2 s 2 0.894531 2 2 c 0.136719 1.242188 1.257812 2.136719 2.5 2 c 1.378906 0 2.5 -1.117188 2.5 -2.5 v -2.5 c 0 -2.210938 -1.789062 -4 -4 -4 h -6 c -2.210938 0 -4 1.789062 -4 4 z m 3.25 -2 h 0.5 c 0.136719 0 0.25 0.113281 0.25 0.25 v 0.75 h 0.75 c 0.136719 0 0.25 0.113281 0.25 0.25 v 0.5 c 0 0.140625 -0.113281 0.25 -0.25 0.25 h -0.75 v 0.75 c 0 0.140625 -0.113281 0.25 -0.25 0.25 h -0.5 c -0.140625 0 -0.25 -0.109375 -0.25 -0.25 v -0.75 h -0.75 c -0.140625 0 -0.25 -0.109375 -0.25 -0.25 v -0.5 c 0 -0.136719 0.109375 -0.25 0.25 -0.25 h 0.75 v -0.75 c 0 -0.136719 0.109375 -0.25 0.25 -0.25 z m 6.25 0.75 c 0.414062 0 0.75 0.335938 0.75 0.75 s -0.335938 0.75 -0.75 0.75 s -0.75 -0.335938 -0.75 -0.75 s 0.335938 -0.75 0.75 -0.75 z m 2 1 c 0.414062 0 0.75 0.335938 0.75 0.75 s -0.335938 0.75 -0.75 0.75 s -0.75 -0.335938 -0.75 -0.75 s 0.335938 -0.75 0.75 -0.75 z m 0 0", "key": "1fmjhf" }], ["path", { "fill": "currentColor", "d": "m 2 3.015625 c 0.007812 1.65625 1.359375 2.992187 3.015625 2.984375 h 7.96875 c 1.664063 0 3.015625 -1.351562 3.015625 -3.015625 c -0.007812 -1.65625 -1.359375 -2.9921875 -3.015625 -2.984375 h -7.96875 c -1.664063 0 -3.015625 1.351562 -3.015625 3.015625 z m 3.21875 -2.015625 h 0.5 c 0.136719 0 0.25 0.113281 0.25 0.25 v 0.75 h 0.75 c 0.136719 0 0.25 0.113281 0.25 0.25 v 0.5 c 0 0.140625 -0.113281 0.25 -0.25 0.25 h -0.75 v 0.75 c 0 0.140625 -0.113281 0.25 -0.25 0.25 h -0.5 c -0.140625 0 -0.25 -0.109375 -0.25 -0.25 v -0.75 h -0.75 c -0.140625 0 -0.25 -0.109375 -0.25 -0.25 v -0.5 c 0 -0.136719 0.109375 -0.25 0.25 -0.25 h 0.75 v -0.75 c 0 -0.136719 0.109375 -0.25 0.25 -0.25 z m 6.25 0.75 c 0.414062 0 0.75 0.335938 0.75 0.75 s -0.335938 0.75 -0.75 0.75 s -0.75 -0.335938 -0.75 -0.75 s 0.335938 -0.75 0.75 -0.75 z m 2 0.03125 c 0.414062 0 0.75 0.335938 0.75 0.75 s -0.335938 0.75 -0.75 0.75 s -0.75 -0.335938 -0.75 -0.75 s 0.335938 -0.75 0.75 -0.75 z m 0 0", "key": "1yyhjd" }]], "aliases": ["applications-games-symbolic"], "gtkIconName": "applications-games-symbolic" };
__iconData$8S.node;
const ApplicationsGames = createAdwaitaIcon(__iconData$8S);

const __iconData$8R = { "name": "applications-graphics", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7.890625 0 c -2.109375 0.03125 -4.945313 0.800781 -4.898437 3.277344 c 0.050781 2.589844 2.921874 1.664062 3.15625 2.71875 c 0.035156 -0.042969 0.085937 -0.082032 0.121093 -0.125 c 0.199219 -0.210938 0.394531 -0.386719 0.59375 -0.59375 c 0.3125 -0.351563 0.636719 -0.675782 0.964844 -1.03125 c 1.109375 -1.175782 1.15625 -1.25 3.800781 -3.25 c -1.035156 -0.617188 -2.261718 -0.9609378 -3.300781 -0.996094 c -0.132813 -0.00390625 -0.292969 -0.00390625 -0.4375 0 z m 6.144531 0 c -1.796875 1.296875 -4.203125 3.300781 -6.113281 5.332031 c -0.171875 0.183594 -0.339844 0.363281 -0.503906 0.546875 c -0.101563 0.109375 -0.210938 0.195313 -0.3125 0.308594 c -0.066407 0.078125 -0.128907 0.160156 -0.191407 0.238281 c -1.300781 1.4375 -2.582031 3.128907 -3.648437 4.683594 c -0.308594 -0.15625 -0.699219 -0.171875 -1.117187 0.101563 c -0.753907 0.496093 -0.597657 2.285156 -2.148438 2.285156 c 0.148438 0.601562 1.734375 0.59375 2.808594 0.324218 c 1.011718 -0.253906 1.324218 -1.140624 1.132812 -1.886718 c -0.03125 -0.105469 -0.078125 -0.210938 -0.144531 -0.320313 c 1.984375 -1.640625 3.386719 -3.003906 4.34375 -4.023437 c 0.242187 -0.246094 0.53125 -0.566406 0.851563 -0.925782 c 1.207031 -1.332031 2.925781 -3.433593 5.042968 -6.664062 z m -8.042968 1.527344 c 0.824218 0 1.492187 0.671875 1.492187 1.5 c 0 0.832031 -0.667969 1.5 -1.492187 1.5 c -0.828126 0 -1.5 -0.667969 -1.5 -1.5 c 0 -0.828125 0.671874 -1.5 1.5 -1.5 z m 7.265624 0.664062 c -1.417968 2.234375 -2.367187 3.554688 -3.367187 4.585938 c -0.640625 0.660156 -1.164063 1.3125 -1.625 1.78125 c -0.835937 0.890625 -1.9375 1.941406 -3.148437 3.09375 c 0.0625 1.46875 0.808593 2.746094 3.242187 3.21875 c 3.898437 0.757812 8.027344 -1.824219 7.613281 -7.0625 c -0.179687 -2.246094 -1.40625 -4.28125 -2.714844 -5.617188 z m 0.34375 3.804688 c 0.546876 0 0.996094 0.449218 0.996094 1 c 0 0.554687 -0.449218 1 -0.996094 1 c -0.546874 0 -0.996093 -0.445313 -0.996093 -1 c 0 -0.550782 0.449219 -1 0.996093 -1 z m -0.625 3 c 0.546876 0 0.996094 0.449218 0.996094 1 c 0 0.554687 -0.449218 1 -0.996094 1 c -0.546874 0 -0.996093 -0.445313 -0.996093 -1 c 0 -0.550782 0.449219 -1 0.996093 -1 z m -4.992187 2 c 0.550781 0 1 0.449218 1 1 c 0 0.550781 -0.449219 1 -1 1 c -0.546875 0 -0.996094 -0.449219 -0.996094 -1 c 0 -0.550782 0.449219 -1 0.996094 -1 z m 2.996094 0 c 0.546875 0 1 0.449218 1 1 c 0 0.550781 -0.453125 1 -1 1 s -0.996094 -0.449219 -0.996094 -1 c 0 -0.550782 0.449219 -1 0.996094 -1 z m 0 0", "key": "1eo1kd" }]], "aliases": ["applications-graphics-symbolic"], "gtkIconName": "applications-graphics-symbolic" };
__iconData$8R.node;
const ApplicationsGraphics = createAdwaitaIcon(__iconData$8R);

const __iconData$8Q = { "name": "applications-multimedia", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1.96875 0 s -0.96875 1 -0.96875 2 v 12 c 0 1.007812 -1 2 -1 2 h 1 s 0.421875 -0.425781 0.71875 -1 h 1 c -0.296875 0.574219 -0.71875 1 -0.71875 1 h 1 s 1 -1.019531 1 -2 v -2 h 1 v -1 h -1 v -5 h 8 v 1 h 3 v -5 c 0 -1 0.96875 -2 0.96875 -2 h -3 s -0.96875 1 -0.96875 2 v 3 h -8 v -3 c 0 -1 0.96875 -2 0.96875 -2 z m 0.3125 1 h 1 c -0.152344 0.304688 -0.28125 0.652344 -0.28125 1 h -1 c 0 -0.347656 0.128906 -0.695312 0.28125 -1 z m 11 0 h 1 c -0.152344 0.304688 -0.28125 0.652344 -0.28125 1 h -1 c 0 -0.347656 0.128906 -0.695312 0.28125 -1 z m -11.28125 2 h 1 v 1 h -1 z m 11 0 h 1 v 1 h -1 z m -11 2 h 1 v 1 h -1 z m 11 0 h 1 v 1 h -1 z m -11 2 h 1 v 1 h -1 z m 7 1 v 4.28125 c -0.292969 -0.171875 -0.636719 -0.28125 -1 -0.28125 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 v -5 h 4 v 3.28125 c -0.292969 -0.171875 -0.636719 -0.28125 -1 -0.28125 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 v -6 z m -7 1 h 1 v 1 h -1 z m 0 2 h 1 v 1 h -1 z m 0 2 h 1 v 1 h -1 z m 0 0", "key": "1abyu9" }]], "aliases": ["applications-multimedia-symbolic"], "gtkIconName": "applications-multimedia-symbolic" };
__iconData$8Q.node;
const ApplicationsMultimedia = createAdwaitaIcon(__iconData$8Q);

const __iconData$8P = { "name": "applications-science", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4.996094 0 c -1.03125 0.00390625 -1.386719 1.371094 -0.484375 1.871094 l 0.488281 0.273437 v 2.683594 c -0.128906 0.207031 -0.25 0.390625 -0.441406 0.714844 c -0.269532 0.472656 -0.601563 1.0625 -0.964844 1.707031 c -0.722656 1.296875 -1.554688 2.910156 -2.203125 4.09375 c -0.574219 1.046875 -0.550781 2.453125 0.300781 3.511719 c 0.671875 0.902343 1.738282 1.140625 2.617188 1.140625 h 7.351562 c 0.878906 0 1.949219 -0.238282 2.621094 -1.140625 c 0.851562 -1.058594 0.867188 -2.464844 0.296875 -3.511719 c -1.164063 -2.371094 -2.472656 -4.316406 -3.5625 -6.496094 v -2.699218 l 0.488281 -0.277344 c 0.902344 -0.5 0.546875 -1.871094 -0.484375 -1.871094 z m 2.003906 2 h 2.015625 v 3.105469 c 0 0.152343 0.035156 0.304687 0.101563 0.441406 c 1.203124 2.457031 2.574218 4.441406 3.6875 6.714844 c 0.003906 0.011719 0.011718 0.027343 0.015624 0.039062 c 0.242188 0.441407 0.257813 0.882813 -0.097656 1.316407 c -0.011718 0.011718 -0.023437 0.027343 -0.035156 0.042968 c -0.144531 0.199219 -0.488281 0.335938 -1.027344 0.335938 h -7.351562 c -0.539063 0 -0.882813 -0.136719 -1.027344 -0.335938 c -0.011719 -0.015625 -0.023438 -0.027344 -0.035156 -0.042968 c -0.351563 -0.433594 -0.339844 -0.875 -0.097656 -1.316407 c 0.644531 -1.179687 1.472656 -2.789062 2.191406 -4.070312 c 0.359375 -0.644531 0.6875 -1.230469 0.953125 -1.683594 c 0.261719 -0.453125 0.488281 -0.8125 0.515625 -0.847656 c 0.125 -0.171875 0.191406 -0.378907 0.191406 -0.589844 z m 0 0", "key": "zsze7t" }], ["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 6.21875 9 l -2.21875 4 h 8 l -2.21875 -4 z m 0 0", "key": "i0d7l3" }]], "aliases": ["applications-science-symbolic"], "gtkIconName": "applications-science-symbolic" };
__iconData$8P.node;
const ApplicationsScience = createAdwaitaIcon(__iconData$8P);

const __iconData$8O = { "name": "applications-system", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 c -0.550781 0 -1 0.449219 -1 1 v 0.238281 c 0 0.46875 -0.375 0.902344 -0.820312 1.046875 c -0.023438 0.007813 -0.042969 0.011719 -0.0625 0.019532 c -0.445313 0.148437 -1.003907 0.019531 -1.28125 -0.359376 l -0.140626 -0.195312 c -0.15625 -0.214844 -0.390624 -0.359375 -0.652343 -0.398438 c -0.261719 -0.042968 -0.527344 0.019532 -0.742188 0.175782 c -0.449219 0.324218 -0.550781 0.953125 -0.222656 1.398437 l 0.140625 0.199219 c 0.277344 0.378906 0.226562 0.953125 -0.050781 1.328125 c -0.011719 0.015625 -0.023438 0.035156 -0.035157 0.050781 c -0.273437 0.378906 -0.804687 0.601563 -1.25 0.457032 l -0.230468 -0.074219 c -0.523438 -0.171875 -1.089844 0.117187 -1.257813 0.640625 c -0.171875 0.527344 0.113281 1.089844 0.640625 1.261718 l 0.222656 0.074219 c 0.445313 0.144531 0.738282 0.636719 0.75 1.101563 v 0.070312 c 0.015626 0.464844 -0.304687 0.960938 -0.746093 1.105469 l -0.226563 0.074219 c -0.527344 0.167968 -0.8125 0.734375 -0.640625 1.257812 c 0.167969 0.527344 0.734375 0.8125 1.257813 0.644532 l 0.230468 -0.078126 c 0.445313 -0.144531 0.976563 0.078126 1.25 0.457032 c 0.011719 0.019531 0.027344 0.035156 0.039063 0.050781 c 0.277344 0.375 0.324219 0.953125 0.050781 1.328125 l -0.144531 0.203125 c -0.324219 0.445313 -0.226563 1.070313 0.222656 1.394531 c 0.445313 0.324219 1.070313 0.226563 1.394531 -0.21875 l 0.144532 -0.199218 c 0.273437 -0.375 0.835937 -0.507813 1.277344 -0.359376 c 0.019531 0.007813 0.042968 0.011719 0.0625 0.019532 c 0.445312 0.140625 0.820312 0.578125 0.820312 1.046875 v 0.238281 c 0 0.550781 0.449219 1 1 1 c 0.554688 0 1 -0.449219 1 -1 v -0.238281 c 0 -0.46875 0.378906 -0.90625 0.824219 -1.046875 c 0.019531 -0.007813 0.039062 -0.015625 0.0625 -0.019532 c 0.441406 -0.148437 1.003906 -0.019531 1.277343 0.359376 l 0.144532 0.199218 c 0.324218 0.445313 0.949218 0.542969 1.394531 0.21875 c 0.445313 -0.324218 0.546875 -0.949218 0.222656 -1.394531 l -0.144531 -0.203125 c -0.277344 -0.375 -0.226562 -0.953125 0.050781 -1.328125 c 0.011719 -0.015625 0.023438 -0.03125 0.035157 -0.050781 c 0.273437 -0.378906 0.804687 -0.601563 1.25 -0.457032 l 0.234374 0.078126 c 0.523438 0.167968 1.089844 -0.117188 1.257813 -0.644532 c 0.171875 -0.523437 -0.117187 -1.089844 -0.640625 -1.257812 l -0.230469 -0.074219 c -0.445312 -0.144531 -0.734375 -0.640625 -0.742187 -1.105469 c -0.003906 -0.023437 -0.003906 -0.046875 -0.003906 -0.070312 c -0.015626 -0.464844 0.300781 -0.957032 0.746093 -1.101563 l 0.230469 -0.074219 c 0.523438 -0.171874 0.8125 -0.734374 0.640625 -1.261718 c -0.171875 -0.523438 -0.734375 -0.8125 -1.257813 -0.640625 l -0.230468 0.074219 c -0.445313 0.144531 -0.976563 -0.078126 -1.25 -0.457032 c -0.015625 -0.015625 -0.027344 -0.035156 -0.039063 -0.050781 c -0.277343 -0.375 -0.324219 -0.949219 -0.050781 -1.328125 l 0.144531 -0.199219 c 0.324219 -0.445312 0.226563 -1.074219 -0.222656 -1.398437 c -0.214844 -0.15625 -0.480469 -0.21875 -0.742187 -0.175782 c -0.261719 0.039063 -0.5 0.183594 -0.652344 0.398438 l -0.144532 0.195312 c -0.273437 0.378907 -0.835937 0.507813 -1.277343 0.363282 c -0.023438 -0.007813 -0.042969 -0.015625 -0.066407 -0.023438 c -0.441406 -0.140625 -0.820312 -0.578125 -0.820312 -1.046875 v -0.238281 c 0 -0.550781 -0.449219 -1 -1 -1 z m 0 4 c 0.871094 0 1.675781 0.273438 2.332031 0.742188 c 0.003907 0.007812 0.011719 0.015624 0.019531 0.023437 c 0.011719 0.003906 0.019532 0.007813 0.03125 0.015625 c 0.660157 0.484375 1.160157 1.175781 1.421876 1.976562 v 0.007813 s 0.003906 0.003906 0.003906 0.007813 c 0.292968 0.851562 0.15625 1.65625 0 2.457031 c 0 0 -0.003906 0.003906 -0.003906 0.007812 v 0.003907 c -0.257813 0.800781 -0.757813 1.488281 -1.414063 1.976562 c -0.015625 0.003906 -0.027344 0.011719 -0.039063 0.019531 c -0.007812 0.007813 -0.015624 0.011719 -0.019531 0.019531 c -0.65625 0.46875 -1.460937 0.742188 -2.332031 0.742188 c -0.855469 0 -1.644531 -0.265625 -2.289062 -0.714844 c -0.019532 -0.015625 -0.042969 -0.03125 -0.0625 -0.046875 c -0.011719 -0.007812 -0.023438 -0.015625 -0.035157 -0.019531 c -0.648437 -0.484375 -1.148437 -1.160156 -1.40625 -1.945312 c -0.003906 -0.011719 -0.007812 -0.023438 -0.011719 -0.035157 c -0.003906 -0.007812 -0.007812 -0.011719 -0.011718 -0.019531 c -0.28125 -0.847656 -0.148438 -1.644531 0 -2.4375 c 0.003906 -0.003906 0.007812 -0.011719 0.011718 -0.015625 c 0.003907 -0.015625 0.007813 -0.027344 0.011719 -0.039063 c 0.261719 -0.789062 0.761719 -1.464843 1.414063 -1.945312 c 0.007812 -0.007812 0.019531 -0.011719 0.027344 -0.015625 c 0.019531 -0.015625 0.042968 -0.035156 0.0625 -0.050781 c 0.644531 -0.449219 1.433593 -0.714844 2.289062 -0.714844 z m 0 0", "key": "1euejn" }]], "aliases": ["applications-system-symbolic"], "gtkIconName": "applications-system-symbolic" };
__iconData$8O.node;
const ApplicationsSystem = createAdwaitaIcon(__iconData$8O);

const __iconData$8N = { "name": "applications-utilities", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 2.933594 0 c -1.625 0 -2.933594 1.332031 -2.933594 2.988281 v 10.027344 c 0 1.652344 1.308594 2.984375 2.933594 2.984375 h 0.132812 c 1.625 0 2.933594 -1.332031 2.933594 -2.984375 v -10.027344 c 0 -1.65625 -1.308594 -2.988281 -2.933594 -2.988281 z m 2.59375 0 c 0.878906 0.714844 1.46875 1.792969 1.46875 3 v 1 h 2.125 c -0.074219 -1.09375 1.25 -2 2 -2 c 0.679687 0 1 0.011719 1 1 v 1 h 1.21875 c 1.230468 -0.601562 1.78125 -1.96875 1.78125 -2.6875 c 0 -0.734375 -2.386719 -1.3125 -3.6875 -1.3125 z m 1.472656 5 v 4.3125 c 2.765625 2.660156 6.125 2.40625 6.125 2.40625 s 0.351562 -1.519531 -1.90625 -4.03125 l -2.375 -2.6875 h -1.78125 c -0.019531 0.003906 -0.042969 -0.003906 -0.0625 0 z m 2.976562 2.53125 l 1.683594 1.738281 c -1.800781 0.164063 -2.152344 -0.859375 -1.683594 -1.738281 z m 0 0", "key": "jzpgk9" }]], "aliases": ["applications-utilities-symbolic"], "gtkIconName": "applications-utilities-symbolic" };
__iconData$8N.node;
const ApplicationsUtilities = createAdwaitaIcon(__iconData$8N);

const __iconData$8M = { "name": "appointment-missed", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.35", "d": "m 6.5 0 c -3.578125 0 -6.5 2.921875 -6.5 6.5 s 2.921875 6.5 6.5 6.5 c 0.171875 0 0.332031 -0.019531 0.5 -0.03125 v -2.03125 c -0.167969 0.019531 -0.328125 0.0625 -0.5 0.0625 c -2.496094 0 -4.5 -2.003906 -4.5 -4.5 s 2.003906 -4.5 4.5 -4.5 s 4.5 2.003906 4.5 4.5 c 0 0.171875 -0.042969 0.332031 -0.0625 0.5 h 2.03125 c 0.011719 -0.167969 0.03125 -0.328125 0.03125 -0.5 c 0 -3.578125 -2.921875 -6.5 -6.5 -6.5 z m 0 3 c -0.277344 0 -0.5 0.222656 -0.5 0.5 v 2.5 h -1.5 c -0.277344 0 -0.5 0.222656 -0.5 0.5 s 0.222656 0.5 0.5 0.5 h 2 c 0.277344 0 0.5 -0.222656 0.5 -0.5 v -3 c 0 -0.277344 -0.222656 -0.5 -0.5 -0.5 z m 0 0", "key": "1q2sb2" }], ["path", { "fill": "#e01b24", "d": "m 11.714844 8.011719 c -0.960938 0.066406 -1.863282 0.480469 -2.542969 1.160156 c -1.5625 1.5625 -1.5625 4.09375 0 5.65625 s 4.09375 1.5625 5.65625 0 s 1.5625 -4.09375 0 -5.65625 c -0.820313 -0.820313 -1.957031 -1.246094 -3.113281 -1.160156 z m -1.128906 1.570312 c 0.253906 0 0.511718 0.101563 0.707031 0.296875 l 0.707031 0.707032 l 0.707031 -0.707032 c 0.390625 -0.390625 1.023438 -0.390625 1.414063 0 s 0.390625 1.023438 0 1.414063 l -0.707032 0.707031 l 0.707032 0.707031 c 0.390625 0.390625 0.390625 1.023438 0 1.414063 s -1.023438 0.390625 -1.414063 0 l -0.707031 -0.707032 l -0.707031 0.707032 c -0.390625 0.390625 -1.023438 0.390625 -1.414063 0 s -0.390625 -1.023438 0 -1.414063 l 0.707032 -0.707031 l -0.707032 -0.707031 c -0.390625 -0.390625 -0.390625 -1.023438 0 -1.414063 c 0.195313 -0.195312 0.453125 -0.296875 0.707032 -0.296875 z m 0 0", "key": "3v6a2q" }]], "aliases": ["appointment-missed-symbolic"], "gtkIconName": "appointment-missed-symbolic", "monochrome": false };
__iconData$8M.node;
const AppointmentMissed = createAdwaitaIcon(__iconData$8M);

const __iconData$8L = { "name": "appointment-new", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 6.5 0 c -3.578125 0 -6.5 2.921875 -6.5 6.5 s 2.921875 6.5 6.5 6.5 c 0.167969 0 0.335938 -0.007812 0.5 -0.019531 v -2.007813 c -0.164062 0.019532 -0.332031 0.027344 -0.5 0.027344 c -2.496094 0 -4.5 -2.003906 -4.5 -4.5 s 2.003906 -4.5 4.5 -4.5 s 4.5 2.003906 4.5 4.5 c 0 0.167969 -0.007812 0.335938 -0.027344 0.5 h 2.007813 c 0.011719 -0.164062 0.019531 -0.332031 0.019531 -0.5 c 0 -3.578125 -2.921875 -6.5 -6.5 -6.5 z m 0 3 c -0.277344 0 -0.5 0.222656 -0.5 0.5 v 2.5 h -1.5 c -0.277344 0 -0.5 0.222656 -0.5 0.5 s 0.222656 0.5 0.5 0.5 h 2 c 0.277344 0 0.5 -0.222656 0.5 -0.5 v -3 c 0 -0.277344 -0.222656 -0.5 -0.5 -0.5 z m 4.5 5 v 3 h -3 v 2 h 3 v 3 h 2 v -3 h 3 v -2 h -3 v -3 z m 0 0", "key": "1ghqhv" }]], "aliases": ["appointment-new-symbolic"], "gtkIconName": "appointment-new-symbolic" };
__iconData$8L.node;
const AppointmentNew = createAdwaitaIcon(__iconData$8L);

const __iconData$8K = { "name": "appointment-soon", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 6.5 0 c -3.578125 0 -6.5 2.921875 -6.5 6.5 s 2.921875 6.5 6.5 6.5 c 0.171875 0 0.332031 -0.019531 0.5 -0.03125 v -2.03125 c -0.167969 0.019531 -0.328125 0.0625 -0.5 0.0625 c -2.496094 0 -4.5 -2.003906 -4.5 -4.5 s 2.003906 -4.5 4.5 -4.5 s 4.5 2.003906 4.5 4.5 c 0 0.171875 -0.042969 0.332031 -0.0625 0.5 h 2.03125 c 0.011719 -0.167969 0.03125 -0.328125 0.03125 -0.5 c 0 -3.578125 -2.921875 -6.5 -6.5 -6.5 z m 0 3 c -0.277344 0 -0.5 0.222656 -0.5 0.5 v 2.5 h -1.5 c -0.277344 0 -0.5 0.222656 -0.5 0.5 s 0.222656 0.5 0.5 0.5 h 2 c 0.277344 0 0.5 -0.222656 0.5 -0.5 v -3 c 0 -0.277344 -0.222656 -0.5 -0.5 -0.5 z m 0 0", "key": "15y2t2" }], ["path", { "fill": "#ff7800", "d": "m 8.875 8.070312 c -0.492188 0 -0.875 0.378907 -0.875 0.867188 v 6.195312 c 0 0.488282 0.382812 0.867188 0.875 0.867188 h 6.25 c 0.492188 0 0.875 -0.378906 0.875 -0.867188 v -6.195312 c 0 -0.488281 -0.382812 -0.867188 -0.875 -0.867188 z m 2.125 0.929688 h 2 v 2.5 s 0 0.5 -0.5 0.5 h -1 c -0.5 0 -0.5 -0.5 -0.5 -0.5 z m 0.5 4 h 1 c 0.277344 0 0.5 0.222656 0.5 0.5 v 1 c 0 0.277344 -0.222656 0.5 -0.5 0.5 h -1 c -0.277344 0 -0.5 -0.222656 -0.5 -0.5 v -1 c 0 -0.277344 0.222656 -0.5 0.5 -0.5 z m 0 0", "key": "i4s5zy" }]], "aliases": ["appointment-soon-symbolic"], "gtkIconName": "appointment-soon-symbolic", "monochrome": false };
__iconData$8K.node;
const AppointmentSoon = createAdwaitaIcon(__iconData$8K);

const __iconData$8J = { "name": "audio-card", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 6 0 v 6.0625 c -0.164062 -0.035156 -0.332031 -0.050781 -0.5 -0.050781 c -1.378906 0 -2.492188 1.113281 -2.496094 2.492187 c 0 1.378906 1.117188 2.496094 2.496094 2.496094 c 1.367188 -0.003906 2.476562 -1.101562 2.492188 -2.46875 h 0.007812 v -4.53125 h 3 l -3 -4 z m 7 0 c -0.550781 0 -1 0.449219 -1 1 v 14 h 2 v -3 h 2 v -3 h -2 v -1 h 2 v -3 h -2 v -3 h 2 v -2 z m -10 2 c -1.332031 0 -2.273438 0.8125 -2.644531 1.550781 c -0.371094 0.742188 -0.355469 1.449219 -0.355469 1.449219 v 6 s -0.015625 0.707031 0.355469 1.449219 c 0.367187 0.738281 1.3125 1.550781 2.644531 1.550781 h 8 v -2 h -8 c -0.667969 0 -0.726562 -0.1875 -0.855469 -0.449219 c -0.128906 -0.257812 -0.144531 -0.550781 -0.144531 -0.550781 v -6 s 0.015625 -0.292969 0.144531 -0.550781 c 0.128907 -0.261719 0.1875 -0.449219 0.855469 -0.449219 h 2 v -2 z m 11 4 h 1 v 1 h -1 z m 0 4 h 1 v 1 h -1 z m 0 0", "key": "s3nq6x" }]], "aliases": ["audio-card-symbolic"], "gtkIconName": "audio-card-symbolic" };
__iconData$8J.node;
const AudioCard = createAdwaitaIcon(__iconData$8J);

const __iconData$8I = { "name": "audio-headphones", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 c -1.230469 0 -2.4375 0.324219 -3.5 0.9375 c -2.164062 1.25 -3.5 3.5625 -3.5 6.0625 v 6 s 0 2 2 2 h 1 c 0.554688 0 1 -0.445312 1 -1 v -4 c 0 -0.554688 -0.5 -1 -1 -1 c 0 0 -1 0 -1 -1 v -1 c 0 -1.785156 0.953125 -3.4375 2.5 -4.332031 c 1.546875 -0.890625 3.453125 -0.890625 5 0 c 1.546875 0.894531 2.5 2.546875 2.5 4.332031 v 1 c 0 1 -1 1 -1 1 c -0.5 0 -1 0.445312 -1 1 v 4 c 0 0.554688 0.445312 1 1 1 h 1 c 2 0 2 -2 2 -2 v -6 c 0 -2.5 -1.335938 -4.8125 -3.5 -6.0625 c -1.0625 -0.613281 -2.269531 -0.9375 -3.5 -0.9375 z m 0 0", "key": "qscs1w" }]], "aliases": ["audio-headphones-symbolic"], "gtkIconName": "audio-headphones-symbolic" };
__iconData$8I.node;
const AudioHeadphones = createAdwaitaIcon(__iconData$8I);

const __iconData$8H = { "name": "audio-headset", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 c -1.230469 0 -2.4375 0.324219 -3.5 0.9375 c -2.164062 1.25 -3.5 3.5625 -3.5 6.0625 v 3 c 0 2 2 2 2 2 h 1 c 0.554688 0 1 -0.445312 1 -1 v -3 c 0 -0.554688 -0.445312 -1 -1 -1 h -1 c 0 -1.785156 0.953125 -3.4375 2.5 -4.332031 c 1.546875 -0.890625 3.453125 -0.890625 5 0 c 1.546875 0.894531 2.5 2.546875 2.5 4.332031 h -1 c -0.554688 0 -1 0.445312 -1 1 v 3 c 0 0.554688 0.5 1 1 1 h 1 c 0 1.167969 -0.4375 1.476562 -0.949219 1.730469 c -0.507812 0.253906 -1.050781 0.269531 -1.050781 0.269531 h -4 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 h 4 s 0.957031 0.011719 1.949219 -0.480469 c 0.988281 -0.496093 2.050781 -1.6875 2.050781 -3.519531 v -5 c 0 -2.5 -1.335938 -4.8125 -3.5 -6.0625 c -1.0625 -0.613281 -2.269531 -0.9375 -3.5 -0.9375 z m 0 0", "key": "5g2i0b" }]], "aliases": ["audio-headset-symbolic"], "gtkIconName": "audio-headset-symbolic" };
__iconData$8H.node;
const AudioHeadset = createAdwaitaIcon(__iconData$8H);

const __iconData$8G = { "name": "audio-input-microphone", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 c -1.660156 0 -3 1.339844 -3 3 v 5 c 0 1.660156 1.339844 3 3 3 s 3 -1.339844 3 -3 v -5 c 0 -1.660156 -1.339844 -3 -3 -3 z m -6 6 v 2.011719 c 0 2.964843 2.164062 5.429687 5 5.90625 v 2.082031 h 2 v -2.082031 c 2.835938 -0.476563 5 -2.941407 5 -5.90625 v -2.011719 h -1.5 v 2.011719 c 0 2.5 -1.992188 4.488281 -4.5 4.488281 s -4.5 -1.988281 -4.5 -4.488281 v -2.011719 z m 0 0", "key": "mgamob" }]], "aliases": ["audio-input-microphone-symbolic"], "gtkIconName": "audio-input-microphone-symbolic" };
__iconData$8G.node;
const AudioInputMicrophone = createAdwaitaIcon(__iconData$8G);

const __iconData$8F = { "name": "audio-speakers-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3.960938 0.00390625 c -0.257813 0.01171875 -0.511719 0.12109375 -0.6875 0.30468775 c -0.332032 0.351562 -0.375 0.988281 0.03125 1.390625 l 3.304687 3.300781 h 1.390625 v -1.421875 l -3.3125 -3.292969 c -0.203125 -0.207031 -0.46875 -0.2929685 -0.726562 -0.28124975 z m 5.039062 1.00390575 v 13.992188 c 0.277344 0.003906 0.558594 -0.105469 0.765625 -0.359375 l 3.234375 -3.640625 h 1 c 1.089844 0 2 -0.910156 2 -2 v -2 c 0 -1.15625 -0.90625 -2 -2 -2 h -1 l -3.234375 -3.640625 c -0.1875 -0.226563 -0.46875 -0.355469 -0.765625 -0.351563 z m -7 5.992188 c -0.75 0 -1 0.5 -1 1 s 0.25 1 1 1 h 6 v -2 z m 4.609375 4 l -3.316406 3.300781 c -0.402344 0.402344 -0.359375 1.039063 -0.027344 1.390625 c 0.347656 0.371094 1.007813 0.433594 1.410156 0.023438 l 3.324219 -3.292969 v -1.421875 z m 0 0", "key": "kmayfr" }]], "aliases": ["audio-speakers-rtl-symbolic"], "gtkIconName": "audio-speakers-rtl-symbolic" };
__iconData$8F.node;
const AudioSpeakersRtl = createAdwaitaIcon(__iconData$8F);

const __iconData$8E = { "name": "audio-speakers", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 12.039062 0.00390625 c -0.257812 -0.01171875 -0.523437 0.07421875 -0.726562 0.28124975 l -3.3125 3.292969 v 1.421875 h 1.390625 l 3.304687 -3.300781 c 0.40625 -0.402344 0.359376 -1.039063 0.03125 -1.390625 c -0.175781 -0.183594 -0.429687 -0.292969 -0.6875 -0.30468775 z m -5.039062 1.00390575 c -0.296875 -0.003906 -0.578125 0.125 -0.769531 0.351563 l -3.230469 3.640625 h -1 c -1.09375 0 -2 0.84375 -2 2 v 2 c 0 1.089844 0.910156 2 2 2 h 1 l 3.230469 3.640625 c 0.210937 0.253906 0.492187 0.363281 0.769531 0.359375 z m 1 5.992188 v 2 h 6 c 0.75 0 1 -0.5 1 -1 s -0.25 -1 -1 -1 z m 0 4 v 1.421875 l 3.324219 3.292969 c 0.402343 0.410156 1.0625 0.347656 1.414062 -0.023438 c 0.328125 -0.351562 0.371094 -0.988281 -0.03125 -1.390625 l -3.316406 -3.300781 z m 0 0", "key": "yc8qkt" }]], "aliases": ["audio-speakers-symbolic"], "gtkIconName": "audio-speakers-symbolic" };
__iconData$8E.node;
const AudioSpeakers = createAdwaitaIcon(__iconData$8E);

const __iconData$8D = { "name": "audio-volume-high-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 9 1.007812 c 0.296875 -0.003906 0.578125 0.125 0.769531 0.351563 l 3.230469 3.640625 h 1 c 1.09375 0 2 0.84375 2 2 v 2 c 0 1.089844 -0.910156 2 -2 2 h -1 l -3.230469 3.640625 c -0.210937 0.253906 -0.492187 0.363281 -0.769531 0.359375 z m -6.460938 0.960938 c 0.191407 -0.003906 0.386719 0.054688 0.558594 0.167969 c 0.457032 0.3125 0.578125 0.933593 0.269532 1.390625 c -1.824219 2.707031 -1.824219 6.238281 0 8.945312 c 0.308593 0.457032 0.1875 1.078125 -0.269532 1.390625 c -0.457031 0.308594 -1.078125 0.1875 -1.390625 -0.269531 c -1.136719 -1.691406 -1.707031 -3.640625 -1.707031 -5.59375 s 0.570312 -3.902344 1.707031 -5.59375 c 0.195313 -0.285156 0.511719 -0.4375 0.832031 -0.4375 z m 3.421876 2.019531 c 0.222656 -0.007812 0.453124 0.058594 0.644531 0.203125 c 0.261719 0.199219 0.394531 0.5 0.394531 0.804688 v 0.058594 c -0.011719 0.191406 -0.074219 0.375 -0.199219 0.535156 c -1.074219 1.429687 -1.074219 3.390625 0 4.816406 c 0.125 0.164062 0.1875 0.347656 0.199219 0.535156 v 0.0625 c 0 0.304688 -0.132812 0.605469 -0.394531 0.804688 c -0.441407 0.332031 -1.066407 0.242187 -1.398438 -0.199219 c -0.804687 -1.066406 -1.207031 -2.335937 -1.207031 -3.609375 s 0.402344 -2.542969 1.207031 -3.613281 c 0.183594 -0.246094 0.464844 -0.382813 0.753907 -0.398438 z m 0 0", "key": "pok6h7" }]], "aliases": ["audio-volume-high-rtl-symbolic"], "gtkIconName": "audio-volume-high-rtl-symbolic" };
__iconData$8D.node;
const AudioVolumeHighRtl = createAdwaitaIcon(__iconData$8D);

const __iconData$8C = { "name": "audio-volume-high", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 1.007812 c -0.296875 -0.003906 -0.578125 0.125 -0.769531 0.351563 l -3.230469 3.640625 h -1 c -1.09375 0 -2 0.84375 -2 2 v 2 c 0 1.089844 0.910156 2 2 2 h 1 l 3.230469 3.640625 c 0.210937 0.253906 0.492187 0.363281 0.769531 0.359375 z m 6.460938 0.960938 c -0.191407 -0.003906 -0.386719 0.054688 -0.558594 0.167969 c -0.457032 0.3125 -0.578125 0.933593 -0.269532 1.390625 c 1.824219 2.707031 1.824219 6.238281 0 8.945312 c -0.308593 0.457032 -0.1875 1.078125 0.269532 1.390625 c 0.457031 0.308594 1.078125 0.1875 1.390625 -0.269531 c 1.136719 -1.691406 1.707031 -3.640625 1.707031 -5.59375 s -0.570312 -3.902344 -1.707031 -5.59375 c -0.195313 -0.285156 -0.511719 -0.4375 -0.832031 -0.4375 z m -3.421876 2.019531 c -0.222656 -0.007812 -0.453124 0.058594 -0.644531 0.203125 c -0.261719 0.199219 -0.394531 0.5 -0.394531 0.804688 v 0.058594 c 0.011719 0.191406 0.074219 0.375 0.199219 0.535156 c 1.074219 1.429687 1.074219 3.390625 0 4.816406 c -0.125 0.164062 -0.1875 0.347656 -0.199219 0.535156 v 0.0625 c 0 0.304688 0.132812 0.605469 0.394531 0.804688 c 0.441407 0.332031 1.066407 0.242187 1.398438 -0.199219 c 0.804687 -1.066406 1.207031 -2.335937 1.207031 -3.609375 s -0.402344 -2.542969 -1.207031 -3.613281 c -0.183594 -0.246094 -0.464844 -0.382813 -0.753907 -0.398438 z m 0 0", "key": "j6a5ph" }]], "aliases": ["audio-volume-high-symbolic"], "gtkIconName": "audio-volume-high-symbolic" };
__iconData$8C.node;
const AudioVolumeHigh = createAdwaitaIcon(__iconData$8C);

const __iconData$8B = { "name": "audio-volume-low-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 9 1.007812 c 0.296875 -0.003906 0.578125 0.125 0.769531 0.351563 l 3.230469 3.640625 h 1 c 1.09375 0 2 0.84375 2 2 v 2 c 0 1.089844 -0.910156 2 -2 2 h -1 l -3.230469 3.640625 c -0.210937 0.253906 -0.492187 0.363281 -0.769531 0.359375 z m -2.957031 2.980469 c 0.199219 0.011719 0.394531 0.074219 0.5625 0.203125 c 0.441406 0.332032 0.53125 0.960938 0.195312 1.402344 c -1.074219 1.425781 -1.074219 3.386719 0 4.8125 c 0.335938 0.441406 0.246094 1.070312 -0.195312 1.402344 c -0.441407 0.332031 -1.066407 0.242187 -1.398438 -0.195313 c -0.804687 -1.070312 -1.207031 -2.339843 -1.207031 -3.613281 s 0.402344 -2.542969 1.207031 -3.613281 c 0.183594 -0.246094 0.464844 -0.382813 0.753907 -0.398438 h 0.085937 z m 0 0", "key": "1wuo9o" }]], "aliases": ["audio-volume-low-rtl-symbolic"], "gtkIconName": "audio-volume-low-rtl-symbolic" };
__iconData$8B.node;
const AudioVolumeLowRtl = createAdwaitaIcon(__iconData$8B);

const __iconData$8A = { "name": "audio-volume-low", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 1.007812 c -0.296875 -0.003906 -0.578125 0.125 -0.769531 0.351563 l -3.230469 3.640625 h -1 c -1.09375 0 -2 0.84375 -2 2 v 2 c 0 1.089844 0.910156 2 2 2 h 1 l 3.230469 3.640625 c 0.210937 0.253906 0.492187 0.363281 0.769531 0.359375 z m 2.957031 2.980469 c -0.199219 0.011719 -0.394531 0.074219 -0.5625 0.203125 c -0.441406 0.332032 -0.53125 0.960938 -0.195312 1.402344 c 1.074219 1.425781 1.074219 3.386719 0 4.8125 c -0.335938 0.441406 -0.246094 1.070312 0.195312 1.402344 c 0.441407 0.332031 1.066407 0.242187 1.398438 -0.195313 c 0.804687 -1.070312 1.207031 -2.339843 1.207031 -3.613281 s -0.402344 -2.542969 -1.207031 -3.613281 c -0.183594 -0.246094 -0.464844 -0.382813 -0.753907 -0.398438 c -0.027343 0 -0.054687 0 -0.085937 0 z m 0 0", "key": "1pth6g" }]], "aliases": ["audio-volume-low-symbolic"], "gtkIconName": "audio-volume-low-symbolic" };
__iconData$8A.node;
const AudioVolumeLow = createAdwaitaIcon(__iconData$8A);

const __iconData$8z = { "name": "audio-volume-medium-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 9 1.007812 c 0.296875 -0.003906 0.578125 0.125 0.769531 0.351563 l 3.230469 3.640625 h 1 c 1.09375 0 2 0.84375 2 2 v 2 c 0 1.089844 -0.910156 2 -2 2 h -1 l -3.230469 3.640625 c -0.210937 0.253906 -0.492187 0.363281 -0.769531 0.359375 z m -3.039062 2.980469 c 0.222656 -0.007812 0.453124 0.058594 0.644531 0.203125 c 0.261719 0.199219 0.394531 0.5 0.394531 0.804688 v 0.066406 c -0.011719 0.1875 -0.078125 0.371094 -0.199219 0.527344 c -1.074219 1.429687 -1.074219 3.390625 0 4.816406 c 0.121094 0.160156 0.1875 0.34375 0.199219 0.53125 v 0.066406 c 0 0.304688 -0.132812 0.605469 -0.394531 0.804688 c -0.441407 0.332031 -1.066407 0.242187 -1.398438 -0.199219 c -0.804687 -1.066406 -1.207031 -2.335937 -1.207031 -3.609375 s 0.402344 -2.542969 1.207031 -3.613281 c 0.183594 -0.246094 0.464844 -0.382813 0.753907 -0.398438 z m 0 0", "key": "1pkyo0" }], ["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 2.539062 1.96875 c 0.191407 -0.003906 0.386719 0.054688 0.558594 0.167969 c 0.457032 0.3125 0.578125 0.933593 0.269532 1.390625 c -1.824219 2.707031 -1.824219 6.238281 0 8.945312 c 0.308593 0.457032 0.1875 1.078125 -0.269532 1.390625 c -0.457031 0.308594 -1.078125 0.1875 -1.390625 -0.269531 c -1.136719 -1.691406 -1.707031 -3.640625 -1.707031 -5.59375 s 0.570312 -3.902344 1.707031 -5.59375 c 0.195313 -0.285156 0.511719 -0.4375 0.832031 -0.4375 z m 0 0", "key": "1t5vjy" }]], "aliases": ["audio-volume-medium-rtl-symbolic"], "gtkIconName": "audio-volume-medium-rtl-symbolic" };
__iconData$8z.node;
const AudioVolumeMediumRtl = createAdwaitaIcon(__iconData$8z);

const __iconData$8y = { "name": "audio-volume-medium", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 1.007812 c -0.296875 -0.003906 -0.578125 0.125 -0.769531 0.351563 l -3.230469 3.640625 h -1 c -1.09375 0 -2 0.84375 -2 2 v 2 c 0 1.089844 0.910156 2 2 2 h 1 l 3.230469 3.640625 c 0.210937 0.253906 0.492187 0.363281 0.769531 0.359375 z m 3.039062 2.980469 c -0.222656 -0.007812 -0.453124 0.058594 -0.644531 0.203125 c -0.261719 0.199219 -0.394531 0.5 -0.394531 0.804688 v 0.066406 c 0.011719 0.1875 0.078125 0.371094 0.199219 0.527344 c 1.074219 1.429687 1.074219 3.390625 0 4.816406 c -0.121094 0.160156 -0.1875 0.34375 -0.199219 0.53125 v 0.066406 c 0 0.304688 0.132812 0.605469 0.394531 0.804688 c 0.441407 0.332031 1.066407 0.242187 1.398438 -0.199219 c 0.804687 -1.066406 1.207031 -2.335937 1.207031 -3.609375 s -0.402344 -2.542969 -1.207031 -3.613281 c -0.183594 -0.246094 -0.464844 -0.382813 -0.753907 -0.398438 z m 0 0", "key": "dsz0k" }], ["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 13.460938 1.96875 c -0.191407 -0.003906 -0.386719 0.054688 -0.558594 0.167969 c -0.457032 0.3125 -0.578125 0.933593 -0.269532 1.390625 c 1.824219 2.707031 1.824219 6.238281 0 8.945312 c -0.308593 0.457032 -0.1875 1.078125 0.269532 1.390625 c 0.457031 0.308594 1.078125 0.1875 1.390625 -0.269531 c 1.136719 -1.691406 1.707031 -3.640625 1.707031 -5.59375 s -0.570312 -3.902344 -1.707031 -5.59375 c -0.195313 -0.285156 -0.511719 -0.4375 -0.832031 -0.4375 z m 0 0", "key": "1qqpdl" }]], "aliases": ["audio-volume-medium-symbolic"], "gtkIconName": "audio-volume-medium-symbolic" };
__iconData$8y.node;
const AudioVolumeMedium = createAdwaitaIcon(__iconData$8y);

const __iconData$8x = { "name": "audio-volume-muted-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 9 1.007812 c 0.296875 -0.003906 0.578125 0.125 0.769531 0.351563 l 3.230469 3.640625 h 1 c 1.09375 0 2 0.84375 2 2 v 2 c 0 1.089844 -0.910156 2 -2 2 h -1 l -3.230469 3.640625 c -0.210937 0.253906 -0.492187 0.363281 -0.769531 0.359375 z m 0 0", "key": "1e4t5s" }], ["path", { "fill": "currentColor", "d": "m 6 5 c 0.265625 0 0.519531 0.105469 0.707031 0.292969 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 l -1.292969 1.292969 l 1.292969 1.292969 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 s -1.023437 0.390625 -1.414062 0 l -1.292969 -1.292969 l -1.292969 1.292969 c -0.390625 0.390625 -1.023437 0.390625 -1.414062 0 s -0.390625 -1.023437 0 -1.414062 l 1.292969 -1.292969 l -1.292969 -1.292969 c -0.390625 -0.390625 -0.390625 -1.023437 0 -1.414062 c 0.1875 -0.1875 0.441406 -0.292969 0.707031 -0.292969 s 0.519531 0.105469 0.707031 0.292969 l 1.292969 1.292969 l 1.292969 -1.292969 c 0.1875 -0.1875 0.441406 -0.292969 0.707031 -0.292969 z m 0 0", "key": "10en7c" }]], "aliases": ["audio-volume-muted-rtl-symbolic"], "gtkIconName": "audio-volume-muted-rtl-symbolic" };
__iconData$8x.node;
const AudioVolumeMutedRtl = createAdwaitaIcon(__iconData$8x);

const __iconData$8w = { "name": "audio-volume-muted", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 1.007812 c -0.296875 -0.003906 -0.578125 0.125 -0.769531 0.351563 l -3.230469 3.640625 h -1 c -1.09375 0 -2 0.84375 -2 2 v 2 c 0 1.089844 0.910156 2 2 2 h 1 l 3.230469 3.640625 c 0.210937 0.253906 0.492187 0.363281 0.769531 0.359375 z m 0 0", "key": "1wcuwz" }], ["path", { "fill": "currentColor", "d": "m 10 5 c -0.265625 0 -0.519531 0.105469 -0.707031 0.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 l 1.292969 1.292969 l -1.292969 1.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 s 1.023437 0.390625 1.414062 0 l 1.292969 -1.292969 l 1.292969 1.292969 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 s 0.390625 -1.023437 0 -1.414062 l -1.292969 -1.292969 l 1.292969 -1.292969 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 s -0.519531 0.105469 -0.707031 0.292969 l -1.292969 1.292969 l -1.292969 -1.292969 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0 0", "key": "abgw4n" }]], "aliases": ["audio-volume-muted-symbolic"], "gtkIconName": "audio-volume-muted-symbolic" };
__iconData$8w.node;
const AudioVolumeMuted = createAdwaitaIcon(__iconData$8w);

const __iconData$8v = { "name": "audio-volume-overamplified-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 9 1.007812 c 0.296875 -0.003906 0.578125 0.125 0.769531 0.351563 l 3.230469 3.640625 h 1 c 1.09375 0 2 0.84375 2 2 v 2 c 0 1.089844 -0.910156 2 -2 2 h -1 l -3.230469 3.640625 c -0.210937 0.253906 -0.492187 0.363281 -0.769531 0.359375 z m -7 -0.007812 c 0.550781 0 1 0.449219 1 1 v 12 c 0 0.550781 -0.449219 1 -1 1 s -1 -0.449219 -1 -1 v -12 c 0 -0.550781 0.449219 -1 1 -1 z m 4 2 c 0.550781 0 1 0.449219 1 1 v 8 c 0 0.550781 -0.449219 1 -1 1 s -1 -0.449219 -1 -1 v -8 c 0 -0.550781 0.449219 -1 1 -1 z m 0 0", "key": "111662" }]], "aliases": ["audio-volume-overamplified-rtl-symbolic"], "gtkIconName": "audio-volume-overamplified-rtl-symbolic" };
__iconData$8v.node;
const AudioVolumeOveramplifiedRtl = createAdwaitaIcon(__iconData$8v);

const __iconData$8u = { "name": "audio-volume-overamplified", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 1.007812 c -0.296875 -0.003906 -0.578125 0.125 -0.769531 0.351563 l -3.230469 3.640625 h -1 c -1.09375 0 -2 0.84375 -2 2 v 2 c 0 1.089844 0.910156 2 2 2 h 1 l 3.230469 3.640625 c 0.210937 0.253906 0.492187 0.363281 0.769531 0.359375 z m 7 -0.007812 c -0.550781 0 -1 0.449219 -1 1 v 12 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -12 c 0 -0.550781 -0.449219 -1 -1 -1 z m -4 2 c -0.550781 0 -1 0.449219 -1 1 v 8 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -8 c 0 -0.550781 -0.449219 -1 -1 -1 z m 0 0", "key": "1xgyr9" }]], "aliases": ["audio-volume-overamplified-symbolic"], "gtkIconName": "audio-volume-overamplified-symbolic" };
__iconData$8u.node;
const AudioVolumeOveramplified = createAdwaitaIcon(__iconData$8u);

const __iconData$8t = { "name": "audio-x-generic", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 1 c -1.644531 0 -3 1.355469 -3 3 v 4.34375 c -0.457031 -0.21875 -0.964844 -0.34375 -1.5 -0.34375 c -1.921875 0 -3.5 1.578125 -3.5 3.5 s 1.578125 3.5 3.5 3.5 c 1.914062 0 3.492188 -1.570312 3.5 -3.480469 c 0 -0.007812 0 -0.011719 0 -0.019531 v -7.5 c 0 -0.5625 0.4375 -1 1 -1 h 4 c 0.5625 0 1 0.4375 1 1 v 4.34375 c -0.457031 -0.21875 -0.964844 -0.34375 -1.5 -0.34375 c -1.921875 0 -3.5 1.578125 -3.5 3.5 s 1.578125 3.5 3.5 3.5 s 3.5 -1.578125 3.5 -3.5 v -7.5 c 0 -1.644531 -1.355469 -3 -3 -3 z m -4.5 9 c 0.839844 0 1.5 0.660156 1.5 1.5 v 0.015625 c -0.007812 0.832031 -0.664062 1.484375 -1.5 1.484375 c -0.839844 0 -1.5 -0.660156 -1.5 -1.5 s 0.660156 -1.5 1.5 -1.5 z m 8 0 c 0.839844 0 1.5 0.660156 1.5 1.5 s -0.660156 1.5 -1.5 1.5 s -1.5 -0.660156 -1.5 -1.5 s 0.660156 -1.5 1.5 -1.5 z m 0 0", "key": "1pldha" }]], "aliases": ["audio-x-generic-symbolic"], "gtkIconName": "audio-x-generic-symbolic" };
__iconData$8t.node;
const AudioXGeneric = createAdwaitaIcon(__iconData$8t);

const __iconData$8s = { "name": "auth-face", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 1 c -1.644531 0 -3 1.355469 -3 3 v 2 h 1 s 1 0 1 -1 v -1 c 0 -0.570312 0.429688 -1 1 -1 h 1 s 1 0 1 -1 v -1 z m 8 0 v 1 c 0 1 1 1 1 1 h 1 c 0.570312 0 1 0.429688 1 1 v 1 c 0 1 1 1 1 1 h 1 v -2 c 0 -1.644531 -1.355469 -3 -3 -3 z m -5 4.019531 c -0.550781 0 -1 0.445313 -1 1 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 c 0 -0.554687 -0.449219 -1 -1 -1 z m 4 0 c -0.550781 0 -1 0.445313 -1 1 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 c 0 -0.554687 -0.449219 -1 -1 -1 z m -5.574219 3.988281 c -0.050781 0.003907 -0.101562 0.023438 -0.148437 0.046876 c -0.246094 0.121093 -0.347656 0.421874 -0.226563 0.667968 c 0 0 1.183594 2.277344 3.949219 2.277344 s 3.949219 -2.277344 3.949219 -2.277344 c 0.121093 -0.246094 0.019531 -0.546875 -0.226563 -0.667968 c -0.246094 -0.125 -0.546875 -0.023438 -0.671875 0.222656 c 0 0 -0.816406 1.722656 -3.050781 1.722656 s -3.050781 -1.722656 -3.050781 -1.722656 c -0.097657 -0.195313 -0.308594 -0.304688 -0.523438 -0.269532 z m -4.425781 0.992188 v 2 c 0 1.644531 1.355469 3 3 3 h 2 v -2 h -2 c -0.570312 0 -1 -0.429688 -1 -1 v -1 c 0 -1 -1 -1 -1 -1 z m 15 0 c -1 0 -1 1 -1 1 v 1 c 0 0.570312 -0.429688 1 -1 1 h -2 v 2 h 2 c 1.644531 0 3 -1.355469 3 -3 v -2 z m 0 0", "key": "i0fjwq" }]], "aliases": ["auth-face-symbolic"], "gtkIconName": "auth-face-symbolic" };
__iconData$8s.node;
const AuthFace = createAdwaitaIcon(__iconData$8s);

const __iconData$8r = { "name": "auth-fingerprint", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8.074219 0 c -1.203125 -0.0117188 -2.40625 0.285156 -3.492188 0.890625 c -0.480469 0.269531 -0.652343 0.878906 -0.382812 1.359375 c 0.269531 0.484375 0.878906 0.65625 1.359375 0.386719 c 1.550781 -0.867188 3.4375 -0.847657 4.972656 0.050781 c 1.53125 0.898438 2.46875 2.535156 2.46875 4.3125 v 1 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -1 c 0 -0.019531 0 -0.039062 -0.003906 -0.054688 c -0.019532 -2.460937 -1.332032 -4.738281 -3.457032 -5.984374 c -1.070312 -0.628907 -2.265624 -0.9492192 -3.46875 -0.960938 z m -5.199219 2.832031 c -0.066406 0 -0.132812 0.007813 -0.195312 0.023438 c -0.257813 0.058593 -0.484376 0.21875 -0.625 0.445312 c -0.6875 1.109375 -1.054688 2.390625 -1.054688 3.699219 v 5.0625 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -5.0625 c 0 -0.933594 0.261719 -1.851562 0.753906 -2.644531 c 0.292969 -0.46875 0.148438 -1.082031 -0.320312 -1.375 c -0.167969 -0.105469 -0.363282 -0.15625 -0.558594 -0.148438 z m 5.125 0.167969 c -2.199219 0 -4 1.800781 -4 4 v 1 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -1 c 0 -1.117188 0.882812 -2 2 -2 s 2 0.882812 2 2 v 5 s 0.007812 0.441406 0.175781 0.941406 s 0.5 1.148438 1.117188 1.765625 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 s 0.390625 -1.023437 0 -1.414062 c -0.382812 -0.382813 -0.550781 -0.734375 -0.632812 -0.984375 s -0.074219 -0.308594 -0.074219 -0.308594 v -5 c 0 -2.199219 -1.800781 -4 -4 -4 z m 0 3 c -0.550781 0 -1 0.449219 -1 1 v 5 s 0 0.59375 0.144531 1.320312 c 0.144531 0.726563 0.414063 1.652344 1.148438 2.386719 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 s 0.390625 -1.023437 0 -1.414062 c -0.265625 -0.265625 -0.496093 -0.839844 -0.601562 -1.363281 c -0.105469 -0.523438 -0.105469 -0.929688 -0.105469 -0.929688 v -5 c 0 -0.550781 -0.449219 -1 -1 -1 z m -3 4 c -0.550781 0 -1 0.449219 -1 1 v 3 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -3 c 0 -0.550781 -0.449219 -1 -1 -1 z m 9 0 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 s 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m 0 0", "key": "uqfmxp" }]], "aliases": ["auth-fingerprint-symbolic"], "gtkIconName": "auth-fingerprint-symbolic" };
__iconData$8r.node;
const AuthFingerprint = createAdwaitaIcon(__iconData$8r);

const __iconData$8q = { "name": "auth-sim-locked", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 13 9 c -1.097656 0 -2 0.902344 -2 2 v 1 h -1 v 4 h 6 v -4 h -1 v -1 c 0 -1.097656 -0.902344 -2 -2 -2 z m 0 1 c 0.5625 0 1 0.4375 1 1 v 1 h -2 v -1 c 0 -0.5625 0.4375 -1 1 -1 z m 0 0", "key": "z9wnc9" }], ["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 4 0 c -2 0 -2 2 -2 2 v 12 c 0 2 2 2 2 2 h 5 v -5 h -5 v -2 h 6.667969 c 0.558593 -0.679688 1.398437 -1.125 2.332031 -1.125 c 0.351562 0 0.6875 0.074219 1 0.1875 v -5.0625 l -3 -3 z m 1 6 l 1 0.007812 v 2 h -2 v -1.007812 s 0 -1 1 -1 z m 6 0 c 1 0 1 1 1 1 l -0.003906 1 h -2 v -2 z m -4 0.007812 h 2 v 2 h -2 z m -3 5.996094 h 2 v 2 l -1 -0.003906 c -1 0 -1 -1 -1 -1 z m 3 0 h 2 v 2 h -2 z m 0 0", "key": "mjcwvm" }]], "aliases": ["auth-sim-locked-symbolic"], "gtkIconName": "auth-sim-locked-symbolic" };
__iconData$8q.node;
const AuthSimLocked = createAdwaitaIcon(__iconData$8q);

const __iconData$8p = { "name": "auth-sim-missing", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 4 0 c -2 0 -2 2 -2 2 v 12 c 0 2 2 2 2 2 h 8 s 2 0 2 -2 v -11 l -3 -3 z m 3.753906 3 c 0.019532 0 0.039063 0.011719 0.058594 0.011719 c 2.160156 -0.089844 4.0625 1.5625 4.183594 3.746093 l 0.003906 0.027344 v 0.027344 c 0 0.046875 -0.003906 0.085938 -0.007812 0.132812 c 0.003906 0.011719 0.007812 0.054688 0.007812 0.054688 l -0.003906 1 h -0.121094 c -0.074219 0.328125 -0.1875 0.636719 -0.355469 0.917969 c -0.015625 0.03125 -0.039062 0.054687 -0.054687 0.082031 h 0.53125 v 2 h 0.003906 v 2 c 0 1 -1 1 -1 1 l -1.003906 -0.003906 v -0.984375 c -0.007813 1.089843 -0.910156 1.988281 -1.996094 1.988281 c -1.09375 0 -2 -0.90625 -2 -2 c 0 -0.382812 0.132812 -0.710938 0.335938 -1 h -0.335938 v -1 h -2.003906 v -2 h 2.003906 v -1 h -0.003906 v 0.007812 h -2 l 0.003906 -1.007812 s 0.003906 -0.054688 0.007812 -0.09375 c -0.03125 -2.109375 1.671876 -3.789062 3.746094 -3.902344 z m 4.242188 8 h -1.996094 v 0.003906 h 1.996094 z m -3.332032 -5.867188 c 0.71875 0.261719 1.273438 0.929688 1.324219 1.730469 c 0 -0.003906 0.003907 -0.003906 0.003907 -0.011719 c -0.054688 -0.796874 -0.601563 -1.457031 -1.328126 -1.722656 z m 1 6.867188 c 0.199219 0.285156 0.332032 0.613281 0.332032 0.988281 v -0.988281 z m -5.667968 0.003906 h 2 v 2 l -0.996094 -0.003906 c -1 0 -1 -1 -1 -1 z m 0 0", "key": "1xtg43" }], ["path", { "fill": "currentColor", "d": "m 8.152344 4.007812 c -0.4375 -0.023437 -0.882813 0.046876 -1.300782 0.222657 c -1.117187 0.460937 -1.851562 1.558593 -1.851562 2.769531 h 2 c 0 -0.40625 0.242188 -0.769531 0.617188 -0.921875 c 0.375 -0.15625 0.800781 -0.074219 1.089843 0.214844 c 0.289063 0.289062 0.371094 0.714843 0.214844 1.089843 s -0.515625 0.617188 -0.921875 0.617188 c -0.550781 0 -1 0.449219 -1 1 v 2 h 2 v -1.179688 c 0.785156 -0.28125 1.441406 -0.875 1.769531 -1.671874 c 0.464844 -1.117188 0.207031 -2.414063 -0.648437 -3.269532 c -0.535156 -0.535156 -1.242188 -0.835937 -1.96875 -0.871094 z m -0.152344 7.992188 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 s 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m 0 0", "key": "1ldjx3" }]], "aliases": ["auth-sim-missing-symbolic"], "gtkIconName": "auth-sim-missing-symbolic" };
__iconData$8p.node;
const AuthSimMissing = createAdwaitaIcon(__iconData$8p);

const __iconData$8o = { "name": "auth-sim", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4 0 c -2 0 -2 2 -2 2 v 12 c 0 2 2 2 2 2 h 8 s 2 0 2 -2 v -11 l -3 -3 z m 1 6 l 1 0.007812 v 2 h -2 v -1.007812 s 0 -1 1 -1 z m 6 0 c 1 0 1 1 1 1 l -0.003906 1 h -2 v -2 z m -4 0.007812 h 2 v 2 h -2 z m -3 2.996094 h 8 v 3.996094 c 0 1 -1 1 -1 1 l -1 -0.003906 v -2.996094 h -6 z m 6 2 h 2 v -0.003906 h -2 z m -6 1 h 2 v 2 l -1 -0.003906 c -1 0 -1 -1 -1 -1 z m 3 0 h 2 v 2 h -2 z m 0 0", "key": "cysm7n" }]], "aliases": ["auth-sim-symbolic"], "gtkIconName": "auth-sim-symbolic" };
__iconData$8o.node;
const AuthSim = createAdwaitaIcon(__iconData$8o);

const __iconData$8n = { "name": "auth-smartcard", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4 0 c -2 0 -2 2 -2 2 v 12 c 0 2 2 2 2 2 h 8 s 2 0 2 -2 v -12 c 0 -2 -2 -2 -2 -2 z m 1.507812 2.976562 c 0.28125 -0.003906 0.511719 0.226563 0.507813 0.507813 v 3.53125 h 1 v -4.03125 h 3 v 4.03125 h 0.511719 c 0.675781 -0.011719 0.675781 1.007813 0 1 h -1.511719 v -4.03125 h -1 v 4.03125 h -3 v -4.53125 c -0.003906 -0.277344 0.214844 -0.503906 0.492187 -0.507813 z m 0 0", "key": "drdamc" }]], "aliases": ["auth-smartcard-symbolic"], "gtkIconName": "auth-smartcard-symbolic" };
__iconData$8n.node;
const AuthSmartcard = createAdwaitaIcon(__iconData$8n);

const __iconData$8m = { "name": "avatar-default", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 1 c -1.65625 0 -3 1.34375 -3 3 s 1.34375 3 3 3 s 3 -1.34375 3 -3 s -1.34375 -3 -3 -3 z m -1.5 7 c -2.492188 0 -4.5 2.007812 -4.5 4.5 v 0.5 c 0 1.109375 0.890625 2 2 2 h 8 c 1.109375 0 2 -0.890625 2 -2 v -0.5 c 0 -2.492188 -2.007812 -4.5 -4.5 -4.5 z m 0 0", "key": "1p7ak0" }]], "aliases": ["avatar-default-symbolic"], "gtkIconName": "avatar-default-symbolic" };
__iconData$8m.node;
const AvatarDefault = createAdwaitaIcon(__iconData$8m);

const __iconData$8l = { "name": "battery-action", "size": 16, "node": [["path", { "fill": "#ed333b", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.015625 -1.445312 0.355469 c -0.742188 0.371093 -1.554688 1.3125 -1.554688 2.644531 v 8 s -0.015625 0.707031 0.355469 1.445312 c 0.371093 0.742188 1.3125 1.554688 2.644531 1.554688 h 6 s 0.710938 0.015625 1.449219 -0.355469 c 0.738281 -0.371093 1.550781 -1.3125 1.550781 -2.644531 v -8 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.367188 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 z m 4 4 c 0.554688 0 1 0.445312 1 1 v 8 c 0 0.554688 -0.445312 1 -1 1 h -6 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 z m 0 0", "key": "1qmhpa" }], ["path", { "fill": "#ed333b", "d": "m 5.898438 5.886719 c -0.269532 0 -0.523438 0.105469 -0.710938 0.292969 c -0.386719 0.390624 -0.386719 1.023437 0 1.410156 l 1.40625 1.40625 l -1.414062 1.414062 c -0.386719 0.390625 -0.386719 1.019532 0 1.410156 c 0.390624 0.386719 1.019531 0.386719 1.410156 0 l 1.414062 -1.414062 l 1.410156 1.414062 c 0.191407 0.1875 0.445313 0.292969 0.710938 0.292969 s 0.519531 -0.105469 0.710938 -0.292969 c 0.386718 -0.390624 0.386718 -1.019531 0 -1.410156 l -1.414063 -1.414062 l 1.40625 -1.40625 c 0.386719 -0.386719 0.386719 -1.019532 0 -1.410156 c -0.191406 -0.1875 -0.445313 -0.292969 -0.710937 -0.292969 c -0.265626 0 -0.519532 0.105469 -0.707032 0.292969 l -1.402344 1.402343 l -1.40625 -1.402343 c -0.183593 -0.1875 -0.441406 -0.292969 -0.703124 -0.292969 z m 0 0", "key": "1suu7i" }]], "aliases": ["battery-action-symbolic"], "gtkIconName": "battery-action-symbolic", "monochrome": false };
__iconData$8l.node;
const BatteryAction = createAdwaitaIcon(__iconData$8l);

const __iconData$8k = { "name": "battery-caution-charging", "size": 16, "node": [["path", { "fill": "#33d17a", "d": "m 5 12 v 1 h 3 v -1 z m 0 0", "key": "1rsyf1" }], ["path", { "fill": "currentColor", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.015625 -1.445312 0.355469 c -0.742188 0.371093 -1.554688 1.3125 -1.554688 2.644531 v 8 s -0.015625 0.707031 0.355469 1.449219 c 0.371093 0.738281 1.3125 1.550781 2.644531 1.550781 h 5 v -2 h -5 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 h 6 c 0.554688 0 1 0.445312 1 1 v 2 h 2 v -2 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 z m 6 8 v 0.007812 c -0.265625 -0.003906 -0.519531 0.101563 -0.707031 0.285157 l -3 3 c -0.1875 0.1875 -0.292969 0.441406 -0.292969 0.707031 v 1 h 3.132812 l -0.964843 1.445312 c -0.105469 0.164063 -0.164063 0.359376 -0.160157 0.554688 h -0.007812 v 1 h 1 v -0.003906 c 0.265625 0 0.519531 -0.101563 0.707031 -0.289063 l 3 -3 c 0.1875 -0.1875 0.289063 -0.441406 0.289063 -0.707031 h 0.003906 v -1 h -3.128906 l 0.960937 -1.445312 c 0.109375 -0.164063 0.167969 -0.359376 0.167969 -0.554688 v -1 z m 0 0", "key": "1y9zj4" }]], "aliases": ["battery-caution-charging-symbolic"], "gtkIconName": "battery-caution-charging-symbolic", "monochrome": false };
__iconData$8k.node;
const BatteryCautionCharging = createAdwaitaIcon(__iconData$8k);

const __iconData$8j = { "name": "battery-caution", "size": 16, "node": [["path", { "fill": "#ff7800", "d": "m 9 12 c 0 0.550781 -0.449219 1 -1 1 s -1 -0.449219 -1 -1 s 0.449219 -1 1 -1 s 1 0.449219 1 1 z m 0 0", "key": "zwvdmn" }], ["path", { "fill": "#ff7800", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.015625 -1.449219 0.355469 c -0.738281 0.371093 -1.550781 1.3125 -1.550781 2.644531 v 8 s -0.015625 0.710938 0.355469 1.449219 c 0.371093 0.738281 1.3125 1.550781 2.644531 1.550781 h 6 s 0.707031 0.015625 1.449219 -0.355469 c 0.738281 -0.371093 1.550781 -1.3125 1.550781 -2.644531 v -8 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.367188 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 z m 4 4 c 0.554688 0 1 0.445312 1 1 v 8 c 0 0.554688 -0.445312 1 -1 1 h -6 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 z m 0 0", "key": "1n5vkh" }], ["path", { "fill": "#ff7800", "d": "m 7 5 v 4 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -4 z m 0 0", "key": "p5jrgq" }]], "aliases": ["battery-caution-symbolic"], "gtkIconName": "battery-caution-symbolic", "monochrome": false };
__iconData$8j.node;
const BatteryCaution = createAdwaitaIcon(__iconData$8j);

const __iconData$8i = { "name": "battery-empty-charging", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.015625 -1.445312 0.355469 c -0.742188 0.371093 -1.554688 1.3125 -1.554688 2.644531 v 8 s -0.015625 0.707031 0.355469 1.449219 c 0.371093 0.738281 1.3125 1.550781 2.644531 1.550781 h 5 v -2 h -5 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 h 6 c 0.554688 0 1 0.445312 1 1 v 2 h 2 v -2 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 z m 6 8 v 0.007812 c -0.265625 -0.003906 -0.519531 0.101563 -0.707031 0.285157 l -3 3 c -0.1875 0.1875 -0.292969 0.441406 -0.292969 0.707031 v 1 h 3.132812 l -0.964843 1.445312 c -0.105469 0.164063 -0.164063 0.359376 -0.160157 0.554688 h -0.007812 v 1 h 1 v -0.003906 c 0.265625 0 0.519531 -0.101563 0.707031 -0.289063 l 3 -3 c 0.1875 -0.1875 0.289063 -0.441406 0.289063 -0.707031 h 0.003906 v -1 h -3.128906 l 0.960937 -1.445312 c 0.109375 -0.164063 0.167969 -0.359376 0.167969 -0.554688 v -1 z m 0 0", "key": "1y9zj4" }]], "aliases": ["battery-empty-charging-symbolic"], "gtkIconName": "battery-empty-charging-symbolic" };
__iconData$8i.node;
const BatteryEmptyCharging = createAdwaitaIcon(__iconData$8i);

const __iconData$8h = { "name": "battery-empty", "size": 16, "node": [["path", { "fill": "#ed333b", "d": "m 6 1 v 1 h -1 s -0.707031 -0.015625 -1.449219 0.355469 c -0.738281 0.371093 -1.550781 1.3125 -1.550781 2.644531 v 8 s -0.015625 0.707031 0.355469 1.449219 c 0.371093 0.738281 1.3125 1.550781 2.644531 1.550781 h 2 v -2 h -2 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 h 6 c 0.554688 0 1 0.445312 1 1 v 2 h 2 v -2 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 h -2 s -1 0 -1 1 z m 3.5 7 c -0.832031 0 -1.5 0.667969 -1.5 1.5 v 5 c 0 0.832031 0.667969 1.5 1.5 1.5 h 5 c 0.832031 0 1.5 -0.667969 1.5 -1.5 v -5 c 0 -0.832031 -0.667969 -1.5 -1.5 -1.5 z m 1.5 1 h 2 v 2.5 s 0 0.5 -0.5 0.5 h -1 c -0.5 0 -0.5 -0.5 -0.5 -0.5 z m 0.5 4 h 1 c 0.277344 0 0.5 0.222656 0.5 0.5 v 1 c 0 0.277344 -0.222656 0.5 -0.5 0.5 h -1 c -0.277344 0 -0.5 -0.222656 -0.5 -0.5 v -1 c 0 -0.277344 0.222656 -0.5 0.5 -0.5 z m 0 0", "key": "111uh6" }]], "aliases": ["battery-empty-symbolic"], "gtkIconName": "battery-empty-symbolic", "monochrome": false };
__iconData$8h.node;
const BatteryEmpty = createAdwaitaIcon(__iconData$8h);

const __iconData$8g = { "name": "battery-full-charged", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": ".34999999", "d": "M7 0C6 0 6 1 6 1v1H5s-.707-.016-1.45.355C2.814 2.727 2 3.668 2 5v8s-.016.707.355 1.445C2.727 15.187 3.668 16 5 16h6s.707.016 1.45-.355C13.187 15.273 14 14.332 14 13V5c0-1.332-.813-2.273-1.55-2.645C11.706 1.985 11 2 11 2h-1V1c0-1-1-1-1-1Zm4 4c.555 0 1 .445 1 1v8c0 .555-.445 1-1 1H5c-.555 0-1-.445-1-1V5c0-.555.445-1 1-1Z", "key": "1k0se9" }], ["path", { "fill": "currentColor", "d": "M9 4.992V5a.992.992 0 0 0-.707.285l-3 3A1 1 0 0 0 5 8.992v1L7.63 10l-1.462 1.445a.998.998 0 0 0-.16.555H6v1h1v-.004c.266 0 .52-.101.707-.289l3-3a.996.996 0 0 0 .29-.707H11V8H8.37l1.462-1.453c.11-.164.168-.36.168-.555v-1z", "key": "guhcbc" }]], "aliases": ["battery-full-charged-symbolic"], "gtkIconName": "battery-full-charged-symbolic" };
__iconData$8g.node;
const BatteryFullCharged = createAdwaitaIcon(__iconData$8g);

const __iconData$8f = { "name": "battery-full-charging", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.015625 -1.449219 0.355469 c -0.738281 0.371093 -1.550781 1.3125 -1.550781 2.644531 v 8 s -0.015625 0.707031 0.355469 1.445312 c 0.371093 0.742188 1.3125 1.554688 2.644531 1.554688 h 5 v -2 h -5 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 h 6 c 0.554688 0 1 0.445312 1 1 v 2 h 2 v -2 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 z m -2 5 v 8 h 3 v -1 c 0 -0.53125 0.210938 -1.039062 0.585938 -1.414062 l 2.414062 -2.414063 v -3.171875 z m 0 0", "key": "69c9sk" }], ["path", { "fill": "currentColor", "d": "m 13 8 v 0.007812 c -0.265625 -0.003906 -0.519531 0.101563 -0.707031 0.285157 l -3 3 c -0.1875 0.1875 -0.292969 0.441406 -0.292969 0.707031 v 1 h 3.132812 l -0.964843 1.445312 c -0.109375 0.164063 -0.164063 0.359376 -0.160157 0.554688 h -0.007812 v 1 h 1 v -0.003906 c 0.265625 0 0.519531 -0.101563 0.707031 -0.289063 l 3 -3 c 0.1875 -0.1875 0.289063 -0.441406 0.289063 -0.707031 h 0.003906 v -1 h -3.132812 l 0.964843 -1.445312 c 0.109375 -0.164063 0.167969 -0.359376 0.167969 -0.554688 v -1 z m 0 0", "key": "ye73ex" }]], "aliases": ["battery-full-charging-symbolic"], "gtkIconName": "battery-full-charging-symbolic" };
__iconData$8f.node;
const BatteryFullCharging = createAdwaitaIcon(__iconData$8f);

const __iconData$8e = { "name": "battery-full", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.015625 -1.449219 0.355469 c -0.738281 0.371093 -1.550781 1.3125 -1.550781 2.644531 v 8 s -0.015625 0.707031 0.355469 1.445312 c 0.371093 0.742188 1.3125 1.554688 2.644531 1.554688 h 6 s 0.707031 0.015625 1.449219 -0.355469 c 0.738281 -0.371093 1.550781 -1.3125 1.550781 -2.644531 v -8 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 z m 4 4 c 0.554688 0 1 0.445312 1 1 v 8 c 0 0.554688 -0.445312 1 -1 1 h -6 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 z m -6 1 v 8 h 6 v -8 z m 0 0", "key": "31t9q" }]], "aliases": ["battery-full-symbolic"], "gtkIconName": "battery-full-symbolic" };
__iconData$8e.node;
const BatteryFull = createAdwaitaIcon(__iconData$8e);

const __iconData$8d = { "name": "battery-good-charging", "size": 16, "node": [["path", { "fill": "#33d17a", "d": "m 5 8 v 5 h 3 v -1 c 0 -0.53125 0.210938 -1.039062 0.585938 -1.414062 l 2.414062 -2.414063 v -0.171875 z m 0 0", "key": "fzq42m" }], ["path", { "fill": "currentColor", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.015625 -1.445312 0.355469 c -0.742188 0.371093 -1.554688 1.3125 -1.554688 2.644531 v 8 s -0.015625 0.707031 0.355469 1.449219 c 0.371093 0.738281 1.3125 1.550781 2.644531 1.550781 h 5 v -2 h -5 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 h 6 c 0.554688 0 1 0.445312 1 1 v 2 h 2 v -2 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 z m 6 8 v 0.007812 c -0.265625 -0.003906 -0.519531 0.101563 -0.707031 0.285157 l -3 3 c -0.1875 0.1875 -0.292969 0.441406 -0.292969 0.707031 v 1 h 3.132812 l -0.964843 1.445312 c -0.105469 0.164063 -0.164063 0.359376 -0.160157 0.554688 h -0.007812 v 1 h 1 v -0.003906 c 0.265625 0 0.519531 -0.101563 0.707031 -0.289063 l 3 -3 c 0.1875 -0.1875 0.289063 -0.441406 0.289063 -0.707031 h 0.003906 v -1 h -3.128906 l 0.960937 -1.445312 c 0.109375 -0.164063 0.167969 -0.359376 0.167969 -0.554688 v -1 z m 0 0", "key": "1y9zj4" }]], "aliases": ["battery-good-charging-symbolic"], "gtkIconName": "battery-good-charging-symbolic", "monochrome": false };
__iconData$8d.node;
const BatteryGoodCharging = createAdwaitaIcon(__iconData$8d);

const __iconData$8c = { "name": "battery-good", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.015625 -1.445312 0.355469 c -0.742188 0.371093 -1.554688 1.3125 -1.554688 2.644531 v 8 s -0.015625 0.707031 0.355469 1.449219 c 0.371093 0.738281 1.3125 1.550781 2.644531 1.550781 h 6 s 0.707031 0.015625 1.449219 -0.355469 c 0.738281 -0.371093 1.550781 -1.3125 1.550781 -2.644531 v -8 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 z m 1 4 h 3 c 0.554688 0 1 0.445312 1 1 v 8 c 0 0.554688 -0.445312 1 -1 1 h -6 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 z m -3 3 v 6 h 6 v -6 z m 0 0", "key": "14uycd" }]], "aliases": ["battery-good-symbolic"], "gtkIconName": "battery-good-symbolic" };
__iconData$8c.node;
const BatteryGood = createAdwaitaIcon(__iconData$8c);

const __iconData$8b = { "name": "battery-level-0-charging", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.015625 -1.445312 0.355469 c -0.742188 0.371093 -1.554688 1.3125 -1.554688 2.644531 v 8 s -0.015625 0.707031 0.355469 1.449219 c 0.371093 0.738281 1.3125 1.550781 2.644531 1.550781 h 5 v -2 h -5 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 h 6 c 0.554688 0 1 0.445312 1 1 v 2 h 2 v -2 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 z m 6 8 v 0.007812 c -0.265625 -0.003906 -0.519531 0.101563 -0.707031 0.285157 l -3 3 c -0.1875 0.1875 -0.292969 0.441406 -0.292969 0.707031 v 1 h 3.132812 l -0.964843 1.445312 c -0.105469 0.164063 -0.164063 0.359376 -0.160157 0.554688 h -0.007812 v 1 h 1 v -0.003906 c 0.265625 0 0.519531 -0.101563 0.707031 -0.289063 l 3 -3 c 0.1875 -0.1875 0.289063 -0.441406 0.289063 -0.707031 h 0.003906 v -1 h -3.128906 l 0.960937 -1.445312 c 0.109375 -0.164063 0.167969 -0.359376 0.167969 -0.554688 v -1 z m 0 0", "key": "1y9zj4" }]], "aliases": ["battery-level-0-charging-symbolic"], "gtkIconName": "battery-level-0-charging-symbolic" };
__iconData$8b.node;
const BatteryLevel0Charging = createAdwaitaIcon(__iconData$8b);

const __iconData$8a = { "name": "battery-level-0-plugged-in", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "1", "d": "m 689,180 c -1,0 -1,1 -1,1 v 1 h -1 c 0,0 -0.7086,-0.0137 -1.44727,0.35547 C 684.81407,182.72465 684,183.6664 684,185 v 8 c 0,0 -0.0138,0.70891 0.35547,1.44727 C 684.72479,195.18562 685.6668,196 687,196 h 6 v -1 c -0.67772,0 -1.42284,-0.46632 -1.69922,-1 H 687 c -0.554,0 -1,-0.446 -1,-1 v -8 c 0,-0.554 0.446,-1 1,-1 h 4 2 c 0.554,0 1,0.446 1,1 v 3 h 2 v -3 c 0,-1.3336 -0.81407,-2.27535 -1.55273,-2.64453 C 693.7086,181.98628 693,182 693,182 h -1 v -1 c 0,-1 -1,-1 -1,-1 z m 4.5,9 c -0.277,0 -0.5,0.223 -0.5,0.5 v 1.5 h -1 v 1.5 c 0,0.83099 0.66901,1.5 1.5,1.5 h 0.5 v 1 c 0,0.55398 0.44602,1 1,1 0.55398,0 1,-0.44602 1,-1 v -1 h 0.5 c 0.83099,0 1.5,-0.66901 1.5,-1.5 V 191 h -1 v -1.5 c 0,-0.277 -0.223,-0.5 -0.5,-0.5 -0.277,0 -0.5,0.223 -0.5,0.5 v 1.5 h -2 v -1.5 c 0,-0.277 -0.223,-0.5 -0.5,-0.5 z", "transform": "translate(-820,-180) translate(138)", "key": "13kjlh" }]], "aliases": ["battery-level-0-plugged-in-symbolic"], "gtkIconName": "battery-level-0-plugged-in-symbolic" };
__iconData$8a.node;
const BatteryLevel0PluggedIn = createAdwaitaIcon(__iconData$8a);

const __iconData$89 = { "name": "battery-level-0", "size": 16, "node": [["path", { "fill": "#ed333b", "d": "m 6 1 v 1 h -1 s -0.707031 -0.015625 -1.449219 0.355469 c -0.738281 0.371093 -1.550781 1.3125 -1.550781 2.644531 v 8 s -0.015625 0.707031 0.355469 1.449219 c 0.371093 0.738281 1.3125 1.550781 2.644531 1.550781 h 2 v -2 h -2 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 h 6 c 0.554688 0 1 0.445312 1 1 v 2 h 2 v -2 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 h -2 s -1 0 -1 1 z m 3.5 7 c -0.832031 0 -1.5 0.667969 -1.5 1.5 v 5 c 0 0.832031 0.667969 1.5 1.5 1.5 h 5 c 0.832031 0 1.5 -0.667969 1.5 -1.5 v -5 c 0 -0.832031 -0.667969 -1.5 -1.5 -1.5 z m 1.5 1 h 2 v 2.5 s 0 0.5 -0.5 0.5 h -1 c -0.5 0 -0.5 -0.5 -0.5 -0.5 z m 0.5 4 h 1 c 0.277344 0 0.5 0.222656 0.5 0.5 v 1 c 0 0.277344 -0.222656 0.5 -0.5 0.5 h -1 c -0.277344 0 -0.5 -0.222656 -0.5 -0.5 v -1 c 0 -0.277344 0.222656 -0.5 0.5 -0.5 z m 0 0", "key": "111uh6" }]], "aliases": ["battery-level-0-symbolic"], "gtkIconName": "battery-level-0-symbolic", "monochrome": false };
__iconData$89.node;
const BatteryLevel0 = createAdwaitaIcon(__iconData$89);

const __iconData$88 = { "name": "battery-level-10-charging", "size": 16, "node": [["path", { "fill": "#33d17a", "d": "m 5 12 v 1 h 3 v -1 z m 0 0", "key": "1rsyf1" }], ["path", { "fill": "currentColor", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.015625 -1.445312 0.355469 c -0.742188 0.371093 -1.554688 1.3125 -1.554688 2.644531 v 8 s -0.015625 0.707031 0.355469 1.449219 c 0.371093 0.738281 1.3125 1.550781 2.644531 1.550781 h 5 v -2 h -5 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 h 6 c 0.554688 0 1 0.445312 1 1 v 2 h 2 v -2 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 z m 6 8 v 0.007812 c -0.265625 -0.003906 -0.519531 0.101563 -0.707031 0.285157 l -3 3 c -0.1875 0.1875 -0.292969 0.441406 -0.292969 0.707031 v 1 h 3.132812 l -0.964843 1.445312 c -0.105469 0.164063 -0.164063 0.359376 -0.160157 0.554688 h -0.007812 v 1 h 1 v -0.003906 c 0.265625 0 0.519531 -0.101563 0.707031 -0.289063 l 3 -3 c 0.1875 -0.1875 0.289063 -0.441406 0.289063 -0.707031 h 0.003906 v -1 h -3.128906 l 0.960937 -1.445312 c 0.109375 -0.164063 0.167969 -0.359376 0.167969 -0.554688 v -1 z m 0 0", "key": "1y9zj4" }]], "aliases": ["battery-level-10-charging-symbolic"], "gtkIconName": "battery-level-10-charging-symbolic", "monochrome": false };
__iconData$88.node;
const BatteryLevel10Charging = createAdwaitaIcon(__iconData$88);

const __iconData$87 = { "name": "battery-level-10-plugged-in", "size": 16, "node": [["path", { "fill": "#33d17a", "fill-opacity": "1", "d": "m 687,192 v 1 l 4,2e-5 V 192 Z", "transform": "translate(-800,-180) translate(118)", "key": "wx8a60" }], ["path", { "fill": "currentColor", "fill-opacity": "1", "d": "m 689,180 c -1,0 -1,1 -1,1 v 1 h -1 c 0,0 -0.7086,-0.0137 -1.44727,0.35547 C 684.81407,182.72465 684,183.6664 684,185 v 8 c 0,0 -0.0138,0.70891 0.35547,1.44727 C 684.72479,195.18562 685.6668,196 687,196 h 6 v -1 c -0.67772,0 -1.42284,-0.46632 -1.69922,-1 H 687 c -0.554,0 -1,-0.446 -1,-1 v -8 c 0,-0.554 0.446,-1 1,-1 h 4 2 c 0.554,0 1,0.446 1,1 v 3 h 2 v -3 c 0,-1.3336 -0.81407,-2.27535 -1.55273,-2.64453 C 693.7086,181.98628 693,182 693,182 h -1 v -1 c 0,-1 -1,-1 -1,-1 z m 4.5,9 c -0.277,0 -0.5,0.223 -0.5,0.5 v 1.5 h -1 v 1.5 c 0,0.83099 0.66901,1.5 1.5,1.5 h 0.5 v 1 c 0,0.55398 0.44602,1 1,1 0.55398,0 1,-0.44602 1,-1 v -1 h 0.5 c 0.83099,0 1.5,-0.66901 1.5,-1.5 V 191 h -1 v -1.5 c 0,-0.277 -0.223,-0.5 -0.5,-0.5 -0.277,0 -0.5,0.223 -0.5,0.5 v 1.5 h -2 v -1.5 c 0,-0.277 -0.223,-0.5 -0.5,-0.5 z", "transform": "translate(-800,-180) translate(118)", "key": "zp5j0i" }]], "aliases": ["battery-level-10-plugged-in-symbolic"], "gtkIconName": "battery-level-10-plugged-in-symbolic", "monochrome": false };
__iconData$87.node;
const BatteryLevel10PluggedIn = createAdwaitaIcon(__iconData$87);

const __iconData$86 = { "name": "battery-level-10", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.015625 -1.449219 0.355469 c -0.738281 0.371093 -1.550781 1.3125 -1.550781 2.644531 v 8 s -0.015625 0.707031 0.355469 1.449219 c 0.371093 0.738281 1.3125 1.550781 2.644531 1.550781 h 2 v -2 h -2 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 h 6 c 0.554688 0 1 0.445312 1 1 v 2 h 2 v -2 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 z m 0 0", "key": "qhfuss" }], ["path", { "fill": "#ed333b", "d": "m 5 12 v 1 h 2 v -1 z m 0 0", "key": "qamr4b" }], ["path", { "fill": "#ff7800", "d": "m 9.5 8 c -0.832031 0 -1.5 0.667969 -1.5 1.5 v 5 c 0 0.832031 0.667969 1.5 1.5 1.5 h 5 c 0.832031 0 1.5 -0.667969 1.5 -1.5 v -5 c 0 -0.832031 -0.667969 -1.5 -1.5 -1.5 z m 1.5 1 h 2 v 2.5 s 0 0.5 -0.5 0.5 h -1 c -0.5 0 -0.5 -0.5 -0.5 -0.5 z m 0.5 4 h 1 c 0.277344 0 0.5 0.222656 0.5 0.5 v 1 c 0 0.277344 -0.222656 0.5 -0.5 0.5 h -1 c -0.277344 0 -0.5 -0.222656 -0.5 -0.5 v -1 c 0 -0.277344 0.222656 -0.5 0.5 -0.5 z m 0 0", "key": "3kuca" }]], "aliases": ["battery-level-10-symbolic"], "gtkIconName": "battery-level-10-symbolic", "monochrome": false };
__iconData$86.node;
const BatteryLevel10 = createAdwaitaIcon(__iconData$86);

const __iconData$85 = { "name": "battery-level-100-charged", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.015625 -1.449219 0.355469 c -0.738281 0.371093 -1.550781 1.3125 -1.550781 2.644531 v 8 s -0.015625 0.707031 0.355469 1.445312 c 0.371093 0.742188 1.3125 1.554688 2.644531 1.554688 h 5 v -2 h -5 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 h 6 c 0.554688 0 1 0.445312 1 1 v 2 h 2 v -2 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 z m -2 5 v 8 h 3 v -1 c 0 -0.53125 0.210938 -1.039062 0.585938 -1.414062 l 2.414062 -2.414063 v -3.171875 z m 0 0", "key": "69c9sk" }], ["path", { "fill": "currentColor", "d": "m 13 8 v 0.007812 c -0.265625 -0.003906 -0.519531 0.101563 -0.707031 0.285157 l -3 3 c -0.1875 0.1875 -0.292969 0.441406 -0.292969 0.707031 v 1 h 3.132812 l -0.964843 1.445312 c -0.109375 0.164063 -0.164063 0.359376 -0.160157 0.554688 h -0.007812 v 1 h 1 v -0.003906 c 0.265625 0 0.519531 -0.101563 0.707031 -0.289063 l 3 -3 c 0.1875 -0.1875 0.289063 -0.441406 0.289063 -0.707031 h 0.003906 v -1 h -3.132812 l 0.964843 -1.445312 c 0.109375 -0.164063 0.167969 -0.359376 0.167969 -0.554688 v -1 z m 0 0", "key": "ye73ex" }]], "aliases": ["battery-level-100-charged-symbolic"], "gtkIconName": "battery-level-100-charged-symbolic" };
__iconData$85.node;
const BatteryLevel100Charged = createAdwaitaIcon(__iconData$85);

const __iconData$84 = { "name": "battery-level-100-plugged-in", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "1", "d": "m 687,185 v 8 l 4,2e-5 V 190 h 1 v -0.99998 c 0,-0.46404 0.51336,-1 1,-1 V 185 Z", "transform": "translate(-620,-180) translate(-62)", "key": "1clfrh" }], ["path", { "fill": "currentColor", "fill-opacity": "1", "d": "m 689,180 c -1,0 -1,1 -1,1 v 1 h -1 c 0,0 -0.7086,-0.0137 -1.44727,0.35547 C 684.81407,182.72465 684,183.6664 684,185 v 8 c 0,0 -0.0138,0.70891 0.35547,1.44727 C 684.72479,195.18562 685.6668,196 687,196 h 6 v -1 c -0.67772,0 -1.42284,-0.46632 -1.69922,-1 H 687 c -0.554,0 -1,-0.446 -1,-1 v -8 c 0,-0.554 0.446,-1 1,-1 h 4 2 c 0.554,0 1,0.446 1,1 v 3 h 2 v -3 c 0,-1.3336 -0.81407,-2.27535 -1.55273,-2.64453 C 693.7086,181.98628 693,182 693,182 h -1 v -1 c 0,-1 -1,-1 -1,-1 z m 4.5,9 c -0.277,0 -0.5,0.223 -0.5,0.5 v 1.5 h -1 v 1.5 c 0,0.83099 0.66901,1.5 1.5,1.5 h 0.5 v 1 c 0,0.55398 0.44602,1 1,1 0.55398,0 1,-0.44602 1,-1 v -1 h 0.5 c 0.83099,0 1.4779,-0.66901 1.4779,-1.5 V 191 H 697 v -1.5 c 0,-0.277 -0.223,-0.5 -0.5,-0.5 -0.277,0 -0.5,0.223 -0.5,0.5 v 1.5 h -2 v -1.5 c 0,-0.277 -0.223,-0.5 -0.5,-0.5 z", "transform": "translate(-620,-180) translate(-62)", "key": "1srd66" }]], "aliases": ["battery-level-100-plugged-in-symbolic"], "gtkIconName": "battery-level-100-plugged-in-symbolic" };
__iconData$84.node;
const BatteryLevel100PluggedIn = createAdwaitaIcon(__iconData$84);

const __iconData$83 = { "name": "battery-level-100", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.015625 -1.449219 0.355469 c -0.738281 0.371093 -1.550781 1.3125 -1.550781 2.644531 v 8 s -0.015625 0.707031 0.355469 1.445312 c 0.371093 0.742188 1.3125 1.554688 2.644531 1.554688 h 6 s 0.707031 0.015625 1.449219 -0.355469 c 0.738281 -0.371093 1.550781 -1.3125 1.550781 -2.644531 v -8 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 z m 4 4 c 0.554688 0 1 0.445312 1 1 v 8 c 0 0.554688 -0.445312 1 -1 1 h -6 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 z m -6 1 v 8 h 6 v -8 z m 0 0", "key": "31t9q" }]], "aliases": ["battery-level-100-symbolic"], "gtkIconName": "battery-level-100-symbolic" };
__iconData$83.node;
const BatteryLevel100 = createAdwaitaIcon(__iconData$83);

const __iconData$82 = { "name": "battery-level-20-charging", "size": 16, "node": [["path", { "fill": "#33d17a", "d": "m 5 11 v 2 h 3 v -1 c 0 -0.355469 0.09375 -0.699219 0.269531 -1 z m 0 0", "key": "1adk32" }], ["path", { "fill": "currentColor", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.015625 -1.445312 0.355469 c -0.742188 0.371093 -1.554688 1.3125 -1.554688 2.644531 v 8 s -0.015625 0.707031 0.355469 1.449219 c 0.371093 0.738281 1.3125 1.550781 2.644531 1.550781 h 5 v -2 h -5 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 h 6 c 0.554688 0 1 0.445312 1 1 v 2 h 2 v -2 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 z m 6 8 v 0.007812 c -0.265625 -0.003906 -0.519531 0.101563 -0.707031 0.285157 l -3 3 c -0.1875 0.1875 -0.292969 0.441406 -0.292969 0.707031 v 1 h 3.132812 l -0.964843 1.445312 c -0.105469 0.164063 -0.164063 0.359376 -0.160157 0.554688 h -0.007812 v 1 h 1 v -0.003906 c 0.265625 0 0.519531 -0.101563 0.707031 -0.289063 l 3 -3 c 0.1875 -0.1875 0.289063 -0.441406 0.289063 -0.707031 h 0.003906 v -1 h -3.128906 l 0.960937 -1.445312 c 0.109375 -0.164063 0.167969 -0.359376 0.167969 -0.554688 v -1 z m 0 0", "key": "1y9zj4" }]], "aliases": ["battery-level-20-charging-symbolic"], "gtkIconName": "battery-level-20-charging-symbolic", "monochrome": false };
__iconData$82.node;
const BatteryLevel20Charging = createAdwaitaIcon(__iconData$82);

const __iconData$81 = { "name": "battery-level-20-plugged-in", "size": 16, "node": [["path", { "fill": "#33d17a", "fill-opacity": "1", "d": "m 687,191 v 2 l 4,2e-5 V 191 Z", "transform": "translate(-780,-180) translate(97.999994)", "key": "1vrnhb" }], ["path", { "fill": "currentColor", "fill-opacity": "1", "d": "m 689,180 c -1,0 -1,1 -1,1 v 1 h -1 c 0,0 -0.7086,-0.0137 -1.44727,0.35547 C 684.81407,182.72465 684,183.6664 684,185 v 8 c 0,0 -0.0138,0.70891 0.35547,1.44727 0.36932,0.73835 1.31134,1.55273 2.64454,1.55273 h 6 L 693,195 c -0.67772,0 -1.42284,-0.46632 -1.69922,-1 H 687 c -0.554,0 -1,-0.446 -1,-1 v -8 c 0,-0.554 0.446,-1 1,-1 h 4 2 c 0.554,0 1,0.446 1,1 v 3 h 2 v -3 c 0,-1.3336 -0.81407,-2.27535 -1.55273,-2.64453 C 693.7086,181.98628 693,182 693,182 h -1 v -1 c 0,-1 -1,-1 -1,-1 z m 4.5,9 c -0.277,0 -0.5,0.223 -0.5,0.5 v 1.5 h -1 v 1.5 c 0,0.83099 0.66901,1.5 1.5,1.5 h 0.5 v 1 c 0,0.55398 0.44603,1 1.00001,1 0.55398,0 0.99999,-0.44602 0.99999,-1 v -1 h 0.5 c 0.83099,0 1.5,-0.66901 1.5,-1.5 V 191 h -1 v -1.5 c 0,-0.277 -0.223,-0.5 -0.5,-0.5 -0.277,0 -0.5,0.223 -0.5,0.5 v 1.5 h -2 v -1.5 c 0,-0.277 -0.223,-0.5 -0.5,-0.5 z", "transform": "translate(-780,-180) translate(97.999994)", "key": "k2pkxv" }]], "aliases": ["battery-level-20-plugged-in-symbolic"], "gtkIconName": "battery-level-20-plugged-in-symbolic", "monochrome": false };
__iconData$81.node;
const BatteryLevel20PluggedIn = createAdwaitaIcon(__iconData$81);

const __iconData$80 = { "name": "battery-level-20", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.011719 -1.445312 0.355469 c -0.742188 0.371093 -1.554688 1.3125 -1.554688 2.644531 v 8 s -0.015625 0.707031 0.355469 1.449219 c 0.371093 0.738281 1.3125 1.550781 2.644531 1.550781 h 6 s 0.707031 0.015625 1.449219 -0.355469 c 0.738281 -0.371093 1.550781 -1.3125 1.550781 -2.644531 v -8 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 s 0 -1 -1 -1 z m 4 4 c 0.554688 0 1 0.445312 1 1 v 8 c 0 0.554688 -0.445312 1 -1 1 h -6 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 z m 0 0", "key": "dph8m2" }], ["path", { "fill": "#ff7800", "d": "m 5 11 v 2 h 6 v -2 z m 0 0", "key": "l0t843" }]], "aliases": ["battery-level-20-symbolic"], "gtkIconName": "battery-level-20-symbolic", "monochrome": false };
__iconData$80.node;
const BatteryLevel20 = createAdwaitaIcon(__iconData$80);

const __iconData$7$ = { "name": "battery-level-30-charging", "size": 16, "node": [["path", { "fill": "#33d17a", "d": "m 5 11 v 2 h 3 v -1 c 0 -0.355469 0.09375 -0.699219 0.269531 -1 z m 0 0", "key": "1adk32" }], ["path", { "fill": "currentColor", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.015625 -1.445312 0.355469 c -0.742188 0.371093 -1.554688 1.3125 -1.554688 2.644531 v 8 s -0.015625 0.707031 0.355469 1.449219 c 0.371093 0.738281 1.3125 1.550781 2.644531 1.550781 h 5 v -2 h -5 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 h 6 c 0.554688 0 1 0.445312 1 1 v 2 h 2 v -2 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 z m 6 8 v 0.007812 c -0.265625 -0.003906 -0.519531 0.101563 -0.707031 0.285157 l -3 3 c -0.1875 0.1875 -0.292969 0.441406 -0.292969 0.707031 v 1 h 3.132812 l -0.964843 1.445312 c -0.105469 0.164063 -0.164063 0.359376 -0.160157 0.554688 h -0.007812 v 1 h 1 v -0.003906 c 0.265625 0 0.519531 -0.101563 0.707031 -0.289063 l 3 -3 c 0.1875 -0.1875 0.289063 -0.441406 0.289063 -0.707031 h 0.003906 v -1 h -3.128906 l 0.960937 -1.445312 c 0.109375 -0.164063 0.167969 -0.359376 0.167969 -0.554688 v -1 z m 0 0", "key": "1y9zj4" }]], "aliases": ["battery-level-30-charging-symbolic"], "gtkIconName": "battery-level-30-charging-symbolic", "monochrome": false };
__iconData$7$.node;
const BatteryLevel30Charging = createAdwaitaIcon(__iconData$7$);

const __iconData$7_ = { "name": "battery-level-30-plugged-in", "size": 16, "node": [["path", { "fill": "#33d17a", "fill-opacity": "1", "d": "m 687,191 v 2 l 4,2e-5 V 191 Z", "transform": "translate(-760,-180) translate(77.999999)", "key": "1uzzgi" }], ["path", { "fill": "currentColor", "fill-opacity": "1", "d": "m 689,180 c -1,0 -1,1 -1,1 v 1 h -1 c 0,0 -0.7086,-0.0137 -1.44727,0.35547 C 684.81407,182.72465 684,183.6664 684,185 v 8 c 0,0 -0.0138,0.70891 0.35547,1.44727 C 684.72479,195.18562 685.6668,196 687,196 h 6 v -1 c -0.67772,0 -1.42284,-0.46632 -1.69922,-1 H 687 c -0.554,0 -1,-0.446 -1,-1 v -8 c 0,-0.554 0.446,-1 1,-1 h 4 2 c 0.554,0 1,0.446 1,1 v 3 h 2 v -3 c 0,-1.3336 -0.81407,-2.27535 -1.55273,-2.64453 C 693.7086,181.98628 693,182 693,182 h -1 v -1 c 0,-1 -1,-1 -1,-1 z m 4.5,9 c -0.277,0 -0.5,0.223 -0.5,0.5 v 1.5 h -1 v 1.5 c 0,0.83099 0.66901,1.5 1.5,1.5 h 0.5 v 1 c 0,0.55398 0.44602,1 1,1 0.55398,0 1,-0.44602 1,-1 v -1 h 0.5 c 0.83099,0 1.5,-0.66901 1.5,-1.5 V 191 h -1 v -1.5 c 0,-0.277 -0.223,-0.5 -0.5,-0.5 -0.277,0 -0.5,0.223 -0.5,0.5 v 1.5 h -2 v -1.5 c 0,-0.277 -0.223,-0.5 -0.5,-0.5 z", "transform": "translate(-760,-180) translate(77.999999)", "key": "13fdq1" }]], "aliases": ["battery-level-30-plugged-in-symbolic"], "gtkIconName": "battery-level-30-plugged-in-symbolic", "monochrome": false };
__iconData$7_.node;
const BatteryLevel30PluggedIn = createAdwaitaIcon(__iconData$7_);

const __iconData$7Z = { "name": "battery-level-30", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.015625 -1.445312 0.355469 c -0.742188 0.371093 -1.554688 1.3125 -1.554688 2.644531 v 8 s -0.015625 0.707031 0.355469 1.449219 c 0.371093 0.738281 1.3125 1.550781 2.644531 1.550781 h 6 s 0.707031 0.015625 1.449219 -0.355469 c 0.738281 -0.371093 1.550781 -1.3125 1.550781 -2.644531 v -8 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 z m 4 4 c 0.554688 0 1 0.445312 1 1 v 8 c 0 0.554688 -0.445312 1 -1 1 h -6 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 z m -6 7 v 2 h 6 v -2 z m 0 0", "key": "7w3mw8" }]], "aliases": ["battery-level-30-symbolic"], "gtkIconName": "battery-level-30-symbolic" };
__iconData$7Z.node;
const BatteryLevel30 = createAdwaitaIcon(__iconData$7Z);

const __iconData$7Y = { "name": "battery-level-40-charging", "size": 16, "node": [["path", { "fill": "#33d17a", "d": "m 5 10 v 3 h 3 v -1 c 0 -0.53125 0.210938 -1.039062 0.585938 -1.414062 l 0.585937 -0.585938 z m 0 0", "key": "1u5fct" }], ["path", { "fill": "currentColor", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.015625 -1.445312 0.355469 c -0.742188 0.371093 -1.554688 1.3125 -1.554688 2.644531 v 8 s -0.015625 0.707031 0.355469 1.449219 c 0.371093 0.738281 1.3125 1.550781 2.644531 1.550781 h 5 v -2 h -5 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 h 6 c 0.554688 0 1 0.445312 1 1 v 2 h 2 v -2 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 z m 6 8 v 0.007812 c -0.265625 -0.003906 -0.519531 0.101563 -0.707031 0.285157 l -3 3 c -0.1875 0.1875 -0.292969 0.441406 -0.292969 0.707031 v 1 h 3.132812 l -0.964843 1.445312 c -0.105469 0.164063 -0.164063 0.359376 -0.160157 0.554688 h -0.007812 v 1 h 1 v -0.003906 c 0.265625 0 0.519531 -0.101563 0.707031 -0.289063 l 3 -3 c 0.1875 -0.1875 0.289063 -0.441406 0.289063 -0.707031 h 0.003906 v -1 h -3.128906 l 0.960937 -1.445312 c 0.109375 -0.164063 0.167969 -0.359376 0.167969 -0.554688 v -1 z m 0 0", "key": "1y9zj4" }]], "aliases": ["battery-level-40-charging-symbolic"], "gtkIconName": "battery-level-40-charging-symbolic", "monochrome": false };
__iconData$7Y.node;
const BatteryLevel40Charging = createAdwaitaIcon(__iconData$7Y);

const __iconData$7X = { "name": "battery-level-40-plugged-in", "size": 16, "node": [["path", { "fill": "#33d17a", "fill-opacity": "1", "d": "m 687,190 v 3 l 4,2e-5 V 190 Z", "transform": "translate(-740,-180) translate(57.999997)", "key": "1pqwkz" }], ["path", { "fill": "currentColor", "fill-opacity": "1", "d": "m 689,180 c -1,0 -1,1 -1,1 v 1 h -1 c 0,0 -0.7086,-0.0137 -1.44727,0.35547 C 684.81407,182.72465 684,183.6664 684,185 v 8 c 0,0 -0.0138,0.70891 0.35547,1.44727 C 684.72479,195.18562 685.6668,196 687,196 h 6 v -1 c -0.67772,0 -1.42284,-0.46632 -1.69922,-1 H 687 c -0.554,0 -1,-0.446 -1,-1 v -8 c 0,-0.554 0.446,-1 1,-1 h 4 2 c 0.554,0 1,0.446 1,1 v 3 h 2 v -3 c 0,-1.3336 -0.81407,-2.27535 -1.55273,-2.64453 C 693.7086,181.98628 693,182 693,182 h -1 v -1 c 0,-1 -1,-1 -1,-1 z m 4.5,9 c -0.277,0 -0.5,0.223 -0.5,0.5 v 1.5 h -1 v 1.5 c 0,0.83099 0.66901,1.5 1.5,1.5 h 0.5 v 1 c 0,0.55398 0.44602,1 1,1 0.55398,0 1,-0.44602 1,-1 v -1 h 0.5 c 0.83099,0 1.5,-0.66901 1.5,-1.5 V 191 h -1 v -1.5 c 0,-0.277 -0.223,-0.5 -0.5,-0.5 -0.277,0 -0.5,0.223 -0.5,0.5 v 1.5 h -2 v -1.5 c 0,-0.277 -0.223,-0.5 -0.5,-0.5 z", "transform": "translate(-740,-180) translate(57.999997)", "key": "1hv8ni" }]], "aliases": ["battery-level-40-plugged-in-symbolic"], "gtkIconName": "battery-level-40-plugged-in-symbolic", "monochrome": false };
__iconData$7X.node;
const BatteryLevel40PluggedIn = createAdwaitaIcon(__iconData$7X);

const __iconData$7W = { "name": "battery-level-40", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1.007812 s -0.710938 -0.015625 -1.449219 0.355469 c -0.738281 0.371093 -1.550781 1.3125 -1.550781 2.644531 v 8 s -0.015626 0.707031 0.355468 1.449219 c 0.367188 0.738281 1.308594 1.550781 2.644532 1.550781 h 6 s 0.707031 0.015625 1.445312 -0.355469 c 0.738281 -0.371093 1.554688 -1.3125 1.554688 -2.644531 v -8 c 0 -1.332031 -0.816407 -2.273438 -1.554688 -2.644531 c -0.738281 -0.371094 -1.445312 -0.355469 -1.445312 -0.355469 h -0.992188 l -0.011719 -1 c -0.007812 -1 -1 -1 -1 -1 z m 3.992188 4 c 0.550781 0 1 0.445312 1 1 v 8 c 0 0.554688 -0.449219 1 -1 1 h -6 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 z m -5.992188 6 v 3 h 6 v -3 z m 0 0", "key": "1cje2o" }]], "aliases": ["battery-level-40-symbolic"], "gtkIconName": "battery-level-40-symbolic" };
__iconData$7W.node;
const BatteryLevel40 = createAdwaitaIcon(__iconData$7W);

const __iconData$7V = { "name": "battery-level-50-charging", "size": 16, "node": [["path", { "fill": "#33d17a", "d": "m 5 9 v 4 h 3 v -1 c 0 -0.53125 0.210938 -1.039062 0.585938 -1.414062 l 1.585937 -1.585938 z m 0 0", "key": "12kwnl" }], ["path", { "fill": "currentColor", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.015625 -1.445312 0.355469 c -0.742188 0.371093 -1.554688 1.3125 -1.554688 2.644531 v 8 s -0.015625 0.707031 0.355469 1.449219 c 0.371093 0.738281 1.3125 1.550781 2.644531 1.550781 h 5 v -2 h -5 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 h 6 c 0.554688 0 1 0.445312 1 1 v 2 h 2 v -2 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 z m 6 8 v 0.007812 c -0.265625 -0.003906 -0.519531 0.101563 -0.707031 0.285157 l -3 3 c -0.1875 0.1875 -0.292969 0.441406 -0.292969 0.707031 v 1 h 3.132812 l -0.964843 1.445312 c -0.105469 0.164063 -0.164063 0.359376 -0.160157 0.554688 h -0.007812 v 1 h 1 v -0.003906 c 0.265625 0 0.519531 -0.101563 0.707031 -0.289063 l 3 -3 c 0.1875 -0.1875 0.289063 -0.441406 0.289063 -0.707031 h 0.003906 v -1 h -3.128906 l 0.960937 -1.445312 c 0.109375 -0.164063 0.167969 -0.359376 0.167969 -0.554688 v -1 z m 0 0", "key": "1y9zj4" }]], "aliases": ["battery-level-50-charging-symbolic"], "gtkIconName": "battery-level-50-charging-symbolic", "monochrome": false };
__iconData$7V.node;
const BatteryLevel50Charging = createAdwaitaIcon(__iconData$7V);

const __iconData$7U = { "name": "battery-level-50-plugged-in", "size": 16, "node": [["path", { "fill": "#33d17a", "fill-opacity": "1", "d": "m 687,189 v 4 l 4,2e-5 V 190 h 1 v -0.99998 z", "transform": "translate(-720,-180) translate(37.999999)", "key": "1iw29e" }], ["path", { "fill": "currentColor", "fill-opacity": "1", "d": "m 689,180 c -1,0 -1,1 -1,1 v 1 h -1 c 0,0 -0.7086,-0.0137 -1.44727,0.35547 C 684.81407,182.72465 684,183.6664 684,185 v 8 c 0,0 -0.0138,0.70891 0.35547,1.44727 C 684.72479,195.18562 685.6668,196 687,196 h 6 v -1 c -0.67772,0 -1.42284,-0.46632 -1.69922,-1 H 687 c -0.554,0 -1,-0.446 -1,-1 v -8 c 0,-0.554 0.446,-1 1,-1 h 4 2 c 0.554,0 1,0.446 1,1 v 3 h 2 v -3 c 0,-1.3336 -0.81407,-2.27535 -1.55273,-2.64453 C 693.7086,181.98628 693,182 693,182 h -1 v -1 c 0,-1 -1,-1 -1,-1 z m 4.5,9 c -0.277,0 -0.5,0.223 -0.5,0.5 v 1.5 h -1 v 1.5 c 0,0.83099 0.66901,1.5 1.5,1.5 h 0.5 v 1 c 0,0.55398 0.44602,1 1,1 0.55398,0 1,-0.44602 1,-1 v -1 h 0.5 c 0.83099,0 1.5,-0.66901 1.5,-1.5 V 191 h -1 v -1.5 c 0,-0.277 -0.223,-0.5 -0.5,-0.5 -0.277,0 -0.5,0.223 -0.5,0.5 v 1.5 h -2 v -1.5 c 0,-0.277 -0.223,-0.5 -0.5,-0.5 z", "transform": "translate(-720,-180) translate(37.999999)", "key": "1vnbqn" }]], "aliases": ["battery-level-50-plugged-in-symbolic"], "gtkIconName": "battery-level-50-plugged-in-symbolic", "monochrome": false };
__iconData$7U.node;
const BatteryLevel50PluggedIn = createAdwaitaIcon(__iconData$7U);

const __iconData$7T = { "name": "battery-level-50", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.015625 -1.445312 0.355469 c -0.742188 0.371093 -1.554688 1.3125 -1.554688 2.644531 v 8 s -0.015625 0.707031 0.355469 1.449219 c 0.371093 0.738281 1.3125 1.550781 2.644531 1.550781 h 6 s 0.707031 0.015625 1.449219 -0.355469 c 0.738281 -0.371093 1.550781 -1.3125 1.550781 -2.644531 v -8 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 z m 4 4 c 0.554688 0 1 0.445312 1 1 v 8 c 0 0.554688 -0.445312 1 -1 1 h -6 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 z m -6 5 v 4 h 6 v -4 z m 0 0", "key": "1e1pkv" }]], "aliases": ["battery-level-50-symbolic"], "gtkIconName": "battery-level-50-symbolic" };
__iconData$7T.node;
const BatteryLevel50 = createAdwaitaIcon(__iconData$7T);

const __iconData$7S = { "name": "battery-level-60-charging", "size": 16, "node": [["path", { "fill": "#33d17a", "d": "m 5 9 v 4 h 3 v -1 c 0 -0.53125 0.210938 -1.039062 0.585938 -1.414062 l 1.585937 -1.585938 z m 0 0", "key": "12kwnl" }], ["path", { "fill": "currentColor", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.015625 -1.445312 0.355469 c -0.742188 0.371093 -1.554688 1.3125 -1.554688 2.644531 v 8 s -0.015625 0.707031 0.355469 1.449219 c 0.371093 0.738281 1.3125 1.550781 2.644531 1.550781 h 5 v -2 h -5 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 h 6 c 0.554688 0 1 0.445312 1 1 v 2 h 2 v -2 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 z m 6 8 v 0.007812 c -0.265625 -0.003906 -0.519531 0.101563 -0.707031 0.285157 l -3 3 c -0.1875 0.1875 -0.292969 0.441406 -0.292969 0.707031 v 1 h 3.132812 l -0.964843 1.445312 c -0.105469 0.164063 -0.164063 0.359376 -0.160157 0.554688 h -0.007812 v 1 h 1 v -0.003906 c 0.265625 0 0.519531 -0.101563 0.707031 -0.289063 l 3 -3 c 0.1875 -0.1875 0.289063 -0.441406 0.289063 -0.707031 h 0.003906 v -1 h -3.128906 l 0.960937 -1.445312 c 0.109375 -0.164063 0.167969 -0.359376 0.167969 -0.554688 v -1 z m 0 0", "key": "1y9zj4" }]], "aliases": ["battery-level-60-charging-symbolic"], "gtkIconName": "battery-level-60-charging-symbolic", "monochrome": false };
__iconData$7S.node;
const BatteryLevel60Charging = createAdwaitaIcon(__iconData$7S);

const __iconData$7R = { "name": "battery-level-60-plugged-in", "size": 16, "node": [["path", { "fill": "#33d17a", "fill-opacity": "1", "d": "m 687,189 v 4 l 4,2e-5 V 190 h 1 v -0.99998 z", "transform": "translate(-700,-180) translate(17.999997)", "key": "1mk1yb" }], ["path", { "fill": "currentColor", "fill-opacity": "1", "d": "m 689,180 c -1,0 -1,1 -1,1 v 1 h -1 c 0,0 -0.7086,-0.0137 -1.44727,0.35547 C 684.81407,182.72465 684,183.6664 684,185 v 8 c 0,0 -0.0138,0.70891 0.35547,1.44727 C 684.72479,195.18562 685.6668,196 687,196 h 6 v -1 c -0.67772,0 -1.42284,-0.46632 -1.69922,-1 H 687 c -0.554,0 -1,-0.446 -1,-1 v -8 c 0,-0.554 0.446,-1 1,-1 h 4 2 c 0.554,0 1,0.446 1,1 v 3 h 2 v -3 c 0,-1.3336 -0.81407,-2.27535 -1.55273,-2.64453 C 693.7086,181.98628 693,182 693,182 h -1 v -1 c 0,-1 -1,-1 -1,-1 z m 4.5,9 c -0.277,0 -0.5,0.223 -0.5,0.5 v 1.5 h -1 v 1.5 c 0,0.83099 0.66901,1.5 1.5,1.5 h 0.5 v 1 c 0,0.55398 0.44602,1 1,1 0.55398,0 1,-0.44602 1,-1 v -1 h 0.5 c 0.83099,0 1.5,-0.66901 1.5,-1.5 V 191 h -1 v -1.5 c 0,-0.277 -0.223,-0.5 -0.5,-0.5 -0.277,0 -0.5,0.223 -0.5,0.5 v 1.5 h -2 v -1.5 c 0,-0.277 -0.223,-0.5 -0.5,-0.5 z", "transform": "translate(-700,-180) translate(17.999997)", "key": "pnamxf" }]], "aliases": ["battery-level-60-plugged-in-symbolic"], "gtkIconName": "battery-level-60-plugged-in-symbolic", "monochrome": false };
__iconData$7R.node;
const BatteryLevel60PluggedIn = createAdwaitaIcon(__iconData$7R);

const __iconData$7Q = { "name": "battery-level-60", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.015625 -1.445312 0.355469 c -0.742188 0.371093 -1.554688 1.3125 -1.554688 2.644531 v 8 s -0.015625 0.707031 0.355469 1.449219 c 0.371093 0.738281 1.3125 1.550781 2.644531 1.550781 h 6 s 0.707031 0.015625 1.449219 -0.355469 c 0.738281 -0.371093 1.550781 -1.3125 1.550781 -2.644531 v -8 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 z m 4 4 c 0.554688 0 1 0.445312 1 1 v 8 c 0 0.554688 -0.445312 1 -1 1 h -6 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 z m -6 5 v 4 h 6 v -4 z m 0 0", "key": "1e1pkv" }]], "aliases": ["battery-level-60-symbolic"], "gtkIconName": "battery-level-60-symbolic" };
__iconData$7Q.node;
const BatteryLevel60 = createAdwaitaIcon(__iconData$7Q);

const __iconData$7P = { "name": "battery-level-70-charging", "size": 16, "node": [["path", { "fill": "#33d17a", "d": "m 5 8 v 5 h 3 v -1 c 0 -0.53125 0.210938 -1.039062 0.585938 -1.414062 l 2.414062 -2.414063 v -0.171875 z m 0 0", "key": "fzq42m" }], ["path", { "fill": "currentColor", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.015625 -1.445312 0.355469 c -0.742188 0.371093 -1.554688 1.3125 -1.554688 2.644531 v 8 s -0.015625 0.707031 0.355469 1.449219 c 0.371093 0.738281 1.3125 1.550781 2.644531 1.550781 h 5 v -2 h -5 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 h 6 c 0.554688 0 1 0.445312 1 1 v 2 h 2 v -2 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 z m 6 8 v 0.007812 c -0.265625 -0.003906 -0.519531 0.101563 -0.707031 0.285157 l -3 3 c -0.1875 0.1875 -0.292969 0.441406 -0.292969 0.707031 v 1 h 3.132812 l -0.964843 1.445312 c -0.105469 0.164063 -0.164063 0.359376 -0.160157 0.554688 h -0.007812 v 1 h 1 v -0.003906 c 0.265625 0 0.519531 -0.101563 0.707031 -0.289063 l 3 -3 c 0.1875 -0.1875 0.289063 -0.441406 0.289063 -0.707031 h 0.003906 v -1 h -3.128906 l 0.960937 -1.445312 c 0.109375 -0.164063 0.167969 -0.359376 0.167969 -0.554688 v -1 z m 0 0", "key": "1y9zj4" }]], "aliases": ["battery-level-70-charging-symbolic"], "gtkIconName": "battery-level-70-charging-symbolic", "monochrome": false };
__iconData$7P.node;
const BatteryLevel70Charging = createAdwaitaIcon(__iconData$7P);

const __iconData$7O = { "name": "battery-level-70-plugged-in", "size": 16, "node": [["path", { "fill": "#33d17a", "fill-opacity": "1", "d": "m 687,188 v 5 l 4,2e-5 V 190 h 1 v -0.99998 c 0,-0.50871 0.5,-1 1,-1 z", "transform": "translate(-680,-180) translate(-2.000003)", "key": "lcokq8" }], ["path", { "fill": "currentColor", "fill-opacity": "1", "d": "m 689,180 c -1,0 -1,1 -1,1 v 1 h -1 c 0,0 -0.7086,-0.0137 -1.44727,0.35547 C 684.81407,182.72465 684,183.6664 684,185 v 8 c 0,0 -0.0138,0.70891 0.35547,1.44727 C 684.72479,195.18562 685.6668,196 687,196 h 6 v -1 c -0.67772,0 -1.42284,-0.46632 -1.69922,-1 H 687 c -0.554,0 -1,-0.446 -1,-1 v -8 c 0,-0.554 0.446,-1 1,-1 h 4 2 c 0.554,0 1,0.446 1,1 v 3 h 2 v -3 c 0,-1.3336 -0.81407,-2.27535 -1.55273,-2.64453 C 693.7086,181.98628 693,182 693,182 h -1 v -1 c 0,-1 -1,-1 -1,-1 z m 4.5,9 c -0.277,0 -0.5,0.223 -0.5,0.5 v 1.5 h -1 v 1.5 c 0,0.83099 0.66901,1.5 1.5,1.5 h 0.5 v 1 c 0,0.55398 0.44602,1 1,1 0.55398,0 1,-0.44602 1,-1 v -1 h 0.5 c 0.83099,0 1.5,-0.66901 1.5,-1.5 V 191 h -1 v -1.5 c 0,-0.277 -0.223,-0.5 -0.5,-0.5 -0.277,0 -0.5,0.223 -0.5,0.5 v 1.5 h -2 v -1.5 c 0,-0.277 -0.223,-0.5 -0.5,-0.5 z", "transform": "translate(-680,-180) translate(-2.000003)", "key": "101b1w" }]], "aliases": ["battery-level-70-plugged-in-symbolic"], "gtkIconName": "battery-level-70-plugged-in-symbolic", "monochrome": false };
__iconData$7O.node;
const BatteryLevel70PluggedIn = createAdwaitaIcon(__iconData$7O);

const __iconData$7N = { "name": "battery-level-70", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.015625 -1.445312 0.355469 c -0.742188 0.371093 -1.554688 1.3125 -1.554688 2.644531 v 8 s -0.015625 0.707031 0.355469 1.449219 c 0.371093 0.738281 1.3125 1.550781 2.644531 1.550781 h 6 s 0.707031 0.015625 1.449219 -0.355469 c 0.738281 -0.371093 1.550781 -1.3125 1.550781 -2.644531 v -8 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 z m 1 4 h 3 c 0.554688 0 1 0.445312 1 1 v 8 c 0 0.554688 -0.445312 1 -1 1 h -6 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 z m -3 4 v 5 h 6 v -5 z m 0 0", "key": "161vh7" }]], "aliases": ["battery-level-70-symbolic"], "gtkIconName": "battery-level-70-symbolic" };
__iconData$7N.node;
const BatteryLevel70 = createAdwaitaIcon(__iconData$7N);

const __iconData$7M = { "name": "battery-level-80-charging", "size": 16, "node": [["path", { "fill": "#33d17a", "d": "m 5 7 v 6 h 3 v -1 c 0 -0.53125 0.210938 -1.039062 0.585938 -1.414062 l 2.414062 -2.414063 v -1.171875 z m 0 0", "key": "1ynijq" }], ["path", { "fill": "currentColor", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.015625 -1.445312 0.355469 c -0.742188 0.371093 -1.554688 1.3125 -1.554688 2.644531 v 8 s -0.015625 0.707031 0.355469 1.449219 c 0.371093 0.738281 1.3125 1.550781 2.644531 1.550781 h 5 v -2 h -5 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 h 6 c 0.554688 0 1 0.445312 1 1 v 2 h 2 v -2 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 z m 6 8 v 0.007812 c -0.265625 -0.003906 -0.519531 0.101563 -0.707031 0.285157 l -3 3 c -0.1875 0.1875 -0.292969 0.441406 -0.292969 0.707031 v 1 h 3.132812 l -0.964843 1.445312 c -0.105469 0.164063 -0.164063 0.359376 -0.160157 0.554688 h -0.007812 v 1 h 1 v -0.003906 c 0.265625 0 0.519531 -0.101563 0.707031 -0.289063 l 3 -3 c 0.1875 -0.1875 0.289063 -0.441406 0.289063 -0.707031 h 0.003906 v -1 h -3.128906 l 0.960937 -1.445312 c 0.109375 -0.164063 0.167969 -0.359376 0.167969 -0.554688 v -1 z m 0 0", "key": "1y9zj4" }]], "aliases": ["battery-level-80-charging-symbolic"], "gtkIconName": "battery-level-80-charging-symbolic", "monochrome": false };
__iconData$7M.node;
const BatteryLevel80Charging = createAdwaitaIcon(__iconData$7M);

const __iconData$7L = { "name": "battery-level-80-plugged-in", "size": 16, "node": [["path", { "fill": "#33d17a", "fill-opacity": "1", "d": "m 687,187 v 6 l 4,2e-5 V 190 h 1 v -0.99998 c 0,-0.48664 0.51186,-1 1,-1 V 187 Z", "transform": "translate(-660,-180) translate(-22.000002)", "key": "fgaaqs" }], ["path", { "fill": "currentColor", "fill-opacity": "1", "d": "m 689,180 c -1,0 -1,1 -1,1 v 1 h -1 c 0,0 -0.7086,-0.0137 -1.44727,0.35547 C 684.81407,182.72465 684,183.6664 684,185 v 8 c 0,0 -0.0138,0.70891 0.35547,1.44727 C 684.72479,195.18562 685.6668,196 687,196 h 6 v -1 c -0.67772,0 -1.42284,-0.46632 -1.69922,-1 H 687 c -0.554,0 -1,-0.446 -1,-1 v -8 c 0,-0.554 0.446,-1 1,-1 h 4 2 c 0.554,0 1,0.446 1,1 v 3 h 2 v -3 c 0,-1.3336 -0.81407,-2.27535 -1.55273,-2.64453 C 693.7086,181.98628 693,182 693,182 h -1 v -1 c 0,-1 -1,-1 -1,-1 z m 4.5,9 c -0.277,0 -0.5,0.223 -0.5,0.5 v 1.5 h -1 v 1.5 c 0,0.83099 0.66901,1.5 1.5,1.5 h 0.5 v 1 c 0,0.55398 0.44602,1 1,1 0.55398,0 1,-0.44602 1,-1 v -1 h 0.5 c 0.83099,0 1.5,-0.66901 1.5,-1.5 V 191 h -1 v -1.5 c 0,-0.277 -0.223,-0.5 -0.5,-0.5 -0.277,0 -0.5,0.223 -0.5,0.5 v 1.5 h -2 v -1.5 c 0,-0.277 -0.223,-0.5 -0.5,-0.5 z", "transform": "translate(-660,-180) translate(-22.000002)", "key": "1cu30m" }]], "aliases": ["battery-level-80-plugged-in-symbolic"], "gtkIconName": "battery-level-80-plugged-in-symbolic", "monochrome": false };
__iconData$7L.node;
const BatteryLevel80PluggedIn = createAdwaitaIcon(__iconData$7L);

const __iconData$7K = { "name": "battery-level-80", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.015625 -1.445312 0.355469 c -0.742188 0.371093 -1.554688 1.3125 -1.554688 2.644531 v 8 s -0.015625 0.707031 0.355469 1.449219 c 0.371093 0.738281 1.3125 1.550781 2.644531 1.550781 h 6 s 0.707031 0.015625 1.449219 -0.355469 c 0.738281 -0.371093 1.550781 -1.3125 1.550781 -2.644531 v -8 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 z m 1 4 h 3 c 0.554688 0 1 0.445312 1 1 v 8 c 0 0.554688 -0.445312 1 -1 1 h -6 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 z m -3 3 v 6 h 6 v -6 z m 0 0", "key": "14uycd" }]], "aliases": ["battery-level-80-symbolic"], "gtkIconName": "battery-level-80-symbolic" };
__iconData$7K.node;
const BatteryLevel80 = createAdwaitaIcon(__iconData$7K);

const __iconData$7J = { "name": "battery-level-90-charging", "size": 16, "node": [["path", { "fill": "#33d17a", "d": "m 5 6 v 7 h 3 v -1 c 0 -0.53125 0.210938 -1.039062 0.585938 -1.414062 l 2.414062 -2.414063 v -2.171875 z m 0 0", "key": "1liwbi" }], ["path", { "fill": "currentColor", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.015625 -1.449219 0.355469 c -0.738281 0.371093 -1.550781 1.3125 -1.550781 2.644531 v 8 s -0.015625 0.707031 0.355469 1.445312 c 0.371093 0.742188 1.3125 1.554688 2.644531 1.554688 h 5 v -2 h -5 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 h 6 c 0.554688 0 1 0.445312 1 1 v 2 h 2 v -2 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 z m 6 8 v 0.007812 c -0.265625 -0.003906 -0.519531 0.101563 -0.707031 0.285157 l -3 3 c -0.1875 0.1875 -0.292969 0.441406 -0.292969 0.707031 v 1 h 3.132812 l -0.964843 1.445312 c -0.109375 0.164063 -0.164063 0.359376 -0.160157 0.554688 h -0.007812 v 1 h 1 v -0.003906 c 0.265625 0 0.519531 -0.101563 0.707031 -0.289063 l 3 -3 c 0.1875 -0.1875 0.289063 -0.441406 0.289063 -0.707031 h 0.003906 v -1 h -3.132812 l 0.964843 -1.445312 c 0.109375 -0.164063 0.167969 -0.359376 0.167969 -0.554688 v -1 z m 0 0", "key": "q4xsy2" }]], "aliases": ["battery-level-90-charging-symbolic"], "gtkIconName": "battery-level-90-charging-symbolic", "monochrome": false };
__iconData$7J.node;
const BatteryLevel90Charging = createAdwaitaIcon(__iconData$7J);

const __iconData$7I = { "name": "battery-level-90-plugged-in", "size": 16, "node": [["path", { "fill": "#33d17a", "fill-opacity": "1", "d": "m 687,186 v 7 l 4,2e-5 V 190 h 1 v -0.99998 c 0,-0.46456 0.46967,-1 1,-1 V 186 Z", "transform": "translate(-640,-180) translate(-42.000002)", "key": "4h87h" }], ["path", { "fill": "currentColor", "fill-opacity": "1", "d": "m 689,180 c -1,0 -1,1 -1,1 v 1 h -1 c 0,0 -0.7086,-0.0137 -1.44727,0.35547 C 684.81407,182.72465 684,183.6664 684,185 v 8 c 0,0 -0.0138,0.70891 0.35547,1.44727 0.36932,0.73835 1.31133,1.52148 2.64453,1.52148 h 6 V 195 c -0.67772,0 -1.42284,-0.46632 -1.69922,-1 H 687 c -0.554,0 -1,-0.446 -1,-1 v -8 c 0,-0.554 0.446,-1 1,-1 h 4 2 c 0.554,0 1,0.446 1,1 v 3 h 2 v -3 c 0,-1.3336 -0.81407,-2.27535 -1.55273,-2.64453 C 693.7086,181.98628 693,182 693,182 h -1 v -1 c 0,-1 -1,-1 -1,-1 z m 4.5,9 c -0.277,0 -0.5,0.223 -0.5,0.5 v 1.5 h -1 v 1.5 c 0,0.83099 0.66901,1.5 1.5,1.5 h 0.5 v 1 c 0,0.55398 0.44602,0.96875 1,0.96875 0.55398,0 1,-0.41477 1,-0.96875 v -1 h 0.5 c 0.83099,0 1.5,-0.66901 1.5,-1.5 V 191 h -1 v -1.5 c 0,-0.277 -0.223,-0.5 -0.5,-0.5 -0.277,0 -0.5,0.223 -0.5,0.5 v 1.5 h -2 v -1.5 c 0,-0.277 -0.223,-0.5 -0.5,-0.5 z", "transform": "translate(-640,-180) translate(-42.000002)", "key": "nqhpr" }]], "aliases": ["battery-level-90-plugged-in-symbolic"], "gtkIconName": "battery-level-90-plugged-in-symbolic", "monochrome": false };
__iconData$7I.node;
const BatteryLevel90PluggedIn = createAdwaitaIcon(__iconData$7I);

const __iconData$7H = { "name": "battery-level-90", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.015625 -1.449219 0.355469 c -0.738281 0.371093 -1.550781 1.3125 -1.550781 2.644531 v 8 s -0.015625 0.707031 0.355469 1.445312 c 0.371093 0.742188 1.3125 1.554688 2.644531 1.554688 h 6 s 0.707031 0.015625 1.449219 -0.355469 c 0.738281 -0.371093 1.550781 -1.3125 1.550781 -2.644531 v -8 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 z m -2 4 h 6 c 0.554688 0 1 0.445312 1 1 v 8 c 0 0.554688 -0.445312 1 -1 1 h -6 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 z m 0 2 v 7 h 6 v -7 z m 0 0", "key": "c5dann" }]], "aliases": ["battery-level-90-symbolic"], "gtkIconName": "battery-level-90-symbolic" };
__iconData$7H.node;
const BatteryLevel90 = createAdwaitaIcon(__iconData$7H);

const __iconData$7G = { "name": "battery-low-charging", "size": 16, "node": [["path", { "fill": "#33d17a", "d": "m 5 11 v 2 h 3 v -1 c 0 -0.355469 0.09375 -0.699219 0.269531 -1 z m 0 0", "key": "1adk32" }], ["path", { "fill": "currentColor", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.015625 -1.445312 0.355469 c -0.742188 0.371093 -1.554688 1.3125 -1.554688 2.644531 v 8 s -0.015625 0.707031 0.355469 1.449219 c 0.371093 0.738281 1.3125 1.550781 2.644531 1.550781 h 5 v -2 h -5 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 h 6 c 0.554688 0 1 0.445312 1 1 v 2 h 2 v -2 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 z m 6 8 v 0.007812 c -0.265625 -0.003906 -0.519531 0.101563 -0.707031 0.285157 l -3 3 c -0.1875 0.1875 -0.292969 0.441406 -0.292969 0.707031 v 1 h 3.132812 l -0.964843 1.445312 c -0.105469 0.164063 -0.164063 0.359376 -0.160157 0.554688 h -0.007812 v 1 h 1 v -0.003906 c 0.265625 0 0.519531 -0.101563 0.707031 -0.289063 l 3 -3 c 0.1875 -0.1875 0.289063 -0.441406 0.289063 -0.707031 h 0.003906 v -1 h -3.128906 l 0.960937 -1.445312 c 0.109375 -0.164063 0.167969 -0.359376 0.167969 -0.554688 v -1 z m 0 0", "key": "1y9zj4" }]], "aliases": ["battery-low-charging-symbolic"], "gtkIconName": "battery-low-charging-symbolic", "monochrome": false };
__iconData$7G.node;
const BatteryLowCharging = createAdwaitaIcon(__iconData$7G);

const __iconData$7F = { "name": "battery-low", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.015625 -1.449219 0.355469 c -0.738281 0.371093 -1.550781 1.3125 -1.550781 2.644531 v 8 s -0.015625 0.710938 0.355469 1.449219 c 0.371093 0.738281 1.3125 1.550781 2.644531 1.550781 h 2.042969 c -0.8125 -0.511719 -1.5 -1.191406 -2.015625 -2 h -0.027344 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 h 6 c 0.117188 0 0.230469 0.019531 0.332031 0.058594 c 0.949219 0.121094 1.863281 0.453125 2.667969 0.96875 v -0.027344 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.738281 -0.367188 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 z m 0 0", "key": "169hzc" }], ["path", { "fill": "currentColor", "d": "m 10.5 5 c -3.027344 0 -5.5 2.472656 -5.5 5.5 c 0 3.023438 2.472656 5.5 5.5 5.5 c 3.023438 0 5.5 -2.476562 5.5 -5.5 c 0 -3.027344 -2.476562 -5.5 -5.5 -5.5 z m 0 2 c 1.945312 0 3.5 1.554688 3.5 3.5 s -1.554688 3.5 -3.5 3.5 s -3.5 -1.554688 -3.5 -3.5 s 1.554688 -3.5 3.5 -3.5 z m 0 0", "key": "nghrsw" }], ["path", { "fill": "currentColor", "d": "m 10.5 8.027344 c -0.132812 0 -0.261719 0.050781 -0.355469 0.144531 c -0.09375 0.097656 -0.148437 0.222656 -0.148437 0.355469 v 1.949218 v 0.011719 v 0.011719 c 0.003906 0.011719 0.003906 0.023438 0.003906 0.03125 c 0.015625 0.265625 0.234375 0.472656 0.5 0.46875 h 2 c 0.132812 0.003906 0.261719 -0.050781 0.355469 -0.144531 s 0.148437 -0.222657 0.144531 -0.355469 c 0.003906 -0.132812 -0.050781 -0.261719 -0.144531 -0.355469 s -0.222657 -0.148437 -0.355469 -0.148437 h -1.5 v -1.46875 c 0.003906 -0.132813 -0.050781 -0.257813 -0.144531 -0.355469 c -0.09375 -0.09375 -0.222657 -0.144531 -0.355469 -0.144531 z m 0 0", "key": "p4d21u" }]], "aliases": ["battery-low-symbolic"], "gtkIconName": "battery-low-symbolic" };
__iconData$7F.node;
const BatteryLow = createAdwaitaIcon(__iconData$7F);

const __iconData$7E = { "name": "battery-missing", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8.152344 4.007812 c -0.4375 -0.023437 -0.882813 0.046876 -1.300782 0.222657 c -1.117187 0.460937 -1.851562 1.558593 -1.851562 2.769531 h 2 c 0 -0.40625 0.242188 -0.765625 0.617188 -0.921875 s 0.800781 -0.074219 1.089843 0.214844 c 0.289063 0.289062 0.371094 0.714843 0.21875 1.089843 c -0.15625 0.378907 -0.519531 0.617188 -0.925781 0.617188 c -0.550781 0 -1 0.449219 -1 1 v 2 h 2 v -1.179688 c 0.785156 -0.277343 1.441406 -0.875 1.769531 -1.671874 c 0.464844 -1.117188 0.207031 -2.414063 -0.648437 -3.269532 c -0.535156 -0.535156 -1.242188 -0.835937 -1.96875 -0.871094 z m -0.152344 7.992188 c -0.550781 0 -1 0.449219 -1 1 c 0 0.554688 0.449219 1 1 1 s 1 -0.445312 1 -1 c 0 -0.550781 -0.449219 -1 -1 -1 z m 0 0", "key": "1gdxsg" }], ["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.015625 -1.449219 0.355469 c -0.738281 0.371093 -1.550781 1.3125 -1.550781 2.644531 v 8 s -0.015625 0.707031 0.355469 1.449219 c 0.371093 0.738281 1.3125 1.550781 2.644531 1.550781 h 6 s 0.707031 0.015625 1.449219 -0.355469 c 0.738281 -0.371093 1.550781 -1.3125 1.550781 -2.644531 v -8 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 z m 0 3 h 2 v 0.125 c 0.609375 0.160156 1.171875 0.457031 1.644531 0.875 h 0.355469 c 0.554688 0 1 0.445312 1 1 v 8 c 0 0.554688 -0.445312 1 -1 1 h -1.273438 c -0.355468 0.617188 -1.015624 0.996094 -1.726562 1 c -0.710938 -0.003906 -1.371094 -0.382812 -1.726562 -1 h -1.273438 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 h 0.355469 c 0.472656 -0.414062 1.035156 -0.710938 1.644531 -0.863281 z m 0 0", "key": "19jiu0" }]], "aliases": ["battery-missing-symbolic"], "gtkIconName": "battery-missing-symbolic" };
__iconData$7E.node;
const BatteryMissing = createAdwaitaIcon(__iconData$7E);

const __iconData$7D = { "name": "battery", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 0 c -1 0 -1 1 -1 1 v 1 h -1 s -0.707031 -0.015625 -1.449219 0.355469 c -0.738281 0.371093 -1.550781 1.3125 -1.550781 2.644531 v 8 s -0.015625 0.707031 0.355469 1.449219 c 0.371093 0.738281 1.3125 1.550781 2.644531 1.550781 h 6 s 0.707031 0.015625 1.449219 -0.355469 c 0.738281 -0.371093 1.550781 -1.3125 1.550781 -2.644531 v -8 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 h -1 v -1 c 0 -1 -1 -1 -1 -1 z m -2 4 h 6 c 0.554688 0 1 0.445312 1 1 v 8 c 0 0.554688 -0.445312 1 -1 1 h -6 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 z m 0 1 v 2 h 6 v -2 z m 0 3 v 2 h 6 v -2 z m 0 3 v 2 h 6 v -2 z m 0 0", "key": "19qfaz" }]], "aliases": ["battery-symbolic"], "gtkIconName": "battery-symbolic" };
__iconData$7D.node;
const Battery = createAdwaitaIcon(__iconData$7D);

const __iconData$7C = { "name": "bluetooth-acquiring", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 7.957031 0 c -0.128906 0.0078125 -0.253906 0.0390625 -0.371093 0.0898438 c -0.355469 0.1640622 -0.585938 0.5195312 -0.585938 0.9101562 v 4 h 2 v -1.796875 l 1.480469 1.296875 l -0.570313 0.5 h 2.953125 c 0.238281 -0.414062 0.152344 -0.9375 -0.207031 -1.25 l -4 -3.5 c -0.191406 -0.171875 -0.445312 -0.2578125 -0.699219 -0.25 z m -3.867187 4.007812 c -0.316406 -0.03125 -0.632813 0.09375 -0.839844 0.335938 c -0.15625 0.183594 -0.242188 0.414062 -0.238281 0.65625 h 2.507812 l -0.863281 -0.75 c -0.15625 -0.140625 -0.355469 -0.226562 -0.566406 -0.242188 z m -1.078125 6.992188 c -0.003907 0.242188 0.082031 0.472656 0.238281 0.65625 c 0.363281 0.417969 0.992188 0.457031 1.40625 0.09375 l 0.863281 -0.75 z m 3.988281 0 v 4 c 0 0.390625 0.230469 0.746094 0.585938 0.910156 c 0.359374 0.160156 0.777343 0.101563 1.070312 -0.160156 l 4 -3.5 c 0.359375 -0.3125 0.445312 -0.835938 0.207031 -1.25 h -2.953125 l 0.570313 0.5 l -1.480469 1.296875 v -1.796875 z m 0 0", "key": "1qeeer" }], ["path", { "fill": "currentColor", "d": "m 3 6 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 5 0 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 5 0 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 0 0", "key": "14xcmx" }]], "aliases": ["bluetooth-acquiring-symbolic"], "gtkIconName": "bluetooth-acquiring-symbolic" };
__iconData$7C.node;
const BluetoothAcquiring = createAdwaitaIcon(__iconData$7C);

const __iconData$7B = { "name": "bluetooth-active", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7.585938 0.0898438 c -0.355469 0.1640622 -0.585938 0.5195312 -0.585938 0.9101562 v 5.296875 l -2.34375 -2.046875 c -0.414062 -0.363281 -1.042969 -0.324219 -1.40625 0.089844 c -0.363281 0.417968 -0.324219 1.046875 0.09375 1.410156 l 2.566406 2.25 l -2.566406 2.25 c -0.417969 0.363281 -0.457031 0.992188 -0.09375 1.40625 c 0.363281 0.417969 0.992188 0.457031 1.40625 0.09375 l 2.34375 -2.046875 v 5.296875 c 0 0.390625 0.230469 0.746094 0.585938 0.910156 c 0.359374 0.160156 0.777343 0.101563 1.070312 -0.160156 l 4 -3.5 c 0.21875 -0.1875 0.34375 -0.460938 0.34375 -0.75 s -0.125 -0.5625 -0.34375 -0.75 l -3.140625 -2.75 l 3.140625 -2.75 c 0.21875 -0.1875 0.34375 -0.460938 0.34375 -0.75 s -0.125 -0.5625 -0.34375 -0.75 l -4 -3.5 c -0.292969 -0.2617188 -0.710938 -0.3242188 -1.070312 -0.1601562 z m 1.414062 3.1132812 l 1.484375 1.296875 l -1.484375 1.296875 z m 0 7 l 1.484375 1.296875 l -1.484375 1.296875 z m 0 0", "key": "1nmpmr" }]], "aliases": ["bluetooth-active-symbolic"], "gtkIconName": "bluetooth-active-symbolic" };
__iconData$7B.node;
const BluetoothActive = createAdwaitaIcon(__iconData$7B);

const __iconData$7A = { "name": "bluetooth-disabled", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7.957031 0 c -0.128906 0.0078125 -0.253906 0.0390625 -0.371093 0.0898438 c -0.355469 0.1640622 -0.585938 0.5195312 -0.585938 0.9101562 v 4.9375 l -5.46875 -5.46875 l -1.0625 1.0625 l 14 14 l 1.0625 -1.0625 l -2.605469 -2.605469 c 0.15625 -0.390625 0.046875 -0.835937 -0.269531 -1.113281 l -3.136719 -2.75 l 3.136719 -2.75 c 0.21875 -0.1875 0.34375 -0.460938 0.34375 -0.75 s -0.125 -0.5625 -0.34375 -0.75 l -4 -3.5 c -0.191406 -0.171875 -0.445312 -0.2578125 -0.699219 -0.25 z m 1.042969 3.203125 l 1.480469 1.296875 l -1.480469 1.296875 z m -3.609375 5.25 l -2.046875 1.796875 c -0.417969 0.363281 -0.457031 0.992188 -0.09375 1.40625 c 0.363281 0.417969 0.992188 0.457031 1.40625 0.09375 l 2.152344 -1.878906 z m 1.609375 1.609375 v 4.9375 c 0 0.390625 0.230469 0.746094 0.585938 0.910156 c 0.359374 0.160156 0.777343 0.101563 1.070312 -0.160156 l 2.152344 -1.878906 l -1.414063 -1.414063 l -0.394531 0.339844 v -0.734375 z m 0 0", "key": "7iexc7" }]], "aliases": ["bluetooth-disabled-symbolic"], "gtkIconName": "bluetooth-disabled-symbolic" };
__iconData$7A.node;
const BluetoothDisabled = createAdwaitaIcon(__iconData$7A);

const __iconData$7z = { "name": "bluetooth-disconnected", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 7.957031 0 c -0.128906 0.0078125 -0.253906 0.0390625 -0.371093 0.0898438 c -0.355469 0.1640622 -0.585938 0.5195312 -0.585938 0.9101562 v 5.296875 l -2.34375 -2.046875 c -0.414062 -0.363281 -1.042969 -0.324219 -1.40625 0.089844 c -0.363281 0.417968 -0.324219 1.046875 0.089844 1.410156 l 2.570312 2.25 l -2.570312 2.246094 c -0.414063 0.367187 -0.453125 0.996094 -0.089844 1.410156 c 0.363281 0.417969 0.992188 0.457031 1.40625 0.09375 l 2.34375 -2.046875 v 5.296875 c 0 0.390625 0.230469 0.746094 0.585938 0.910156 c 0.359374 0.160156 0.777343 0.101563 1.070312 -0.160156 l 0.386719 -0.335938 c -0.132813 -0.640624 0.046875 -1.335937 0.539062 -1.828124 l 0.417969 -0.417969 v -0.335938 l -0.417969 -0.417969 c -0.023437 -0.023437 -0.042969 -0.046874 -0.0625 -0.070312 l -0.519531 0.453125 v -2.59375 l 0.125 0.109375 c 0.09375 -0.265625 0.246094 -0.515625 0.457031 -0.726562 c 0.300781 -0.300782 0.691407 -0.496094 1.105469 -0.5625 l -1.167969 -1.023438 l 3.136719 -2.75 c 0.21875 -0.1875 0.34375 -0.460938 0.34375 -0.75 s -0.125 -0.5625 -0.34375 -0.75 l -4 -3.5 c -0.191406 -0.171875 -0.445312 -0.2578125 -0.699219 -0.25 z m 1.042969 3.203125 l 1.480469 1.296875 l -1.480469 1.296875 z m 0 0", "key": "1lj3e3" }], ["path", { "fill": "currentColor", "d": "m 11 10 c -0.265625 0 -0.519531 0.105469 -0.707031 0.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 l 1.292969 1.292969 l -1.292969 1.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 s 1.023437 0.390625 1.414062 0 l 1.292969 -1.292969 l 1.292969 1.292969 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 s 0.390625 -1.023437 0 -1.414062 l -1.292969 -1.292969 l 1.292969 -1.292969 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 s -0.519531 0.105469 -0.707031 0.292969 l -1.292969 1.292969 l -1.292969 -1.292969 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0 0", "key": "v9fe42" }]], "aliases": ["bluetooth-disconnected-symbolic"], "gtkIconName": "bluetooth-disconnected-symbolic" };
__iconData$7z.node;
const BluetoothDisconnected = createAdwaitaIcon(__iconData$7z);

const __iconData$7y = { "name": "bluetooth-hardware-disabled", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 7.957031 0 c -0.128906 0.0078125 -0.253906 0.0390625 -0.371093 0.0898438 c -0.355469 0.1640622 -0.585938 0.5195312 -0.585938 0.9101562 v 4 h 2 v -1.796875 l 1.480469 1.296875 l -0.570313 0.5 h 2.953125 c 0.238281 -0.414062 0.152344 -0.9375 -0.207031 -1.25 l -4 -3.5 c -0.191406 -0.171875 -0.445312 -0.2578125 -0.699219 -0.25 z m -3.867187 4.007812 c -0.316406 -0.03125 -0.632813 0.09375 -0.839844 0.335938 c -0.15625 0.183594 -0.242188 0.414062 -0.238281 0.65625 h 2.507812 l -0.863281 -0.75 c -0.15625 -0.140625 -0.355469 -0.226562 -0.566406 -0.242188 z m -1.078125 6.992188 c -0.003907 0.242188 0.082031 0.472656 0.238281 0.65625 c 0.363281 0.417969 0.992188 0.457031 1.40625 0.09375 l 0.863281 -0.75 z m 3.988281 0 v 4 c 0 0.390625 0.230469 0.746094 0.585938 0.910156 c 0.359374 0.160156 0.777343 0.101563 1.070312 -0.160156 l 4 -3.5 c 0.359375 -0.3125 0.445312 -0.835938 0.207031 -1.25 h -2.953125 l 0.570313 0.5 l -1.480469 1.296875 v -1.796875 z m 0 0", "key": "1qeeer" }], ["path", { "fill": "currentColor", "d": "m 0 6 h 16 v 4 h -16 z m 0 0", "key": "1286a1" }]], "aliases": ["bluetooth-hardware-disabled-symbolic"], "gtkIconName": "bluetooth-hardware-disabled-symbolic" };
__iconData$7y.node;
const BluetoothHardwareDisabled = createAdwaitaIcon(__iconData$7y);

const __iconData$7x = { "name": "bluetooth", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7.585938 0.0898438 c -0.355469 0.1640622 -0.585938 0.5195312 -0.585938 0.9101562 v 5.296875 l -2.34375 -2.046875 c -0.414062 -0.363281 -1.042969 -0.324219 -1.40625 0.089844 c -0.363281 0.417968 -0.324219 1.046875 0.09375 1.410156 l 2.566406 2.25 l -2.566406 2.25 c -0.417969 0.363281 -0.457031 0.992188 -0.09375 1.40625 c 0.363281 0.417969 0.992188 0.457031 1.40625 0.09375 l 2.34375 -2.046875 v 5.296875 c 0 0.390625 0.230469 0.746094 0.585938 0.910156 c 0.359374 0.160156 0.777343 0.101563 1.070312 -0.160156 l 4 -3.5 c 0.21875 -0.1875 0.34375 -0.460938 0.34375 -0.75 s -0.125 -0.5625 -0.34375 -0.75 l -3.140625 -2.75 l 3.140625 -2.75 c 0.21875 -0.1875 0.34375 -0.460938 0.34375 -0.75 s -0.125 -0.5625 -0.34375 -0.75 l -4 -3.5 c -0.292969 -0.2617188 -0.710938 -0.3242188 -1.070312 -0.1601562 z m 1.414062 3.1132812 l 1.484375 1.296875 l -1.484375 1.296875 z m 0 7 l 1.484375 1.296875 l -1.484375 1.296875 z m 0 0", "key": "1nmpmr" }]], "aliases": ["bluetooth-symbolic"], "gtkIconName": "bluetooth-symbolic" };
__iconData$7x.node;
const Bluetooth = createAdwaitaIcon(__iconData$7x);

const __iconData$7w = { "name": "bookmark-new", "size": 16, "node": [["path", { "fill": "currentColor", "fill-rule": "evenodd", "d": "m 3.523438 0 c -1.089844 0 -1.914063 0.679688 -2.230469 1.292969 c -0.3125 0.617187 -0.300781 1.207031 -0.300781 1.207031 v 12.117188 l 1.421874 -0.710938 c 0.011719 -0.003906 0.023438 -0.007812 0.03125 -0.011719 l 4 -2 c 0.496094 -0.246093 0.695313 -0.847656 0.449219 -1.339843 c -0.246093 -0.496094 -0.847656 -0.695313 -1.34375 -0.449219 l -1.550781 0.777343 v -0.003906 l -1.007812 0.503906 v -6.882812 s 0.003906 -0.015625 0.007812 -0.039062 v -1.460938 c 0 -0.554688 0.445312 -1 1 -1 h 4 c 0.554688 0 1 0.445312 1 1 v 3 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 c 0 -0.035156 0 -0.074219 -0.007812 -0.109375 v -3.390625 s 0.015624 -0.582031 -0.292969 -1.199219 c -0.304688 -0.613281 -1.121094 -1.300781 -2.207031 -1.300781 z m 0 0", "key": "1tpf0w" }], ["path", { "fill": "currentColor", "d": "m 11 8 v 3 h -3 v 2 h 3 v 3 h 2 v -3 h 3 v -2 h -3 v -3 z m 0 0", "key": "croqyq" }]], "aliases": ["bookmark-new-symbolic"], "gtkIconName": "bookmark-new-symbolic" };
__iconData$7w.node;
const BookmarkNew = createAdwaitaIcon(__iconData$7w);

const __iconData$7v = { "name": "bullet", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "1", "fill-rule": "nonzero", "stroke": "none", "stroke-width": "2.389", "d": "M388 342c-2.207 0-4 1.793-4 4s1.793 4 4 4c2.208 0 4-1.793 4-4s-1.792-4-4-4z", "transform": "translate(-381 -339)", "key": "h655jz" }]], "aliases": ["bullet-symbolic"], "gtkIconName": "bullet-symbolic" };
__iconData$7v.node;
const Bullet = createAdwaitaIcon(__iconData$7v);

const __iconData$7u = { "name": "call-incoming", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 5.003906 2 c 0.554688 0 1 0.445312 1 1 v 3 c 0 0.554688 -0.445312 1 -1 1 h -0.710937 c 0.671875 2.265625 2.445312 4.042969 4.710937 4.710938 v -0.710938 c 0 -0.554688 0.449219 -1 1 -1 h 3 c 0.554688 0 1 0.445312 1 1 v 1.5 c 0 1.378906 -1.117187 2.5 -2.5 2.5 h -0.5 c -5.503906 0 -10 -4.496094 -10 -10 v -0.5 c 0 -1.378906 1.121094 -2.5 2.5 -2.5 z m 0 0", "key": "7w6kab" }], ["path", { "fill": "currentColor", "d": "m 9 1 c -0.550781 0 -1 0.449219 -1 1 v 6 h 6 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 h -2.585938 l 4.292969 -4.292969 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 s -0.519531 0.105469 -0.707031 0.292969 l -4.292969 4.292969 v -2.585938 c 0 -0.550781 -0.449219 -1 -1 -1 z m 0 0", "key": "r78plv" }]], "aliases": ["call-incoming-symbolic"], "gtkIconName": "call-incoming-symbolic" };
__iconData$7u.node;
const CallIncoming = createAdwaitaIcon(__iconData$7u);

const __iconData$7t = { "name": "call-missed", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 12.980469 -0.0117188 c -0.039063 0.0039063 -0.074219 0.00781255 -0.113281 0.0117188 h -4.867188 v 0.832031 c -0.050781 0.292969 0.03125 0.59375 0.226562 0.820313 c 0.191407 0.222656 0.476563 0.351562 0.773438 0.347656 h 1.585938 l -2.585938 2.585938 l -2.292969 -2.292969 c -0.25 -0.261719 -0.625 -0.367188 -0.972656 -0.273438 c -0.351563 0.089844 -0.625 0.363281 -0.714844 0.714844 c -0.09375 0.347656 0.011719 0.722656 0.273438 0.972656 l 3 3 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 l 3.292969 -3.292969 v 1.585938 c -0.003906 0.296875 0.125 0.578125 0.347656 0.769531 c 0.222656 0.191407 0.519532 0.277344 0.808594 0.230469 h 0.84375 v -4.875 c 0.011719 -0.089844 0.011719 -0.183594 0 -0.273438 v -0.851562 h -0.855469 c -0.054687 -0.0078125 -0.109375 -0.0117188 -0.164062 -0.0117188 z m 0 0", "key": "oiibrt" }], ["path", { "fill": "#e01b24", "d": "m 14.242188 15.714844 c -0.386719 0.382812 -1.003907 0.382812 -1.386719 0 l -1.042969 -1.039063 l -1.039062 -1.042969 c -0.382813 -0.382812 -0.382813 -1 0 -1.386718 l 0.492187 -0.492188 c -2.035156 -1.109375 -4.496094 -1.109375 -6.53125 0 l 0.492187 0.492188 c 0.382813 0.386718 0.382813 1.003906 0 1.386718 l -1.039062 1.042969 l -1.042969 1.039063 c -0.382812 0.382812 -1 0.382812 -1.386719 0 l -1.039062 -1.039063 c -0.957031 -0.957031 -0.957031 -2.511719 0 -3.46875 l 0.347656 -0.347656 c 3.816406 -3.816406 10.050782 -3.816406 13.867188 0 l 0.347656 0.347656 c 0.957031 0.957031 0.957031 2.511719 0 3.46875 z m 0 0", "key": "1ce4u0" }]], "aliases": ["call-missed-symbolic"], "gtkIconName": "call-missed-symbolic", "monochrome": false };
__iconData$7t.node;
const CallMissed = createAdwaitaIcon(__iconData$7t);

const __iconData$7s = { "name": "call-outgoing", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 5.003906 2 c 0.554688 0 1 0.445312 1 1 v 3 c 0 0.554688 -0.445312 1 -1 1 h -0.710937 c 0.671875 2.265625 2.445312 4.042969 4.710937 4.710938 v -0.710938 c 0 -0.554688 0.449219 -1 1 -1 h 3 c 0.554688 0 1 0.445312 1 1 v 1.5 c 0 1.378906 -1.117187 2.5 -2.5 2.5 h -0.5 c -5.503906 0 -10 -4.496094 -10 -10 v -0.5 c 0 -1.378906 1.121094 -2.5 2.5 -2.5 z m 0 0", "key": "7w6kab" }], ["path", { "fill": "currentColor", "d": "m 15 7 c 0.550781 0 1 -0.449219 1 -1 v -6 h -6 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 h 2.585938 l -4.292969 4.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 c 0.1875 0.1875 0.441406 0.292969 0.707031 0.292969 s 0.519531 -0.105469 0.707031 -0.292969 l 4.292969 -4.292969 v 2.585938 c 0 0.550781 0.449219 1 1 1 z m 0 0", "key": "jz9bw8" }]], "aliases": ["call-outgoing-symbolic"], "gtkIconName": "call-outgoing-symbolic" };
__iconData$7s.node;
const CallOutgoing = createAdwaitaIcon(__iconData$7s);

const __iconData$7r = { "name": "call-start", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 10.996094 2 c -0.554688 0 -1 0.445312 -1 1 v 3 c 0 0.554688 0.445312 1 1 1 h 0.710937 c -0.671875 2.265625 -2.445312 4.042969 -4.710937 4.710938 v -0.710938 c 0 -0.554688 -0.449219 -1 -1 -1 h -3 c -0.554688 0 -1 0.445312 -1 1 v 1.5 c 0 1.378906 1.117187 2.5 2.5 2.5 h 0.5 c 5.503906 0 10 -4.496094 10 -10 v -0.5 c 0 -1.378906 -1.121094 -2.5 -2.5 -2.5 z m 0 0", "key": "b9uxfx" }]], "aliases": ["call-start-symbolic"], "gtkIconName": "call-start-symbolic" };
__iconData$7r.node;
const CallStart = createAdwaitaIcon(__iconData$7r);

const __iconData$7q = { "name": "call-stop", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 14.234375 11.714844 c -0.382813 0.382812 -1 0.382812 -1.386719 0 l -1.039062 -1.039063 l -1.039063 -1.042969 c -0.386719 -0.382812 -0.386719 -1 0 -1.386718 l 0.492188 -0.492188 c -2.035157 -1.109375 -4.5 -1.109375 -6.535157 0 l 0.492188 0.492188 c 0.386719 0.386718 0.386719 1.003906 0 1.386718 l -1.039062 1.042969 l -1.039063 1.039063 c -0.386719 0.382812 -1.003906 0.382812 -1.386719 0 l -1.042968 -1.039063 c -0.957032 -0.957031 -0.957032 -2.511719 0 -3.46875 l 0.347656 -0.347656 c 3.816406 -3.816406 10.054687 -3.816406 13.871094 0 l 0.347656 0.347656 c 0.957031 0.957031 0.957031 2.511719 0 3.46875 z m 0 0", "key": "c969vj" }]], "aliases": ["call-stop-symbolic"], "gtkIconName": "call-stop-symbolic" };
__iconData$7q.node;
const CallStop = createAdwaitaIcon(__iconData$7q);

const __iconData$7p = { "name": "camera-disabled", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 6.5 0 c -0.265625 0 -0.519531 0.105469 -0.707031 0.292969 l -1.707031 1.707031 h -1.023438 l -1.53125 -1.53125 l -1.0625 1.0625 l 14 14 l 1.0625 -1.0625 l -0.386719 -0.386719 c 0.527344 -0.539062 0.855469 -1.277343 0.855469 -2.082031 v -7 c 0 -1.644531 -1.355469 -3 -3 -3 h -1.085938 l -1.707031 -1.707031 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0.414062 2 h 2.171876 l 1.707031 1.707031 c 0.1875 0.1875 0.441406 0.292969 0.707031 0.292969 h 1.5 c 0.570312 0 1 0.429688 1 1 v 7 c 0 0.269531 -0.097656 0.503906 -0.257812 0.679688 l -2.4375 -2.4375 c 0.4375 -0.640626 0.695312 -1.414063 0.695312 -2.242188 c 0 -2.199219 -1.800781 -4 -4 -4 c -0.828125 0 -1.601562 0.257812 -2.242188 0.695312 l -0.808593 -0.808593 c 0.09375 -0.046875 0.183593 -0.105469 0.257812 -0.179688 z m -6.492187 1.484375 c -0.265625 0.445313 -0.421875 0.964844 -0.421875 1.515625 v 7 c 0 1.644531 1.355469 3 3 3 h 8.9375 l -2 -2 h -6.9375 c -0.570312 0 -1 -0.429688 -1 -1 v -6.9375 z m 7.578125 2.515625 c 1.117188 0 2 0.882812 2 2 c 0 0.277344 -0.058594 0.539062 -0.15625 0.78125 l -2.625 -2.625 c 0.242188 -0.097656 0.503906 -0.15625 0.78125 -0.15625 z m -3.90625 1.15625 c -0.058594 0.273438 -0.09375 0.554688 -0.09375 0.84375 c 0 2.199219 1.800781 4 4 4 c 0.289062 0 0.570312 -0.035156 0.84375 -0.09375 z m 0 0", "key": "rvnz4p" }]], "aliases": ["camera-disabled-symbolic"], "gtkIconName": "camera-disabled-symbolic" };
__iconData$7p.node;
const CameraDisabled = createAdwaitaIcon(__iconData$7p);

const __iconData$7o = { "name": "camera-hardware-disabled", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 6.5 0 c -0.265625 0 -0.519531 0.105469 -0.707031 0.292969 l -1.707031 1.707031 h -1.085938 c -1.644531 0 -3 1.355469 -3 3 h 2 c 0 -0.570312 0.429688 -1 1 -1 h 1.5 c 0.265625 0 0.519531 -0.105469 0.707031 -0.292969 l 1.707031 -1.707031 h 2.171876 l 1.707031 1.707031 c 0.1875 0.1875 0.441406 0.292969 0.707031 0.292969 h 1.5 c 0.570312 0 1 0.429688 1 1 h 2 c 0 -1.644531 -1.355469 -3 -3 -3 h -1.085938 l -1.707031 -1.707031 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 1.5 4 c -1.007812 0 -1.929688 0.378906 -2.636719 1 h 5.273438 c -0.707031 -0.621094 -1.628907 -1 -2.636719 -1 z m -8 7 v 1 c 0 1.644531 1.355469 3 3 3 h 10 c 1.644531 0 3 -1.355469 3 -3 v -1 h -2 v 1 c 0 0.570312 -0.429688 1 -1 1 h -10 c -0.570312 0 -1 -0.429688 -1 -1 v -1 z m 5.363281 0 c 0.707031 0.621094 1.628907 1 2.636719 1 s 1.929688 -0.378906 2.636719 -1 z m 0 0", "key": "1ypl8l" }], ["path", { "fill": "currentColor", "d": "m 0 6 h 16 v 4 h -16 z m 0 0", "key": "1286a1" }]], "aliases": ["camera-hardware-disabled-symbolic"], "gtkIconName": "camera-hardware-disabled-symbolic" };
__iconData$7o.node;
const CameraHardwareDisabled = createAdwaitaIcon(__iconData$7o);

const __iconData$7n = { "name": "camera-photo", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 6.5 0 c -0.265625 0 -0.519531 0.105469 -0.707031 0.292969 l -1.707031 1.707031 h -1.085938 c -1.644531 0 -3 1.355469 -3 3 v 7 c 0 1.644531 1.355469 3 3 3 h 10 c 1.644531 0 3 -1.355469 3 -3 v -7 c 0 -1.644531 -1.355469 -3 -3 -3 h -1.085938 l -1.707031 -1.707031 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0.414062 2 h 2.171876 l 1.707031 1.707031 c 0.1875 0.1875 0.441406 0.292969 0.707031 0.292969 h 1.5 c 0.570312 0 1 0.429688 1 1 v 7 c 0 0.570312 -0.429688 1 -1 1 h -10 c -0.570312 0 -1 -0.429688 -1 -1 v -7 c 0 -0.570312 0.429688 -1 1 -1 h 1.5 c 0.265625 0 0.519531 -0.105469 0.707031 -0.292969 z m 0 0", "key": "1ag780" }], ["path", { "fill": "currentColor", "d": "m 8 4 c -2.199219 0 -4 1.800781 -4 4 s 1.800781 4 4 4 s 4 -1.800781 4 -4 s -1.800781 -4 -4 -4 z m 0 2 c 1.117188 0 2 0.882812 2 2 s -0.882812 2 -2 2 s -2 -0.882812 -2 -2 s 0.882812 -2 2 -2 z m 0 0", "key": "tlat6f" }]], "aliases": ["camera-photo-symbolic"], "gtkIconName": "camera-photo-symbolic" };
__iconData$7n.node;
const CameraPhoto = createAdwaitaIcon(__iconData$7n);

const __iconData$7m = { "name": "camera-switch", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 13.265625 10.476562 l 2.1875 -2.476562 h 0.546875 v 5.003906 h -0.535156 z m -6.265625 -3.476562 h 5 c 0.554688 0 1 0.445312 1 1 v 5 c 0 0.554688 -0.445312 1 -1 1 h -5 c -0.554688 0 -1 -0.445312 -1 -1 v -5 c 0 -0.554688 0.445312 -1 1 -1 z m 0 0", "key": "ei34uq" }], ["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 4 1.996094 c -0.554688 0 -1 0.445312 -1 1 v 5.007812 c 0 0.550782 0.445312 1 1 1 h 0.996094 v -1.003906 c 0 -1.050781 0.953125 -2.007812 2.003906 -2.003906 h 3 v -3 c 0 -0.554688 -0.445312 -1 -1 -1 z m -4 1.007812 v 5.003906 h 0.480469 l 2.253906 -2.585937 l -2.125 -2.417969 z m 0 0", "key": "1986vs" }]], "aliases": ["camera-switch-symbolic"], "gtkIconName": "camera-switch-symbolic" };
__iconData$7m.node;
const CameraSwitch = createAdwaitaIcon(__iconData$7m);

const __iconData$7l = { "name": "camera-video", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 3.003906 c -1.644531 0 -3 1.355469 -3 3 v 1.425782 l -3.320312 -3.433594 h -0.679688 v 9 h 0.644531 l 3.355469 -3.492188 v 1.5 c 0 1.644532 1.355469 3 3 3 h 6 c 1.644531 0 3 -1.355468 3 -3 v -5 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 2 h 6 c 0.570312 0 1 0.429688 1 1 v 5 c 0 0.570313 -0.429688 1 -1 1 h -6 c -0.570312 0 -1 -0.429687 -1 -1 v -5 c 0 -0.570312 0.429688 -1 1 -1 z m 0 0", "key": "a2pks2" }]], "aliases": ["camera-video-symbolic"], "gtkIconName": "camera-video-symbolic" };
__iconData$7l.node;
const CameraVideo = createAdwaitaIcon(__iconData$7l);

const __iconData$7k = { "name": "camera-web", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 3.003906 c -1.644531 0 -3 1.355469 -3 3 v 1.425782 l -3.320312 -3.433594 h -0.679688 v 9 h 0.644531 l 3.355469 -3.492188 v 1.5 c 0 1.644532 1.355469 3 3 3 h 6 c 1.644531 0 3 -1.355468 3 -3 v -5 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 2 h 6 c 0.570312 0 1 0.429688 1 1 v 5 c 0 0.570313 -0.429688 1 -1 1 h -6 c -0.570312 0 -1 -0.429687 -1 -1 v -5 c 0 -0.570312 0.429688 -1 1 -1 z m 0 0", "key": "a2pks2" }]], "aliases": ["camera-web-symbolic"], "gtkIconName": "camera-web-symbolic" };
__iconData$7k.node;
const CameraWeb = createAdwaitaIcon(__iconData$7k);

const __iconData$7j = { "name": "changes-allow", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 c -2.199219 0 -4 1.800781 -4 4 v 1 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -1 c 0 -1.125 0.875 -2 2 -2 s 2 0.875 2 2 v 4 h -6 c -1.109375 0 -2 0.890625 -2 2 v 5 c 0 0.554688 0.445312 1 1 1 h 10 c 0.554688 0 1 -0.445312 1 -1 v -5 c 0 -1.109375 -0.890625 -2 -2 -2 v -4 c 0 -2.199219 -1.800781 -4 -4 -4 z m 0 0", "key": "whfrk6" }]], "aliases": ["changes-allow-symbolic"], "gtkIconName": "changes-allow-symbolic" };
__iconData$7j.node;
const ChangesAllow = createAdwaitaIcon(__iconData$7j);

const __iconData$7i = { "name": "changes-prevent", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 1 c -2.199219 0 -4 1.800781 -4 4 v 2 c -1.109375 0 -2 0.890625 -2 2 v 5 c 0 0.554688 0.445312 1 1 1 h 10 c 0.554688 0 1 -0.445312 1 -1 v -5 c 0 -1.109375 -0.890625 -2 -2 -2 v -2 c 0 -2.199219 -1.800781 -4 -4 -4 z m 0 2 c 1.125 0 2 0.875 2 2 v 2 h -4 v -2 c 0 -1.125 0.875 -2 2 -2 z m 0 0", "key": "vflcq1" }]], "aliases": ["changes-prevent-symbolic"], "gtkIconName": "changes-prevent-symbolic" };
__iconData$7i.node;
const ChangesPrevent = createAdwaitaIcon(__iconData$7i);

const __iconData$7h = { "name": "channel-insecure", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 c -2.199219 0 -4 1.800781 -4 4 v 1 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -1 c 0 -1.125 0.875 -2 2 -2 s 2 0.875 2 2 v 3 h 2 v -3 c 0 -2.199219 -1.800781 -4 -4 -4 z m -4 8 c -1.109375 0 -2 0.890625 -2 2 v 5 c 0 0.554688 0.445312 1 1 1 h 4 v -8 z m 0 0", "key": "14vglb" }], ["path", { "fill": "#ff7800", "d": "m 9.5 8 c -0.832031 0 -1.5 0.667969 -1.5 1.5 v 5 c 0 0.832031 0.667969 1.5 1.5 1.5 h 5 c 0.832031 0 1.5 -0.667969 1.5 -1.5 v -5 c 0 -0.832031 -0.667969 -1.5 -1.5 -1.5 z m 1.5 1 h 2 v 2.5 s 0 0.5 -0.5 0.5 h -1 c -0.5 0 -0.5 -0.5 -0.5 -0.5 z m 0.5 4 h 1 c 0.277344 0 0.5 0.222656 0.5 0.5 v 1 c 0 0.277344 -0.222656 0.5 -0.5 0.5 h -1 c -0.277344 0 -0.5 -0.222656 -0.5 -0.5 v -1 c 0 -0.277344 0.222656 -0.5 0.5 -0.5 z m 0 0", "key": "3kuca" }]], "aliases": ["channel-insecure-symbolic"], "gtkIconName": "channel-insecure-symbolic", "monochrome": false };
__iconData$7h.node;
const ChannelInsecure = createAdwaitaIcon(__iconData$7h);

const __iconData$7g = { "name": "channel-secure", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 1 c -2.199219 0 -4 1.800781 -4 4 v 2 c -1.109375 0 -2 0.890625 -2 2 v 5 c 0 0.554688 0.445312 1 1 1 h 10 c 0.554688 0 1 -0.445312 1 -1 v -5 c 0 -1.109375 -0.890625 -2 -2 -2 v -2 c 0 -2.199219 -1.800781 -4 -4 -4 z m 0 2 c 1.125 0 2 0.875 2 2 v 2 h -4 v -2 c 0 -1.125 0.875 -2 2 -2 z m 0 0", "key": "vflcq1" }]], "aliases": ["channel-secure-symbolic"], "gtkIconName": "channel-secure-symbolic" };
__iconData$7g.node;
const ChannelSecure = createAdwaitaIcon(__iconData$7g);

const __iconData$7f = { "name": "chat-message-new", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 1 c -1.644531 0 -3 1.355469 -3 3 v 6 c 0 1.644531 1.355469 3 3 3 h 1 v 3 l 3 -3 v -1 c 0 -0.550781 -0.449219 -1 -1 -1 h -3 c -0.570312 0 -1 -0.429688 -1 -1 v -6 c 0 -0.554688 0.445312 -1 1 -1 h 10 c 0.554688 0 1 0.445312 1 1 v 4 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -4 c 0 -1.644531 -1.355469 -3 -3 -3 z m 8 7 v 3 h -3 v 2 h 3 v 3 h 2 v -3 h 3 v -2 h -3 v -3 z m 0 0", "key": "14d92c" }]], "aliases": ["chat-message-new-symbolic"], "gtkIconName": "chat-message-new-symbolic" };
__iconData$7f.node;
const ChatMessageNew = createAdwaitaIcon(__iconData$7f);

const __iconData$7e = { "name": "check", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "1", "stroke-linecap": "round", "opacity": "1", "d": "M414.145 341.9a1.25 1.25 0 0 0-1.766.092l-5.68 6.305-2.881-2.909a1.25 1.25 0 0 0-1.766 1.77l4.743 4.768 7.442-8.262a1.25 1.25 0 0 0-.092-1.764z", "transform": "translate(-401 -339)", "key": "wm9ncg" }]], "aliases": ["check-symbolic"], "gtkIconName": "check-symbolic" };
__iconData$7e.node;
const Check = createAdwaitaIcon(__iconData$7e);

const __iconData$7d = { "name": "checkbox-checked", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3.007812 0 c -1.644531 0 -2.9999995 1.355469 -2.9999995 3 v 10 c 0 1.644531 1.3554685 3 2.9999995 3 h 10 c 1.644532 0 3 -1.355469 3 -3 v -10 c 0 -1.644531 -1.355468 -3 -3 -3 z m 0 2 h 10 c 0.421876 0 0.765626 0.234375 0.917969 0.585938 l -0.667969 0.757812 l -6.296874 7.195312 l -2.246094 -2.246093 c -0.390625 -0.390625 -1.023438 -0.390625 -1.414063 0 s -0.390625 1.027343 0 1.417969 l 3 3 c 0.410157 0.40625 1.078125 0.386718 1.460938 -0.050782 l 6.246093 -7.136718 v 7.476562 c 0 0.570312 -0.429687 1 -1 1 h -10 c -0.570312 0 -1 -0.429688 -1 -1 v -10 c 0 -0.570312 0.429688 -1 1 -1 z m 0 0", "key": "1bwoor" }]], "aliases": ["checkbox-checked-symbolic"], "gtkIconName": "checkbox-checked-symbolic" };
__iconData$7d.node;
const CheckboxChecked = createAdwaitaIcon(__iconData$7d);

const __iconData$7c = { "name": "checkbox-mixed", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3.007812 0 c -1.644531 0 -2.9999995 1.355469 -2.9999995 3 v 10 c 0 1.644531 1.3554685 3 2.9999995 3 h 10 c 1.644532 0 3 -1.355469 3 -3 v -10 c 0 -1.644531 -1.355468 -3 -3 -3 z m 0 2 h 10 c 0.570313 0 1 0.429688 1 1 v 10 c 0 0.570312 -0.429687 1 -1 1 h -10 c -0.570312 0 -1 -0.429688 -1 -1 v -10 c 0 -0.570312 0.429688 -1 1 -1 z m 1.996094 4 c -1.105468 0 -2 0.894531 -2 2 s 0.894532 2 2 2 h 6 c 1.101563 0 2 -0.894531 2 -2 s -0.898437 -2 -2 -2 z m 0 0", "key": "cd5t6l" }]], "aliases": ["checkbox-mixed-symbolic"], "gtkIconName": "checkbox-mixed-symbolic" };
__iconData$7c.node;
const CheckboxMixed = createAdwaitaIcon(__iconData$7c);

const __iconData$7b = { "name": "checkbox", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.960784", "d": "m 3.007812 0 c -1.644531 0 -2.9999995 1.355469 -2.9999995 3 v 10 c 0 1.644531 1.3554685 3 2.9999995 3 h 10 c 1.644532 0 3 -1.355469 3 -3 v -10 c 0 -1.644531 -1.355468 -3 -3 -3 z m 0 2 h 10 c 0.570313 0 1 0.429688 1 1 v 10 c 0 0.570312 -0.429687 1 -1 1 h -10 c -0.570312 0 -1 -0.429688 -1 -1 v -10 c 0 -0.570312 0.429688 -1 1 -1 z m 0 0", "key": "6eadmw" }]], "aliases": ["checkbox-symbolic"], "gtkIconName": "checkbox-symbolic" };
__iconData$7b.node;
const Checkbox = createAdwaitaIcon(__iconData$7b);

const __iconData$7a = { "name": "color-select", "size": 16, "node": [["path", { "fill": "currentColor", "fill-rule": "evenodd", "d": "m 12.957031 0.980469 c -0.519531 0.015625 -1.015625 0.234375 -1.375 0.605469 l -1.585937 1.585937 l -1.085938 -1.085937 c -0.097656 -0.09375 -0.226562 -0.148438 -0.363281 -0.148438 c -0.128906 0.003906 -0.253906 0.054688 -0.34375 0.148438 l -2.121094 2.121093 c -0.195312 0.195313 -0.195312 0.511719 0 0.707031 l 0.644531 0.648438 l -5.585937 5.582031 c -0.09375 0.097657 -0.144531 0.222657 -0.144531 0.355469 v 1.792969 l -0.855469 0.851562 c -0.1953125 0.195313 -0.1953125 0.515625 0 0.710938 l 1 1 c 0.195313 0.191406 0.511719 0.191406 0.707031 0 l 0.855469 -0.855469 h 1.792969 c 0.132812 0 0.257812 -0.050781 0.351562 -0.144531 l 5.585938 -5.585938 l 0.648437 0.644531 c 0.195313 0.195313 0.511719 0.195313 0.707031 0 l 2.121094 -2.121093 c 0.195313 -0.195313 0.195313 -0.511719 0 -0.707031 l -1.085937 -1.085938 l 1.585937 -1.585938 c 1.304688 -1.273437 0.367188 -3.488281 -1.453125 -3.433593 z m -5.023437 5.789062 l 1.292968 1.292969 l -2.9375 2.9375 h -2.585937 z m 0 0", "key": "1d4dx3" }]], "aliases": ["color-select-symbolic"], "gtkIconName": "color-select-symbolic" };
__iconData$7a.node;
const ColorSelect = createAdwaitaIcon(__iconData$7a);

const __iconData$79 = { "name": "colorimeter-colorhug", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7.296875 -0.0117188 c -0.078125 0 -0.160156 0.0039063 -0.234375 0.0117188 c -0.453125 0.0507812 -0.882812 0.222656 -1.25 0.5 c -0.488281 0.371094 -0.8125 0.957031 -0.8125 1.6875 v 3.8125 h -2.273438 c -0.402343 0 -0.726562 0.324219 -0.726562 0.726562 v 6.546876 c 0 0.402343 0.324219 0.726562 0.726562 0.726562 h 5.546876 c 0.402343 0 0.726562 -0.324219 0.726562 -0.726562 v -6.546876 c 0 -0.402343 -0.324219 -0.726562 -0.726562 -0.726562 h -2.273438 v -3.8125 c 0 -0.449219 0.171875 -0.703125 0.4375 -0.90625 s 0.664062 -0.300781 1.0625 -0.28125 s 0.785156 0.152344 1.0625 0.40625 s 0.46875 0.585938 0.46875 1.125 c 0 2.164062 1.464844 3.507812 3 3.46875 c 0.855469 -0.023438 1.6875 -0.476562 2.25 -1.3125 l -0.5625 -1 c -0.375 0.914062 -1.066406 1.296875 -1.71875 1.3125 c -0.960938 0.023438 -1.96875 -0.730469 -1.96875 -2.46875 c 0 -0.792969 -0.335938 -1.445312 -0.8125 -1.875 s -1.082031 -0.6289062 -1.6875 -0.65625 c -0.074219 -0.00390625 -0.15625 -0.0078125 -0.234375 -0.0117188 z m 6.703125 2.0117188 v 0.125 l 0.78125 1.375 c 0.011719 -0.039062 0.019531 -0.082031 0.03125 -0.125 z m 0 0.34375 c -0.007812 0.105469 -0.019531 0.214844 -0.03125 0.3125 l 0.71875 1.21875 c 0.023438 -0.0625 0.042969 -0.121094 0.0625 -0.1875 z m -0.0625 0.5 c -0.015625 0.089844 -0.042969 0.167969 -0.0625 0.25 l 0.65625 1.125 c 0.03125 -0.0625 0.066406 -0.125 0.09375 -0.1875 z m -0.09375 0.4375 c -0.023438 0.089844 -0.066406 0.167969 -0.09375 0.25 l 0.59375 1.03125 c 0.039062 -0.066406 0.089844 -0.117188 0.125 -0.1875 z m 0 0", "key": "168i67" }]], "aliases": ["colorimeter-colorhug-symbolic"], "gtkIconName": "colorimeter-colorhug-symbolic" };
__iconData$79.node;
const ColorimeterColorhug = createAdwaitaIcon(__iconData$79);

const __iconData$78 = { "name": "computer-apple-ipad", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 1 c -1.644531 0 -3 1.355469 -3 3 v 8 c 0 1.644531 1.355469 3 3 3 h 10 c 1.644531 0 3 -1.355469 3 -3 v -8 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 2 h 10 c 0.570312 0 1 0.429688 1 1 v 7 c 0 0.554688 -0.445312 1 -1 1 h -10 c -0.554688 0 -1 -0.445312 -1 -1 v -7 c 0 -0.570312 0.429688 -1 1 -1 z m 0 0", "key": "8yj532" }]], "aliases": ["computer-apple-ipad-symbolic"], "gtkIconName": "computer-apple-ipad-symbolic" };
__iconData$78.node;
const ComputerAppleIpad = createAdwaitaIcon(__iconData$78);

const __iconData$77 = { "name": "computer-fail", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 0 c -1.660156 0 -3 1.339844 -3 3 v 7 c 0 1.660156 1.339844 3 3 3 h 10 c 1.660156 0 3 -1.339844 3 -3 v -7 c 0 -1.660156 -1.339844 -3 -3 -3 z m 0 2 h 10 c 0.554688 0 1 0.445312 1 1 v 7 c 0 0.554688 -0.445312 1 -1 1 h -10 c -0.554688 0 -1 -0.445312 -1 -1 v -7 c 0 -0.554688 0.445312 -1 1 -1 z m 3 2 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 s 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m 4 0 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 s 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m -2 3 c -1.429688 0 -2.75 0.761719 -3.464844 2 c -0.136718 0.238281 -0.054687 0.546875 0.183594 0.683594 c 0.238281 0.136718 0.546875 0.054687 0.683594 -0.183594 c 0.535156 -0.929688 1.523437 -1.5 2.597656 -1.5 s 2.0625 0.570312 2.597656 1.5 c 0.136719 0.238281 0.445313 0.320312 0.683594 0.183594 c 0.238281 -0.136719 0.320312 -0.445313 0.183594 -0.683594 c -0.714844 -1.238281 -2.035156 -2 -3.464844 -2 z m -3 7 c -1.105469 0 -2 0.894531 -2 2 h 10 c 0 -1.105469 -0.894531 -2 -2 -2 z m 0 0", "key": "yld9h5" }]], "aliases": ["computer-fail-symbolic"], "gtkIconName": "computer-fail-symbolic" };
__iconData$77.node;
const ComputerFail = createAdwaitaIcon(__iconData$77);

const __iconData$76 = { "name": "computer", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 0 c -1.660156 0 -3 1.339844 -3 3 v 7 c 0 1.660156 1.339844 3 3 3 h 10 c 1.660156 0 3 -1.339844 3 -3 v -7 c 0 -1.660156 -1.339844 -3 -3 -3 z m 0 2 h 10 c 0.554688 0 1 0.445312 1 1 v 7 c 0 0.554688 -0.445312 1 -1 1 h -10 c -0.554688 0 -1 -0.445312 -1 -1 v -7 c 0 -0.554688 0.445312 -1 1 -1 z m 2 12 c -1.105469 0 -2 0.894531 -2 2 h 10 c 0 -1.105469 -0.894531 -2 -2 -2 z m 0 0", "key": "1hcz59" }]], "aliases": ["computer-symbolic"], "gtkIconName": "computer-symbolic" };
__iconData$76.node;
const Computer = createAdwaitaIcon(__iconData$76);

const __iconData$75 = { "name": "contact-new", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 1 c -1.65625 0 -3 1.34375 -3 3 s 1.34375 3 3 3 s 3 -1.34375 3 -3 s -1.34375 -3 -3 -3 z m -1.5 7 c -2.492188 0 -4.5 2.007812 -4.5 4.5 v 0.5 c 0 1.109375 0.890625 2 2 2 h 6 v -1 h -3 v -4 h 3 v -1.972656 c -0.164062 -0.019532 -0.332031 -0.027344 -0.5 -0.027344 z m 4.5 0 v 3 h -3 v 2 h 3 v 3 h 2 v -3 h 3 v -2 h -3 v -3 z m 0 0", "key": "1kqgf6" }]], "aliases": ["contact-new-symbolic"], "gtkIconName": "contact-new-symbolic" };
__iconData$75.node;
const ContactNew = createAdwaitaIcon(__iconData$75);

const __iconData$74 = { "name": "content-loading", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 6 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 5 0 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 5 0 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 0 0", "key": "14xcmx" }]], "aliases": ["content-loading-symbolic"], "gtkIconName": "content-loading-symbolic" };
__iconData$74.node;
const ContentLoading = createAdwaitaIcon(__iconData$74);

const __iconData$73 = { "name": "dash", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "1", "fill-rule": "nonzero", "stroke": "none", "stroke-width": "4", "stroke-linecap": "round", "stroke-linejoin": "miter", "stroke-dasharray": "none", "stroke-opacity": "1", "opacity": "1", "d": "M407 367h8c1.108 0 2 .892 2 2s-.892 2-2 2h-8c-1.108 0-2-.892-2-2s.892-2 2-2z", "transform": "translate(-404 -362)", "key": "170p9s" }]], "aliases": ["dash-symbolic"], "gtkIconName": "dash-symbolic" };
__iconData$73.node;
const Dash = createAdwaitaIcon(__iconData$73);

const __iconData$72 = { "name": "daytime-sunrise", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 15.003906 13.015625 h -1 c -0.550781 0 -1 0.445313 -1 1 c 0 0.550781 0.449219 1 1 1 h 1 c 0.554688 0 1 -0.449219 1 -1 c 0 -0.554687 -0.445312 -1 -1 -1 z m -2.753906 -4.664063 l -0.707031 0.707032 c -0.390625 0.390625 -0.390625 1.027344 0 1.414062 c 0.390625 0.390625 1.027343 0.390625 1.417969 0 l 0.707031 -0.707031 c 0.386719 -0.390625 0.386719 -1.023437 0 -1.414063 c -0.390625 -0.390624 -1.027344 -0.390624 -1.417969 0 z m -9.902344 1.40625 l 0.707032 0.707032 c 0.253906 0.253906 0.621093 0.351562 0.96875 0.261718 c 0.34375 -0.09375 0.613281 -0.363281 0.707031 -0.710937 c 0.09375 -0.34375 -0.007813 -0.710937 -0.261719 -0.964844 l -0.707031 -0.707031 c -0.25 -0.253906 -0.621094 -0.351562 -0.964844 -0.261719 c -0.347656 0.09375 -0.617187 0.363281 -0.707031 0.707031 c -0.09375 0.347657 0.003906 0.714844 0.257812 0.96875 z m -1.347656 5.242188 h 1 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 h -1 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 z m 0 0", "key": "1qkyn2" }], ["path", { "fill": "currentColor", "d": "m 8 9 c -0.550781 0 -1 -0.449219 -1 -1 v -3 h -2 v -1 h 0.007812 c -0.003906 -0.265625 0.101563 -0.519531 0.285157 -0.707031 l 2 -2 c 0.390625 -0.390625 1.023437 -0.390625 1.414062 0 l 2 2 c 0.183594 0.1875 0.289063 0.441406 0.289063 0.707031 h 0.003906 v 1 h -2 v 3 c 0 0.550781 -0.449219 1 -1 1 z m 0 0", "key": "9y0aku" }], ["path", { "fill": "currentColor", "d": "m 6 14 c 0 -1.117188 0.882812 -2 2 -2 s 2 0.882812 2 2 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 c 0 -2.207031 -1.792969 -4 -4 -4 s -4 1.792969 -4 4 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 z m 0 0", "key": "86zucc" }]], "aliases": ["daytime-sunrise-symbolic"], "gtkIconName": "daytime-sunrise-symbolic" };
__iconData$72.node;
const DaytimeSunrise = createAdwaitaIcon(__iconData$72);

const __iconData$71 = { "name": "daytime-sunset", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 15 13 h -1 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 h 1 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m -2.753906 -4.660156 l -0.707032 0.707031 c -0.390624 0.390625 -0.390624 1.023437 0 1.414063 c 0.390626 0.390624 1.023438 0.390624 1.414063 0 l 0.707031 -0.707032 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 s -1.023437 -0.390625 -1.414062 0 z m -9.902344 1.402344 l 0.707031 0.707031 c 0.253907 0.253906 0.621094 0.355469 0.96875 0.261719 c 0.34375 -0.09375 0.613281 -0.363282 0.707031 -0.707032 c 0.089844 -0.347656 -0.007812 -0.714844 -0.261718 -0.96875 l -0.707032 -0.707031 c -0.253906 -0.253906 -0.621093 -0.351563 -0.964843 -0.257813 c -0.347657 0.089844 -0.617188 0.359376 -0.710938 0.707032 c -0.089843 0.34375 0.007813 0.714844 0.261719 0.964844 z m -1.347656 5.242187 h 1 c 0.550781 0 1 -0.445313 1 -1 c 0 -0.550781 -0.449219 -1 -1 -1 h -1 c -0.554688 0 -1.00000025 0.449219 -1.00000025 1 c 0 0.554687 0.44531225 1 1.00000025 1 z m 0 0", "key": "1tei2t" }], ["path", { "fill": "currentColor", "d": "m 6 14 c 0 -1.117188 0.882812 -2 2 -2 s 2 0.882812 2 2 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 c 0 -2.207031 -1.792969 -4 -4 -4 s -4 1.792969 -4 4 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 z m 0 0", "key": "86zucc" }], ["path", { "fill": "currentColor", "d": "m 8 1 c -0.550781 0 -1 0.449219 -1 1 v 3 h -2 v 1 h 0.007812 c -0.003906 0.265625 0.101563 0.519531 0.285157 0.707031 l 2 2 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 l 2 -2 c 0.183594 -0.1875 0.289063 -0.441406 0.289063 -0.707031 h 0.003906 v -1 h -2 v -3 c 0 -0.550781 -0.449219 -1 -1 -1 z m 0 0", "key": "vidai3" }]], "aliases": ["daytime-sunset-symbolic"], "gtkIconName": "daytime-sunset-symbolic" };
__iconData$71.node;
const DaytimeSunset = createAdwaitaIcon(__iconData$71);

const __iconData$70 = { "name": "dialog-error", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 1 c -3.871094 0 -7 3.128906 -7 7 s 3.128906 7 7 7 s 7 -3.128906 7 -7 s -3.128906 -7 -7 -7 z m -4 6 h 8 v 2 h -8 z m 0 0", "key": "aw7iau" }]], "aliases": ["dialog-error-symbolic"], "gtkIconName": "dialog-error-symbolic" };
__iconData$70.node;
const DialogError = createAdwaitaIcon(__iconData$70);

const __iconData$6$ = { "name": "dialog-information", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7.996094 0 c -2.835938 0 -5.292969 2 -5.871094 4.777344 c -0.527344 2.535156 0.6875 5.035156 2.875 6.328125 v 0.894531 c 0 0.554688 0.449219 1 1 1 h 4 c 0.550781 0 1 -0.445312 1 -1 l 0.003906 -0.898438 c 2.179688 -1.292968 3.398438 -3.796874 2.867188 -6.332031 c -0.582032 -2.773437 -3.039063 -4.769531 -5.875 -4.769531 z m 0 2 c 1.898437 0 3.527344 1.320312 3.917968 3.179688 c 0.390626 1.863281 -0.570312 3.726562 -2.3125 4.488281 c -0.363281 0.15625 -0.597656 0.515625 -0.601562 0.914062 v 0.417969 h -2 v -0.417969 c -0.003906 -0.398437 -0.238281 -0.753906 -0.601562 -0.914062 c -1.742188 -0.761719 -2.703126 -2.625 -2.316407 -4.484375 s 2.015625 -3.183594 3.914063 -3.183594 z m -1.996094 12 v 1 c 0 0.554688 0.445312 1 1 1 h 2 c 0.554688 0 1 -0.445312 1 -1 v -1 z m 0 0", "key": "rlg5tf" }], ["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 6.644531 6.144531 c -0.195312 0.195313 -0.195312 0.515625 0 0.707031 l 1 1 c 0.195313 0.195313 0.511719 0.195313 0.707031 0 l 1 -1 c 0.195313 -0.191406 0.195313 -0.511718 0 -0.707031 c -0.195312 -0.191406 -0.511718 -0.191406 -0.707031 0 l -0.648437 0.648438 l -0.644532 -0.648438 c -0.195312 -0.191406 -0.511718 -0.191406 -0.707031 0 z m 0 0", "key": "4k4xl1" }]], "aliases": ["dialog-information-symbolic"], "gtkIconName": "dialog-information-symbolic" };
__iconData$6$.node;
const DialogInformation = createAdwaitaIcon(__iconData$6$);

const __iconData$6_ = { "name": "dialog-password", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 6 1 c -2.761719 0 -5 2.238281 -5 5 s 2.238281 5 5 5 c 0.832031 -0.003906 1.652344 -0.214844 2.382812 -0.617188 l 0.617188 0.617188 v 2 h 2 v 2 h 4 v -3 l -4.308594 -4.308594 c 0.199219 -0.542968 0.304688 -1.113281 0.308594 -1.691406 c 0 -2.761719 -2.238281 -5 -5 -5 z m -1 3 c 0.550781 0 1 0.449219 1 1 s -0.449219 1 -1 1 s -1 -0.449219 -1 -1 s 0.449219 -1 1 -1 z m 0 0", "key": "19zodo" }]], "aliases": ["dialog-password-symbolic"], "gtkIconName": "dialog-password-symbolic" };
__iconData$6_.node;
const DialogPassword = createAdwaitaIcon(__iconData$6_);

const __iconData$6Z = { "name": "dialog-question", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0.03125 c -0.398438 0 -0.816406 0.160156 -1.125 0.46875 l -6.375 6.375 c -0.621094 0.621094 -0.621094 1.628906 0 2.25 l 6.375 6.375 c 0.621094 0.621094 1.628906 0.621094 2.25 0 l 6.375 -6.375 c 0.621094 -0.621094 0.621094 -1.628906 0 -2.25 l -6.375 -6.375 c -0.308594 -0.308594 -0.726562 -0.46875 -1.125 -0.46875 z m 0.152344 2.976562 c 0.726562 0.035157 1.433594 0.335938 1.96875 0.871094 c 0.855468 0.855469 1.113281 2.152344 0.652344 3.269532 c -0.332032 0.796874 -0.988282 1.390624 -1.773438 1.671874 v 1.179688 h -2 v -2 c 0 -0.550781 0.449219 -1 1 -1 c 0.40625 0 0.769531 -0.242188 0.925781 -0.617188 c 0.152344 -0.375 0.070313 -0.800781 -0.21875 -1.089843 c -0.289062 -0.289063 -0.714843 -0.371094 -1.089843 -0.21875 c -0.375 0.15625 -0.617188 0.519531 -0.617188 0.925781 h -2 c 0 -1.210938 0.734375 -2.308594 1.851562 -2.769531 c 0.417969 -0.175781 0.863282 -0.246094 1.300782 -0.222657 z m -0.152344 7.992188 c 0.550781 0 1 0.449219 1 1 s -0.449219 1 -1 1 s -1 -0.449219 -1 -1 s 0.449219 -1 1 -1 z m 0 0", "key": "k1k9ri" }]], "aliases": ["dialog-question-symbolic"], "gtkIconName": "dialog-question-symbolic" };
__iconData$6Z.node;
const DialogQuestion = createAdwaitaIcon(__iconData$6Z);

const __iconData$6Y = { "name": "dialog-warning", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7.90625 0.09375 c -0.527344 -0.0273438 -1.039062 0.28125 -1.4375 0.96875 l -6.25 11.59375 c -0.535156 0.964844 0.046875 2.34375 1.09375 2.34375 h 13.15625 c 0.980469 0 1.902344 -1.160156 1.21875 -2.34375 l -6.3125 -11.53125 c -0.398438 -0.644531 -0.941406 -1.003906 -1.46875 -1.03125 z m 1.09375 3.90625 v 5 c 0.007812 0.527344 -0.472656 1 -1 1 s -1.007812 -0.472656 -1 -1 v -5 z m -1 7 c 0.550781 0 1 0.449219 1 1 s -0.449219 1 -1 1 s -1 -0.449219 -1 -1 s 0.449219 -1 1 -1 z m 0 0", "key": "1gfrxc" }]], "aliases": ["dialog-warning-symbolic"], "gtkIconName": "dialog-warning-symbolic" };
__iconData$6Y.node;
const DialogWarning = createAdwaitaIcon(__iconData$6Y);

const __iconData$6X = { "name": "display-brightness", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 c -0.554688 0 -1 0.445312 -1 1 v 1 c 0 0.554688 0.445312 1 1 1 s 1 -0.445312 1 -1 v -1 c 0 -0.554688 -0.445312 -1 -1 -1 z m -4.992188 2.003906 c -0.257812 0 -0.511718 0.101563 -0.707031 0.296875 c -0.394531 0.390625 -0.394531 1.019531 0 1.414063 l 0.707031 0.707031 c 0.390626 0.390625 1.019532 0.390625 1.414063 0 c 0.390625 -0.394531 0.390625 -1.023437 0 -1.414063 l -0.707031 -0.707031 c -0.195313 -0.195312 -0.453125 -0.296875 -0.707032 -0.296875 z m 9.984376 0 c -0.253907 0 -0.511719 0.101563 -0.707032 0.296875 l -0.707031 0.707031 c -0.390625 0.390626 -0.390625 1.019532 0 1.414063 c 0.394531 0.390625 1.023437 0.390625 1.414063 0 l 0.707031 -0.707031 c 0.394531 -0.394532 0.394531 -1.023438 0 -1.414063 c -0.195313 -0.195312 -0.449219 -0.296875 -0.707031 -0.296875 z m -4.992188 1.996094 c -2.210938 0 -4 1.789062 -4 4 s 1.789062 4 4 4 s 4 -1.789062 4 -4 s -1.789062 -4 -4 -4 z m -7 3 c -0.554688 0 -1 0.445312 -1 1 s 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 s -0.445312 -1 -1 -1 z m 13 0 c -0.554688 0 -1 0.445312 -1 1 s 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 s -0.445312 -1 -1 -1 z m -10.335938 4.285156 c -0.238281 0.011719 -0.472656 0.109375 -0.65625 0.292969 l -0.707031 0.707031 c -0.394531 0.394532 -0.394531 1.023438 0 1.414063 c 0.390625 0.394531 1.019531 0.394531 1.414063 0 l 0.707031 -0.707031 c 0.390625 -0.390626 0.390625 -1.019532 0 -1.414063 c -0.210937 -0.207031 -0.484375 -0.304687 -0.757813 -0.292969 z m 8.574219 0 c -0.238281 0.011719 -0.476562 0.109375 -0.660156 0.292969 c -0.390625 0.394531 -0.390625 1.023437 0 1.414063 l 0.707031 0.707031 c 0.394532 0.394531 1.023438 0.394531 1.414063 0 c 0.394531 -0.390625 0.394531 -1.019531 0 -1.414063 l -0.707031 -0.707031 c -0.207032 -0.207031 -0.484376 -0.304687 -0.753907 -0.292969 z m -4.289062 1.714844 c -0.53125 0.027344 -0.949219 0.464844 -0.949219 1 v 1 c 0 0.554688 0.445312 1 1 1 s 1 -0.445312 1 -1 v -1 c 0 -0.554688 -0.445312 -1 -1 -1 c -0.015625 0 -0.035156 0 -0.050781 0 z m 0 0", "key": "1luqia" }]], "aliases": ["display-brightness-symbolic"], "gtkIconName": "display-brightness-symbolic" };
__iconData$6X.node;
const DisplayBrightness = createAdwaitaIcon(__iconData$6X);

const __iconData$6W = { "name": "display-projector", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 9.5 3 c -1.386719 0 -2.59375 0.820312 -3.15625 2 h -3.34375 c -1.644531 0 -3 1.355469 -3 3 v 3 c 0 1.644531 1.355469 3 3 3 c 0 0.554688 0.445312 1 1 1 s 1 -0.445312 1 -1 h 6 c 0 0.554688 0.445312 1 1 1 s 1 -0.445312 1 -1 c 1.644531 0 3 -1.355469 3 -3 v -3 c 0 -1.644531 -1.355469 -3 -3 -3 h -0.34375 c -0.5625 -1.179688 -1.769531 -2 -3.15625 -2 z m 0 2 c 0.828125 0 1.5 0.671875 1.5 1.5 s -0.671875 1.5 -1.5 1.5 s -1.5 -0.671875 -1.5 -1.5 s 0.671875 -1.5 1.5 -1.5 z m -6.5 2 h 3.039062 c 0.242188 1.6875 1.710938 3 3.460938 3 s 3.21875 -1.3125 3.460938 -3 h 0.039062 c 0.570312 0 1 0.429688 1 1 v 3 c 0 0.554688 -0.445312 1 -1 1 h -10 c -0.554688 0 -1 -0.445312 -1 -1 v -3 c 0 -0.570312 0.429688 -1 1 -1 z m 1 1 c -0.554688 0 -1 0.445312 -1 1 s 0.445312 1 1 1 s 1 -0.445312 1 -1 s -0.445312 -1 -1 -1 z m 0 0", "key": "3janfj" }]], "aliases": ["display-projector-symbolic"], "gtkIconName": "display-projector-symbolic" };
__iconData$6W.node;
const DisplayProjector = createAdwaitaIcon(__iconData$6W);

const __iconData$6V = { "name": "document-edit", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 12.277344 0.832031 c -0.578125 0.007813 -1.167969 0.230469 -1.691406 0.753907 l -9 9 c -0.375 0.375 -0.585938 0.882812 -0.585938 1.414062 v 3 h 3 c 0.53125 0 1.039062 -0.210938 1.414062 -0.585938 l 9 -9 c 1.789063 -1.789062 0.082032 -4.390624 -1.890624 -4.570312 c -0.082032 -0.011719 -0.164063 -0.011719 -0.246094 -0.011719 z m -1.777344 3.605469 l 1.0625 1.0625 l -7.0625 7.0625 l -1.0625 -1.0625 z m 0 0", "key": "tbaizw" }]], "aliases": ["document-edit-symbolic"], "gtkIconName": "document-edit-symbolic" };
__iconData$6V.node;
const DocumentEdit = createAdwaitaIcon(__iconData$6V);

const __iconData$6U = { "name": "document-new", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4 0 c -1.644531 0 -3 1.355469 -3 3 v 10 c 0 1.644531 1.355469 3 3 3 h 3 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 h -3 c -0.570312 0 -1 -0.429688 -1 -1 v -10 c 0 -0.570312 0.429688 -1 1 -1 h 5.585938 l 3.414062 3.414062 v 0.585938 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -1 c 0 -0.265625 -0.105469 -0.519531 -0.292969 -0.707031 l -4 -4 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 7 8 v 3 h -3 v 2 h 3 v 3 h 2 v -3 h 3 v -2 h -3 v -3 z m 0 0", "key": "1l99to" }]], "aliases": ["document-new-symbolic"], "gtkIconName": "document-new-symbolic" };
__iconData$6U.node;
const DocumentNew = createAdwaitaIcon(__iconData$6U);

const __iconData$6T = { "name": "document-open-recent", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8.488281 0.0195312 c -4.128906 0 -7.488281 3.3554688 -7.488281 7.4882808 c 0 4.128907 3.359375 7.484376 7.488281 7.484376 c 4.128907 0 7.488281 -3.355469 7.488281 -7.484376 c 0 -4.132812 -3.359374 -7.4882808 -7.488281 -7.4882808 z m 0 1.9726568 c 3.050781 0 5.511719 2.464843 5.511719 5.515624 c 0 3.046876 -2.460938 5.511719 -5.511719 5.511719 s -5.511719 -2.464843 -5.511719 -5.511719 c 0 -3.050781 2.460938 -5.515624 5.511719 -5.515624 z m 3.007813 2.007812 c -0.03125 0 -0.066406 0 -0.101563 0.007812 c -0.097656 0.023438 -0.183593 0.078126 -0.25 0.15625 l -2.65625 2.65625 l -1.65625 -1.65625 c -0.109375 -0.179687 -0.3125 -0.269531 -0.515625 -0.234374 c -0.207031 0.039062 -0.363281 0.199218 -0.402344 0.402343 c -0.039062 0.203125 0.054688 0.410157 0.230469 0.519531 l 2 2 c 0.191407 0.179688 0.496094 0.179688 0.6875 0 l 3 -3 c 0.136719 -0.140624 0.179688 -0.351562 0.109375 -0.535156 c -0.074218 -0.183594 -0.246094 -0.308594 -0.445312 -0.316406 z m 0 0", "key": "144per" }]], "aliases": ["document-open-recent-symbolic"], "gtkIconName": "document-open-recent-symbolic" };
__iconData$6T.node;
const DocumentOpenRecent = createAdwaitaIcon(__iconData$6T);

const __iconData$6S = { "name": "document-open", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 1 c -1.644531 0 -3 1.355469 -3 3 v 8 c 0 1.644531 1.355469 3 3 3 h 8.882812 c 0.832032 0 1.578126 -0.402344 2.054688 -0.9375 c 0.472656 -0.53125 0.738281 -1.167969 0.910156 -1.800781 l 0.972656 -2.609375 c 0.390626 -1.449219 -0.09375 -2.652344 -0.820312 -3.167969 c -0.484375 -0.34375 -0.714844 -0.292969 -1 -0.324219 v -1.160156 c 0 -0.855469 -0.558594 -1.589844 -1.09375 -1.828125 c -0.417969 -0.1875 -0.808594 -0.183594 -0.953125 -0.171875 h -3.539063 l -1.707031 -1.707031 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0 2 h 2.585938 l 1.707031 1.707031 c 0.1875 0.1875 0.441406 0.292969 0.707031 0.292969 h 4 v 1 h -5 h 0.039062 c -0.914062 -0.039062 -1.746093 0.394531 -2.1875 0.96875 c -0.714843 1.226562 -1.160156 2.28125 -1.800781 3.71875 c -0.171875 0.527344 0.113281 1.09375 0.636719 1.265625 c 0.527344 0.167969 1.09375 -0.117187 1.261719 -0.640625 c 0.488281 -1.011719 0.921875 -1.816406 1.339843 -2.808594 c 0.210938 -0.503906 0.703126 -0.492187 0.898438 -0.503906 h 5.8125 c 1 0 1.046875 0.703125 0.886719 1.128906 l -0.96875 2.609375 c -0.121094 0.4375 -0.300781 0.800781 -0.476563 0.996094 c -0.175781 0.199219 -0.285156 0.265625 -0.558594 0.265625 h -8.882812 c -0.570312 0 -1 -0.429688 -1 -1 v -8 c 0 -0.570312 0.46875 -0.792969 1 -1 z m 9.105469 1.996094 h 0.003906 v 0.003906 h 0.003906 l -0.003906 0.003906 h -0.003906 v -0.003906 c -0.003907 0 -0.007813 0 -0.011719 0 h -0.003906 l -0.003906 -0.003906 z m 0 0", "key": "mi9zp7" }]], "aliases": ["document-open-symbolic"], "gtkIconName": "document-open-symbolic" };
__iconData$6S.node;
const DocumentOpen = createAdwaitaIcon(__iconData$6S);

const __iconData$6R = { "name": "document-page-setup", "size": 16, "node": [["path", { "fill": "currentColor", "fill-rule": "evenodd", "d": "m 1 4.765625 v 8.234375 h 14.222656 z m 2 3.46875 l 4.777344 2.765625 h -4.777344 z m 0 0", "key": "10cozr" }], ["path", { "fill": "currentColor", "d": "m 1.175781 14 c 0.417969 1.160156 1.53125 2 2.824219 2 h 8 c 1.292969 0 2.40625 -0.839844 2.824219 -2 z m 0 0", "key": "1srfn5" }], ["path", { "fill": "currentColor", "d": "m 4 0 c -1.644531 0 -3 1.355469 -3 3 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 c 0 -0.570312 0.429688 -1 1 -1 h 5.585938 l 3.414062 3.414062 v 3.585938 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -4 c 0 -0.265625 -0.105469 -0.519531 -0.292969 -0.707031 l -4 -4 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0 0", "key": "1nh0j8" }]], "aliases": ["document-page-setup-symbolic"], "gtkIconName": "document-page-setup-symbolic" };
__iconData$6R.node;
const DocumentPageSetup = createAdwaitaIcon(__iconData$6R);

const __iconData$6Q = { "name": "document-print-preview", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 11 7 c -1.921875 0 -3.5 1.578125 -3.5 3.5 s 1.578125 3.5 3.5 3.5 c 0.601562 0 1.167969 -0.152344 1.664062 -0.425781 l 1.628907 1.632812 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 c 0.1875 -0.1875 0.292969 -0.441406 0.292969 -0.707031 s -0.105469 -0.519531 -0.292969 -0.707031 l -1.632812 -1.632813 c 0.269531 -0.496094 0.425781 -1.0625 0.425781 -1.660156 c 0 -1.921875 -1.578125 -3.5 -3.5 -3.5 z m 0 2 c 0.839844 0 1.5 0.660156 1.5 1.5 s -0.660156 1.5 -1.5 1.5 s -1.5 -0.660156 -1.5 -1.5 s 0.660156 -1.5 1.5 -1.5 z m 0 0", "key": "1tara2" }], ["path", { "fill": "currentColor", "d": "m 5 1 c -0.550781 0 -1 0.449219 -1 1 v 1 h 8 v -1 c 0 -0.550781 -0.449219 -1 -1 -1 z m -3 3 c -1.109375 0 -2 0.890625 -2 2 v 4 c 0 1.109375 0.890625 2 2 2 v 1 c 0 1.089844 0.910156 2 2 2 h 7 c -1.539062 0 -2.914062 -0.796875 -3.730469 -2 h -3.269531 v -3 h 2.53125 c 0.25 -2.230469 2.175781 -4 4.46875 -4 c 2.460938 0 4.5 2.039062 4.5 4.5 c 0 0.316406 -0.035156 0.628906 -0.097656 0.929688 c 0.367187 -0.363282 0.597656 -0.867188 0.597656 -1.429688 v -4 c 0 -1.109375 -0.890625 -2 -2 -2 z m 0 0", "key": "8yeun6" }]], "aliases": ["document-print-preview-symbolic"], "gtkIconName": "document-print-preview-symbolic" };
__iconData$6Q.node;
const DocumentPrintPreview = createAdwaitaIcon(__iconData$6Q);

const __iconData$6P = { "name": "document-print", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 5 1 c -0.550781 0 -1 0.449219 -1 1 v 1 h 8 v -1 c 0 -0.550781 -0.449219 -1 -1 -1 z m -3 3 c -1.109375 0 -2 0.890625 -2 2 v 4 c 0 1.109375 0.890625 2 2 2 v 1 c 0 1.089844 0.910156 2 2 2 h 8 c 1.089844 0 2 -0.910156 2 -2 v -1 c 1.109375 0 2 -0.890625 2 -2 v -4 c 0 -1.109375 -0.890625 -2 -2 -2 z m 2 6 h 8 v 3 h -8 z m 0 0", "key": "n66cx1" }]], "aliases": ["document-print-symbolic"], "gtkIconName": "document-print-symbolic" };
__iconData$6P.node;
const DocumentPrint = createAdwaitaIcon(__iconData$6P);

const __iconData$6O = { "name": "document-properties", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4 0 c -1.644531 0 -3 1.355469 -3 3 v 10 c 0 1.644531 1.355469 3 3 3 h 3 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 h -3 c -0.570312 0 -1 -0.429688 -1 -1 v -10 c 0 -0.570312 0.429688 -1 1 -1 h 5.585938 l 3.414062 3.414062 v 6.585938 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -7 c 0 -0.265625 -0.105469 -0.519531 -0.292969 -0.707031 l -4 -4 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 4.640625 6.167969 c -0.199219 0.003906 -0.402344 0.019531 -0.597656 0.046875 l 1.171875 2.074218 c 0.242187 0.425782 -0.027344 0.914063 -0.539063 1.210938 l -0.925781 0.53125 c -0.515625 0.289062 -1.089844 0.25 -1.332031 -0.175781 l -1.171875 -2.074219 c -0.25 0.308594 -0.476563 0.648438 -0.617188 1.019531 c -0.679687 1.761719 0.285156 3.46875 2.152344 3.804688 c 0.386719 0.074219 0.800781 0.054687 1.191406 0.007812 c 0.03125 -0.007812 1.859375 3.386719 1.859375 3.386719 l 4.167969 0.003906 l -3.199219 -4.957031 c 0.246094 -0.308594 0.445313 -0.652344 0.585938 -1.019531 c 0.679687 -1.765625 -0.285157 -3.472656 -2.148438 -3.808594 c -0.195312 -0.039062 -0.398437 -0.050781 -0.597656 -0.046875 z m 0 0", "key": "1ksu1i" }]], "aliases": ["document-properties-symbolic"], "gtkIconName": "document-properties-symbolic" };
__iconData$6O.node;
const DocumentProperties = createAdwaitaIcon(__iconData$6O);

const __iconData$6N = { "name": "document-revert-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4 0 c -1.644531 0 -3 1.355469 -3 3 v 3 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -3 c 0 -0.570312 0.429688 -1 1 -1 h 5.585938 l 3.414062 3.414062 v 7.585938 c 0 0.570312 -0.429688 1 -1 1 h -7 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 h 7 c 1.644531 0 3 -1.355469 3 -3 v -8 c 0 -0.265625 -0.105469 -0.519531 -0.292969 -0.707031 l -4 -4 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 3 5 c -0.265625 0 -0.519531 0.105469 -0.707031 0.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 l 1.292969 1.292969 h -2.585938 c -2.195312 0 -4 1.800781 -4 4 v 4 h 2 v -4 c 0 -1.117188 0.882812 -2 2 -2 h 2.585938 l -1.292969 1.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 s 1.023437 0.390625 1.414062 0 l 3 -3 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 l -3 -3 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0 0", "key": "17bylb" }]], "aliases": ["document-revert-rtl-symbolic"], "gtkIconName": "document-revert-rtl-symbolic" };
__iconData$6N.node;
const DocumentRevertRtl = createAdwaitaIcon(__iconData$6N);

const __iconData$6M = { "name": "document-revert", "size": 16, "node": [["path", { "fill": "currentColor", "fill-rule": "evenodd", "d": "m 4 0 c -1.644531 0 -3 1.355469 -3 3 v 10 c 0 1.644531 1.355469 3 3 3 h 7 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 h -7 c -0.570312 0 -1 -0.429688 -1 -1 v -10 c 0 -0.570312 0.429688 -1 1 -1 h 5.585938 l 3.414062 3.414062 v 0.585938 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -1 c 0 -0.265625 -0.105469 -0.519531 -0.292969 -0.707031 l -4 -4 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 5 5 c -0.265625 0 -0.519531 0.105469 -0.707031 0.292969 l -3 3 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 l 3 3 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 s 0.390625 -1.023437 0 -1.414062 l -1.292969 -1.292969 h 2.585938 c 1.117188 0 2 0.882812 2 2 v 4 h 2 v -4 c 0 -2.199219 -1.800781 -4 -4 -4 h -2.585938 l 1.292969 -1.292969 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0 0", "key": "1n4oie" }]], "aliases": ["document-revert-symbolic"], "gtkIconName": "document-revert-symbolic" };
__iconData$6M.node;
const DocumentRevert = createAdwaitaIcon(__iconData$6M);

const __iconData$6L = { "name": "document-save-as", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4.5 0 c -0.277344 0 -0.5 0.222656 -0.5 0.5 v 1 c 0 0.277344 0.222656 0.5 0.5 0.5 h 1 c 0.277344 0 0.5 -0.222656 0.5 -0.5 v -1 c 0 -0.277344 -0.222656 -0.5 -0.5 -0.5 z m 3 0 c -0.277344 0 -0.5 0.222656 -0.5 0.5 v 1 c 0 0.277344 0.222656 0.5 0.5 0.5 h 1 c 0.277344 0 0.5 -0.222656 0.5 -0.5 v -1 c 0 -0.277344 -0.222656 -0.5 -0.5 -0.5 z m 3 0 c -0.277344 0 -0.5 0.222656 -0.5 0.5 v 1 c 0 0.277344 0.222656 0.5 0.5 0.5 h 1 c 0.277344 0 0.5 -0.222656 0.5 -0.5 v -1 c 0 -0.277344 -0.222656 -0.5 -0.5 -0.5 z m -3.5 3 v 6.585938 l -1.292969 -1.292969 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 s -0.519531 0.105469 -0.707031 0.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 l 3 3 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 l 3 -3 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 s -1.023437 -0.390625 -1.414062 0 l -1.292969 1.292969 v -6.585938 z m -6 11 v 2 h 14 v -2 z m 0 0", "key": "1njc72" }]], "aliases": ["document-save-as-symbolic"], "gtkIconName": "document-save-as-symbolic" };
__iconData$6L.node;
const DocumentSaveAs = createAdwaitaIcon(__iconData$6L);

const __iconData$6K = { "name": "document-save", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 c -0.550781 0 -1 0.449219 -1 1 v 8.585938 l -1.292969 -1.292969 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 s -0.519531 0.105469 -0.707031 0.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 l 3 3 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 l 3 -3 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 s -1.023437 -0.390625 -1.414062 0 l -1.292969 1.292969 v -8.585938 c 0 -0.550781 -0.449219 -1 -1 -1 z m -7 14 v 2 h 14 v -2 z m 0 0", "key": "gveezt" }]], "aliases": ["document-save-symbolic"], "gtkIconName": "document-save-symbolic" };
__iconData$6K.node;
const DocumentSave = createAdwaitaIcon(__iconData$6K);

const __iconData$6J = { "name": "document-send", "size": 16, "node": [["path", { "fill": "currentColor", "fill-rule": "evenodd", "d": "m 4 0 c -1.644531 0 -3 1.355469 -3 3 v 10 c 0 1.644531 1.355469 3 3 3 h 1 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 h -1 c -0.570312 0 -1 -0.429688 -1 -1 v -10 c 0 -0.570312 0.429688 -1 1 -1 h 5.585938 l 3.414062 3.414062 v 7.585938 c 0 0.570312 -0.429688 1 -1 1 h -1 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 h 1 c 1.644531 0 3 -1.355469 3 -3 v -8 c 0 -0.265625 -0.105469 -0.519531 -0.292969 -0.707031 l -4 -4 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 4 6 c -0.265625 0 -0.519531 0.105469 -0.707031 0.292969 l -3 3 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 s 1.023437 0.390625 1.414062 0 l 1.292969 -1.292969 v 6.585938 h 2 v -6.585938 l 1.292969 1.292969 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 s 0.390625 -1.023437 0 -1.414062 l -3 -3 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0 0", "key": "o5g3x0" }]], "aliases": ["document-send-symbolic"], "gtkIconName": "document-send-symbolic" };
__iconData$6J.node;
const DocumentSend = createAdwaitaIcon(__iconData$6J);

const __iconData$6I = { "name": "drive-harddisk-ieee1394", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4 0 c -1.644531 0 -3 1.355469 -3 3 v 10 c 0 1.644531 1.355469 3 3 3 h 8 c 1.644531 0 3 -1.355469 3 -3 v -10 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 2 h 8 c 0.570312 0 1 0.429688 1 1 v 9 c 0 0.570312 -0.429688 1 -1 1 h -8 c -0.554688 0 -1 -0.445312 -1 -1 v -9 c 0 -0.554688 0.445312 -1 1 -1 z m 4 1 c -2.210938 0 -4 1.789062 -4 4 v 4 h 4 c 2.5 0 4 -1.789062 4 -4 s -1.789062 -4 -4 -4 z m 0 2 c 1.105469 0 2 0.894531 2 2 s -0.894531 2 -2 2 s -2 -0.894531 -2 -2 s 0.894531 -2 2 -2 z m 0 0", "key": "lak8q3" }]], "aliases": ["drive-harddisk-ieee1394-symbolic"], "gtkIconName": "drive-harddisk-ieee1394-symbolic" };
__iconData$6I.node;
const DriveHarddiskIeee1394 = createAdwaitaIcon(__iconData$6I);

const __iconData$6H = { "name": "drive-harddisk-solidstate", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4 0 c -1.644531 0 -3 1.355469 -3 3 v 10 c 0 1.644531 1.355469 3 3 3 h 8 c 1.644531 0 3 -1.355469 3 -3 v -10 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 2 h 8 c 0.570312 0 1 0.429688 1 1 v 9 c 0 0.570312 -0.429688 1 -1 1 h -8 c -0.554688 0 -1 -0.445312 -1 -1 v -9 c 0 -0.554688 0.445312 -1 1 -1 z m 1 1 v 1 h -1 v 6 h 2 v 1 h 1 v -1 h 1 v 1 h 1 v -1 h 1 v 1 h 1 v -1 h 1 v -6 h -2 v -1 h -1 v 1 h -1 v -1 h -1 v 1 h -1 v -1 z m 0 0", "key": "1nf4nc" }]], "aliases": ["drive-harddisk-solidstate-symbolic"], "gtkIconName": "drive-harddisk-solidstate-symbolic" };
__iconData$6H.node;
const DriveHarddiskSolidstate = createAdwaitaIcon(__iconData$6H);

const __iconData$6G = { "name": "drive-harddisk-system", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4 0 c -1.644531 0 -3 1.355469 -3 3 v 10 c 0 1.644531 1.355469 3 3 3 h 8 c 1.644531 0 3 -1.355469 3 -3 v -10 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 2 h 8 c 0.570312 0 1 0.429688 1 1 v 9 c 0 0.570312 -0.429688 1 -1 1 h -8 c -0.554688 0 -1 -0.445312 -1 -1 v -9 c 0 -0.554688 0.445312 -1 1 -1 z m 4 1 c -2.210938 0 -4 1.789062 -4 4 v 4 h 4 c 2.5 0 4 -1.789062 4 -4 s -1.789062 -4 -4 -4 z m 0 2 c 1.105469 0 2 0.894531 2 2 s -0.894531 2 -2 2 s -2 -0.894531 -2 -2 s 0.894531 -2 2 -2 z m 0 0", "key": "lak8q3" }]], "aliases": ["drive-harddisk-system-symbolic"], "gtkIconName": "drive-harddisk-system-symbolic" };
__iconData$6G.node;
const DriveHarddiskSystem = createAdwaitaIcon(__iconData$6G);

const __iconData$6F = { "name": "drive-harddisk-usb", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8.5 0 h -1 l -2 4 h 1.5 v 5 h -3 v -1.269531 c 0.617188 -0.359375 1 -1.015625 1 -1.730469 c 0 -1.105469 -0.894531 -2 -2 -2 s -2 0.894531 -2 2 c 0 0.714844 0.382812 1.375 1 1.730469 v 1.269531 c 0 2 2 2 2 2 h 3 v 1.269531 c -0.617188 0.359375 -1 1.015625 -1 1.730469 c 0 1.105469 0.894531 2 2 2 s 2 -0.894531 2 -2 c 0 -0.714844 -0.382812 -1.375 -1 -1.730469 v -1.269531 h 3 s 2 0 2 -2 v -1 s 1.125 -0.1875 1 -1 v -2 c 0.125 -1.125 -1 -1 -1 -1 h -2 c -1.0625 0 -1 1 -1 1 v 2 c 0 1 1 1 1 1 v 1 h -3 v -5 h 1.5 z m 0 0", "key": "11q8ey" }]], "aliases": ["drive-harddisk-usb-symbolic"], "gtkIconName": "drive-harddisk-usb-symbolic" };
__iconData$6F.node;
const DriveHarddiskUsb = createAdwaitaIcon(__iconData$6F);

const __iconData$6E = { "name": "drive-harddisk", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4 0 c -1.644531 0 -3 1.355469 -3 3 v 10 c 0 1.644531 1.355469 3 3 3 h 8 c 1.644531 0 3 -1.355469 3 -3 v -10 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 2 h 8 c 0.570312 0 1 0.429688 1 1 v 9 c 0 0.570312 -0.429688 1 -1 1 h -8 c -0.554688 0 -1 -0.445312 -1 -1 v -9 c 0 -0.554688 0.445312 -1 1 -1 z m 4 1 c -2.210938 0 -4 1.789062 -4 4 v 4 h 4 c 2.5 0 4 -1.789062 4 -4 s -1.789062 -4 -4 -4 z m 0 2 c 1.105469 0 2 0.894531 2 2 s -0.894531 2 -2 2 s -2 -0.894531 -2 -2 s 0.894531 -2 2 -2 z m 0 0", "key": "lak8q3" }]], "aliases": ["drive-harddisk-symbolic"], "gtkIconName": "drive-harddisk-symbolic" };
__iconData$6E.node;
const DriveHarddisk = createAdwaitaIcon(__iconData$6E);

const __iconData$6D = { "name": "drive-multidisk", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4 0 c -1.644531 0 -3 1.355469 -3 3 v 6 c 0 1.644531 1.355469 3 3 3 h 5 c 1.644531 0 3 -1.355469 3 -3 v -6 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 2 h 5 c 0.570312 0 0.886719 0.441406 1 1 v 5 c 0 0.472656 -0.429688 1 -1 1 h -5 c -0.554688 0 -1 -0.445312 -1 -1 v -5 c 0 -0.554688 0.445312 -1 1 -1 z m 2.503906 1.003906 c -1.375 0 -2.515625 1.128906 -2.5 2.5 l -0.003906 2.496094 h 2.5 c 1.371094 0 2.5 -1.125 2.5 -2.496094 c 0 -1.375 -1.128906 -2.5 -2.5 -2.5 z m 6.496094 1.175782 v 7.820312 c 0 0.472656 -0.429688 1 -1 1 h -8 c 0 1.644531 1.355469 3 3 3 h 5 c 1.644531 0 3 -1.355469 3 -3 v -6 c 0 -1.292969 -0.839844 -2.40625 -2 -2.820312 z m -6.492188 0.320312 c 0.550782 0 1 0.449219 1 1 s -0.449218 1 -1 1 c -0.554687 0 -1 -0.449219 -1 -1 s 0.445313 -1 1 -1 z m 0 0", "key": "lhrk25" }]], "aliases": ["drive-multidisk-symbolic"], "gtkIconName": "drive-multidisk-symbolic" };
__iconData$6D.node;
const DriveMultidisk = createAdwaitaIcon(__iconData$6D);

const __iconData$6C = { "name": "drive-optical", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 0 c -1.644531 0 -3 1.355469 -3 3 v 6 c 0 1.292969 0.839844 2.40625 2 2.824219 v -0.824219 c 0 -0.101562 0.015625 -0.199219 0.042969 -0.292969 c 0.351562 2.972657 2.890625 5.292969 5.957031 5.292969 s 5.605469 -2.320312 5.957031 -5.292969 c 0.027344 0.09375 0.042969 0.191407 0.042969 0.292969 v 0.824219 c 1.160156 -0.417969 2 -1.53125 2 -2.824219 v -6 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 2 h 10 c 0.570312 0 1 0.429688 1 1 v 4 c 0 0.554688 -0.445312 1 -1 1 h -10 c -0.554688 0 -1 -0.445312 -1 -1 v -4 c 0 -0.570312 0.5 -1 1 -1 z m 0.5 4 c -0.277344 0 -0.5 0.222656 -0.5 0.5 s 0.222656 0.5 0.5 0.5 h 9 c 0.277344 0 0.5 -0.222656 0.5 -0.5 s -0.222656 -0.5 -0.5 -0.5 z m 0 4 h 2.25 c 0 1.242188 1.007812 2.25 2.25 2.25 s 2.25 -1.007812 2.25 -2.25 h 2.25 c 0 2.484375 -2.015625 4.5 -4.5 4.5 s -4.5 -2.015625 -4.5 -4.5 z m 3 0 h 0.75 c 0 0.414062 0.335938 0.75 0.75 0.75 s 0.75 -0.335938 0.75 -0.75 h 0.75 c 0 0.828125 -0.671875 1.5 -1.5 1.5 s -1.5 -0.671875 -1.5 -1.5 z m 0 0", "key": "10smk8" }]], "aliases": ["drive-optical-symbolic"], "gtkIconName": "drive-optical-symbolic" };
__iconData$6C.node;
const DriveOptical = createAdwaitaIcon(__iconData$6C);

const __iconData$6B = { "name": "drive-removable-media", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 1 c -1.644531 0 -3 1.355469 -3 3 v 8 c 0 1.644531 1.355469 3 3 3 h 10 c 1.644531 0 3 -1.355469 3 -3 v -8 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 2 h 10 c 0.570312 0 1 0.429688 1 1 v 7 c 0 0.554688 -0.445312 1 -1 1 h -10 c -0.554688 0 -1 -0.445312 -1 -1 v -7 c 0 -0.570312 0.5 -1 1 -1 z m 0.5 7 c -0.277344 0 -0.5 0.222656 -0.5 0.5 s 0.222656 0.5 0.5 0.5 h 9 c 0.277344 0 0.5 -0.222656 0.5 -0.5 s -0.222656 -0.5 -0.5 -0.5 z m 0 0", "key": "9iclcl" }]], "aliases": ["drive-removable-media-symbolic"], "gtkIconName": "drive-removable-media-symbolic" };
__iconData$6B.node;
const DriveRemovableMedia = createAdwaitaIcon(__iconData$6B);

const __iconData$6A = { "name": "edit-clear-all", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 2 0 c -1.109375 0 -2 0.890625 -2 2 v 6 c 0 1.109375 0.890625 2 2 2 v -8 h 8 c 0 -1.109375 -0.890625 -2 -2 -2 z m 0 0", "key": "1a0qj1" }], ["path", { "fill": "currentColor", "d": "m 8 6 c -1.109375 0 -2 0.890625 -2 2 v 6 c 0 1.109375 0.890625 2 2 2 h 6 c 1.109375 0 2 -0.890625 2 -2 v -6 c 0 -1.109375 -0.890625 -2 -2 -2 z m 0.003906 2 h 1 h 0.03125 c 0.253906 0.011719 0.507813 0.128906 0.6875 0.3125 l 1.28125 1.28125 l 1.308594 -1.28125 c 0.265625 -0.230469 0.445312 -0.304688 0.6875 -0.3125 h 1 v 1 c 0 0.285156 -0.035156 0.550781 -0.25 0.75 l -1.28125 1.28125 l 1.25 1.25 c 0.1875 0.1875 0.28125 0.453125 0.28125 0.71875 v 1 h -1 c -0.265625 0 -0.53125 -0.09375 -0.71875 -0.28125 l -1.28125 -1.28125 l -1.28125 1.28125 c -0.1875 0.1875 -0.453125 0.28125 -0.71875 0.28125 h -0.996094 v -1 c 0 -0.265625 0.09375 -0.53125 0.28125 -0.71875 l 1.277344 -1.25 l -1.277344 -1.28125 c -0.210937 -0.195312 -0.304687 -0.46875 -0.28125 -0.75 z m 0 0", "key": "1rp2u5" }], ["path", { "fill": "currentColor", "d": "m 5 3 c -1.109375 0 -2 0.890625 -2 2 v 6 c 0 1.109375 0.890625 2 2 2 v -8 h 8 c 0 -1.109375 -0.890625 -2 -2 -2 z m 0 0", "key": "rq57wx" }]], "aliases": ["edit-clear-all-symbolic"], "gtkIconName": "edit-clear-all-symbolic" };
__iconData$6A.node;
const EditClearAll = createAdwaitaIcon(__iconData$6A);

const __iconData$6z = { "name": "edit-clear-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 9 2 c 0.832031 0 1.558594 0.34375 2.292969 0.78125 s 1.464843 1.003906 2.128906 1.597656 c 0.660156 0.597656 1.253906 1.222656 1.707031 1.796875 c 0.226563 0.289063 0.417969 0.5625 0.570313 0.835938 c 0.152343 0.277343 0.300781 0.53125 0.300781 0.988281 s -0.148438 0.710938 -0.300781 0.984375 c -0.152344 0.277344 -0.34375 0.550781 -0.570313 0.835937 c -0.453125 0.578126 -1.046875 1.203126 -1.707031 1.796876 c -0.664063 0.597656 -1.394531 1.164062 -2.128906 1.601562 s -1.460938 0.78125 -2.292969 0.78125 h -6 c -1.644531 0 -3 -1.355469 -3 -3 v -6 c 0 -1.644531 1.355469 -3 3 -3 z m -1 3 c -0.265625 0 -0.519531 0.105469 -0.707031 0.292969 l -1.292969 1.292969 l -1.292969 -1.292969 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 s -0.519531 0.105469 -0.707031 0.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 l 1.292969 1.292969 l -1.292969 1.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 s 1.023437 0.390625 1.414062 0 l 1.292969 -1.292969 l 1.292969 1.292969 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 s 0.390625 -1.023437 0 -1.414062 l -1.292969 -1.292969 l 1.292969 -1.292969 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0 0", "key": "1skc6l" }]], "aliases": ["edit-clear-rtl-symbolic"], "gtkIconName": "edit-clear-rtl-symbolic" };
__iconData$6z.node;
const EditClearRtl = createAdwaitaIcon(__iconData$6z);

const __iconData$6y = { "name": "edit-clear", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 2 c -0.832031 0 -1.558594 0.34375 -2.292969 0.78125 s -1.464843 1.003906 -2.128906 1.597656 c -0.660156 0.597656 -1.253906 1.222656 -1.707031 1.796875 c -0.226563 0.289063 -0.417969 0.5625 -0.570313 0.835938 c -0.152343 0.277343 -0.300781 0.53125 -0.300781 0.988281 s 0.148438 0.710938 0.300781 0.984375 c 0.152344 0.277344 0.34375 0.550781 0.570313 0.835937 c 0.453125 0.578126 1.046875 1.203126 1.707031 1.796876 c 0.664063 0.597656 1.394531 1.164062 2.128906 1.601562 s 1.460938 0.78125 2.292969 0.78125 h 6 c 1.644531 0 3 -1.355469 3 -3 v -6 c 0 -1.644531 -1.355469 -3 -3 -3 z m 1 3 c 0.265625 0 0.519531 0.105469 0.707031 0.292969 l 1.292969 1.292969 l 1.292969 -1.292969 c 0.1875 -0.1875 0.441406 -0.292969 0.707031 -0.292969 s 0.519531 0.105469 0.707031 0.292969 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 l -1.292969 1.292969 l 1.292969 1.292969 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 s -1.023437 0.390625 -1.414062 0 l -1.292969 -1.292969 l -1.292969 1.292969 c -0.390625 0.390625 -1.023437 0.390625 -1.414062 0 s -0.390625 -1.023437 0 -1.414062 l 1.292969 -1.292969 l -1.292969 -1.292969 c -0.390625 -0.390625 -0.390625 -1.023437 0 -1.414062 c 0.1875 -0.1875 0.441406 -0.292969 0.707031 -0.292969 z m 0 0", "key": "1b7qq4" }]], "aliases": ["edit-clear-symbolic"], "gtkIconName": "edit-clear-symbolic" };
__iconData$6y.node;
const EditClear = createAdwaitaIcon(__iconData$6y);

const __iconData$6x = { "name": "edit-copy", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 0 3 c 0 -1.644531 1.355469 -3 3 -3 h 5 c 1.644531 0 3 1.355469 3 3 c 0 0.550781 -0.449219 1 -1 1 s -1 -0.449219 -1 -1 c 0 -0.570312 -0.429688 -1 -1 -1 h -5 c -0.570312 0 -1 0.429688 -1 1 v 5 c 0 0.570312 0.429688 1 1 1 c 0.550781 0 1 0.449219 1 1 s -0.449219 1 -1 1 c -1.644531 0 -3 -1.355469 -3 -3 z m 5 5 c 0 -1.644531 1.355469 -3 3 -3 h 5 c 1.644531 0 3 1.355469 3 3 v 5 c 0 1.644531 -1.355469 3 -3 3 h -5 c -1.644531 0 -3 -1.355469 -3 -3 z m 2 0 v 5 c 0 0.570312 0.429688 1 1 1 h 5 c 0.570312 0 1 -0.429688 1 -1 v -5 c 0 -0.570312 -0.429688 -1 -1 -1 h -5 c -0.570312 0 -1 0.429688 -1 1 z m 0 0", "key": "kgaah8" }]], "aliases": ["edit-copy-symbolic"], "gtkIconName": "edit-copy-symbolic" };
__iconData$6x.node;
const EditCopy = createAdwaitaIcon(__iconData$6x);

const __iconData$6w = { "name": "edit-cut", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 12.066406 1 c -0.085937 -0.003906 -0.171875 0 -0.257812 0.015625 c -0.261719 0.054687 -0.492188 0.207031 -0.636719 0.425781 l -2.398437 3.558594 h 2.414062 l 1.640625 -2.441406 c 0.148437 -0.21875 0.203125 -0.488282 0.152344 -0.75 c -0.050781 -0.261719 -0.203125 -0.492188 -0.421875 -0.640625 c -0.144532 -0.097657 -0.316406 -0.152344 -0.492188 -0.167969 z m -9.066406 1 c -1.648438 0 -3 1.351562 -3 3 s 1.351562 3 3 3 h 3.753906 l -1.585937 2.355469 l -0.652344 0.96875 l -0.0625 0.097656 c -0.003906 0.003906 -0.007813 0.007813 -0.007813 0.011719 c -0.28125 0.457031 -0.445312 0.992187 -0.445312 1.566406 c 0 1.648438 1.351562 3 3 3 s 3 -1.351562 3 -3 c 0 -1.386719 -0.960938 -2.566406 -2.25 -2.902344 l 1.417969 -2.097656 h 5.832031 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 h -9.171875 c 0.109375 -0.3125 0.171875 -0.648438 0.171875 -1 c 0 -1.648438 -1.351562 -3 -3 -3 z m 0 1.5 c 0.050781 0 0.101562 0.003906 0.152344 0.007812 c 0.042968 0.003907 0.082031 0.011719 0.121094 0.019532 c 0.046874 0.007812 0.09375 0.015625 0.136718 0.03125 c 0.503906 0.136718 0.894532 0.527344 1.03125 1.03125 c 0.015625 0.042968 0.023438 0.089844 0.03125 0.136718 c 0.007813 0.039063 0.015625 0.078126 0.019532 0.121094 v 0.003906 c 0.003906 0.046876 0.007812 0.097657 0.007812 0.148438 c 0 0.132812 -0.015625 0.257812 -0.050781 0.382812 v 0.011719 c -0.035157 0.125 -0.085938 0.246094 -0.148438 0.355469 c -0.054687 0.089844 -0.113281 0.171875 -0.179687 0.25 h -0.011719 c -0.285156 0.316406 -0.6875 0.496094 -1.109375 0.5 c -0.136719 0 -0.265625 -0.019531 -0.390625 -0.050781 c -0.519531 -0.136719 -0.921875 -0.539063 -1.058594 -1.0625 c -0.03125 -0.121094 -0.050781 -0.25 -0.050781 -0.386719 s 0.019531 -0.265625 0.050781 -0.386719 c 0.136719 -0.523437 0.539063 -0.925781 1.058594 -1.0625 c 0.125 -0.03125 0.253906 -0.050781 0.390625 -0.050781 z m 4 8 c 0.050781 0 0.101562 0.003906 0.152344 0.007812 c 0.042968 0.003907 0.082031 0.011719 0.121094 0.019532 c 0.046874 0.007812 0.09375 0.015625 0.136718 0.03125 c 0.503906 0.136718 0.894532 0.527344 1.03125 1.03125 c 0.015625 0.042968 0.023438 0.089844 0.03125 0.136718 c 0.007813 0.039063 0.015625 0.078126 0.019532 0.121094 v 0.003906 c 0.003906 0.046876 0.007812 0.097657 0.007812 0.148438 c 0 0.136719 -0.019531 0.265625 -0.050781 0.386719 c -0.136719 0.523437 -0.539063 0.925781 -1.058594 1.0625 c -0.125 0.03125 -0.253906 0.050781 -0.390625 0.050781 s -0.265625 -0.019531 -0.390625 -0.050781 c -0.519531 -0.136719 -0.921875 -0.539063 -1.058594 -1.0625 c -0.03125 -0.121094 -0.050781 -0.25 -0.050781 -0.386719 c 0 -0.019531 0 -0.039062 0.003906 -0.054688 c 0 -0.003906 0.003906 -0.003906 0.003906 -0.003906 c 0.035157 -0.71875 0.570313 -1.308594 1.28125 -1.414062 l 0.011719 -0.015625 c 0.0625 -0.007813 0.128907 -0.011719 0.199219 -0.011719 z m 0 0", "key": "t5m2iv" }]], "aliases": ["edit-cut-symbolic"], "gtkIconName": "edit-cut-symbolic" };
__iconData$6w.node;
const EditCut = createAdwaitaIcon(__iconData$6w);

const __iconData$6v = { "name": "edit-delete", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 c -4.410156 0 -8 3.589844 -8 8 s 3.589844 8 8 8 s 8 -3.589844 8 -8 s -3.589844 -8 -8 -8 z m 0 2 c 3.332031 0 6 2.667969 6 6 s -2.667969 6 -6 6 s -6 -2.667969 -6 -6 s 2.667969 -6 6 -6 z m -2.03125 2.96875 c -0.265625 0 -0.519531 0.105469 -0.707031 0.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 l 1.292969 1.292969 l -1.292969 1.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 s 1.023437 0.390625 1.414062 0 l 1.292969 -1.292969 l 1.292969 1.292969 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 s 0.390625 -1.023437 0 -1.414062 l -1.292969 -1.292969 l 1.292969 -1.292969 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 s -0.519531 0.105469 -0.707031 0.292969 l -1.292969 1.292969 l -1.292969 -1.292969 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0 0", "key": "11d5vq" }]], "aliases": ["edit-delete-symbolic"], "gtkIconName": "edit-delete-symbolic" };
__iconData$6v.node;
const EditDelete = createAdwaitaIcon(__iconData$6v);

const __iconData$6u = { "name": "edit-find-replace", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 12.550781 3 c -0.488281 0.003906 -0.988281 0.195312 -1.429687 0.636719 l -7.625 7.625 c -0.316406 0.316406 -0.496094 0.75 -0.496094 1.199219 v 2.539062 h 2.539062 c 0.449219 0 0.882813 -0.179688 1.199219 -0.496094 l 7.625 -7.625 c 1.515625 -1.511718 0.066407 -3.714844 -1.601562 -3.871094 c -0.070313 -0.007812 -0.140625 -0.007812 -0.210938 -0.007812 z m -1.503906 3.054688 l 0.898437 0.898437 l -5.980468 5.980469 l -0.898438 -0.898438 z m 0 0", "key": "1kvtcl" }], ["path", { "fill": "currentColor", "d": "m 6.5 0 c -3.578125 0 -6.5 2.921875 -6.5 6.5 c 0 1.800781 0.742188 3.4375 1.9375 4.617188 l 1.40625 -1.410157 c -0.828125 -0.8125 -1.34375 -1.945312 -1.34375 -3.207031 c 0 -2.496094 2.003906 -4.5 4.5 -4.5 c 1.261719 0 2.394531 0.515625 3.207031 1.34375 l 1.410157 -1.410156 c -1.179688 -1.191406 -2.816407 -1.933594 -4.617188 -1.933594 z m 5.6875 10.757812 l -1.417969 1.421876 l 2.503907 2.507812 c 0.957031 0.9375 2.363281 -0.5 1.40625 -1.4375 z m 0 0", "key": "1dekue" }]], "aliases": ["edit-find-replace-symbolic"], "gtkIconName": "edit-find-replace-symbolic" };
__iconData$6u.node;
const EditFindReplace = createAdwaitaIcon(__iconData$6u);

const __iconData$6t = { "name": "edit-find", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 6.5 0 c -3.578125 0 -6.5 2.921875 -6.5 6.5 s 2.921875 6.5 6.5 6.5 c 1.429688 0 2.753906 -0.46875 3.828125 -1.257812 l 2.945313 2.945312 c 0.957031 0.9375 2.363281 -0.5 1.40625 -1.4375 l -2.929688 -2.929688 c 0.785156 -1.074218 1.25 -2.394531 1.25 -3.820312 c 0 -3.578125 -2.921875 -6.5 -6.5 -6.5 z m 0 2 c 2.496094 0 4.5 2.003906 4.5 4.5 s -2.003906 4.5 -4.5 4.5 s -4.5 -2.003906 -4.5 -4.5 s 2.003906 -4.5 4.5 -4.5 z m 0 0", "key": "bp88cl" }]], "aliases": ["edit-find-symbolic"], "gtkIconName": "edit-find-symbolic" };
__iconData$6t.node;
const EditFind = createAdwaitaIcon(__iconData$6t);

const __iconData$6s = { "name": "edit-paste", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 0 c -0.554688 0 -1 0.445312 -1 1 h -2 c -1.644531 0 -3 1.355469 -3 3 v 9 c 0 1.644531 1.355469 3 3 3 h 8 c 1.644531 0 3 -1.355469 3 -3 v -9 c 0 -1.644531 -1.355469 -3 -3 -3 h -2 c 0 -0.554688 -0.445312 -1 -1 -1 z m -3 3 h 1 v 1 c 0 0.554688 0.445312 1 1 1 h 4 c 0.554688 0 1 -0.445312 1 -1 v -1 h 1 c 0.570312 0 1 0.429688 1 1 v 9 c 0 0.570312 -0.429688 1 -1 1 h -8 c -0.570312 0 -1 -0.429688 -1 -1 v -9 c 0 -0.570312 0.429688 -1 1 -1 z m 0 0", "key": "tgucs" }]], "aliases": ["edit-paste-symbolic"], "gtkIconName": "edit-paste-symbolic" };
__iconData$6s.node;
const EditPaste = createAdwaitaIcon(__iconData$6s);

const __iconData$6r = { "name": "edit-redo", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 11 2 c 0.265625 0 0.519531 0.105469 0.707031 0.292969 l 4 4 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 l -4 4 c -0.390625 0.390625 -1.023437 0.390625 -1.414062 0 s -0.390625 -1.023437 0 -1.414062 l 2.292969 -2.292969 h -8.585938 c -1.117188 0 -2 0.882812 -2 2 s 0.882812 2 2 2 c 0.550781 0 1 0.449219 1 1 s -0.449219 1 -1 1 c -2.195312 0 -4 -1.800781 -4 -4 s 1.804688 -4 4 -4 h 8.585938 l -2.292969 -2.292969 c -0.390625 -0.390625 -0.390625 -1.023437 0 -1.414062 c 0.1875 -0.1875 0.441406 -0.292969 0.707031 -0.292969 z m 0 0", "key": "wkmu7l" }]], "aliases": ["edit-redo-symbolic"], "gtkIconName": "edit-redo-symbolic" };
__iconData$6r.node;
const EditRedo = createAdwaitaIcon(__iconData$6r);

const __iconData$6q = { "name": "edit-select-all", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 0 0 v 3 h 3 v -3 z m 4 0 v 2 h 3 v -2 z m 4 0 v 2 h 4 v -2 z m 5 0 v 3 h 3 v -3 z m -13 4 v 4 h 2 v -4 z m 14 0 v 3 h 2 v -3 z m 0 4 v 4 h 2 v -4 z m -14 1 v 3 h 2 v -3 z m 0 4 v 3 h 3 v -3 z m 13 0 v 3 h 3 v -3 z m -9 1 v 2 h 4 v -2 z m 5 0 v 2 h 3 v -2 z m 0 0", "key": "1hq5yk" }], ["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 5 4 c -0.554688 0 -1 0.445312 -1 1 v 1 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -1 c 0 -0.554688 -0.445312 -1 -1 -1 z m 4 0 c -0.554688 0 -1 0.445312 -1 1 v 2 c 0 0.554688 0.445312 1 1 1 h 2 c 0.554688 0 1 -0.445312 1 -1 v -2 c 0 -0.554688 -0.445312 -1 -1 -1 z m -4 4 c -0.554688 0 -1 0.445312 -1 1 v 2 c 0 0.554688 0.445312 1 1 1 h 2 c 0.554688 0 1 -0.445312 1 -1 v -2 c 0 -0.554688 -0.445312 -1 -1 -1 z m 5 1 c -0.554688 0 -1 0.445312 -1 1 v 1 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -1 c 0 -0.554688 -0.445312 -1 -1 -1 z m 0 0", "key": "1p2tql" }]], "aliases": ["edit-select-all-symbolic"], "gtkIconName": "edit-select-all-symbolic" };
__iconData$6q.node;
const EditSelectAll = createAdwaitaIcon(__iconData$6q);

const __iconData$6p = { "name": "edit-select", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 0 5 v 6 h 1 v -0.007812 c 0.265625 0.003906 0.519531 -0.101563 0.707031 -0.285157 l 2 -2 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 l -2 -2 c -0.1875 -0.183594 -0.441406 -0.289063 -0.707031 -0.285157 v -0.007812 z m 0 0", "key": "19kkj4" }], ["path", { "fill": "currentColor", "d": "m 16 5 v 6 h -1 v -0.007812 c -0.265625 0.003906 -0.519531 -0.101563 -0.707031 -0.285157 l -2 -2 c -0.390625 -0.390625 -0.390625 -1.023437 0 -1.414062 l 2 -2 c 0.1875 -0.183594 0.441406 -0.289063 0.707031 -0.289063 v -0.003906 z m 0 0", "key": "nz89bd" }]], "aliases": ["edit-select-symbolic"], "gtkIconName": "edit-select-symbolic" };
__iconData$6p.node;
const EditSelect = createAdwaitaIcon(__iconData$6p);

const __iconData$6o = { "name": "edit-undo", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 5 2 c -0.265625 0 -0.519531 0.105469 -0.707031 0.292969 l -4 4 c -0.3906252 0.390625 -0.3906252 1.023437 0 1.414062 l 4 4 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 s 0.390625 -1.023437 0 -1.414062 l -2.292969 -2.292969 h 8.585938 c 1.117188 0 2 0.882812 2 2 s -0.882812 2 -2 2 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 c 2.199219 0 4 -1.800781 4 -4 s -1.800781 -4 -4 -4 h -8.585938 l 2.292969 -2.292969 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0 0", "key": "d458tf" }]], "aliases": ["edit-undo-symbolic"], "gtkIconName": "edit-undo-symbolic" };
__iconData$6o.node;
const EditUndo = createAdwaitaIcon(__iconData$6o);

const __iconData$6n = { "name": "emblem-important", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 c -4.40625 0 -8 3.59375 -8 8 s 3.59375 8 8 8 s 8 -3.59375 8 -8 s -3.59375 -8 -8 -8 z m 1 3 v 6 c 0 0.550781 -0.449219 1 -1 1 s -1 -0.449219 -1 -1 v -6 z m -1 8 c 0.550781 0 1 0.449219 1 1 s -0.449219 1 -1 1 s -1 -0.449219 -1 -1 s 0.449219 -1 1 -1 z m 0 0", "key": "196lij" }]], "aliases": ["emblem-important-symbolic"], "gtkIconName": "emblem-important-symbolic" };
__iconData$6n.node;
const EmblemImportant = createAdwaitaIcon(__iconData$6n);

const __iconData$6m = { "name": "emblem-system", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 c -0.550781 0 -1 0.449219 -1 1 v 0.238281 c 0 0.464844 -0.378906 0.902344 -0.820312 1.046875 c -0.023438 0.007813 -0.042969 0.011719 -0.0625 0.019532 c -0.445313 0.148437 -1.007813 0.015624 -1.28125 -0.359376 l -0.140626 -0.195312 c -0.15625 -0.214844 -0.390624 -0.359375 -0.652343 -0.398438 c -0.261719 -0.042968 -0.53125 0.019532 -0.742188 0.175782 c -0.449219 0.324218 -0.550781 0.949218 -0.222656 1.398437 l 0.140625 0.199219 c 0.277344 0.375 0.226562 0.953125 -0.050781 1.328125 c -0.011719 0.015625 -0.023438 0.035156 -0.035157 0.050781 c -0.273437 0.378906 -0.804687 0.601563 -1.25 0.457032 l -0.230468 -0.074219 c -0.523438 -0.171875 -1.089844 0.117187 -1.257813 0.640625 c -0.171875 0.527344 0.113281 1.089844 0.640625 1.261718 l 0.222656 0.074219 c 0.445313 0.144531 0.738282 0.636719 0.75 1.101563 v 0.070312 c 0.015626 0.464844 -0.304687 0.960938 -0.746093 1.105469 l -0.226563 0.070313 c -0.527344 0.171874 -0.8125 0.738281 -0.640625 1.261718 c 0.167969 0.523438 0.734375 0.8125 1.257813 0.640625 l 0.230468 -0.074219 c 0.445313 -0.144531 0.976563 0.078126 1.25 0.457032 c 0.011719 0.015625 0.027344 0.035156 0.039063 0.050781 c 0.277344 0.375 0.324219 0.953125 0.050781 1.328125 l -0.144531 0.203125 c -0.324219 0.445313 -0.226563 1.070313 0.222656 1.394531 c 0.445313 0.324219 1.070313 0.226563 1.394531 -0.21875 l 0.144532 -0.199218 c 0.273437 -0.378907 0.835937 -0.507813 1.277344 -0.359376 c 0.019531 0.007813 0.042968 0.011719 0.0625 0.019532 c 0.445312 0.140625 0.820312 0.578125 0.820312 1.046875 v 0.238281 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -0.238281 c 0 -0.46875 0.378906 -0.90625 0.820312 -1.046875 c 0.023438 -0.007813 0.042969 -0.015625 0.066407 -0.023438 c 0.441406 -0.144531 1.003906 -0.015625 1.277343 0.363282 l 0.144532 0.199218 c 0.324218 0.445313 0.949218 0.542969 1.394531 0.21875 c 0.445313 -0.324218 0.546875 -0.949218 0.222656 -1.394531 l -0.148437 -0.203125 c -0.273438 -0.375 -0.226563 -0.953125 0.050781 -1.328125 c 0.015625 -0.015625 0.027344 -0.035156 0.039063 -0.050781 c 0.273437 -0.378906 0.804687 -0.601563 1.25 -0.457032 l 0.234374 0.078126 c 0.523438 0.167968 1.085938 -0.121094 1.257813 -0.644532 c 0.171875 -0.523437 -0.117187 -1.089844 -0.640625 -1.257812 l -0.230469 -0.074219 c -0.445312 -0.144531 -0.734375 -0.640625 -0.746093 -1.105469 c 0 -0.023437 0 -0.046875 0 -0.070312 c -0.015626 -0.464844 0.300781 -0.957032 0.746093 -1.101563 l 0.230469 -0.074219 c 0.523438 -0.171874 0.8125 -0.734374 0.640625 -1.261718 c -0.171875 -0.523438 -0.734375 -0.8125 -1.257813 -0.640625 l -0.230468 0.074219 c -0.445313 0.144531 -0.980469 -0.078126 -1.253906 -0.457032 c -0.011719 -0.015625 -0.023438 -0.035156 -0.035157 -0.050781 c -0.277343 -0.375 -0.324219 -0.953125 -0.050781 -1.328125 l 0.144531 -0.199219 c 0.324219 -0.445312 0.226563 -1.074219 -0.222656 -1.398437 c -0.214844 -0.15625 -0.480469 -0.21875 -0.742187 -0.179688 c -0.265626 0.042969 -0.5 0.1875 -0.652344 0.402344 l -0.144532 0.195312 c -0.273437 0.378907 -0.835937 0.507813 -1.28125 0.363282 c -0.019531 -0.007813 -0.039062 -0.015625 -0.0625 -0.023438 c -0.441406 -0.140625 -0.820312 -0.578125 -0.820312 -1.046875 v -0.238281 c 0 -0.550781 -0.449219 -1 -1 -1 z m 0 4 c 0.871094 0 1.675781 0.273438 2.332031 0.742188 c 0.003907 0.007812 0.011719 0.015624 0.019531 0.023437 c 0.011719 0.003906 0.019532 0.007813 0.03125 0.015625 c 0.660157 0.484375 1.160157 1.171875 1.421876 1.976562 v 0.007813 s 0.003906 0.003906 0.003906 0.007813 c 0.292968 0.851562 0.15625 1.65625 0 2.457031 c 0 0 -0.003906 0.003906 -0.003906 0.007812 v 0.003907 c -0.261719 0.800781 -0.757813 1.488281 -1.414063 1.976562 c -0.015625 0.003906 -0.027344 0.011719 -0.039063 0.019531 c -0.007812 0.003907 -0.015624 0.011719 -0.019531 0.019531 c -0.65625 0.46875 -1.460937 0.742188 -2.332031 0.742188 c -0.855469 0 -1.644531 -0.265625 -2.289062 -0.714844 c -0.019532 -0.015625 -0.042969 -0.035156 -0.0625 -0.046875 c -0.011719 -0.007812 -0.023438 -0.015625 -0.035157 -0.019531 c -0.652343 -0.484375 -1.148437 -1.160156 -1.40625 -1.945312 c -0.003906 -0.015626 -0.007812 -0.023438 -0.011719 -0.035157 c -0.003906 -0.007812 -0.007812 -0.015625 -0.011718 -0.019531 c -0.285156 -0.847656 -0.148438 -1.644531 0 -2.4375 c 0.003906 -0.007812 0.007812 -0.011719 0.011718 -0.019531 c 0.003907 -0.011719 0.007813 -0.023438 0.011719 -0.039063 c 0.261719 -0.785156 0.757813 -1.460937 1.414063 -1.945312 c 0.007812 -0.003906 0.019531 -0.007813 0.027344 -0.015625 c 0.019531 -0.011719 0.042968 -0.03125 0.058593 -0.046875 c 0.648438 -0.449219 1.4375 -0.714844 2.292969 -0.714844 z m 0 0", "key": "1qsqp5" }]], "aliases": ["emblem-system-symbolic"], "gtkIconName": "emblem-system-symbolic" };
__iconData$6m.node;
const EmblemSystem = createAdwaitaIcon(__iconData$6m);

const __iconData$6l = { "name": "emoji-activities", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 c -4.40625 0 -8 3.59375 -8 8 s 3.59375 8 8 8 s 8 -3.59375 8 -8 s -3.59375 -8 -8 -8 z m 0 2 c 0.039062 0 0.074219 0.003906 0.113281 0.007812 c -0.335937 1.648438 0.167969 3.394532 1.429688 4.601563 c 1.203125 1.15625 2.875 1.601563 4.453125 1.285156 c 0 0.035157 0.003906 0.070313 0.003906 0.105469 c 0 3.324219 -2.675781 6 -6 6 c -0.039062 0 -0.078125 -0.003906 -0.113281 -0.007812 c 0.320312 -1.582032 -0.128907 -3.257813 -1.28125 -4.460938 c -0.722657 -0.746094 -1.636719 -1.234375 -2.609375 -1.429688 c -0.246094 -0.050781 -0.492188 -0.082031 -0.742188 -0.09375 c -0.414062 -0.023437 -0.835937 0.011719 -1.246094 0.097657 c -0.003906 -0.035157 -0.007812 -0.070313 -0.007812 -0.105469 c 0 -3.324219 2.675781 -6 6 -6 z m 1.113281 0.105469 c 2.429688 0.453125 4.332031 2.355469 4.78125 4.785156 c -1.289062 0.296875 -2.671875 -0.050781 -3.660156 -1.003906 c -1.035156 -0.988281 -1.433594 -2.429688 -1.121094 -3.78125 z m -5.90625 6.898437 c 0.992188 0.050782 1.953125 0.472656 2.675781 1.222656 c 0.949219 0.988282 1.304688 2.371094 1.007813 3.667969 c -2.433594 -0.453125 -4.335937 -2.355469 -4.785156 -4.789062 c 0.363281 -0.082031 0.734375 -0.121094 1.101562 -0.101563 z m 0 0", "key": "su6g8c" }]], "aliases": ["emoji-activities-symbolic"], "gtkIconName": "emoji-activities-symbolic" };
__iconData$6l.node;
const EmojiActivities = createAdwaitaIcon(__iconData$6l);

const __iconData$6k = { "name": "emoji-body", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1 7 v 8 h 11 c 0.4375 0 0.875 -0.375 1 -1 l 1 -5.96875 v -2.03125 c 0 -0.535156 -0.40625 -1 -1 -1 h -3.898438 l 0.898438 -3.5 c 0.226562 -0.839844 -0.433594 -1.5 -1 -1.5 h -1 l -4.042969 7 z m 0 0", "key": "1g6cqc" }]], "aliases": ["emoji-body-symbolic"], "gtkIconName": "emoji-body-symbolic" };
__iconData$6k.node;
const EmojiBody = createAdwaitaIcon(__iconData$6k);

const __iconData$6j = { "name": "emoji-flags", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 0 c -0.550781 0 -1 0.449219 -1 1 v 15 h 2 v -8 h 2.382812 l 0.722657 1.449219 c 0.167969 0.335937 0.515625 0.550781 0.894531 0.550781 h 5 c 0.550781 0 1 -0.449219 1 -1 v -6 c 0 -0.550781 -0.449219 -1 -1 -1 h -3.382812 l -0.722657 -1.449219 c -0.167969 -0.335937 -0.515625 -0.550781 -0.894531 -0.550781 z m 0 0", "key": "cc3jau" }]], "aliases": ["emoji-flags-symbolic"], "gtkIconName": "emoji-flags-symbolic" };
__iconData$6j.node;
const EmojiFlags = createAdwaitaIcon(__iconData$6j);

const __iconData$6i = { "name": "emoji-food", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 0.984375 -0.0117188 c -0.550781 0.00781255 -0.9921875 0.4609378 -0.984375 1.0117188 v 4 s 0.0078125 0.84375 0.574219 1.601562 c 0.449219 0.59375 1.257812 1.117188 2.425781 1.3125 v 1.085938 c -0.550781 0 -1 0.449219 -1 1 v 5 c 0 0.550781 0.449219 1 1 1 h 2 c 0.550781 0 1 -0.449219 1 -1 v -5 c 0 -0.550781 -0.449219 -1 -1 -1 v -1.085938 c 1.167969 -0.195312 1.976562 -0.71875 2.425781 -1.3125 c 0.566407 -0.757812 0.574219 -1.601562 0.574219 -1.601562 v -4 c 0.003906 -0.359375 -0.183594 -0.695312 -0.496094 -0.878906 c -0.3125 -0.1796878 -0.695312 -0.1796878 -1.007812 0 c -0.3125 0.183594 -0.5 0.519531 -0.496094 0.878906 v 3.5 c 0 0.277344 -0.222656 0.5 -0.5 0.5 s -0.5 -0.222656 -0.5 -0.5 v -3.5 c 0.003906 -0.269531 -0.101562 -0.53125 -0.292969 -0.722656 c -0.191406 -0.1914065 -0.453125 -0.2968752 -0.722656 -0.2890628 c -0.550781 0.00781255 -0.992187 0.4609378 -0.984375 1.0117188 v 3.5 c 0 0.277344 -0.222656 0.5 -0.5 0.5 s -0.5 -0.222656 -0.5 -0.5 v -3.5 c 0.003906 -0.269531 -0.101562 -0.53125 -0.292969 -0.722656 c -0.191406 -0.1914065 -0.453125 -0.2968752 -0.722656 -0.2890628 z m 12.984375 0.0117188 c -0.253906 0.0078125 -0.496094 0.113281 -0.675781 0.292969 c -1.734375 1.734375 -2.503907 4.160156 -2.898438 6.136719 c -0.394531 1.976562 -0.394531 3.570312 -0.394531 3.570312 c 0 0.550781 0.449219 1 1 1 h 1 v 4 c 0 0.550781 0.449219 1 1 1 h 1 c 0.550781 0 1 -0.449219 1 -1 v -14 c 0 -0.5625 -0.464844 -1.015625 -1.03125 -1 z m 0 0", "key": "19xqvv" }]], "aliases": ["emoji-food-symbolic"], "gtkIconName": "emoji-food-symbolic" };
__iconData$6i.node;
const EmojiFood = createAdwaitaIcon(__iconData$6i);

const __iconData$6h = { "name": "emoji-nature", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 6.003906 1 s -3 0 -3 3 v 5 s 0.042969 1.417969 0.027344 2 c 0 1 -0.535156 1.414062 -1.402344 2.121094 c -0.628906 0.488281 -0.773437 1.308594 -0.308594 1.699218 c 0.429688 0.351563 1.164063 0.300782 1.660157 -0.34375 l 1.019531 -1.476562 c 0.699219 -1.015625 0.984375 -1.875 1 -3 l 0.003906 -6 c 0 -1 0.996094 -1 0.996094 -1 v 6.574219 l 3.003906 -3.074219 v -2.5 c 0 -1 0.996094 -1 0.996094 -1 l 0.003906 2.5 l 1.996094 -2.035156 c 0.339844 -0.3125 0.503906 -0.464844 1 -0.464844 l 0.003906 1 l -4.003906 4 h 4 s 0.003906 1 -1 1 h -4 l -2 2 c 0 0.425781 0 2.007812 2 2.007812 l 4.003906 -0.007812 s 3 0 2.996094 -2.992188 v -9.007812 z m 0 0", "key": "19hcg7" }]], "aliases": ["emoji-nature-symbolic"], "gtkIconName": "emoji-nature-symbolic" };
__iconData$6h.node;
const EmojiNature = createAdwaitaIcon(__iconData$6h);

const __iconData$6g = { "name": "emoji-objects", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7.992188 0 c -2.832032 0 -5.289063 2 -5.871094 4.777344 c -0.527344 2.535156 0.691406 5.035156 2.875 6.328125 l 0.003906 0.898437 c 0 0.550782 0.445312 0.996094 1 0.996094 h 4 c 0.550781 0 0.996094 -0.445312 1 -0.996094 v -0.902344 c 2.183594 -1.292968 3.398438 -3.796874 2.871094 -6.328124 c -0.582032 -2.777344 -3.042969 -4.773438 -5.875 -4.773438 z m 0 2 c 1.902343 0 3.53125 1.320312 3.917968 3.183594 c 0.390625 1.859375 -0.570312 3.722656 -2.3125 4.484375 c -0.363281 0.15625 -0.597656 0.515625 -0.597656 0.914062 v 0.417969 h -2.003906 v -0.417969 c 0 -0.398437 -0.234375 -0.753906 -0.601563 -0.914062 c -1.738281 -0.761719 -2.703125 -2.625 -2.316406 -4.484375 c 0.390625 -1.859375 2.015625 -3.183594 3.914063 -3.183594 z m -1.996094 12 v 1 c 0 0.554688 0.449218 1 1 1 h 2 c 0.554687 0 1 -0.445312 1 -1 v -1 z m 0 0", "key": "1nn9ma" }], ["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 6.644531 6.144531 c -0.195312 0.195313 -0.195312 0.515625 0 0.710938 l 1 1 c 0.191407 0.191406 0.511719 0.191406 0.707031 0 l 1 -1 c 0.191407 -0.195313 0.191407 -0.515625 0 -0.710938 c -0.195312 -0.191406 -0.515624 -0.191406 -0.707031 0 l -0.648437 0.648438 l -0.644532 -0.648438 c -0.195312 -0.191406 -0.515624 -0.191406 -0.707031 0 z m 0 0", "key": "8jx5n3" }]], "aliases": ["emoji-objects-symbolic"], "gtkIconName": "emoji-objects-symbolic" };
__iconData$6g.node;
const EmojiObjects = createAdwaitaIcon(__iconData$6g);

const __iconData$6f = { "name": "emoji-people", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 c -4.402344 0 -8 3.597656 -8 8 s 3.597656 8 8 8 s 8 -3.597656 8 -8 s -3.597656 -8 -8 -8 z m 0 1.980469 c 3.339844 0 6.019531 2.679687 6.019531 6.019531 s -2.679687 6.019531 -6.019531 6.019531 s -6.019531 -2.679687 -6.019531 -6.019531 s 2.679687 -6.019531 6.019531 -6.019531 z m -2 3.019531 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 s 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m 4 0 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 s 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m -5.28125 4.066406 c -0.113281 0.066406 -0.199219 0.175782 -0.234375 0.304688 s -0.015625 0.265625 0.050781 0.378906 c 0.714844 1.238281 2.035156 2 3.464844 2 s 2.75 -0.761719 3.464844 -2 c 0.066406 -0.113281 0.085937 -0.25 0.050781 -0.378906 s -0.121094 -0.238282 -0.234375 -0.304688 s -0.25 -0.085937 -0.378906 -0.050781 s -0.238282 0.121094 -0.304688 0.234375 c -0.535156 0.929688 -1.523437 1.5 -2.597656 1.5 s -2.0625 -0.570312 -2.597656 -1.5 c -0.066406 -0.113281 -0.175782 -0.199219 -0.304688 -0.234375 s -0.265625 -0.015625 -0.378906 0.050781 z m 0 0", "key": "yowfbv" }]], "aliases": ["emoji-people-symbolic"], "gtkIconName": "emoji-people-symbolic" };
__iconData$6f.node;
const EmojiPeople = createAdwaitaIcon(__iconData$6f);

const __iconData$6e = { "name": "emoji-recent", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8.484375 0.0195312 c -4.128906 0 -7.484375 3.3554688 -7.484375 7.4882808 c 0 4.128907 3.355469 7.484376 7.484375 7.484376 c 4.132813 0 7.488281 -3.355469 7.488281 -7.484376 c 0 -4.132812 -3.355468 -7.4882808 -7.488281 -7.4882808 z m 0 1.9726568 c 3.050781 0 5.515625 2.464843 5.515625 5.515624 c 0 3.046876 -2.464844 5.511719 -5.515625 5.511719 c -3.046875 0 -5.511719 -2.464843 -5.511719 -5.511719 c 0 -3.050781 2.464844 -5.515624 5.511719 -5.515624 z m 3.011719 2.007812 c -0.035156 0 -0.070313 0 -0.105469 0.007812 c -0.097656 0.023438 -0.183594 0.078126 -0.25 0.15625 l -2.65625 2.65625 l -1.65625 -1.65625 c -0.105469 -0.179687 -0.3125 -0.269531 -0.515625 -0.234374 c -0.203125 0.039062 -0.363281 0.199218 -0.402344 0.402343 c -0.039062 0.203125 0.054688 0.410157 0.230469 0.519531 l 2 2 c 0.195313 0.179688 0.496094 0.179688 0.6875 0 l 3 -3 c 0.140625 -0.140624 0.179687 -0.351562 0.109375 -0.535156 c -0.074219 -0.183594 -0.246094 -0.308594 -0.441406 -0.316406 z m 0 0", "key": "uh8fkt" }]], "aliases": ["emoji-recent-symbolic"], "gtkIconName": "emoji-recent-symbolic" };
__iconData$6e.node;
const EmojiRecent = createAdwaitaIcon(__iconData$6e);

const __iconData$6d = { "name": "emoji-symbols", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4.5 1 c -0.257812 0 -0.511719 0.097656 -0.707031 0.292969 l -2.5 2.5 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 l 2.5 2.5 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 l 2.5 -2.5 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 l -2.5 -2.5 c -0.195312 -0.195313 -0.449219 -0.292969 -0.707031 -0.292969 z m 7.515625 1 c -0.023437 0 -0.046875 0 -0.070313 0.003906 c -0.335937 0.015625 -0.640624 0.203125 -0.808593 0.496094 l -2.320313 4 c -0.386718 0.664062 0.089844 1.5 0.863282 1.5 h 4.644531 c 0.769531 0 1.246093 -0.835938 0.863281 -1.5 l -2.320312 -4 c -0.179688 -0.308594 -0.503907 -0.496094 -0.851563 -0.5 z m -5.015625 7 c -1.65625 0 -3 1.34375 -3 3 s 1.34375 3 3 3 s 3 -1.34375 3 -3 s -1.34375 -3 -3 -3 z m 0 0", "key": "1ynfdw" }]], "aliases": ["emoji-symbols-symbolic"], "gtkIconName": "emoji-symbols-symbolic" };
__iconData$6d.node;
const EmojiSymbols = createAdwaitaIcon(__iconData$6d);

const __iconData$6c = { "name": "emoji-travel", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3.003906 1 c -0.460937 0 -0.859375 0.3125 -0.972656 0.757812 l -1 4 c -0.019531 0.078126 -0.027344 0.160157 -0.027344 0.242188 v 0.039062 c -0.566406 0.09375 -0.99999975 0.5625 -0.99999975 1.15625 v 4.613282 c 0 0.589844 0.43359375 1.058594 0.99999975 1.152344 v 1.539062 c 0 0.277344 0.222656 0.5 0.5 0.5 h 2 c 0.277344 0 0.5 -0.222656 0.5 -0.5 v -1.5 h 8 v 1.5 c 0 0.277344 0.222656 0.5 0.5 0.5 h 2 c 0.277344 0 0.5 -0.222656 0.5 -0.5 v -1.539062 c 0.5625 -0.09375 1 -0.5625 1 -1.15625 v -4.609376 c 0 -0.59375 -0.4375 -1.0625 -1 -1.15625 v -0.039062 c 0 -0.082031 -0.011718 -0.164062 -0.03125 -0.242188 l -1 -4 c -0.109375 -0.445312 -0.511718 -0.757812 -0.96875 -0.757812 z m 0.78125 2 h 8.4375 l 0.75 3 h -9.9375 z m -0.28125 5 c 0.828125 0 1.5 0.671875 1.5 1.5 s -0.671875 1.5 -1.5 1.5 s -1.5 -0.671875 -1.5 -1.5 s 0.671875 -1.5 1.5 -1.5 z m 9 0 c 0.828125 0 1.5 0.671875 1.5 1.5 s -0.671875 1.5 -1.5 1.5 s -1.5 -0.671875 -1.5 -1.5 s 0.671875 -1.5 1.5 -1.5 z m 0 0", "key": "f3liy2" }]], "aliases": ["emoji-travel-symbolic"], "gtkIconName": "emoji-travel-symbolic" };
__iconData$6c.node;
const EmojiTravel = createAdwaitaIcon(__iconData$6c);

const __iconData$6b = { "name": "emote-love", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M15 5.766a3.763 3.763 0 00-3.77-3.757c-1.37 0-2.57.73-3.23 1.822a3.77 3.77 0 00-3.23-1.822A3.763 3.763 0 001 5.766a3.74 3.74 0 001.19 2.738h-.001L7.914 14l5.898-5.496h-.002A3.739 3.739 0 0015 5.766", "key": "6awlmx" }]], "aliases": ["emote-love-symbolic"], "gtkIconName": "emote-love-symbolic" };
__iconData$6b.node;
const EmoteLove = createAdwaitaIcon(__iconData$6b);

const __iconData$6a = { "name": "error-correct", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 13.550781 4 c -0.488281 0.003906 -0.988281 0.195312 -1.429687 0.636719 l -7.625 7.625 c -0.316406 0.316406 -0.496094 0.75 -0.496094 1.199219 v 2.539062 h 2.539062 c 0.449219 0 0.882813 -0.179688 1.199219 -0.496094 l 7.625 -7.625 c 1.515625 -1.511718 0.066407 -3.714844 -1.601562 -3.871094 c -0.070313 -0.007812 -0.140625 -0.007812 -0.210938 -0.007812 z m -1.503906 3.054688 l 0.898437 0.898437 l -5.980468 5.980469 l -0.898438 -0.898438 z m 0 0", "key": "9e867q" }], ["path", { "fill": "currentColor", "d": "m 5 1 s -0.707031 -0.015625 -1.449219 0.355469 c -0.738281 0.371093 -1.550781 1.3125 -1.550781 2.644531 v 2 h -2 v 1 h 0.0078125 c -0.00390625 0.265625 0.1015625 0.519531 0.2851565 0.707031 l 2 2 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 l 2 -2 c 0.183594 -0.1875 0.289063 -0.441406 0.289063 -0.707031 h 0.003906 v -1 h -2 v -2 c 0.105469 -0.800781 0.5 -1 1 -1 h 5 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m 0 0", "key": "iwe4uu" }]], "aliases": ["error-correct-symbolic"], "gtkIconName": "error-correct-symbolic" };
__iconData$6a.node;
const ErrorCorrect = createAdwaitaIcon(__iconData$6a);

const __iconData$69 = { "name": "face-angel", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M2.188 4.094A6.937 6.937 0 001 8a7 7 0 0014 0c0-1.45-.433-2.789-1.188-3.906a4.48 4.48 0 01-.624.343c-.85.395-1.855.563-2.938.563h-4.5c-1.083 0-2.087-.168-2.938-.563a4.443 4.443 0 01-.624-.343zM6 6c.558 0 1.031.473 1.031 1.031V8c0 .558-.473 1-1.031 1-.558 0-1-.442-1-1v-.969C5 6.473 5.442 6 6 6zm4 0c.558 0 1 .473 1 1.031V8c0 .558-.442 1-1 1s-1-.442-1-1v-.969C9 6.473 9.442 6 10 6zM3 9.063C3.715 10.136 5.235 11 8 11c2.452 0 4.21-.75 5-1.938v.5c0 .681-.838 2.407-5 2.407-3.88 0-5-1.874-5-2.406z", "key": "m6npny" }], ["path", { "fill": "currentColor", "d": "M5.736 0c-.958 0-1.826.172-2.5.484C2.563.796 2 1.295 2 2s.563 1.204 1.236 1.516c.674.312 1.542.484 2.5.484h4.528c.958 0 1.826-.172 2.5-.484C13.437 3.204 14 2.705 14 2S13.437.796 12.764.484C12.09.172 11.222 0 10.264 0zm0 1h4.528c.834 0 1.583.162 2.08.393.496.23.656.481.656.607s-.16.377-.656.607c-.497.23-1.246.393-2.08.393H5.736c-.834 0-1.583-.162-2.08-.393C3.16 2.377 3 2.126 3 2s.16-.377.656-.607C4.153 1.163 4.902 1 5.736 1z", "key": "as2c9r" }]], "aliases": ["face-angel-symbolic"], "gtkIconName": "face-angel-symbolic" };
__iconData$69.node;
const FaceAngel = createAdwaitaIcon(__iconData$69);

const __iconData$68 = { "name": "face-angry", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M8 1a7 7 0 100 14A7 7 0 008 1zM4 5.125s.474.839 1.25.844H7V7c0 .556-.667 1-1.5 1S4 7.556 4 7zm8 0V7c0 .556-.667 1-1.5 1S9 7.556 9 7V5.969h1.719C11.495 5.964 12 5.125 12 5.125zM8.031 9c3.256 0 3 .384 3 .762v.266H5V9.74C5 9.39 4.775 9 8.031 9z", "key": "p306vc" }]], "aliases": ["face-angry-symbolic"], "gtkIconName": "face-angry-symbolic" };
__iconData$68.node;
const FaceAngry = createAdwaitaIcon(__iconData$68);

const __iconData$67 = { "name": "face-confused", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M8 1a7 7 0 100 14A7 7 0 008 1zM6 5c.558 0 1.031.473 1.031 1.031V7c0 .558-.473 1-1.031 1-.558 0-1-.442-1-1v-.97C5 5.473 5.442 5 6 5zm4 0c.558 0 1 .473 1 1.031V7c0 .558-.442 1-1 1s-1-.442-1-1v-.97C9 5.473 9.442 5 10 5zM4.594 8.812c.064-.009-.28.014-.213.032 4.481-.032 1.45 2.581 6.588 2.643a.506.506 0 01.343.625.474.474 0 01-.593.344C5.77 12.442 7.812 9.75 4.53 9.812a.506.506 0 01-.344-.625.5.5 0 01.407-.375z", "key": "f2ovoj" }]], "aliases": ["face-confused-symbolic"], "gtkIconName": "face-confused-symbolic" };
__iconData$67.node;
const FaceConfused = createAdwaitaIcon(__iconData$67);

const __iconData$66 = { "name": "face-cool", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M8 1a7 7 0 100 14A7 7 0 008 1zM2.22 5.031c3.913-.037 7.972 0 11.562 0 0 1.642-1.25 2.969-2.78 2.969-1.276 0-2.333-.93-2.657-2.188h-.688C7.333 7.07 6.276 8 5 8 3.47 8 2.22 6.673 2.22 5.031zM3 9.063C3.716 10.136 5.235 11 8 11c2.452 0 4.211-.75 5-1.938v.5c0 .681-.838 2.407-5 2.407-3.88 0-5-1.874-5-2.406z", "key": "un87jh" }]], "aliases": ["face-cool-symbolic"], "gtkIconName": "face-cool-symbolic" };
__iconData$66.node;
const FaceCool = createAdwaitaIcon(__iconData$66);

const __iconData$65 = { "name": "face-crying", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M8 1a7 7 0 100 14A7 7 0 008 1zM6 5c.558 0 1.031.41 1.031.875v.781c0 .466-.473.844-1.031.844-.558 0-1-.378-1-.844v-.781C5 5.41 5.442 5 6 5zm4 0c.558 0 1 .378 1 .844v.812c0 .466-.442.844-1 .844s-1-.378-1-.844v-.812C9 5.378 9.442 5 10 5zm1.75 2.281c1.208.449 2.046.937 2.219 1.563a.993.993 0 01-.938 1.25c-.519.007-.768-.216-.937-.875-.167-.66.083-1.293-.344-1.938zM7.969 9.97c2.588 0 3.969.98 3.969 1.562v.531c-.793-.696-3.187-1-3.97-1-.781 0-3.018-.058-3.968 1v-.53c0-.745 1.38-1.563 3.969-1.563z", "key": "1pgk9d" }]], "aliases": ["face-crying-symbolic"], "gtkIconName": "face-crying-symbolic" };
__iconData$65.node;
const FaceCrying = createAdwaitaIcon(__iconData$65);

const __iconData$64 = { "name": "face-devilish", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M8 1a6.992 6.992 0 00-4.375 1.531C2.491 2.087 1.532 1.582.937 1.062l-.093.594C.81 1.927.947 3.17 2 4.406A6.952 6.952 0 001 8a7 7 0 0014 0c0-1.29-.36-2.493-.969-3.531 1.011-1.218 1.19-2.39 1.157-2.657l-.094-.593c-.579.506-1.499.97-2.594 1.406-.006-.005-.026.005-.031 0A6.925 6.925 0 008 1zM6 5c.558 0 1.031.473 1.031 1.031V7c0 .558-.473 1-1.031 1-.558 0-1-.442-1-1v-.969C5 5.473 5.442 5 6 5zm4 0c.558 0 1 .473 1 1.031V7c0 .558-.442 1-1 1s-1-.442-1-1v-.969C9 5.473 9.442 5 10 5zm2 4.978c-.03.344-.925 3.003-4 3.01-2.789.006-4-2.559-4-2.985z", "key": "101x2f" }]], "aliases": ["face-devilish-symbolic"], "gtkIconName": "face-devilish-symbolic" };
__iconData$64.node;
const FaceDevilish = createAdwaitaIcon(__iconData$64);

const __iconData$63 = { "name": "face-embarrassed", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M8 1a7 7 0 100 14A7 7 0 008 1zM5.531 6.177C6.266 6.177 7 6.623 7 7.489c-1.5-.338-3.125 1.733-3 0 .063-.866.797-1.312 1.531-1.312zm4.938 0c.734 0 1.469.446 1.531 1.312.125 1.733-1.5-.338-3 0 0-.866.734-1.312 1.469-1.312zm-6 2.558a.75.75 0 110 1.5.75.75 0 110-1.5zm7.017 0a.75.75 0 110 1.5.75.75 0 110-1.5zm-4.09 2.262h1.172c.206 0 .547.223.547.5s-.34.516-.547.516H7.396c-.206 0-.484-.239-.484-.516s.278-.5.484-.5z", "key": "175y57" }]], "aliases": ["face-embarrassed-symbolic"], "gtkIconName": "face-embarrassed-symbolic" };
__iconData$63.node;
const FaceEmbarrassed = createAdwaitaIcon(__iconData$63);

const __iconData$62 = { "name": "face-glasses", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M8 1a6.986 6.986 0 00-6.313 4H4.25a2 2 0 011.719-.969c.566 0 1.072.244 1.437.625.2-.132.413-.156.563-.156.165 0 .394.022.593.156A1.985 1.985 0 0110 4.031 2 2 0 0111.719 5h2.594A6.986 6.986 0 008 1zM5.969 5.031c-.563 0-1 .438-1 1V7c0 .563.437 1 1 1 .562 0 1-.437 1-1v-.969c0-.562-.438-1-1-1zm4.031 0c-.563 0-1 .438-1 1V7c0 .563.437 1 1 1s1-.437 1-1v-.969c0-.562-.437-1-1-1zm-2.031.782c0 .009-.032.021-.031.03.006.063.03.124.03.188V7c0 1.1-.9 2-2 2-1.099 0-2-.9-2-2V6H1.282A7.072 7.072 0 001 8a7 7 0 0014 0 7.07 7.07 0 00-.281-2H12v1c0 1.1-.9 2-2 2s-2-.9-2-2v-.969c0-.042-.003-.083 0-.125a.651.651 0 010-.062.51.51 0 01-.031-.031zM3 10.063c.997.636 4.016.937 5 .937s3.805.03 5-.938v.5c0 .681-1.744 1.407-5 1.407-3.256 0-5-.874-5-1.406z", "key": "fhuyic" }]], "aliases": ["face-glasses-symbolic"], "gtkIconName": "face-glasses-symbolic" };
__iconData$62.node;
const FaceGlasses = createAdwaitaIcon(__iconData$62);

const __iconData$61 = { "name": "face-kiss", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M8 1a7 7 0 100 14A7 7 0 008 1zM5.531 5C6.266 5 7 5.225 7 6.092c-2.56-.604-2.418 1.688-3 .22C3.68 5.505 4.797 5 5.531 5zm4.938 0c.734 0 1.704.461 1.531 1.313-.317 1.556-.528-.958-3-.221C9 5.225 9.734 5 10.469 5zM7 8c.41-.01.75.134 1.031.344.282-.21.652-.357 1.063-.344.631.02.906.76.906 1.187 0 .775.475.766 1 .829-.634.15-.987 1.224-.984 1.765.005.972-.93 1.256-2.016 1.25-1.085-.004-1.987-.251-1.984-1.234 0-.408-.353-1.59-1.032-1.766.68-.093 1.016-.25 1.016-.86 0-.808.529-1.16 1-1.171z", "key": "w5uk14" }], ["path", { "fill": "currentColor", "d": "M9 10.274c-.17.08-.32.16-.322.272-.018.27-.374.481-.672.48-.298-.001-.594-.21-.594-.48 0-.112-.111-.19-.272-.272.53-.395 1.253-.338 1.86 0z", "key": "n7y6nq" }]], "aliases": ["face-kiss-symbolic"], "gtkIconName": "face-kiss-symbolic" };
__iconData$61.node;
const FaceKiss = createAdwaitaIcon(__iconData$61);

const __iconData$60 = { "name": "face-laugh", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M8 1a7 7 0 100 14A7 7 0 008 1zM5.531 4.719C6.266 4.719 7 5.165 7 6.03c-1.5-.338-3.125 1.733-3 0 .063-.866.797-1.312 1.531-1.312zm4.938 0c.734 0 1.469.446 1.531 1.312.125 1.733-1.5-.338-3 0 0-.866.734-1.312 1.469-1.312zM3 9.03c2 1.304 7.987 1.304 10.031 0l-.03.531c-.037.43-1 3.376-5 3.407-4 .031-5-2.78-5-3.313V9.03z", "key": "9vy814" }]], "aliases": ["face-laugh-symbolic"], "gtkIconName": "face-laugh-symbolic" };
__iconData$60.node;
const FaceLaugh = createAdwaitaIcon(__iconData$60);

const __iconData$5$ = { "name": "face-monkey", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M7.844.031C6.617.765 6.78 1.664 6.938 2.062c-1.808.269-3.55 1.312-4.125 3.188-.284-.212-.588-.344-.938-.344C.841 4.906 0 5.99 0 7.281c0 1.293.841 2.344 1.875 2.344.467 0 .886-.212 1.219-.563 2.719-1.273 7.092-1.466 9.875.032.32.322.71.531 1.156.531C15.159 9.625 16 8.574 16 7.281c0-1.292-.841-2.375-1.875-2.375-.428 0-.811.193-1.125.5-.507-1.702-1.84-2.91-3.812-3.281-.17-.639-.285-1.916 1.625-1.781-2.17-.793-2.72 1.625-2.72 1.625-.265-.118-.965-.639-.25-1.938zM6.469 5.063c.38 0 .719.646.719 1.468 0 .823-.34 1.5-.72 1.5-.38 0-.655-.677-.655-1.5 0-.822.276-1.468.656-1.468zm3 0c.38 0 .719.646.719 1.468 0 .823-.34 1.5-.72 1.5-.38 0-.655-.677-.655-1.5 0-.822.276-1.468.656-1.468zM2 5.968c.256 0 .474.15.656.343a6.09 6.09 0 00.125 1.75c-.191.294-.452.5-.781.5-.572 0-1.031-.566-1.031-1.28 0-.715.46-1.313 1.031-1.313zm12.031 0c.572 0 1.063.597 1.063 1.312 0 .715-.49 1.282-1.063 1.282-.372 0-.659-.262-.843-.626a6.94 6.94 0 000-1.375c.187-.35.484-.593.843-.593z", "key": "1q4px1" }], ["path", { "fill": "currentColor", "d": "M7.969 8.969c-3.88 0-7.031 1.567-7.031 3.5s3.15 3.5 7.03 3.5c3.88 0 7.032-1.567 7.032-3.5s-3.151-3.5-7.031-3.5zM3 11.03s.367 2.031 4.969 2.031c4.386 0 5.094-2 5.094-2S13.023 14.04 7.969 14C2.82 13.96 3 11.031 3 11.031z", "key": "9tlrmp" }]], "aliases": ["face-monkey-symbolic"], "gtkIconName": "face-monkey-symbolic" };
__iconData$5$.node;
const FaceMonkey = createAdwaitaIcon(__iconData$5$);

const __iconData$5_ = { "name": "face-plain", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M8 1a7 7 0 100 14A7 7 0 008 1zM6 5c.558 0 1.031.473 1.031 1.031V7c0 .558-.473 1-1.031 1-.558 0-1-.442-1-1v-.969C5 5.473 5.442 5 6 5zm4 0c.558 0 1 .473 1 1.031V7c0 .558-.442 1-1 1s-1-.442-1-1v-.969C9 5.473 9.442 5 10 5zm-6.5 5h9a.499.499 0 110 1h-9a.499.499 0 110-1z", "key": "1p9uy0" }]], "aliases": ["face-plain-symbolic"], "gtkIconName": "face-plain-symbolic" };
__iconData$5_.node;
const FacePlain = createAdwaitaIcon(__iconData$5_);

const __iconData$5Z = { "name": "face-raspberry", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M8 1a7 7 0 100 14A7 7 0 008 1zM6 5c.558 0 1.031.473 1.031 1.031V7c0 .558-.473 1-1.031 1-.558 0-1-.442-1-1v-.969C5 5.473 5.442 5 6 5zm4 0c.558 0 1 .473 1 1.031V7c0 .558-.442 1-1 1s-1-.442-1-1v-.969C9 5.473 9.442 5 10 5zM3 9.063c.997.636 4.016.937 5 .937.492 0 1.429.015 2.406-.094.978-.108 1.996-.36 2.594-.843v.5c0 .441-.753.919-2.156 1.187l.25.531c.279.604.083 1.276-.438 1.532l-.25.125c-.52.255-1.175-.03-1.469-.625l-.624-1.282c-.018-.034-.02-.035-.032-.062H8c-3.256 0-5-.874-5-1.406v-.5z", "key": "1kwjut" }]], "aliases": ["face-raspberry-symbolic"], "gtkIconName": "face-raspberry-symbolic" };
__iconData$5Z.node;
const FaceRaspberry = createAdwaitaIcon(__iconData$5Z);

const __iconData$5Y = { "name": "face-sad", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M8 1a7 7 0 100 14A7 7 0 008 1zM6 5c.559 0 1.031.473 1.031 1.031V7c0 .558-.472 1-1.03 1-.56 0-1-.442-1-1v-.969C5 5.473 5.44 5 6 5zm4 0c.559 0 1 .473 1 1.031V7c0 .558-.441 1-1 1-.558 0-1-.442-1-1v-.969C9 5.473 9.442 5 10 5zm3 5.943c-.996-.637-4.016-.917-5-.917-.983 0-3.804-.051-5 .917v-.5c0-.681 1.744-1.404 5-1.404 3.256 0 5 .871 5 1.404z", "key": "1emiao" }]], "aliases": ["face-sad-symbolic"], "gtkIconName": "face-sad-symbolic" };
__iconData$5Y.node;
const FaceSad = createAdwaitaIcon(__iconData$5Y);

const __iconData$5X = { "name": "face-shutmouth", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M8 1a7 7 0 100 14A7 7 0 008 1zM6 5c.558 0 1.031.473 1.031 1.031V7c0 .558-.473 1-1.031 1-.558 0-1-.442-1-1v-.969C5 5.473 5.442 5 6 5zm4 0c.558 0 1 .473 1 1.031V7c0 .558-.442 1-1 1s-1-.442-1-1v-.969C9 5.473 9.442 5 10 5zM4 9l4 1 4-1c.083.59-.16 1.054-.671 1.168L10 10.5l1.309.327c.715.192.691.75.691 1.173l-4-1-4 1c-.065-.631.037-.983.52-1.13L6 10.5l-1.504-.335C4.02 10.037 3.916 9.484 4 9z", "key": "5poixd" }]], "aliases": ["face-shutmouth-symbolic"], "gtkIconName": "face-shutmouth-symbolic" };
__iconData$5X.node;
const FaceShutmouth = createAdwaitaIcon(__iconData$5X);

const __iconData$5W = { "name": "face-sick", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M8 1a7 7 0 100 14A7 7 0 008 1zM4.313 4.688a.27.27 0 01.125.03l1.125.657 1.156-.656c.165-.092.34-.021.406.156a.432.432 0 01-.187.5l-.72.406.72.406a.376.376 0 01.156.47c-.069.176-.242.218-.406.124l-1.125-.625-1.157.625c-.165.092-.34.053-.406-.125a.432.432 0 01.188-.5l.687-.406-.687-.375c-.165-.094-.256-.324-.188-.5a.303.303 0 01.313-.188zm5.156 0a.27.27 0 01.125.03l1.125.657 1.156-.656c.165-.092.34-.021.406.156a.432.432 0 01-.187.5l-.719.406.719.406c.164.094.255.293.187.47-.068.176-.273.218-.437.124l-1.125-.656-1.156.656c-.166.092-.34.053-.407-.125a.432.432 0 01.188-.5l.719-.406-.72-.406c-.163-.094-.255-.293-.187-.47a.303.303 0 01.313-.187zM5.125 9.03A2.75 2.75 0 017 9.562c.35.22.413.274 1 .344.16.056.607-.04 1-.344.28-.204.561-.295.844-.374 1.309-.368 2.574.436 3.156 1.25v.5c-.511-.286-1.06-.598-1.625-.782l.469.938c.328.647.132 1.399-.438 1.687-.57.289-1.297-.009-1.625-.656l-.593-1.156c-.051-.101-.068-.209-.094-.313a.594.594 0 01-.094.031c-.541.314-1.56.197-2 0-.917-.437-.909-.667-1.531-.687-.853.019-1.843.399-2.469.937v-.5c.264-.678 1.119-1.316 2.125-1.406z", "key": "5nyvsy" }]], "aliases": ["face-sick-symbolic"], "gtkIconName": "face-sick-symbolic" };
__iconData$5W.node;
const FaceSick = createAdwaitaIcon(__iconData$5W);

const __iconData$5V = { "name": "face-smile-big", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M8 1a7 7 0 100 14A7 7 0 008 1zM6 5c.558 0 1.031.473 1.031 1.031V7c0 .558-.473 1-1.031 1-.558 0-1-.442-1-1v-.969C5 5.473 5.442 5 6 5zm4 0c.558 0 1 .473 1 1.031V7c0 .558-.442 1-1 1s-1-.442-1-1v-.969C9 5.473 9.442 5 10 5zM3 9.031c2 1.304 7.987 1.304 10.031 0l-.03.531c-.037.43-1 3.376-5 3.407-4 .031-5-2.78-5-3.313z", "key": "sjhx5z" }]], "aliases": ["face-smile-big-symbolic"], "gtkIconName": "face-smile-big-symbolic" };
__iconData$5V.node;
const FaceSmileBig = createAdwaitaIcon(__iconData$5V);

const __iconData$5U = { "name": "face-smile", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M8 1a7 7 0 100 14A7 7 0 008 1zM6 5c.559 0 1.031.473 1.031 1.031V7c0 .558-.472 1-1.03 1-.56 0-1-.442-1-1v-.969C5 5.473 5.44 5 6 5zm4 0c.559 0 1 .473 1 1.031V7c0 .558-.441 1-1 1-.558 0-1-.442-1-1v-.969C9 5.473 9.442 5 10 5zM3 9.07c.997.637 4.017.917 5 .917.984 0 3.805.051 5-.917v.5c0 .68-1.744 1.404-5 1.404-3.256 0-5-.872-5-1.404z", "key": "l4gzdp" }]], "aliases": ["face-smile-symbolic"], "gtkIconName": "face-smile-symbolic" };
__iconData$5U.node;
const FaceSmile = createAdwaitaIcon(__iconData$5U);

const __iconData$5T = { "name": "face-smirk", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M8.015 1a7 7 0 100 14 7 7 0 000-14zm-2 4c.559 0 1.032.473 1.032 1.031V7c0 .558-.473 1-1.032 1-.558 0-1-.442-1-1v-.97c0-.558.442-1.031 1-1.031zm4 0c.559 0 1 .473 1 1.031V7c0 .558-.441 1-1 1-.558 0-1-.442-1-1v-.97c0-.558.442-1.031 1-1.031zM3.603 7.719c.78 3.306 4.693 4.432 7.705 3.287.007.598-.195 1.097-1.154 1.286-2.166.426-5.161-.143-6.68-2.594-.666-1.074-.127-1.685.129-1.98z", "key": "flt8gn" }]], "aliases": ["face-smirk-symbolic"], "gtkIconName": "face-smirk-symbolic" };
__iconData$5T.node;
const FaceSmirk = createAdwaitaIcon(__iconData$5T);

const __iconData$5S = { "name": "face-surprise", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M8 1a7 7 0 100 14A7 7 0 008 1zM6 5c.558 0 1.031.473 1.031 1.031V7c0 .558-.473 1-1.031 1-.558 0-1-.442-1-1v-.969C5 5.473 5.442 5 6 5zm4 0c.558 0 1 .473 1 1.031V7c0 .558-.442 1-1 1s-1-.442-1-1v-.969C9 5.473 9.442 5 10 5zM8 9.594c1.06 0 1.93.92 1.938 2.031 0 1.116-.873 2.031-1.938 2.031s-1.937-.915-1.937-2.031S6.935 9.594 8 9.594z", "key": "185b5s" }]], "aliases": ["face-surprise-symbolic"], "gtkIconName": "face-surprise-symbolic" };
__iconData$5S.node;
const FaceSurprise = createAdwaitaIcon(__iconData$5S);

const __iconData$5R = { "name": "face-tired", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M8 1a7 7 0 100 14A7 7 0 008 1zM6.625 6.75A.29.29 0 017 7a.412.412 0 01-.281.438l-2.782.812c-.181.053-.349-.031-.374-.219a.412.412 0 01.28-.437zm2.625 0c.042-.006.08-.013.125 0l2.781.844a.41.41 0 01.281.437c-.025.188-.193.272-.374.219L9.28 7.437A.412.412 0 019 7a.287.287 0 01.25-.25zM4.406 10h7.188c.221 0 .406.223.406.5s-.185.5-.406.5H4.406C4.185 11 4 10.777 4 10.5s.185-.5.406-.5z", "key": "1qddgs" }]], "aliases": ["face-tired-symbolic"], "gtkIconName": "face-tired-symbolic" };
__iconData$5R.node;
const FaceTired = createAdwaitaIcon(__iconData$5R);

const __iconData$5Q = { "name": "face-uncertain", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M8 1a7 7 0 100 14A7 7 0 008 1zM6 5c.558 0 1.031.473 1.031 1.031V7c0 .558-.473 1-1.031 1-.558 0-1-.442-1-1v-.969C5 5.473 5.442 5 6 5zm4 0c.558 0 1 .473 1 1.031V7c0 .558-.442 1-1 1s-1-.442-1-1v-.969C9 5.473 9.442 5 10 5zM4 9l8 2v1l-8-2z", "key": "lc9qov" }]], "aliases": ["face-uncertain-symbolic"], "gtkIconName": "face-uncertain-symbolic" };
__iconData$5Q.node;
const FaceUncertain = createAdwaitaIcon(__iconData$5Q);

const __iconData$5P = { "name": "face-wink", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M8 1a7 7 0 100 14A7 7 0 008 1zM6 5c.559 0 1.031.473 1.031 1.031V7c0 .558-.472 1-1.03 1-.56 0-1-.442-1-1v-.969C5 5.473 5.44 5 6 5zm3.438 1h.906c.522 0 .969.216.969.5 0 .284-.447.5-.97.5h-.905c-.523 0-.938-.216-.938-.5 0-.284.415-.5.938-.5zM3 9.063C3.716 10.136 5.235 11 8 11c2.452 0 4.211-.75 5-1.938v.5c0 .681-.838 2.407-5 2.407-3.88 0-5-1.874-5-2.406z", "key": "1m0tcq" }]], "aliases": ["face-wink-symbolic"], "gtkIconName": "face-wink-symbolic" };
__iconData$5P.node;
const FaceWink = createAdwaitaIcon(__iconData$5P);

const __iconData$5O = { "name": "face-worried", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M8 1a7 7 0 100 14A7 7 0 008 1zM6 5c.558 0 1.031.473 1.031 1.031V7c0 .558-.473 1-1.031 1-.558 0-1-.442-1-1v-.969C5 5.473 5.442 5 6 5zm4 0c.558 0 1 .473 1 1.031V7c0 .558-.442 1-1 1s-1-.442-1-1v-.969C9 5.473 9.442 5 10 5zm3 5.943c-.766-.428-1.612-.92-2.476-.94-.652.02-1.239.654-1.524.697-.542.314-1.56.196-2 0-.917-.437-.921-.68-1.543-.7-.853.019-1.832.404-2.457.943v-.5c.422-1.086 2.38-2.045 4-.871.35.22.427.267 1.015.337.16.055.592-.034.985-.337 1.582-1.153 3.292-.119 4 .87z", "key": "e66zyw" }]], "aliases": ["face-worried-symbolic"], "gtkIconName": "face-worried-symbolic" };
__iconData$5O.node;
const FaceWorried = createAdwaitaIcon(__iconData$5O);

const __iconData$5N = { "name": "face-yawn", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M8 1a7 7 0 100 14A7 7 0 008 1zM5.531 4C6.266 4 7 4.446 7 5.313c-1.5-.339-3.125 1.732-3 0C4.063 4.446 4.797 4 5.531 4zm4.938 0c.734 0 1.469.446 1.531 1.313.125 1.732-1.5-.339-3 0C9 4.446 9.734 4 10.469 4zM8 7c1.38 0 2.5 1.343 2.5 3S9.38 13 8 13s-2.5-1.343-2.5-3S6.62 7 8 7z", "key": "lq9f37" }]], "aliases": ["face-yawn-symbolic"], "gtkIconName": "face-yawn-symbolic" };
__iconData$5N.node;
const FaceYawn = createAdwaitaIcon(__iconData$5N);

const __iconData$5M = { "name": "find-location", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7.988281 0 c -0.554687 0 -1 0.445312 -1 1 v 1 c 0 0.03125 0 0.058594 0.003907 0.085938 c -2.507813 0.421874 -4.492188 2.410156 -4.914063 4.917968 c -0.03125 -0.003906 -0.058594 -0.003906 -0.089844 -0.003906 h -1 c -0.554687 0 -0.9999998 0.445312 -0.9999998 1 s 0.4453128 1 0.9999998 1 h 1 c 0.03125 0 0.058594 0 0.089844 -0.003906 c 0.421875 2.507812 2.40625 4.496094 4.914063 4.917968 c 0 0.027344 -0.003907 0.054688 -0.003907 0.085938 v 1 c 0 0.554688 0.445313 1 1 1 c 0.554688 0 1 -0.445312 1 -1 v -1 c 0 -0.03125 0 -0.058594 -0.003906 -0.085938 c 2.507813 -0.421874 4.496094 -2.410156 4.917969 -4.917968 c 0.03125 0 0.058594 0.003906 0.085937 0.003906 h 1 c 0.554688 0 1 -0.445312 1 -1 s -0.445312 -1 -1 -1 h -1 c -0.027343 0 -0.054687 0 -0.085937 0.003906 c -0.421875 -2.507812 -2.410156 -4.496094 -4.917969 -4.917968 c 0 -0.027344 0.003906 -0.058594 0.003906 -0.085938 v -1 c 0 -0.554688 -0.445312 -1 -1 -1 z m 0.003907 4 c 2.199218 0 4 1.796875 4 4 s -1.800782 4 -4 4 c -2.203126 0 -4 -1.796875 -4 -4 s 1.796874 -4 4 -4 z m -0.003907 2 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 0 0", "key": "69sf2x" }]], "aliases": ["find-location-symbolic"], "gtkIconName": "find-location-symbolic" };
__iconData$5M.node;
const FindLocation = createAdwaitaIcon(__iconData$5M);

const __iconData$5L = { "name": "focus-legacy-systray", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7.933594 2 l -7.933594 0.011719 l -0.00390625 11.96875 h 9.96875025 l 0.027344 -9.917969 c 0.003906 -1.125 -0.933594 -2.0625 -2.058594 -2.0625 z m 2.050781 0.03125 s 1.03125 0.484375 1.03125 1.96875 v 10 h 0.984375 v -10 c 0 -1.25 -2.015625 -1.96875 -2.015625 -1.96875 z m 1.984375 0 s 1.03125 0.484375 1.03125 1.96875 v 10 h 1 v -10 c 0 -1.25 -2.03125 -1.96875 -2.03125 -1.96875 z m -8.953125 2.96875 h 1 c 0.308594 0 0.550781 0.089844 0.75 0.28125 l 2.65625 2.71875 l -2.65625 2.71875 c -0.199219 0.191406 -0.441406 0.28125 -0.75 0.28125 h -1 v -1 c 0 -0.257812 0.128906 -0.527344 0.3125 -0.71875 l 1.28125 -1.28125 l -1.28125 -1.28125 c -0.183594 -0.191406 -0.3125 -0.460938 -0.3125 -0.71875 z m 0 0", "key": "y81qkl" }]], "aliases": ["focus-legacy-systray-symbolic"], "gtkIconName": "focus-legacy-systray-symbolic" };
__iconData$5L.node;
const FocusLegacySystray = createAdwaitaIcon(__iconData$5L);

const __iconData$5K = { "name": "focus-top-bar", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 2.0625 2 c -1.125 0 -2.0625 0.9375 -2.0625 2.058594 v 7.890625 h 1.039062 v -1.015625 h 0.960938 v -4.875 c 0 -0.050782 0.011719 -0.058594 0.0625 -0.058594 h 11.902344 c 0.050781 0 0.058594 0.011719 0.058594 0.058594 v 7.980468 h 0.933593 l 0.046875 -1.058593 h 1.019532 v -8.921875 c 0 -1.121094 -0.933594 -2.058594 -2.058594 -2.058594 z m 7.949219 2.074219 h 3.976562 v 0.925781 h -3.976562 z m 0 0", "key": "1n5hg8" }]], "aliases": ["focus-top-bar-symbolic"], "gtkIconName": "focus-top-bar-symbolic" };
__iconData$5K.node;
const FocusTopBar = createAdwaitaIcon(__iconData$5K);

const __iconData$5J = { "name": "focus-windows", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8.019531 1.007812 c -0.53125 0 -1.03125 0.421876 -1.03125 1 v 7.011719 h 8.011719 v -7.042969 c 0 -0.578124 -0.523438 -0.96875 -1.023438 -0.96875 z m 0.96875 3.015626 h 4.011719 v 2.996093 h -4.011719 z m -6.953125 2.984374 c -0.53125 0 -1.03125 0.421876 -1.03125 1 v 7.011719 h 8.011719 v -3.984375 h -2 v 1.984375 h -4.011719 v -2.996093 h 2.015625 v -3.015626 z m 0 0", "key": "ha7qbk" }]], "aliases": ["focus-windows-symbolic"], "gtkIconName": "focus-windows-symbolic" };
__iconData$5J.node;
const FocusWindows = createAdwaitaIcon(__iconData$5J);

const __iconData$5I = { "name": "folder-documents", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4.96875 1.003906 c -1.644531 0 -3 1.355469 -3 3 v 9 c 0 1.644532 1.355469 3 3 3 h 6 c 1.644531 0 3 -1.355468 3 -3 v -7.5 c 0 -0.265625 -0.105469 -0.519531 -0.292969 -0.707031 l -3.5 -3.5 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0 2 h 4 v 1.5 c 0 1 0.5 1.5 1.5 1.5 h 1.5 v 7 c 0 0.570313 -0.429688 1 -1 1 h -6 c -0.570312 0 -1 -0.429687 -1 -1 v -9 c 0 -0.570312 0.429688 -1 1 -1 z m 0 0", "key": "66wmj8" }]], "aliases": ["folder-documents-symbolic"], "gtkIconName": "folder-documents-symbolic" };
__iconData$5I.node;
const FolderDocuments = createAdwaitaIcon(__iconData$5I);

const __iconData$5H = { "name": "folder-download", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7.984375 0 c -0.550781 0 -1 0.449219 -1 1 v 8.585938 l -2.292969 -2.292969 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 s -0.519531 0.105469 -0.707031 0.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 l 4 4 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 l 4 -4 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 s -1.023437 -0.390625 -1.414062 0 l -2.292969 2.292969 v -8.585938 c 0 -0.550781 -0.449219 -1 -1 -1 z m -6 14 v 2 h 12 v -2 z m 0 0", "key": "1hzbs2" }]], "aliases": ["folder-download-symbolic"], "gtkIconName": "folder-download-symbolic" };
__iconData$5H.node;
const FolderDownload = createAdwaitaIcon(__iconData$5H);

const __iconData$5G = { "name": "folder-drag-accept", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 2.96875 1.003906 c -1.644531 0 -3 1.355469 -3 3 v 8 c 0 1.644532 1.355469 3 3 3 h 10 c 1.644531 0 3 -1.355468 3 -3 v -6 c 0 -1.644531 -1.355469 -3 -3 -3 h -3.585938 l -1.707031 -1.707031 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0 2 h 3.585938 l 1 1 h -5.585938 c 0 -0.5625 0.4375 -1 1 -1 z m -1 2 h 11 c 0.5625 0 1 0.4375 1 1 v 6 c 0 0.5625 -0.4375 1 -1 1 h -10 c -0.5625 0 -1 -0.4375 -1 -1 z m 0 0", "key": "1abc9j" }]], "aliases": ["folder-drag-accept-symbolic"], "gtkIconName": "folder-drag-accept-symbolic" };
__iconData$5G.node;
const FolderDragAccept = createAdwaitaIcon(__iconData$5G);

const __iconData$5F = { "name": "folder-music", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 1 c -1.644531 0 -3 1.355469 -3 3 v 4.339844 c -0.457031 -0.214844 -0.964844 -0.339844 -1.5 -0.339844 c -1.921875 0 -3.5 1.578125 -3.5 3.5 s 1.578125 3.5 3.5 3.5 c 1.914062 0 3.492188 -1.570312 3.5 -3.484375 c 0 -0.003906 0 -0.011719 0 -0.015625 v -7.5 c 0 -0.5625 0.4375 -1 1 -1 h 4 c 0.5625 0 1 0.4375 1 1 v 4.339844 c -0.457031 -0.214844 -0.964844 -0.339844 -1.5 -0.339844 c -1.921875 0 -3.5 1.578125 -3.5 3.5 s 1.578125 3.5 3.5 3.5 s 3.5 -1.578125 3.5 -3.5 v -7.5 c 0 -1.644531 -1.355469 -3 -3 -3 z m -4.5 9 c 0.839844 0 1.5 0.660156 1.5 1.5 v 0.015625 c -0.007812 0.832031 -0.664062 1.484375 -1.5 1.484375 c -0.839844 0 -1.5 -0.660156 -1.5 -1.5 s 0.660156 -1.5 1.5 -1.5 z m 8 0 c 0.839844 0 1.5 0.660156 1.5 1.5 s -0.660156 1.5 -1.5 1.5 s -1.5 -0.660156 -1.5 -1.5 s 0.660156 -1.5 1.5 -1.5 z m 0 0", "key": "b8ong2" }]], "aliases": ["folder-music-symbolic"], "gtkIconName": "folder-music-symbolic" };
__iconData$5F.node;
const FolderMusic = createAdwaitaIcon(__iconData$5F);

const __iconData$5E = { "name": "folder-new", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 1 c -1.644531 0 -3 1.355469 -3 3 v 8 c 0 1.644531 1.355469 3 3 3 h 3 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 h -3 c -0.5625 0 -1 -0.4375 -1 -1 v -7 h 11 c 0.5625 0 1 0.4375 1 1 v 1 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -1 c 0 -1.644531 -1.355469 -3 -3 -3 h -3.585938 l -1.707031 -1.707031 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0 2 h 3.585938 l 1 1 h -5.585938 c 0 -0.5625 0.4375 -1 1 -1 z m 8 5 v 3 h -3 v 2 h 3 v 3 h 2 v -3 h 3 v -2 h -3 v -3 z m 0 0", "key": "8uysmk" }]], "aliases": ["folder-new-symbolic"], "gtkIconName": "folder-new-symbolic" };
__iconData$5E.node;
const FolderNew = createAdwaitaIcon(__iconData$5E);

const __iconData$5D = { "name": "folder-open", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 1 c -1.644531 0 -3 1.355469 -3 3 v 8 c 0 1.644531 1.355469 3 3 3 h 8.882812 c 0.832032 0 1.578126 -0.402344 2.054688 -0.9375 c 0.472656 -0.53125 0.738281 -1.167969 0.910156 -1.800781 l 0.972656 -2.609375 c 0.390626 -1.449219 -0.09375 -2.652344 -0.820312 -3.167969 c -0.484375 -0.34375 -0.714844 -0.292969 -1 -0.324219 v -1.160156 c 0 -0.855469 -0.558594 -1.589844 -1.09375 -1.828125 c -0.417969 -0.1875 -0.808594 -0.183594 -0.953125 -0.171875 h -3.539063 l -1.707031 -1.707031 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0 2 h 2.585938 l 1.707031 1.707031 c 0.1875 0.1875 0.441406 0.292969 0.707031 0.292969 h 4 v 1 h -5 h 0.039062 c -0.914062 -0.039062 -1.746093 0.394531 -2.1875 0.96875 c -0.714843 1.226562 -1.160156 2.28125 -1.800781 3.71875 c -0.171875 0.527344 0.113281 1.09375 0.636719 1.265625 c 0.527344 0.167969 1.09375 -0.117187 1.261719 -0.640625 c 0.488281 -1.011719 0.921875 -1.816406 1.339843 -2.808594 c 0.210938 -0.503906 0.703126 -0.492187 0.898438 -0.503906 h 5.8125 c 1 0 1.046875 0.703125 0.886719 1.128906 l -0.96875 2.609375 c -0.121094 0.4375 -0.300781 0.800781 -0.476563 0.996094 c -0.175781 0.199219 -0.285156 0.265625 -0.558594 0.265625 h -8.882812 c -0.570312 0 -1 -0.429688 -1 -1 v -8 c 0 -0.570312 0.46875 -0.792969 1 -1 z m 9.105469 1.996094 h 0.003906 v 0.003906 h 0.003906 l -0.003906 0.003906 h -0.003906 v -0.003906 c -0.003907 0 -0.007813 0 -0.011719 0 h -0.003906 l -0.003906 -0.003906 z m 0 0", "key": "mi9zp7" }]], "aliases": ["folder-open-symbolic"], "gtkIconName": "folder-open-symbolic" };
__iconData$5D.node;
const FolderOpen = createAdwaitaIcon(__iconData$5D);

const __iconData$5C = { "name": "folder-pictures", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 6.015625 5.03125 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 s 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m 3.5 3 l -2 2 l -1.5 -1 l -2 2 v 0.5 c 0 0.5 0.5 0.5 0.5 0.5 h 7 s 0.472656 -0.035156 0.5 -0.5 v -1 z m 0 0", "key": "1cdgx9" }], ["path", { "fill": "currentColor", "d": "m 4.015625 1.03125 c -1.644531 0 -3 1.355469 -3 3 v 8 c 0 1.644531 1.355469 3 3 3 h 8 c 1.644531 0 3 -1.355469 3 -3 v -8 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 2 h 8 c 0.570313 0 1 0.429688 1 1 v 8 c 0 0.570312 -0.429687 1 -1 1 h -8 c -0.570313 0 -1 -0.429688 -1 -1 v -8 c 0 -0.570312 0.429687 -1 1 -1 z m 0 0", "key": "w6udhs" }]], "aliases": ["folder-pictures-symbolic"], "gtkIconName": "folder-pictures-symbolic" };
__iconData$5C.node;
const FolderPictures = createAdwaitaIcon(__iconData$5C);

const __iconData$5B = { "name": "folder-publicshare", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 13 0 c -1.65625 0 -3 1.339844 -3 3 c 0 0.121094 0.011719 0.246094 0.027344 0.367188 l -4.945313 2.472656 c -0.558593 -0.539063 -1.304687 -0.839844 -2.082031 -0.839844 c -1.65625 0 -3 1.339844 -3 3 c 0 1.65625 1.34375 3 3 3 c 0.773438 -0.003906 1.519531 -0.308594 2.074219 -0.84375 l 4.953125 2.472656 c -0.015625 0.121094 -0.027344 0.246094 -0.027344 0.371094 c 0 1.65625 1.34375 3 3 3 s 3 -1.34375 3 -3 c 0 -1.660156 -1.34375 -3 -3 -3 c -0.773438 0 -1.519531 0.304688 -2.074219 0.84375 l -4.953125 -2.476562 c 0.015625 -0.121094 0.027344 -0.246094 0.027344 -0.367188 c 0 -0.125 -0.007812 -0.25 -0.023438 -0.371094 l 4.945313 -2.472656 c 0.558594 0.535156 1.304687 0.839844 2.078125 0.84375 c 1.65625 0 3 -1.34375 3 -3 c 0 -1.660156 -1.34375 -3 -3 -3 z m 0 0", "key": "11t8hj" }]], "aliases": ["folder-publicshare-symbolic"], "gtkIconName": "folder-publicshare-symbolic" };
__iconData$5B.node;
const FolderPublicshare = createAdwaitaIcon(__iconData$5B);

const __iconData$5A = { "name": "folder-remote", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4 0 c -1.644531 0 -3 1.355469 -3 3 v 5.015625 c 0 1.644531 1.355469 3 3 3 h 2.988281 v 1.253906 c -0.289062 0.171875 -0.535156 0.414063 -0.707031 0.703125 h -3.285156 c -0.554688 0 -1 0.449219 -1 1 c 0 0.550782 0.445312 1 1 1 h 3.246094 c 0.351562 0.640625 1.023437 1.035156 1.753906 1.039063 c 0.726562 -0.003907 1.398437 -0.398438 1.75 -1.039063 h 3.261718 c 0.550782 0 1 -0.449218 1 -1 c 0 -0.550781 -0.449218 -1 -1 -1 h -3.292968 c -0.175782 -0.289062 -0.421875 -0.53125 -0.714844 -0.703125 v -1.253906 h 3 c 1.644531 0 3 -1.355469 3 -3 v -3.015625 c 0 -1.644531 -1.355469 -3 -3 -3 h -2.585938 l -1.707031 -1.707031 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0 2 h 2.585938 l 1 1 h -4.585938 c 0 -0.5625 0.4375 -1 1 -1 z m -1 2 h 9 c 0.5625 0 1 0.4375 1 1 v 3.015625 c 0 0.5625 -0.4375 1 -1 1 h -8 c -0.5625 0 -1 -0.4375 -1 -1 z m 4.996094 9 c 0.554687 0 1.003906 0.449219 1.003906 1.007812 c 0 0.554688 -0.449219 1.003907 -1.003906 1.003907 c -0.558594 0 -1.007813 -0.449219 -1.007813 -1.003907 c 0 -0.558593 0.449219 -1.007812 1.007813 -1.007812 z m 0 0", "key": "ediqsw" }]], "aliases": ["folder-remote-symbolic"], "gtkIconName": "folder-remote-symbolic" };
__iconData$5A.node;
const FolderRemote = createAdwaitaIcon(__iconData$5A);

const __iconData$5z = { "name": "folder-saved-search", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 6.574219 0.0625 c -3.578125 0 -6.5000002 2.921875 -6.5000002 6.5 s 2.9218752 6.496094 6.5000002 6.496094 c 1.429687 0 2.753906 -0.464844 3.828125 -1.253906 l 2.972656 2.972656 c 0.957031 0.941406 2.363281 -0.496094 1.40625 -1.4375 l -2.957031 -2.957032 c 0.78125 -1.074218 1.25 -2.394531 1.25 -3.820312 c 0 -3.578125 -2.925781 -6.5 -6.5 -6.5 z m 0 2 c 2.496093 0 4.5 2.003906 4.5 4.5 s -2.003907 4.496094 -4.5 4.496094 c -2.5 0 -4.5 -2 -4.5 -4.496094 s 2 -4.5 4.5 -4.5 z m 0 0", "key": "kbbpbh" }]], "aliases": ["folder-saved-search-symbolic"], "gtkIconName": "folder-saved-search-symbolic" };
__iconData$5z.node;
const FolderSavedSearch = createAdwaitaIcon(__iconData$5z);

const __iconData$5y = { "name": "folder-templates", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 5 1.003906 c -1.644531 0 -3 1.355469 -3 3 v 6.996094 h 1 v -0.996094 h 1 v -6 c 0 -0.570312 0.429688 -1 1 -1 h 4 v 1.5 c 0 1 0.5 1.5 1.5 1.5 h 1.5 v 7 h 1 v 1 h 1 v -8.5 c 0 -0.265625 -0.105469 -0.519531 -0.292969 -0.707031 l -3.5 -3.5 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 8 13 h -1 v 0.992188 h -1 v 1 h 1 v -0.992188 h 1 z m -2 0.992188 v -1 h -1 v 1 z m -1 0 h -1 v 1 h 1 z m -1 0 v -1 h -1 v 1 z m -1 0 h -1 v 1 h 1 z m -1 0 v -1 h -1 v 1 z m -1 0 h -1 v 1 h 1 z m -1 0 v -1 h -1 v 1 z m -1 0 h -1 v 1 h 1 z m -1 0 v -1 h -1 v 1 z m 0 -1 h 1 v -1 h -1 z m 0 -1 v -1 h -1 v 1 z m 0 -1 h 1 v -1 h -1 z m 0 0", "key": "1lev1d" }]], "aliases": ["folder-templates-symbolic"], "gtkIconName": "folder-templates-symbolic" };
__iconData$5y.node;
const FolderTemplates = createAdwaitaIcon(__iconData$5y);

const __iconData$5x = { "name": "folder-videos", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 3.003906 c -1.644531 0 -3 1.355469 -3 3 v 1.425782 l -3.320312 -3.433594 h -0.679688 v 9 h 0.644531 l 3.355469 -3.492188 v 1.5 c 0 1.644532 1.355469 3 3 3 h 6 c 1.644531 0 3 -1.355468 3 -3 v -5 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 2 h 6 c 0.570312 0 1 0.429688 1 1 v 5 c 0 0.570313 -0.429688 1 -1 1 h -6 c -0.570312 0 -1 -0.429687 -1 -1 v -5 c 0 -0.570312 0.429688 -1 1 -1 z m 0 0", "key": "a2pks2" }]], "aliases": ["folder-videos-symbolic"], "gtkIconName": "folder-videos-symbolic" };
__iconData$5x.node;
const FolderVideos = createAdwaitaIcon(__iconData$5x);

const __iconData$5w = { "name": "folder-visiting", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 2.96875 1.003906 c -1.644531 0 -3 1.355469 -3 3 v 8 c 0 1.644532 1.355469 3 3 3 h 10 c 1.644531 0 3 -1.355468 3 -3 v -6 c 0 -1.644531 -1.355469 -3 -3 -3 h -3.585938 l -1.707031 -1.707031 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0 2 h 3.585938 l 1.707031 1.707032 c 0.1875 0.1875 0.441406 0.292968 0.707031 0.292968 h 4 c 0.5625 0 1 0.4375 1 1 v 6 c 0 0.566406 -0.4375 1 -1 1 h -10 c -0.5625 0 -1 -0.433594 -1 -1 v -8 c 0 -0.5625 0.4375 -1 1 -1 z m 0 0", "key": "ebxwmt" }]], "aliases": ["folder-visiting-symbolic"], "gtkIconName": "folder-visiting-symbolic" };
__iconData$5w.node;
const FolderVisiting = createAdwaitaIcon(__iconData$5w);

const __iconData$5v = { "name": "folder", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 2.96875 1.003906 c -1.644531 0 -3 1.355469 -3 3 v 8 c 0 1.644532 1.355469 3 3 3 h 10 c 1.644531 0 3 -1.355468 3 -3 v -6 c 0 -1.644531 -1.355469 -3 -3 -3 h -3.585938 l -1.707031 -1.707031 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0 2 h 3.585938 l 1 1 h -5.585938 c 0 -0.5625 0.4375 -1 1 -1 z m -1 2 h 11 c 0.5625 0 1 0.4375 1 1 v 6 c 0 0.5625 -0.4375 1 -1 1 h -10 c -0.5625 0 -1 -0.4375 -1 -1 z m 0 0", "key": "1abc9j" }]], "aliases": ["folder-symbolic"], "gtkIconName": "folder-symbolic" };
__iconData$5v.node;
const Folder = createAdwaitaIcon(__iconData$5v);

const __iconData$5u = { "name": "font-select", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 0 5 v 6 h 1 v -0.007812 c 0.265625 0.003906 0.519531 -0.101563 0.707031 -0.285157 l 2 -2 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 l -2 -2 c -0.1875 -0.183594 -0.441406 -0.289063 -0.707031 -0.285157 v -0.007812 z m 0 0", "key": "19kkj4" }], ["path", { "fill": "currentColor", "d": "m 16 5 v 6 h -1 v -0.007812 c -0.265625 0.003906 -0.519531 -0.101563 -0.707031 -0.285157 l -2 -2 c -0.390625 -0.390625 -0.390625 -1.023437 0 -1.414062 l 2 -2 c 0.1875 -0.183594 0.441406 -0.289063 0.707031 -0.289063 v -0.003906 z m 0 0", "key": "nz89bd" }], ["path", { "fill": "currentColor", "d": "m 7 3.011719 v 2 h 1.917969 c -0.054688 0 0.085937 0.160156 0.085937 0.082031 v 0.921875 h -1.003906 c -1.714844 0 -3.03125 1.128906 -3.054688 2.484375 c -0.011718 0.679688 0.304688 1.363281 0.859376 1.824219 c 0.558593 0.460937 1.316406 0.699219 2.195312 0.699219 h 3.003906 v -5.929688 c 0 -1.171875 -0.886718 -2.082031 -2.085937 -2.082031 z m 1 5.007812 h 1.003906 v 1.003907 h -1.003906 c -0.519531 0 -0.792969 -0.136719 -0.921875 -0.242188 c -0.125 -0.105469 -0.132813 -0.171875 -0.132813 -0.242188 c 0.003907 -0.144531 0.085938 -0.519531 1.054688 -0.519531 z m 0 0", "key": "pxrh0h" }]], "aliases": ["font-select-symbolic"], "gtkIconName": "font-select-symbolic" };
__iconData$5u.node;
const FontSelect = createAdwaitaIcon(__iconData$5u);

const __iconData$5t = { "name": "font-x-generic", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 10.015625 2.015625 c -0.550781 0 -1 0.449219 -1 1 v 11 c 0 0.550781 0.449219 1 1 1 h 3 c 1.636719 0 2.988281 -1.347656 2.988281 -2.984375 v -2.042969 c 0 -1.636719 -1.351562 -2.984375 -2.988281 -2.984375 h -2 v -3.988281 c 0 -0.550781 -0.449219 -1 -1 -1 z m -8 3 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 h 2 c 0.558594 0 0.992187 0.429687 1 0.988281 h -1.402344 c -1.925781 -0.042968 -3.5429685 1.507813 -3.582031 3.429688 v 0.019531 c 0 1.957031 1.605469 3.5625 3.558594 3.5625 h 2.425781 c 0.550781 0 1 -0.449219 1 -1 v -6 c 0 -1.644531 -1.355469 -3 -3 -3 z m 9 3.988281 h 2 c 0.554687 0 0.988281 0.429688 0.988281 0.984375 v 2.042969 c 0 0.554688 -0.433594 0.984375 -0.988281 0.984375 h -2 z m -7.445313 1 h 0.023438 h 1.421875 v 3.011719 h -1.425781 c -0.867188 0 -1.546875 -0.683594 -1.554688 -1.550781 c 0.023438 -0.835938 0.695313 -1.480469 1.535156 -1.460938 z m 0 0", "key": "13grtv" }]], "aliases": ["font-x-generic-symbolic"], "gtkIconName": "font-x-generic-symbolic" };
__iconData$5t.node;
const FontXGeneric = createAdwaitaIcon(__iconData$5t);

const __iconData$5s = { "name": "format-indent-less-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1 1 v 2 h 14 v -2 z m 0 4 v 2 h 8 v -2 z m 11.292969 0 v 0.007812 c 0.265625 -0.003906 0.519531 0.101563 0.707031 0.285157 l 2 2 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 l -2 2 c -0.1875 0.183594 -0.441406 0.289063 -0.707031 0.289063 v 0.003906 h -1 v -6 z m -11.292969 4 v 2 h 8 v -2 z m 3 4 v 2 h 11 v -2 z m 0 0", "key": "1ucwfk" }]], "aliases": ["format-indent-less-rtl-symbolic"], "gtkIconName": "format-indent-less-rtl-symbolic" };
__iconData$5s.node;
const FormatIndentLessRtl = createAdwaitaIcon(__iconData$5s);

const __iconData$5r = { "name": "format-indent-less", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 15 1 v 2 h -14 v -2 z m 0 4 v 2 h -8 v -2 z m -11.292969 0 v 0.007812 c -0.265625 -0.003906 -0.519531 0.101563 -0.707031 0.285157 l -2 2 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 l 2 2 c 0.1875 0.183594 0.441406 0.289063 0.707031 0.289063 v 0.003906 h 1 v -6 z m 11.292969 4 v 2 h -8 v -2 z m -3 4 v 2 h -11 v -2 z m 0 0", "key": "c8et35" }]], "aliases": ["format-indent-less-symbolic"], "gtkIconName": "format-indent-less-symbolic" };
__iconData$5r.node;
const FormatIndentLess = createAdwaitaIcon(__iconData$5r);

const __iconData$5q = { "name": "format-indent-more-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 15 1 v 2 h -14 v -2 z m 0 4 v 6 h -1 v -0.007812 c -0.265625 0.003906 -0.519531 -0.101563 -0.707031 -0.285157 l -2 -2 c -0.390625 -0.390625 -0.390625 -1.023437 0 -1.414062 l 2 -2 c 0.1875 -0.183594 0.441406 -0.289063 0.707031 -0.289063 v -0.003906 z m -6 0 v 2 h -8 v -2 z m 0 4 v 2 h -8 v -2 z m 6 4 v 2 h -11 v -2 z m 0 0", "key": "d034g2" }]], "aliases": ["format-indent-more-rtl-symbolic"], "gtkIconName": "format-indent-more-rtl-symbolic" };
__iconData$5q.node;
const FormatIndentMoreRtl = createAdwaitaIcon(__iconData$5q);

const __iconData$5p = { "name": "format-indent-more", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1 1 v 2 h 14 v -2 z m 0 4 v 6 h 1 v -0.007812 c 0.265625 0.003906 0.519531 -0.101563 0.707031 -0.285157 l 2 -2 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 l -2 -2 c -0.1875 -0.183594 -0.441406 -0.289063 -0.707031 -0.289063 v -0.003906 z m 6 0 v 2 h 8 v -2 z m 0 4 v 2 h 8 v -2 z m -6 4 v 2 h 11 v -2 z m 0 0", "key": "sgjore" }]], "aliases": ["format-indent-more-symbolic"], "gtkIconName": "format-indent-more-symbolic" };
__iconData$5p.node;
const FormatIndentMore = createAdwaitaIcon(__iconData$5p);

const __iconData$5o = { "name": "format-justify-center", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1 1 v 2 h 14 v -2 z m 2 4 v 2 h 10 v -2 z m -2 4 v 2 h 14 v -2 z m 2 4 v 2 h 10 v -2 z m 0 0", "key": "1xwrkr" }]], "aliases": ["format-justify-center-symbolic"], "gtkIconName": "format-justify-center-symbolic" };
__iconData$5o.node;
const FormatJustifyCenter = createAdwaitaIcon(__iconData$5o);

const __iconData$5n = { "name": "format-justify-fill", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1 1 v 2 h 14 v -2 z m 0 4 v 2 h 14 v -2 z m 0 4 v 2 h 14 v -2 z m 0 4 v 2 h 14 v -2 z m 0 0", "key": "1cd2ie" }]], "aliases": ["format-justify-fill-symbolic"], "gtkIconName": "format-justify-fill-symbolic" };
__iconData$5n.node;
const FormatJustifyFill = createAdwaitaIcon(__iconData$5n);

const __iconData$5m = { "name": "format-justify-left", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1 1 v 2 h 14 v -2 z m 0 4 v 2 h 10 v -2 z m 0 4 v 2 h 14 v -2 z m 0 4 v 2 h 10 v -2 z m 0 0", "key": "pwmqam" }]], "aliases": ["format-justify-left-symbolic"], "gtkIconName": "format-justify-left-symbolic" };
__iconData$5m.node;
const FormatJustifyLeft = createAdwaitaIcon(__iconData$5m);

const __iconData$5l = { "name": "format-justify-right", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 15 1 v 2 h -14 v -2 z m 0 4 v 2 h -10 v -2 z m 0 4 v 2 h -14 v -2 z m 0 4 v 2 h -10 v -2 z m 0 0", "key": "1amo2f" }]], "aliases": ["format-justify-right-symbolic"], "gtkIconName": "format-justify-right-symbolic" };
__iconData$5l.node;
const FormatJustifyRight = createAdwaitaIcon(__iconData$5l);

const __iconData$5k = { "name": "format-text-bold", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4 3 v 2 h 5 c 0.429688 0 1 0.613281 1 1 v 1 h -5 c -0.917969 0 -1.734375 0.378906 -2.25 0.964844 c -0.515625 0.585937 -0.742188 1.324218 -0.738281 2.046875 c 0.007812 0.71875 0.246093 1.445312 0.757812 2.027343 c 0.515625 0.578126 1.320313 0.960938 2.230469 0.960938 h 9 v -7 c 0 -1.632812 -1.320312 -3 -3 -3 z m 3 6 h 3 v 2 h -3 c -0.398438 0 -0.578125 -0.117188 -0.730469 -0.289062 c -0.152343 -0.167969 -0.253906 -0.441407 -0.257812 -0.722657 c 0 -0.277343 0.09375 -0.539062 0.238281 -0.703125 c 0.148438 -0.164062 0.328125 -0.285156 0.75 -0.285156 z m 0 0", "key": "1fwgk1" }]], "aliases": ["format-text-bold-symbolic"], "gtkIconName": "format-text-bold-symbolic" };
__iconData$5k.node;
const FormatTextBold = createAdwaitaIcon(__iconData$5k);

const __iconData$5j = { "name": "format-text-direction-ltr", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 2 1 v 2 h 6 c 0.429688 0 1 0.613281 1 1 v 1 h -5 c -0.917969 0 -1.734375 0.382812 -2.25 0.96875 s -0.757812 1.3125 -0.75 2.03125 s 0.269531 1.453125 0.78125 2.03125 s 1.308594 0.96875 2.21875 0.96875 h 7 v -7 c 0 -1.632812 -1.320312 -3 -3 -3 z m 2 6 h 5 v 2 h -5 c -0.398438 0 -0.566406 -0.109375 -0.71875 -0.28125 s -0.277344 -0.4375 -0.28125 -0.71875 s 0.105469 -0.554688 0.25 -0.71875 s 0.328125 -0.28125 0.75 -0.28125 z m 8 3 v 2 h -11 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 h 11 v 2 h 1 v -0.007812 c 0.265625 0.003906 0.519531 -0.101563 0.707031 -0.285157 l 2 -2 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 l -2 -2 c -0.1875 -0.183594 -0.441406 -0.289063 -0.707031 -0.289063 v -0.003906 z m 0 0", "key": "1xb0l1" }]], "aliases": ["format-text-direction-ltr-symbolic"], "gtkIconName": "format-text-direction-ltr-symbolic" };
__iconData$5j.node;
const FormatTextDirectionLtr = createAdwaitaIcon(__iconData$5j);

const __iconData$5i = { "name": "format-text-direction-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 6 1 v 2 h 6 c 0.429688 0 1 0.613281 1 1 v 1 h -5 c -0.917969 0 -1.734375 0.382812 -2.25 0.96875 s -0.757812 1.3125 -0.75 2.03125 s 0.269531 1.453125 0.78125 2.03125 s 1.308594 0.96875 2.21875 0.96875 h 7 v -7 c 0 -1.632812 -1.320312 -3 -3 -3 z m 2 6 h 5 v 2 h -5 c -0.398438 0 -0.566406 -0.109375 -0.71875 -0.28125 s -0.277344 -0.4375 -0.28125 -0.71875 s 0.105469 -0.554688 0.25 -0.71875 s 0.328125 -0.28125 0.75 -0.28125 z m -5 3 v 0.007812 c -0.265625 -0.003906 -0.519531 0.101563 -0.707031 0.285157 l -2 2 c -0.3906252 0.390625 -0.3906252 1.023437 0 1.414062 l 2 2 c 0.1875 0.183594 0.441406 0.289063 0.707031 0.289063 v 0.003906 h 1 v -2 h 11 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 h -11 v -2 z m 0 0", "key": "1ifcog" }]], "aliases": ["format-text-direction-rtl-symbolic"], "gtkIconName": "format-text-direction-rtl-symbolic" };
__iconData$5i.node;
const FormatTextDirectionRtl = createAdwaitaIcon(__iconData$5i);

const __iconData$5h = { "name": "format-text-direction", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 2 1 v 2 h 6 c 0.429688 0 1 0.613281 1 1 v 1 h -5 c -0.917969 0 -1.734375 0.382812 -2.25 0.96875 s -0.757812 1.3125 -0.75 2.03125 s 0.269531 1.453125 0.78125 2.03125 s 1.308594 0.96875 2.21875 0.96875 h 7 v -7 c 0 -1.632812 -1.320312 -3 -3 -3 z m 2 6 h 5 v 2 h -5 c -0.398438 0 -0.566406 -0.109375 -0.71875 -0.28125 s -0.277344 -0.4375 -0.28125 -0.71875 s 0.105469 -0.554688 0.25 -0.71875 s 0.328125 -0.28125 0.75 -0.28125 z m 8 3 v 2 h -11 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 h 11 v 2 h 1 v -0.007812 c 0.265625 0.003906 0.519531 -0.101563 0.707031 -0.285157 l 2 -2 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 l -2 -2 c -0.1875 -0.183594 -0.441406 -0.289063 -0.707031 -0.289063 v -0.003906 z m 0 0", "key": "1xb0l1" }]], "aliases": ["format-text-direction-symbolic"], "gtkIconName": "format-text-direction-symbolic" };
__iconData$5h.node;
const FormatTextDirection = createAdwaitaIcon(__iconData$5h);

const __iconData$5g = { "name": "format-text-italic", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 5 3 v 2 h 6 c 0.429688 0 0.609375 0.28125 0.480469 0.730469 l -0.347657 1.269531 h -5.242187 c -1.839844 0 -3.132813 1.34375 -3.503906 2.738281 c -0.1875 0.699219 -0.175781 1.480469 0.238281 2.15625 c 0.410156 0.675781 1.25 1.105469 2.15625 1.105469 h 6.761719 l 1.863281 -6.730469 c 0.4375 -1.570312 -0.726562 -3.269531 -2.40625 -3.269531 z m 0.890625 6 h 4.683594 l -0.554688 2 h -5.238281 c -0.394531 0 -0.40625 -0.070312 -0.449219 -0.144531 c -0.046875 -0.074219 -0.097656 -0.292969 -0.015625 -0.59375 c 0.160156 -0.605469 0.730469 -1.261719 1.574219 -1.261719 z m 0 0", "key": "gb6u2l" }]], "aliases": ["format-text-italic-symbolic"], "gtkIconName": "format-text-italic-symbolic" };
__iconData$5g.node;
const FormatTextItalic = createAdwaitaIcon(__iconData$5g);

const __iconData$5f = { "name": "format-text-plaintext", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 6.992188 1 c -0.410157 0 -0.777344 0.25 -0.929688 0.628906 l -2 5 c -0.046875 0.117188 -0.070312 0.242188 -0.070312 0.371094 v 7 h 2 v -3 h 4.003906 l 0.003906 3 h 2 l -0.007812 -7 c 0 -0.128906 -0.023438 -0.253906 -0.074219 -0.371094 l -2 -5 c -0.148438 -0.378906 -0.515625 -0.628906 -0.925781 -0.628906 z m 0.675781 2 h 0.644531 l 1.679688 4.195312 l 0.003906 1.804688 h -4.003906 v -1.804688 z m 0 0", "key": "frwedq" }]], "aliases": ["format-text-plaintext-symbolic"], "gtkIconName": "format-text-plaintext-symbolic" };
__iconData$5f.node;
const FormatTextPlaintext = createAdwaitaIcon(__iconData$5f);

const __iconData$5e = { "name": "format-text-rich", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 6.53125 1 l -3.539062 12 h -1 v 1 h 4 v -1 h -0.957032 l 0.894532 -3 h 3.125 l 0.890624 3 h -0.953124 v 1 h 5 v -1 h -0.660157 l -3.839843 -12 z m 0.960938 3.789062 l 1.261718 4.210938 h -2.527344 z m 0 0", "key": "ymo3vg" }]], "aliases": ["format-text-rich-symbolic"], "gtkIconName": "format-text-rich-symbolic" };
__iconData$5e.node;
const FormatTextRich = createAdwaitaIcon(__iconData$5e);

const __iconData$5d = { "name": "format-text-strikethrough", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4 3 v 2 h 6 c 0.429688 0 1 0.613281 1 1 h 2 c 0 -1.632812 -1.320312 -3 -3 -3 z m -3 4 v 2 h 14 v -2 z m 2 3 c 0.007812 0.71875 0.269531 1.453125 0.78125 2.03125 s 1.308594 0.96875 2.21875 0.96875 h 7 v -3 h -2 v 1 h -5 c -0.398438 0 -0.566406 -0.109375 -0.71875 -0.28125 s -0.277344 -0.4375 -0.28125 -0.71875 z m 0 0", "key": "n7jovy" }]], "aliases": ["format-text-strikethrough-symbolic"], "gtkIconName": "format-text-strikethrough-symbolic" };
__iconData$5d.node;
const FormatTextStrikethrough = createAdwaitaIcon(__iconData$5d);

const __iconData$5c = { "name": "format-text-underline", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4 2 v 2 h 6 c 0.429688 0 1 0.613281 1 1 v 1 h -5 c -0.917969 0 -1.734375 0.378906 -2.25 0.964844 c -0.515625 0.585937 -0.742188 1.324218 -0.738281 2.046875 c 0.007812 0.71875 0.246093 1.445312 0.757812 2.027343 c 0.515625 0.578126 1.320313 0.960938 2.230469 0.960938 h 7 v -7 c 0 -1.632812 -1.320312 -3 -3 -3 z m 2 6 h 5 v 2 h -5 c -0.398438 0 -0.578125 -0.117188 -0.730469 -0.289062 c -0.152343 -0.167969 -0.253906 -0.441407 -0.257812 -0.722657 c 0 -0.277343 0.09375 -0.539062 0.238281 -0.703125 c 0.148438 -0.164062 0.328125 -0.285156 0.75 -0.285156 z m -4 5 v 2 h 12 v -2 z m 0 0", "key": "s0nbjw" }]], "aliases": ["format-text-underline-symbolic"], "gtkIconName": "format-text-underline-symbolic" };
__iconData$5c.node;
const FormatTextUnderline = createAdwaitaIcon(__iconData$5c);

const __iconData$5b = { "name": "gnome-power-manager", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M3.469 0c-.49 0-.796.229-1.032.47C2.202.71 2 1.03 2 1.503V2H0v14h7v-2l-4.95.05L2 4h2V2h3v2h2v1h2V2H9v-.403A1.669 1.669 0 008.594.564 1.528 1.528 0 007.437.03V0H3.47z", "key": "15tb7v" }], ["path", { "fill": "currentColor", "fill-rule": "evenodd", "d": "M6 10h2c.276-1.103 1.065-3.724 3-4h3v2h2v2h-2v2h2v2h-2v2h-3c-1.935-.276-2.724-2.897-3-4H6z", "key": "re5ez4" }]], "aliases": ["gnome-power-manager-symbolic"], "gtkIconName": "gnome-power-manager-symbolic" };
__iconData$5b.node;
const GnomePowerManager = createAdwaitaIcon(__iconData$5b);

const __iconData$5a = { "name": "go-bottom", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1.84375 3.011719 c -0.207031 0.03125 -0.402344 0.128906 -0.550781 0.28125 c -0.1875 0.1875 -0.292969 0.441406 -0.292969 0.707031 s 0.105469 0.519531 0.292969 0.707031 l 6 6 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 l 6 -6 c 0.1875 -0.1875 0.292969 -0.441406 0.292969 -0.707031 s -0.105469 -0.519531 -0.292969 -0.707031 c -0.390625 -0.390625 -1.023437 -0.390625 -1.414062 0 l -5.292969 5.292969 l -5.292969 -5.292969 c -0.226562 -0.226563 -0.546875 -0.332031 -0.863281 -0.28125 z m -0.84375 7.988281 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 h 14 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m 0 0", "key": "12mo1l" }]], "aliases": ["go-bottom-symbolic"], "gtkIconName": "go-bottom-symbolic" };
__iconData$5a.node;
const GoBottom = createAdwaitaIcon(__iconData$5a);

const __iconData$59 = { "name": "go-down", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1 5 c 0 -0.265625 0.105469 -0.519531 0.292969 -0.707031 c 0.390625 -0.390625 1.023437 -0.390625 1.414062 0 l 5.292969 5.292969 l 5.292969 -5.292969 c 0.390625 -0.390625 1.023437 -0.390625 1.414062 0 c 0.1875 0.1875 0.292969 0.441406 0.292969 0.707031 s -0.105469 0.519531 -0.292969 0.707031 l -6 6 c -0.390625 0.390625 -1.023437 0.390625 -1.414062 0 l -6 -6 c -0.1875 -0.1875 -0.292969 -0.441406 -0.292969 -0.707031 z m 0 0", "key": "usf09h" }]], "aliases": ["go-down-symbolic"], "gtkIconName": "go-down-symbolic" };
__iconData$59.node;
const GoDown = createAdwaitaIcon(__iconData$59);

const __iconData$58 = { "name": "go-first", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4 0 c -0.550781 0 -1 0.449219 -1 1 v 14 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -14 c 0 -0.550781 -0.449219 -1 -1 -1 z m 7.84375 1.011719 c -0.207031 0.03125 -0.402344 0.128906 -0.550781 0.28125 l -6 6 c -0.1875 0.1875 -0.292969 0.441406 -0.292969 0.707031 s 0.105469 0.519531 0.292969 0.707031 l 6 6 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 c 0.1875 -0.1875 0.292969 -0.441406 0.292969 -0.707031 s -0.105469 -0.519531 -0.292969 -0.707031 l -5.292969 -5.292969 l 5.292969 -5.292969 c 0.1875 -0.1875 0.292969 -0.441406 0.292969 -0.707031 s -0.105469 -0.519531 -0.292969 -0.707031 c -0.226562 -0.226563 -0.546875 -0.332031 -0.863281 -0.28125 z m 0 0", "key": "178cmq" }]], "aliases": ["go-first-symbolic"], "gtkIconName": "go-first-symbolic" };
__iconData$58.node;
const GoFirst = createAdwaitaIcon(__iconData$58);

const __iconData$57 = { "name": "go-home", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0.363281 c -0.5 0 -1 0.167969 -1.40625 0.507813 l -4.464844 3.722656 c -0.714844 0.59375 -1.128906 1.476562 -1.128906 2.40625 v 6 c 0 1.65625 1.34375 3 3 3 h 8 c 1.65625 0 3 -1.34375 3 -3 v -6 c 0 -0.929688 -0.414062 -1.8125 -1.128906 -2.40625 l -4.464844 -3.722656 c -0.40625 -0.339844 -0.90625 -0.507813 -1.40625 -0.507813 z m -0.015625 1.996094 c 0.050781 -0.003906 0.101563 0.011719 0.144531 0.046875 l 4.464844 3.722656 c 0.257812 0.214844 0.40625 0.535156 0.40625 0.871094 v 6 c 0 0.5625 -0.4375 1 -1 1 h -2 v -5 c 0 -0.554688 -0.445312 -1 -1 -1 h -2 c -0.554688 0 -1 0.445312 -1 1 v 5 h -2 c -0.5625 0 -1 -0.4375 -1 -1 v -6 c 0 -0.335938 0.148438 -0.65625 0.40625 -0.871094 l 4.464844 -3.722656 c 0.035156 -0.027344 0.074218 -0.042969 0.113281 -0.046875 z m 0 0", "key": "xb94j4" }]], "aliases": ["go-home-symbolic"], "gtkIconName": "go-home-symbolic" };
__iconData$57.node;
const GoHome = createAdwaitaIcon(__iconData$57);

const __iconData$56 = { "name": "go-jump-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 c 2.753906 0 5 2.246094 5 5 v 10 c 0 0.550781 -0.449219 1 -1 1 s -1 -0.449219 -1 -1 v -10 c 0 -1.679688 -1.320312 -3 -3 -3 s -3 1.320312 -3 3 v 3.585938 l 1.292969 -1.292969 c 0.390625 -0.390625 1.023437 -0.390625 1.414062 0 s 0.390625 1.023437 0 1.414062 l -3 3 c -0.390625 0.390625 -1.023437 0.390625 -1.414062 0 l -3 -3 c -0.3906252 -0.390625 -0.3906252 -1.023437 0 -1.414062 c 0.1875 -0.1875 0.441406 -0.292969 0.707031 -0.292969 s 0.519531 0.105469 0.707031 0.292969 l 1.292969 1.292969 v -3.585938 c 0 -2.753906 2.246094 -5 5 -5 z m 0 0", "key": "adh1ls" }]], "aliases": ["go-jump-rtl-symbolic"], "gtkIconName": "go-jump-rtl-symbolic" };
__iconData$56.node;
const GoJumpRtl = createAdwaitaIcon(__iconData$56);

const __iconData$55 = { "name": "go-jump", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 c -2.753906 0 -5 2.246094 -5 5 v 10 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -10 c 0 -1.679688 1.320312 -3 3 -3 s 3 1.320312 3 3 v 3.585938 l -1.292969 -1.292969 c -0.390625 -0.390625 -1.023437 -0.390625 -1.414062 0 s -0.390625 1.023437 0 1.414062 l 3 3 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 l 3 -3 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 s -0.519531 0.105469 -0.707031 0.292969 l -1.292969 1.292969 v -3.585938 c 0 -2.753906 -2.246094 -5 -5 -5 z m 0 0", "key": "2j6pzh" }]], "aliases": ["go-jump-symbolic"], "gtkIconName": "go-jump-symbolic" };
__iconData$55.node;
const GoJump = createAdwaitaIcon(__iconData$55);

const __iconData$54 = { "name": "go-last", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 12 0 c -0.550781 0 -1 0.449219 -1 1 v 6.964844 c -0.007812 -0.253906 -0.113281 -0.496094 -0.292969 -0.671875 l -6 -6 c -0.390625 -0.390625 -1.023437 -0.390625 -1.414062 0 c -0.1875 0.1875 -0.292969 0.441406 -0.292969 0.707031 s 0.105469 0.519531 0.292969 0.707031 l 5.292969 5.292969 l -5.292969 5.292969 c -0.1875 0.1875 -0.292969 0.441406 -0.292969 0.707031 s 0.105469 0.519531 0.292969 0.707031 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 l 6 -6 c 0.179688 -0.179687 0.285157 -0.417969 0.292969 -0.667969 v 6.960938 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -14 c 0 -0.550781 -0.449219 -1 -1 -1 z m 0 0", "key": "4omsqj" }]], "aliases": ["go-last-symbolic"], "gtkIconName": "go-last-symbolic" };
__iconData$54.node;
const GoLast = createAdwaitaIcon(__iconData$54);

const __iconData$53 = { "name": "go-next", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4 2 c 0 -0.265625 0.105469 -0.519531 0.292969 -0.707031 c 0.390625 -0.390625 1.023437 -0.390625 1.414062 0 l 6 6 c 0.1875 0.1875 0.292969 0.441406 0.292969 0.707031 s -0.105469 0.519531 -0.292969 0.707031 l -6 6 c -0.390625 0.390625 -1.023437 0.390625 -1.414062 0 c -0.1875 -0.1875 -0.292969 -0.441406 -0.292969 -0.707031 s 0.105469 -0.519531 0.292969 -0.707031 l 5.292969 -5.292969 l -5.292969 -5.292969 c -0.1875 -0.1875 -0.292969 -0.441406 -0.292969 -0.707031 z m 0 0", "key": "5zkmi4" }]], "aliases": ["go-next-symbolic"], "gtkIconName": "go-next-symbolic" };
__iconData$53.node;
const GoNext = createAdwaitaIcon(__iconData$53);

const __iconData$52 = { "name": "go-previous", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 12 2 c 0 -0.265625 -0.105469 -0.519531 -0.292969 -0.707031 c -0.390625 -0.390625 -1.023437 -0.390625 -1.414062 0 l -6 6 c -0.1875 0.1875 -0.292969 0.441406 -0.292969 0.707031 s 0.105469 0.519531 0.292969 0.707031 l 6 6 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 c 0.1875 -0.1875 0.292969 -0.441406 0.292969 -0.707031 s -0.105469 -0.519531 -0.292969 -0.707031 l -5.292969 -5.292969 l 5.292969 -5.292969 c 0.1875 -0.1875 0.292969 -0.441406 0.292969 -0.707031 z m 0 0", "key": "go8ic6" }]], "aliases": ["go-previous-symbolic"], "gtkIconName": "go-previous-symbolic" };
__iconData$52.node;
const GoPrevious = createAdwaitaIcon(__iconData$52);

const __iconData$51 = { "name": "go-top", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1 3 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 h 14 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m 6.84375 2.011719 c -0.207031 0.03125 -0.402344 0.128906 -0.550781 0.28125 l -6 6 c -0.1875 0.1875 -0.292969 0.441406 -0.292969 0.707031 s 0.105469 0.519531 0.292969 0.707031 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 l 5.292969 -5.292969 l 5.292969 5.292969 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 c 0.1875 -0.1875 0.292969 -0.441406 0.292969 -0.707031 s -0.105469 -0.519531 -0.292969 -0.707031 l -6 -6 c -0.226562 -0.226563 -0.546875 -0.332031 -0.863281 -0.28125 z m 0 0", "key": "1ebrf1" }]], "aliases": ["go-top-symbolic"], "gtkIconName": "go-top-symbolic" };
__iconData$51.node;
const GoTop = createAdwaitaIcon(__iconData$51);

const __iconData$50 = { "name": "go-up", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1 11 c 0 -0.265625 0.105469 -0.519531 0.292969 -0.707031 l 6 -6 c 0.390625 -0.390625 1.023437 -0.390625 1.414062 0 l 6 6 c 0.1875 0.1875 0.292969 0.441406 0.292969 0.707031 s -0.105469 0.519531 -0.292969 0.707031 c -0.390625 0.390625 -1.023437 0.390625 -1.414062 0 l -5.292969 -5.292969 l -5.292969 5.292969 c -0.390625 0.390625 -1.023437 0.390625 -1.414062 0 c -0.1875 -0.1875 -0.292969 -0.441406 -0.292969 -0.707031 z m 0 0", "key": "1or4pv" }]], "aliases": ["go-up-symbolic"], "gtkIconName": "go-up-symbolic" };
__iconData$50.node;
const GoUp = createAdwaitaIcon(__iconData$50);

const __iconData$4$ = { "name": "goa-panel", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7.664062 0.0078125 c -2.613281 0.1093755 -5.003906 1.4882815 -6.410156 3.6953125 c -1.90625 3 -1.605468 6.898437 0.734375 9.574219 c 2.347657 2.667968 6.175781 3.472656 9.398438 1.96875 c 0.5 -0.234375 0.71875 -0.828125 0.484375 -1.328125 s -0.828125 -0.71875 -1.332032 -0.484375 c -2.414062 1.132812 -5.289062 0.53125 -7.046874 -1.476563 c -1.761719 -2.003906 -1.988282 -4.933593 -0.550782 -7.179687 c 1.429688 -2.253906 4.179688 -3.289063 6.738282 -2.539063 c 2.5625 0.746094 4.324218 3.09375 4.320312 5.761719 v 0.039062 v 0.960938 c 0 0.359375 -0.1875 0.683594 -0.5 0.863281 c -0.308594 0.179688 -0.6875 0.179688 -1 0 c -0.308594 -0.175781 -0.5 -0.507812 -0.5 -0.863281 v -1 c 0 -2.199219 -1.800781 -4 -4 -4 c -2.195312 0 -4 1.800781 -4 4 c 0 2.195312 1.804688 4 4 4 c 1.046875 0 1.992188 -0.417969 2.707031 -1.078125 c 0.222657 0.265625 0.488281 0.496094 0.792969 0.675781 c 0.929688 0.535156 2.074219 0.535156 3 0 c 0.929688 -0.539062 1.5 -1.527344 1.5 -2.597656 v -1 c 0 -3.558594 -2.347656 -6.683594 -5.761719 -7.683594 c -0.835937 -0.2421872 -1.703125 -0.347656 -2.574219 -0.3085935 z m 0.335938 5.9921875 c 1.117188 0 2 0.882812 2 2 c 0 1.113281 -0.882812 2 -2 2 c -1.113281 0 -2 -0.886719 -2 -2 c 0 -1.117188 0.886719 -2 2 -2 z m 0 0", "key": "6oh0if" }]], "aliases": ["goa-panel-symbolic"], "gtkIconName": "goa-panel-symbolic" };
__iconData$4$.node;
const GoaPanel = createAdwaitaIcon(__iconData$4$);

const __iconData$4_ = { "name": "help-about", "size": 16, "node": [["path", { "d": "m 8 0 c -4.410156 0 -8 3.589844 -8 8 s 3.589844 8 8 8 s 8 -3.589844 8 -8 s -3.589844 -8 -8 -8 z m 0 2 c 3.332031 0 6 2.667969 6 6 s -2.667969 6 -6 6 s -6 -2.667969 -6 -6 s 2.667969 -6 6 -6 z m 0 1.875 c -0.621094 0 -1.125 0.503906 -1.125 1.125 s 0.503906 1.125 1.125 1.125 s 1.125 -0.503906 1.125 -1.125 s -0.503906 -1.125 -1.125 -1.125 z m -1.523438 3.125 c -0.265624 0.011719 -0.476562 0.230469 -0.476562 0.5 c 0 0.277344 0.222656 0.5 0.5 0.5 h 0.5 v 3 h -0.5 c -0.277344 0 -0.5 0.222656 -0.5 0.5 s 0.222656 0.5 0.5 0.5 h 3 c 0.277344 0 0.5 -0.222656 0.5 -0.5 s -0.222656 -0.5 -0.5 -0.5 h -0.5 v -4 h -2.5 c -0.007812 0 -0.015625 0 -0.023438 0 z m 0 0", "key": "1mmf5n" }]], "aliases": ["help-about-symbolic"], "gtkIconName": "help-about-symbolic" };
__iconData$4_.node;
const HelpAbout = createAdwaitaIcon(__iconData$4_);

const __iconData$4Z = { "name": "help-browser", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M8 0C3.585 0 0 3.585 0 8s3.585 8 8 8 8-3.585 8-8-3.585-8-8-8zm0 2c3.341 0 6 2.659 6 6s-2.659 6-6 6-6-2.659-6-6 2.659-6 6-6z", "key": "18vuqj" }], ["path", { "fill": "currentColor", "d": "M7.338 5A2.344 2.344 0 005 7.338v1.324A2.344 2.344 0 007.338 11h1.324A2.344 2.344 0 0011 8.662V7.338A2.344 2.344 0 008.662 5zm0 1h1.324C9.412 6 10 6.588 10 7.338v1.324C10 9.412 9.412 10 8.662 10H7.338C6.588 10 6 9.412 6 8.662V7.338C6 6.588 6.588 6 7.338 6z", "key": "aquki3" }], ["path", { "fill": "currentColor", "d": "M4.719 1.438A5.881 5.881 0 001.437 4.75l3.75 1.875c.252-.64.743-1.17 1.375-1.438zm6.562 0l-1.844 3.75a2.574 2.574 0 011.376 1.437l3.75-1.875a5.881 5.881 0 00-3.282-3.313zm-6.094 8l-3.75 1.874a5.904 5.904 0 003.282 3.25l1.875-3.75a2.59 2.59 0 01-1.407-1.374zm5.625 0a2.59 2.59 0 01-1.406 1.374l1.875 3.75a5.904 5.904 0 003.281-3.25z", "key": "wrs6rg" }]], "aliases": ["help-browser-symbolic"], "gtkIconName": "help-browser-symbolic" };
__iconData$4Z.node;
const HelpBrowser = createAdwaitaIcon(__iconData$4Z);

const __iconData$4Y = { "name": "help-contents", "size": 16, "node": [["path", { "d": "m3.025 0 .034.002a2 2 0 0 0-.159 0h-.02l-.024.002A1.98 1.98 0 0 0 1 2.045v11.914A1.98 1.98 0 0 0 3.041 16h9.918A1.98 1.98 0 0 0 15 13.96V5a2 2 0 0 0-.617-1.422L11.426.62A2 2 0 0 0 10.004 0h-.008zm-.017 2c-.002-.002.005 0 .002 0h6.965c-.01 0 .014.011.007.004l.008.008 2.998 3.002.008.006c-.007-.007.004.019.004.01v8.959c-.001-.08-.093.01-.012.012H3.012c.081-.001-.01-.092-.012-.012V2.011c.001.055.027.005.008-.01z", "key": "19q0x7" }], ["path", { "d": "M8 4.877c-2.24 0-4.06 1.82-4.06 4.06A4.063 4.063 0 0 0 8 12.998c2.24 0 4.06-1.82 4.06-4.06A4.063 4.063 0 0 0 8 4.877m0 1a3.043 3.043 0 0 1 3.06 3.06A3.043 3.043 0 0 1 8 11.999a3.043 3.043 0 0 1-3.06-3.06A3.043 3.043 0 0 1 8 5.877", "key": "9k1ccv" }], ["path", { "d": "M8 6.938c-1.1 0-2 .9-2 2 0 1.099.9 2 2 2s2-.901 2-2c0-1.1-.9-2-2-2m0 1c.563 0 1 .437 1 1s-.437 1-1 1-1-.438-1-1 .437-1 1-1", "key": "16hcnt" }], ["path", { "d": "M6.331 5.6a3 3 0 0 0-1.669 1.684l1.908.954a1.3 1.3 0 0 1 .699-.731zm3.338 0L8.73 7.507c.322.136.571.405.7.731l1.907-.954A3 3 0 0 0 9.668 5.6zm-3.1 4.069-1.907.953c.309.757.91 1.348 1.67 1.653l.953-1.907a1.32 1.32 0 0 1-.715-.7zm2.861 0a1.32 1.32 0 0 1-.715.699l.954 1.907a3 3 0 0 0 1.669-1.653z", "key": "o76zt4" }]], "aliases": ["help-contents-symbolic"], "gtkIconName": "help-contents-symbolic" };
__iconData$4Y.node;
const HelpContents = createAdwaitaIcon(__iconData$4Y);

const __iconData$4X = { "name": "help-faq", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M2 5C.892 5 0 5.892 0 7v7c0 1.108.892 2 2 2h9c1.108 0 2-.892 2-2v-3.8L16 7h-3c0-1.108-.892-2-2-2zm4.438 2C7.75 6.926 8.926 7.936 9 9.25c0 1.121-.308 1.544-1.281 2.281a1.68 1.68 0 00-.281.25c-.04.05-.032.033-.032.031.006.423-.39.782-.812.782a.79.79 0 01-.781-.782c0-.401.179-.754.375-1a3.14 3.14 0 01.562-.562 3.85 3.85 0 00.563-.531c.074-.09.097-.24.093-.344v-.031a.785.785 0 00-.843-.75c-.451.025-.813.362-.851.758a.697.697 0 01-.718.648.816.816 0 01-.781-.594 1.725 1.725 0 01.01-.533c.005-.014.006-.03.012-.043.202-1.024 1.09-1.768 2.203-1.83zm.156 6.406a.82.82 0 01.812.813c0 .442-.37.781-.812.781a.768.768 0 01-.781-.781c0-.442.339-.813.78-.813zM2 1C.892 1 0 1.892 0 3v.568A3.918 3.918 0 012 3h9c1.376 0 2.55.763 3.268 1.848L16 3h-3c0-1.108-.892-2-2-2z", "key": "1oqyi0" }]], "aliases": ["help-faq-symbolic"], "gtkIconName": "help-faq-symbolic" };
__iconData$4X.node;
const HelpFaq = createAdwaitaIcon(__iconData$4X);

const __iconData$4W = { "name": "image-loading", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 6 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 5 0 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 5 0 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 0 0", "key": "14xcmx" }]], "aliases": ["image-loading-symbolic"], "gtkIconName": "image-loading-symbolic" };
__iconData$4W.node;
const ImageLoading = createAdwaitaIcon(__iconData$4W);

const __iconData$4V = { "name": "image-missing", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 4.015625 1.03125 c -1.644531 0 -3 1.355469 -3 3 v 1 h 1 v -1 c 0 -1.109375 0.890625 -2 2 -2 h 1 v -1 z m 2 0 v 1 h 4 v -1 z m 5 0 v 1 h 1 c 1.109375 0 2 0.890625 2 2 v 1 h 1 v -1 c 0 -1.644531 -1.355469 -3 -3 -3 z m -5 4 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 s 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m -5 1 v 4 h 1 v -4 z m 13 0 v 4 h 1 v -4 z m -4.5 2 l -2 2 l -1.5 -1 l -2 2 v 0.5 c 0 0.5 0.5 0.5 0.5 0.5 h 7 s 0.472656 -0.035156 0.5 -0.5 v -1 z m -8.5 3 v 1 c 0 1.644531 1.355469 3 3 3 h 1 v -1 h -1 c -1.109375 0 -2 -0.890625 -2 -2 v -1 z m 13 0 v 1 c 0 1.109375 -0.890625 2 -2 2 h -1 v 1 h 1 c 1.644531 0 3 -1.355469 3 -3 v -1 z m -8 3 v 1 h 4 v -1 z m 0 0", "key": "mtl8zk" }]], "aliases": ["image-missing-symbolic"], "gtkIconName": "image-missing-symbolic" };
__iconData$4V.node;
const ImageMissing = createAdwaitaIcon(__iconData$4V);

const __iconData$4U = { "name": "image-x-generic", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 6.015625 5.03125 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 s 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m 3.5 3 l -2 2 l -1.5 -1 l -2 2 v 0.5 c 0 0.5 0.5 0.5 0.5 0.5 h 7 s 0.472656 -0.035156 0.5 -0.5 v -1 z m 0 0", "key": "1cdgx9" }], ["path", { "fill": "currentColor", "d": "m 4.015625 1.03125 c -1.644531 0 -3 1.355469 -3 3 v 8 c 0 1.644531 1.355469 3 3 3 h 8 c 1.644531 0 3 -1.355469 3 -3 v -8 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 2 h 8 c 0.570313 0 1 0.429688 1 1 v 8 c 0 0.570312 -0.429687 1 -1 1 h -8 c -0.570313 0 -1 -0.429688 -1 -1 v -8 c 0 -0.570312 0.429687 -1 1 -1 z m 0 0", "key": "w6udhs" }]], "aliases": ["image-x-generic-symbolic"], "gtkIconName": "image-x-generic-symbolic" };
__iconData$4U.node;
const ImageXGeneric = createAdwaitaIcon(__iconData$4U);

const __iconData$4T = { "name": "inode-directory", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 1.003906 c -1.644531 0 -3 1.355469 -3 3 v 8 c 0 1.644532 1.355469 3 3 3 h 10 c 1.644531 0 3 -1.355468 3 -3 v -6 c 0 -1.644531 -1.355469 -3 -3 -3 h -3.585938 l -1.707031 -1.707031 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0 2 h 3.585938 l 1 1 h -5.585938 c 0 -0.5625 0.4375 -1 1 -1 z m -1 2 h 11 c 0.5625 0 1 0.4375 1 1 v 6 c 0 0.5625 -0.4375 1 -1 1 h -10 c -0.5625 0 -1 -0.4375 -1 -1 z m 0 0", "key": "buhm2m" }]], "aliases": ["inode-directory-symbolic"], "gtkIconName": "inode-directory-symbolic" };
__iconData$4T.node;
const InodeDirectory = createAdwaitaIcon(__iconData$4T);

const __iconData$4S = { "name": "input-dialpad", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 1 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 5 0 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 5 0 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m -10 5 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 5 0 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 5 0 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m -10 5 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 5 0 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 5 0 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 0 0", "key": "1i51s4" }]], "aliases": ["input-dialpad-symbolic"], "gtkIconName": "input-dialpad-symbolic" };
__iconData$4S.node;
const InputDialpad = createAdwaitaIcon(__iconData$4S);

const __iconData$4R = { "name": "input-gaming", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3.46875 2 c -1.660156 0 -2.800781 1 -3 3 c 0 0 -0.5 3 -0.5 5 c 0 0 0 3 3.03125 3 c 2.96875 0 2.96875 -3 2.96875 -3 c 0 -1.5 1.050781 -2.003906 2 -2 c 0.941406 0.003906 2 0.5 2.03125 2 c 0 0 -0.03125 3 2.96875 3 s 3 -3 3 -3 c 0.03125 -2 -0.5 -5 -0.5 -5 c -0.164062 -1.652344 -1.339844 -3 -3 -3 z m 0.75 2 h 0.5 c 0.136719 0 0.25 0.113281 0.25 0.25 v 0.75 h 0.75 c 0.136719 0 0.25 0.113281 0.25 0.25 v 0.5 c 0 0.136719 -0.113281 0.25 -0.25 0.25 h -0.75 v 0.75 c 0 0.136719 -0.113281 0.25 -0.25 0.25 h -0.5 c -0.136719 0 -0.25 -0.113281 -0.25 -0.25 v -0.75 h -0.75 c -0.136719 0 -0.25 -0.113281 -0.25 -0.25 v -0.5 c 0 -0.136719 0.113281 -0.25 0.25 -0.25 h 0.75 v -0.75 c 0 -0.136719 0.113281 -0.25 0.25 -0.25 z m 5.75 0 c 0.550781 0 1 0.449219 1 1 s -0.449219 1 -1 1 s -1 -0.449219 -1 -1 s 0.449219 -1 1 -1 z m 3 2 c 0.550781 0 1 0.449219 1 1 s -0.449219 1 -1 1 s -1 -0.449219 -1 -1 s 0.449219 -1 1 -1 z m 0 0", "key": "y2zbxy" }]], "aliases": ["input-gaming-symbolic"], "gtkIconName": "input-gaming-symbolic" };
__iconData$4R.node;
const InputGaming = createAdwaitaIcon(__iconData$4R);

const __iconData$4Q = { "name": "input-keyboard", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 2.5 2 c -1.367188 0 -2.5 1.132812 -2.5 2.5 v 7 c 0 1.367188 1.132812 2.5 2.5 2.5 h 11 c 1.367188 0 2.5 -1.132812 2.5 -2.5 v -7 c 0 -1.367188 -1.132812 -2.5 -2.5 -2.5 z m 0 2 h 1 c 0.277344 0 0.5 0.222656 0.5 0.5 v 1 c 0 0.277344 -0.222656 0.5 -0.5 0.5 h -1 c -0.277344 0 -0.5 -0.222656 -0.5 -0.5 v -1 c 0 -0.242188 0.171875 -0.445312 0.398438 -0.488281 c 0.03125 -0.007813 0.066406 -0.011719 0.101562 -0.011719 z m 3 0 h 1 c 0.277344 0 0.5 0.222656 0.5 0.5 v 1 c 0 0.277344 -0.222656 0.5 -0.5 0.5 h -1 c -0.277344 0 -0.5 -0.222656 -0.5 -0.5 v -1 c 0 -0.277344 0.222656 -0.5 0.5 -0.5 z m 3 0 h 1 c 0.277344 0 0.5 0.222656 0.5 0.5 v 1 c 0 0.277344 -0.222656 0.5 -0.5 0.5 h -1 c -0.277344 0 -0.5 -0.222656 -0.5 -0.5 v -1 c 0 -0.277344 0.222656 -0.5 0.5 -0.5 z m 3 0 h 1 c 0.277344 0 0.5 0.222656 0.5 0.5 v 1 c 0 0.277344 -0.222656 0.5 -0.5 0.5 h -1 c -0.277344 0 -0.5 -0.222656 -0.5 -0.5 v -1 c 0 -0.277344 0.222656 -0.5 0.5 -0.5 z m -8 3 h 1 c 0.277344 0 0.5 0.222656 0.5 0.5 v 1 c 0 0.277344 -0.222656 0.5 -0.5 0.5 h -1 c -0.277344 0 -0.5 -0.222656 -0.5 -0.5 v -1 c 0 -0.277344 0.222656 -0.5 0.5 -0.5 z m 3 0 h 1 c 0.277344 0 0.5 0.222656 0.5 0.5 v 1 c 0 0.277344 -0.222656 0.5 -0.5 0.5 h -1 c -0.277344 0 -0.5 -0.222656 -0.5 -0.5 v -1 c 0 -0.277344 0.222656 -0.5 0.5 -0.5 z m 3 0 h 1 c 0.277344 0 0.5 0.222656 0.5 0.5 v 1 c 0 0.277344 -0.222656 0.5 -0.5 0.5 h -1 c -0.277344 0 -0.5 -0.222656 -0.5 -0.5 v -1 c 0 -0.277344 0.222656 -0.5 0.5 -0.5 z m 3 0 h 1 c 0.277344 0 0.5 0.222656 0.5 0.5 v 1 c 0 0.277344 -0.222656 0.5 -0.5 0.5 h -1 c -0.277344 0 -0.5 -0.222656 -0.5 -0.5 v -1 c 0 -0.277344 0.222656 -0.5 0.5 -0.5 z m -10 3 h 1 c 0.277344 0 0.5 0.222656 0.5 0.5 v 1 c 0 0.277344 -0.222656 0.5 -0.5 0.5 h -1 c -0.277344 0 -0.5 -0.222656 -0.5 -0.5 v -1 c 0 -0.277344 0.222656 -0.5 0.5 -0.5 z m 3 0 h 4 c 0.277344 0 0.5 0.222656 0.5 0.5 v 1 c 0 0.277344 -0.222656 0.5 -0.5 0.5 h -4 c -0.277344 0 -0.5 -0.222656 -0.5 -0.5 v -1 c 0 -0.277344 0.222656 -0.5 0.5 -0.5 z m 6 0 h 1 c 0.277344 0 0.5 0.222656 0.5 0.5 v 1 c 0 0.277344 -0.222656 0.5 -0.5 0.5 h -1 c -0.277344 0 -0.5 -0.222656 -0.5 -0.5 v -1 c 0 -0.277344 0.222656 -0.5 0.5 -0.5 z m 0 0", "key": "1bp207" }]], "aliases": ["input-keyboard-symbolic"], "gtkIconName": "input-keyboard-symbolic" };
__iconData$4Q.node;
const InputKeyboard = createAdwaitaIcon(__iconData$4Q);

const __iconData$4P = { "name": "input-mouse", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7.03125 0 c -2.753906 0 -5 2.246094 -5 5 v 6 c 0 2.753906 2.246094 5 5 5 h 1.96875 c 2.753906 0 5 -2.246094 5 -5 v -6 c 0 -2.753906 -2.246094 -5 -5 -5 z m 0 2 h 1.96875 c 1.679688 0 3 1.320312 3 3 v 6 c 0 1.679688 -1.320312 3 -3 3 h -1.96875 c -1.679688 0 -3 -1.320312 -3 -3 v -6 c 0 -1.679688 1.320312 -3 3 -3 z m 0.96875 1 c -0.554688 0 -1 0.445312 -1 1 v 2 c 0 0.554688 0.445312 1 1 1 s 1 -0.445312 1 -1 v -2 c 0 -0.554688 -0.445312 -1 -1 -1 z m 0 0", "key": "y99q9j" }]], "aliases": ["input-mouse-symbolic"], "gtkIconName": "input-mouse-symbolic" };
__iconData$4P.node;
const InputMouse = createAdwaitaIcon(__iconData$4P);

const __iconData$4O = { "name": "input-tablet", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 v 1.5 c 0 0.132812 -0.054688 0.261719 -0.144531 0.355469 c -0.09375 0.09375 -0.21875 0.144531 -0.347657 0.144531 h -3.011718 c -0.535156 0 -1.03125 0.289062 -1.296875 0.75 c -0.265625 0.464844 -0.265625 1.035156 0 1.5 c 0.265625 0.460938 0.761719 0.75 1.296875 0.75 h 3.007812 c 0.179688 0 0.339844 0.09375 0.429688 0.25 c 0.042968 0.074219 0.066406 0.164062 0.066406 0.25 v 0.5 h -5 c -1.644531 0 -3 1.355469 -3 3 v 4 c 0 1.644531 1.355469 3 3 3 h 10 c 1.644531 0 3 -1.355469 3 -3 v -4 c 0 -0.867188 -0.378906 -1.648438 -0.972656 -2.199219 l -1.410156 1.402344 c 0.234374 0.179687 0.382812 0.460937 0.382812 0.796875 v 3 c 0 0.554688 -0.445312 1 -1 1 h -10 c -0.554688 0 -1 -0.445312 -1 -1 v -3 c 0 -0.570312 0.5 -1 1 -1 h 5.191406 l 1.992188 -2 h -1.183594 v -0.5 c 0 -0.257812 -0.066406 -0.515625 -0.199219 -0.75 c -0.265625 -0.460938 -0.761719 -0.75 -1.296875 -0.75 h -3.007812 c -0.179688 0 -0.339844 -0.09375 -0.429688 -0.25 c -0.089844 -0.152344 -0.089844 -0.347656 0 -0.5 c 0.089844 -0.15625 0.25 -0.25 0.429688 -0.25 h 3.011718 c 0.398438 0 0.777344 -0.160156 1.054688 -0.441406 c 0.28125 -0.28125 0.4375 -0.660156 0.4375 -1.058594 v -1.5 z m 7 3 c -0.265625 0 -0.519531 0.105469 -0.703125 0.292969 h -0.003906 l -6.292969 6.316406 v 1.390625 h 1.390625 l 6.316406 -6.292969 l -0.003906 -0.003906 c 0.191406 -0.183594 0.296875 -0.4375 0.296875 -0.703125 c 0 -0.550781 -0.449219 -1 -1 -1 z m 0 0", "key": "1lo0n3" }]], "aliases": ["input-tablet-symbolic"], "gtkIconName": "input-tablet-symbolic" };
__iconData$4O.node;
const InputTablet = createAdwaitaIcon(__iconData$4O);

const __iconData$4N = { "name": "input-touchpad", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3.03125 1 c -1.667969 0 -3.03125 1.363281 -3.03125 3.03125 v 7.9375 c 0 1.667969 1.363281 3.03125 3.03125 3.03125 h 8.9375 c 1.667969 0 3.03125 -1.363281 3.03125 -3.03125 v -7.9375 c 0 -1.667969 -1.363281 -3.03125 -3.03125 -3.03125 z m 0 2 h 8.9375 c 0.597656 0 1.03125 0.433594 1.03125 1.03125 v 5.96875 h -11 v -5.96875 c 0 -0.597656 0.4375 -1.03125 1.03125 -1.03125 z m -1.03125 8 h 5 v 2 h -3.96875 c -0.59375 0 -1.03125 -0.433594 -1.03125 -1.03125 z m 6 0 h 5 v 0.96875 c 0 0.597656 -0.433594 1.03125 -1.03125 1.03125 h -3.96875 z m 0 0", "key": "1mqj4i" }]], "aliases": ["input-touchpad-symbolic"], "gtkIconName": "input-touchpad-symbolic" };
__iconData$4N.node;
const InputTouchpad = createAdwaitaIcon(__iconData$4N);

const __iconData$4M = { "name": "insert-image", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4 0.0078125 s -2 0 -2 1.9921875 v 6.007812 s 0 2 2 1.992188 h 8 c 2 0.007812 2 -1.992188 2 -1.992188 v -6.007812 c 0 -1.9921875 -2 -1.9921875 -2 -1.9921875 z m 0 1.9921875 h 8 v 6 h -8 z m 5.125 1.957031 l -1.5 1.5 l -1.125 -0.75 l -1.5 1.5 v 0.800781 h 6 v -1.175781 z m 0 0", "key": "ki3h2a" }], ["path", { "fill": "currentColor", "d": "m 5 12.007812 v 1 h 0.007812 c -0.003906 0.265626 0.101563 0.519532 0.285157 0.707032 l 2 2 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 l 2 -2 c 0.183594 -0.1875 0.289063 -0.441406 0.289063 -0.707032 h 0.003906 v -1 z m 0 0", "key": "h4imrf" }]], "aliases": ["insert-image-symbolic"], "gtkIconName": "insert-image-symbolic" };
__iconData$4M.node;
const InsertImage = createAdwaitaIcon(__iconData$4M);

const __iconData$4L = { "name": "insert-link", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 5 11.976562 v 1 h 0.007812 c -0.003906 0.261719 0.101563 0.515626 0.285157 0.707032 l 2 1.996094 c 0.390625 0.390624 1.023437 0.390624 1.414062 0 l 2 -1.996094 c 0.1875 -0.191406 0.289063 -0.445313 0.289063 -0.707032 h 0.003906 v -1 z m 0 0", "key": "k7lyr4" }], ["path", { "fill": "currentColor", "d": "m 7 1.972656 c -1.296875 0 -2.40625 0.839844 -2.824219 2 h 7.652344 c -0.417969 -1.160156 -1.53125 -2 -2.828125 -2 z m -5.996094 3 c -0.558594 0 -1.003906 0.445313 -1.003906 1 c 0 0.554688 0.445312 1 1.003906 1 h 4.996094 c 0.554688 0 1 -0.445312 1 -1 c 0 -0.554687 -0.445312 -1 -1 -1 z m 9 0 c -0.558594 0 -1.003906 0.445313 -1.003906 1 c 0 0.554688 0.445312 1 1.003906 1 h 4.996094 c 0.554688 0 1 -0.445312 1 -1 c 0 -0.554687 -0.445312 -1 -1 -1 z m -5.828125 3 c 0.414063 1.160156 1.527344 1.996094 2.824219 1.996094 h 2 c 1.296875 0 2.414062 -0.835938 2.828125 -1.996094 h -2.792969 c -0.011718 0 -0.023437 0.003906 -0.035156 0.003906 h -2 c -0.011719 0 -0.023438 -0.003906 -0.035156 -0.003906 z m 0 0", "key": "1v4sfr" }]], "aliases": ["insert-link-symbolic"], "gtkIconName": "insert-link-symbolic" };
__iconData$4L.node;
const InsertLink = createAdwaitaIcon(__iconData$4L);

const __iconData$4K = { "name": "insert-object", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 5 12.007812 v 1 h 0.007812 c -0.003906 0.265626 0.101563 0.519532 0.285157 0.707032 l 2 2 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 l 2 -2 c 0.183594 -0.1875 0.289063 -0.441406 0.289063 -0.707032 h 0.003906 v -1 z m 0 0", "key": "h4imrf" }], ["path", { "fill": "currentColor", "d": "m 8 0 l -5 3.140625 v 4.714844 l 5 3.144531 l 5 -3.144531 v -4.714844 z m 0 6 l -3.644531 -2.175781 l 3.644531 -2.292969 l 3.644531 2.292969 z m 0 0", "key": "xlpfmd" }]], "aliases": ["insert-object-symbolic"], "gtkIconName": "insert-object-symbolic" };
__iconData$4K.node;
const InsertObject = createAdwaitaIcon(__iconData$4K);

const __iconData$4J = { "name": "insert-text", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 5 12.007812 v 1 h 0.007812 c -0.003906 0.265626 0.101563 0.519532 0.285157 0.707032 l 2 2 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 l 2 -2 c 0.183594 -0.1875 0.289063 -0.441406 0.289063 -0.707032 h 0.003906 v -1 z m 0 0", "key": "h4imrf" }], ["path", { "fill": "currentColor", "d": "m 4 0 v 2 h 6 c 0.429688 0 1 0.613281 1 1 v 1 h -5 c -0.917969 0 -1.734375 0.378906 -2.25 0.964844 c -0.515625 0.582031 -0.742188 1.324218 -0.738281 2.042968 c 0.007812 0.722657 0.246093 1.449219 0.757812 2.027344 c 0.515625 0.578125 1.320313 0.964844 2.230469 0.964844 h 7 v -7 c 0 -1.636719 -1.320312 -3 -3 -3 z m 2 6 h 5 v 2 h -5 c -0.398438 0 -0.578125 -0.117188 -0.730469 -0.289062 c -0.152343 -0.171876 -0.253906 -0.441407 -0.257812 -0.722657 c 0 -0.277343 0.09375 -0.539062 0.238281 -0.703125 c 0.148438 -0.167968 0.328125 -0.285156 0.75 -0.285156 z m 0 0", "key": "15udef" }]], "aliases": ["insert-text-symbolic"], "gtkIconName": "insert-text-symbolic" };
__iconData$4J.node;
const InsertText = createAdwaitaIcon(__iconData$4J);

const __iconData$4I = { "name": "keyboard-brightness", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 3 c -0.554688 0 -1 0.445312 -1 1 v 1 c 0 0.554688 0.445312 1 1 1 s 1 -0.445312 1 -1 v -1 c 0 -0.554688 -0.445312 -1 -1 -1 z m -5 2.050781 c -0.238281 0.007813 -0.476562 0.105469 -0.660156 0.292969 c -0.390625 0.390625 -0.390625 1.019531 0 1.414062 l 0.71875 0.71875 c 0.390625 0.390626 1.023437 0.390626 1.414062 0 c 0.390625 -0.394531 0.390625 -1.023437 0 -1.414062 l -0.71875 -0.71875 c -0.207031 -0.210938 -0.484375 -0.308594 -0.753906 -0.292969 z m 9.949219 0 c -0.253907 0 -0.511719 0.097657 -0.707031 0.292969 l -0.71875 0.71875 c -0.390626 0.390625 -0.390626 1.023438 0 1.414062 c 0.390624 0.390626 1.023437 0.390626 1.414062 0 l 0.71875 -0.71875 c 0.390625 -0.390624 0.390625 -1.023437 0 -1.414062 c -0.195312 -0.195312 -0.453125 -0.292969 -0.707031 -0.292969 z m -6.703125 3.949219 c -0.167969 0.007812 -0.324219 0.117188 -0.375 0.261719 l -0.835938 2.21875 c -0.101562 0.230469 0.125 0.527343 0.402344 0.519531 h 2.566406 h 2.570313 c 0.277343 0.007812 0.5 -0.289062 0.402343 -0.519531 l -0.835937 -2.21875 c -0.074219 -0.191407 -0.339844 -0.308594 -0.550781 -0.234375 c -0.210938 0.066406 -0.820313 0.261718 -1.585938 0.261718 s -1.375 -0.195312 -1.585937 -0.261718 c -0.054688 -0.019532 -0.113281 -0.03125 -0.171875 -0.027344 z m -5.246094 1 c -0.554688 0 -1 0.445312 -1 1 s 0.445312 1 1 1 h 0.972656 c 0.554688 0 1 -0.445312 1 -1 s -0.445312 -1 -1 -1 z m 12.984375 0 c -0.554687 0 -1 0.445312 -1 1 s 0.445313 1 1 1 h 1.015625 c 0.554688 0 1 -0.445312 1 -1 s -0.445312 -1 -1 -1 z m 0 0", "key": "1uax7j" }]], "aliases": ["keyboard-brightness-symbolic"], "gtkIconName": "keyboard-brightness-symbolic" };
__iconData$4I.node;
const KeyboardBrightness = createAdwaitaIcon(__iconData$4I);

const __iconData$4H = { "name": "list-add", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 1 v 6 h -6 v 2 h 6 v 6 h 2 v -6 h 6 v -2 h -6 v -6 z m 0 0", "key": "1uwwhx" }]], "aliases": ["list-add-symbolic"], "gtkIconName": "list-add-symbolic" };
__iconData$4H.node;
const ListAdd = createAdwaitaIcon(__iconData$4H);

const __iconData$4G = { "name": "list-drag-handle", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4.496094 0 c -0.832032 0 -1.5 0.671875 -1.5 1.5 s 0.667968 1.5 1.5 1.5 c 0.828125 0 1.5 -0.671875 1.5 -1.5 s -0.671875 -1.5 -1.5 -1.5 z m 6 0 c -0.832032 0 -1.5 0.671875 -1.5 1.5 s 0.667968 1.5 1.5 1.5 c 0.828125 0 1.5 -0.671875 1.5 -1.5 s -0.671875 -1.5 -1.5 -1.5 z m -6 6 c -0.832032 0 -1.5 0.671875 -1.5 1.5 s 0.667968 1.5 1.5 1.5 c 0.828125 0 1.5 -0.671875 1.5 -1.5 s -0.671875 -1.5 -1.5 -1.5 z m 6 0 c -0.832032 0 -1.5 0.671875 -1.5 1.5 s 0.667968 1.5 1.5 1.5 c 0.828125 0 1.5 -0.671875 1.5 -1.5 s -0.671875 -1.5 -1.5 -1.5 z m -6 6 c -0.832032 0 -1.5 0.671875 -1.5 1.5 s 0.667968 1.5 1.5 1.5 c 0.828125 0 1.5 -0.671875 1.5 -1.5 s -0.671875 -1.5 -1.5 -1.5 z m 6 0 c -0.832032 0 -1.5 0.671875 -1.5 1.5 s 0.667968 1.5 1.5 1.5 c 0.828125 0 1.5 -0.671875 1.5 -1.5 s -0.671875 -1.5 -1.5 -1.5 z m 0 0", "key": "le1w0" }]], "aliases": ["list-drag-handle-symbolic"], "gtkIconName": "list-drag-handle-symbolic" };
__iconData$4G.node;
const ListDragHandle = createAdwaitaIcon(__iconData$4G);

const __iconData$4F = { "name": "list-remove-all", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 15 1 v 2 h -14 v -2 z m 0 4 v 2 h -14 v -2 z m -7.875 3 c 0.492188 0 0.875 0.382812 0.875 0.875 v 6.25 c 0 0.492188 -0.382812 0.875 -0.875 0.875 h -6.25 c -0.492188 0 -0.875 -0.382812 -0.875 -0.875 v -6.25 c 0 -0.492188 0.382812 -0.875 0.875 -0.875 z m 7.875 1 v 2 h -6 v -2 z m -8.5 2 h -5 s -0.5 0 -0.5 0.5 v 1 c 0 0.5 0.5 0.5 0.5 0.5 h 5 s 0.5 0 0.5 -0.5 v -1 c 0 -0.5 -0.5 -0.5 -0.5 -0.5 z m 8.5 2 v 2 h -6 v -2 z m 0 0", "key": "18j8i0" }]], "aliases": ["list-remove-all-symbolic"], "gtkIconName": "list-remove-all-symbolic" };
__iconData$4F.node;
const ListRemoveAll = createAdwaitaIcon(__iconData$4F);

const __iconData$4E = { "name": "list-remove", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1 7 h 14 v 2 h -14 z m 0 0", "key": "1ujeyg" }]], "aliases": ["list-remove-symbolic"], "gtkIconName": "list-remove-symbolic" };
__iconData$4E.node;
const ListRemove = createAdwaitaIcon(__iconData$4E);

const __iconData$4D = { "name": "location-services-active", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 c -3.3125 0 -6 2.6875 -6 6 c 0.007812 0.710938 0.136719 1.414062 0.386719 2.078125 l -0.015625 -0.003906 c 0.636718 1.988281 3.78125 5.082031 5.625 6.929687 h 0.003906 v -0.003906 c 1.507812 -1.507812 3.878906 -3.925781 5.046875 -5.753906 c 0.261719 -0.414063 0.46875 -0.808594 0.585937 -1.171875 l -0.019531 0.003906 c 0.25 -0.664063 0.382813 -1.367187 0.386719 -2.078125 c 0 -3.3125 -2.683594 -6 -6 -6 z m 0 3.691406 c 1.273438 0 2.308594 1.035156 2.308594 2.308594 s -1.035156 2.308594 -2.308594 2.308594 c -1.273438 -0.003906 -2.304688 -1.035156 -2.304688 -2.308594 c -0.003906 -1.273438 1.03125 -2.304688 2.304688 -2.308594 z m 0 0", "key": "vn7375" }]], "aliases": ["location-services-active-symbolic"], "gtkIconName": "location-services-active-symbolic" };
__iconData$4D.node;
const LocationServicesActive = createAdwaitaIcon(__iconData$4D);

const __iconData$4C = { "name": "location-services-disabled", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 c -1.894531 0 -3.582031 0.882812 -4.679688 2.257812 l -1.789062 -1.789062 l -1.0625 1.0625 l 14 14 l 1.0625 -1.0625 l -3.652344 -3.652344 c 0.449219 -0.546875 0.855469 -1.082031 1.167969 -1.570312 c 0.261719 -0.414063 0.46875 -0.808594 0.585937 -1.171875 l -0.019531 0.003906 c 0.25 -0.664063 0.382813 -1.367187 0.386719 -2.078125 c 0.003906 -3.3125 -2.6875 -6 -6 -6 z m 0 3.695312 c 1.273438 -0.003906 2.308594 1.03125 2.308594 2.304688 c 0 0.878906 -0.492188 1.640625 -1.214844 2.03125 l -3.125 -3.125 c 0.390625 -0.722656 1.152344 -1.210938 2.03125 -1.210938 z m -5.9375 1.429688 c -0.039062 0.289062 -0.0625 0.578125 -0.0625 0.875 c 0.003906 0.710938 0.136719 1.414062 0.386719 2.082031 l -0.015625 -0.007812 c 0.636718 1.988281 3.78125 5.082031 5.628906 6.925781 v 0.003906 v -0.003906 c 0.5625 -0.5625 1.25 -1.253906 1.945312 -1.992188 z m 0 0", "key": "1hn8in" }]], "aliases": ["location-services-disabled-symbolic"], "gtkIconName": "location-services-disabled-symbolic" };
__iconData$4C.node;
const LocationServicesDisabled = createAdwaitaIcon(__iconData$4C);

const __iconData$4B = { "name": "mail-attachment", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 9.75 0.277344 c -0.890625 0 -1.78125 0.339844 -2.457031 1.015625 l -3.5 3.5 c -0.019531 0.019531 -0.039063 0.039062 -0.058594 0.0625 c -0.070313 0.082031 -0.574219 0.628906 -0.792969 1.4375 c -0.21875 0.804687 -0.058594 1.972656 0.839844 2.902343 c 0.914062 0.941407 2.128906 1.09375 2.945312 0.867188 c 0.8125 -0.230469 1.222657 -0.585938 1.5 -0.875 l 1.980469 -1.980469 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 s -1.023437 -0.390625 -1.414062 0 l -2 2 c -0.007813 0.003906 -0.011719 0.011719 -0.019531 0.019531 c 0.113281 -0.117188 -0.289063 0.238281 -0.589844 0.324219 c -0.296875 0.082031 -0.5 0.148437 -0.964844 -0.332031 c -0.484375 -0.5 -0.421875 -0.710938 -0.347656 -0.988282 c 0.074218 -0.273437 0.257812 -0.503906 0.386718 -0.660156 l 3.449219 -3.449219 c 0.644531 -0.644531 1.441407 -0.644531 2.085938 0 l 2.5 2.5 c 0.644531 0.644531 0.644531 1.441407 0 2.085938 l -6 6 s -0.183594 0.183593 -0.472657 0.375 c -0.289062 0.191406 -0.652343 0.332031 -0.820312 0.332031 h -3 c -0.167969 0 -0.449219 -0.113281 -0.667969 -0.332031 s -0.332031 -0.5 -0.332031 -0.667969 v -4 c 0 -0.550781 -0.449219 -1 -1 -1 s -1 0.449219 -1 1 v 4 c 0 0.832031 0.386719 1.550781 0.917969 2.082031 s 1.25 0.917969 2.082031 0.917969 h 3 c 0.832031 0 1.46875 -0.359375 1.929688 -0.667969 c 0.460937 -0.308593 0.777343 -0.625 0.777343 -0.625 l 6 -6 c 1.355469 -1.355469 1.355469 -3.558593 0 -4.914062 l -2.5 -2.5 c -0.675781 -0.675781 -1.566406 -1.015625 -2.457031 -1.015625 z m 0 0", "key": "15sna6" }]], "aliases": ["mail-attachment-symbolic"], "gtkIconName": "mail-attachment-symbolic" };
__iconData$4B.node;
const MailAttachment = createAdwaitaIcon(__iconData$4B);

const __iconData$4A = { "name": "mail-forward", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 11 2 c 0.265625 0 0.519531 0.105469 0.707031 0.292969 l 4 4 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 l -4 4 c -0.390625 0.390625 -1.023437 0.390625 -1.414062 0 s -0.390625 -1.023437 0 -1.414062 l 2.292969 -2.292969 h -8.585938 c -1.117188 0 -2 0.882812 -2 2 v 3 c 0 0.550781 -0.449219 1 -1 1 s -1 -0.449219 -1 -1 v -3 c 0 -0.023438 0 -0.046875 0.00390625 -0.070312 c 0.03515625 -2.164063 1.82031275 -3.929688 3.99609375 -3.929688 h 8.585938 l -2.292969 -2.292969 c -0.390625 -0.390625 -0.390625 -1.023437 0 -1.414062 c 0.1875 -0.1875 0.441406 -0.292969 0.707031 -0.292969 z m 0 0", "key": "1nzn0k" }]], "aliases": ["mail-forward-symbolic"], "gtkIconName": "mail-forward-symbolic" };
__iconData$4A.node;
const MailForward = createAdwaitaIcon(__iconData$4A);

const __iconData$4z = { "name": "mail-mark-important", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 0 c -1.644531 0 -3 1.355469 -3 3 v 6 c 0 1.644531 1.355469 3 3 3 h 3 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 h -3 c -0.570312 0 -1 -0.429688 -1 -1 v -5.796875 l 4.613281 3.074219 c 0.835938 0.558594 1.9375 0.558594 2.773438 0 l 4.613281 -3.074219 v 2.796875 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -3 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0.800781 2 h 8.398438 l -3.921875 2.613281 c -0.171875 0.113281 -0.382813 0.113281 -0.554688 0 z m 0 0", "key": "wpxhqi" }], ["path", { "fill": "#ff7800", "d": "m 8.875 8 c -0.492188 0 -0.875 0.382812 -0.875 0.875 v 6.25 c 0 0.492188 0.382812 0.875 0.875 0.875 h 6.25 c 0.492188 0 0.875 -0.382812 0.875 -0.875 v -6.25 c 0 -0.492188 -0.382812 -0.875 -0.875 -0.875 z m 2.125 1 h 2 v 2.5 s 0 0.5 -0.5 0.5 h -1 c -0.5 0 -0.5 -0.5 -0.5 -0.5 z m 0.5 4 h 1 c 0.277344 0 0.5 0.222656 0.5 0.5 v 1 c 0 0.277344 -0.222656 0.5 -0.5 0.5 h -1 c -0.277344 0 -0.5 -0.222656 -0.5 -0.5 v -1 c 0 -0.277344 0.222656 -0.5 0.5 -0.5 z m 0 0", "key": "cwwk72" }]], "aliases": ["mail-mark-important-symbolic"], "gtkIconName": "mail-mark-important-symbolic", "monochrome": false };
__iconData$4z.node;
const MailMarkImportant = createAdwaitaIcon(__iconData$4z);

const __iconData$4y = { "name": "mail-mark-junk", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 5.097656 0 c -0.265625 0 -0.519531 0.105469 -0.707031 0.292969 l -4.101563 4.101562 c -0.1875 0.1875 -0.29296825 0.441407 -0.289062 0.707031 v 5.796876 c -0.00390625 0.265624 0.101562 0.519531 0.292969 0.707031 l 4.097656 4.101562 c 0.1875 0.1875 0.441406 0.292969 0.707031 0.292969 h 5.800782 c 0.265624 0 0.519531 -0.105469 0.707031 -0.292969 l 4.101562 -4.101562 c 0.1875 -0.1875 0.292969 -0.441407 0.292969 -0.707031 v -5.796876 c 0 -0.265624 -0.105469 -0.519531 -0.296875 -0.707031 l -4.097656 -4.101562 c -0.1875 -0.1875 -0.441407 -0.292969 -0.707031 -0.292969 z m 0.414063 2 h 4.96875 l 3.519531 3.511719 v 4.972656 l -3.515625 3.515625 h -4.972656 l -3.511719 -3.511719 v -4.972656 z m 1.480469 2 v 3 l 0.28125 2 h 1.46875 l 0.25 -2 v -3 z m 1 5.75 c -0.691407 0 -1.25 0.558594 -1.25 1.25 s 0.558593 1.25 1.25 1.25 c 0.691406 0 1.25 -0.558594 1.25 -1.25 s -0.558594 -1.25 -1.25 -1.25 z m 0 0", "key": "c09ep4" }]], "aliases": ["mail-mark-junk-symbolic"], "gtkIconName": "mail-mark-junk-symbolic" };
__iconData$4y.node;
const MailMarkJunk = createAdwaitaIcon(__iconData$4y);

const __iconData$4x = { "name": "mail-mark-notjunk", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 1 c -1.644531 0 -3 1.355469 -3 3 v 5 c 0 1.644531 1.355469 3 3 3 h 3 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 h -3 c -0.550781 0 -1 -0.449219 -1 -1 v -4.800781 l 4.613281 3.078125 c 0.835938 0.558594 1.9375 0.558594 2.773438 0 l 4.613281 -3.078125 v 2.800781 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -3 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0.800781 2 h 8.398438 l -3.921875 2.613281 c -0.171875 0.113281 -0.382813 0.113281 -0.554688 0 z m 0 0", "key": "1vgv72" }], ["path", { "fill": "currentColor", "d": "m 14.972656 9.992188 c -0.261718 0 -0.519531 0.105468 -0.707031 0.292968 l -3.292969 3.292969 l -1.292968 -1.292969 c -0.390626 -0.390625 -1.023438 -0.390625 -1.414063 0 s -0.390625 1.023438 0 1.414063 l 2 2 c 0.390625 0.390625 1.023437 0.390625 1.414063 0 l 4 -4 c 0.390624 -0.390625 0.390624 -1.023438 0 -1.414063 c -0.1875 -0.1875 -0.441407 -0.292968 -0.707032 -0.292968 z m 0 0", "key": "wkymw8" }]], "aliases": ["mail-mark-notjunk-symbolic"], "gtkIconName": "mail-mark-notjunk-symbolic" };
__iconData$4x.node;
const MailMarkNotjunk = createAdwaitaIcon(__iconData$4x);

const __iconData$4w = { "name": "mail-message-new", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 1 c -1.644531 0 -3 1.355469 -3 3 v 6 c 0 1.644531 1.355469 3 3 3 h 2 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 h -2 c -0.570312 0 -1 -0.429688 -1 -1 v -5.800781 l 4.613281 3.078125 c 0.835938 0.558594 1.9375 0.558594 2.773438 0 l 4.613281 -3.078125 v 3.800781 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -4 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0.800781 2 h 8.398438 l -3.921875 2.613281 c -0.171875 0.113281 -0.382813 0.113281 -0.554688 0 z m 7.199219 5 v 3 h -3 v 2 h 3 v 3 h 2 v -3 h 3 v -2 h -3 v -3 z m 0 0", "key": "mxzu2y" }]], "aliases": ["mail-message-new-symbolic"], "gtkIconName": "mail-message-new-symbolic" };
__iconData$4w.node;
const MailMessageNew = createAdwaitaIcon(__iconData$4w);

const __iconData$4v = { "name": "mail-read", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.501961", "d": "m 8 0.980469 c -0.480469 0 -0.960938 0.132812 -1.386719 0.390625 l -5.285156 3.253906 c -0.824219 0.507812 -1.328125 1.40625 -1.328125 2.375 v 6 c 0 1.644531 1.355469 3 3 3 h 10 c 1.644531 0 3 -1.355469 3 -3 v -6 c 0 -0.96875 -0.503906 -1.867188 -1.328125 -2.375 l -5.289063 -3.253906 c -0.421874 -0.257813 -0.902343 -0.390625 -1.382812 -0.390625 z m 0 2 c 0.117188 0 0.234375 0.035156 0.335938 0.097656 l 5.289062 3.25 c 0.085938 0.054687 0.164062 0.121094 0.222656 0.203125 c -0.042968 0.011719 -0.085937 0.03125 -0.125 0.050781 l -5.167968 3.445313 c -0.335938 0.226562 -0.773438 0.226562 -1.109376 0 l -5.167968 -3.445313 c -0.039063 -0.019531 -0.082032 -0.039062 -0.125 -0.050781 c 0.058594 -0.078125 0.132812 -0.148438 0.222656 -0.203125 l 5.285156 -3.25 c 0.105469 -0.066406 0.222656 -0.097656 0.339844 -0.097656 z m -6 4.621093 l 4.890625 3.257813 c 0.671875 0.449219 1.546875 0.449219 2.21875 0 l 4.890625 -3.257813 v 5.398438 c 0 0.5625 -0.4375 1 -1 1 h -10 c -0.5625 0 -1 -0.4375 -1 -1 z m 0 0", "key": "mw5n02" }]], "aliases": ["mail-read-symbolic"], "gtkIconName": "mail-read-symbolic" };
__iconData$4v.node;
const MailRead = createAdwaitaIcon(__iconData$4v);

const __iconData$4u = { "name": "mail-replied-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.501961", "d": "m 8 0.984375 c 0.101562 0 0.199219 0.003906 0.296875 0.015625 h -0.597656 c 0.101562 -0.011719 0.199219 -0.015625 0.300781 -0.015625 z m -2.308594 2.109375 c -0.414062 0.082031 -0.792968 0.25 -1.089844 0.53125 c 0.25 -0.257812 0.605469 -0.445312 1.089844 -0.53125 z m -1.304687 0.757812 c -0.191407 0.28125 -0.3125 0.589844 -0.363281 0.867188 c 0.03125 -0.183594 0.089843 -0.445312 0.226562 -0.71875 c 0.023438 -0.046875 0.105469 -0.097656 0.136719 -0.148438 z m -2.289063 0.300782 c -0.109375 0.507812 -0.097656 0.867187 -0.097656 0.867187 v 7.980469 c 0 0.5625 0.4375 1 1 1 h 10 c 0.5625 0 1 -0.4375 1 -1 v -5.398438 l -4.890625 3.257813 c -0.671875 0.449219 -1.546875 0.449219 -2.21875 0 l -1.792969 -1.191406 c 0.28125 -0.191407 0.515625 -0.453125 0.671875 -0.753907 l 1.675781 1.117188 c 0.335938 0.222656 0.773438 0.222656 1.109376 0 l 5.167968 -3.449219 c 0.039063 -0.019531 0.082032 -0.039062 0.125 -0.046875 c -0.058594 -0.082031 -0.132812 -0.152344 -0.222656 -0.207031 l -0.078125 -0.046875 l 1.433594 -1.433594 c 0.640625 0.523438 1.019531 1.3125 1.019531 2.152344 v 6 c 0 1.644531 -1.355469 3 -3 3 h -10 c -1.644531 0 -3 -1.355469 -3 -3 v -6 c 0 -0.96875 0.503906 -1.867188 1.328125 -2.375 z m 0 0", "key": "18kurp" }], ["path", { "fill": "currentColor", "d": "m 3 8 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -3 c 0 -0.5 0.199219 -0.894531 1 -1 h 5 v 2 h 1 v -0.003906 c 0.265625 0 0.519531 -0.105469 0.707031 -0.289063 l 2 -2 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 l -2 -2 c -0.1875 -0.183594 -0.441406 -0.28906275 -0.707031 -0.2851565 v -0.0078125 h -1 v 2 h -5 c -1.332031 0 -2.277344 0.8125 -2.644531 1.550781 c -0.371094 0.742188 -0.355469 1.449219 -0.355469 1.449219 z m 0 0", "key": "lzr1d5" }]], "aliases": ["mail-replied-rtl-symbolic"], "gtkIconName": "mail-replied-rtl-symbolic" };
__iconData$4u.node;
const MailRepliedRtl = createAdwaitaIcon(__iconData$4u);

const __iconData$4t = { "name": "mail-replied", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.501961", "d": "m 13.902344 4.152344 c 0.109375 0.507812 0.097656 0.867187 0.097656 0.867187 v 7.980469 c 0 0.5625 -0.4375 1 -1 1 h -10 c -0.5625 0 -1 -0.4375 -1 -1 v -5.398438 l 4.890625 3.257813 c 0.671875 0.449219 1.546875 0.449219 2.21875 0 l 1.792969 -1.191406 c -0.285156 -0.191407 -0.515625 -0.453125 -0.671875 -0.753907 l -1.675781 1.117188 c -0.335938 0.222656 -0.773438 0.222656 -1.109376 0 l -5.167968 -3.449219 c -0.039063 -0.019531 -0.082032 -0.039062 -0.125 -0.046875 c 0.058594 -0.082031 0.132812 -0.152344 0.222656 -0.207031 l 0.078125 -0.046875 l -1.433594 -1.433594 c -0.640625 0.523438 -1.019531 1.3125 -1.019531 2.152344 v 6 c 0 1.644531 1.355469 3 3 3 h 10 c 1.644531 0 3 -1.355469 3 -3 v -6 c 0 -0.96875 -0.503906 -1.867188 -1.328125 -2.375 z m 0 0", "key": "1d7yhm" }], ["path", { "fill": "currentColor", "d": "m 13 8 c 0 0.550781 -0.449219 1 -1 1 s -1 -0.449219 -1 -1 v -3 c 0 -0.5 -0.199219 -0.894531 -1 -1 h -5 v 2 h -1 v -0.003906 c -0.265625 0 -0.519531 -0.105469 -0.707031 -0.289063 l -2 -2 c -0.390625 -0.390625 -0.390625 -1.023437 0 -1.414062 l 2 -2 c 0.1875 -0.183594 0.441406 -0.28906275 0.707031 -0.2851565 v -0.0078125 h 1 v 2 h 5 c 1.332031 0 2.273438 0.8125 2.644531 1.550781 c 0.371094 0.742188 0.355469 1.449219 0.355469 1.449219 z m 0 0", "key": "vvnvtc" }]], "aliases": ["mail-replied-symbolic"], "gtkIconName": "mail-replied-symbolic" };
__iconData$4t.node;
const MailReplied = createAdwaitaIcon(__iconData$4t);

const __iconData$4s = { "name": "mail-reply-all-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 11 2 c 0.265625 0 0.519531 0.105469 0.707031 0.292969 l 4 4 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 l -4 4 c -0.390625 0.390625 -1.023437 0.390625 -1.414062 0 s -0.390625 -1.023437 0 -1.414062 l 3.292969 -3.292969 l -3.292969 -3.292969 c -0.390625 -0.390625 -0.390625 -1.023437 0 -1.414062 c 0.1875 -0.1875 0.441406 -0.292969 0.707031 -0.292969 z m -4 0 c 0.265625 0 0.519531 0.105469 0.707031 0.292969 l 4 4 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 l -4 4 c -0.390625 0.390625 -1.023437 0.390625 -1.414062 0 s -0.390625 -1.023437 0 -1.414062 l 2.292969 -2.292969 h -4.585938 c -1.117188 0 -2 0.882812 -2 2 v 3 c 0 0.550781 -0.449219 1 -1 1 s -1 -0.449219 -1 -1 v -3 c 0 -0.023438 0 -0.046875 0.00390625 -0.070312 c 0.03515625 -2.164063 1.82031275 -3.929688 3.99609375 -3.929688 h 4.585938 l -2.292969 -2.292969 c -0.390625 -0.390625 -0.390625 -1.023437 0 -1.414062 c 0.1875 -0.1875 0.441406 -0.292969 0.707031 -0.292969 z m 0 0", "key": "1s3mjj" }]], "aliases": ["mail-reply-all-rtl-symbolic"], "gtkIconName": "mail-reply-all-rtl-symbolic" };
__iconData$4s.node;
const MailReplyAllRtl = createAdwaitaIcon(__iconData$4s);

const __iconData$4r = { "name": "mail-reply-all", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 5 2 c -0.265625 0 -0.519531 0.105469 -0.707031 0.292969 l -4 4 c -0.3906252 0.390625 -0.3906252 1.023437 0 1.414062 l 4 4 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 s 0.390625 -1.023437 0 -1.414062 l -3.292969 -3.292969 l 3.292969 -3.292969 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 4 0 c -0.265625 0 -0.519531 0.105469 -0.707031 0.292969 l -4 4 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 l 4 4 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 s 0.390625 -1.023437 0 -1.414062 l -2.292969 -2.292969 h 4.585938 c 1.117188 0 2 0.882812 2 2 v 3 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -3 c 0 -0.023438 0 -0.046875 -0.003906 -0.070312 c -0.035156 -2.164063 -1.820313 -3.929688 -3.996094 -3.929688 h -4.585938 l 2.292969 -2.292969 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0 0", "key": "w6t3jd" }]], "aliases": ["mail-reply-all-symbolic"], "gtkIconName": "mail-reply-all-symbolic" };
__iconData$4r.node;
const MailReplyAll = createAdwaitaIcon(__iconData$4r);

const __iconData$4q = { "name": "mail-reply-sender", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 5 2 c -0.265625 0 -0.519531 0.105469 -0.707031 0.292969 l -4 4 c -0.3906252 0.390625 -0.3906252 1.023437 0 1.414062 l 4 4 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 s 0.390625 -1.023437 0 -1.414062 l -2.292969 -2.292969 h 8.585938 c 1.117188 0 2 0.882812 2 2 v 3 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -3 c 0 -0.023438 0 -0.046875 -0.003906 -0.070312 c -0.035156 -2.164063 -1.820313 -3.929688 -3.996094 -3.929688 h -8.585938 l 2.292969 -2.292969 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0 0", "key": "qx1i5p" }]], "aliases": ["mail-reply-sender-symbolic"], "gtkIconName": "mail-reply-sender-symbolic" };
__iconData$4q.node;
const MailReplySender = createAdwaitaIcon(__iconData$4q);

const __iconData$4p = { "name": "mail-send-receive", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1 12 c 0 -0.265625 0.105469 -0.519531 0.292969 -0.707031 c 0.390625 -0.390625 1.023437 -0.390625 1.414062 0 l 1.292969 1.292969 v -7.585938 c 0 -0.550781 0.449219 -1 1 -1 s 1 0.449219 1 1 v 7.585938 l 1.292969 -1.292969 c 0.390625 -0.390625 1.023437 -0.390625 1.414062 0 s 0.390625 1.023437 0 1.414062 l -3 3 c -0.390625 0.390625 -1.023437 0.390625 -1.414062 0 l -3 -3 c -0.1875 -0.1875 -0.292969 -0.441406 -0.292969 -0.707031 z m 6 -8 c 0 -0.257812 0.097656 -0.511719 0.292969 -0.707031 l 3 -3 c 0.390625 -0.3906252 1.023437 -0.3906252 1.414062 0 l 3 3 c 0.1875 0.1875 0.292969 0.441406 0.292969 0.707031 s -0.105469 0.519531 -0.292969 0.707031 c -0.390625 0.390625 -1.023437 0.390625 -1.414062 0 l -1.292969 -1.292969 v 7.585938 c 0 0.550781 -0.449219 1 -1 1 s -1 -0.449219 -1 -1 v -7.585938 l -1.292969 1.292969 c -0.390625 0.390625 -1.023437 0.390625 -1.414062 0 c -0.195313 -0.195312 -0.292969 -0.449219 -0.292969 -0.707031 z m 0 0", "key": "1xijaj" }]], "aliases": ["mail-send-receive-symbolic"], "gtkIconName": "mail-send-receive-symbolic" };
__iconData$4p.node;
const MailSendReceive = createAdwaitaIcon(__iconData$4p);

const __iconData$4o = { "name": "mail-send", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 c -0.257812 0 -0.511719 0.0976562 -0.707031 0.292969 l -1.25 1.25 l -1.761719 1.730469 c -0.191406 0.199218 -0.28125 0.441406 -0.28125 0.75 c 0 0.976562 1 1 1 1 c 0.257812 0 0.527344 -0.128907 0.71875 -0.3125 l 1.28125 -1.28125 v 3.570312 s 0 1 1 1 s 1 -1 1 -1 v -3.570312 l 1.28125 1.28125 c 0.191406 0.183593 0.410156 0.3125 0.71875 0.3125 c 0 0 1 -0.023438 1 -1 c 0 -0.308594 -0.089844 -0.550782 -0.28125 -0.75 l -1.761719 -1.730469 l -1.25 -1.25 c -0.195312 -0.1953128 -0.449219 -0.292969 -0.707031 -0.292969 z m -5 9 c -1.644531 0 -3 1.355469 -3 3 v 4 h 2 v -3.800781 l 4.613281 3.078125 c 0.835938 0.558594 1.9375 0.558594 2.773438 0 l 4.613281 -3.078125 v 3.800781 h 2 v -4 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0.800781 2 h 8.398438 l -3.921875 2.613281 c -0.171875 0.113281 -0.382813 0.113281 -0.554688 0 z m 0 0", "key": "5a9xwl" }]], "aliases": ["mail-send-symbolic"], "gtkIconName": "mail-send-symbolic" };
__iconData$4o.node;
const MailSend = createAdwaitaIcon(__iconData$4o);

const __iconData$4n = { "name": "mail-unread", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 2 c -1.644531 0 -3 1.355469 -3 3 v 6 c 0 1.644531 1.355469 3 3 3 h 10 c 1.644531 0 3 -1.355469 3 -3 v -6 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0.800781 2 h 8.394531 l -3.917968 2.613281 c -0.171875 0.113281 -0.382813 0.113281 -0.554688 0 z m -1.800781 1.203125 l 4.613281 3.074219 c 0.835938 0.558594 1.9375 0.558594 2.773438 0 l 4.613281 -3.074219 v 5.796875 c 0 0.570312 -0.429688 1 -1 1 h -10 c -0.570312 0 -1 -0.429688 -1 -1 z m 0 0", "key": "bldqbj" }]], "aliases": ["mail-unread-symbolic"], "gtkIconName": "mail-unread-symbolic" };
__iconData$4n.node;
const MailUnread = createAdwaitaIcon(__iconData$4n);

const __iconData$4m = { "name": "mark-location", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 c -3.3125 0 -6 2.6875 -6 6 c 0.007812 0.710938 0.136719 1.414062 0.386719 2.078125 l -0.015625 -0.003906 c 0.636718 1.988281 3.78125 5.082031 5.625 6.929687 h 0.003906 v -0.003906 c 1.507812 -1.507812 3.878906 -3.925781 5.046875 -5.753906 c 0.261719 -0.414063 0.46875 -0.808594 0.585937 -1.171875 l -0.019531 0.003906 c 0.25 -0.664063 0.382813 -1.367187 0.386719 -2.078125 c 0 -3.3125 -2.683594 -6 -6 -6 z m 0 3.691406 c 1.273438 0 2.308594 1.035156 2.308594 2.308594 s -1.035156 2.308594 -2.308594 2.308594 c -1.273438 -0.003906 -2.304688 -1.035156 -2.304688 -2.308594 c -0.003906 -1.273438 1.03125 -2.304688 2.304688 -2.308594 z m 0 0", "key": "vn7375" }]], "aliases": ["mark-location-symbolic"], "gtkIconName": "mark-location-symbolic" };
__iconData$4m.node;
const MarkLocation = createAdwaitaIcon(__iconData$4m);

const __iconData$4l = { "name": "media-eject", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 6.585938 1.585938 l -4 4 c -0.371094 0.378906 -0.578126 0.886718 -0.582032 1.148437 l -0.003906 1.265625 c 0 1 1 1 1 1 h 10 s 1 0 1 -1 v -1 h -0.003906 c 0 -0.53125 -0.207032 -1.039062 -0.582032 -1.414062 l -4 -4 c -0.375 -0.375 -0.8125 -0.617188 -1.414062 -0.585938 s -1.09375 0.265625 -1.414062 0.585938 z m -3.585938 9.414062 c -0.554688 0 -1 0.445312 -1 1 v 1 c 0 0.554688 0.445312 1 1 1 h 10 c 0.554688 0 1 -0.445312 1 -1 v -1 c 0 -0.554688 -0.445312 -1 -1 -1 z m 0 0", "key": "1gfzzx" }]], "aliases": ["media-eject-symbolic"], "gtkIconName": "media-eject-symbolic" };
__iconData$4l.node;
const MediaEject = createAdwaitaIcon(__iconData$4l);

const __iconData$4k = { "name": "media-flash", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 5 1 c -1.644531 0 -3 1.355469 -3 3 v 8 c 0 1.644531 1.355469 3 3 3 h 7 c 1.644531 0 3 -1.355469 3 -3 v -8 c 0 -0.265625 -0.105469 -0.519531 -0.292969 -0.707031 l -2 -2 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0 2 h 6.585938 l 1.414062 1.414062 v 7.585938 c 0 0.570312 -0.429688 1 -1 1 h -7 c -0.570312 0 -1 -0.429688 -1 -1 v -8 c 0 -0.570312 0.429688 -1 1 -1 z m 0.5 1 c -0.277344 0 -0.5 0.222656 -0.5 0.5 v 4 c 0 0.277344 0.222656 0.5 0.5 0.5 h 2 c 0.277344 0 0.5 -0.222656 0.5 -0.5 v -3.5 h 1 v 3.5 c 0 0.277344 0.222656 0.5 0.5 0.5 h 2 c 0.277344 0 0.5 -0.222656 0.5 -0.5 v -3 c 0 -0.277344 -0.222656 -0.5 -0.5 -0.5 s -0.5 0.222656 -0.5 0.5 v 2.5 h -1 v -3.5 c 0 -0.277344 -0.222656 -0.5 -0.5 -0.5 h -2 c -0.277344 0 -0.5 0.222656 -0.5 0.5 v 3.5 h -1 v -3.5 c 0 -0.277344 -0.222656 -0.5 -0.5 -0.5 z m 0 0", "key": "xk0vsg" }]], "aliases": ["media-flash-symbolic"], "gtkIconName": "media-flash-symbolic" };
__iconData$4k.node;
const MediaFlash = createAdwaitaIcon(__iconData$4k);

const __iconData$4j = { "name": "media-floppy", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3.96875 1 s -2.96875 0 -2.96875 2.96875 v 8.03125 s 0 0.5 0.3125 0.71875 l 1.6875 1.6875 v -10.40625 c 0 -1 1 -1 1 -1 h 8 s 1 0 1 1 v 8 c 0 1 -1 1 -1 1 h -1 v 2 h 1 s 3 0 3 -2.96875 v -8.0625 s 0 -2.96875 -2.96875 -2.96875 z m 1.03125 8 c -0.554688 0 -1 0.445312 -1 1 v 4 c 0 0.554688 0.445312 1 1 1 h 4 c 0.554688 0 1 -0.445312 1 -1 v -4 c 0 -0.554688 -0.445312 -1 -1 -1 z m 0 1 h 2 v 4 h -2 z m 0 0", "key": "k9c75q" }]], "aliases": ["media-floppy-symbolic"], "gtkIconName": "media-floppy-symbolic" };
__iconData$4j.node;
const MediaFloppy = createAdwaitaIcon(__iconData$4j);

const __iconData$4i = { "name": "media-optical-bd", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 c -4.40625 0 -8 3.59375 -8 8 s 3.59375 8 8 8 s 8 -3.59375 8 -8 s -3.59375 -8 -8 -8 z m 0 2 c 3.3125 0 6 2.6875 6 6 s -2.6875 6 -6 6 s -6 -2.6875 -6 -6 s 2.6875 -6 6 -6 z m 0 3 c -1.65625 0 -3 1.34375 -3 3 s 1.34375 3 3 3 s 3 -1.34375 3 -3 s -1.34375 -3 -3 -3 z m 0 1 c 1.105469 0 2 0.894531 2 2 s -0.894531 2 -2 2 s -2 -0.894531 -2 -2 s 0.894531 -2 2 -2 z m 0 1 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 s 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m 0 0", "key": "1w4tng" }]], "aliases": ["media-optical-bd-symbolic"], "gtkIconName": "media-optical-bd-symbolic" };
__iconData$4i.node;
const MediaOpticalBd = createAdwaitaIcon(__iconData$4i);

const __iconData$4h = { "name": "media-optical-cd-audio", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 c -4.40625 0 -8 3.59375 -8 8 s 3.59375 8 8 8 s 8 -3.59375 8 -8 s -3.59375 -8 -8 -8 z m 0 2 c 3.3125 0 6 2.6875 6 6 s -2.6875 6 -6 6 s -6 -2.6875 -6 -6 s 2.6875 -6 6 -6 z m 0 3 c -1.65625 0 -3 1.34375 -3 3 s 1.34375 3 3 3 s 3 -1.34375 3 -3 s -1.34375 -3 -3 -3 z m 0 1 c 1.105469 0 2 0.894531 2 2 s -0.894531 2 -2 2 s -2 -0.894531 -2 -2 s 0.894531 -2 2 -2 z m 0 1 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 s 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m 0 0", "key": "1w4tng" }]], "aliases": ["media-optical-cd-audio-symbolic"], "gtkIconName": "media-optical-cd-audio-symbolic" };
__iconData$4h.node;
const MediaOpticalCdAudio = createAdwaitaIcon(__iconData$4h);

const __iconData$4g = { "name": "media-optical-cd", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 c -4.40625 0 -8 3.59375 -8 8 s 3.59375 8 8 8 s 8 -3.59375 8 -8 s -3.59375 -8 -8 -8 z m 0 2 c 3.3125 0 6 2.6875 6 6 s -2.6875 6 -6 6 s -6 -2.6875 -6 -6 s 2.6875 -6 6 -6 z m 0 3 c -1.65625 0 -3 1.34375 -3 3 s 1.34375 3 3 3 s 3 -1.34375 3 -3 s -1.34375 -3 -3 -3 z m 0 1 c 1.105469 0 2 0.894531 2 2 s -0.894531 2 -2 2 s -2 -0.894531 -2 -2 s 0.894531 -2 2 -2 z m 0 1 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 s 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m 0 0", "key": "1w4tng" }]], "aliases": ["media-optical-cd-symbolic"], "gtkIconName": "media-optical-cd-symbolic" };
__iconData$4g.node;
const MediaOpticalCd = createAdwaitaIcon(__iconData$4g);

const __iconData$4f = { "name": "media-optical-dvd", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 c -4.40625 0 -8 3.59375 -8 8 s 3.59375 8 8 8 s 8 -3.59375 8 -8 s -3.59375 -8 -8 -8 z m 0 2 c 3.3125 0 6 2.6875 6 6 s -2.6875 6 -6 6 s -6 -2.6875 -6 -6 s 2.6875 -6 6 -6 z m 0 3 c -1.65625 0 -3 1.34375 -3 3 s 1.34375 3 3 3 s 3 -1.34375 3 -3 s -1.34375 -3 -3 -3 z m 0 1 c 1.105469 0 2 0.894531 2 2 s -0.894531 2 -2 2 s -2 -0.894531 -2 -2 s 0.894531 -2 2 -2 z m 0 1 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 s 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m 0 0", "key": "1w4tng" }]], "aliases": ["media-optical-dvd-symbolic"], "gtkIconName": "media-optical-dvd-symbolic" };
__iconData$4f.node;
const MediaOpticalDvd = createAdwaitaIcon(__iconData$4f);

const __iconData$4e = { "name": "media-optical", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 c -4.40625 0 -8 3.59375 -8 8 s 3.59375 8 8 8 s 8 -3.59375 8 -8 s -3.59375 -8 -8 -8 z m 0 2 c 3.3125 0 6 2.6875 6 6 s -2.6875 6 -6 6 s -6 -2.6875 -6 -6 s 2.6875 -6 6 -6 z m 0 3 c -1.65625 0 -3 1.34375 -3 3 s 1.34375 3 3 3 s 3 -1.34375 3 -3 s -1.34375 -3 -3 -3 z m 0 1 c 1.105469 0 2 0.894531 2 2 s -0.894531 2 -2 2 s -2 -0.894531 -2 -2 s 0.894531 -2 2 -2 z m 0 1 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 s 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m 0 0", "key": "1w4tng" }]], "aliases": ["media-optical-symbolic"], "gtkIconName": "media-optical-symbolic" };
__iconData$4e.node;
const MediaOptical = createAdwaitaIcon(__iconData$4e);

const __iconData$4d = { "name": "media-playback-pause", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 1 h 3 c 0.550781 0 1 0.449219 1 1 v 12 c 0 0.550781 -0.449219 1 -1 1 h -3 c -0.550781 0 -1 -0.449219 -1 -1 v -12 c 0 -0.550781 0.449219 -1 1 -1 z m 0 0", "key": "1eh0d5" }], ["path", { "fill": "currentColor", "d": "m 10 1 h 3 c 0.550781 0 1 0.449219 1 1 v 12 c 0 0.550781 -0.449219 1 -1 1 h -3 c -0.550781 0 -1 -0.449219 -1 -1 v -12 c 0 -0.550781 0.449219 -1 1 -1 z m 0 0", "key": "1uqo7f" }]], "aliases": ["media-playback-pause-symbolic"], "gtkIconName": "media-playback-pause-symbolic" };
__iconData$4d.node;
const MediaPlaybackPause = createAdwaitaIcon(__iconData$4d);

const __iconData$4c = { "name": "media-playback-start", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 2 2.5 v 11 c 0 1.5 1.269531 1.492188 1.269531 1.492188 h 0.128907 c 0.246093 0.003906 0.488281 -0.050782 0.699218 -0.171876 l 9.796875 -5.597656 c 0.433594 -0.242187 0.65625 -0.734375 0.65625 -1.226562 c 0 -0.492188 -0.222656 -0.984375 -0.65625 -1.222656 l -9.796875 -5.597657 c -0.210937 -0.121093 -0.453125 -0.175781 -0.699218 -0.175781 h -0.128907 s -1.269531 0 -1.269531 1.5 z m 0 0", "key": "y9bs6i" }]], "aliases": ["media-playback-start-symbolic"], "gtkIconName": "media-playback-start-symbolic" };
__iconData$4c.node;
const MediaPlaybackStart = createAdwaitaIcon(__iconData$4c);

const __iconData$4b = { "name": "media-playback-stop", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3.5 2 h 9 c 0.828125 0 1.5 0.671875 1.5 1.5 v 9 c 0 0.828125 -0.671875 1.5 -1.5 1.5 h -9 c -0.828125 0 -1.5 -0.671875 -1.5 -1.5 v -9 c 0 -0.828125 0.671875 -1.5 1.5 -1.5 z m 0 0", "key": "15l2d9" }]], "aliases": ["media-playback-stop-symbolic"], "gtkIconName": "media-playback-stop-symbolic" };
__iconData$4b.node;
const MediaPlaybackStop = createAdwaitaIcon(__iconData$4b);

const __iconData$4a = { "name": "media-playlist-consecutive", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 12 1 v 2 h -12 v 2 h 12 v 2 h 1 v -0.007812 c 0.265625 0.003906 0.519531 -0.101563 0.707031 -0.285157 l 2 -2 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 l -2 -2 c -0.1875 -0.183594 -0.441406 -0.289063 -0.707031 -0.285157 v -0.007812 z m 0 8 v 2 h -12 v 2 h 12 v 2 h 1 v -0.007812 c 0.265625 0.003906 0.519531 -0.101563 0.707031 -0.285157 l 2 -2 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 l -2 -2 c -0.1875 -0.183594 -0.441406 -0.289063 -0.707031 -0.285157 v -0.007812 z m 0 0", "key": "1f7bz8" }]], "aliases": ["media-playlist-consecutive-symbolic"], "gtkIconName": "media-playlist-consecutive-symbolic" };
__iconData$4a.node;
const MediaPlaylistConsecutive = createAdwaitaIcon(__iconData$4a);

const __iconData$49 = { "name": "media-playlist-repeat-song", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 1 v 2 h -3 c -2.199219 0 -4 1.800781 -4 4 v 2 c 0 1.019531 0.386719 1.964844 1.019531 2.671875 c 0.367188 0.410156 1 0.445313 1.410157 0.078125 c 0.414062 -0.367188 0.449218 -1 0.078124 -1.414062 c -0.316406 -0.351563 -0.507812 -0.8125 -0.507812 -1.335938 v -2 c 0 -1.125 0.875 -2 2 -2 h 3 v 2 h 1 v -0.007812 c 0.265625 0.003906 0.519531 -0.101563 0.707031 -0.285157 l 2 -2 c 0.207031 -0.207031 0.3125 -0.496093 0.289063 -0.789062 c 0 -0.015625 -0.003906 -0.03125 -0.007813 -0.046875 c -0.007812 -0.070313 -0.023437 -0.136719 -0.046875 -0.203125 c -0.011718 -0.035157 -0.023437 -0.070313 -0.042968 -0.101563 c 0 -0.007812 -0.003907 -0.011718 -0.007813 -0.019531 c -0.011719 -0.023437 -0.027344 -0.046875 -0.039063 -0.070313 c -0.007812 -0.011718 -0.019531 -0.027343 -0.027343 -0.039062 c -0.015625 -0.019531 -0.027344 -0.042969 -0.042969 -0.0625 c -0.007812 -0.007812 -0.015625 -0.015625 -0.023438 -0.023438 c -0.015624 -0.019531 -0.03125 -0.039062 -0.050781 -0.058593 l -2 -2 c -0.1875 -0.183594 -0.441406 -0.289063 -0.707031 -0.285157 v -0.007812 z m 7 1 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 1 5 c -0.550781 0 -1 0.449219 -1 1 v 1.007812 c 0 1.125 -0.875 2 -2 2 h -4 v -2.007812 h -1 v 0.007812 c -0.265625 -0.003906 -0.519531 0.101563 -0.707031 0.285157 l -2 2 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 l 2 2 c 0.1875 0.183594 0.441406 0.289063 0.707031 0.285157 v 0.007812 h 1 v -1.992188 h 4 c 2.199219 0 4 -1.804687 4 -4 v -1.007812 c 0 -0.550781 -0.449219 -1 -1 -1 z m 0 0", "key": "1xhvfd" }]], "aliases": ["media-playlist-repeat-song-symbolic"], "gtkIconName": "media-playlist-repeat-song-symbolic" };
__iconData$49.node;
const MediaPlaylistRepeatSong = createAdwaitaIcon(__iconData$49);

const __iconData$48 = { "name": "media-playlist-repeat", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 1 v 2 h -4 c -2.199219 0 -4 1.800781 -4 4 v 2 c 0 1.019531 0.386719 1.964844 1.019531 2.671875 c 0.367188 0.410156 1 0.445313 1.410157 0.078125 c 0.414062 -0.367188 0.449218 -1 0.078124 -1.414062 c -0.316406 -0.351563 -0.507812 -0.8125 -0.507812 -1.335938 v -2 c 0 -1.125 0.875 -2 2 -2 h 4 v 2 h 1 v -0.007812 c 0.265625 0.003906 0.519531 -0.101563 0.707031 -0.285157 l 2 -2 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 l -2 -2 c -0.1875 -0.183594 -0.441406 -0.289063 -0.707031 -0.285157 v -0.007812 z m 6.289062 3 c -0.265624 -0.011719 -0.523437 0.078125 -0.71875 0.257812 c -0.414062 0.367188 -0.449218 1 -0.078124 1.410157 c 0.316406 0.355469 0.507812 0.816406 0.507812 1.339843 v 2 c 0 1.125 -0.875 2 -2 2 h -4 v -2.007812 h -1 v 0.007812 c -0.265625 -0.003906 -0.519531 0.101563 -0.707031 0.285157 l -2 2 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 l 2 2 c 0.1875 0.183594 0.441406 0.289063 0.707031 0.285157 v 0.007812 h 1 v -1.992188 h 4 c 2.199219 0 4 -1.804687 4 -4 v -2 c 0 -1.023437 -0.386719 -1.96875 -1.019531 -2.675781 c -0.175781 -0.199219 -0.425781 -0.316406 -0.691407 -0.332031 z m 0 0", "key": "11koqj" }]], "aliases": ["media-playlist-repeat-symbolic"], "gtkIconName": "media-playlist-repeat-symbolic" };
__iconData$48.node;
const MediaPlaylistRepeat = createAdwaitaIcon(__iconData$48);

const __iconData$47 = { "name": "media-playlist-shuffle", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 12 1 v 2 h -3 c -0.859375 0 -1.59375 0.480469 -2.011719 1.007812 c -0.417969 0.523438 -0.648437 1.074219 -0.882812 1.542969 l -0.105469 0.210938 l -0.105469 -0.210938 c -0.191406 -0.382812 -0.386719 -0.816406 -0.671875 -1.25 c -0.414062 -0.632812 -1.207031 -1.300781 -2.222656 -1.300781 h -3 v 2 h 3 c 0.296875 0 0.316406 0.039062 0.550781 0.398438 c 0.164063 0.246093 0.34375 0.625 0.554688 1.050781 l 0.777343 1.550781 l -0.777343 1.550781 c -0.261719 0.523438 -0.476563 0.96875 -0.65625 1.199219 c -0.183594 0.226562 -0.199219 0.25 -0.449219 0.25 h -3 v 2 h 3 c 0.859375 0 1.59375 -0.480469 2.011719 -1.007812 c 0.417969 -0.523438 0.648437 -1.074219 0.882812 -1.542969 l 0.105469 -0.210938 l 0.105469 0.210938 c 0.164062 0.328125 0.335937 0.703125 0.5625 1.078125 c 0.414062 0.6875 1.222656 1.472656 2.332031 1.472656 h 3 v 2 h 1 v -0.007812 c 0.265625 0.003906 0.519531 -0.101563 0.707031 -0.285157 l 2 -2 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 l -2 -2 c -0.1875 -0.183594 -0.441406 -0.289063 -0.707031 -0.285157 v -0.007812 h -1 v 2 h -3 c -0.324219 0 -0.351562 -0.058594 -0.617188 -0.503906 c -0.148437 -0.242188 -0.304687 -0.574219 -0.488281 -0.945313 l -0.777343 -1.550781 l 0.777343 -1.550781 c 0.261719 -0.523438 0.476563 -0.96875 0.65625 -1.199219 c 0.183594 -0.226562 0.199219 -0.25 0.449219 -0.25 h 3 v 2 h 1 v -0.007812 c 0.265625 0.003906 0.519531 -0.101563 0.707031 -0.285157 l 2 -2 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 l -2 -2 c -0.1875 -0.183594 -0.441406 -0.289063 -0.707031 -0.285157 v -0.007812 z m 0 0", "key": "1pa6gd" }]], "aliases": ["media-playlist-shuffle-symbolic"], "gtkIconName": "media-playlist-shuffle-symbolic" };
__iconData$47.node;
const MediaPlaylistShuffle = createAdwaitaIcon(__iconData$47);

const __iconData$46 = { "name": "media-record", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 15 8 c 0 3.867188 -3.132812 7 -7 7 s -7 -3.132812 -7 -7 s 3.132812 -7 7 -7 s 7 3.132812 7 7 z m 0 0", "key": "1ggvr4" }]], "aliases": ["media-record-symbolic"], "gtkIconName": "media-record-symbolic" };
__iconData$46.node;
const MediaRecord = createAdwaitaIcon(__iconData$46);

const __iconData$45 = { "name": "media-removable", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 5 0 v 4 h 6 v -4 z m 1 1 h 1 v 1 h -1 z m 3 0 h 1 v 1 h -1 z m -5 4 c -0.554688 0 -1 0.445312 -1 1 v 7 c 0 1.660156 1.339844 3 3 3 h 4 c 1.660156 0 3 -1.339844 3 -3 v -7 c 0 -0.554688 -0.445312 -1 -1 -1 z m 0 0", "key": "1sehd7" }]], "aliases": ["media-removable-symbolic"], "gtkIconName": "media-removable-symbolic" };
__iconData$45.node;
const MediaRemovable = createAdwaitaIcon(__iconData$45);

const __iconData$44 = { "name": "media-seek-backward", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 4.003906 c -0.179688 -0.003906 -0.359375 0.046875 -0.515625 0.140625 l -5 3 c -0.648437 0.386719 -0.648437 1.328125 0 1.714844 l 5 3 c 0.15625 0.09375 0.335937 0.140625 0.515625 0.140625 v 0.003906 c 1 -0.003906 1 -1 1 -1 v -6 s 0.003906 -1 -1 -1 z m 0 0", "key": "1y5enr" }], ["path", { "fill": "currentColor", "d": "m 14 4.003906 c -0.179688 -0.003906 -0.359375 0.046875 -0.515625 0.140625 l -5 3 c -0.648437 0.386719 -0.648437 1.328125 0 1.714844 l 5 3 c 0.15625 0.09375 0.335937 0.140625 0.515625 0.140625 v 0.003906 c 1 -0.003906 1 -1 1 -1 v -6 s 0.003906 -1 -1 -1 z m 0 0", "key": "1p3an6" }]], "aliases": ["media-seek-backward-symbolic"], "gtkIconName": "media-seek-backward-symbolic" };
__iconData$44.node;
const MediaSeekBackward = createAdwaitaIcon(__iconData$44);

const __iconData$43 = { "name": "media-seek-forward", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 2 4 c 0.179688 0 0.359375 0.046875 0.515625 0.140625 l 5 3 c 0.648437 0.386719 0.648437 1.328125 0 1.71875 l -5 3 c -0.15625 0.089844 -0.335937 0.140625 -0.515625 0.136719 c -1 0.003906 -1 -0.996094 -1 -0.996094 v -6 s -0.003906 -1 1 -1 z m 0 0", "key": "1gaiht" }], ["path", { "fill": "currentColor", "d": "m 9 4 c 0.179688 0 0.359375 0.046875 0.515625 0.140625 l 5 3 c 0.648437 0.386719 0.648437 1.328125 0 1.71875 l -5 3 c -0.15625 0.089844 -0.335937 0.140625 -0.515625 0.136719 c -1 0.003906 -1 -0.996094 -1 -0.996094 v -6 s -0.003906 -1 1 -1 z m 0 0", "key": "19i3nb" }]], "aliases": ["media-seek-forward-symbolic"], "gtkIconName": "media-seek-forward-symbolic" };
__iconData$43.node;
const MediaSeekForward = createAdwaitaIcon(__iconData$43);

const __iconData$42 = { "name": "media-skip-backward", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 15 3 v 10 c 0 1 -1.085938 1 -1.085938 1 h -0.113281 c -0.210937 0 -0.417969 -0.046875 -0.601562 -0.148438 l -8.398438 -4.800781 c -0.375 -0.207031 -0.5625 -0.628906 -0.5625 -1.050781 s 0.1875 -0.84375 0.5625 -1.050781 l 8.398438 -4.800781 c 0.183593 -0.101563 0.390625 -0.148438 0.601562 -0.148438 h 0.113281 s 1.085938 0 1.085938 1 z m 0 0", "key": "leox2i" }], ["path", { "fill": "currentColor", "d": "m 1.5 2 h 1 c 0.277344 0 0.5 0.222656 0.5 0.5 v 11 c 0 0.277344 -0.222656 0.5 -0.5 0.5 h -1 c -0.277344 0 -0.5 -0.222656 -0.5 -0.5 v -11 c 0 -0.277344 0.222656 -0.5 0.5 -0.5 z m 0 0", "key": "htozx1" }]], "aliases": ["media-skip-backward-symbolic"], "gtkIconName": "media-skip-backward-symbolic" };
__iconData$42.node;
const MediaSkipBackward = createAdwaitaIcon(__iconData$42);

const __iconData$41 = { "name": "media-skip-forward", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1 3 v 10 c 0 1 1.085938 1 1.085938 1 h 0.113281 c 0.210937 0 0.417969 -0.046875 0.601562 -0.148438 l 8.398438 -4.800781 c 0.375 -0.207031 0.5625 -0.628906 0.5625 -1.050781 s -0.1875 -0.84375 -0.5625 -1.050781 l -8.398438 -4.800781 c -0.183593 -0.101563 -0.390625 -0.148438 -0.601562 -0.148438 h -0.113281 s -1.085938 0 -1.085938 1 z m 0 0", "key": "fkbuk2" }], ["path", { "fill": "currentColor", "d": "m 14.5 2 h -1 c -0.277344 0 -0.5 0.222656 -0.5 0.5 v 11 c 0 0.277344 0.222656 0.5 0.5 0.5 h 1 c 0.277344 0 0.5 -0.222656 0.5 -0.5 v -11 c 0 -0.277344 -0.222656 -0.5 -0.5 -0.5 z m 0 0", "key": "17pkb7" }]], "aliases": ["media-skip-forward-symbolic"], "gtkIconName": "media-skip-forward-symbolic" };
__iconData$41.node;
const MediaSkipForward = createAdwaitaIcon(__iconData$41);

const __iconData$40 = { "name": "media-tape", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 2 c -1.644531 0 -3 1.355469 -3 3 v 6 c 0 1.644531 1.355469 3 3 3 h 10 c 1.644531 0 3 -1.355469 3 -3 v -6 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 2 h 10 c 0.570312 0 1 0.429688 1 1 v 6 c 0 0.554688 -0.445312 1 -1 1 h -10 c -0.554688 0 -1 -0.445312 -1 -1 v -6 c 0 -0.570312 0.429688 -1 1 -1 z m 2 2 c -1.097656 0 -2 0.902344 -2 2 s 0.902344 2 2 2 h 6 c 1.097656 0 2 -0.902344 2 -2 s -0.902344 -2 -2 -2 s -2 0.902344 -2 2 c 0 0.363281 0.101562 0.707031 0.273438 1 h -2.542969 c 0.167969 -0.292969 0.269531 -0.636719 0.269531 -1 c 0 -1.097656 -0.902344 -2 -2 -2 z m 0 1 c 0.558594 0 1 0.441406 1 1 s -0.441406 1 -1 1 s -1 -0.441406 -1 -1 s 0.441406 -1 1 -1 z m 6 0 c 0.558594 0 1 0.441406 1 1 s -0.441406 1 -1 1 s -1 -0.441406 -1 -1 s 0.441406 -1 1 -1 z m 0 0", "key": "17jv4y" }]], "aliases": ["media-tape-symbolic"], "gtkIconName": "media-tape-symbolic" };
__iconData$40.node;
const MediaTape = createAdwaitaIcon(__iconData$40);

const __iconData$3$ = { "name": "media-view-subtitles", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 1 c -1.644531 0 -3 1.355469 -3 3 v 8 c 0 1.644531 1.355469 3 3 3 h 10 c 1.644531 0 3 -1.355469 3 -3 v -8 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 2 h 10 c 0.554688 0 1 0.445312 1 1 v 8 c 0 0.554688 -0.5 1 -1 1 h -10 c -0.570312 0 -1 -0.429688 -1 -1 v -8 c 0 -0.554688 0.445312 -1 1 -1 z m 0 6 v 1 h 4 v -1 z m 5 0 v 1 h 3 v -1 z m 4 0 v 1 h 1 v -1 z m -9 2 v 1 h 2 v -1 z m 3 0 v 1 h 3 v -1 z m 4 0 v 1 h 3 v -1 z m 0 0", "key": "1nuvtw" }]], "aliases": ["media-view-subtitles-symbolic"], "gtkIconName": "media-view-subtitles-symbolic" };
__iconData$3$.node;
const MediaViewSubtitles = createAdwaitaIcon(__iconData$3$);

const __iconData$3_ = { "name": "media-zip", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4 1 c -1.644531 0 -3 1.355469 -3 3 v 8 c 0 1.644531 1.355469 3 3 3 h 8 c 1.644531 0 3 -1.355469 3 -3 v -8 c 0 -1.644531 -1.355469 -3 -3 -3 v 2 c 0.570312 0 1 0.429688 1 1 v 8 c 0 0.554688 -0.445312 1 -1 1 h -8 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.570312 0.429688 -1 1 -1 z m 1 0 v 2.5 c 0 0.277344 0.222656 0.5 0.5 0.5 h 5 c 0.277344 0 0.5 -0.222656 0.5 -0.5 v -2.5 z m 0 0", "key": "l6gg4n" }]], "aliases": ["media-zip-symbolic"], "gtkIconName": "media-zip-symbolic" };
__iconData$3_.node;
const MediaZip = createAdwaitaIcon(__iconData$3_);

const __iconData$3Z = { "name": "microphone-disabled", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1.53125 0.46875 l -1.0625 1.0625 l 14 14 l 1.0625 -1.0625 l -2.792969 -2.792969 c 0.789063 -1.011719 1.261719 -2.285156 1.261719 -3.664062 v -1.011719 h -1.5 v 1.011719 c 0 0.972656 -0.304688 1.871093 -0.824219 2.601562 l -1.09375 -1.089843 c 0.265625 -0.445313 0.417969 -0.964844 0.417969 -1.523438 v -4 c 0 -1.660156 -1.339844 -3 -3 -3 c -1.640625 0 -2.964844 1.308594 -2.996094 2.941406 z m 0.46875 6.53125 v 1.011719 c 0 2.964843 2.164062 5.429687 5 5.90625 v 2.082031 h 2 v -2.082031 c 0.5 -0.085938 0.976562 -0.230469 1.425781 -0.429688 l -1.164062 -1.164062 c -0.398438 0.113281 -0.824219 0.175781 -1.261719 0.175781 c -2.507812 0 -4.5 -1.988281 -4.5 -4.488281 v -1.011719 z m 3.003906 1.066406 c 0.035156 1.609375 1.320313 2.894532 2.929688 2.929688 z m 0 0", "key": "19b26k" }]], "aliases": ["microphone-disabled-symbolic"], "gtkIconName": "microphone-disabled-symbolic" };
__iconData$3Z.node;
const MicrophoneDisabled = createAdwaitaIcon(__iconData$3Z);

const __iconData$3Y = { "name": "microphone-hardware-disabled", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 8 1 c -1.660156 0 -3 1.339844 -3 3 v 1 h 6 v -1 c 0 -1.660156 -1.339844 -3 -3 -3 z m -5.199219 10 c 0.878907 1.515625 2.40625 2.613281 4.199219 2.917969 v 2.082031 h 2 v -2.082031 c 1.792969 -0.304688 3.320312 -1.402344 4.199219 -2.917969 h -1.832031 c -0.820313 0.921875 -2.019532 1.5 -3.367188 1.5 s -2.546875 -0.578125 -3.367188 -1.5 z m 0 0", "key": "1xx9ml" }], ["path", { "fill": "currentColor", "d": "m 0 6 h 16 v 4 h -16 z m 0 0", "key": "1286a1" }]], "aliases": ["microphone-hardware-disabled-symbolic"], "gtkIconName": "microphone-hardware-disabled-symbolic" };
__iconData$3Y.node;
const MicrophoneHardwareDisabled = createAdwaitaIcon(__iconData$3Y);

const __iconData$3X = { "name": "microphone-sensitivity-high", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 1 c -1.660156 0 -3 1.339844 -3 3 v 4 c 0 1.660156 1.339844 3 3 3 s 3 -1.339844 3 -3 v -4 c 0 -1.660156 -1.339844 -3 -3 -3 z m -6 6 v 1.011719 c 0 2.964843 2.164062 5.429687 5 5.90625 v 2.082031 h 2 v -2.082031 c 2.835938 -0.476563 5 -2.941407 5 -5.90625 v -1.011719 h -1.5 v 1.011719 c 0 2.5 -1.992188 4.488281 -4.5 4.488281 s -4.5 -1.988281 -4.5 -4.488281 v -1.011719 z m 0 0", "key": "w0ye5m" }]], "aliases": ["microphone-sensitivity-high-symbolic"], "gtkIconName": "microphone-sensitivity-high-symbolic" };
__iconData$3X.node;
const MicrophoneSensitivityHigh = createAdwaitaIcon(__iconData$3X);

const __iconData$3W = { "name": "microphone-sensitivity-low", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.670588", "d": "m 8 1 c -1.660156 0 -3 1.339844 -3 3 v 4 h 2 v -4 c 0 -0.554688 0.445312 -1 1 -1 s 1 0.445312 1 1 v 4 h 2 v -4 c 0 -1.660156 -1.339844 -3 -3 -3 z m 0 0", "key": "tcsqf6" }], ["path", { "fill": "currentColor", "d": "m 2 7 v 1.011719 c 0 2.964843 2.164062 5.429687 5 5.90625 v 2.082031 h 2 v -2.082031 c 2.835938 -0.476563 5 -2.941407 5 -5.90625 v -1.011719 h -1.5 v 1.011719 c 0 2.5 -1.992188 4.488281 -4.5 4.488281 s -4.5 -1.988281 -4.5 -4.488281 v -1.011719 z m 3 1 c 0 1.660156 1.339844 3 3 3 s 3 -1.339844 3 -3 z m 0 0", "key": "8eq29w" }]], "aliases": ["microphone-sensitivity-low-symbolic"], "gtkIconName": "microphone-sensitivity-low-symbolic" };
__iconData$3W.node;
const MicrophoneSensitivityLow = createAdwaitaIcon(__iconData$3W);

const __iconData$3V = { "name": "microphone-sensitivity-medium", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.670588", "d": "m 8 1 c -1.660156 0 -3 1.339844 -3 3 v 2 h 2 v -2 c 0 -0.554688 0.445312 -1 1 -1 s 1 0.445312 1 1 v 2 h 2 v -2 c 0 -1.660156 -1.339844 -3 -3 -3 z m 0 0", "key": "19cqre" }], ["path", { "fill": "currentColor", "d": "m 5 6 v 2 c 0 1.660156 1.339844 3 3 3 s 3 -1.339844 3 -3 v -2 z m -3 1 v 1.011719 c 0 2.964843 2.164062 5.429687 5 5.90625 v 2.082031 h 2 v -2.082031 c 2.835938 -0.476563 5 -2.941407 5 -5.90625 v -1.011719 h -1.5 v 1.011719 c 0 2.5 -1.992188 4.488281 -4.5 4.488281 s -4.5 -1.988281 -4.5 -4.488281 v -1.011719 z m 0 0", "key": "1xx9y1" }]], "aliases": ["microphone-sensitivity-medium-symbolic"], "gtkIconName": "microphone-sensitivity-medium-symbolic" };
__iconData$3V.node;
const MicrophoneSensitivityMedium = createAdwaitaIcon(__iconData$3V);

const __iconData$3U = { "name": "microphone-sensitivity-muted", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.670588", "d": "m 8 1 c -1.660156 0 -3 1.339844 -3 3 v 4 c 0 1.660156 1.339844 3 3 3 c 0.359375 0 0.699219 -0.066406 1.015625 -0.179688 c 0.039063 -0.453124 0.230469 -0.894531 0.570313 -1.234374 c 0.332031 -0.332032 0.769531 -0.535157 1.234374 -0.574219 c 0.113282 -0.316407 0.179688 -0.65625 0.179688 -1.011719 v -4 c 0 -1.660156 -1.339844 -3 -3 -3 z m 0 2 c 0.554688 0 1 0.445312 1 1 v 4 c 0 0.554688 -0.445312 1 -1 1 s -1 -0.445312 -1 -1 v -4 c 0 -0.554688 0.445312 -1 1 -1 z m -6 4 v 1.011719 c 0 2.964843 2.164062 5.421875 5 5.898437 v 2.089844 h 2 v -2.089844 c 0.128906 -0.023437 0.253906 -0.046875 0.382812 -0.078125 c 0.058594 -0.085937 0.125 -0.167969 0.203126 -0.246093 l 0.414062 -0.414063 v -0.34375 l -0.414062 -0.414063 c -0.050782 -0.050781 -0.101563 -0.105468 -0.144532 -0.164062 c -0.449218 0.15625 -0.933594 0.25 -1.441406 0.25 c -2.507812 0 -4.5 -1.988281 -4.5 -4.488281 v -1.011719 z m 10.5 0 v 1.011719 c 0 0.503906 -0.089844 0.980469 -0.246094 1.429687 c 0.054688 0.042969 0.109375 0.09375 0.160156 0.144532 l 0.414063 0.414062 h 0.34375 l 0.414063 -0.414062 c 0.078124 -0.078126 0.160156 -0.144532 0.246093 -0.210938 c 0.109375 -0.4375 0.167969 -0.894531 0.167969 -1.363281 v -1.011719 z m 0 0", "key": "ydmgu3" }], ["path", { "fill": "currentColor", "d": "m 11 10 c -0.265625 0 -0.519531 0.105469 -0.707031 0.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 l 1.292969 1.292969 l -1.292969 1.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 s 1.023437 0.390625 1.414062 0 l 1.292969 -1.292969 l 1.292969 1.292969 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 s 0.390625 -1.023437 0 -1.414062 l -1.292969 -1.292969 l 1.292969 -1.292969 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 s -0.519531 0.105469 -0.707031 0.292969 l -1.292969 1.292969 l -1.292969 -1.292969 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0 0", "key": "v9fe42" }]], "aliases": ["microphone-sensitivity-muted-symbolic"], "gtkIconName": "microphone-sensitivity-muted-symbolic" };
__iconData$3U.node;
const MicrophoneSensitivityMuted = createAdwaitaIcon(__iconData$3U);

const __iconData$3T = { "name": "modem", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7.496094 0 c -3.898438 0.00390625 -7.160156 3.011719 -7.4726565 6.898438 l -0.0234375 0.289062 v 0.8125 h 15 v -0.5 l -0.027344 -0.609375 c -0.316406 -3.886719 -3.578125 -6.89453125 -7.476562 -6.890625 z m -0.496094 2.023438 v 2.933593 c -0.609375 -0.089843 -1.25 -0.347656 -1.929688 -0.808593 c 0.316407 -0.734376 0.804688 -1.449219 1.585938 -2.085938 c 0.113281 -0.015625 0.226562 -0.027344 0.34375 -0.039062 z m 1 0 c 0.132812 0.011718 0.261719 0.03125 0.394531 0.050781 c 0.773438 0.632812 1.257813 1.339843 1.570313 2.074219 c -0.660156 0.449218 -1.3125 0.726562 -1.964844 0.816406 z m -3.320312 0.75 c -0.160157 0.246093 -0.300782 0.496093 -0.421876 0.75 c -0.09375 -0.082032 -0.1875 -0.164063 -0.28125 -0.253907 c 0.21875 -0.183593 0.457032 -0.347656 0.703126 -0.496093 z m 5.695312 0.035156 c 0.230469 0.140625 0.449219 0.296875 0.652344 0.464844 c -0.085938 0.082031 -0.171875 0.160156 -0.257813 0.234374 c -0.113281 -0.234374 -0.242187 -0.46875 -0.394531 -0.699218 z m -7.105469 1.167968 c 0.203125 0.191407 0.410157 0.367188 0.613281 0.53125 c -0.265624 0.875 -0.34375 1.730469 -0.371093 2.492188 h -1.488281 c 0.105468 -1.152344 0.554687 -2.191406 1.246093 -3.023438 z m 8.464844 0.007813 c 0.6875 0.828125 1.136719 1.867187 1.242187 3.015625 h -1.457031 c -0.023437 -0.761719 -0.101562 -1.621094 -0.363281 -2.5 c 0.191406 -0.160156 0.386719 -0.332031 0.578125 -0.515625 z m -6.984375 1.140625 c 0.757812 0.472656 1.507812 0.753906 2.25 0.84375 v 1.03125 h -2.484375 c 0.023437 -0.601562 0.078125 -1.238281 0.234375 -1.875 z m 5.539062 0.007812 c 0.152344 0.632813 0.210938 1.269532 0.230469 1.867188 h -2.519531 v -1.027344 c 0.796875 -0.085937 1.558594 -0.378906 2.289062 -0.839844 z m -9.289062 3.867188 c -0.550781 0 -1 0.449219 -1 1 v 1 c 0 0.75 0.394531 1.1875 0.824219 1.605469 c 0.429687 0.417969 0.984375 0.804687 1.648437 1.15625 c 1.324219 0.695312 3.085938 1.238281 5.027344 1.238281 s 3.703125 -0.542969 5.027344 -1.238281 c 0.664062 -0.351563 1.21875 -0.738281 1.648437 -1.15625 c 0.429688 -0.417969 0.824219 -0.855469 0.824219 -1.605469 v -1 c 0 -0.550781 -0.449219 -1 -1 -1 h -3 s -0.457031 -0.015625 -0.949219 0.230469 c -0.488281 0.246093 -1.050781 0.9375 -1.050781 1.769531 v 1.800781 c -0.492188 0.089844 -0.976562 0.199219 -1.5 0.199219 s -1.007812 -0.109375 -1.5 -0.199219 v -1.800781 c 0 -0.832031 -0.5625 -1.523438 -1.050781 -1.769531 c -0.492188 -0.246094 -0.949219 -0.230469 -0.949219 -0.230469 z m 1.078125 2 h 1.921875 v 1.21875 c -0.191406 -0.082031 -0.429688 -0.140625 -0.597656 -0.230469 c -0.523438 -0.273437 -0.9375 -0.574219 -1.179688 -0.8125 c -0.066406 -0.066406 -0.113281 -0.125 -0.144531 -0.175781 z m 8.921875 0 h 1.921875 c -0.03125 0.050781 -0.078125 0.109375 -0.144531 0.175781 c -0.242188 0.238281 -0.65625 0.539063 -1.179688 0.8125 c -0.167968 0.089844 -0.40625 0.148438 -0.597656 0.230469 z m 0 0", "key": "1pj7io" }]], "aliases": ["modem-symbolic"], "gtkIconName": "modem-symbolic" };
__iconData$3T.node;
const Modem = createAdwaitaIcon(__iconData$3T);

const __iconData$3S = { "name": "multimedia-player-apple-ipod-touch", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 5 0 c -1.644531 0 -3 1.355469 -3 3 v 10 c 0 1.644531 1.355469 3 3 3 h 6 c 1.644531 0 3 -1.355469 3 -3 v -10 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 2 h 6 c 0.570312 0 1 0.429688 1 1 v 4 c 0 0.554688 -0.445312 1 -1 1 h -6 c -0.554688 0 -1 -0.445312 -1 -1 v -4 c 0 -0.570312 0.429688 -1 1 -1 z m 1.441406 8.003906 c 0.097656 -0.011718 0.195313 0.007813 0.28125 0.046875 l 3 1.5 c 0.367188 0.1875 0.367188 0.710938 0 0.894531 l -3 1.5 c -0.332031 0.167969 -0.722656 -0.074218 -0.722656 -0.445312 v -3 c 0 -0.253906 0.191406 -0.464844 0.441406 -0.496094 z m 0 0", "key": "1nrife" }]], "aliases": ["multimedia-player-apple-ipod-touch-symbolic"], "gtkIconName": "multimedia-player-apple-ipod-touch-symbolic" };
__iconData$3S.node;
const MultimediaPlayerAppleIpodTouch = createAdwaitaIcon(__iconData$3S);

const __iconData$3R = { "name": "multimedia-player", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 5 0 c -1.644531 0 -3 1.355469 -3 3 v 10 c 0 1.644531 1.355469 3 3 3 h 6 c 1.644531 0 3 -1.355469 3 -3 v -10 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 2 h 6 c 0.570312 0 1 0.429688 1 1 v 4 c 0 0.554688 -0.445312 1 -1 1 h -6 c -0.554688 0 -1 -0.445312 -1 -1 v -4 c 0 -0.570312 0.429688 -1 1 -1 z m 1.441406 8.003906 c 0.097656 -0.011718 0.195313 0.007813 0.28125 0.046875 l 3 1.5 c 0.367188 0.1875 0.367188 0.710938 0 0.894531 l -3 1.5 c -0.332031 0.167969 -0.722656 -0.074218 -0.722656 -0.445312 v -3 c 0 -0.253906 0.191406 -0.464844 0.441406 -0.496094 z m 0 0", "key": "1nrife" }]], "aliases": ["multimedia-player-symbolic"], "gtkIconName": "multimedia-player-symbolic" };
__iconData$3R.node;
const MultimediaPlayer = createAdwaitaIcon(__iconData$3R);

const __iconData$3Q = { "name": "multimedia-volume-control", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M2 5h2.484l2.97-3H8v12h-.475l-3.04-3H2z", "key": "1vbnhl" }], ["path", { "fill": "currentColor", "d": "M14 8c0-2.166-.739-4.02-2-5h-1v2c.607.789 1 1.76 1 3 0 1.241-.393 2.22-1 3v2h1c1.223-.995 2-2.873 2-5z", "key": "1g6a59" }], ["path", { "fill": "currentColor", "d": "M11 8c0-1.257-.312-2.216-1-3H9v6h1c.672-.837 1-1.742 1-3z", "key": "qee6yw" }]], "aliases": ["multimedia-volume-control-symbolic"], "gtkIconName": "multimedia-volume-control-symbolic" };
__iconData$3Q.node;
const MultimediaVolumeControl = createAdwaitaIcon(__iconData$3Q);

const __iconData$3P = { "name": "network-cellular-2g", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 0 c -1.660156 0 -3 1.339844 -3 3 v 10 c 0 1.660156 1.339844 3 3 3 h 10 c 1.660156 0 3 -1.339844 3 -3 v -10 c 0 -1.660156 -1.339844 -3 -3 -3 z m 1 3 h 1 s 0.457031 -0.015625 0.949219 0.230469 c 0.488281 0.246093 1.050781 0.9375 1.050781 1.769531 v 2 c 0 0.214844 -0.070312 0.425781 -0.199219 0.601562 l -2.550781 3.398438 h 2.75 v 2 h -5 v -2 c 0 -0.214844 0.070312 -0.425781 0.199219 -0.601562 l 2.800781 -3.730469 v -1.667969 h -1 v 2 h -2 v -2 c 0 -0.832031 0.5625 -1.523438 1.050781 -1.769531 c 0.492188 -0.246094 0.949219 -0.230469 0.949219 -0.230469 z m 6 0 h 2 c 0.832031 0 1.523438 0.5625 1.769531 1.050781 c 0.246094 0.492188 0.230469 0.949219 0.230469 0.949219 v 1 h -2 v -1 h -2 v 6 h 2 v -2 h -1 v -2 h 3 v 4 s 0.015625 0.457031 -0.230469 0.949219 c -0.246093 0.488281 -0.9375 1.050781 -1.769531 1.050781 h -2 s -0.457031 0.015625 -0.949219 -0.230469 c -0.488281 -0.246093 -1.050781 -0.9375 -1.050781 -1.769531 v -6 s -0.015625 -0.457031 0.230469 -0.949219 c 0.246093 -0.488281 0.9375 -1.050781 1.769531 -1.050781 z m 0 0", "key": "oa6ooe" }]], "aliases": ["network-cellular-2g-symbolic"], "gtkIconName": "network-cellular-2g-symbolic" };
__iconData$3P.node;
const NetworkCellular2g = createAdwaitaIcon(__iconData$3P);

const __iconData$3O = { "name": "network-cellular-3g", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 0 c -1.660156 0 -3 1.339844 -3 3 v 10 c 0 1.660156 1.339844 3 3 3 h 10 c 1.660156 0 3 -1.339844 3 -3 v -10 c 0 -1.660156 -1.339844 -3 -3 -3 z m -1 3 h 4 c 0.726562 0.019531 1.195312 0.78125 0.875 1.4375 l -1.375 2.78125 c 0.355469 0.117188 0.75 0.195312 0.96875 0.4375 c 0.332031 0.367188 0.53125 0.808594 0.53125 1.34375 v 2 c 0 1.113281 -0.90625 2 -2 2 h -3 v -2 h 3 v -2 h -1 c -0.726562 -0.019531 -1.195312 -0.78125 -0.875 -1.4375 l 1.25 -2.5625 h -2.375 z m 8 0 h 2 c 0.832031 0 1.523438 0.5625 1.769531 1.050781 c 0.246094 0.492188 0.230469 0.949219 0.230469 0.949219 v 1 h -2 v -1 h -2 v 6 h 2 v -2 h -1 v -2 h 3 v 4 s 0.015625 0.457031 -0.230469 0.949219 c -0.246093 0.488281 -0.9375 1.050781 -1.769531 1.050781 h -2 s -0.457031 0.015625 -0.949219 -0.230469 c -0.488281 -0.246093 -1.050781 -0.9375 -1.050781 -1.769531 v -6 s -0.015625 -0.457031 0.230469 -0.949219 c 0.246093 -0.488281 0.9375 -1.050781 1.769531 -1.050781 z m 0 0", "key": "wsxelb" }]], "aliases": ["network-cellular-3g-symbolic"], "gtkIconName": "network-cellular-3g-symbolic" };
__iconData$3O.node;
const NetworkCellular3g = createAdwaitaIcon(__iconData$3O);

const __iconData$3N = { "name": "network-cellular-4g", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 0 c -1.660156 0 -3 1.339844 -3 3 v 10 c 0 1.660156 1.339844 3 3 3 h 10 c 1.660156 0 3 -1.339844 3 -3 v -10 c 0 -1.660156 -1.339844 -3 -3 -3 z m -1 3 h 2 v 4 h 1 v -4 h 2 v 10 h -2 v -4 h -1 c -1 0 -2 -0.839844 -2 -2 z m 8 0 h 2 c 0.832031 0 1.523438 0.5625 1.769531 1.050781 c 0.246094 0.492188 0.230469 0.949219 0.230469 0.949219 v 1 h -2 v -1 h -2 v 6 h 2 v -2 h -1 v -2 h 3 v 4 s 0.015625 0.457031 -0.230469 0.949219 c -0.246093 0.488281 -0.9375 1.050781 -1.769531 1.050781 h -2 s -0.457031 0.015625 -0.949219 -0.230469 c -0.488281 -0.246093 -1.050781 -0.9375 -1.050781 -1.769531 v -6 s -0.015625 -0.457031 0.230469 -0.949219 c 0.246093 -0.488281 0.9375 -1.050781 1.769531 -1.050781 z m 0 0", "key": "jl17wm" }]], "aliases": ["network-cellular-4g-symbolic"], "gtkIconName": "network-cellular-4g-symbolic" };
__iconData$3N.node;
const NetworkCellular4g = createAdwaitaIcon(__iconData$3N);

const __iconData$3M = { "name": "network-cellular-5g", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 0 c -1.660156 0 -3 1.339844 -3 3 v 10 c 0 1.660156 1.339844 3 3 3 h 10 c 1.660156 0 3 -1.339844 3 -3 v -10 c 0 -1.660156 -1.339844 -3 -3 -3 z m -1.023438 3 h 5.023438 v 2 h -2.992188 v 2 h 0.992188 c 1.003906 0.003906 2.007812 1 2.007812 2 h -0.007812 v 2 h 0.007812 c 0 1 -1.007812 2 -2.011718 2 h -3.019532 v -2 h 3.011719 v -2 h -3.011719 z m 8.023438 0 h 2 c 0.832031 0 1.523438 0.5625 1.769531 1.050781 c 0.246094 0.492188 0.230469 0.949219 0.230469 0.949219 v 1 h -2 v -1 h -2 v 6 h 2 v -2 h -1 v -2 h 3 v 4 s 0.015625 0.457031 -0.230469 0.949219 c -0.246093 0.488281 -0.9375 1.050781 -1.769531 1.050781 h -2 s -0.457031 0.015625 -0.949219 -0.230469 c -0.488281 -0.246093 -1.050781 -0.9375 -1.050781 -1.769531 v -6 s -0.015625 -0.457031 0.230469 -0.949219 c 0.246093 -0.488281 0.9375 -1.050781 1.769531 -1.050781 z m 0 0", "key": "jc17k" }]], "aliases": ["network-cellular-5g-symbolic"], "gtkIconName": "network-cellular-5g-symbolic" };
__iconData$3M.node;
const NetworkCellular5g = createAdwaitaIcon(__iconData$3M);

const __iconData$3L = { "name": "network-cellular-acquiring-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 3 1 c 0.554688 0 1 0.445312 1 1 v 3 h -1 c -0.769531 0 -1.46875 0.289062 -2 0.765625 v -3.765625 c 0 -0.554688 0.445312 -1 1 -1 z m 4 3 c 0.554688 0 1 0.445312 1 1 h -3 c 0 -0.554688 0.445312 -1 1 -1 z m 8.210938 6.023438 c 0.453124 0.097656 0.789062 0.496093 0.789062 0.976562 v 3 c 0 0.554688 -0.445312 1 -1 1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 v -3 c 0.878906 0 1.664062 -0.378906 2.210938 -0.976562 z m -14.210938 0.210937 c 0.53125 0.476563 1.230469 0.765625 2 0.765625 h 1 v 3 c 0 0.554688 -0.445312 1 -1 1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 z m 11 0.765625 v 3 c 0 0.554688 -0.445312 1 -1 1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 v -3 z m -4 0 v 3 c 0 0.554688 -0.445312 1 -1 1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 v -3 z m 0 0", "key": "8moh34" }], ["path", { "fill": "currentColor", "d": "m 3 6 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 5 0 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 5 0 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 0 0", "key": "14xcmx" }]], "aliases": ["network-cellular-acquiring-rtl-symbolic"], "gtkIconName": "network-cellular-acquiring-rtl-symbolic" };
__iconData$3L.node;
const NetworkCellularAcquiringRtl = createAdwaitaIcon(__iconData$3L);

const __iconData$3K = { "name": "network-cellular-acquiring", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 13 1 c -0.554688 0 -1 0.445312 -1 1 v 3 h 1 c 0.769531 0 1.46875 0.289062 2 0.765625 v -3.765625 c 0 -0.554688 -0.445312 -1 -1 -1 z m -4 3 c -0.554688 0 -1 0.445312 -1 1 h 3 c 0 -0.554688 -0.445312 -1 -1 -1 z m -8.210938 6.023438 c -0.453124 0.097656 -0.789062 0.496093 -0.789062 0.976562 v 3 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -3 c -0.878906 0 -1.664062 -0.378906 -2.210938 -0.976562 z m 14.210938 0.210937 c -0.53125 0.476563 -1.230469 0.765625 -2 0.765625 h -1 v 3 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 z m -11 0.765625 v 3 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -3 z m 4 0 v 3 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -3 z m 0 0", "key": "d0mndd" }], ["path", { "fill": "currentColor", "d": "m 3 6 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 5 0 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 5 0 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 0 0", "key": "14xcmx" }]], "aliases": ["network-cellular-acquiring-symbolic"], "gtkIconName": "network-cellular-acquiring-symbolic" };
__iconData$3K.node;
const NetworkCellularAcquiring = createAdwaitaIcon(__iconData$3K);

const __iconData$3J = { "name": "network-cellular-connected", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1.957031 2.023438 c -0.125 0.003906 -0.25 0.054687 -0.34375 0.152343 l -0.238281 0.25 c -0.933594 0.96875 -1.3984375 2.273438 -1.3984375 3.574219 s 0.4648435 2.605469 1.3984375 3.574219 l 0.238281 0.25 c 0.1875 0.199219 0.503907 0.203125 0.699219 0.015625 c 0.199219 -0.191406 0.207031 -0.503906 0.015625 -0.703125 l -0.234375 -0.25 c -1.46875 -1.53125 -1.46875 -4.238281 0 -5.773438 l 0.234375 -0.25 c 0.191406 -0.199219 0.183594 -0.511719 -0.015625 -0.703125 c -0.097656 -0.09375 -0.226562 -0.140625 -0.355469 -0.136718 z m 12.039063 0 c -0.128906 -0.003907 -0.257813 0.042968 -0.355469 0.136718 c -0.199219 0.191406 -0.203125 0.503906 -0.015625 0.703125 l 0.238281 0.25 c 1.46875 1.535157 1.46875 4.242188 0 5.773438 l -0.238281 0.25 c -0.1875 0.199219 -0.183594 0.511719 0.015625 0.703125 c 0.199219 0.1875 0.511719 0.183594 0.703125 -0.015625 l 0.238281 -0.246094 c 0.929688 -0.972656 1.394531 -2.277344 1.394531 -3.578125 s -0.464843 -2.601562 -1.394531 -3.574219 l -0.238281 -0.25 c -0.09375 -0.097656 -0.21875 -0.148437 -0.347656 -0.152343 z m -10.539063 1.492187 c -0.113281 0.007813 -0.222656 0.046875 -0.3125 0.128906 l -0.273437 0.25 c -0.613282 0.554688 -0.90625 1.34375 -0.902344 2.125 c 0.007812 0.777344 0.3125 1.550781 0.902344 2.085938 l 0.273437 0.25 c 0.203125 0.1875 0.519531 0.171875 0.703125 -0.03125 s 0.171875 -0.519531 -0.03125 -0.703125 l -0.273437 -0.246094 c -0.699219 -0.636719 -0.746094 -2.070312 0 -2.75 l 0.273437 -0.246094 c 0.203125 -0.183594 0.214844 -0.496094 0.03125 -0.703125 c -0.105468 -0.113281 -0.25 -0.167969 -0.390625 -0.160156 z m 8.992188 0 c -0.125 0.007813 -0.25 0.058594 -0.34375 0.160156 c -0.183594 0.207031 -0.167969 0.519531 0.035156 0.703125 l 0.273437 0.246094 c 0.742188 0.679688 0.695313 2.113281 0 2.75 l -0.273437 0.246094 c -0.203125 0.183594 -0.21875 0.5 -0.035156 0.703125 c 0.1875 0.203125 0.5 0.21875 0.707031 0.03125 l 0.269531 -0.25 c 0.589844 -0.535157 0.894531 -1.308594 0.902344 -2.085938 c 0.007813 -0.78125 -0.289063 -1.570312 -0.902344 -2.125 l -0.269531 -0.25 c -0.101562 -0.09375 -0.234375 -0.132812 -0.363281 -0.128906 z m -7.699219 1.484375 c -0.289062 0 -0.550781 0.164062 -0.675781 0.425781 c -0.125 0.257813 -0.089844 0.566407 0.089843 0.792969 l 2.835938 3.542969 v 6.238281 h 2 v -6.238281 l 2.835938 -3.542969 c 0.179687 -0.226562 0.214843 -0.535156 0.089843 -0.792969 c -0.125 -0.261719 -0.386719 -0.425781 -0.675781 -0.425781 z m 1.5625 1.5 h 3.375 l -1.6875 2.113281 z m 0 0", "key": "7ksfn9" }]], "aliases": ["network-cellular-connected-symbolic"], "gtkIconName": "network-cellular-connected-symbolic" };
__iconData$3J.node;
const NetworkCellularConnected = createAdwaitaIcon(__iconData$3J);

const __iconData$3I = { "name": "network-cellular-disabled-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1.53125 0.46875 l -1.0625 1.0625 l 14 14 l 0.53125 -0.53125 c 0.554688 0 1 -0.445312 1 -1 v -3 c 0 -0.554688 -0.445312 -1 -1 -1 h -1 c -0.554688 0 -1 0.445312 -1 1 v 0.9375 l -1 -1 v -2.9375 c 0 -0.554688 -0.445312 -1 -1 -1 h -1 c -0.535156 0 -0.964844 0.414062 -0.996094 0.941406 l -1.003906 -1.003906 v -1.9375 c 0 -0.554688 -0.445312 -1 -1 -1 h -1 c -0.261719 0 -0.496094 0.101562 -0.671875 0.261719 l -1.328125 -1.324219 v -0.9375 c 0 -0.554688 -0.445312 -1 -1 -1 h -0.9375 z m -0.53125 3.59375 v 9.9375 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -6.9375 z m 4 4 v 5.9375 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -2.9375 z m 4 4 v 1.9375 c 0 0.554688 0.445312 1 1 1 h 1 c 0.261719 0 0.496094 -0.101562 0.671875 -0.261719 z m 0 0", "key": "83po6e" }]], "aliases": ["network-cellular-disabled-rtl-symbolic"], "gtkIconName": "network-cellular-disabled-rtl-symbolic" };
__iconData$3I.node;
const NetworkCellularDisabledRtl = createAdwaitaIcon(__iconData$3I);

const __iconData$3H = { "name": "network-cellular-disabled", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1.53125 0.46875 l -1.0625 1.0625 l 14 14 l 1.0625 -1.0625 l -0.53125 -0.53125 v -11.9375 c 0 -0.554688 -0.445312 -1 -1 -1 h -1 c -0.554688 0 -1 0.445312 -1 1 v 8.9375 l -1 -1 v -4.9375 c 0 -0.554688 -0.445312 -1 -1 -1 h -1 c -0.554688 0 -1 0.445312 -1 1 v 1.9375 z m 2.730469 6.855469 c -0.160157 0.179687 -0.261719 0.414062 -0.261719 0.675781 v 6 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -3.9375 z m -3.261719 2.675781 c -0.554688 0 -1 0.445312 -1 1 v 3 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -3 c 0 -0.554688 -0.445312 -1 -1 -1 z m 7 1.0625 v 2.9375 c 0 0.554688 0.445312 1 1 1 h 1 c 0.535156 0 0.964844 -0.414062 0.996094 -0.941406 z m 0 0", "key": "1h1m5x" }]], "aliases": ["network-cellular-disabled-symbolic"], "gtkIconName": "network-cellular-disabled-symbolic" };
__iconData$3H.node;
const NetworkCellularDisabled = createAdwaitaIcon(__iconData$3H);

const __iconData$3G = { "name": "network-cellular-edge", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 0 c -1.660156 0 -3 1.339844 -3 3 v 10 c 0 1.660156 1.339844 3 3 3 h 10 c 1.660156 0 3 -1.339844 3 -3 v -10 c 0 -1.660156 -1.339844 -3 -3 -3 z m 3 3 h 6 v 2 h -6 v 2 h 4 v 2 h -4 v 2 h 0.03125 h 5.96875 v 2 h -6 c -0.625 0 -0.992188 -0.242188 -1.34375 -0.5625 c -0.332031 -0.304688 -0.644531 -0.789062 -0.625 -1.4375 h -0.03125 v -6 h 0.03125 c -0.011719 -0.476562 0.109375 -1 0.46875 -1.40625 c 0.355469 -0.402344 0.933594 -0.582031 1.5 -0.5625 z m 0 0", "key": "1adhza" }]], "aliases": ["network-cellular-edge-symbolic"], "gtkIconName": "network-cellular-edge-symbolic" };
__iconData$3G.node;
const NetworkCellularEdge = createAdwaitaIcon(__iconData$3G);

const __iconData$3F = { "name": "network-cellular-gprs", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 0 c -1.660156 0 -3 1.339844 -3 3 v 10 c 0 1.660156 1.339844 3 3 3 h 10 c 1.660156 0 3 -1.339844 3 -3 v -10 c 0 -1.660156 -1.339844 -3 -3 -3 z m 3 3 h 4 c 0.832031 0 1.523438 0.5625 1.769531 1.050781 c 0.246094 0.492188 0.230469 0.949219 0.230469 0.949219 v 1 h -2 v -1 h -4 v 6 h 4 v -2 h -2.0625 v -2 h 4.0625 v 4 s 0.015625 0.457031 -0.230469 0.949219 c -0.246093 0.488281 -0.9375 1.050781 -1.769531 1.050781 h -4 s -0.457031 0.015625 -0.949219 -0.230469 c -0.488281 -0.246093 -1.050781 -0.9375 -1.050781 -1.769531 v -6 s -0.015625 -0.457031 0.230469 -0.949219 c 0.246093 -0.488281 0.9375 -1.050781 1.769531 -1.050781 z m 0 0", "key": "o6t104" }]], "aliases": ["network-cellular-gprs-symbolic"], "gtkIconName": "network-cellular-gprs-symbolic" };
__iconData$3F.node;
const NetworkCellularGprs = createAdwaitaIcon(__iconData$3F);

const __iconData$3E = { "name": "network-cellular-hardware-disabled-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 3 1 c 0.554688 0 1 0.445312 1 1 v 3 h -3 v -3 c 0 -0.554688 0.445312 -1 1 -1 z m 4 3 c 0.554688 0 1 0.445312 1 1 h -3 c 0 -0.554688 0.445312 -1 1 -1 z m 9 7 v 3 c 0 0.554688 -0.445312 1 -1 1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 v -3 z m -4 0 v 3 c 0 0.554688 -0.445312 1 -1 1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 v -3 z m -4 0 v 3 c 0 0.554688 -0.445312 1 -1 1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 v -3 z m -4 0 v 3 c 0 0.554688 -0.445312 1 -1 1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 v -3 z m 0 0", "key": "1282m6" }], ["path", { "fill": "currentColor", "d": "m 16 6 h -16 v 4 h 16 z m 0 0", "key": "12pq0l" }]], "aliases": ["network-cellular-hardware-disabled-rtl-symbolic"], "gtkIconName": "network-cellular-hardware-disabled-rtl-symbolic" };
__iconData$3E.node;
const NetworkCellularHardwareDisabledRtl = createAdwaitaIcon(__iconData$3E);

const __iconData$3D = { "name": "network-cellular-hardware-disabled", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 13 1 c -0.554688 0 -1 0.445312 -1 1 v 3 h 3 v -3 c 0 -0.554688 -0.445312 -1 -1 -1 z m -4 3 c -0.554688 0 -1 0.445312 -1 1 h 3 c 0 -0.554688 -0.445312 -1 -1 -1 z m -9 7 v 3 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -3 z m 4 0 v 3 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -3 z m 4 0 v 3 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -3 z m 4 0 v 3 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -3 z m 0 0", "key": "1rw8au" }], ["path", { "fill": "currentColor", "d": "m 0 6 h 16 v 4 h -16 z m 0 0", "key": "1286a1" }]], "aliases": ["network-cellular-hardware-disabled-symbolic"], "gtkIconName": "network-cellular-hardware-disabled-symbolic" };
__iconData$3D.node;
const NetworkCellularHardwareDisabled = createAdwaitaIcon(__iconData$3D);

const __iconData$3C = { "name": "network-cellular-hspa", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 0 c -1.660156 0 -3 1.339844 -3 3 v 10 c 0 1.660156 1.339844 3 3 3 h 10 c 1.660156 0 3 -1.339844 3 -3 v -10 c 0 -1.660156 -1.339844 -3 -3 -3 z m 1 3 h 2 v 4 h 4 v -4 h 2 v 10 h -2 v -4 h -4 v 4 h -2 z m 0 0", "key": "5um1l1" }]], "aliases": ["network-cellular-hspa-symbolic"], "gtkIconName": "network-cellular-hspa-symbolic" };
__iconData$3C.node;
const NetworkCellularHspa = createAdwaitaIcon(__iconData$3C);

const __iconData$3B = { "name": "network-cellular-no-route-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 3 1 c 0.554688 0 1 0.445312 1 1 v 12 c 0 0.554688 -0.445312 1 -1 1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 v -12 c 0 -0.554688 0.445312 -1 1 -1 z m 8.75 6.347656 c 0.152344 0.175782 0.25 0.402344 0.25 0.652344 v 6 c 0 0.554688 -0.445312 1 -1 1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 v -0.28125 c 0.613281 -0.355469 0.996094 -1.007812 1 -1.71875 v -2.546875 c 0.8125 -0.472656 1.433594 -1.21875 1.75 -2.105469 z m -6.75 1.277344 c 0.285156 0.328125 0.625 0.609375 1 0.828125 v 2.546875 c 0 1.105469 0.894531 2 2 2 c 0 0.554688 -0.445312 1 -1 1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 z m 10 1.375 c 0.554688 0 1 0.445312 1 1 v 3 c 0 0.554688 -0.445312 1 -1 1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 v -3 c 0 -0.554688 0.445312 -1 1 -1 z m 0 0", "key": "f76g7t" }], ["path", { "fill": "currentColor", "d": "m 8.152344 3.007812 c -0.4375 -0.023437 -0.878906 0.046876 -1.300782 0.222657 c -1.117187 0.460937 -1.851562 1.558593 -1.851562 2.769531 h 2 c 0 -0.40625 0.242188 -0.769531 0.617188 -0.925781 c 0.378906 -0.152344 0.804687 -0.070313 1.089843 0.21875 c 0.289063 0.289062 0.375 0.714843 0.21875 1.089843 s -0.515625 0.617188 -0.925781 0.617188 c -0.550781 0 -1 0.449219 -1 1 v 2 h 2 v -1.179688 c 0.789062 -0.28125 1.441406 -0.875 1.773438 -1.671874 c 0.460937 -1.117188 0.203124 -2.414063 -0.652344 -3.269532 c -0.535156 -0.535156 -1.238282 -0.835937 -1.96875 -0.871094 z m -0.152344 7.992188 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 c 0.554688 0 1 -0.449219 1 -1 s -0.445312 -1 -1 -1 z m 0 0", "key": "5p8cux" }]], "aliases": ["network-cellular-no-route-rtl-symbolic"], "gtkIconName": "network-cellular-no-route-rtl-symbolic" };
__iconData$3B.node;
const NetworkCellularNoRouteRtl = createAdwaitaIcon(__iconData$3B);

const __iconData$3A = { "name": "network-cellular-no-route", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 13 1 c -0.554688 0 -1 0.445312 -1 1 v 12 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -12 c 0 -0.554688 -0.445312 -1 -1 -1 z m -8.75 6.347656 c -0.152344 0.175782 -0.25 0.402344 -0.25 0.652344 v 6 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -0.28125 c -0.613281 -0.355469 -0.996094 -1.007812 -1 -1.71875 v -2.546875 c -0.8125 -0.472656 -1.433594 -1.21875 -1.75 -2.105469 z m 6.75 1.277344 c -0.285156 0.328125 -0.625 0.609375 -1 0.828125 v 2.546875 c 0 1.105469 -0.894531 2 -2 2 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 z m -10 1.375 c -0.554688 0 -1 0.445312 -1 1 v 3 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -3 c 0 -0.554688 -0.445312 -1 -1 -1 z m 0 0", "key": "ss2cv9" }], ["path", { "fill": "currentColor", "d": "m 8.152344 3.007812 c -0.4375 -0.023437 -0.882813 0.046876 -1.300782 0.222657 c -1.117187 0.460937 -1.851562 1.558593 -1.851562 2.769531 h 2 c 0 -0.40625 0.242188 -0.769531 0.617188 -0.925781 c 0.375 -0.152344 0.800781 -0.070313 1.089843 0.21875 c 0.289063 0.289062 0.371094 0.714843 0.21875 1.089843 c -0.15625 0.375 -0.519531 0.617188 -0.925781 0.617188 c -0.550781 0 -1 0.449219 -1 1 v 2 h 2 v -1.179688 c 0.785156 -0.28125 1.441406 -0.875 1.769531 -1.671874 c 0.464844 -1.117188 0.207031 -2.414063 -0.648437 -3.269532 c -0.535156 -0.535156 -1.242188 -0.835937 -1.96875 -0.871094 z m -0.152344 7.992188 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 s 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m 0 0", "key": "1ujiwe" }]], "aliases": ["network-cellular-no-route-symbolic"], "gtkIconName": "network-cellular-no-route-symbolic" };
__iconData$3A.node;
const NetworkCellularNoRoute = createAdwaitaIcon(__iconData$3A);

const __iconData$3z = { "name": "network-cellular-offline-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 2 1 c -0.554688 0 -1 0.445312 -1 1 v 12 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -12 c 0 -0.554688 -0.445312 -1 -1 -1 z m 4 3 c -0.554688 0 -1 0.445312 -1 1 v 9 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -9 c 0 -0.554688 -0.445312 -1 -1 -1 z m 4 3 c -0.554688 0 -1 0.445312 -1 1 v 6 c 0 0.148438 0.035156 0.289062 0.09375 0.417969 c 0.089844 -0.308594 0.253906 -0.59375 0.492188 -0.832031 l 0.585937 -0.585938 l -0.585937 -0.585938 c -0.773438 -0.773437 -0.773438 -2.054687 0 -2.828124 c 0.375 -0.375 0.882812 -0.585938 1.414062 -0.585938 c 0.355469 0 0.699219 0.097656 1 0.269531 v -1.269531 c 0 -0.554688 -0.445312 -1 -1 -1 z m 6 5.828125 l -0.171875 0.171875 l 0.171875 0.171875 z m 0 0", "key": "1k4f16" }], ["path", { "fill": "currentColor", "d": "m 11 10 c -0.265625 0 -0.519531 0.105469 -0.707031 0.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 l 1.292969 1.292969 l -1.292969 1.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 s 1.023437 0.390625 1.414062 0 l 1.292969 -1.292969 l 1.292969 1.292969 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 s 0.390625 -1.023437 0 -1.414062 l -1.292969 -1.292969 l 1.292969 -1.292969 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 s -0.519531 0.105469 -0.707031 0.292969 l -1.292969 1.292969 l -1.292969 -1.292969 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0 0", "key": "v9fe42" }]], "aliases": ["network-cellular-offline-rtl-symbolic"], "gtkIconName": "network-cellular-offline-rtl-symbolic" };
__iconData$3z.node;
const NetworkCellularOfflineRtl = createAdwaitaIcon(__iconData$3z);

const __iconData$3y = { "name": "network-cellular-offline", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 13 1 c -0.554688 0 -1 0.445312 -1 1 v 7.269531 c 0.148438 0.089844 0.289062 0.191407 0.414062 0.316407 l 0.414063 0.414062 h 0.34375 l 0.414063 -0.414062 c 0.375 -0.375 0.882812 -0.585938 1.414062 -0.585938 v -7 c 0 -0.554688 -0.445312 -1 -1 -1 z m -4 3 c -0.554688 0 -1 0.445312 -1 1 v 9 c 0 0.554688 0.445312 1 1 1 h 0.007812 c 0 -0.515625 0.191407 -1.027344 0.578126 -1.414062 l 0.414062 -0.414063 v -0.34375 l -0.414062 -0.414063 c -0.773438 -0.773437 -0.773438 -2.054687 0 -2.828124 c 0.375 -0.375 0.882812 -0.585938 1.414062 -0.585938 v -4 c 0 -0.554688 -0.445312 -1 -1 -1 z m -4 3 c -0.554688 0 -1 0.445312 -1 1 v 6 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -6 c 0 -0.554688 -0.445312 -1 -1 -1 z m -4 3 c -0.554688 0 -1 0.445312 -1 1 v 3 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -3 c 0 -0.554688 -0.445312 -1 -1 -1 z m 0 0", "key": "tbuhie" }], ["path", { "fill": "currentColor", "d": "m 11 10 c -0.265625 0 -0.519531 0.105469 -0.707031 0.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 l 1.292969 1.292969 l -1.292969 1.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 s 1.023437 0.390625 1.414062 0 l 1.292969 -1.292969 l 1.292969 1.292969 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 s 0.390625 -1.023437 0 -1.414062 l -1.292969 -1.292969 l 1.292969 -1.292969 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 s -0.519531 0.105469 -0.707031 0.292969 l -1.292969 1.292969 l -1.292969 -1.292969 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0 0", "key": "v9fe42" }]], "aliases": ["network-cellular-offline-symbolic"], "gtkIconName": "network-cellular-offline-symbolic" };
__iconData$3y.node;
const NetworkCellularOffline = createAdwaitaIcon(__iconData$3y);

const __iconData$3x = { "name": "network-cellular-signal-excellent-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 1 c 0.554688 0 1 0.445312 1 1 v 12 c 0 0.554688 -0.445312 1 -1 1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 v -12 c 0 -0.554688 0.445312 -1 1 -1 z m 4 3 c 0.554688 0 1 0.445312 1 1 v 9 c 0 0.554688 -0.445312 1 -1 1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 v -9 c 0 -0.554688 0.445312 -1 1 -1 z m 4 3 c 0.554688 0 1 0.445312 1 1 v 6 c 0 0.554688 -0.445312 1 -1 1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 v -6 c 0 -0.554688 0.445312 -1 1 -1 z m 4 3 c 0.554688 0 1 0.445312 1 1 v 3 c 0 0.554688 -0.445312 1 -1 1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 v -3 c 0 -0.554688 0.445312 -1 1 -1 z m 0 0", "key": "w72s9r" }]], "aliases": ["network-cellular-signal-excellent-rtl-symbolic"], "gtkIconName": "network-cellular-signal-excellent-rtl-symbolic" };
__iconData$3x.node;
const NetworkCellularSignalExcellentRtl = createAdwaitaIcon(__iconData$3x);

const __iconData$3w = { "name": "network-cellular-signal-excellent", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 13 1 c -0.554688 0 -1 0.445312 -1 1 v 12 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -12 c 0 -0.554688 -0.445312 -1 -1 -1 z m -4 3 c -0.554688 0 -1 0.445312 -1 1 v 9 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -9 c 0 -0.554688 -0.445312 -1 -1 -1 z m -4 3 c -0.554688 0 -1 0.445312 -1 1 v 6 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -6 c 0 -0.554688 -0.445312 -1 -1 -1 z m -4 3 c -0.554688 0 -1 0.445312 -1 1 v 3 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -3 c 0 -0.554688 -0.445312 -1 -1 -1 z m 0 0", "key": "7xeuoz" }]], "aliases": ["network-cellular-signal-excellent-symbolic"], "gtkIconName": "network-cellular-signal-excellent-symbolic" };
__iconData$3w.node;
const NetworkCellularSignalExcellent = createAdwaitaIcon(__iconData$3w);

const __iconData$3v = { "name": "network-cellular-signal-good-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 4 c 0.554688 0 1 0.445312 1 1 v 9 c 0 0.554688 -0.445312 1 -1 1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 v -9 c 0 -0.554688 0.445312 -1 1 -1 z m 4 3 c 0.554688 0 1 0.445312 1 1 v 6 c 0 0.554688 -0.445312 1 -1 1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 v -6 c 0 -0.554688 0.445312 -1 1 -1 z m 4 3 c 0.554688 0 1 0.445312 1 1 v 3 c 0 0.554688 -0.445312 1 -1 1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 v -3 c 0 -0.554688 0.445312 -1 1 -1 z m 0 0", "key": "dm3klz" }], ["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 3 1 c 0.554688 0 1 0.445312 1 1 v 12 c 0 0.554688 -0.445312 1 -1 1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 v -12 c 0 -0.554688 0.445312 -1 1 -1 z m 0 0", "key": "1ur6bx" }]], "aliases": ["network-cellular-signal-good-rtl-symbolic"], "gtkIconName": "network-cellular-signal-good-rtl-symbolic" };
__iconData$3v.node;
const NetworkCellularSignalGoodRtl = createAdwaitaIcon(__iconData$3v);

const __iconData$3u = { "name": "network-cellular-signal-good", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 9 4 c -0.554688 0 -1 0.445312 -1 1 v 9 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -9 c 0 -0.554688 -0.445312 -1 -1 -1 z m -4 3 c -0.554688 0 -1 0.445312 -1 1 v 6 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -6 c 0 -0.554688 -0.445312 -1 -1 -1 z m -4 3 c -0.554688 0 -1 0.445312 -1 1 v 3 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -3 c 0 -0.554688 -0.445312 -1 -1 -1 z m 0 0", "key": "te49g4" }], ["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 13 1 c -0.554688 0 -1 0.445312 -1 1 v 12 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -12 c 0 -0.554688 -0.445312 -1 -1 -1 z m 0 0", "key": "nj4ejp" }]], "aliases": ["network-cellular-signal-good-symbolic"], "gtkIconName": "network-cellular-signal-good-symbolic" };
__iconData$3u.node;
const NetworkCellularSignalGood = createAdwaitaIcon(__iconData$3u);

const __iconData$3t = { "name": "network-cellular-signal-none-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 3 1 c 0.554688 0 1 0.445312 1 1 v 12 c 0 0.554688 -0.445312 1 -1 1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 v -12 c 0 -0.554688 0.445312 -1 1 -1 z m 4 3 c 0.554688 0 1 0.445312 1 1 v 9 c 0 0.554688 -0.445312 1 -1 1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 v -9 c 0 -0.554688 0.445312 -1 1 -1 z m 4 3 c 0.554688 0 1 0.445312 1 1 v 6 c 0 0.554688 -0.445312 1 -1 1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 v -6 c 0 -0.554688 0.445312 -1 1 -1 z m 4 3 c 0.554688 0 1 0.445312 1 1 v 3 c 0 0.554688 -0.445312 1 -1 1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 v -3 c 0 -0.554688 0.445312 -1 1 -1 z m 0 0", "key": "1dhvgf" }]], "aliases": ["network-cellular-signal-none-rtl-symbolic"], "gtkIconName": "network-cellular-signal-none-rtl-symbolic" };
__iconData$3t.node;
const NetworkCellularSignalNoneRtl = createAdwaitaIcon(__iconData$3t);

const __iconData$3s = { "name": "network-cellular-signal-none", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 13 1 c -0.554688 0 -1 0.445312 -1 1 v 12 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -12 c 0 -0.554688 -0.445312 -1 -1 -1 z m -4 3 c -0.554688 0 -1 0.445312 -1 1 v 9 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -9 c 0 -0.554688 -0.445312 -1 -1 -1 z m -4 3 c -0.554688 0 -1 0.445312 -1 1 v 6 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -6 c 0 -0.554688 -0.445312 -1 -1 -1 z m -4 3 c -0.554688 0 -1 0.445312 -1 1 v 3 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -3 c 0 -0.554688 -0.445312 -1 -1 -1 z m 0 0", "key": "aifzbg" }]], "aliases": ["network-cellular-signal-none-symbolic"], "gtkIconName": "network-cellular-signal-none-symbolic" };
__iconData$3s.node;
const NetworkCellularSignalNone = createAdwaitaIcon(__iconData$3s);

const __iconData$3r = { "name": "network-cellular-signal-ok-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 11 7 c 0.554688 0 1 0.445312 1 1 v 6 c 0 0.554688 -0.445312 1 -1 1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 v -6 c 0 -0.554688 0.445312 -1 1 -1 z m 4 3 c 0.554688 0 1 0.445312 1 1 v 3 c 0 0.554688 -0.445312 1 -1 1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 v -3 c 0 -0.554688 0.445312 -1 1 -1 z m 0 0", "key": "ldeemi" }], ["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 3 1 c 0.554688 0 1 0.445312 1 1 v 12 c 0 0.554688 -0.445312 1 -1 1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 v -12 c 0 -0.554688 0.445312 -1 1 -1 z m 4 3 c 0.554688 0 1 0.445312 1 1 v 9 c 0 0.554688 -0.445312 1 -1 1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 v -9 c 0 -0.554688 0.445312 -1 1 -1 z m 0 0", "key": "12kep8" }]], "aliases": ["network-cellular-signal-ok-rtl-symbolic"], "gtkIconName": "network-cellular-signal-ok-rtl-symbolic" };
__iconData$3r.node;
const NetworkCellularSignalOkRtl = createAdwaitaIcon(__iconData$3r);

const __iconData$3q = { "name": "network-cellular-signal-ok", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 5 7 c -0.554688 0 -1 0.445312 -1 1 v 6 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -6 c 0 -0.554688 -0.445312 -1 -1 -1 z m -4 3 c -0.554688 0 -1 0.445312 -1 1 v 3 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -3 c 0 -0.554688 -0.445312 -1 -1 -1 z m 0 0", "key": "j9v58y" }], ["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 13 1 c -0.554688 0 -1 0.445312 -1 1 v 12 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -12 c 0 -0.554688 -0.445312 -1 -1 -1 z m -4 3 c -0.554688 0 -1 0.445312 -1 1 v 9 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -9 c 0 -0.554688 -0.445312 -1 -1 -1 z m 0 0", "key": "1qczwz" }]], "aliases": ["network-cellular-signal-ok-symbolic"], "gtkIconName": "network-cellular-signal-ok-symbolic" };
__iconData$3q.node;
const NetworkCellularSignalOk = createAdwaitaIcon(__iconData$3q);

const __iconData$3p = { "name": "network-cellular-signal-weak-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 15 10 c 0.554688 0 1 0.445312 1 1 v 3 c 0 0.554688 -0.445312 1 -1 1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 v -3 c 0 -0.554688 0.445312 -1 1 -1 z m 0 0", "key": "16nkt0" }], ["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 3 1 c 0.554688 0 1 0.445312 1 1 v 12 c 0 0.554688 -0.445312 1 -1 1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 v -12 c 0 -0.554688 0.445312 -1 1 -1 z m 4 3 c 0.554688 0 1 0.445312 1 1 v 9 c 0 0.554688 -0.445312 1 -1 1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 v -9 c 0 -0.554688 0.445312 -1 1 -1 z m 4 3 c 0.554688 0 1 0.445312 1 1 v 6 c 0 0.554688 -0.445312 1 -1 1 h -1 c -0.554688 0 -1 -0.445312 -1 -1 v -6 c 0 -0.554688 0.445312 -1 1 -1 z m 0 0", "key": "n2govt" }]], "aliases": ["network-cellular-signal-weak-rtl-symbolic"], "gtkIconName": "network-cellular-signal-weak-rtl-symbolic" };
__iconData$3p.node;
const NetworkCellularSignalWeakRtl = createAdwaitaIcon(__iconData$3p);

const __iconData$3o = { "name": "network-cellular-signal-weak", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1 10 c -0.554688 0 -1 0.445312 -1 1 v 3 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -3 c 0 -0.554688 -0.445312 -1 -1 -1 z m 0 0", "key": "auops9" }], ["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 13 1 c -0.554688 0 -1 0.445312 -1 1 v 12 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -12 c 0 -0.554688 -0.445312 -1 -1 -1 z m -4 3 c -0.554688 0 -1 0.445312 -1 1 v 9 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -9 c 0 -0.554688 -0.445312 -1 -1 -1 z m -4 3 c -0.554688 0 -1 0.445312 -1 1 v 6 c 0 0.554688 0.445312 1 1 1 h 1 c 0.554688 0 1 -0.445312 1 -1 v -6 c 0 -0.554688 -0.445312 -1 -1 -1 z m 0 0", "key": "5xr0cl" }]], "aliases": ["network-cellular-signal-weak-symbolic"], "gtkIconName": "network-cellular-signal-weak-symbolic" };
__iconData$3o.node;
const NetworkCellularSignalWeak = createAdwaitaIcon(__iconData$3o);

const __iconData$3n = { "name": "network-cellular", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1.957031 2.023438 c -0.125 0.003906 -0.25 0.054687 -0.34375 0.152343 l -0.238281 0.25 c -0.933594 0.96875 -1.3984375 2.273438 -1.3984375 3.574219 s 0.4648435 2.605469 1.3984375 3.574219 l 0.238281 0.25 c 0.1875 0.199219 0.503907 0.203125 0.699219 0.015625 c 0.199219 -0.191406 0.207031 -0.503906 0.015625 -0.703125 l -0.234375 -0.25 c -1.46875 -1.53125 -1.46875 -4.238281 0 -5.773438 l 0.234375 -0.25 c 0.191406 -0.199219 0.183594 -0.511719 -0.015625 -0.703125 c -0.097656 -0.09375 -0.226562 -0.140625 -0.355469 -0.136718 z m 12.039063 0 c -0.128906 -0.003907 -0.257813 0.042968 -0.355469 0.136718 c -0.199219 0.191406 -0.203125 0.503906 -0.015625 0.703125 l 0.238281 0.25 c 1.46875 1.535157 1.46875 4.242188 0 5.773438 l -0.238281 0.25 c -0.1875 0.199219 -0.183594 0.511719 0.015625 0.703125 c 0.199219 0.1875 0.511719 0.183594 0.703125 -0.015625 l 0.238281 -0.246094 c 0.929688 -0.972656 1.394531 -2.277344 1.394531 -3.578125 s -0.464843 -2.601562 -1.394531 -3.574219 l -0.238281 -0.25 c -0.09375 -0.097656 -0.21875 -0.148437 -0.347656 -0.152343 z m -10.539063 1.492187 c -0.113281 0.007813 -0.222656 0.046875 -0.3125 0.128906 l -0.273437 0.25 c -0.613282 0.554688 -0.90625 1.34375 -0.902344 2.125 c 0.007812 0.777344 0.3125 1.550781 0.902344 2.085938 l 0.273437 0.25 c 0.203125 0.1875 0.519531 0.171875 0.703125 -0.03125 s 0.171875 -0.519531 -0.03125 -0.703125 l -0.273437 -0.246094 c -0.699219 -0.636719 -0.746094 -2.070312 0 -2.75 l 0.273437 -0.246094 c 0.203125 -0.183594 0.214844 -0.496094 0.03125 -0.703125 c -0.105468 -0.113281 -0.25 -0.167969 -0.390625 -0.160156 z m 8.992188 0 c -0.125 0.007813 -0.25 0.058594 -0.34375 0.160156 c -0.183594 0.207031 -0.167969 0.519531 0.035156 0.703125 l 0.273437 0.246094 c 0.742188 0.679688 0.695313 2.113281 0 2.75 l -0.273437 0.246094 c -0.203125 0.183594 -0.21875 0.5 -0.035156 0.703125 c 0.1875 0.203125 0.5 0.21875 0.707031 0.03125 l 0.269531 -0.25 c 0.589844 -0.535157 0.894531 -1.308594 0.902344 -2.085938 c 0.007813 -0.78125 -0.289063 -1.570312 -0.902344 -2.125 l -0.269531 -0.25 c -0.101562 -0.09375 -0.234375 -0.132812 -0.363281 -0.128906 z m -7.699219 1.484375 c -0.289062 0 -0.550781 0.164062 -0.675781 0.425781 c -0.125 0.257813 -0.089844 0.566407 0.089843 0.792969 l 2.835938 3.542969 v 6.238281 h 2 v -6.238281 l 2.835938 -3.542969 c 0.179687 -0.226562 0.214843 -0.535156 0.089843 -0.792969 c -0.125 -0.261719 -0.386719 -0.425781 -0.675781 -0.425781 z m 1.5625 1.5 h 3.375 l -1.6875 2.113281 z m 0 0", "key": "7ksfn9" }]], "aliases": ["network-cellular-symbolic"], "gtkIconName": "network-cellular-symbolic" };
__iconData$3n.node;
const NetworkCellular = createAdwaitaIcon(__iconData$3n);

const __iconData$3m = { "name": "network-error", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.35", "d": "m 12 1 c -0.265625 0 -0.519531 0.105469 -0.707031 0.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 l 1.292969 1.292969 h -7.585938 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 h 7.585938 l -1.03125 1.03125 c 0.148437 -0.015625 0.296874 -0.027344 0.445312 -0.03125 c 0.6875 0 1.367188 0.144531 1.996094 0.417969 l 1.710937 -1.710938 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 l -3 -3 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m -8 6 c -0.257812 0 -0.511719 0.097656 -0.707031 0.292969 l -3 3 c -0.3906252 0.390625 -0.3906252 1.023437 0 1.414062 l 3 3 c 0.1875 0.1875 0.441406 0.292969 0.707031 0.292969 s 0.519531 -0.105469 0.707031 -0.292969 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 l -1.292969 -1.292969 h 3.585938 c 0.003906 -0.6875 0.144531 -1.371094 0.425781 -2 h -4.011719 l 1.292969 -1.292969 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 c -0.195312 -0.195313 -0.449219 -0.292969 -0.707031 -0.292969 z m 0 0", "key": "1lg6r9" }], ["path", { "fill": "#e01b24", "d": "m 12 8 c -2.210938 0 -4 1.789062 -4 4 s 1.789062 4 4 4 s 4 -1.789062 4 -4 s -1.789062 -4 -4 -4 z m -2 3 h 4 c 0.554688 0 1 0.445312 1 1 s -0.445312 1 -1 1 h -4 c -0.554688 0 -1 -0.445312 -1 -1 s 0.445312 -1 1 -1 z m 0 0", "key": "gcwb2i" }]], "aliases": ["network-error-symbolic"], "gtkIconName": "network-error-symbolic", "monochrome": false };
__iconData$3m.node;
const NetworkError = createAdwaitaIcon(__iconData$3m);

const __iconData$3l = { "name": "network-idle", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 12 1 c -0.265625 0 -0.519531 0.105469 -0.707031 0.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 l 1.292969 1.292969 h -7.585938 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 h 7.585938 l -1.292969 1.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 s 1.023437 0.390625 1.414062 0 l 3 -3 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 l -3 -3 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m -8 6 c -0.257812 0 -0.511719 0.097656 -0.707031 0.292969 l -3 3 c -0.3906252 0.390625 -0.3906252 1.023437 0 1.414062 l 3 3 c 0.1875 0.1875 0.441406 0.292969 0.707031 0.292969 s 0.519531 -0.105469 0.707031 -0.292969 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 l -1.292969 -1.292969 h 7.585938 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 h -7.585938 l 1.292969 -1.292969 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 c -0.195312 -0.195313 -0.449219 -0.292969 -0.707031 -0.292969 z m 0 0", "key": "1c8wim" }]], "aliases": ["network-idle-symbolic"], "gtkIconName": "network-idle-symbolic" };
__iconData$3l.node;
const NetworkIdle = createAdwaitaIcon(__iconData$3l);

const __iconData$3k = { "name": "network-no-route", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8.167969 3.007812 c -0.4375 -0.023437 -0.882813 0.046876 -1.300781 0.222657 c -1.117188 0.460937 -1.851563 1.558593 -1.851563 2.769531 h 2 c 0 -0.40625 0.242187 -0.769531 0.617187 -0.925781 c 0.375 -0.152344 0.800782 -0.070313 1.089844 0.21875 c 0.289063 0.289062 0.371094 0.714843 0.21875 1.089843 c -0.15625 0.375 -0.519531 0.617188 -0.925781 0.617188 c -0.550781 0 -1 0.449219 -1 1 v 2 h 2 v -1.179688 c 0.785156 -0.28125 1.441406 -0.875 1.773437 -1.671874 c 0.460938 -1.117188 0.203126 -2.414063 -0.652343 -3.269532 c -0.535157 -0.535156 -1.242188 -0.835937 -1.96875 -0.871094 z m -0.152344 7.992188 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 s 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m 0 0", "key": "19xwm6" }], ["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 12 1 c -0.265625 0 -0.519531 0.105469 -0.707031 0.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 l 1.292969 1.292969 h -0.941407 c 0.34375 0.582031 0.527344 1.242188 0.53125 1.910156 c -0.003906 0.03125 -0.007812 0.058594 -0.011719 0.089844 h 0.421876 l -0.460938 0.457031 c -0.113281 0.757813 -0.460938 1.464844 -0.992188 2.035157 c 0.042969 0.078124 0.09375 0.148437 0.160157 0.214843 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 l 3 -3 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 l -3 -3 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m -7.574219 3.183594 c -0.257812 0.179687 -0.425781 0.480468 -0.425781 0.816406 c 0 0.105469 0.019531 0.203125 0.050781 0.300781 c 0.066407 -0.390625 0.191407 -0.765625 0.375 -1.117187 z m -0.425781 2.816406 c -0.257812 0 -0.511719 0.097656 -0.707031 0.292969 l -3 3 c -0.3906252 0.390625 -0.3906252 1.023437 0 1.414062 l 3 3 c 0.1875 0.1875 0.441406 0.292969 0.707031 0.292969 s 0.519531 -0.105469 0.707031 -0.292969 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 l -1.292969 -1.292969 h 2.585938 v -2 h -2.585938 l 1.292969 -1.292969 c 0.097657 -0.097656 0.171875 -0.214843 0.21875 -0.339843 c -0.339843 -0.398438 -0.597656 -0.855469 -0.753906 -1.351563 c -0.058594 -0.011719 -0.113281 -0.015625 -0.171875 -0.015625 z m 6 3 v 2 h 1 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m 0 0", "key": "140plg" }]], "aliases": ["network-no-route-symbolic"], "gtkIconName": "network-no-route-symbolic" };
__iconData$3k.node;
const NetworkNoRoute = createAdwaitaIcon(__iconData$3k);

const __iconData$3j = { "name": "network-offline", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 12 1 c -0.265625 0 -0.519531 0.105469 -0.707031 0.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 l 1.292969 1.292969 h -7.585938 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 h 7.585938 l -1.292969 1.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 s 1.023437 0.390625 1.414062 0 l 3 -3 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 l -3 -3 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m -8 6 c -0.257812 0 -0.511719 0.097656 -0.707031 0.292969 l -3 3 c -0.3906252 0.390625 -0.3906252 1.023437 0 1.414062 l 3 3 c 0.1875 0.1875 0.441406 0.292969 0.707031 0.292969 s 0.519531 -0.105469 0.707031 -0.292969 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 l -1.292969 -1.292969 h 5.585938 v -2 h -5.585938 l 1.292969 -1.292969 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 c -0.195312 -0.195313 -0.449219 -0.292969 -0.707031 -0.292969 z m 0 0", "key": "epvz7c" }], ["path", { "fill": "currentColor", "d": "m 15 10 c 0.265625 0 0.519531 0.105469 0.707031 0.292969 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 l -1.292969 1.292969 l 1.292969 1.292969 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 s -1.023437 0.390625 -1.414062 0 l -1.292969 -1.292969 l -1.292969 1.292969 c -0.390625 0.390625 -1.023437 0.390625 -1.414062 0 s -0.390625 -1.023437 0 -1.414062 l 1.292969 -1.292969 l -1.292969 -1.292969 c -0.390625 -0.390625 -0.390625 -1.023437 0 -1.414062 c 0.1875 -0.1875 0.441406 -0.292969 0.707031 -0.292969 s 0.519531 0.105469 0.707031 0.292969 l 1.292969 1.292969 l 1.292969 -1.292969 c 0.1875 -0.1875 0.441406 -0.292969 0.707031 -0.292969 z m 0 0", "key": "u0fou3" }]], "aliases": ["network-offline-symbolic"], "gtkIconName": "network-offline-symbolic" };
__iconData$3j.node;
const NetworkOffline = createAdwaitaIcon(__iconData$3j);

const __iconData$3i = { "name": "network-receive", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 12 1 c 0.265625 0 0.519531 0.105469 0.707031 0.292969 l 3 3 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 l -3 3 c -0.390625 0.390625 -1.023437 0.390625 -1.414062 0 s -0.390625 -1.023437 0 -1.414062 l 1.292969 -1.292969 h -7.585938 c -0.550781 0 -1 -0.449219 -1 -1 s 0.449219 -1 1 -1 h 7.585938 l -1.292969 -1.292969 c -0.390625 -0.390625 -0.390625 -1.023437 0 -1.414062 c 0.1875 -0.1875 0.441406 -0.292969 0.707031 -0.292969 z m 0 0", "key": "y0xnpz" }], ["path", { "fill": "currentColor", "d": "m 4 15 c -0.265625 0 -0.519531 -0.105469 -0.707031 -0.292969 l -3 -3 c -0.3906252 -0.390625 -0.3906252 -1.023437 0 -1.414062 l 3 -3 c 0.390625 -0.390625 1.023437 -0.390625 1.414062 0 s 0.390625 1.023437 0 1.414062 l -1.292969 1.292969 h 7.585938 c 0.550781 0 1 0.449219 1 1 s -0.449219 1 -1 1 h -7.585938 l 1.292969 1.292969 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 c -0.1875 0.1875 -0.441406 0.292969 -0.707031 0.292969 z m 0 0", "key": "1sn804" }]], "aliases": ["network-receive-symbolic"], "gtkIconName": "network-receive-symbolic" };
__iconData$3i.node;
const NetworkReceive = createAdwaitaIcon(__iconData$3i);

const __iconData$3h = { "name": "network-server", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4.007812 0 c -2.222656 0 -4.007812 1.785156 -4.007812 4.003906 v 2.976563 c 0 2.21875 1.785156 4.003906 4.007812 4.003906 h 2.980469 v 1.285156 c -0.289062 0.171875 -0.535156 0.414063 -0.707031 0.703125 h -3.285156 c -0.554688 0 -1 0.449219 -1 1 c 0 0.550782 0.445312 1 1 1 h 3.246094 c 0.351562 0.640625 1.023437 1.035156 1.753906 1.039063 c 0.726562 -0.003907 1.398437 -0.398438 1.75 -1.039063 h 3.261718 c 0.550782 0 1 -0.449218 1 -1 c 0 -0.550781 -0.449218 -1 -1 -1 h -3.292968 c -0.175782 -0.289062 -0.421875 -0.53125 -0.714844 -0.703125 v -1.285156 h 2.996094 c 2.21875 0 4.003906 -1.785156 4.003906 -4.003906 v -2.976563 c 0 -2.21875 -1.785156 -4.003906 -4.003906 -4.003906 z m 0 2 h 7.988282 c 1.125 0 2.003906 0.878906 2.003906 2.003906 v 2.976563 c 0 1.125 -0.878906 2.003906 -2.003906 2.003906 h -7.988282 c -1.128906 0 -2.007812 -0.878906 -2.007812 -2.003906 v -2.976563 c 0 -1.125 0.878906 -2.003906 2.007812 -2.003906 z m 3.988282 11 c 0.554687 0 1.003906 0.449219 1.003906 1.003906 c 0 0.558594 -0.449219 1.007813 -1.003906 1.007813 c -0.558594 0 -1.007813 -0.449219 -1.007813 -1.007813 c 0 -0.554687 0.449219 -1.003906 1.007813 -1.003906 z m 0 0", "key": "77u50p" }], ["path", { "fill": "currentColor", "d": "m 5 4 c 0.550781 0 1 0.449219 1 1 s -0.449219 1 -1 1 s -1 -0.449219 -1 -1 s 0.449219 -1 1 -1 z m 0 0", "key": "flef6k" }], ["path", { "fill": "currentColor", "d": "m 8 4 c 0.550781 0 1 0.449219 1 1 s -0.449219 1 -1 1 s -1 -0.449219 -1 -1 s 0.449219 -1 1 -1 z m 0 0", "key": "1bn1qk" }]], "aliases": ["network-server-symbolic"], "gtkIconName": "network-server-symbolic" };
__iconData$3h.node;
const NetworkServer = createAdwaitaIcon(__iconData$3h);

const __iconData$3g = { "name": "network-transmit-receive", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 12 1 c -0.265625 0 -0.519531 0.105469 -0.707031 0.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 l 1.292969 1.292969 h -7.585938 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 h 7.585938 l -1.292969 1.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 s 1.023437 0.390625 1.414062 0 l 3 -3 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 l -3 -3 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m -8 6 c -0.257812 0 -0.511719 0.097656 -0.707031 0.292969 l -3 3 c -0.3906252 0.390625 -0.3906252 1.023437 0 1.414062 l 3 3 c 0.1875 0.1875 0.441406 0.292969 0.707031 0.292969 s 0.519531 -0.105469 0.707031 -0.292969 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 l -1.292969 -1.292969 h 7.585938 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 h -7.585938 l 1.292969 -1.292969 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 c -0.195312 -0.195313 -0.449219 -0.292969 -0.707031 -0.292969 z m 0 0", "key": "1xwaqv" }]], "aliases": ["network-transmit-receive-symbolic"], "gtkIconName": "network-transmit-receive-symbolic" };
__iconData$3g.node;
const NetworkTransmitReceive = createAdwaitaIcon(__iconData$3g);

const __iconData$3f = { "name": "network-transmit", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 12 1 c 0.265625 0 0.519531 0.105469 0.707031 0.292969 l 3 3 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 l -3 3 c -0.390625 0.390625 -1.023437 0.390625 -1.414062 0 s -0.390625 -1.023437 0 -1.414062 l 1.292969 -1.292969 h -7.585938 c -0.550781 0 -1 -0.449219 -1 -1 s 0.449219 -1 1 -1 h 7.585938 l -1.292969 -1.292969 c -0.390625 -0.390625 -0.390625 -1.023437 0 -1.414062 c 0.1875 -0.1875 0.441406 -0.292969 0.707031 -0.292969 z m 0 0", "key": "5cd7mg" }], ["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 4 15 c -0.265625 0 -0.519531 -0.105469 -0.707031 -0.292969 l -3 -3 c -0.3906252 -0.390625 -0.3906252 -1.023437 0 -1.414062 l 3 -3 c 0.390625 -0.390625 1.023437 -0.390625 1.414062 0 s 0.390625 1.023437 0 1.414062 l -1.292969 1.292969 h 7.585938 c 0.550781 0 1 0.449219 1 1 s -0.449219 1 -1 1 h -7.585938 l 1.292969 1.292969 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 c -0.1875 0.1875 -0.441406 0.292969 -0.707031 0.292969 z m 0 0", "key": "1lvjv1" }]], "aliases": ["network-transmit-symbolic"], "gtkIconName": "network-transmit-symbolic" };
__iconData$3f.node;
const NetworkTransmit = createAdwaitaIcon(__iconData$3f);

const __iconData$3e = { "name": "network-vpn-acquiring", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 8 -0.0585938 l -6 1.1992188 v 3.859375 h 2 v -2.21875 l 3.996094 -0.800781 l 4.003906 0.800781 v 2.21875 h 2 v -3.859375 z m -2.800781 11.0585938 l 2.03125 1.136719 c -0.078125 0.035156 -0.15625 0.078125 -0.234375 0.125 c -0.292969 0.167969 -0.535156 0.410156 -0.710938 0.699219 h -3.285156 c -0.550781 0 -1 0.449218 -1 1 c 0 0.550781 0.449219 1 1 1 h 3.25 c 0.351562 0.640624 1.019531 1.035156 1.75 1.039062 c 0.730469 -0.003906 1.402344 -0.398438 1.75 -1.039062 h 3.261719 c 0.550781 0 1 -0.449219 1 -1 c 0 -0.550782 -0.449219 -1 -1 -1 h -3.292969 c -0.175781 -0.289063 -0.417969 -0.53125 -0.710938 -0.699219 c -0.082031 -0.050781 -0.160156 -0.089844 -0.238281 -0.125 l 2.027344 -1.136719 z m 2.800781 1.988281 c 0.554688 0 1.007812 0.449219 1.007812 1.003907 c 0 0.558593 -0.453124 1.007812 -1.007812 1.007812 s -1.007812 -0.449219 -1.003906 -1.007812 c -0.003906 -0.554688 0.449218 -1.003907 1.003906 -1.003907 z m 0 0", "key": "1q4tw5" }], ["path", { "fill": "currentColor", "d": "m 3 6 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 5 0 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 5 0 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 0 0", "key": "14xcmx" }]], "aliases": ["network-vpn-acquiring-symbolic"], "gtkIconName": "network-vpn-acquiring-symbolic" };
__iconData$3e.node;
const NetworkVpnAcquiring = createAdwaitaIcon(__iconData$3e);

const __iconData$3d = { "name": "network-vpn-disabled", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 -0.0585938 l -5.828125 1.1640628 l -0.640625 -0.636719 l -1.0625 1.0625 l 14 14 l 1.0625 -1.0625 l -3.964844 -3.964844 c 1.519532 -1.144531 2.433594 -2.945312 2.433594 -4.878906 v -4.484375 z m -0.003906 2.0390628 l 4 0.800781 v 2.84375 c 0 1.398438 -0.707032 2.6875 -1.867188 3.441406 l -6.132812 -6.128906 v -0.15625 z m -6 3.144531 v 0.5 c 0 2.214844 1.199218 4.253906 3.132812 5.335938 l 2.101563 1.175781 c -0.078125 0.035156 -0.15625 0.078125 -0.234375 0.125 c -0.292969 0.167969 -0.535156 0.410156 -0.710938 0.699219 h -3.285156 c -0.550781 0 -1 0.449218 -1 1 c 0 0.550781 0.449219 1 1 1 h 3.246094 c 0.351562 0.640624 1.023437 1.035156 1.753906 1.039062 c 0.730469 -0.003906 1.398438 -0.398438 1.75 -1.039062 h 2.085938 l -2 -2 h -0.117188 c -0.175781 -0.289063 -0.417969 -0.53125 -0.714844 -0.699219 c -0.078125 -0.050781 -0.15625 -0.089844 -0.238281 -0.125 l 0.15625 -0.085938 l -2.851563 -2.851562 c -0.648437 -0.375 -1.175781 -0.90625 -1.535156 -1.535157 z m 6.003906 7.863281 c 0.554688 0 1.007812 0.449219 1.003906 1.003907 c 0.003906 0.558593 -0.449218 1.007812 -1.003906 1.007812 s -1.007812 -0.449219 -1.007812 -1.007812 c 0 -0.554688 0.453124 -1.003907 1.007812 -1.003907 z m 0 0", "key": "1vdva7" }]], "aliases": ["network-vpn-disabled-symbolic"], "gtkIconName": "network-vpn-disabled-symbolic" };
__iconData$3d.node;
const NetworkVpnDisabled = createAdwaitaIcon(__iconData$3d);

const __iconData$3c = { "name": "network-vpn-disconnected", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1.996094 3.960938 v 4.664062 c 0 0.359375 0.199218 0.695312 0.515625 0.871094 l 2.378906 1.332031 c 1.929687 1.078125 4.28125 1.078125 6.214844 0 l 2.378906 -1.332031 c 0.316406 -0.175782 0.511719 -0.511719 0.511719 -0.871094 v -3.664062 c 0 -2.222657 -1.5625 -4.132813 -3.742188 -4.570313 l -2.058594 -0.4101562 c -0.351562 -0.0703126 -0.714843 0.0507812 -0.949218 0.3203122 c -0.238282 0.269531 -0.3125 0.640625 -0.199219 0.980469 c 0.117187 0.339844 0.402344 0.589844 0.753906 0.660156 l 2.058594 0.410156 c 1.25 0.25 2.136719 1.335938 2.136719 2.609376 v 3.664062 l 0.515625 -0.875 l -2.382813 1.332031 c -1.324218 0.742188 -2.9375 0.742188 -4.261718 0 l -2.382813 -1.332031 l 0.511719 0.875 v -4.664062 c 0 -0.550782 -0.445313 -1 -1 -1 c -0.550782 0 -1 0.449218 -1 1 z m 0 0", "key": "yeju1l" }], ["path", { "fill": "currentColor", "d": "m 8 11.960938 c -0.335938 0 -0.671875 0.097656 -1.003906 0.300781 c -0.292969 0.167969 -0.535156 0.410156 -0.710938 0.699219 h -0.785156 l -0.5 2 h 1.25 c 0.351562 0.640624 1.019531 1.035156 1.75 1.039062 c 0.730469 -0.003906 1.398438 -0.398438 1.75 -1.039062 h 3.261719 c 0.550781 0 1 -0.449219 1 -1 c 0 -0.550782 -0.449219 -1 -1 -1 h -3.292969 c -0.175781 -0.289063 -0.417969 -0.53125 -0.710938 -0.699219 c -0.339843 -0.199219 -0.675781 -0.300781 -1.007812 -0.300781 z m -5 1 c -0.550781 0 -1 0.449218 -1 1 c 0 0.550781 0.449219 1 1 1 h 0.5 l 0.5 -2 z m 5 0.027343 c 0.554688 0 1.007812 0.449219 1.007812 1.003907 c 0 0.558593 -0.453124 1.007812 -1.007812 1.007812 s -1.007812 -0.449219 -1.007812 -1.007812 c 0 -0.554688 0.453124 -1.003907 1.007812 -1.003907 z m 0 0", "key": "1nqx2z" }]], "aliases": ["network-vpn-disconnected-symbolic"], "gtkIconName": "network-vpn-disconnected-symbolic" };
__iconData$3c.node;
const NetworkVpnDisconnected = createAdwaitaIcon(__iconData$3c);

const __iconData$3b = { "name": "network-vpn-no-route", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 4.796875 0.582031 l -2.796875 0.558594 v 4.484375 c 0 2.214844 1.195312 4.253906 3.128906 5.335938 l 2.101563 1.175781 c -0.078125 0.035156 -0.15625 0.078125 -0.234375 0.125 c -0.292969 0.167969 -0.535156 0.410156 -0.710938 0.699219 h -3.285156 c -0.550781 0 -1 0.449218 -1 1 c 0 0.550781 0.449219 1 1 1 h 3.25 c 0.351562 0.640624 1.019531 1.035156 1.75 1.039062 c 0.730469 -0.003906 1.402344 -0.398438 1.75 -1.039062 h 3.261719 c 0.550781 0 1 -0.449219 1 -1 c 0 -0.550782 -0.449219 -1 -1 -1 h -3.292969 c -0.175781 -0.289063 -0.417969 -0.53125 -0.710938 -0.699219 c -0.082031 -0.050781 -0.160156 -0.089844 -0.238281 -0.125 l 2.097657 -1.175781 c 1.933593 -1.082032 3.132812 -3.121094 3.132812 -5.335938 v -4.484375 l -2.792969 -0.558594 c 0.605469 0.804688 0.882813 1.808594 0.792969 2.796875 v 2.246094 c 0 1.445312 -0.757812 2.777344 -1.988281 3.519531 c -0.082031 0.996094 -1.003907 1.871094 -2.011719 1.871094 s -1.925781 -0.871094 -2.011719 -1.867187 c -1.234375 -0.742188 -1.988281 -2.074219 -1.988281 -3.523438 v -2.449219 c -0.011719 -0.058593 -0.019531 -0.117187 -0.015625 -0.175781 c 0 -0.890625 0.296875 -1.734375 0.8125 -2.417969 z m 3.203125 12.40625 c 0.554688 0 1.007812 0.449219 1.007812 1.003907 c 0 0.558593 -0.453124 1.007812 -1.007812 1.007812 s -1.007812 -0.449219 -1.003906 -1.007812 c -0.003906 -0.554688 0.449218 -1.003907 1.003906 -1.003907 z m 0 0", "key": "t13aae" }], ["path", { "fill": "currentColor", "d": "m 8.152344 0.0078125 c -0.4375 -0.0234375 -0.882813 0.046875 -1.300782 0.2226565 c -1.117187 0.460937 -1.851562 1.558593 -1.851562 2.769531 h 2 c 0 -0.40625 0.242188 -0.769531 0.617188 -0.925781 c 0.375 -0.152344 0.800781 -0.070313 1.089843 0.21875 c 0.289063 0.289062 0.371094 0.714843 0.21875 1.089843 c -0.15625 0.375 -0.519531 0.617188 -0.925781 0.617188 c -0.550781 0 -1 0.449219 -1 1 v 2 h 2 v -1.179688 c 0.785156 -0.28125 1.441406 -0.875 1.769531 -1.671874 c 0.464844 -1.117188 0.207031 -2.414063 -0.648437 -3.269532 c -0.535156 -0.535156 -1.242188 -0.8359372 -1.96875 -0.8710935 z m -0.152344 7.9921875 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 s 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m 0 0", "key": "stk75f" }]], "aliases": ["network-vpn-no-route-symbolic"], "gtkIconName": "network-vpn-no-route-symbolic" };
__iconData$3b.node;
const NetworkVpnNoRoute = createAdwaitaIcon(__iconData$3b);

const __iconData$3a = { "name": "network-vpn", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1.996094 1.140625 v 4.484375 c 0 2.214844 1.199218 4.253906 3.132812 5.335938 l 2.867188 1.605468 l 2.871094 -1.605468 c 1.933593 -1.082032 3.128906 -3.121094 3.128906 -5.335938 v -4.484375 l -6 -1.1992188 z m 10.804687 1.800781 l -0.804687 -0.980468 v 3.664062 c 0 1.492188 -0.800782 2.863281 -2.105469 3.589844 l -2.382813 1.332031 h 0.976563 l -2.378906 -1.332031 c -1.304688 -0.726563 -2.109375 -2.097656 -2.109375 -3.589844 v -3.664062 l -0.800782 0.980468 l 5 -1 h -0.394531 z m 0 0", "key": "pqji2i" }], ["path", { "fill": "currentColor", "d": "m 6.996094 12.257812 c -0.292969 0.171876 -0.535156 0.414063 -0.710938 0.703126 h -3.285156 c -0.550781 0 -1 0.449218 -1 1 c 0 0.550781 0.449219 1 1 1 h 3.25 c 0.351562 0.640624 1.019531 1.035156 1.75 1.039062 c 0.730469 -0.003906 1.402344 -0.398438 1.75 -1.039062 h 3.261719 c 0.550781 0 1 -0.449219 1 -1 c 0 -0.550782 -0.449219 -1 -1 -1 h -3.292969 c -0.175781 -0.289063 -0.417969 -0.53125 -0.710938 -0.703126 c -0.675781 -0.398437 -1.347656 -0.398437 -2.011718 0 z m 1.003906 0.730469 c 0.554688 0 1.007812 0.449219 1.007812 1.003907 c 0 0.558593 -0.453124 1.007812 -1.007812 1.007812 s -1.007812 -0.449219 -1.003906 -1.007812 c -0.003906 -0.554688 0.449218 -1.003907 1.003906 -1.003907 z m 0 0", "key": "1nk1lh" }]], "aliases": ["network-vpn-symbolic"], "gtkIconName": "network-vpn-symbolic" };
__iconData$3a.node;
const NetworkVpn = createAdwaitaIcon(__iconData$3a);

const __iconData$39 = { "name": "network-wired-acquiring", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 6 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 5 0 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 5 0 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 0 0", "key": "14xcmx" }], ["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 6 0 c -0.554688 0 -1 0.445312 -1 1 v 3 c 0 0.554688 0.445312 1 1 1 h 4 c 0.554688 0 1 -0.445312 1 -1 v -3 c 0 -0.554688 -0.445312 -1 -1 -1 z m -4 10.824219 v 0.175781 h -1 c -0.554688 0 -1 0.445312 -1 1 v 3 c 0 0.554688 0.445312 1 1 1 h 4 c 0.554688 0 1 -0.445312 1 -1 v -3 c 0 -0.554688 -0.445312 -1 -1 -1 h -2 c -0.351562 0 -0.6875 -0.0625 -1 -0.175781 z m 12 0 c -0.3125 0.113281 -0.648438 0.175781 -1 0.175781 h -2 c -0.554688 0 -1 0.445312 -1 1 v 3 c 0 0.554688 0.445312 1 1 1 h 4 c 0.554688 0 1 -0.445312 1 -1 v -3 c 0 -0.554688 -0.445312 -1 -1 -1 h -1 z m 0 0", "key": "1mcfy5" }]], "aliases": ["network-wired-acquiring-symbolic"], "gtkIconName": "network-wired-acquiring-symbolic" };
__iconData$39.node;
const NetworkWiredAcquiring = createAdwaitaIcon(__iconData$39);

const __iconData$38 = { "name": "network-wired-disconnected", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 15 10 c 0.265625 0 0.519531 0.105469 0.707031 0.292969 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 l -1.292969 1.292969 l 1.292969 1.292969 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 s -1.023437 0.390625 -1.414062 0 l -1.292969 -1.292969 l -1.292969 1.292969 c -0.390625 0.390625 -1.023437 0.390625 -1.414062 0 s -0.390625 -1.023437 0 -1.414062 l 1.292969 -1.292969 l -1.292969 -1.292969 c -0.390625 -0.390625 -0.390625 -1.023437 0 -1.414062 c 0.1875 -0.1875 0.441406 -0.292969 0.707031 -0.292969 s 0.519531 0.105469 0.707031 0.292969 l 1.292969 1.292969 l 1.292969 -1.292969 c 0.1875 -0.1875 0.441406 -0.292969 0.707031 -0.292969 z m 0 0", "key": "u0fou3" }], ["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 6 0 c -0.554688 0 -1 0.445312 -1 1 v 3 c 0 0.554688 0.445312 1 1 1 h 1 v 2 h -7 v 2 h 2 v 2 h -1 c -0.554688 0 -1 0.445312 -1 1 v 3 c 0 0.554688 0.445312 1 1 1 h 4 c 0.554688 0 1 -0.445312 1 -1 v -3 c 0 -0.554688 -0.445312 -1 -1 -1 h -1 v -2 h 12 v -2 h -7 v -2 h 1 c 0.554688 0 1 -0.445312 1 -1 v -3 c 0 -0.554688 -0.445312 -1 -1 -1 z m 0 0", "key": "qii9lw" }]], "aliases": ["network-wired-disconnected-symbolic"], "gtkIconName": "network-wired-disconnected-symbolic" };
__iconData$38.node;
const NetworkWiredDisconnected = createAdwaitaIcon(__iconData$38);

const __iconData$37 = { "name": "network-wired-no-route", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8.136719 4.007812 c -0.4375 -0.023437 -0.882813 0.046876 -1.300781 0.222657 c -1.117188 0.460937 -1.851563 1.558593 -1.851563 2.769531 h 2 c 0 -0.40625 0.242187 -0.769531 0.617187 -0.925781 c 0.375 -0.152344 0.800782 -0.070313 1.089844 0.21875 c 0.289063 0.289062 0.371094 0.714843 0.21875 1.089843 c -0.15625 0.375 -0.519531 0.617188 -0.925781 0.617188 c -0.550781 0 -1 0.449219 -1 1 v 2 h 2 v -1.179688 c 0.785156 -0.28125 1.441406 -0.875 1.773437 -1.671874 c 0.460938 -1.117188 0.203126 -2.414063 -0.652343 -3.269532 c -0.535157 -0.535156 -1.242188 -0.835937 -1.96875 -0.871094 z m -0.152344 7.992188 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 s 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m 0 0", "key": "18rbmt" }], ["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 6 0 c -0.554688 0 -1 0.445312 -1 1 v 3 c 0 0.105469 0.019531 0.203125 0.046875 0.300781 c 0.386719 -0.421875 0.863281 -0.761719 1.410156 -0.988281 c 0.558594 -0.230469 1.152344 -0.324219 1.730469 -0.292969 c 0.964844 0.046875 1.90625 0.449219 2.617188 1.160157 c 0.046874 0.046874 0.089843 0.097656 0.136718 0.148437 c 0.035156 -0.101563 0.058594 -0.210937 0.058594 -0.328125 v -3 c 0 -0.554688 -0.445312 -1 -1 -1 z m 1.988281 6.984375 s 0 0.003906 -0.007812 0.007813 c -0.015625 0.003906 -0.007813 -0.011719 -0.007813 0.007812 c -0.007812 0.007812 -0.015625 0.015625 -0.023437 0.027344 c 0.011719 0 0.023437 -0.015625 0.035156 -0.015625 c 0.015625 0 0.003906 0.007812 0.007813 -0.007813 c 0.007812 -0.015625 0.011718 0 0 -0.011718 c -0.007813 -0.003907 -0.003907 -0.007813 -0.003907 -0.007813 z m -7.988281 0.015625 v 2 h 2 v 2 h -1 c -0.554688 0 -1 0.445312 -1 1 v 3 c 0 0.554688 0.445312 1 1 1 h 4 c 0.554688 0 1 -0.445312 1 -1 v -1.886719 c -0.003906 -0.035156 -0.007812 -0.074219 -0.007812 -0.113281 c 0 -0.03125 0.003906 -0.066406 0.007812 -0.097656 v -0.902344 c 0 -0.554688 -0.445312 -1 -1 -1 h -1 v -2 h 1.992188 c 0 -0.378906 0.234374 -0.695312 0.445312 -1.011719 h -1.453125 c -0.261719 0.003907 -0.515625 -0.101562 -0.699219 -0.289062 c -0.1875 -0.183594 -0.292968 -0.4375 -0.292968 -0.699219 z m 11.96875 0 c 0 0.515625 -0.09375 1.035156 -0.300781 1.527344 c -0.066407 0.167968 -0.148438 0.324218 -0.242188 0.472656 h 0.574219 v 2 h -1 c -0.554688 0 -1 0.445312 -1 1 v 3 c 0 0.554688 0.445312 1 1 1 h 4 c 0.554688 0 1 -0.445312 1 -1 v -3 c 0 -0.554688 -0.445312 -1 -1 -1 h -1 v -2 h 2 v -2 z m 0 0", "key": "uxn0qo" }]], "aliases": ["network-wired-no-route-symbolic"], "gtkIconName": "network-wired-no-route-symbolic" };
__iconData$37.node;
const NetworkWiredNoRoute = createAdwaitaIcon(__iconData$37);

const __iconData$36 = { "name": "network-wired", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 6 0.015625 c -0.554688 0 -1 0.445313 -1 1 v 3 c 0 0.554687 0.445312 1 1 1 h 1 v 2 h -7 v 2 h 2 v 2 h -1 c -0.554688 0 -1 0.445313 -1 1 v 3 c 0 0.554687 0.445312 1 1 1 h 4 c 0.554688 0 1 -0.445313 1 -1 v -3 c 0 -0.554687 -0.445312 -1 -1 -1 h -1 v -2 h 8 v 2 h -1 c -0.554688 0 -1 0.445313 -1 1 v 3 c 0 0.554687 0.445312 1 1 1 h 4 c 0.554688 0 1 -0.445313 1 -1 v -3 c 0 -0.554687 -0.445312 -1 -1 -1 h -1 v -2 h 2 v -2 h -7 v -2 h 1 c 0.554688 0 1 -0.445313 1 -1 v -3 c 0 -0.554687 -0.445312 -1 -1 -1 z m 0 0", "key": "f1hgwt" }]], "aliases": ["network-wired-symbolic"], "gtkIconName": "network-wired-symbolic" };
__iconData$36.node;
const NetworkWired = createAdwaitaIcon(__iconData$36);

const __iconData$35 = { "name": "network-wireless-acquiring", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 8 1.992188 c -2.617188 0 -5.238281 0.933593 -7.195312 2.808593 l -0.496094 0.480469 c -0.3984378 0.378906 -0.410156 1.011719 -0.03125 1.410156 c 0.003906 0.007813 0.011718 0.011719 0.019531 0.015625 c 0.480469 -1.011719 1.503906 -1.707031 2.703125 -1.707031 h 0.9375 c 2.480469 -1.292969 5.644531 -1.292969 8.125 0 h 0.9375 c 1.199219 0 2.222656 0.695312 2.707031 1.707031 c 0.003907 -0.007812 0.011719 -0.011719 0.015625 -0.015625 c 0.378906 -0.398437 0.367188 -1.03125 -0.03125 -1.410156 l -0.496094 -0.480469 c -1.957031 -1.875 -4.578124 -2.808593 -7.195312 -2.808593 z m -1.730469 9.007812 c -0.441406 0.765625 -0.339843 1.757812 0.316407 2.414062 c 0.78125 0.78125 2.046874 0.78125 2.828124 0 c 0.65625 -0.65625 0.757813 -1.648437 0.316407 -2.414062 z m 0 0", "key": "1q6atq" }], ["path", { "fill": "currentColor", "d": "m 3 6 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 5 0 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 5 0 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 0 0", "key": "14xcmx" }]], "aliases": ["network-wireless-acquiring-symbolic"], "gtkIconName": "network-wireless-acquiring-symbolic" };
__iconData$35.node;
const NetworkWirelessAcquiring = createAdwaitaIcon(__iconData$35);

const __iconData$34 = { "name": "network-wireless-connected", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 8 1.992188 c -2.617188 0 -5.238281 0.933593 -7.195312 2.808593 l -0.496094 0.480469 c -0.3984378 0.378906 -0.410156 1.011719 -0.03125 1.410156 c 0.003906 0.003906 0.011718 0.011719 0.015625 0.015625 l 2.863281 2.863281 c 0.046875 0.074219 0.101562 0.144532 0.171875 0.207032 c 0.40625 0.371094 1.039063 0.339844 1.414063 -0.070313 l 0.496093 -0.546875 c 1.277344 -1.402344 4.160157 -1.496094 5.523438 0 l 0.5 0.546875 c 0.371093 0.410157 1.003906 0.441407 1.414062 0.070313 c 0.066407 -0.0625 0.117188 -0.128906 0.164063 -0.203125 l 2.867187 -2.867188 c 0.003907 -0.003906 0.011719 -0.011719 0.015625 -0.015625 c 0.378906 -0.398437 0.367188 -1.03125 -0.03125 -1.410156 l -0.496094 -0.480469 c -1.957031 -1.875 -4.578124 -2.808593 -7.195312 -2.808593 z m 0 2.039062 c 2.023438 0 4.042969 0.664062 5.5625 1.992188 l -1.550781 1.550781 c -1.105469 -1.070313 -2.582031 -1.585938 -4.042969 -1.574219 s -2.914062 0.546875 -3.976562 1.578125 l -1.554688 -1.554687 c 1.519531 -1.328126 3.539062 -1.992188 5.5625 -1.992188 z m 0 5.96875 c -0.511719 0 -1.023438 0.195312 -1.414062 0.585938 c -0.78125 0.78125 -0.78125 2.046874 0 2.828124 s 2.046874 0.78125 2.828124 0 s 0.78125 -2.046874 0 -2.828124 c -0.390624 -0.390626 -0.902343 -0.585938 -1.414062 -0.585938 z m 0 0", "key": "xukx4x" }]], "aliases": ["network-wireless-connected-symbolic"], "gtkIconName": "network-wireless-connected-symbolic" };
__iconData$34.node;
const NetworkWirelessConnected = createAdwaitaIcon(__iconData$34);

const __iconData$33 = { "name": "network-wireless-disabled", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1.53125 0.46875 l -1.0625 1.0625 l 14 14 l 1.0625 -1.0625 l -6.191406 -6.191406 c 0.546875 0.175781 1.042968 0.46875 1.421875 0.886718 l 0.5 0.542969 c 0.175781 0.199219 0.425781 0.316407 0.691406 0.328125 c 0.265625 0.015625 0.523437 -0.078125 0.722656 -0.257812 c 0.195313 -0.179688 0.3125 -0.429688 0.324219 -0.695313 c 0.011719 -0.261719 -0.082031 -0.523437 -0.261719 -0.71875 l -0.5 -0.546875 c -1.121093 -1.234375 -2.703125 -1.828125 -4.269531 -1.816406 c -0.28125 0.003906 -0.5625 0.027344 -0.839844 0.066406 l -1.671875 -1.671875 c 2.859375 -0.839843 6.183594 -0.222656 8.351563 1.851563 l 0.5 0.476562 c 0.398437 0.378906 1.03125 0.367188 1.414062 -0.03125 c 0.378906 -0.398437 0.367188 -1.03125 -0.03125 -1.410156 l -0.496094 -0.480469 c -1.957031 -1.875 -4.578124 -2.808593 -7.195312 -2.808593 c -1.410156 0 -2.820312 0.273437 -4.125 0.820312 z m -0.230469 3.894531 c -0.167969 0.140625 -0.335937 0.28125 -0.496093 0.4375 l -0.496094 0.480469 c -0.3984378 0.378906 -0.410156 1.011719 -0.03125 1.410156 c 0.382812 0.398438 1.015625 0.410156 1.414062 0.03125 l 0.5 -0.476562 c 0.171875 -0.164063 0.347656 -0.316406 0.535156 -0.460938 z m 2.96875 2.964844 c -0.179687 0.148437 -0.347656 0.3125 -0.507812 0.484375 l -0.5 0.550781 c -0.179688 0.195313 -0.277344 0.453125 -0.261719 0.71875 c 0.011719 0.265625 0.128906 0.515625 0.324219 0.695313 c 0.199219 0.179687 0.457031 0.273437 0.722656 0.257812 c 0.265625 -0.011718 0.515625 -0.128906 0.691406 -0.328125 l 0.5 -0.546875 c 0.136719 -0.148437 0.292969 -0.28125 0.460938 -0.402344 z m 2.867188 2.871094 c -0.199219 0.09375 -0.386719 0.222656 -0.550781 0.386719 c -0.78125 0.78125 -0.78125 2.046874 0 2.828124 s 2.046874 0.78125 2.828124 0 c 0.164063 -0.164062 0.292969 -0.351562 0.386719 -0.550781 z m 0 0", "key": "p271hb" }]], "aliases": ["network-wireless-disabled-symbolic"], "gtkIconName": "network-wireless-disabled-symbolic" };
__iconData$33.node;
const NetworkWirelessDisabled = createAdwaitaIcon(__iconData$33);

const __iconData$32 = { "name": "network-wireless-encrypted", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 1 c -2.199219 0 -4 1.800781 -4 4 v 2 c -1.109375 0 -2 0.890625 -2 2 v 5 c 0 0.554688 0.445312 1 1 1 h 10 c 0.554688 0 1 -0.445312 1 -1 v -5 c 0 -1.109375 -0.890625 -2 -2 -2 v -2 c 0 -2.199219 -1.800781 -4 -4 -4 z m 0 2 c 1.125 0 2 0.875 2 2 v 2 h -4 v -2 c 0 -1.125 0.875 -2 2 -2 z m 0 0", "key": "vflcq1" }]], "aliases": ["network-wireless-encrypted-symbolic"], "gtkIconName": "network-wireless-encrypted-symbolic" };
__iconData$32.node;
const NetworkWirelessEncrypted = createAdwaitaIcon(__iconData$32);

const __iconData$31 = { "name": "network-wireless-hardware-disabled", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 8 1.992188 c -2.617188 0 -5.238281 0.933593 -7.195312 2.808593 l -0.207032 0.199219 h 3.34375 c 2.480469 -1.292969 5.640625 -1.292969 8.121094 0 h 3.339844 l -0.207032 -0.199219 c -1.957031 -1.875 -4.578124 -2.808593 -7.195312 -2.808593 z m -1.730469 9.007812 c -0.441406 0.765625 -0.339843 1.757812 0.316407 2.414062 c 0.78125 0.78125 2.046874 0.78125 2.828124 0 c 0.65625 -0.65625 0.757813 -1.648437 0.316407 -2.414062 z m 0 0", "key": "112xou" }], ["path", { "fill": "currentColor", "d": "m 0 6 h 16 v 4 h -16 z m 0 0", "key": "1286a1" }]], "aliases": ["network-wireless-hardware-disabled-symbolic"], "gtkIconName": "network-wireless-hardware-disabled-symbolic" };
__iconData$31.node;
const NetworkWirelessHardwareDisabled = createAdwaitaIcon(__iconData$31);

const __iconData$30 = { "name": "network-wireless-hotspot", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 1 c -1.644531 0 -3 1.355469 -3 3 v 4 c 0 1.644531 1.355469 3 3 3 h 1 v 1 c 0 1.644531 1.355469 3 3 3 h 6 c 1.644531 0 3 -1.355469 3 -3 v -4 c 0 -1.644531 -1.355469 -3 -3 -3 h -1 v -1 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 2 h 6 c 0.570312 0 1 0.429688 1 1 v 4 c 0 0.570312 -0.429688 1 -1 1 h -1 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 h 1 c 1.644531 0 3 -1.355469 3 -3 v -1 h 1 c 0.570312 0 1 0.429688 1 1 v 4 c 0 0.570312 -0.429688 1 -1 1 h -6 c -0.570312 0 -1 -0.429688 -1 -1 v -4 c 0 -0.570312 0.429688 -1 1 -1 h 1 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 h -1 c -1.644531 0 -3 1.355469 -3 3 v 1 h -1 c -0.570312 0 -1 -0.429688 -1 -1 v -4 c 0 -0.570312 0.429688 -1 1 -1 z m 0 0", "key": "1aooir" }]], "aliases": ["network-wireless-hotspot-symbolic"], "gtkIconName": "network-wireless-hotspot-symbolic" };
__iconData$30.node;
const NetworkWirelessHotspot = createAdwaitaIcon(__iconData$30);

const __iconData$2$ = { "name": "network-wireless-no-route", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 8 1.992188 c -2.617188 0 -5.238281 0.933593 -7.195312 2.808593 l -0.496094 0.480469 c -0.3984378 0.378906 -0.410156 1.011719 -0.03125 1.410156 c 0.382812 0.398438 1.015625 0.410156 1.414062 0.03125 l 0.5 -0.476562 c 0.582032 -0.558594 1.25 -1.011719 1.96875 -1.359375 c 0.332032 -1.148438 1.171875 -2.109375 2.308594 -2.582031 c 0.5625 -0.230469 1.152344 -0.328126 1.734375 -0.296876 c 0.96875 0.050782 1.910156 0.449219 2.625 1.164063 c 0.488281 0.488281 0.824219 1.078125 1.011719 1.714844 c 0.71875 0.347656 1.386718 0.800781 1.96875 1.359375 l 0.5 0.476562 c 0.398437 0.378906 1.03125 0.367188 1.414062 -0.03125 c 0.378906 -0.398437 0.367188 -1.03125 -0.03125 -1.410156 l -0.496094 -0.480469 c -1.957031 -1.875 -4.578124 -2.808593 -7.195312 -2.808593 z m -3.292969 5.007812 c -0.34375 0.230469 -0.660156 0.503906 -0.945312 0.8125 l -0.5 0.550781 c -0.375 0.40625 -0.347657 1.042969 0.0625 1.414063 c 0.410156 0.371094 1.042969 0.339844 1.414062 -0.070313 l 0.5 -0.546875 c 0.214844 -0.234375 0.472657 -0.429687 0.761719 -0.589844 v -0.570312 c 0 -0.386719 0.222656 -0.691406 0.417969 -1 z m 7.054688 0.355469 c -0.019531 0.058593 -0.042969 0.117187 -0.066407 0.175781 c -0.246093 0.59375 -0.648437 1.0625 -1.128906 1.4375 c 0.066406 0.0625 0.132813 0.125 0.195313 0.195312 l 0.5 0.542969 c 0.371093 0.410157 1.003906 0.441407 1.414062 0.070313 c 0.40625 -0.371094 0.4375 -1.007813 0.0625 -1.414063 l -0.5 -0.546875 c -0.152343 -0.167968 -0.308593 -0.320312 -0.476562 -0.460937 z m 0 0", "key": "1uteuy" }], ["path", { "fill": "currentColor", "d": "m 8.152344 3.007812 c -0.4375 -0.023437 -0.882813 0.046876 -1.300782 0.222657 c -1.117187 0.460937 -1.851562 1.558593 -1.851562 2.769531 h 2 c 0 -0.40625 0.242188 -0.769531 0.617188 -0.925781 c 0.375 -0.152344 0.800781 -0.070313 1.089843 0.21875 c 0.289063 0.289062 0.371094 0.714843 0.21875 1.089843 c -0.15625 0.375 -0.519531 0.617188 -0.925781 0.617188 c -0.550781 0 -1 0.449219 -1 1 v 2 h 2 v -1.179688 c 0.785156 -0.28125 1.441406 -0.875 1.769531 -1.671874 c 0.464844 -1.117188 0.207031 -2.414063 -0.648437 -3.269532 c -0.535156 -0.535156 -1.242188 -0.835937 -1.96875 -0.871094 z m -0.152344 7.992188 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 s 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m 0 0", "key": "1ujiwe" }]], "aliases": ["network-wireless-no-route-symbolic"], "gtkIconName": "network-wireless-no-route-symbolic" };
__iconData$2$.node;
const NetworkWirelessNoRoute = createAdwaitaIcon(__iconData$2$);

const __iconData$2_ = { "name": "network-wireless-offline", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 8 1.992188 c -2.617188 0 -5.238281 0.933593 -7.195312 2.808593 l -0.496094 0.480469 c -0.3984378 0.378906 -0.410156 1.011719 -0.03125 1.410156 c 0.382812 0.398438 1.015625 0.410156 1.414062 0.03125 l 0.5 -0.476562 c 3.085938 -2.957032 8.53125 -2.957032 11.617188 0 l 0.5 0.476562 c 0.398437 0.378906 1.03125 0.367188 1.414062 -0.03125 c 0.378906 -0.398437 0.367188 -1.03125 -0.03125 -1.410156 l -0.496094 -0.480469 c -1.957031 -1.875 -4.578124 -2.808593 -7.195312 -2.808593 z m -0.03125 4.007812 c -1.570312 0.011719 -3.128906 0.628906 -4.207031 1.8125 l -0.5 0.550781 c -0.375 0.40625 -0.347657 1.042969 0.0625 1.414063 c 0.410156 0.371094 1.042969 0.339844 1.414062 -0.070313 l 0.5 -0.546875 c 1.242188 -1.359375 3.992188 -1.488281 5.398438 -0.125 c 0.121093 -0.023437 0.242187 -0.035156 0.363281 -0.035156 c 0.53125 0 1.039062 0.210938 1.414062 0.585938 l 0.222657 0.222656 c 0.011719 -0.011719 0.023437 -0.019532 0.035156 -0.03125 c 0.410156 -0.371094 0.441406 -1.007813 0.066406 -1.414063 l -0.5 -0.550781 c -1.125 -1.230469 -2.703125 -1.824219 -4.269531 -1.8125 z m 0.03125 4 c -0.511719 0 -1.023438 0.195312 -1.414062 0.585938 c -0.78125 0.78125 -0.78125 2.046874 0 2.828124 s 2.046874 0.78125 2.828124 0 c 0.210938 -0.210937 0.359376 -0.453124 0.457032 -0.714843 l -0.285156 -0.285157 c -0.554688 -0.554687 -0.707032 -1.367187 -0.46875 -2.070312 c -0.335938 -0.226562 -0.726563 -0.34375 -1.117188 -0.34375 z m 0 0", "key": "1rxnay" }], ["path", { "fill": "currentColor", "d": "m 11 10 c -0.265625 0 -0.519531 0.105469 -0.707031 0.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 l 1.292969 1.292969 l -1.292969 1.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 s 1.023437 0.390625 1.414062 0 l 1.292969 -1.292969 l 1.292969 1.292969 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 s 0.390625 -1.023437 0 -1.414062 l -1.292969 -1.292969 l 1.292969 -1.292969 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 s -0.519531 0.105469 -0.707031 0.292969 l -1.292969 1.292969 l -1.292969 -1.292969 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0 0", "key": "v9fe42" }]], "aliases": ["network-wireless-offline-symbolic"], "gtkIconName": "network-wireless-offline-symbolic" };
__iconData$2_.node;
const NetworkWirelessOffline = createAdwaitaIcon(__iconData$2_);

const __iconData$2Z = { "name": "network-wireless-signal-excellent", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 1.992188 c -2.617188 0 -5.238281 0.933593 -7.195312 2.808593 l -0.496094 0.480469 c -0.3984378 0.378906 -0.410156 1.011719 -0.03125 1.410156 c 0.382812 0.398438 1.015625 0.410156 1.414062 0.03125 l 0.5 -0.476562 c 3.085938 -2.957032 8.53125 -2.957032 11.617188 0 l 0.5 0.476562 c 0.398437 0.378906 1.03125 0.367188 1.414062 -0.03125 c 0.378906 -0.398437 0.367188 -1.03125 -0.03125 -1.410156 l -0.496094 -0.484375 c -1.957031 -1.871094 -4.578124 -2.804687 -7.195312 -2.804687 z m -0.03125 4.007812 c -1.570312 0.011719 -3.128906 0.628906 -4.207031 1.8125 l -0.5 0.550781 c -0.179688 0.195313 -0.277344 0.453125 -0.261719 0.71875 c 0.011719 0.265625 0.128906 0.515625 0.328125 0.695313 c 0.195313 0.179687 0.453125 0.273437 0.71875 0.257812 c 0.265625 -0.011718 0.515625 -0.128906 0.695313 -0.328125 l 0.496093 -0.546875 c 1.277344 -1.402344 4.160157 -1.496094 5.523438 0.003906 l 0.5 0.542969 c 0.175781 0.199219 0.425781 0.316407 0.691406 0.328125 c 0.265625 0.015625 0.523437 -0.078125 0.722656 -0.257812 c 0.195313 -0.179688 0.3125 -0.429688 0.324219 -0.695313 c 0.011719 -0.261719 -0.082031 -0.523437 -0.261719 -0.71875 l -0.5 -0.546875 c -1.121093 -1.234375 -2.703125 -1.828125 -4.269531 -1.816406 z m 0.03125 4 c -0.511719 0 -1.023438 0.195312 -1.414062 0.585938 c -0.78125 0.78125 -0.78125 2.046874 0 2.828124 s 2.046874 0.78125 2.828124 0 s 0.78125 -2.046874 0 -2.828124 c -0.390624 -0.390626 -0.902343 -0.585938 -1.414062 -0.585938 z m 0 0", "key": "l2cy98" }]], "aliases": ["network-wireless-signal-excellent-symbolic"], "gtkIconName": "network-wireless-signal-excellent-symbolic" };
__iconData$2Z.node;
const NetworkWirelessSignalExcellent = createAdwaitaIcon(__iconData$2Z);

const __iconData$2Y = { "name": "network-wireless-signal-good", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 1.992188 c -2.617188 0 -5.238281 0.933593 -7.195312 2.808593 l -0.496094 0.480469 c -0.3984378 0.378906 -0.410156 1.011719 -0.03125 1.410156 c 0.382812 0.398438 1.015625 0.410156 1.414062 0.03125 l 0.5 -0.476562 c 3.085938 -2.957032 8.53125 -2.957032 11.617188 0 l 0.5 0.476562 c 0.398437 0.378906 1.03125 0.367188 1.414062 -0.03125 c 0.378906 -0.398437 0.367188 -1.03125 -0.03125 -1.410156 l -0.496094 -0.484375 c -1.957031 -1.871094 -4.578124 -2.804687 -7.195312 -2.804687 z m -0.03125 4.007812 c -1.570312 0.011719 -3.128906 0.628906 -4.207031 1.8125 l -0.5 0.550781 c -0.179688 0.195313 -0.277344 0.453125 -0.261719 0.71875 c 0.011719 0.265625 0.128906 0.515625 0.328125 0.695313 c 0.195313 0.179687 0.453125 0.273437 0.71875 0.257812 c 0.265625 -0.011718 0.515625 -0.128906 0.695313 -0.328125 l 0.496093 -0.546875 c 1.277344 -1.402344 4.160157 -1.496094 5.523438 0.003906 l 0.5 0.542969 c 0.175781 0.199219 0.425781 0.316407 0.691406 0.328125 c 0.265625 0.015625 0.523437 -0.078125 0.722656 -0.257812 c 0.195313 -0.179688 0.3125 -0.429688 0.324219 -0.695313 c 0.011719 -0.261719 -0.082031 -0.523437 -0.261719 -0.71875 l -0.5 -0.546875 c -1.121093 -1.234375 -2.703125 -1.828125 -4.269531 -1.816406 z m 0.03125 4 c -0.511719 0 -1.023438 0.195312 -1.414062 0.585938 c -0.78125 0.78125 -0.78125 2.046874 0 2.828124 s 2.046874 0.78125 2.828124 0 s 0.78125 -2.046874 0 -2.828124 c -0.390624 -0.390626 -0.902343 -0.585938 -1.414062 -0.585938 z m 0 0", "key": "l2cy98" }]], "aliases": ["network-wireless-signal-good-symbolic"], "gtkIconName": "network-wireless-signal-good-symbolic" };
__iconData$2Y.node;
const NetworkWirelessSignalGood = createAdwaitaIcon(__iconData$2Y);

const __iconData$2X = { "name": "network-wireless-signal-none", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 8 1.992188 c -2.617188 0 -5.238281 0.933593 -7.195312 2.808593 l -0.496094 0.480469 c -0.3984378 0.378906 -0.410156 1.011719 -0.03125 1.410156 c 0.382812 0.398438 1.015625 0.410156 1.414062 0.03125 l 0.5 -0.476562 c 3.085938 -2.957032 8.53125 -2.957032 11.617188 0 l 0.5 0.476562 c 0.398437 0.378906 1.03125 0.367188 1.414062 -0.03125 c 0.378906 -0.398437 0.367188 -1.03125 -0.03125 -1.410156 l -0.496094 -0.480469 c -1.957031 -1.875 -4.578124 -2.808593 -7.195312 -2.808593 z m -0.03125 4.007812 c -1.570312 0.011719 -3.128906 0.628906 -4.207031 1.8125 l -0.5 0.550781 c -0.375 0.40625 -0.347657 1.042969 0.0625 1.414063 c 0.410156 0.371094 1.042969 0.339844 1.414062 -0.070313 l 0.5 -0.546875 c 1.277344 -1.402344 4.160157 -1.496094 5.523438 0 l 0.5 0.546875 c 0.371093 0.410157 1.003906 0.441407 1.414062 0.070313 c 0.40625 -0.371094 0.4375 -1.007813 0.0625 -1.414063 l -0.5 -0.550781 c -1.125 -1.230469 -2.703125 -1.824219 -4.269531 -1.8125 z m 0.03125 4 c -0.511719 0 -1.023438 0.195312 -1.414062 0.585938 c -0.78125 0.78125 -0.78125 2.046874 0 2.828124 s 2.046874 0.78125 2.828124 0 s 0.78125 -2.046874 0 -2.828124 c -0.390624 -0.390626 -0.902343 -0.585938 -1.414062 -0.585938 z m 0 0", "key": "bnpg2a" }]], "aliases": ["network-wireless-signal-none-symbolic"], "gtkIconName": "network-wireless-signal-none-symbolic" };
__iconData$2X.node;
const NetworkWirelessSignalNone = createAdwaitaIcon(__iconData$2X);

const __iconData$2W = { "name": "network-wireless-signal-ok", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7.96875 6 c -1.570312 0.011719 -3.128906 0.628906 -4.207031 1.8125 l -0.5 0.550781 c -0.375 0.40625 -0.347657 1.042969 0.066406 1.414063 c 0.40625 0.371094 1.039063 0.339844 1.414063 -0.070313 l 0.496093 -0.546875 c 1.277344 -1.402344 4.160157 -1.496094 5.523438 0.003906 l 0.5 0.542969 c 0.371093 0.410157 1.003906 0.441407 1.414062 0.070313 c 0.40625 -0.371094 0.4375 -1.007813 0.0625 -1.414063 l -0.5 -0.546875 c -1.121093 -1.234375 -2.703125 -1.828125 -4.269531 -1.816406 z m 0.03125 4 c -0.511719 0 -1.023438 0.195312 -1.414062 0.585938 c -0.78125 0.78125 -0.78125 2.046874 0 2.828124 s 2.046874 0.78125 2.828124 0 s 0.78125 -2.046874 0 -2.828124 c -0.390624 -0.390626 -0.902343 -0.585938 -1.414062 -0.585938 z m 0 0", "key": "t3q9p3" }], ["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 8 1.992188 c -2.617188 0 -5.238281 0.933593 -7.195312 2.808593 l -0.496094 0.480469 c -0.3984378 0.378906 -0.410156 1.011719 -0.03125 1.410156 c 0.382812 0.398438 1.015625 0.410156 1.414062 0.03125 l 0.5 -0.476562 c 3.085938 -2.957032 8.53125 -2.957032 11.617188 0 l 0.5 0.476562 c 0.398437 0.378906 1.03125 0.367188 1.414062 -0.03125 c 0.378906 -0.398437 0.367188 -1.03125 -0.03125 -1.410156 l -0.496094 -0.484375 c -1.957031 -1.871094 -4.578124 -2.804687 -7.195312 -2.804687 z m 0 0", "key": "1rbul2" }]], "aliases": ["network-wireless-signal-ok-symbolic"], "gtkIconName": "network-wireless-signal-ok-symbolic" };
__iconData$2W.node;
const NetworkWirelessSignalOk = createAdwaitaIcon(__iconData$2W);

const __iconData$2V = { "name": "network-wireless-signal-weak", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 10 c -0.511719 0 -1.023438 0.195312 -1.414062 0.585938 c -0.78125 0.78125 -0.78125 2.046874 0 2.828124 s 2.046874 0.78125 2.828124 0 s 0.78125 -2.046874 0 -2.828124 c -0.390624 -0.390626 -0.902343 -0.585938 -1.414062 -0.585938 z m 0 0", "key": "1gpl2e" }], ["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 8 1.992188 c -2.617188 0 -5.238281 0.933593 -7.195312 2.808593 l -0.496094 0.480469 c -0.3984378 0.378906 -0.410156 1.011719 -0.03125 1.410156 c 0.382812 0.398438 1.015625 0.410156 1.414062 0.03125 l 0.5 -0.476562 c 3.085938 -2.957032 8.53125 -2.957032 11.617188 0 l 0.5 0.476562 c 0.398437 0.378906 1.03125 0.367188 1.414062 -0.03125 c 0.378906 -0.398437 0.367188 -1.03125 -0.03125 -1.410156 l -0.496094 -0.480469 c -1.957031 -1.875 -4.578124 -2.808593 -7.195312 -2.808593 z m -0.03125 4.007812 c -1.570312 0.011719 -3.128906 0.628906 -4.207031 1.8125 l -0.5 0.550781 c -0.375 0.40625 -0.347657 1.042969 0.0625 1.414063 c 0.410156 0.371094 1.042969 0.339844 1.414062 -0.070313 l 0.5 -0.546875 c 1.277344 -1.402344 4.160157 -1.496094 5.523438 0 l 0.5 0.546875 c 0.371093 0.410157 1.003906 0.441407 1.414062 0.070313 c 0.40625 -0.371094 0.4375 -1.007813 0.0625 -1.414063 l -0.5 -0.550781 c -1.125 -1.230469 -2.703125 -1.824219 -4.269531 -1.8125 z m 0 0", "key": "iqbgxa" }]], "aliases": ["network-wireless-signal-weak-symbolic"], "gtkIconName": "network-wireless-signal-weak-symbolic" };
__iconData$2V.node;
const NetworkWirelessSignalWeak = createAdwaitaIcon(__iconData$2V);

const __iconData$2U = { "name": "network-wireless", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 1.992188 c -2.617188 0 -5.238281 0.933593 -7.195312 2.808593 l -0.496094 0.480469 c -0.3984378 0.378906 -0.410156 1.011719 -0.03125 1.410156 c 0.382812 0.398438 1.015625 0.410156 1.414062 0.03125 l 0.5 -0.476562 c 3.085938 -2.957032 8.53125 -2.957032 11.617188 0 l 0.5 0.476562 c 0.398437 0.378906 1.03125 0.367188 1.414062 -0.03125 c 0.378906 -0.398437 0.367188 -1.03125 -0.03125 -1.410156 l -0.496094 -0.484375 c -1.957031 -1.871094 -4.578124 -2.804687 -7.195312 -2.804687 z m -0.03125 4.007812 c -1.570312 0.011719 -3.128906 0.628906 -4.207031 1.8125 l -0.5 0.550781 c -0.179688 0.195313 -0.277344 0.453125 -0.261719 0.71875 c 0.011719 0.265625 0.128906 0.515625 0.328125 0.695313 c 0.195313 0.179687 0.453125 0.273437 0.71875 0.257812 c 0.265625 -0.011718 0.515625 -0.128906 0.695313 -0.328125 l 0.496093 -0.546875 c 1.277344 -1.402344 4.160157 -1.496094 5.523438 0.003906 l 0.5 0.542969 c 0.175781 0.199219 0.425781 0.316407 0.691406 0.328125 c 0.265625 0.015625 0.523437 -0.078125 0.722656 -0.257812 c 0.195313 -0.179688 0.3125 -0.429688 0.324219 -0.695313 c 0.011719 -0.261719 -0.082031 -0.523437 -0.261719 -0.71875 l -0.5 -0.546875 c -1.121093 -1.234375 -2.703125 -1.828125 -4.269531 -1.816406 z m 0.03125 4 c -0.511719 0 -1.023438 0.195312 -1.414062 0.585938 c -0.78125 0.78125 -0.78125 2.046874 0 2.828124 s 2.046874 0.78125 2.828124 0 s 0.78125 -2.046874 0 -2.828124 c -0.390624 -0.390626 -0.902343 -0.585938 -1.414062 -0.585938 z m 0 0", "key": "l2cy98" }]], "aliases": ["network-wireless-symbolic"], "gtkIconName": "network-wireless-symbolic" };
__iconData$2U.node;
const NetworkWireless = createAdwaitaIcon(__iconData$2U);

const __iconData$2T = { "name": "network-workgroup", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3.113281 1.996094 c -1.695312 0 -3.0937498 1.394531 -3.0937498 3.089844 v 2.808593 c 0 1.664063 1.3515628 3.039063 3.0039068 3.089844 v 1.285156 c -0.289063 0.167969 -0.535157 0.40625 -0.714844 0.703125 h -1.3125 c -0.550782 0 -1.00000025 0.449219 -1.00000025 1 c 0 0.550782 0.44921825 1 1.00000025 1 h 1.28125 c 0.347656 0.640625 1.019531 1.035156 1.75 1.039063 c 0.730468 -0.003907 1.402344 -0.398438 1.753906 -1.039063 h 4.464844 c 0.347656 0.640625 1.019531 1.035156 1.75 1.039063 c 0.730468 -0.003907 1.402344 -0.398438 1.753906 -1.039063 h 1.277344 c 0.550781 0 1 -0.449218 1 -1 c 0 -0.550781 -0.449219 -1 -1 -1 h -1.3125 c -0.179688 -0.296875 -0.425782 -0.535156 -0.714844 -0.703125 v -1.285156 c 1.652344 -0.050781 3 -1.425781 3 -3.089844 v -2.808593 c 0 -1.695313 -1.398438 -3.089844 -3.09375 -3.089844 h -1.816406 c -1.609375 0 -2.945313 1.257812 -3.078125 2.835937 c -0.132813 -1.578125 -1.472657 -2.835937 -3.078125 -2.835937 z m 0 2 h 1.820313 c 0.621094 0 1.085937 0.46875 1.085937 1.089844 v 1.914062 h -4 v -1.914062 c 0 -0.621094 0.472657 -1.089844 1.09375 -1.089844 z m 7.976563 0 h 1.816406 c 0.625 0 1.09375 0.46875 1.09375 1.089844 v 1.914062 h -4 v -1.914062 c 0 -0.621094 0.46875 -1.089844 1.089844 -1.089844 z m -9.058594 4.054687 h 3.980469 c -0.070313 0.542969 -0.511719 0.933594 -1.078125 0.933594 h -1.820313 c -0.566406 0 -1.011719 -0.390625 -1.082031 -0.933594 z m 7.980469 0 h 3.976562 c -0.070312 0.542969 -0.511719 0.933594 -1.082031 0.933594 h -1.816406 c -0.566406 0 -1.007813 -0.390625 -1.078125 -0.933594 z m -2 0.101563 c 0.128906 1.542968 1.414062 2.78125 2.976562 2.828125 v 1.292969 c -0.285156 0.167968 -0.53125 0.40625 -0.707031 0.699218 h -4.539062 c -0.175782 -0.292968 -0.421876 -0.53125 -0.710938 -0.699218 v -1.292969 c 1.5625 -0.050781 2.851562 -1.285157 2.980469 -2.828125 z m -3.984375 4.847656 c 0.554687 0 1.007812 0.449219 1.003906 1.003906 c 0.003906 0.558594 -0.449219 1.007813 -1.003906 1.007813 c -0.554688 0 -1.007813 -0.449219 -1.007813 -1.007813 c 0 -0.554687 0.453125 -1.003906 1.007813 -1.003906 z m 7.96875 0 c 0.554687 0 1.007812 0.449219 1.003906 1.003906 c 0.003906 0.558594 -0.449219 1.007813 -1.003906 1.007813 c -0.554688 0 -1.007813 -0.449219 -1.007813 -1.007813 c 0 -0.554687 0.453125 -1.003906 1.007813 -1.003906 z m 0 0", "key": "1ux4oe" }]], "aliases": ["network-workgroup-symbolic"], "gtkIconName": "network-workgroup-symbolic" };
__iconData$2T.node;
const NetworkWorkgroup = createAdwaitaIcon(__iconData$2T);

const __iconData$2S = { "name": "night-light-disabled", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 12.949219 11.949219 c -0.257813 0 -0.511719 0.097656 -0.707031 0.292969 c -0.390626 0.390624 -0.390626 1.023437 0 1.414062 c 0.390624 0.390625 1.023437 0.390625 1.414062 0 s 0.390625 -1.023438 0 -1.414062 c -0.195312 -0.195313 -0.449219 -0.292969 -0.707031 -0.292969 z m 0 0", "key": "1ysw3p" }], ["path", { "fill": "currentColor", "d": "m 15 7 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 s 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m 0 0", "key": "m1a9v" }], ["path", { "fill": "currentColor", "d": "m 12.949219 2.050781 c -0.257813 0 -0.511719 0.097657 -0.707031 0.292969 c -0.390626 0.390625 -0.390626 1.023438 0 1.414062 c 0.390624 0.390626 1.023437 0.390626 1.414062 0 c 0.390625 -0.390624 0.390625 -1.023437 0 -1.414062 c -0.195312 -0.195312 -0.449219 -0.292969 -0.707031 -0.292969 z m 0 0", "key": "r6jan0" }], ["path", { "fill": "currentColor", "d": "m 3.050781 2.050781 c -0.257812 0 -0.511719 0.097657 -0.707031 0.292969 c -0.21875 0.21875 -0.316406 0.511719 -0.289062 0.796875 l 0.90625 0.90625 c 0.285156 0.027344 0.578124 -0.070313 0.796874 -0.289063 c 0.390626 -0.390624 0.390626 -1.023437 0 -1.414062 c -0.195312 -0.195312 -0.449218 -0.292969 -0.707031 -0.292969 z m 4.949219 0.949219 c -1.65625 0 -3.128906 0.804688 -4.039062 2.046875 l 6.988281 6.988281 c 0.824219 -0.601562 1.453125 -1.449218 1.789062 -2.429687 c -0.527343 0.25 -1.117187 0.394531 -1.738281 0.394531 c -2.210938 0 -4 -1.789062 -4 -4 c 0 -1.1875 0.519531 -2.253906 1.34375 -2.988281 c -0.113281 -0.007813 -0.230469 -0.011719 -0.34375 -0.011719 z m -7 4 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 s 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m 2.097656 0.011719 c -0.0625 0.320312 -0.097656 0.648437 -0.097656 0.988281 c 0 2.761719 2.238281 5 5 5 c 0.339844 0 0.667969 -0.035156 0.988281 -0.097656 z m -0.046875 4.9375 c -0.257812 0 -0.511719 0.097656 -0.707031 0.292969 c -0.390625 0.390624 -0.390625 1.023437 0 1.414062 s 1.023438 0.390625 1.414062 0 c 0.390626 -0.390625 0.390626 -1.023438 0 -1.414062 c -0.195312 -0.195313 -0.449218 -0.292969 -0.707031 -0.292969 z m 4.949219 2.050781 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 s 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m 0 0", "key": "c2j4fz" }], ["path", { "fill": "currentColor", "d": "m 8 0 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 s 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m 0 0", "key": "qiuc2g" }], ["path", { "fill": "none", "stroke": "currentColor", "stroke-width": "2", "stroke-linejoin": "round", "d": "m 1 1 l 14 14", "key": "1ryex3" }], ["path", { "d": "m 1 1 l 14 14", "key": "7wnx17" }]], "aliases": ["night-light-disabled-symbolic"], "gtkIconName": "night-light-disabled-symbolic" };
__iconData$2S.node;
const NightLightDisabled = createAdwaitaIcon(__iconData$2S);

const __iconData$2R = { "name": "night-light", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 14 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 s 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m 0 0", "key": "8i3abx" }], ["path", { "fill": "currentColor", "d": "m 12.949219 11.949219 c -0.257813 0 -0.511719 0.097656 -0.707031 0.292969 c -0.390626 0.390624 -0.390626 1.023437 0 1.414062 c 0.390624 0.390625 1.023437 0.390625 1.414062 0 s 0.390625 -1.023438 0 -1.414062 c -0.195312 -0.195313 -0.449219 -0.292969 -0.707031 -0.292969 z m 0 0", "key": "1ysw3p" }], ["path", { "fill": "currentColor", "d": "m 3.050781 11.949219 c -0.257812 0 -0.511719 0.097656 -0.707031 0.292969 c -0.390625 0.390624 -0.390625 1.023437 0 1.414062 s 1.023438 0.390625 1.414062 0 c 0.390626 -0.390625 0.390626 -1.023438 0 -1.414062 c -0.195312 -0.195313 -0.449218 -0.292969 -0.707031 -0.292969 z m 0 0", "key": "3t0g" }], ["path", { "fill": "currentColor", "d": "m 15 7 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 s 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m 0 0", "key": "m1a9v" }], ["path", { "fill": "currentColor", "d": "m 1 7 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 s 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m 0 0", "key": "7rqck6" }], ["path", { "fill": "currentColor", "d": "m 8 3 c -2.761719 0 -5 2.238281 -5 5 s 2.238281 5 5 5 c 2.199219 0 4.066406 -1.421875 4.738281 -3.394531 c -0.527343 0.25 -1.117187 0.394531 -1.738281 0.394531 c -2.210938 0 -4 -1.789062 -4 -4 c 0 -1.1875 0.519531 -2.253906 1.34375 -2.988281 c -0.113281 -0.007813 -0.230469 -0.011719 -0.34375 -0.011719 z m 0 0", "key": "8nqbaq" }], ["path", { "fill": "currentColor", "d": "m 12.949219 2.050781 c -0.257813 0 -0.511719 0.097657 -0.707031 0.292969 c -0.390626 0.390625 -0.390626 1.023438 0 1.414062 c 0.390624 0.390626 1.023437 0.390626 1.414062 0 c 0.390625 -0.390624 0.390625 -1.023437 0 -1.414062 c -0.195312 -0.195312 -0.449219 -0.292969 -0.707031 -0.292969 z m 0 0", "key": "r6jan0" }], ["path", { "fill": "currentColor", "d": "m 3.050781 2.050781 c -0.257812 0 -0.511719 0.097657 -0.707031 0.292969 c -0.390625 0.390625 -0.390625 1.023438 0 1.414062 c 0.390625 0.390626 1.023438 0.390626 1.414062 0 c 0.390626 -0.390624 0.390626 -1.023437 0 -1.414062 c -0.195312 -0.195312 -0.449218 -0.292969 -0.707031 -0.292969 z m 0 0", "key": "husqw7" }], ["path", { "fill": "currentColor", "d": "m 8 0 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 s 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m 0 0", "key": "qiuc2g" }]], "aliases": ["night-light-symbolic"], "gtkIconName": "night-light-symbolic" };
__iconData$2R.node;
const NightLight = createAdwaitaIcon(__iconData$2R);

const __iconData$2Q = { "name": "non-starred", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 8 0 c -0.429688 0 -0.8125 0.273438 -0.949219 0.683594 l -1.449219 4.339844 l -4.589843 -0.015626 c -0.4375 0 -0.828125 0.28125 -0.9609378 0.695313 c -0.1328124 0.417969 0.0195313 0.871094 0.3789068 1.125 l 3.625 2.554687 l -1.5 4.285157 c -0.140626 0.40625 -0.011719 0.855469 0.328124 1.121093 c 0.335938 0.261719 0.804688 0.285157 1.164063 0.050782 l 4.003906 -2.59375 l 3.894531 2.585937 c 0.359376 0.238281 0.828126 0.222657 1.167969 -0.042969 c 0.339844 -0.261718 0.472657 -0.714843 0.332031 -1.117187 l -1.503906 -4.289063 l 3.644532 -2.578124 c 0.351562 -0.25 0.503906 -0.703126 0.371093 -1.113282 c -0.128906 -0.414062 -0.511719 -0.695312 -0.945312 -0.699218 l -4.660157 -0.015626 l -1.402343 -4.285156 c -0.132813 -0.410156 -0.515625 -0.68749975 -0.949219 -0.691406 z m -0.007812 4.1875 l 0.683593 2.097656 c 0.132813 0.40625 0.515625 0.6875 0.945313 0.6875 l 2.253906 0.007813 l -1.703125 1.203125 c -0.363281 0.257812 -0.511719 0.726562 -0.363281 1.148437 l 0.765625 2.191407 l -1.964844 -1.304688 c -0.332031 -0.222656 -0.761719 -0.222656 -1.097656 -0.007812 l -2.101563 1.363281 l 0.785156 -2.242188 c 0.144532 -0.421875 -0.003906 -0.890625 -0.367187 -1.148437 l -1.652344 -1.164063 l 2.144531 0.007813 c 0.429688 0 0.8125 -0.277344 0.949219 -0.683594 z m 0 0", "key": "1snev1" }]], "aliases": ["non-starred-symbolic"], "gtkIconName": "non-starred-symbolic" };
__iconData$2Q.node;
const NonStarred = createAdwaitaIcon(__iconData$2Q);

const __iconData$2P = { "name": "notifications-disabled", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 c -0.828125 0 -1.5 0.671875 -1.5 1.5 c 0 0.074219 0.007812 0.148438 0.019531 0.226562 c -0.871093 0.273438 -1.648437 0.78125 -2.25 1.46875 l -2.738281 -2.738281 l -1.058594 1.0625 l 2.96875 2.972657 l 1.605469 1.601562 l 9.425781 9.425781 l 1.058594 -1.0625 l -1.566406 -1.570312 c 0.316406 -0.167969 0.535156 -0.5 0.535156 -0.886719 c 0 -0.554688 -0.445312 -1 -1 -1 h -0.5 v -4.40625 c 0 -0.03125 0 -0.0625 0.003906 -0.09375 c -0.003906 -2.191406 -1.429687 -4.125 -3.519531 -4.773438 c 0.011719 -0.078124 0.015625 -0.152343 0.019531 -0.226562 c 0 -0.828125 -0.671875 -1.5 -1.5 -1.5 z m 0 3.5 c 1.65625 0 3 1.34375 3 3 v 3.425781 l -5.3125 -5.3125 c 0.5625 -0.699219 1.414062 -1.109375 2.3125 -1.113281 z m -4.972656 2.699219 c -0.011719 0.101562 -0.019532 0.199219 -0.027344 0.300781 v 4.5 h -0.5 c -0.554688 0 -1 0.445312 -1 1 s 0.445312 1 1 1 h 7.328125 l -2 -2 h -2.828125 v -2.828125 z m 2.972656 7.800781 c 0 0.714844 0.382812 1.375 1 1.730469 c 0.617188 0.359375 1.382812 0.359375 2 0 c 0.617188 -0.355469 1 -1.015625 1 -1.730469 z m 0 0", "key": "wh5o0n" }]], "aliases": ["notifications-disabled-symbolic"], "gtkIconName": "notifications-disabled-symbolic" };
__iconData$2P.node;
const NotificationsDisabled = createAdwaitaIcon(__iconData$2P);

const __iconData$2O = { "name": "object-flip-horizontal", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 5 3 c -0.265625 0 -0.519531 0.105469 -0.707031 0.292969 l -4 4 c -0.3906252 0.390625 -0.3906252 1.023437 0 1.414062 l 4 4 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 s 0.390625 -1.023437 0 -1.414062 l -2.292969 -2.292969 h 9.171876 l -2.292969 2.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 s 1.023437 0.390625 1.414062 0 l 4 -4 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 l -4 -4 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 s -0.519531 0.105469 -0.707031 0.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 l 2.292969 2.292969 h -9.171876 l 2.292969 -2.292969 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0 0", "key": "75gv05" }]], "aliases": ["object-flip-horizontal-symbolic"], "gtkIconName": "object-flip-horizontal-symbolic" };
__iconData$2O.node;
const ObjectFlipHorizontal = createAdwaitaIcon(__iconData$2O);

const __iconData$2N = { "name": "object-flip-vertical", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 13 5 c 0 -0.265625 -0.105469 -0.519531 -0.292969 -0.707031 l -4 -4 c -0.390625 -0.3906252 -1.023437 -0.3906252 -1.414062 0 l -4 4 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 s 1.023437 0.390625 1.414062 0 l 2.292969 -2.292969 v 9.171876 l -2.292969 -2.292969 c -0.390625 -0.390625 -1.023437 -0.390625 -1.414062 0 s -0.390625 1.023437 0 1.414062 l 4 4 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 l 4 -4 c 0.1875 -0.1875 0.292969 -0.441406 0.292969 -0.707031 s -0.105469 -0.519531 -0.292969 -0.707031 c -0.390625 -0.390625 -1.023437 -0.390625 -1.414062 0 l -2.292969 2.292969 v -9.171876 l 2.292969 2.292969 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 c 0.1875 -0.1875 0.292969 -0.441406 0.292969 -0.707031 z m 0 0", "key": "qg9nt0" }]], "aliases": ["object-flip-vertical-symbolic"], "gtkIconName": "object-flip-vertical-symbolic" };
__iconData$2N.node;
const ObjectFlipVertical = createAdwaitaIcon(__iconData$2N);

const __iconData$2M = { "name": "object-rotate-left", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8.914062 2 c -0.574218 0.007812 -1.152343 0.085938 -1.726562 0.238281 c -3.054688 0.820313 -5.1875 3.597657 -5.1875 6.761719 h -2 v 1 h 0.0078125 c -0.00390625 0.265625 0.1015625 0.519531 0.2851565 0.707031 l 2 2 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 l 2 -2 c 0.183594 -0.1875 0.289063 -0.441406 0.289063 -0.707031 h 0.003906 v -1 h -2 c 0 -2.269531 1.515625 -4.242188 3.707031 -4.832031 c 2.1875 -0.585938 4.488281 0.367187 5.625 2.332031 c 1.132813 1.964844 0.808594 4.429688 -0.796875 6.035156 c -0.390625 0.390625 -0.390625 1.023438 0 1.414063 s 1.023438 0.390625 1.414063 0 c 2.238281 -2.238281 2.695312 -5.710938 1.113281 -8.449219 c -1.1875 -2.054688 -3.304688 -3.324219 -5.578125 -3.480469 c -0.191406 -0.015625 -0.378906 -0.023437 -0.570313 -0.019531 z m 0 0", "key": "1eiwux" }]], "aliases": ["object-rotate-left-symbolic"], "gtkIconName": "object-rotate-left-symbolic" };
__iconData$2M.node;
const ObjectRotateLeft = createAdwaitaIcon(__iconData$2M);

const __iconData$2L = { "name": "object-rotate-right", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7.085938 2 c 0.574218 0.007812 1.152343 0.085938 1.726562 0.238281 c 3.054688 0.820313 5.1875 3.597657 5.1875 6.761719 h 2 v 1 h -0.007812 c 0.003906 0.265625 -0.101563 0.519531 -0.285157 0.707031 l -2 2 c -0.390625 0.390625 -1.023437 0.390625 -1.414062 0 l -2 -2 c -0.1875 -0.1875 -0.289063 -0.441406 -0.289063 -0.707031 h -0.003906 v -1 h 2 c 0 -2.269531 -1.515625 -4.242188 -3.707031 -4.832031 c -2.1875 -0.585938 -4.488281 0.367187 -5.625 2.332031 c -1.132813 1.964844 -0.808594 4.429688 0.796875 6.035156 c 0.390625 0.390625 0.390625 1.023438 0 1.414063 s -1.023438 0.390625 -1.414063 0 c -2.238281 -2.238281 -2.695312 -5.710938 -1.113281 -8.449219 c 1.1875 -2.054688 3.304688 -3.324219 5.578125 -3.480469 c 0.1875 -0.015625 0.378906 -0.023437 0.570313 -0.019531 z m 0 0", "key": "1z0i3d" }]], "aliases": ["object-rotate-right-symbolic"], "gtkIconName": "object-rotate-right-symbolic" };
__iconData$2L.node;
const ObjectRotateRight = createAdwaitaIcon(__iconData$2L);

const __iconData$2K = { "name": "object-select", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 13.753906 4.660156 c 0.175782 -0.199218 0.261719 -0.460937 0.246094 -0.726562 c -0.019531 -0.265625 -0.140625 -0.511719 -0.339844 -0.6875 c -0.199218 -0.175782 -0.460937 -0.261719 -0.726562 -0.246094 c -0.265625 0.019531 -0.511719 0.140625 -0.6875 0.339844 l -6.296875 7.195312 l -2.242188 -2.242187 c -0.390625 -0.390625 -1.023437 -0.390625 -1.414062 0 c -0.1875 0.1875 -0.292969 0.441406 -0.292969 0.707031 s 0.105469 0.519531 0.292969 0.707031 l 3 3 c 0.195312 0.195313 0.464843 0.304688 0.738281 0.292969 c 0.277344 -0.007812 0.539062 -0.132812 0.722656 -0.339844 z m 0 0", "key": "6mnuyz" }]], "aliases": ["object-select-symbolic"], "gtkIconName": "object-select-symbolic" };
__iconData$2K.node;
const ObjectSelect = createAdwaitaIcon(__iconData$2K);

const __iconData$2J = { "name": "open-menu", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1 2 h 14 v 2 h -14 z m 0 0", "key": "3x1jlz" }], ["path", { "fill": "currentColor", "d": "m 1 7 h 14 v 2 h -14 z m 0 0", "key": "1ujeyg" }], ["path", { "fill": "currentColor", "d": "m 1 12 h 14 v 2 h -14 z m 0 0", "key": "jcovva" }]], "aliases": ["open-menu-symbolic"], "gtkIconName": "open-menu-symbolic" };
__iconData$2J.node;
const OpenMenu = createAdwaitaIcon(__iconData$2J);

const __iconData$2I = { "name": "orientation-landscape-inverse", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 2.125 13.082031 c -0.613281 0 -1.113281 -0.5 -1.113281 -1.113281 v -7.847656 c 0 -0.617188 0.5 -1.113282 1.113281 -1.113282 h 11.738281 c 0.617188 0 1.117188 0.496094 1.117188 1.113282 v 7.847656 c 0 0.613281 -0.5 1.113281 -1.117188 1.113281 z m 5.84375 -3 l 4 -4.042969 h -8 z m 0 0", "key": "20bs30" }]], "aliases": ["orientation-landscape-inverse-symbolic"], "gtkIconName": "orientation-landscape-inverse-symbolic" };
__iconData$2I.node;
const OrientationLandscapeInverse = createAdwaitaIcon(__iconData$2I);

const __iconData$2H = { "name": "orientation-landscape", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 2.125 3.039062 c -0.613281 0 -1.113281 0.496094 -1.113281 1.113282 v 7.84375 c 0 0.617187 0.5 1.117187 1.113281 1.117187 h 11.738281 c 0.617188 0 1.117188 -0.5 1.117188 -1.117187 v -7.84375 c 0 -0.617188 -0.5 -1.113282 -1.117188 -1.113282 z m 5.84375 3 l 4 4 h -8 z m 0 0", "key": "1w483f" }]], "aliases": ["orientation-landscape-symbolic"], "gtkIconName": "orientation-landscape-symbolic" };
__iconData$2H.node;
const OrientationLandscape = createAdwaitaIcon(__iconData$2H);

const __iconData$2G = { "name": "orientation-portrait-left", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 2.960938 2.167969 c 0 -0.617188 0.496093 -1.113281 1.113281 -1.113281 h 7.84375 c 0.617187 0 1.113281 0.496093 1.113281 1.113281 v 11.738281 c 0 0.617188 -0.496094 1.113281 -1.113281 1.113281 h -7.84375 c -0.617188 0 -1.113281 -0.496093 -1.113281 -1.113281 z m 3 5.839843 l 4.007812 3.992188 v -8 z m 0 0", "key": "1jxbb3" }]], "aliases": ["orientation-portrait-left-symbolic"], "gtkIconName": "orientation-portrait-left-symbolic" };
__iconData$2G.node;
const OrientationPortraitLeft = createAdwaitaIcon(__iconData$2G);

const __iconData$2F = { "name": "orientation-portrait-right", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 13.03125 2.167969 c 0 -0.617188 -0.496094 -1.113281 -1.113281 -1.113281 h -7.84375 c -0.617188 0 -1.113281 0.496093 -1.113281 1.113281 v 11.738281 c 0 0.617188 0.496093 1.113281 1.113281 1.113281 h 7.84375 c 0.617187 0 1.113281 -0.496093 1.113281 -1.113281 z m -3 5.839843 l -4.0625 3.992188 v -8 z m 0 0", "key": "1d1lwm" }]], "aliases": ["orientation-portrait-right-symbolic"], "gtkIconName": "orientation-portrait-right-symbolic" };
__iconData$2F.node;
const OrientationPortraitRight = createAdwaitaIcon(__iconData$2F);

const __iconData$2E = { "name": "package-x-generic", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4.023438 0.996094 c -1.449219 0 -2.679688 1.046875 -2.964844 2.421875 c -0.019532 0.097656 -0.035156 0.199219 -0.046875 0.300781 c -0.007813 0.101562 -0.015625 0.203125 -0.015625 0.304688 v 7.910156 c 0 1.660156 1.367187 3.027344 3.027344 3.027344 h 7.949218 c 1.660156 0 3.027344 -1.367188 3.027344 -3.027344 v -7.910156 c 0 -0.105469 -0.003906 -0.207032 -0.015625 -0.304688 c -0.011719 -0.101562 -0.027344 -0.203125 -0.046875 -0.300781 c -0.285156 -1.375 -1.511719 -2.421875 -2.964844 -2.421875 z m 0 2.003906 h 2.976562 v 3 h -2.976562 c -0.585938 0 -1.027344 -0.441406 -1.027344 -1.027344 v -0.949218 c 0.003906 -0.035157 0.003906 -0.070313 0.007812 -0.105469 c 0.003906 -0.035157 0.007813 -0.070313 0.011719 -0.105469 c 0.007813 -0.035156 0.019531 -0.066406 0.027344 -0.097656 c 0.125 -0.421875 0.503906 -0.714844 0.980469 -0.714844 z m 4.976562 0 h 2.972656 c 0.585938 0 1.023438 0.4375 1.027344 1.023438 v 0.949218 c 0 0.585938 -0.441406 1.027344 -1.027344 1.027344 h -2.972656 z m 4 3.71875 v 5.214844 c 0 0.585937 -0.441406 1.027344 -1.027344 1.027344 h -7.949218 c -0.585938 0 -1.027344 -0.441407 -1.027344 -1.027344 v -5.175782 c 0.324218 0.148438 0.671875 0.246094 1.027344 0.246094 h 2.976562 v 3.035156 l 2 0.992188 v -4.027344 h 2.972656 c 0.34375 0 0.695313 -0.113281 1.027344 -0.285156 z m -5 33.28125 c -0.851562 0 -1.699219 0.328125 -2.351562 0.976562 l -4.671876 4.671876 c -1.300781 1.300781 -1.300781 3.402343 0 4.703124 l 4.671876 4.671876 c 1.300781 1.300781 3.402343 1.300781 4.699218 0 l 4.675782 -4.671876 c 1.300781 -1.300781 1.300781 -3.402343 0 -4.703124 l -4.675782 -4.671876 c -0.648437 -0.648437 -1.496094 -0.976562 -2.347656 -0.976562 z m 0 1.984375 c 0.335938 0 0.675781 0.132813 0.941406 0.402344 l 3.03125 3.027343 c -0.066406 0.039063 -0.136718 0.070313 -0.210937 0.09375 c -0.019531 0.003907 -0.039063 0.011719 -0.0625 0.015626 c -0.441407 0.148437 -1.003907 0.019531 -1.277344 -0.359376 l -0.140625 -0.195312 c -0.15625 -0.210938 -0.390625 -0.355469 -0.652344 -0.398438 c -0.066406 -0.011718 -0.132812 -0.015624 -0.199218 -0.011718 c -0.195313 0.007812 -0.382813 0.074218 -0.542969 0.191406 c -0.449219 0.324219 -0.550781 0.949219 -0.226563 1.394531 l 0.144532 0.199219 c 0.273437 0.378906 0.226562 0.953125 -0.050782 1.332031 c -0.011718 0.015625 -0.023437 0.03125 -0.035156 0.050781 c -0.273438 0.378907 -0.808594 0.597657 -1.253906 0.453126 l -0.226563 -0.074219 c -0.523437 -0.167969 -1.089843 0.117187 -1.257812 0.644531 c -0.171875 0.523438 0.113281 1.089844 0.636719 1.261719 l 0.226562 0.070312 c 0.445312 0.144531 0.738281 0.640625 0.746094 1.105469 c 0.003906 0.023438 0.003906 0.042969 0.003906 0.066406 c 0.015625 0.464844 -0.304688 0.960938 -0.75 1.105469 l -0.226562 0.074219 c -0.179688 0.058594 -0.332032 0.164062 -0.445313 0.296875 l -3.785156 -3.785157 c -0.535157 -0.535156 -0.535157 -1.355468 0 -1.890624 l 4.667969 -4.667969 c 0.269531 -0.269531 0.609374 -0.402344 0.945312 -0.402344 z m 5.585938 5.234375 c 0.058593 0 0.117187 0.003906 0.175781 0.007812 c 0.382812 0.523438 0.335937 1.234376 -0.144531 1.71875 l -3.753907 3.75 c -0.027343 -0.066406 -0.050781 -0.136718 -0.070312 -0.203124 c -0.003907 -0.011719 -0.007813 -0.023438 -0.011719 -0.035157 c -0.003906 -0.007812 -0.007812 -0.011719 -0.011719 -0.019531 c -0.285156 -0.84375 -0.152343 -1.644531 0 -2.4375 c 0.003907 -0.003906 0.007813 -0.007812 0.011719 -0.015625 c 0.003906 -0.011719 0.007812 -0.027344 0.011719 -0.039063 c 0.261719 -0.789062 0.757812 -1.464843 1.410156 -1.945312 c 0.011719 -0.003906 0.023437 -0.011719 0.03125 -0.015625 c 0.019531 -0.015625 0.042969 -0.03125 0.058594 -0.046875 c 0.648437 -0.453125 1.4375 -0.71875 2.292969 -0.71875 z m 0 0", "key": "xsbhtu" }]], "aliases": ["package-x-generic-symbolic"], "gtkIconName": "package-x-generic-symbolic" };
__iconData$2E.node;
const PackageXGeneric = createAdwaitaIcon(__iconData$2E);

const __iconData$2D = { "name": "pan-down", "size": 16, "node": [["path", { "fill": "currentColor", "fill-rule": "evenodd", "d": "m 3.292969 7.707031 l 4 4 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 l 4 -4 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 s -1.023437 -0.390625 -1.414062 0 l -3.292969 3.292969 l -3.292969 -3.292969 c -0.390625 -0.390625 -1.023437 -0.390625 -1.414062 0 s -0.390625 1.023437 0 1.414062 z m 0 0", "key": "3zbtpn" }]], "aliases": ["pan-down-symbolic"], "gtkIconName": "pan-down-symbolic" };
__iconData$2D.node;
const PanDown = createAdwaitaIcon(__iconData$2D);

const __iconData$2C = { "name": "pan-end", "size": 16, "node": [["path", { "fill": "currentColor", "fill-rule": "evenodd", "d": "m 7 13 c 0.265625 0 0.519531 -0.101562 0.707031 -0.292969 l 4 -4 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 l -4.003906 -4 c -0.390625 -0.386719 -1.023437 -0.386719 -1.414063 0 c -0.386718 0.394531 -0.386718 1.027343 0.003907 1.414062 l 3.292969 3.292969 l -3.292969 3.292969 c -0.390625 0.390625 -0.390625 1.027343 0 1.414062 c 0.1875 0.191407 0.441406 0.292969 0.707031 0.292969 z m 0 0", "key": "10p7mh" }]], "aliases": ["pan-end-symbolic"], "gtkIconName": "pan-end-symbolic" };
__iconData$2C.node;
const PanEnd = createAdwaitaIcon(__iconData$2C);

const __iconData$2B = { "name": "pan-start", "size": 16, "node": [["path", { "fill": "currentColor", "fill-rule": "evenodd", "d": "m 8.285156 12.699219 l -3.917968 -4 c -0.378907 -0.390625 -0.378907 -1.007813 0 -1.394531 l 3.917968 -4 c 0.382813 -0.398438 1.015625 -0.40625 1.414063 -0.019532 c 0.394531 0.382813 0.402343 1.015625 0.019531 1.414063 l -3.242188 3.300781 l 3.242188 3.300781 c 0.382812 0.398438 0.375 1.03125 -0.019531 1.417969 c -0.398438 0.382812 -1.03125 0.375 -1.414063 -0.019531 z m 0 0", "key": "177lm1" }]], "aliases": ["pan-start-symbolic"], "gtkIconName": "pan-start-symbolic" };
__iconData$2B.node;
const PanStart = createAdwaitaIcon(__iconData$2B);

const __iconData$2A = { "name": "pan-up", "size": 16, "node": [["path", { "fill": "currentColor", "fill-rule": "evenodd", "d": "m 3.300781 9.203125 l 4 -3.917969 c 0.390625 -0.378906 1.007813 -0.378906 1.394531 0 l 4 3.917969 c 0.398438 0.382813 0.40625 1.015625 0.019532 1.414063 c -0.382813 0.394531 -1.015625 0.402343 -1.414063 0.019531 l -3.300781 -3.242188 l -3.300781 3.242188 c -0.398438 0.382812 -1.03125 0.375 -1.417969 -0.019531 c -0.382812 -0.398438 -0.375 -1.03125 0.019531 -1.414063 z m 0 0", "key": "pi02oi" }]], "aliases": ["pan-up-symbolic"], "gtkIconName": "pan-up-symbolic" };
__iconData$2A.node;
const PanUp = createAdwaitaIcon(__iconData$2A);

const __iconData$2z = { "name": "pda", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 5 0 c -1.644531 0 -3 1.355469 -3 3 v 10 c 0 1.644531 1.355469 3 3 3 h 6 c 1.644531 0 3 -1.355469 3 -3 v -7.179688 l -2 1.992188 v 3.1875 c 0 0.554688 -0.445312 1 -1 1 h -6 c -0.554688 0 -1 -0.445312 -1 -1 v -8 c 0 -0.570312 0.429688 -1 1 -1 h 6 c 0.332031 0 0.617188 0.148438 0.796875 0.382812 l 1.402344 -1.40625 c -0.550781 -0.597656 -1.332031 -0.976562 -2.199219 -0.976562 z m 10 1 c -0.265625 0 -0.519531 0.105469 -0.703125 0.296875 l -0.003906 -0.003906 l -6.292969 6.316406 v 1.390625 h 1.390625 l 6.316406 -6.292969 l -0.003906 -0.003906 c 0.191406 -0.183594 0.296875 -0.4375 0.296875 -0.703125 c 0 -0.550781 -0.449219 -1 -1 -1 z m -7.523438 12 h 0.023438 h 1 c 0.277344 0 0.5 0.222656 0.5 0.5 s -0.222656 0.5 -0.5 0.5 h -1 c -0.277344 0 -0.5 -0.222656 -0.5 -0.5 c 0 -0.269531 0.210938 -0.488281 0.476562 -0.5 z m 0 0", "key": "1ccmd3" }]], "aliases": ["pda-symbolic"], "gtkIconName": "pda-symbolic" };
__iconData$2z.node;
const Pda = createAdwaitaIcon(__iconData$2z);

const __iconData$2y = { "name": "phone-apple-iphone", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 5 0 c -1.644531 0 -3 1.355469 -3 3 v 10 c 0 1.644531 1.355469 3 3 3 h 6 c 1.644531 0 3 -1.355469 3 -3 v -10 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 2 h 1 c 0 0.554688 0.445312 1 1 1 h 2 c 0.554688 0 1 -0.445312 1 -1 h 1 c 0.570312 0 1 0.429688 1 1 v 9 c 0 0.554688 -0.445312 1 -1 1 h -6 c -0.554688 0 -1 -0.445312 -1 -1 v -9 c 0 -0.570312 0.429688 -1 1 -1 z m 0 0", "key": "2zzsju" }]], "aliases": ["phone-apple-iphone-symbolic"], "gtkIconName": "phone-apple-iphone-symbolic" };
__iconData$2y.node;
const PhoneAppleIphone = createAdwaitaIcon(__iconData$2y);

const __iconData$2x = { "name": "phone-old", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M4.001 0c-1.01.005-1 1-1 1v12l.002.016v.136c0 1.024.857 1.848 1.92 1.848h5.158c1.063 0 1.92-.824 1.92-1.848V5c0-1.023-.937-2-2-2h-5V1s-.009-.994-1-1zm1.754 5H9.25a.75.75 0 01.752.752v1.496A.75.75 0 019.251 8H5.755a.75.75 0 01-.752-.752V5.752A.75.75 0 015.755 5zm-.252 5h1.143a.499.499 0 110 1H5.503a.499.499 0 110-1zm2.857 0h1.143a.499.499 0 110 1H8.36a.499.499 0 110-1zm-2.857 2h1.143a.499.499 0 110 1H5.503a.499.499 0 110-1zm2.857 0h1.143a.499.499 0 110 1H8.36a.499.499 0 110-1z", "key": "1pwm2o" }]], "aliases": ["phone-old-symbolic"], "gtkIconName": "phone-old-symbolic" };
__iconData$2x.node;
const PhoneOld = createAdwaitaIcon(__iconData$2x);

const __iconData$2w = { "name": "phone", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 5 0 c -1.644531 0 -3 1.355469 -3 3 v 10 c 0 1.644531 1.355469 3 3 3 h 6 c 1.644531 0 3 -1.355469 3 -3 v -10 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 2 h 6 c 0.570312 0 1 0.429688 1 1 v 10 c 0 0.554688 -0.445312 1 -1 1 h -6 c -0.554688 0 -1 -0.445312 -1 -1 v -10 c 0 -0.570312 0.429688 -1 1 -1 z m 0 0", "key": "1c49zl" }], ["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 5.5 12 c -0.277344 0 -0.5 0.222656 -0.5 0.5 s 0.222656 0.5 0.5 0.5 h 5 c 0.277344 0 0.5 -0.222656 0.5 -0.5 s -0.222656 -0.5 -0.5 -0.5 z m 0 0", "key": "odwi67" }]], "aliases": ["phone-symbolic"], "gtkIconName": "phone-symbolic" };
__iconData$2w.node;
const Phone = createAdwaitaIcon(__iconData$2w);

const __iconData$2v = { "name": "power-profile-balanced", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3.5 0 c -0.257812 0 -0.515625 0.101562 -0.707031 0.292969 l -2.5 2.5 c -0.3906252 0.390625 -0.3906252 1.027343 0 1.414062 l 2.5 2.5 c 0.386719 0.390625 1.023437 0.390625 1.414062 0 l 2.5 -2.5 c 0.386719 -0.386719 0.386719 -1.023437 0 -1.414062 l -2.5 -2.5 c -0.195312 -0.191407 -0.453125 -0.292969 -0.707031 -0.292969 z m 0 1.996094 l 1.503906 1.503906 l -1.503906 1.503906 l -1.507812 -1.503906 z m 0 0", "key": "c78ft9" }], ["path", { "fill": "currentColor", "d": "m 12.5 0 c -1.933594 0 -3.5 1.566406 -3.496094 3.496094 c -0.003906 1.933594 1.5625 3.5 3.496094 3.5 s 3.5 -1.566406 3.5 -3.5 c 0 -1.929688 -1.566406 -3.496094 -3.5 -3.496094 z m 0 1.996094 c 0.828125 0 1.5 0.671875 1.503906 1.5 c -0.003906 0.832031 -0.675781 1.503906 -1.503906 1.503906 s -1.5 -0.671875 -1.5 -1.503906 c 0 -0.828125 0.671875 -1.5 1.5 -1.5 z m 0 0", "key": "1ad7dy" }], ["path", { "fill": "currentColor", "d": "m 7.933594 8.996094 c -0.335938 0.019531 -0.640625 0.207031 -0.808594 0.496094 l -2.320312 4 c -0.386719 0.667968 0.089843 1.503906 0.863281 1.503906 h 4.644531 c 0.769531 0 1.246094 -0.835938 0.863281 -1.503906 l -2.320312 -4 c -0.191407 -0.324219 -0.546875 -0.515626 -0.921875 -0.496094 z m 0 0", "key": "1us7zi" }], ["path", { "fill": "currentColor", "d": "m 1.996094 6.996094 h 12 c 0.554687 0 1 0.449218 1 1 c 0 0.550781 -0.445313 1 -1 1 h -12 c -0.550782 0 -1 -0.449219 -1 -1 c 0 -0.550782 0.449218 -1 1 -1 z m 0 0", "key": "19ltb3" }]], "aliases": ["power-profile-balanced-symbolic"], "gtkIconName": "power-profile-balanced-symbolic" };
__iconData$2v.node;
const PowerProfileBalanced = createAdwaitaIcon(__iconData$2v);

const __iconData$2u = { "name": "power-profile-performance", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 16 9.972656 c 0 -2.855468 -1.515625 -5.539062 -4 -6.972656 c -2.472656 -1.429688 -5.527344 -1.429688 -8 0 c -2.484375 1.433594 -4 4.117188 -4 6.972656 c 0 0.550782 0.449219 1 1 1 h 1 c 0.550781 0 1 -0.449218 1 -1 c -0.03125 -0.433594 -0.335938 -0.796875 -0.761719 -0.898437 c 0.285157 -1.78125 1.1875 -3.433594 2.761719 -4.339844 c 1.859375 -1.074219 4.140625 -1.074219 6 0 c 1.574219 0.90625 2.476562 2.558594 2.761719 4.339844 c -0.425781 0.101562 -0.730469 0.464843 -0.761719 0.898437 c 0 0.550782 0.449219 1 1 1 h 1 c 0.550781 0 1 -0.449218 1 -1 z m 0 0", "key": "1sbu7g" }], ["path", { "fill": "currentColor", "d": "m 11 5.667969 l -4.480469 4.972656 c -0.007812 0.007813 -0.015625 0.015625 -0.023437 0.027344 c -0.125 0.136719 -0.226563 0.292969 -0.308594 0.460937 c -0.472656 1 -0.046875 2.191406 0.949219 2.667969 c 0.996093 0.472656 2.191406 0.046875 2.664062 -0.949219 c 0.070313 -0.148437 0.121094 -0.304687 0.152344 -0.464844 h 0.003906 l 0.007813 -0.054687 l 0.007812 -0.042969 c 0.003906 -0.011718 0.003906 -0.023437 0.003906 -0.035156 z m 0 0", "key": "14ojni" }]], "aliases": ["power-profile-performance-symbolic"], "gtkIconName": "power-profile-performance-symbolic" };
__iconData$2u.node;
const PowerProfilePerformance = createAdwaitaIcon(__iconData$2u);

const __iconData$2t = { "name": "power-profile-power-saver", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 0.84375 15.398438 l 10.5 -10 c 0.199219 -0.1875 0.207031 -0.503907 0.019531 -0.707032 c -0.191406 -0.199218 -0.507812 -0.207031 -0.707031 -0.015625 l -10.5 10 c -0.1992188 0.191407 -0.2070312 0.507813 -0.019531 0.707031 c 0.191406 0.199219 0.507812 0.207032 0.707031 0.015626 z m 0 0", "key": "1st93m" }], ["path", { "fill": "currentColor", "d": "m 5.5 11.039062 h 4 c 0.277344 0 0.5 -0.226562 0.5 -0.5 c 0 -0.277343 -0.222656 -0.5 -0.5 -0.5 h -4 c -0.277344 0 -0.5 0.222657 -0.5 0.5 c 0 0.273438 0.222656 0.5 0.5 0.5 z m 0 0", "key": "joeobk" }], ["path", { "fill": "currentColor", "d": "m 8 8.460938 v -2.921876 c 0 -0.277343 -0.222656 -0.5 -0.5 -0.5 s -0.5 0.222657 -0.5 0.5 v 2.921876 c 0 0.277343 0.222656 0.5 0.5 0.5 s 0.5 -0.222657 0.5 -0.5 z m 0 0", "key": "1jyzhu" }], ["path", { "fill": "currentColor", "d": "m 1 16 h 7 c 4.414062 0 8 -3.585938 8 -8 v -7 c 0 -0.550781 -0.449219 -1 -1 -1 h -7 c -4.414062 0 -8 3.585938 -8 8 v 3 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -3 c 0 -3.324219 2.675781 -6 6 -6 h 7 l -1 -1 v 7 c 0 3.324219 -2.675781 6 -6 6 h -7 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 z m 0 0", "key": "1olq2p" }]], "aliases": ["power-profile-power-saver-symbolic"], "gtkIconName": "power-profile-power-saver-symbolic" };
__iconData$2t.node;
const PowerProfilePowerSaver = createAdwaitaIcon(__iconData$2t);

const __iconData$2s = { "name": "preferences-color", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M8 1C5.797 1 4 2.797 4 5c0 2.203 1.797 4 4 4 2.203 0 4-1.797 4-4 0-2.203-1.797-4-4-4zm0 1.066A2.926 2.926 0 0110.934 5 2.926 2.926 0 018 7.934 2.926 2.926 0 015.067 5 2.926 2.926 0 018 2.066z", "key": "u3o4hd" }], ["path", { "fill": "currentColor", "d": "M4 8c-2.203 0-4 1.797-4 4 0 2.203 1.797 4 4 4 2.203 0 4-1.797 4-4 0-2.203-1.797-4-4-4zm0 1.066A2.926 2.926 0 016.934 12 2.926 2.926 0 014 14.934 2.926 2.926 0 011.067 12 2.926 2.926 0 014 9.066z", "key": "u34a4c" }], ["path", { "fill": "currentColor", "d": "M15.998 12A4 4 0 0112 16a4 4 0 01-4-4 4 4 0 014-4 4 4 0 013.998 4z", "key": "1p0e6u" }], ["path", { "fill": "currentColor", "stroke-width": "0.999996", "opacity": "0.5", "d": "M 6.934,12 A 2.9339231,2.9339231 0 0 1 4.0000769,14.933923 2.9339231,2.9339231 0 0 1 1.067,12 2.9339231,2.9339231 0 0 1 4.0000769,9.0660769 2.9339231,2.9339231 0 0 1 6.934,12 Z", "key": "95zgex" }]], "aliases": ["preferences-color-symbolic"], "gtkIconName": "preferences-color-symbolic" };
__iconData$2s.node;
const PreferencesColor = createAdwaitaIcon(__iconData$2s);

const __iconData$2r = { "name": "preferences-desktop-accessibility", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M8.017 0a8 8 0 100 16 8 8 0 000-16zm0 2a2 2 0 110 4 2 2 0 010-4zM3.51 6c.016 0 .032 0 .048.002 0 0 3.015.248 4.46.248 1.444 0 4.458-.248 4.458-.248a.5.5 0 01.395.852c-.193.193-.293.182-.426.22a16.18 16.18 0 01-2.428.426c.05 1.877.084 3.307.354 4.2.15.492.297.853.41 1.113.057.13.104.233.143.326.039.092.093.121.093.361a.5.5 0 01-.853.354c-.228-.229-.4-.527-.64-.936a37.549 37.549 0 01-.76-1.371c-.399-.747-.614-1.18-.747-1.443-.132.262-.347.696-.746 1.443-.252.472-.519.962-.76 1.371-.24.409-.412.707-.64.936a.5.5 0 01-.854-.354c0-.24.055-.269.094-.361l.143-.327c.113-.26.26-.62.41-1.113.27-.892.304-2.322.353-4.199-.9-.07-1.517-.235-2.427-.426-.133-.038-.233-.027-.426-.22A.5.5 0 013.51 6z", "key": "194a70" }]], "aliases": ["preferences-desktop-accessibility-symbolic"], "gtkIconName": "preferences-desktop-accessibility-symbolic" };
__iconData$2r.node;
const PreferencesDesktopAccessibility = createAdwaitaIcon(__iconData$2r);

const __iconData$2q = { "name": "preferences-desktop-apps", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M1 0C.446 0 0 .446 0 1v5c0 .554.446 1 1 1h5c.554 0 1-.446 1-1V1c0-.554-.446-1-1-1zm1 3h3v2H2zm7-3c-.554 0-1 .446-1 1v5c0 .554.446 1 1 1h5c.554 0 1-.446 1-1V1c0-.554-.446-1-1-1zm1 3h3v2h-3zM1 8c-.554 0-1 .446-1 1v5c0 .554.446 1 1 1h5c.554 0 1-.446 1-1V9c0-.554-.446-1-1-1zm1 3h3v2H2zm7-3c-.554 0-1 .446-1 1v5c0 .554.446 1 1 1h5c.554 0 1-.446 1-1V9c0-.554-.446-1-1-1zm1 3h3v2h-3z", "key": "1yjmc3" }]], "aliases": ["preferences-desktop-apps-symbolic"], "gtkIconName": "preferences-desktop-apps-symbolic" };
__iconData$2q.node;
const PreferencesDesktopApps = createAdwaitaIcon(__iconData$2q);

const __iconData$2p = { "name": "preferences-desktop-display", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M12 1c1.662 0 3 1.338 3 3v6c0 1.662-1.338 3-3 3H4c-1.662 0-3-1.338-3-3V4c0-1.662 1.338-3 3-3zm0 2H4c-.554 0-1 .446-1 1v6c0 .554.446 1 1 1h8c.554 0 1-.446 1-1V4c0-.554-.446-1-1-1zM8 14c-5 0-5 1-5 1 0 1 1 1 1 1h8c1 0 1-1 1-1s0-1-5-1z", "key": "1yb25o" }]], "aliases": ["preferences-desktop-display-symbolic"], "gtkIconName": "preferences-desktop-display-symbolic" };
__iconData$2p.node;
const PreferencesDesktopDisplay = createAdwaitaIcon(__iconData$2p);

const __iconData$2o = { "name": "preferences-desktop-font", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M3 5.012v2h1.92c-.055 0 .084.159.084.082v.924H4c-1.716 0-3.03 1.125-3.055 2.484-.012.68.306 1.363.862 1.822.555.46 1.315.7 2.193.7h3.004v-5.93c0-1.171-.887-2.082-2.084-2.082zm1 5.006h1.004v1.005H4c-.52 0-.794-.137-.92-.242-.126-.104-.136-.172-.135-.244.003-.144.085-.52 1.055-.52zM7.996 4v9.023H11c.939 0 1.769-.372 2.299-.959.53-.586.766-1.336.756-2.066a3.079 3.079 0 00-.791-2.043C12.737 7.378 11.92 7 11 7H9.996V4zm2 5H11c.422 0 .626.126.787.303.162.177.264.447.268.722.004.276-.089.53-.24.698-.152.167-.356.3-.815.3H9.996z", "key": "17py8y" }]], "aliases": ["preferences-desktop-font-symbolic"], "gtkIconName": "preferences-desktop-font-symbolic" };
__iconData$2o.node;
const PreferencesDesktopFont = createAdwaitaIcon(__iconData$2o);

const __iconData$2n = { "name": "preferences-desktop-keyboard-shortcuts", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M1.502 8C.67 8 0 8.669 0 9.5v4c0 .831.67 1.5 1.502 1.5h9.01c.832 0 1.502-.669 1.502-1.5v-4c0-.831-.67-1.5-1.502-1.5zm.062 1c3.186.269 6.116.23 8.885 0 .303-.025.564.26.564.563v2.874c0 .303-.262.529-.564.563-3.004.34-5.964.327-8.885 0-.301-.034-.563-.26-.563-.563V9.563c0-.303.261-.588.563-.563zM9.51 0c-.831 0-1.5.669-1.5 1.5v4c0 .831.669 1.5 1.5 1.5h4.005c.832 0 1.502-.669 1.502-1.5v-4c0-.831-.67-1.5-1.502-1.5zm.063 1a20.12 20.12 0 003.88 0c.302-.029.563.26.563.563v2.875c0 .302-.262.525-.563.562-1.255.154-2.542.18-3.88 0-.3-.04-.563-.26-.563-.563V1.563c0-.302.262-.592.563-.562zM1.502 1C.67 1 0 1.669 0 2.5v3C0 6.331.67 7 1.502 7h4.004c.832 0 1.502-.669 1.502-1.5v-3c0-.831-.67-1.5-1.502-1.5zm.062 1c1.692.2 2.848.13 3.88 0 .3-.038.563.26.563.563v2.874c0 .303-.262.524-.563.563a15.109 15.109 0 01-3.88 0c-.3-.038-.563-.26-.563-.563V2.563c0-.302.262-.597.563-.562z", "key": "73mfq1" }]], "aliases": ["preferences-desktop-keyboard-shortcuts-symbolic"], "gtkIconName": "preferences-desktop-keyboard-shortcuts-symbolic" };
__iconData$2n.node;
const PreferencesDesktopKeyboardShortcuts = createAdwaitaIcon(__iconData$2n);

const __iconData$2m = { "name": "preferences-desktop-keyboard", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M1 2c-.554 0-1 .446-1 1v11c0 .554.446 1 1 1h13.006c.554 0 1-.446 1-1V3c0-.554-.446-1-1-1zm1.365 2h1.656v2h-2V4.393c0-.218.154-.393.344-.393zm2.656 0h2v2h-2zm3 0h2v2h-2zm3 0h1.657c.19 0 .343.175.343.393V6h-2zm-8 3h2v2h-2zm3 0h2v2h-2zm3 0h2v2h-2zm-6.656 4h10.313c.19 0 .343.175.343.393v1.214c0 .218-.153.393-.343.393H2.365c-.19 0-.344-.175-.344-.393v-1.214c0-.218.154-.393.344-.393z", "key": "s3v96t" }]], "aliases": ["preferences-desktop-keyboard-symbolic"], "gtkIconName": "preferences-desktop-keyboard-symbolic" };
__iconData$2m.node;
const PreferencesDesktopKeyboard = createAdwaitaIcon(__iconData$2m);

const __iconData$2l = { "name": "preferences-desktop-locale", "size": 16, "node": [["path", { "fill": "currentColor", "fill-rule": "evenodd", "d": "M2 1v14h2V1z", "key": "1mxlll" }], ["path", { "fill": "currentColor", "fill-rule": "evenodd", "d": "M3 1a1 1 0 00-1 1v6a1 1 0 001 1h3.383l.722 1.447A1 1 0 008 11h5a1 1 0 001-1V4a1 1 0 00-1-1H9.617l-.722-1.447A1 1 0 008 1zm1 2h3.383l.722 1.447A1 1 0 009 5h3v4H8.617l-.722-1.447A1 1 0 007 7H4z", "key": "18t4rf" }], ["path", { "fill": "currentColor", "fill-rule": "evenodd", "d": "M3 8h4l1 2h5V4H9L8 2H3z", "key": "dmvc86" }]], "aliases": ["preferences-desktop-locale-symbolic"], "gtkIconName": "preferences-desktop-locale-symbolic" };
__iconData$2l.node;
const PreferencesDesktopLocale = createAdwaitaIcon(__iconData$2l);

const __iconData$2k = { "name": "preferences-desktop-multitasking", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 6 0 c -1.644531 0 -3 1.355469 -3 3 v 10 c 0 1.644531 1.355469 3 3 3 h 4 c 1.644531 0 3 -1.355469 3 -3 v -10 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 2 h 4 c 0.570312 0 1 0.429688 1 1 v 10 c 0 0.570312 -0.429688 1 -1 1 h -4 c -0.570312 0 -1 -0.429688 -1 -1 v -10 c 0 -0.570312 0.429688 -1 1 -1 z m -5 1 c -0.554688 0 -1 0.445312 -1 1 v 8 c 0 0.554688 0.445312 1 1 1 s 1 -0.445312 1 -1 v -8 c 0 -0.554688 -0.445312 -1 -1 -1 z m 14 0 c -0.554688 0 -1 0.445312 -1 1 v 8 c 0 0.554688 0.445312 1 1 1 s 1 -0.445312 1 -1 v -8 c 0 -0.554688 -0.445312 -1 -1 -1 z m 0 0", "key": "5uh4yb" }]], "aliases": ["preferences-desktop-multitasking-symbolic"], "gtkIconName": "preferences-desktop-multitasking-symbolic" };
__iconData$2k.node;
const PreferencesDesktopMultitasking = createAdwaitaIcon(__iconData$2k);

const __iconData$2j = { "name": "preferences-desktop-remote-desktop", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M12 1c1.662 0 3 1.338 3 3v6c0 1.662-1.338 3-3 3H4c-1.662 0-3-1.338-3-3V4c0-1.662 1.338-3 3-3zm0 2H4c-.554 0-1 .446-1 1v6c0 .554.446 1 1 1h8c.554 0 1-.446 1-1V4c0-.554-.446-1-1-1zM8 14c-5 0-5 1-5 1 0 1 1 1 1 1h8c1 0 1-1 1-1s0-1-5-1z", "key": "1yb25o" }], ["path", { "fill": "currentColor", "d": "M4.5 5S4 5 4 5.5v4c0 .5.5.5.5.5h4c.5 0 .5-.5.5-.5v-4C9 5 8.563 5 8.5 5zM5 6.998h3v2H5zM10.5 4s-.5 0-.5.5v.984s0 .5.5.5l1 .001s.5 0 .5-.5v-.984s0-.5-.5-.5z", "key": "18acp4" }]], "aliases": ["preferences-desktop-remote-desktop-symbolic"], "gtkIconName": "preferences-desktop-remote-desktop-symbolic" };
__iconData$2j.node;
const PreferencesDesktopRemoteDesktop = createAdwaitaIcon(__iconData$2j);

const __iconData$2i = { "name": "preferences-desktop-screensaver", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M12.109 5c.62.75.995 1.71.995 2.76a4.344 4.344 0 01-4.344 4.344c-1.05 0-2.01-.376-2.76-.995A5.055 5.055 0 0010.932 15 5.068 5.068 0 0016 9.932 5.055 5.055 0 0012.109 5zM6.511 1.79c.4 0 .721.322.721.721a.72.72 0 01-.72.721.72.72 0 01-.722-.72c0-.4.322-.722.721-.722zm4 1.023a.697.697 0 110 1.398.697.697 0 01-.699-.7c0-.387.312-.698.7-.698zm-3 1.977c.4 0 .721.322.721.721a.72.72 0 01-.72.721.72.72 0 01-.722-.72c0-.4.322-.722.721-.722z", "key": "1kdnei" }], ["path", { "fill": "currentColor", "d": "M3.505 7.505L2.76 5.25.505 4.505 2.76 3.76l.745-2.255.745 2.255 2.255.745-2.255.745z", "key": "g9u84w" }]], "aliases": ["preferences-desktop-screensaver-symbolic"], "gtkIconName": "preferences-desktop-screensaver-symbolic" };
__iconData$2i.node;
const PreferencesDesktopScreensaver = createAdwaitaIcon(__iconData$2i);

const __iconData$2h = { "name": "preferences-desktop-wallpaper", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M1.063 1.031a1 1 0 00-1 1v12a1 1 0 001 1H15.03a1 1 0 001-1v-12a1 1 0 00-1-1zm1 2H14.03v10H2.062z", "key": "hpnlqg" }], ["path", { "fill": "currentColor", "d": "M9.406 7.969a1.919 1.919 0 00-1.474.676c-.2.234-.315.474-.418.664-.102.187-.2.342-.305.449a.87.87 0 01-.363.222h-.002c-.133.04-.313.051-.532.051h-5.28v1h5.28c.236 0 .518-.002.82-.093.303-.092.575-.258.792-.479a2.88 2.88 0 00.469-.672c.114-.21.205-.382.3-.494a.966.966 0 01.71-.324c.262 0 .546.131.724.332.105.118.205.296.33.51.127.215.278.455.502.671.226.22.503.384.81.473.308.09.596.092.84.092l2.422-.016v-1l-2.422.016a2.091 2.091 0 01-.56-.053.96.96 0 01-.395-.23 2.205 2.205 0 01-.334-.461c-.113-.192-.24-.433-.447-.666a1.979 1.979 0 00-1.467-.668zM5.531 5.031c-.822 0-1.5.678-1.5 1.5 0 .823.678 1.5 1.5 1.5.823 0 1.5-.677 1.5-1.5 0-.822-.677-1.5-1.5-1.5zm0 1c.282 0 .5.218.5.5 0 .282-.218.5-.5.5a.493.493 0 01-.5-.5c0-.282.218-.5.5-.5z", "key": "ya2fw0" }]], "aliases": ["preferences-desktop-wallpaper-symbolic"], "gtkIconName": "preferences-desktop-wallpaper-symbolic" };
__iconData$2h.node;
const PreferencesDesktopWallpaper = createAdwaitaIcon(__iconData$2h);

const __iconData$2g = { "name": "preferences-other", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 12.503906 0.0234375 c -0.292968 -0.0039063 -0.59375 0.0195313 -0.882812 0.0937505 c -1.867188 0.488281 -2.984375 2.382812 -2.496094 4.234374 c 0.101562 0.386719 0.289062 0.742188 0.5 1.054688 c -0.109375 0.015625 -1.625 2.59375 -1.625 2.59375 l 3.410156 0.023438 l 0.800782 -1.117188 c 0.378906 0.03125 0.78125 0.023438 1.171874 -0.078125 c 1.863282 -0.484375 2.980469 -2.382813 2.496094 -4.234375 c -0.105468 -0.386719 -0.292968 -0.738281 -0.503906 -1.054688 l -1.359375 2.304688 c -0.28125 0.476562 -0.882813 0.632812 -1.355469 0.355469 l -0.875 -0.507813 c -0.476562 -0.277344 -0.636718 -0.875 -0.355468 -1.347656 l 1.363281 -2.3085938 c -0.097657 -0.0039062 -0.195313 -0.0117187 -0.289063 -0.0117187 z m -8.875 0.6914065 c -0.011718 0 -0.019531 0 -0.027344 0.003906 c -0.230468 0.046875 -0.445312 0.132812 -0.65625 0.21875 c -0.019531 0.625 0.085938 1.441406 -0.15625 1.65625 c -0.242187 0.210938 -1.039062 0.035156 -1.652343 -0.03125 c -0.132813 0.238281 -0.238281 0.484375 -0.3125 0.75 c 0.476562 0.394531 1.136719 0.839844 1.152343 1.15625 c 0.015626 0.320312 -0.625 0.804688 -1.058593 1.25 c 0.101562 0.257812 0.25 0.492188 0.40625 0.71875 c 0.605469 -0.125 1.359375 -0.375 1.621093 -0.1875 c 0.261719 0.1875 0.261719 1.003906 0.34375 1.625 c 0.246094 0.074219 0.507813 0.105469 0.777344 0.125 c 0.28125 -0.554688 0.566406 -1.320312 0.875 -1.40625 c 0.316406 -0.089844 0.960938 0.457031 1.5 0.78125 c 0.214844 -0.152344 0.410156 -0.335938 0.589844 -0.53125 c -0.253906 -0.574219 -0.71875 -1.292969 -0.589844 -1.59375 c 0.125 -0.300781 0.96875 -0.46875 1.558594 -0.6875 c 0.003906 -0.074219 0.03125 -0.144531 0.03125 -0.21875 c 0 -0.191406 -0.035156 -0.378906 -0.0625 -0.5625 c -0.605469 -0.160156 -1.464844 -0.242188 -1.621094 -0.53125 c -0.160156 -0.289062 0.238282 -1.0625 0.433594 -1.65625 c -0.199219 -0.179688 -0.417969 -0.335938 -0.652344 -0.46875 c -0.503906 0.375 -1.085937 0.996094 -1.40625 0.9375 c -0.316406 -0.054688 -0.660156 -0.820312 -0.996094 -1.34375 c -0.03125 0.003906 -0.066406 0 -0.097656 -0.003906 z m 0.59375 1.878906 c 0.929688 0 1.6875 0.753906 1.6875 1.6875 s -0.757812 1.6875 -1.6875 1.6875 c -0.929687 0 -1.683594 -0.753906 -1.683594 -1.6875 s 0.753907 -1.6875 1.683594 -1.6875 z m 8.621094 6.332031 c -0.144531 0 -0.273438 0.023438 -0.359375 0.074219 h -9.050781 c -0.246094 -0.105469 -0.746094 -0.046875 -0.964844 0.179688 l -2.160156 2.113281 c -0.191406 0.175781 -0.3007815 0.484375 -0.30468775 0.707031 c -0.05468745 0.886719 0.99999975 1.320312 1.63671875 0.792969 l 1.363281 -1.332031 l 0.003906 3.539062 c 0 0.570312 0.457032 1 0.996094 1 h 7.992188 c 0.523437 0 0.996094 -0.445312 0.996094 -0.9375 l -0.003907 -3.601562 l 1.335938 1.308593 c 0.636719 0.527344 1.6875 0.09375 1.636719 -0.792969 c -0.003907 -0.222656 -0.113282 -0.53125 -0.300782 -0.703124 l -2.164062 -2.117188 c -0.144532 -0.152344 -0.417969 -0.226562 -0.652344 -0.230469 z m 0 0", "key": "oh13sm" }]], "aliases": ["preferences-other-symbolic"], "gtkIconName": "preferences-other-symbolic" };
__iconData$2g.node;
const PreferencesOther = createAdwaitaIcon(__iconData$2g);

const __iconData$2f = { "name": "preferences-system-details", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M3.288 1.969c-.742 0-1.32.577-1.32 1.32v9.423c0 .742.578 1.32 1.32 1.32h9.424c.742 0 1.32-.578 1.32-1.32V3.288c0-.742-.578-1.32-1.32-1.32zM7 4h2v2H7zm0 3h2v5H7z", "key": "v0pr7y" }]], "aliases": ["preferences-system-details-symbolic"], "gtkIconName": "preferences-system-details-symbolic" };
__iconData$2f.node;
const PreferencesSystemDetails = createAdwaitaIcon(__iconData$2f);

const __iconData$2e = { "name": "preferences-system-devices", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M9 6c-1.09 0-2 .91-2 2v3c0 1.09.91 2 2 2h5c1.09 0 2-.91 2-2V8c0-1.09-.91-2-2-2zm0 2h5v3H9z", "key": "19epx3" }], ["path", { "fill": "currentColor", "d": "M11.5 15C9 15 9 14.5 9 14.5c0-.5.5-.5.5-.5h4c.5 0 .5.5.5.5s0 .5-2.5.5zM3 1v1h5V1zM2 3c-.554 0-1 .446-1 1v2c0 .554.446 1 1 1V6h4.775A2.98 2.98 0 019 5h1V4c0-.554-.446-1-1-1H3zm1 4v3h3V8c0-.353.07-.686.182-1z", "key": "e3zmx6" }]], "aliases": ["preferences-system-devices-symbolic"], "gtkIconName": "preferences-system-devices-symbolic" };
__iconData$2e.node;
const PreferencesSystemDevices = createAdwaitaIcon(__iconData$2e);

const __iconData$2d = { "name": "preferences-system-network-proxy", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M4.96 8.635V11H1.367c-.206 0-.368.205-.368.467v1.058c0 .262.162.467.368.467h10.264c.206 0 .368-.205.368-.467v-1.058c0-.262-.162-.467-.368-.467H7.977V8.635z", "key": "1xlarq" }], ["path", { "fill": "currentColor", "d": "M3.8 0C2.849 0 2 .793 2 1.746v6.613c0 .953.849 1.746 1.868 1.746h5.264c1.02 0 1.868-.793 1.868-1.746V1.746C11 .793 10.151 0 9.132 0zM4 2h5c0 .317 0-.316 0 0v6H4s0 .044 0 0V2c0-.044 0 0 0 0z", "key": "1cu7ea" }], ["path", { "fill": "currentColor", "d": "M5 2.971h3v1.003H5zm2 2.005h1v1.002H7z", "key": "i66mt7" }], ["path", { "fill": "currentColor", "d": "M9.229 3c.07 0 0 .209 0 .476v1.078c0 .267.07.476.16.476h4.451c.09 0 .16-.209.16-.476V3.476c0-.267-.07-.476-.16-.476-.16 0-4.585.063-4.611 0zm-3.256 8.624c.08-.06.253.039.394.223l.573.747c.142.184.191.375.112.435l-3.935 2.954c-.08.059-.253-.039-.395-.224l-.573-.746c-.141-.184-.19-.376-.111-.435 0 0 3.946-2.893 3.935-2.954z", "key": "1eept6" }], ["path", { "fill": "currentColor", "d": "M7.027 11.624c-.08-.06-.253.039-.394.223l-.573.747c-.142.184-.191.375-.112.435l3.935 2.954c.08.059.253-.039.395-.224l.573-.746c.141-.184.19-.376.111-.435 0 0-3.946-2.893-3.935-2.954z", "key": "1s9vw2" }]], "aliases": ["preferences-system-network-proxy-symbolic"], "gtkIconName": "preferences-system-network-proxy-symbolic" };
__iconData$2d.node;
const PreferencesSystemNetworkProxy = createAdwaitaIcon(__iconData$2d);

const __iconData$2c = { "name": "preferences-system-network", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M1.75 4C.798 4 0 4.798 0 5.75v4.5C0 11.202.798 12 1.75 12h.125l-.781 1.563L.375 15h9.25l-.719-1.438L8.125 12h.125c.952 0 1.75-.798 1.75-1.75v-4.5C10 4.798 9.202 4 8.25 4zM2 6h6v4H2z", "key": "1pttzl" }], ["path", { "fill": "currentColor", "d": "M7.75 1C6.798 1 6 1.798 6 2.75V3h8v4h-3v3.25c0 .66-.252 1.27-.656 1.75h5.28l-1.5-3h.126C15.202 9 16 8.202 16 7.25v-4.5C16 1.798 15.202 1 14.25 1z", "key": "xaekam" }]], "aliases": ["preferences-system-network-symbolic"], "gtkIconName": "preferences-system-network-symbolic" };
__iconData$2c.node;
const PreferencesSystemNetwork = createAdwaitaIcon(__iconData$2c);

const __iconData$2b = { "name": "preferences-system-notifications", "size": 16, "node": [["path", { "d": "m 13.027344 11 c 0.324218 0 0.625 -0.15625 0.816406 -0.417969 c 0.1875 -0.265625 0.234375 -0.601562 0.128906 -0.90625 l -0.371094 -1.078125 c -0.398437 -1.15625 -0.601562 -2.375 -0.601562 -3.597656 h -1 h 1 c 0 -2.765625 -2.234375 -5 -5 -5 s -5 2.234375 -5 5 h 1 h -1 c 0 1.222656 -0.203125 2.441406 -0.601562 3.597656 l -0.371094 1.078125 c -0.105469 0.304688 -0.058594 0.640625 0.128906 0.90625 c 0.191406 0.261719 0.492188 0.417969 0.816406 0.417969 z m -8.738282 -1.75 c 0.46875 -1.367188 0.710938 -2.804688 0.710938 -4.25 h -1 h 1 c 0 -1.652344 1.347656 -3 3 -3 s 3 1.347656 3 3 h 1 h -1 c 0 1.445312 0.242188 2.882812 0.710938 4.25 l 0.371093 1.074219 l 0.945313 -1.324219 h -10.054688 l 0.945313 1.324219 z m 0 0", "key": "1bta40" }], ["path", { "d": "m 9.1875 12.417969 c -0.289062 0.371093 -0.738281 0.589843 -1.210938 0.582031 c -0.46875 -0.007812 -0.910156 -0.234375 -1.1875 -0.617188 c -0.328124 -0.445312 -0.953124 -0.542968 -1.398437 -0.21875 c -0.445313 0.328126 -0.542969 0.953126 -0.21875 1.398438 c 0.648437 0.890625 1.675781 1.421875 2.777344 1.4375 c 1.101562 0.015625 2.144531 -0.488281 2.816406 -1.355469 c 0.339844 -0.4375 0.261719 -1.066406 -0.175781 -1.40625 c -0.4375 -0.335937 -1.066406 -0.257812 -1.402344 0.179688 z m 0 0", "key": "1bhib3" }]], "aliases": ["preferences-system-notifications-symbolic"], "gtkIconName": "preferences-system-notifications-symbolic" };
__iconData$2b.node;
const PreferencesSystemNotifications = createAdwaitaIcon(__iconData$2b);

const __iconData$2a = { "name": "preferences-system-parental-controls", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "1", "stroke": "none", "stroke-width": "3.33333325", "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-dasharray": "none", "stroke-opacity": "1", "opacity": "1", "d": "m 200,490.5 a 2.5,2.5 0 0 1 -2.5,2.5 2.5,2.5 0 0 1 -2.5,-2.5 2.5,2.5 0 0 1 2.5,-2.5 2.5,2.5 0 0 1 2.5,2.5 z", "transform": "translate(-191.9899,-488)", "key": "1bgdfg" }], ["path", { "fill": "currentColor", "fill-opacity": "1", "stroke": "none", "stroke-width": "3.33333325", "stroke-linecap": "round", "stroke-linejoin": "miter", "stroke-dasharray": "none", "stroke-opacity": "1", "opacity": "1", "d": "m 204.5,493 c 1.385,0 2.5,1.115 2.5,2.5 0,1.385 -1.115,2.5 -2.5,2.5 -1.385,0 -2.5,-1.115 -2.5,-2.5 0,-1.385 1.115,-2.5 2.5,-2.5 z", "transform": "translate(-191.9899,-488)", "key": "ze9ozq" }], ["path", { "fill": "currentColor", "fill-opacity": "1", "fill-rule": "evenodd", "stroke": "none", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "miter", "stroke-dasharray": "none", "stroke-opacity": "1", "opacity": "1", "d": "m 202,499 c -1.35232,-0.0191 -1.35232,2.01913 0,2 h 1 v 2 c -1.2e-4,0.77087 0.83516,1.25205 1.50195,0.86523 0.66593,0.38233 1.49645,-0.0974 1.49805,-0.86523 v -0.13477 c 0.86619,0.49882 1.8477,-0.44122 1.38672,-1.32812 l -0.90474,-1.72832 C 206.16814,499.2652 205.8993,499 205,499 h -1 z", "transform": "translate(-191.9899,-488)", "key": "b6k57" }], ["path", { "fill": "currentColor", "fill-opacity": "1", "fill-rule": "evenodd", "stroke": "none", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "miter", "stroke-dasharray": "none", "stroke-opacity": "1", "opacity": "1", "d": "m 196.5293,494.48633 a 1.0001,1.0001 0 0 0 -1.01953,0.87305 L 195,498.92969 V 503 a 1.0001,1.0001 0 1 0 2,0 v -3.92969 l 0.49023,-3.42969 a 1.0001,1.0001 0 0 0 -0.96093,-1.15429 z", "transform": "translate(-191.9899,-488)", "key": "14xc5y" }], ["path", { "fill": "currentColor", "fill-opacity": "1", "fill-rule": "evenodd", "stroke": "none", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "miter", "stroke-dasharray": "none", "stroke-opacity": "1", "opacity": "1", "d": "m 198.54102,494.48633 a 1.0001,1.0001 0 0 0 -1.03125,1.15429 L 198,499.07031 V 503 a 1.0001,1.0001 0 1 0 2,0 v -4.07031 l -0.50977,-3.57031 a 1.0001,1.0001 0 0 0 -0.94921,-0.87305 z", "transform": "translate(-191.9899,-488)", "key": "kswund" }], ["path", { "fill": "currentColor", "fill-opacity": "1", "stroke": "none", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "miter", "stroke-dasharray": "none", "stroke-opacity": "1", "opacity": "1", "d": "m 196,495 h 3 v 7 h -1 v -1.5 c 0,0 0,-0.5 -0.5,-0.5 -0.5,0 -0.5,0.5 -0.5,0.5 v 1.5 h -1 z", "transform": "translate(-191.9899,-488)", "key": "1b2oxs" }], ["path", { "fill": "currentColor", "fill-opacity": "1", "fill-rule": "evenodd", "stroke": "none", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-dasharray": "none", "stroke-opacity": "1", "opacity": "1", "d": "m 196,494 a 1.0001,1.0001 0 0 0 -0.70703,0.29297 l -3,3 a 1.0001,1.0001 0 1 0 1.41406,1.41406 L 196.41406,496 h 1.93555 l 1.73633,3.90625 a 1.0002723,1.0002723 0 1 0 1.82812,-0.8125 l -2,-4.5 A 1.0001,1.0001 0 0 0 199,494 Z", "transform": "translate(-191.9899,-488)", "key": "1s40c7" }]], "aliases": ["preferences-system-parental-controls-symbolic"], "gtkIconName": "preferences-system-parental-controls-symbolic" };
__iconData$2a.node;
const PreferencesSystemParentalControls = createAdwaitaIcon(__iconData$2a);

const __iconData$29 = { "name": "preferences-system-privacy", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 c 0.554688 0 1 0.445312 1 1 v 6.5 s 0 0.5 0.5 0.5 s 0.5 -0.5 0.5 -0.5 v -4.5 c 0 -0.554688 0.445312 -1 1 -1 s 1 0.445312 1 1 v 8.5 c 0 0.5 0.5 0.5 0.5 0.5 l 1.792969 -1.707031 c 0.1875 -0.195313 0.445312 -0.300781 0.71875 -0.304688 c 1.082031 0.085938 1.144531 1.269531 0.695312 1.71875 l -3 3 c -0.707031 0.792969 -1.757812 1.289063 -2.707031 1.292969 h -6 c -3 0 -3 -3 -3 -3 v -8 c 0 -0.554688 0.445312 -1 1 -1 s 1 0.445312 1 1 v 3.5 s 0 0.5 0.5 0.5 s 0.5 -0.5 0.5 -0.5 v -6.5 c 0 -0.554688 0.445312 -1 1 -1 s 1 0.445312 1 1 v 5.5 s 0 0.5 0.5 0.5 s 0.5 -0.5 0.5 -0.5 v -6.5 c 0 -0.554688 0.445312 -1 1 -1 z m 0 0", "key": "13dr2y" }]], "aliases": ["preferences-system-privacy-symbolic"], "gtkIconName": "preferences-system-privacy-symbolic" };
__iconData$29.node;
const PreferencesSystemPrivacy = createAdwaitaIcon(__iconData$29);

const __iconData$28 = { "name": "preferences-system-search", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 10.804688 10 c -0.8125 0.144531 -1.105469 1.15625 -0.5 1.71875 l 3 3 c 0.957031 0.9375 2.363281 -0.5 1.40625 -1.4375 l -3 -3 c -0.238282 -0.242188 -0.578126 -0.347656 -0.90625 -0.28125 z m 0 0", "key": "voahmk" }], ["path", { "fill": "currentColor", "d": "m 6.5 0 c -3.578125 0 -6.5 2.921875 -6.5 6.5 s 2.921875 6.496094 6.5 6.496094 s 6.5 -2.917969 6.5 -6.496094 s -2.921875 -6.5 -6.5 -6.5 z m 0 2 c 2.496094 0 4.5 2.003906 4.5 4.5 s -2.003906 4.496094 -4.5 4.496094 s -4.5 -2 -4.5 -4.496094 s 2.003906 -4.5 4.5 -4.5 z m 0 0", "key": "2eb2a0" }]], "aliases": ["preferences-system-search-symbolic"], "gtkIconName": "preferences-system-search-symbolic" };
__iconData$28.node;
const PreferencesSystemSearch = createAdwaitaIcon(__iconData$28);

const __iconData$27 = { "name": "preferences-system-sharing", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M5.969 7.969A2.969 2.969 0 013 10.937 2.969 2.969 0 01.031 7.97 2.969 2.969 0 013.001 5a2.969 2.969 0 012.968 2.969zm9.969 5a2.969 2.969 0 01-2.97 2.969A2.969 2.969 0 0110 12.967 2.969 2.969 0 0112.969 10a2.969 2.969 0 012.969 2.969zm0-10a2.969 2.969 0 01-2.97 2.969A2.969 2.969 0 0110 2.967 2.969 2.969 0 0112.969 0a2.969 2.969 0 012.969 2.969z", "key": "13hawd" }], ["path", { "fill": "currentColor", "d": "M12.613 2.146L.748 7.924l11.854 5.969.9-1.788-8.248-4.15 8.234-4.012z", "key": "4l9ad8" }]], "aliases": ["preferences-system-sharing-symbolic"], "gtkIconName": "preferences-system-sharing-symbolic" };
__iconData$27.node;
const PreferencesSystemSharing = createAdwaitaIcon(__iconData$27);

const __iconData$26 = { "name": "preferences-system-time", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 c -4.40625 0 -8 3.59375 -8 8 s 3.59375 8 8 8 s 8 -3.59375 8 -8 s -3.59375 -8 -8 -8 z m 0 2 c 3.324219 0 6 2.671875 6 6 c 0 3.324219 -2.675781 6 -6 6 s -6 -2.675781 -6 -6 c 0 -3.328125 2.675781 -6 6 -6 z m 0 0", "key": "3lugod" }], ["path", { "fill": "currentColor", "d": "m 4.929688 4.953125 c -0.128907 0.003906 -0.257813 0.058594 -0.351563 0.152344 c -0.191406 0.195312 -0.1875 0.511719 0.007813 0.707031 l 3.113281 3.042969 c 0.105469 0.097656 0.246093 0.144531 0.386719 0.128906 h 2.914062 c 0.277344 0 0.5 -0.222656 0.5 -0.5 c 0 -0.273437 -0.222656 -0.5 -0.5 -0.5 h -2.761719 l -2.953125 -2.886719 c -0.09375 -0.09375 -0.222656 -0.144531 -0.355468 -0.144531 z m 0 0", "key": "bqjudl" }]], "aliases": ["preferences-system-time-symbolic"], "gtkIconName": "preferences-system-time-symbolic" };
__iconData$26.node;
const PreferencesSystemTime = createAdwaitaIcon(__iconData$26);

const __iconData$25 = { "name": "preferences-system", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 13.855469 0 l -1.539063 1.4375 c -0.453125 0.421875 -0.53125 1.148438 -0.269531 1.707031 l -5.886719 5.996094 c -0.011718 0 -0.019531 0 -0.03125 0 c -0.257812 -0.128906 -0.550781 -0.183594 -0.839844 -0.148437 c -0.328124 0.046874 -0.632812 0.199218 -0.867187 0.441406 l -3.945313 3.996094 c -0.3906245 0.375 -0.5468745 0.933593 -0.4062495 1.457031 c 0.1406255 0.523437 0.5546875 0.929687 1.0820315 1.058593 c 0.527344 0.132813 1.082031 -0.03125 1.453125 -0.425781 l 3.945312 -3.996093 c 0.472657 -0.453126 0.59375 -1.15625 0.296875 -1.738282 l 5.890625 -5.964844 c 0.558594 0.25 1.273438 0.148438 1.707031 -0.289062 l 1.414063 -1.5625 z m -10.308594 0.0898438 c -0.398437 0 -0.785156 0.0937502 -1.140625 0.2187502 l 1.882812 1.878906 c 0.390626 0.382812 0.390626 1 0 1.386719 l -0.710937 0.707031 c -0.386719 0.386719 -1 0.386719 -1.390625 0 l -1.882812 -1.878906 c -0.125 0.355468 -0.2187505 0.742187 -0.2187505 1.140625 c 0 1.90625 1.5507815 3.453125 3.4609375 3.453125 c 0.402344 0 0.789063 -0.09375 1.144531 -0.21875 l 1.175782 1.171875 h 0.058593 l 2.070313 -2.0625 l -1.203125 -1.203125 c 0.125 -0.359375 0.214843 -0.742188 0.214843 -1.140625 c 0 -1.90625 -1.546874 -3.4531252 -3.460937 -3.4531252 z m 6.550781 7.8906252 l -2.070312 2.066406 c 0.011718 0.027344 0.023437 0.058594 0.03125 0.089844 l 1.144531 1.140625 c -0.125 0.355468 -0.21875 0.742187 -0.21875 1.140625 c 0 1.902343 1.550781 3.449219 3.460937 3.449219 c 0.433594 0 0.855469 -0.101563 1.238282 -0.246094 l -2.007813 -2 c -0.386719 -0.386719 -0.386719 -1.035156 0 -1.417969 l 0.679688 -0.679687 c 0.195312 -0.191407 0.457031 -0.308594 0.710937 -0.308594 s 0.515625 0.117187 0.710938 0.308594 l 1.945312 1.941406 c 0.105469 -0.328125 0.183594 -0.683594 0.183594 -1.046875 c 0 -1.90625 -1.546875 -3.453125 -3.460938 -3.453125 c -0.398437 0 -0.785156 0.09375 -1.140624 0.21875 z m 0 0", "key": "n9qdtc" }]], "aliases": ["preferences-system-symbolic"], "gtkIconName": "preferences-system-symbolic" };
__iconData$25.node;
const PreferencesSystem = createAdwaitaIcon(__iconData$25);

const __iconData$24 = { "name": "printer-error", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 5 1 c -0.550781 0 -1 0.449219 -1 1 v 1 h 8 v -1 c 0 -0.550781 -0.449219 -1 -1 -1 z m -3 3 c -1.109375 0 -2 0.890625 -2 2 v 4 c 0 1.109375 0.890625 2 2 2 v 1 c 0 1.089844 0.910156 2 2 2 h 4.019531 c -0.445312 -0.589844 -0.757812 -1.273438 -0.90625 -2 h -3.113281 v -3 h 3.4375 c 0.789062 -1.816406 2.582031 -2.992188 4.5625 -3 c 1.574219 0 3.054688 0.742188 4 2 v -3 c 0 -1.109375 -0.890625 -2 -2 -2 z m 0 0", "key": "157qfd" }], ["path", { "fill": "#e01b24", "d": "m 12 8 c -2.210938 0 -4 1.789062 -4 4 s 1.789062 4 4 4 s 4 -1.789062 4 -4 s -1.789062 -4 -4 -4 z m -2 3 h 4 c 0.554688 0 1 0.445312 1 1 s -0.445312 1 -1 1 h -4 c -0.554688 0 -1 -0.445312 -1 -1 s 0.445312 -1 1 -1 z m 0 0", "key": "gcwb2i" }]], "aliases": ["printer-error-symbolic"], "gtkIconName": "printer-error-symbolic", "monochrome": false };
__iconData$24.node;
const PrinterError = createAdwaitaIcon(__iconData$24);

const __iconData$23 = { "name": "printer-network", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3.992188 0 c -1.085938 0 -2 0.910156 -2 2 v 3 c -1.109376 0 -2.0000005 0.890625 -2.0000005 2 v 1.984375 c 0 1.109375 0.8906245 2 2.0000005 2 h 4.992187 v 1.285156 c -0.292969 0.171875 -0.535156 0.414063 -0.710937 0.703125 h -3.285157 c -0.550781 0 -1 0.449219 -1 1 c 0 0.550782 0.449219 1 1 1 h 3.246094 c 0.355469 0.640625 1.023437 1.035156 1.753906 1.039063 c 0.730469 -0.003907 1.398438 -0.398438 1.75 -1.039063 h 3.261719 c 0.550781 0 1 -0.449218 1 -1 c 0 -0.550781 -0.449219 -1 -1 -1 h -3.292969 c -0.175781 -0.289062 -0.417969 -0.53125 -0.714843 -0.703125 v -1.285156 h 5 c 1.109374 0 2 -0.890625 2 -2 v -1.984375 c 0 -1.109375 -0.890626 -2 -2 -2 v -0.722656 c 0 -0.570313 -0.207032 -1.121094 -0.585938 -1.550782 l -1.820312 -2.046874 c -0.382813 -0.429688 -0.933594 -0.679688 -1.511719 -0.679688 z m 0 2 h 6.070312 l 1.929688 1.996094 v 2.019531 h -8 z m 3.988281 11 h 0.011719 c 0.554687 0.003906 1.003906 0.453125 1 1.003906 c 0.003906 0.558594 -0.449219 1.007813 -1.003907 1.007813 c -0.554687 0 -1.007812 -0.449219 -1.007812 -1.007813 c 0 -0.550781 0.449219 -1 1 -1.003906 z m 0 0", "key": "fvszvj" }]], "aliases": ["printer-network-symbolic"], "gtkIconName": "printer-network-symbolic" };
__iconData$23.node;
const PrinterNetwork = createAdwaitaIcon(__iconData$23);

const __iconData$22 = { "name": "printer-printing", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 5 1 c -0.550781 0 -1 0.449219 -1 1 v 1 h 8 v -1 c 0 -0.550781 -0.449219 -1 -1 -1 z m -3 3 c -1.109375 0 -2 0.890625 -2 2 v 4 c 0 1.109375 0.890625 2 2 2 v 1 c 0 1.089844 0.910156 2 2 2 h 8 c 1.089844 0 2 -0.910156 2 -2 v -1 c 1.109375 0 2 -0.890625 2 -2 v -4 c 0 -1.109375 -0.890625 -2 -2 -2 z m 2 6 h 8 v 3 h -8 z m 0 0", "key": "n66cx1" }]], "aliases": ["printer-printing-symbolic"], "gtkIconName": "printer-printing-symbolic" };
__iconData$22.node;
const PrinterPrinting = createAdwaitaIcon(__iconData$22);

const __iconData$21 = { "name": "printer-warning", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 5 1 c -0.550781 0 -1 0.449219 -1 1 v 1 h 8 v -1 c 0 -0.550781 -0.449219 -1 -1 -1 z m -3 3 c -1.109375 0 -2 0.890625 -2 2 v 4 c 0 1.109375 0.890625 2 2 2 v 1 c 0 1.089844 0.910156 2 2 2 h 3 v -2 h -3 v -3 h 3 v -3 h 9 v -1 c 0 -1.109375 -0.890625 -2 -2 -2 z m 0 0", "key": "opb5z9" }], ["path", { "fill": "#ff7800", "d": "m 9.5 8 c -0.832031 0 -1.5 0.667969 -1.5 1.5 v 5 c 0 0.832031 0.667969 1.5 1.5 1.5 h 5 c 0.832031 0 1.5 -0.667969 1.5 -1.5 v -5 c 0 -0.832031 -0.667969 -1.5 -1.5 -1.5 z m 1.5 1 h 2 v 2.5 s 0 0.5 -0.5 0.5 h -1 c -0.5 0 -0.5 -0.5 -0.5 -0.5 z m 0.5 4 h 1 c 0.277344 0 0.5 0.222656 0.5 0.5 v 1 c 0 0.277344 -0.222656 0.5 -0.5 0.5 h -1 c -0.277344 0 -0.5 -0.222656 -0.5 -0.5 v -1 c 0 -0.277344 0.222656 -0.5 0.5 -0.5 z m 0 0", "key": "3kuca" }]], "aliases": ["printer-warning-symbolic"], "gtkIconName": "printer-warning-symbolic", "monochrome": false };
__iconData$21.node;
const PrinterWarning = createAdwaitaIcon(__iconData$21);

const __iconData$20 = { "name": "printer", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 5 1 c -0.550781 0 -1 0.449219 -1 1 v 1 h 8 v -1 c 0 -0.550781 -0.449219 -1 -1 -1 z m -3 3 c -1.109375 0 -2 0.890625 -2 2 v 4 c 0 1.109375 0.890625 2 2 2 v 1 c 0 1.089844 0.910156 2 2 2 h 8 c 1.089844 0 2 -0.910156 2 -2 v -1 c 1.109375 0 2 -0.890625 2 -2 v -4 c 0 -1.109375 -0.890625 -2 -2 -2 z m 2 6 h 8 v 3 h -8 z m 0 0", "key": "n66cx1" }]], "aliases": ["printer-symbolic"], "gtkIconName": "printer-symbolic" };
__iconData$20.node;
const Printer = createAdwaitaIcon(__iconData$20);

const __iconData$1$ = { "name": "process-stop", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 2 c -0.265625 0 -0.519531 0.105469 -0.707031 0.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 l 4.292969 4.292969 l -4.292969 4.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 s 1.023437 0.390625 1.414062 0 l 4.292969 -4.292969 l 4.292969 4.292969 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 s 0.390625 -1.023437 0 -1.414062 l -4.292969 -4.292969 l 4.292969 -4.292969 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 s -0.519531 0.105469 -0.707031 0.292969 l -4.292969 4.292969 l -4.292969 -4.292969 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0 0", "key": "1yd4rl" }]], "aliases": ["process-stop-symbolic"], "gtkIconName": "process-stop-symbolic" };
__iconData$1$.node;
const ProcessStop = createAdwaitaIcon(__iconData$1$);

const __iconData$1_ = { "name": "radio-checked", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8.007812 0 c -4.40625 0 -7.9999995 3.59375 -7.9999995 8 s 3.5937495 8 7.9999995 8 s 8 -3.59375 8 -8 s -3.59375 -8 -8 -8 z m 0 2 c 3.320313 0 6 2.679688 6 6 s -2.679687 6 -6 6 c -3.320312 0 -6 -2.679688 -6 -6 s 2.679688 -6 6 -6 z m -0.007812 3 c -1.652344 0 -3 1.34375 -3 3 s 1.347656 3 3 3 c 1.65625 0 3 -1.34375 3 -3 s -1.34375 -3 -3 -3 z m 0 0", "key": "1mo18f" }]], "aliases": ["radio-checked-symbolic"], "gtkIconName": "radio-checked-symbolic" };
__iconData$1_.node;
const RadioChecked = createAdwaitaIcon(__iconData$1_);

const __iconData$1Z = { "name": "radio-mixed", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8.007812 0 c -4.40625 0 -7.9999995 3.59375 -7.9999995 8 s 3.5937495 8 7.9999995 8 s 8 -3.59375 8 -8 s -3.59375 -8 -8 -8 z m 0 2 c 3.320313 0 6 2.679688 6 6 s -2.679687 6 -6 6 c -3.320312 0 -6 -2.679688 -6 -6 s 2.679688 -6 6 -6 z m -3.003906 4 c -1.105468 0 -2 0.894531 -2 2 s 0.894532 2 2 2 h 6 c 1.101563 0 2 -0.894531 2 -2 s -0.898437 -2 -2 -2 z m 0 0", "key": "1i9yk4" }]], "aliases": ["radio-mixed-symbolic"], "gtkIconName": "radio-mixed-symbolic" };
__iconData$1Z.node;
const RadioMixed = createAdwaitaIcon(__iconData$1Z);

const __iconData$1Y = { "name": "radio", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8.007812 0 c -4.40625 0 -7.9999995 3.59375 -7.9999995 8 s 3.5937495 8 7.9999995 8 c 4.402344 0 8 -3.59375 8 -8 s -3.597656 -8 -8 -8 z m 0 2 c 3.320313 0 6 2.679688 6 6 s -2.679687 6 -6 6 c -3.320312 0 -6 -2.679688 -6 -6 s 2.679688 -6 6 -6 z m 0 0", "key": "1kwinl" }]], "aliases": ["radio-symbolic"], "gtkIconName": "radio-symbolic" };
__iconData$1Y.node;
const Radio = createAdwaitaIcon(__iconData$1Y);

const __iconData$1X = { "name": "rotation-allowed", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 6.976562 -0.0195312 c -0.800781 0.0078124 -1.59375 0.3125002 -2.203124 0.9101562 l -2.773438 2.707031 v -0.597656 c 0 -0.550781 -0.449219 -1 -1 -1 s -1 0.449219 -1 1 v 3 c 0 0.550781 0.449219 1 1 1 h 3 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 h -0.574219 l 2.753907 -2.707031 c 0.367187 -0.359375 1.246093 -0.367188 1.601562 -0.019531 l 5.519531 5.4375 c 0.390625 0.390624 1.023438 0.382812 1.410157 -0.011719 c 0.390624 -0.390625 0.382812 -1.023438 -0.007813 -1.410157 l -5.519531 -5.417968 c -0.613282 -0.601563 -1.410156 -0.8906252 -2.207032 -0.8906252 z m -4.828124 8.0312502 c -0.316407 -0.046875 -0.636719 0.058593 -0.859376 0.289062 c -0.386718 0.390625 -0.386718 1.023438 0.007813 1.410157 l 5.484375 5.378906 c 0.617188 0.609375 1.4375 0.875 2.242188 0.882812 c 0.804687 0.007813 1.636718 -0.246094 2.265624 -0.871094 l 2.710938 -2.6875 v 0.585938 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -3 c 0 -0.550781 -0.449219 -1 -1 -1 h -3 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 h 0.585938 l -2.710938 2.710938 c -0.15625 0.15625 -0.476562 0.285156 -0.832031 0.28125 c -0.355469 0 -0.691407 -0.140626 -0.863281 -0.304688 l -5.480469 -5.398438 c -0.148438 -0.148437 -0.339844 -0.246093 -0.550781 -0.277343 z m 0 0", "key": "qqnloc" }]], "aliases": ["rotation-allowed-symbolic"], "gtkIconName": "rotation-allowed-symbolic" };
__iconData$1X.node;
const RotationAllowed = createAdwaitaIcon(__iconData$1X);

const __iconData$1W = { "name": "rotation-locked", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 6.976562 0 c -0.800781 0.0078125 -1.59375 0.3125 -2.203124 0.910156 l -2.773438 2.707032 v -0.597657 c 0 -0.550781 -0.449219 -1 -1 -1 s -1 0.449219 -1 1 v 3 c 0 0.550781 0.449219 1 1 1 h 3 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 h -0.574219 l 2.753907 -2.707031 c 0.367187 -0.359375 1.246093 -0.367188 1.601562 -0.019531 l 5.519531 5.4375 c 0.390625 0.390625 1.023438 0.382812 1.410157 -0.011719 c 0.390624 -0.390625 0.382812 -1.023438 -0.007813 -1.410156 l -5.519531 -5.417969 c -0.613282 -0.601563 -1.410156 -0.890625 -2.207032 -0.890625 z m -4.945312 8.019531 c -0.277344 -0.007812 -0.546875 0.097657 -0.742188 0.300781 c -0.386718 0.390626 -0.386718 1.023438 0.007813 1.410157 l 5.484375 5.378906 c 0.613281 0.605469 1.421875 0.867187 2.21875 0.878906 v -1.976562 c -0.339844 -0.011719 -0.65625 -0.148438 -0.816406 -0.304688 l -5.480469 -5.398437 c -0.152344 -0.148438 -0.34375 -0.246094 -0.550781 -0.277344 c -0.042969 -0.007812 -0.082032 -0.007812 -0.121094 -0.011719 z m 0 0", "key": "xsrsy" }], ["path", { "fill": "currentColor", "d": "m 13 9.019531 c -1.097656 0 -2 0.902344 -2 2 v 1 h -1 v 4 h 6 v -4 h -1 v -1 c 0 -1.097656 -0.902344 -2 -2 -2 z m 0 1 c 0.5625 0 1 0.4375 1 1 v 1 h -2 v -1 c 0 -0.5625 0.4375 -1 1 -1 z m 0 0", "key": "1y302l" }]], "aliases": ["rotation-locked-symbolic"], "gtkIconName": "rotation-locked-symbolic" };
__iconData$1W.node;
const RotationLocked = createAdwaitaIcon(__iconData$1W);

const __iconData$1V = { "name": "scanner", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4 0 c -1.332031 0 -2.273438 0.8125 -2.644531 1.550781 c -0.371094 0.742188 -0.355469 1.449219 -0.355469 1.449219 v 3 h 2 v -3 c 0 -0.554688 0.445312 -1 1 -1 h 8 c 0.554688 0 1 0.445312 1 1 v 3 h 2 v -3 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 z m -4 7 v 2 h 16 v -2 z m 1 3 v 3 s -0.015625 0.707031 0.355469 1.449219 c 0.371093 0.738281 1.3125 1.550781 2.644531 1.550781 h 8 c 1.332031 0 2.273438 -0.8125 2.644531 -1.550781 c 0.371094 -0.742188 0.355469 -1.449219 0.355469 -1.449219 v -3 h -2 v 3 c 0 0.554688 -0.445312 1 -1 1 h -8 c -0.554688 0 -1 -0.445312 -1 -1 v -3 z m 0 0", "key": "16iad9" }], ["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 4 6 h 8 v -2 l -8 -1 z m 0 0", "key": "kf4za4" }]], "aliases": ["scanner-symbolic"], "gtkIconName": "scanner-symbolic" };
__iconData$1V.node;
const Scanner = createAdwaitaIcon(__iconData$1V);

const __iconData$1U = { "name": "screen-shared", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4 1 c -1.644531 0 -3 1.355469 -3 3 v 1 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -1 c 0 -0.5625 0.4375 -1 1 -1 h 9 c 0.5625 0 1 0.4375 1 1 v 7 c 0 0.5625 -0.4375 1 -1 1 h -3 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 h 3 c 1.644531 0 3 -1.355469 3 -3 v -7 c 0 -1.644531 -1.355469 -3 -3 -3 z m -3 6 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 c 2.773438 0 5 2.226562 5 5 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 c 0 -3.855469 -3.144531 -7 -7 -7 z m 0 3 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 c 1.117188 0 2 0.882812 2 2 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 c 0 -2.199219 -1.800781 -4 -4 -4 z m 0 3 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 s 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m 0 0", "key": "8hlxcm" }], ["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 4.5 4 c -0.277344 0 -0.5 0.222656 -0.5 0.5 v 1.738281 c 0 0.261719 0.144531 0.410157 0.359375 0.511719 c 1.738281 0.8125 3.144531 2.234375 3.933594 3.984375 c 0.085937 0.359375 0.4375 0.265625 0.4375 0.265625 h 3.769531 c 0.277344 0 0.5 -0.222656 0.5 -0.5 v -6 c 0 -0.277344 -0.222656 -0.5 -0.5 -0.5 z m 0 0", "key": "bfata5" }]], "aliases": ["screen-shared-symbolic"], "gtkIconName": "screen-shared-symbolic" };
__iconData$1U.node;
const ScreenShared = createAdwaitaIcon(__iconData$1U);

const __iconData$1T = { "name": "security-high", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 2 0 c -0.550781 0 -1 0.449219 -1 1 v 8 c 0 2.5 1.816406 4.246094 3.445312 5.332031 c 1.628907 1.085938 3.238282 1.617188 3.238282 1.617188 c 0.207031 0.070312 0.425781 0.070312 0.632812 0 c 0 0 1.609375 -0.53125 3.238282 -1.617188 c 1.628906 -1.085937 3.445312 -2.832031 3.445312 -5.332031 v -8 c 0 -0.550781 -0.449219 -1 -1 -1 z m 1 2 h 10 v 7 c 0 1.5 -1.183594 2.753906 -2.554688 3.667969 c -1.214843 0.808593 -2.179687 1.128906 -2.445312 1.226562 c -0.265625 -0.097656 -1.230469 -0.417969 -2.445312 -1.226562 c -1.371094 -0.914063 -2.554688 -2.167969 -2.554688 -3.667969 z m 1 1 v 6 c 0 1 0.867188 2.007812 2.109375 2.835938 c 0.933594 0.621093 1.472656 0.785156 1.890625 0.949218 c 0.417969 -0.164062 0.957031 -0.328125 1.890625 -0.949218 c 1.242187 -0.828126 2.109375 -1.835938 2.109375 -2.835938 v -6 z m 0 0", "key": "14puny" }]], "aliases": ["security-high-symbolic"], "gtkIconName": "security-high-symbolic" };
__iconData$1T.node;
const SecurityHigh = createAdwaitaIcon(__iconData$1T);

const __iconData$1S = { "name": "security-low", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 2 0 c -0.550781 0 -1 0.449219 -1 1 v 8 c 0 2.5 1.816406 4.246094 3.445312 5.332031 c 1.628907 1.085938 3.238282 1.617188 3.238282 1.617188 c 0.207031 0.070312 0.425781 0.070312 0.632812 0 c 0 0 1.609375 -0.53125 3.238282 -1.617188 c 1.628906 -1.085937 3.445312 -2.832031 3.445312 -5.332031 v -8 c 0 -0.550781 -0.449219 -1 -1 -1 z m 1 2 h 10 v 7 c 0 1.5 -1.183594 2.753906 -2.554688 3.667969 c -1.214843 0.808593 -2.179687 1.128906 -2.445312 1.226562 c -0.265625 -0.097656 -1.230469 -0.417969 -2.445312 -1.226562 c -1.371094 -0.914063 -2.554688 -2.167969 -2.554688 -3.667969 z m 0 0", "key": "1a8het" }]], "aliases": ["security-low-symbolic"], "gtkIconName": "security-low-symbolic" };
__iconData$1S.node;
const SecurityLow = createAdwaitaIcon(__iconData$1S);

const __iconData$1R = { "name": "security-medium-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 14 0 c 0.550781 0 1 0.449219 1 1 v 8 c 0 2.5 -1.816406 4.246094 -3.445312 5.332031 c -1.628907 1.085938 -3.238282 1.617188 -3.238282 1.617188 c -0.207031 0.070312 -0.429687 0.070312 -0.632812 0 c 0 0 -1.609375 -0.53125 -3.238282 -1.617188 c -1.628906 -1.085937 -3.445312 -2.832031 -3.445312 -5.332031 v -8 c 0 -0.550781 0.445312 -1 1 -1 z m -1 2 h -10 v 7 c 0 1.5 1.183594 2.753906 2.554688 3.667969 c 1.214843 0.808593 2.179687 1.128906 2.445312 1.226562 c 0.265625 -0.097656 1.230469 -0.417969 2.445312 -1.226562 c 1.371094 -0.914063 2.554688 -2.167969 2.554688 -3.667969 z m -1 1 v 6 c 0 1 -0.867188 2.007812 -2.109375 2.835938 c -0.933594 0.621093 -1.472656 0.785156 -1.890625 0.949218 v -9.785156 z m 0 0", "key": "1urb21" }]], "aliases": ["security-medium-rtl-symbolic"], "gtkIconName": "security-medium-rtl-symbolic" };
__iconData$1R.node;
const SecurityMediumRtl = createAdwaitaIcon(__iconData$1R);

const __iconData$1Q = { "name": "security-medium", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 2 0 c -0.550781 0 -1 0.449219 -1 1 v 8 c 0 2.5 1.816406 4.246094 3.445312 5.332031 c 1.628907 1.085938 3.238282 1.617188 3.238282 1.617188 c 0.207031 0.070312 0.425781 0.070312 0.632812 0 c 0 0 1.609375 -0.53125 3.238282 -1.617188 c 1.628906 -1.085937 3.445312 -2.832031 3.445312 -5.332031 v -8 c 0 -0.550781 -0.449219 -1 -1 -1 z m 1 2 h 10 v 7 c 0 1.5 -1.183594 2.753906 -2.554688 3.667969 c -1.214843 0.808593 -2.179687 1.128906 -2.445312 1.226562 c -0.265625 -0.097656 -1.230469 -0.417969 -2.445312 -1.226562 c -1.371094 -0.914063 -2.554688 -2.167969 -2.554688 -3.667969 z m 1 1 v 6 c 0 1 0.867188 2.007812 2.109375 2.835938 c 0.933594 0.621093 1.472656 0.785156 1.890625 0.949218 v -9.785156 z m 0 0", "key": "1wlco7" }]], "aliases": ["security-medium-symbolic"], "gtkIconName": "security-medium-symbolic" };
__iconData$1Q.node;
const SecurityMedium = createAdwaitaIcon(__iconData$1Q);

const __iconData$1P = { "name": "selection-end", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 5.542969 2.453125 l 4.375 3.644531 c 0.683593 0.570313 1.082031 1.417969 1.082031 2.3125 v 3.589844 c 0 1.105469 -0.894531 2 -2 2 h -2 c -1.105469 0 -2 -0.894531 -2 -2 v -9.296875 c 0 -0.125 0.074219 -0.242187 0.191406 -0.296875 c 0.113282 -0.054688 0.25 -0.035156 0.351563 0.046875 z m 0 0", "key": "1hb1m5" }]], "aliases": ["selection-end-symbolic"], "gtkIconName": "selection-end-symbolic" };
__iconData$1P.node;
const SelectionEnd = createAdwaitaIcon(__iconData$1P);

const __iconData$1O = { "name": "selection-mode", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 11.453125 5.414062 c 0.789063 0.050782 1.144531 1.007813 0.585937 1.566407 l -3.988281 4.121093 c -0.359375 0.359376 -0.941406 0.359376 -1.300781 0 l -2.382812 -2.300781 c -0.867188 -0.867187 0.433593 -2.167969 1.300781 -1.300781 l 1.730469 1.652344 l 3.339843 -3.472656 c 0.1875 -0.191407 0.449219 -0.285157 0.714844 -0.265626 z m 0 0", "key": "9j5m7n" }], ["path", { "fill": "currentColor", "d": "m 7.996094 0 c -4.402344 0 -7.996094 3.59375 -7.996094 8 s 3.59375 8 7.996094 8 c 4.40625 0 7.996094 -3.59375 7.996094 -8 s -3.589844 -8 -7.996094 -8 z m 0 2 c 3.324218 0 5.996094 2.675781 5.996094 6 s -2.671876 6 -5.996094 6 c -3.324219 0 -5.996094 -2.675781 -5.996094 -6 s 2.671875 -6 5.996094 -6 z m 0 0", "key": "th96pl" }]], "aliases": ["selection-mode-symbolic"], "gtkIconName": "selection-mode-symbolic" };
__iconData$1O.node;
const SelectionMode = createAdwaitaIcon(__iconData$1O);

const __iconData$1N = { "name": "selection-start", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 10.457031 13.546875 l -4.375 -3.644531 c -0.683593 -0.570313 -1.082031 -1.417969 -1.082031 -2.3125 v -3.589844 c 0 -1.105469 0.894531 -2 2 -2 h 2 c 1.105469 0 2 0.894531 2 2 v 9.296875 c 0 0.125 -0.074219 0.242187 -0.191406 0.296875 c -0.113282 0.054688 -0.25 0.035156 -0.351563 -0.046875 z m 0 0", "key": "fqzzzk" }]], "aliases": ["selection-start-symbolic"], "gtkIconName": "selection-start-symbolic" };
__iconData$1N.node;
const SelectionStart = createAdwaitaIcon(__iconData$1N);

const __iconData$1M = { "name": "semi-starred-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 8 -0.105469 v 4.210938 l -0.675781 2.070312 c -0.132813 0.410157 -0.515625 0.6875 -0.945313 0.691407 l -2.253906 0.007812 l 1.703125 1.203125 c 0.363281 0.257813 0.511719 0.722656 0.367187 1.144531 l -0.765624 2.191406 l 1.960937 -1.300781 c 0.203125 -0.058593 0.40625 -0.113281 0.609375 -0.167969 v 2.226563 l -0.046875 -0.03125 l -3.898437 2.585937 c -0.800782 0.527344 -1.8125 -0.257812 -1.496094 -1.164062 l 1.5 -4.289062 l -3.640625 -2.574219 c -0.792969 -0.5625 -0.3984378 -1.808594 0.574219 -1.8125 l 4.65625 -0.015625 l 1.402343 -4.289063 c 0.132813 -0.40625 0.515625 -0.683593 0.949219 -0.6875 z m 0 0", "key": "xea942" }], ["path", { "fill": "currentColor", "d": "m 8 -0.105469 c 0.429688 0 0.8125 0.273438 0.949219 0.683594 l 1.449219 4.339844 l 4.59375 -0.015625 c 0.980468 -0.007813 1.382812 1.253906 0.578124 1.816406 l -3.625 2.558594 l 1.5 4.285156 c 0.3125 0.902344 -0.691406 1.691406 -1.488281 1.171875 l -3.957031 -2.5625 z m 0 0", "key": "12xqe4" }]], "aliases": ["semi-starred-rtl-symbolic"], "gtkIconName": "semi-starred-rtl-symbolic" };
__iconData$1M.node;
const SemiStarredRtl = createAdwaitaIcon(__iconData$1M);

const __iconData$1L = { "name": "semi-starred", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 8 0 v 4.210938 l 0.679688 2.070312 c 0.128906 0.410156 0.511718 0.691406 0.941406 0.695312 l 2.253906 0.007813 l -1.699219 1.199219 c -0.367187 0.257812 -0.515625 0.726562 -0.367187 1.148437 l 0.765625 2.191407 l -1.964844 -1.304688 c -0.203125 -0.058594 -0.40625 -0.109375 -0.609375 -0.164062 v 2.222656 l 0.046875 -0.03125 l 3.898437 2.589844 c 0.800782 0.527343 1.8125 -0.261719 1.496094 -1.164063 l -1.5 -4.289063 l 3.640625 -2.574218 c 0.792969 -0.5625 0.398438 -1.8125 -0.574219 -1.816406 l -4.65625 -0.015626 l -1.402343 -4.285156 c -0.132813 -0.410156 -0.515625 -0.68749975 -0.949219 -0.68749975 z m 0 0", "key": "4vernm" }], ["path", { "fill": "currentColor", "d": "m 8 0 c -0.429688 0 -0.8125 0.277344 -0.949219 0.683594 l -1.449219 4.339844 l -4.589843 -0.015626 c -0.9843752 -0.007812 -1.386719 1.253907 -0.582031 1.816407 l 3.628906 2.558593 l -1.5 4.285157 c -0.316406 0.902343 0.6875 1.691406 1.488281 1.171875 l 3.953125 -2.5625 z m 0 0", "key": "16im8x" }]], "aliases": ["semi-starred-symbolic"], "gtkIconName": "semi-starred-symbolic" };
__iconData$1L.node;
const SemiStarred = createAdwaitaIcon(__iconData$1L);

const __iconData$1K = { "name": "send-to", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 c -0.257812 0 -0.511719 0.0976562 -0.707031 0.292969 l -1.246094 1.25 l -1.765625 1.730469 c -0.191406 0.199218 -0.28125 0.441406 -0.28125 0.75 c 0 0.976562 1 1 1 1 c 0.257812 0 0.527344 -0.128907 0.71875 -0.3125 l 1.28125 -1.28125 v 7.570312 s 0 1 1 1 s 1 -1 1 -1 v -7.570312 l 1.28125 1.28125 c 0.191406 0.183593 0.410156 0.3125 0.71875 0.3125 c 0 0 1 -0.023438 1 -1 c 0 -0.308594 -0.089844 -0.550782 -0.28125 -0.75 l -1.765625 -1.730469 l -1.246094 -1.25 c -0.195312 -0.1953128 -0.449219 -0.292969 -0.707031 -0.292969 z m -3.96875 6.964844 c -1.660156 -0.027344 -3.03125 1.371094 -3.03125 3.035156 v 2.972656 c 0 1.664063 1.371094 3.035156 3.03125 3.035156 h 7.9375 c 1.664062 0 3.03125 -1.371093 3.03125 -3.035156 v -2.972656 c 0 -1.664062 -1.367188 -3.0625 -3.03125 -3.035156 l -1.96875 0.035156 v 2 l 1.96875 -0.035156 c 0.589844 -0.007813 1.03125 0.445312 1.03125 1.035156 v 2.972656 c 0 0.589844 -0.441406 1.035156 -1.03125 1.035156 h -7.9375 c -0.585938 0 -1.03125 -0.445312 -1.03125 -1.035156 v -2.972656 c 0 -0.589844 0.445312 -1.042969 1.03125 -1.035156 l 1.96875 0.035156 v -2 z m 0 0", "key": "1f4f8w" }]], "aliases": ["send-to-symbolic"], "gtkIconName": "send-to-symbolic" };
__iconData$1K.node;
const SendTo = createAdwaitaIcon(__iconData$1K);

const __iconData$1J = { "name": "sidebar-show-right", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 10 13 v -10 h 3 c 0.550781 0 1 0.449219 1 1 v 8 c 0 0.550781 -0.449219 1 -1 1 z m 0 0", "key": "vzm1zi" }], ["path", { "fill": "currentColor", "d": "m 13 1 c 1.644531 0 3 1.355469 3 3 v 8 c 0 1.644531 -1.355469 3 -3 3 h -10 c -1.644531 0 -3 -1.355469 -3 -3 v -8 c 0 -1.644531 1.355469 -3 3 -3 z m 0 2 h -3 v 10 h 3 c 0.570312 0 1 -0.429688 1 -1 v -8 c 0 -0.570312 -0.429688 -1 -1 -1 z m -4 0 h -6 c -0.570312 0 -1 0.429688 -1 1 v 8 c 0 0.570312 0.429688 1 1 1 h 6 z m 0 0", "key": "1wgmfg" }]], "aliases": ["sidebar-show-right-symbolic"], "gtkIconName": "sidebar-show-right-symbolic" };
__iconData$1J.node;
const SidebarShowRight = createAdwaitaIcon(__iconData$1J);

const __iconData$1I = { "name": "sidebar-show", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 6 13 v -10 h -3 c -0.550781 0 -1 0.449219 -1 1 v 8 c 0 0.550781 0.449219 1 1 1 z m 0 0", "key": "j6zlsp" }], ["path", { "fill": "currentColor", "d": "m 3 1 c -1.644531 0 -3 1.355469 -3 3 v 8 c 0 1.644531 1.355469 3 3 3 h 10 c 1.644531 0 3 -1.355469 3 -3 v -8 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 2 h 3 v 10 h -3 c -0.570312 0 -1 -0.429688 -1 -1 v -8 c 0 -0.570312 0.429688 -1 1 -1 z m 4 0 h 6 c 0.570312 0 1 0.429688 1 1 v 8 c 0 0.570312 -0.429688 1 -1 1 h -6 z m 0 0", "key": "1bn874" }]], "aliases": ["sidebar-show-symbolic"], "gtkIconName": "sidebar-show-symbolic" };
__iconData$1I.node;
const SidebarShow = createAdwaitaIcon(__iconData$1I);

const __iconData$1H = { "name": "software-update-available", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 c -0.257812 0 -0.511719 0.0976562 -0.707031 0.292969 l -1.707031 1.707031 h -2.585938 c -0.550781 0 -1 0.449219 -1 1 v 2.585938 l -1.707031 1.707031 c -0.3906252 0.390625 -0.3906252 1.023437 0 1.414062 l 1.707031 1.707031 v 2.585938 c 0 0.550781 0.449219 1 1 1 h 2.585938 l 1.707031 1.707031 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 l 1.707031 -1.707031 h 2.585938 c 0.550781 0 1 -0.449219 1 -1 v -2.585938 l 1.707031 -1.707031 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 l -1.707031 -1.707031 v -2.585938 c 0 -0.550781 -0.449219 -1 -1 -1 h -2.585938 l -1.707031 -1.707031 c -0.195312 -0.1953128 -0.449219 -0.292969 -0.707031 -0.292969 z m 0 5 c 0.257812 0 0.511719 0.097656 0.707031 0.292969 l 2 2 c 0.183594 0.1875 0.289063 0.441406 0.285157 0.707031 h 0.007812 v 1 h -2 v 2 h -2 v -2 h -2 v -1 h 0.007812 c -0.003906 -0.265625 0.101563 -0.519531 0.285157 -0.707031 l 2 -2 c 0.195312 -0.195313 0.449219 -0.292969 0.707031 -0.292969 z m 0 0", "key": "1mq4ru" }]], "aliases": ["software-update-available-symbolic"], "gtkIconName": "software-update-available-symbolic" };
__iconData$1H.node;
const SoftwareUpdateAvailable = createAdwaitaIcon(__iconData$1H);

const __iconData$1G = { "name": "software-update-urgent", "size": 16, "node": [["path", { "fill": "#ff7800", "d": "m 8 0 c -0.257812 0 -0.511719 0.0976562 -0.707031 0.292969 l -1.707031 1.707031 h -2.585938 c -0.550781 0 -1 0.449219 -1 1 v 2.585938 l -1.707031 1.707031 c -0.3906252 0.390625 -0.3906252 1.023437 0 1.414062 l 1.707031 1.707031 v 2.585938 c 0 0.550781 0.449219 1 1 1 h 2.585938 l 1.707031 1.707031 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 l 1.707031 -1.707031 h 2.585938 c 0.550781 0 1 -0.449219 1 -1 v -2.585938 l 1.707031 -1.707031 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 l -1.707031 -1.707031 v -2.585938 c 0 -0.550781 -0.449219 -1 -1 -1 h -2.585938 l -1.707031 -1.707031 c -0.195312 -0.1953128 -0.449219 -0.292969 -0.707031 -0.292969 z m -1 4 h 2 v 5 h -2 z m 1 5.75 c 0.6875 0 1.25 0.5625 1.25 1.25 s -0.5625 1.25 -1.25 1.25 s -1.25 -0.5625 -1.25 -1.25 s 0.5625 -1.25 1.25 -1.25 z m 0 0", "key": "kcl0wx" }]], "aliases": ["software-update-urgent-symbolic"], "gtkIconName": "software-update-urgent-symbolic", "monochrome": false };
__iconData$1G.node;
const SoftwareUpdateUrgent = createAdwaitaIcon(__iconData$1G);

const __iconData$1F = { "name": "star-new", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 6.402344 0 c -0.347656 0 -0.652344 0.21875 -0.761719 0.546875 l -1.160156 3.472656 l -3.671875 -0.015625 c -0.7851565 -0.003906 -1.105469 1.003906 -0.464844 1.453125 l 2.902344 2.046875 l -1.199219 3.429688 c -0.257813 0.71875 0.550781 1.351562 1.191406 0.933594 l 3.199219 -2.074219 l 0.308594 0.207031 h 3.253906 v -1.214844 l -0.449219 -1.28125 l 0.582031 -0.414062 l 2.332032 -1.648438 c 0.632812 -0.449218 0.316406 -1.445312 -0.460938 -1.449218 l -3.722656 -0.015626 l -1.121094 -3.425781 c -0.109375 -0.328125 -0.414062 -0.54687475 -0.757812 -0.550781 z m 4.597656 8 v 3 h -3 v 2 h 3 v 3 h 2 v -3 h 3 v -2 h -3 v -3 z m 0 0", "key": "3rcfmi" }]], "aliases": ["star-new-symbolic"], "gtkIconName": "star-new-symbolic" };
__iconData$1F.node;
const StarNew = createAdwaitaIcon(__iconData$1F);

const __iconData$1E = { "name": "starred", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 c -0.429688 0 -0.8125 0.273438 -0.949219 0.683594 l -1.449219 4.339844 l -4.589843 -0.015626 c -0.980469 -0.003906 -1.382813 1.257813 -0.582031 1.820313 l 3.625 2.554687 l -1.5 4.285157 c -0.316407 0.902343 0.6875 1.691406 1.492187 1.171875 l 4.003906 -2.59375 l 3.894531 2.585937 c 0.800782 0.53125 1.816407 -0.257812 1.5 -1.160156 l -1.503906 -4.289063 l 3.644532 -2.578124 c 0.789062 -0.5625 0.394531 -1.808594 -0.574219 -1.8125 l -4.660157 -0.015626 l -1.402343 -4.285156 c -0.132813 -0.410156 -0.515625 -0.68749975 -0.949219 -0.691406 z m 0 0", "key": "1t89um" }]], "aliases": ["starred-symbolic"], "gtkIconName": "starred-symbolic" };
__iconData$1E.node;
const Starred = createAdwaitaIcon(__iconData$1E);

const __iconData$1D = { "name": "start-here", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 13.628906 0 c -3.324218 0 -3.949218 4.738281 -2.078125 4.738281 c 1.871094 0 5.402344 -4.738281 2.078125 -4.738281 z m -5.132812 0.582031 c -0.054688 0 -0.113282 0.003907 -0.167969 0.011719 c -1.871094 0.242188 -1.214844 3.492188 -0.21875 3.554688 c 0.964844 0.058593 2.019531 -3.558594 0.386719 -3.566407 z m -3.242188 1.285157 c -0.101562 0.003906 -0.207031 0.027343 -0.324218 0.074218 c -1.503907 0.621094 -0.230469 3.183594 0.613281 3.007813 c 0.773437 -0.15625 0.875 -3.105469 -0.289063 -3.082031 z m -2.398437 2.007812 c -0.128907 0 -0.269531 0.039062 -0.421875 0.144531 c -1.203125 0.832031 0.40625 2.839844 1.113281 2.53125 c 0.621094 -0.273437 0.222656 -2.644531 -0.691406 -2.675781 z m 6.875 1.539062 c -2.582031 -0.042968 -5.984375 1.25 -6.5625 3.847657 c -0.628907 2.816406 2.585937 6.71875 5.941406 6.71875 c 1.652344 0 3.554687 -1.492188 3.914063 -3.382813 c 0.269531 -1.4375 -3.203126 -0.859375 -3.078126 0.09375 c 0.148438 1.140625 -0.839843 1.707032 -1.804687 0.96875 c -3.082031 -2.34375 5.09375 -3.515625 4.558594 -6.714844 c -0.167969 -1 -1.421875 -1.503906 -2.96875 -1.53125 z m 0 0", "key": "mkx4gt" }]], "aliases": ["start-here-symbolic"], "gtkIconName": "start-here-symbolic" };
__iconData$1D.node;
const StartHere = createAdwaitaIcon(__iconData$1D);

const __iconData$1C = { "name": "system-file-manager", "size": 16, "node": [["path", { "fill": "currentColor", "fill-rule": "evenodd", "d": "M3.187 0C1.982 0 1 1.018 1 2.219V13.78C1 14.982 1.982 16 3.187 16h9.625C14.017 16 15 14.982 15 13.781V2.22C15 1.018 14.017 0 12.812 0zM3 3h10v11H3zm1 1v4h8.031V4zm2.344 1.438a.5.5 0 01.062 0 .5.5 0 01.594.5V6h2v-.063a.5.5 0 111 0V6c0 .545-.455 1-1 1H7c-.546 0-1-.455-1-1v-.063a.5.5 0 01.344-.5zM4.03 9v4h8.031V9zm2.313 1.438a.5.5 0 01.062 0 .5.5 0 01.594.5V11h2v-.063a.5.5 0 111 0V11c0 .545-.455 1-1 1H7c-.546 0-1-.455-1-1v-.063a.5.5 0 01.344-.5z", "key": "1tjewc" }]], "aliases": ["system-file-manager-symbolic"], "gtkIconName": "system-file-manager-symbolic" };
__iconData$1C.node;
const SystemFileManager = createAdwaitaIcon(__iconData$1C);

const __iconData$1B = { "name": "system-help", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1.96875 0 c -1.089844 0 -1.96875 0.878906 -1.96875 1.96875 v 12.0625 c 0 1.089844 0.878906 1.96875 1.96875 1.96875 h 12.03125 c 0.554688 0 1 -0.445312 1 -1 v -11 c 0 -0.554688 -0.445312 -1 -1 -1 h -12 c -0.554688 0 -1 -0.445312 -1 -1 s 0.445312 -1 1 -1 h 12 c 0 -0.558594 -0.441406 -1 -1 -1 z m 6.03125 4.0625 c 2.726562 0 4.9375 2.207031 4.9375 4.9375 s -2.210938 4.9375 -4.9375 4.9375 s -4.9375 -2.207031 -4.9375 -4.9375 s 2.210938 -4.9375 4.9375 -4.9375 z m 0 0.96875 c -0.640625 0 -1.246094 0.136719 -1.78125 0.40625 l 0.128906 0.265625 l 0.621094 1.296875 c 0.210938 -0.109375 0.4375 -0.195312 0.675781 -0.242188 c 0.101563 -0.011718 0.214844 -0.023437 0.359375 -0.035156 c 0.035156 0 0.066406 0.003906 0.097656 0.003906 c 0.335938 0.019532 0.644532 0.125 0.929688 0.273438 l 0.71875 -1.5 c -0.007812 -0.003906 -0.015625 -0.007812 -0.027344 -0.011719 l 0.027344 -0.050781 c -0.535156 -0.269531 -1.109375 -0.40625 -1.75 -0.40625 z m -3.5625 2.21875 c -0.265625 0.539062 -0.4375 1.136719 -0.4375 1.78125 c 0 0.660156 0.191406 1.265625 0.46875 1.8125 l 1.527344 -0.777344 c -0.003906 -0.007812 -0.011719 -0.015625 -0.015625 -0.023437 l 0.019531 -0.011719 c -0.117188 -0.226562 -0.207031 -0.46875 -0.253906 -0.726562 c -0.003906 -0.03125 -0.007813 -0.0625 -0.011719 -0.097657 c -0.007813 -0.070312 -0.015625 -0.136719 -0.015625 -0.207031 c 0.039062 -0.4375 0.0625 -0.484375 0.191406 -0.871094 c 0.019532 -0.042968 0.039063 -0.085937 0.058594 -0.128906 l -1.46875 -0.75 c -0.003906 0.007812 -0.007812 0.015625 -0.011719 0.023438 z m 7.09375 0 l -1.5 0.75 c 0.152344 0.304688 0.25 0.640625 0.25 1 c 0 0.375 -0.117188 0.71875 -0.28125 1.03125 l 0.039062 0.019531 c -0.007812 0.011719 -0.011718 0.023438 -0.015624 0.039063 l 1.507812 0.753906 c 0.277344 -0.546875 0.4375 -1.152344 0.4375 -1.8125 c 0 -0.644531 -0.140625 -1.242188 -0.40625 -1.78125 l -0.023438 0.011719 c -0.003906 -0.003907 -0.007812 -0.007813 -0.007812 -0.011719 z m -3.53125 0.46875 c -0.71875 0 -1.28125 0.5625 -1.28125 1.28125 c 0 0.414062 0.191406 0.777344 0.488281 1.007812 c 0.070313 0.058594 0.148438 0.105469 0.230469 0.144532 c 0.011719 0.003906 0.023438 0.011718 0.03125 0.015625 c 0.070312 0.03125 0.136719 0.054687 0.210938 0.070312 c 0.03125 0.011719 0.066406 0.019531 0.097656 0.023438 c 0.050781 0.007812 0.097656 0.011719 0.144531 0.015625 c 0.03125 0.003906 0.058594 0.007812 0.085937 0.011718 c 0.03125 -0.003906 0.0625 -0.007812 0.097657 -0.011718 c 0.023437 -0.003906 0.050781 -0.007813 0.074219 -0.011719 c 0.066406 -0.007813 0.132812 -0.019531 0.199218 -0.039063 c 0.003906 0 0.003906 0 0.007813 -0.003906 c 0.003906 0 0.011719 -0.003906 0.019531 -0.007812 c 0.074219 -0.023438 0.140625 -0.050782 0.210938 -0.085938 c 0.011718 -0.007812 0.023437 -0.011718 0.035156 -0.019531 c 0.03125 -0.019531 0.058594 -0.039063 0.089844 -0.058594 c 0.046874 -0.035156 0.09375 -0.074219 0.140624 -0.113281 c 0.019532 -0.019531 0.035157 -0.039062 0.054688 -0.058594 c 0.046875 -0.050781 0.089844 -0.101562 0.128906 -0.160156 c 0.117188 -0.175781 0.1875 -0.375 0.210938 -0.585938 c 0.003906 -0.042968 0.011718 -0.082031 0.015625 -0.125 c -0.003907 -0.210937 -0.054688 -0.421874 -0.15625 -0.609374 c -0.003907 -0.003907 -0.003907 -0.007813 -0.007813 -0.015626 c -0.015625 -0.023437 -0.03125 -0.050781 -0.046875 -0.074218 c -0.226562 -0.355469 -0.621093 -0.589844 -1.082031 -0.589844 z m 1.03125 3.28125 c -0.3125 0.164062 -0.65625 0.28125 -1.03125 0.28125 c -0.359375 0 -0.695312 -0.097656 -1 -0.25 l -0.75 1.5 c 0.003906 0.003906 0.007812 0.003906 0.015625 0.007812 l -0.046875 0.085938 c 0.535156 0.269531 1.140625 0.4375 1.78125 0.4375 s 1.214844 -0.167969 1.75 -0.4375 l -0.046875 -0.101562 c 0.015625 -0.011719 0.03125 -0.015626 0.046875 -0.023438 z m 0 0", "key": "lknvdb" }]], "aliases": ["system-help-symbolic"], "gtkIconName": "system-help-symbolic" };
__iconData$1B.node;
const SystemHelp = createAdwaitaIcon(__iconData$1B);

const __iconData$1A = { "name": "system-lock-screen", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 1 c -2.199219 0 -4 1.800781 -4 4 v 2 c -1.109375 0 -2 0.890625 -2 2 v 5 c 0 0.554688 0.445312 1 1 1 h 10 c 0.554688 0 1 -0.445312 1 -1 v -5 c 0 -1.109375 -0.890625 -2 -2 -2 v -2 c 0 -2.199219 -1.800781 -4 -4 -4 z m 0 2 c 1.125 0 2 0.875 2 2 v 2 h -4 v -2 c 0 -1.125 0.875 -2 2 -2 z m 0 0", "key": "vflcq1" }]], "aliases": ["system-lock-screen-symbolic"], "gtkIconName": "system-lock-screen-symbolic" };
__iconData$1A.node;
const SystemLockScreen = createAdwaitaIcon(__iconData$1A);

const __iconData$1z = { "name": "system-log-out-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 5 v 0.003906 c -0.265625 0 -0.519531 0.105469 -0.707031 0.289063 l -2 2 c -0.3906252 0.390625 -0.3906252 1.023437 0 1.414062 l 2 2 c 0.1875 0.183594 0.441406 0.289063 0.707031 0.285157 v 0.007812 h 1 v -2 h 5 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 h -5 v -2 z m 0 0", "key": "d7qa74" }], ["path", { "fill": "currentColor", "d": "m 6.820312 1.097656 c 2.394532 -0.40625 4.910157 0.453125 6.546876 2.398438 c 2.175781 2.597656 2.175781 6.40625 0 9 c -2.179688 2.597656 -5.929688 3.257812 -8.863282 1.5625 c -0.230468 -0.132813 -0.398437 -0.351563 -0.46875 -0.605469 c -0.066406 -0.257813 -0.03125 -0.53125 0.101563 -0.761719 c 0.277343 -0.476562 0.886719 -0.640625 1.367187 -0.363281 c 2.105469 1.214844 4.765625 0.75 6.328125 -1.117187 c 1.5625 -1.863282 1.5625 -4.5625 0 -6.429688 c -1.5625 -1.863281 -4.222656 -2.332031 -6.328125 -1.113281 c -0.480468 0.273437 -1.089844 0.113281 -1.367187 -0.367188 c -0.132813 -0.226562 -0.167969 -0.5 -0.101563 -0.757812 c 0.070313 -0.257813 0.238282 -0.476563 0.46875 -0.609375 c 0.730469 -0.421875 1.515625 -0.699219 2.316406 -0.835938 z m 0 0", "key": "v3c5o7" }]], "aliases": ["system-log-out-rtl-symbolic"], "gtkIconName": "system-log-out-rtl-symbolic" };
__iconData$1z.node;
const SystemLogOutRtl = createAdwaitaIcon(__iconData$1z);

const __iconData$1y = { "name": "system-log-out", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 13 5 v 0.003906 c 0.265625 0 0.519531 0.105469 0.707031 0.289063 l 2 2 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 l -2 2 c -0.1875 0.183594 -0.441406 0.289063 -0.707031 0.285157 v 0.007812 h -1 v -2 h -5 c -0.550781 0 -1 -0.449219 -1 -1 s 0.449219 -1 1 -1 h 5 v -2 z m 0 0", "key": "q96scx" }], ["path", { "fill": "currentColor", "d": "m 9.179688 1.097656 c -2.394532 -0.40625 -4.910157 0.453125 -6.546876 2.398438 c -2.175781 2.597656 -2.175781 6.40625 0 9 c 2.179688 2.597656 5.929688 3.257812 8.863282 1.5625 c 0.230468 -0.132813 0.398437 -0.351563 0.46875 -0.605469 c 0.066406 -0.257813 0.03125 -0.53125 -0.101563 -0.761719 c -0.277343 -0.476562 -0.886719 -0.640625 -1.367187 -0.363281 c -2.105469 1.214844 -4.765625 0.75 -6.328125 -1.117187 c -1.5625 -1.863282 -1.5625 -4.5625 0 -6.429688 c 1.5625 -1.863281 4.222656 -2.332031 6.328125 -1.113281 c 0.480468 0.273437 1.089844 0.113281 1.367187 -0.367188 c 0.132813 -0.226562 0.167969 -0.5 0.101563 -0.757812 c -0.070313 -0.257813 -0.238282 -0.476563 -0.46875 -0.609375 c -0.730469 -0.421875 -1.515625 -0.699219 -2.316406 -0.835938 z m 0 0", "key": "13r5rl" }]], "aliases": ["system-log-out-symbolic"], "gtkIconName": "system-log-out-symbolic" };
__iconData$1y.node;
const SystemLogOut = createAdwaitaIcon(__iconData$1y);

const __iconData$1x = { "name": "system-reboot", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 c -0.550781 0 -1 0.449219 -1 1 v 5 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -5 c 0 -0.550781 -0.449219 -1 -1 -1 z m -7 1 l 2.050781 2.050781 c -2.117187 2.117188 -2.652343 5.355469 -1.332031 8.039063 c 1.324219 2.683594 4.214844 4.238281 7.179688 3.851562 c 2.96875 -0.386718 5.367187 -2.625 5.960937 -5.554687 c 0.59375 -2.933594 -0.75 -5.929688 -3.335937 -7.433594 c -0.476563 -0.28125 -1.089844 -0.117187 -1.367188 0.359375 s -0.117188 1.089844 0.359375 1.367188 c 1.851563 1.078124 2.808594 3.207031 2.382813 5.3125 c -0.421876 2.101562 -2.128907 3.691406 -4.253907 3.96875 c -2.128906 0.273437 -4.183593 -0.828126 -5.128906 -2.753907 s -0.566406 -4.226562 0.949219 -5.742187 l 1.535156 1.535156 v -4.003906 c 0 -0.519532 -0.449219 -0.996094 -1 -0.996094 z m 0 0", "key": "7ufblp" }]], "aliases": ["system-reboot-symbolic"], "gtkIconName": "system-reboot-symbolic" };
__iconData$1x.node;
const SystemReboot = createAdwaitaIcon(__iconData$1x);

const __iconData$1w = { "name": "system-run", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 9.5 0.5 c -0.550781 0 -1 0.449219 -1 1 c 0.003906 0.035156 0.007812 0.066406 0.015625 0.097656 c -0.003906 0.003906 -0.011719 0.003906 -0.015625 0.003906 c 0.054688 0.210938 -0.011719 0.433594 -0.175781 0.574219 c -0.058594 0.046875 -0.125 0.085938 -0.195313 0.109375 c -0.285156 0.089844 -0.589844 -0.058594 -0.699218 -0.332031 c 0 0 -0.003907 0 -0.007813 0.003906 c -0.015625 -0.03125 -0.035156 -0.0625 -0.054687 -0.089843 c -0.199219 -0.273438 -0.523438 -0.429688 -0.863282 -0.410157 c -0.191406 0.011719 -0.375 0.078125 -0.53125 0.191407 c -0.445312 0.324218 -0.546875 0.949218 -0.222656 1.394531 c 0.023438 0.027343 0.050781 0.050781 0.074219 0.074219 c 0 0.003906 -0.003907 0.007812 -0.007813 0.011718 c 0.164063 0.136719 0.238282 0.355469 0.1875 0.566406 c -0.015625 0.070313 -0.046875 0.140626 -0.09375 0.199219 c -0.175781 0.242188 -0.507812 0.300781 -0.757812 0.144531 c 0 0 0 0.003907 -0.003906 0.003907 c -0.03125 -0.015625 -0.0625 -0.027344 -0.09375 -0.039063 c -0.089844 -0.03125 -0.1875 -0.046875 -0.28125 -0.046875 c -0.445313 -0.015625 -0.84375 0.265625 -0.980469 0.691407 c -0.171875 0.523437 0.117187 1.085937 0.640625 1.257812 c 0.035156 0.007812 0.066406 0.011719 0.101562 0.015625 c 0 0.003906 0 0.007813 -0.003906 0.015625 c 0.21875 0.011719 0.410156 0.144531 0.492188 0.347656 c 0.027343 0.066406 0.042968 0.140625 0.042968 0.214844 c 0 0.300781 -0.238281 0.542969 -0.535156 0.5625 c 0.003906 0.003906 0.003906 0.007812 0.003906 0.015625 c -0.035156 0.003906 -0.066406 0.007813 -0.101562 0.015625 c -0.523438 0.171875 -0.8125 0.734375 -0.640625 1.261719 c 0.171875 0.523437 0.734375 0.8125 1.261719 0.640625 c 0.03125 -0.011719 0.0625 -0.023438 0.09375 -0.039063 c 0.003906 0.003907 0.003906 0.003907 0.003906 0.007813 c 0.085937 -0.054688 0.179687 -0.085938 0.277344 -0.089844 c 0.113281 -0.007812 0.222656 0.019531 0.320312 0.082031 c 0.0625 0.039063 0.121094 0.089844 0.164062 0.152344 c 0.175782 0.242187 0.125 0.574219 -0.101562 0.761719 l 0.011719 0.011718 c -0.023438 0.023438 -0.050781 0.046876 -0.074219 0.074219 c -0.324219 0.445313 -0.222656 1.070313 0.222656 1.398438 c 0.445313 0.324219 1.070313 0.222656 1.394532 -0.222657 c 0.019531 -0.027343 0.039062 -0.054687 0.054687 -0.085937 c 0.003906 0 0.003906 0 0.007813 0.003906 c 0.078124 -0.203125 0.261718 -0.34375 0.480468 -0.359375 c 0.074219 -0.007812 0.148438 0.003906 0.21875 0.027344 c 0.289063 0.089844 0.449219 0.394531 0.371094 0.679688 c 0.007812 0 0.011719 0 0.015625 0.003906 c -0.007813 0.03125 -0.011719 0.066406 -0.015625 0.097656 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 c 0 -0.035156 -0.003906 -0.066406 -0.007812 -0.101562 h 0.003906 c -0.074219 -0.289063 0.089844 -0.589844 0.375 -0.683594 c 0.074218 -0.023438 0.148437 -0.03125 0.222656 -0.023438 c 0.207031 0.015625 0.394531 0.152344 0.472656 0.359375 c 0.007813 -0.003906 0.011719 -0.007812 0.015625 -0.007812 c 0.015625 0.03125 0.03125 0.058593 0.046875 0.089843 c 0.328125 0.445313 0.953125 0.546876 1.398438 0.222657 c 0.445312 -0.328125 0.546875 -0.953125 0.21875 -1.398438 c -0.023438 -0.027343 -0.046875 -0.050781 -0.074219 -0.074219 c 0.003906 -0.003906 0.007813 -0.003906 0.011719 -0.007812 c -0.226563 -0.191406 -0.273438 -0.527344 -0.097656 -0.769531 c 0.113281 -0.15625 0.296874 -0.238281 0.476562 -0.230469 c 0.097656 0.003906 0.195312 0.03125 0.28125 0.085938 c 0.003906 -0.003907 0.007812 -0.007813 0.011719 -0.011719 c 0.027343 0.015625 0.058593 0.03125 0.089843 0.046875 c 0.527344 0.171875 1.089844 -0.117188 1.261719 -0.640625 c 0.171875 -0.527344 -0.117187 -1.089844 -0.640625 -1.261719 c -0.035156 -0.007812 -0.066406 -0.011719 -0.101562 -0.019531 c 0 -0.003907 0 -0.007813 0.003906 -0.011719 c -0.296875 -0.019531 -0.535156 -0.265625 -0.535156 -0.566406 c 0 -0.296875 0.238281 -0.539063 0.535156 -0.558594 c -0.003906 -0.003906 -0.003906 -0.011719 -0.003906 -0.015625 c 0.035156 -0.003906 0.066406 -0.007813 0.101562 -0.015625 c 0.523438 -0.171875 0.8125 -0.734375 0.640625 -1.261719 c -0.136719 -0.421875 -0.535156 -0.703125 -0.980469 -0.6875 c -0.09375 0 -0.191406 0.015625 -0.28125 0.046875 c -0.03125 0.015625 -0.0625 0.03125 -0.089843 0.046875 c -0.003907 -0.003906 -0.007813 -0.007812 -0.011719 -0.015625 c -0.246094 0.160156 -0.582031 0.101563 -0.757812 -0.144531 c -0.175782 -0.238281 -0.128907 -0.574219 0.097656 -0.765625 c -0.003906 0 -0.007813 -0.003906 -0.011719 -0.007812 c 0.027344 -0.023438 0.050781 -0.046876 0.074219 -0.074219 c 0.328125 -0.445313 0.226562 -1.070313 -0.21875 -1.398438 c -0.15625 -0.109375 -0.339844 -0.175781 -0.53125 -0.1875 c -0.339844 -0.019531 -0.664063 0.136719 -0.867188 0.410157 c -0.015625 0.03125 -0.03125 0.058593 -0.046875 0.089843 c -0.003906 0 -0.007812 -0.003906 -0.011719 -0.003906 c -0.109374 0.273437 -0.414062 0.421875 -0.703124 0.328125 c -0.285157 -0.089844 -0.445313 -0.394531 -0.371094 -0.679688 c 0 0 0 0 -0.003906 0 c 0.003906 -0.035156 0.007812 -0.066406 0.007812 -0.101562 c 0 -0.550781 -0.449219 -1 -1 -1 z m 0 3.5 c 1.378906 0 2.5 1.121094 2.5 2.5 s -1.121094 2.5 -2.5 2.5 s -2.5 -1.121094 -2.5 -2.5 s 1.121094 -2.5 2.5 -2.5 z m -7.011719 6 c -1.367187 0 -2.4999998 1.132812 -2.4999998 2.5 s 1.1328128 2.5 2.4999998 2.5 c 1.367188 0 2.5 -1.132812 2.5 -2.5 s -1.132812 -2.5 -2.5 -2.5 z m 0 2 c 0.289063 0 0.5 0.210938 0.5 0.5 s -0.210937 0.5 -0.5 0.5 c -0.289062 0 -0.5 -0.210938 -0.5 -0.5 s 0.210938 -0.5 0.5 -0.5 z m 0 0", "key": "zikohi" }]], "aliases": ["system-run-symbolic"], "gtkIconName": "system-run-symbolic" };
__iconData$1w.node;
const SystemRun = createAdwaitaIcon(__iconData$1w);

const __iconData$1v = { "name": "system-search", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 6.5 0 c -3.578125 0 -6.5 2.921875 -6.5 6.5 s 2.921875 6.496094 6.5 6.496094 c 1.429688 0 2.753906 -0.464844 3.828125 -1.253906 l 2.945313 2.945312 c 0.957031 0.9375 2.363281 -0.5 1.40625 -1.4375 l -2.929688 -2.929688 c 0.785156 -1.074218 1.25 -2.394531 1.25 -3.820312 c 0 -3.578125 -2.921875 -6.5 -6.5 -6.5 z m 0 2 c 2.496094 0 4.5 2.003906 4.5 4.5 s -2.003906 4.496094 -4.5 4.496094 s -4.5 -2 -4.5 -4.496094 s 2.003906 -4.5 4.5 -4.5 z m 0 0", "key": "1e7hca" }]], "aliases": ["system-search-symbolic"], "gtkIconName": "system-search-symbolic" };
__iconData$1v.node;
const SystemSearch = createAdwaitaIcon(__iconData$1v);

const __iconData$1u = { "name": "system-shutdown", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 0 c -0.550781 0 -1 0.449219 -1 1 v 5 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -5 c 0 -0.550781 -0.449219 -1 -1 -1 z m -3.136719 1.816406 c -0.128906 0.015625 -0.253906 0.058594 -0.367187 0.125 c -2.734375 1.582032 -4.074219 4.816406 -3.257813 7.871094 c 0.820313 3.050781 3.59375 5.183594 6.75 5.1875 c 3.160157 0.003906 5.941407 -2.121094 6.765625 -5.167969 c 0.828125 -3.050781 -0.5 -6.289062 -3.230468 -7.878906 c -0.476563 -0.28125 -1.089844 -0.121094 -1.367188 0.359375 c -0.132812 0.226562 -0.171875 0.5 -0.105469 0.757812 c 0.070313 0.257813 0.234375 0.476563 0.464844 0.609376 c 1.957031 1.140624 2.902344 3.441406 2.3125 5.628906 c -0.59375 2.183594 -2.570313 3.695312 -4.832031 3.691406 c -2.265625 -0.003906 -4.238282 -1.519531 -4.824219 -3.707031 s 0.363281 -4.488281 2.324219 -5.621094 c 0.476562 -0.277344 0.640625 -0.886719 0.363281 -1.363281 c -0.132813 -0.230469 -0.347656 -0.398438 -0.605469 -0.464844 c -0.125 -0.035156 -0.257812 -0.042969 -0.390625 -0.027344 z m 0 0", "key": "1aneo8" }]], "aliases": ["system-shutdown-symbolic"], "gtkIconName": "system-shutdown-symbolic" };
__iconData$1u.node;
const SystemShutdown = createAdwaitaIcon(__iconData$1u);

const __iconData$1t = { "name": "system-software-install", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M3 8h10v7.059c0 .492-.472.937-.996.937H4c-.539 0-1-.43-1-1z", "key": "18yrrn" }], ["path", { "fill": "currentColor", "d": "M6.793 2.969a1 1 0 00-.752.379L3.225 6.807a1 1 0 00-.225.63v1a1 1 0 102 0v-.644L7.592 4.61a1 1 0 00-.799-1.642zm2.213 3.004a1 1 0 00-.144 1.988l2.17.379v.16a1 1 0 102 0v-1a1 1 0 00-.828-.984L9.205 5.99a1 1 0 00-.199-.017z", "key": "idvu5w" }]], "aliases": ["system-software-install-symbolic"], "gtkIconName": "system-software-install-symbolic" };
__iconData$1t.node;
const SystemSoftwareInstall = createAdwaitaIcon(__iconData$1t);

const __iconData$1s = { "name": "system-switch-user-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4 0 c 1.105469 0 2 0.894531 2 2 s -0.894531 2 -2 2 s -2 -0.894531 -2 -2 s 0.894531 -2 2 -2 z m 8 2 c 1.105469 0 2 0.894531 2 2 s -0.894531 2 -2 2 s -2 -0.894531 -2 -2 s 0.894531 -2 2 -2 z m -7 3 c 1.3125 0 2.421875 0.832031 2.832031 2 h -7.660156 c 0.410156 -1.167969 1.515625 -2 2.828125 -2 z m 8 2 c 1.660156 0 3 1.339844 3 3 c 0 0.554688 -0.445312 1 -1 1 h -6 c -0.554688 0 -1 -0.445312 -1 -1 c 0 -1.660156 1.339844 -3 3 -3 z m -9 1 c 0.257812 0 0.511719 0.097656 0.707031 0.292969 l 2 2 c 0.183594 0.1875 0.289063 0.441406 0.289063 0.707031 h 0.003906 v 1 h -2 v 1 c 0.105469 0.800781 0.5 1 1 1 h 4 c 1 0 1 -1 1 -1 c 0 -0.550781 0.449219 -1 1 -1 s 1 0.449219 1 1 c 0 1.332031 -0.8125 2.273438 -1.550781 2.644531 c -0.742188 0.371094 -1.449219 0.355469 -1.449219 0.355469 h -4 s -0.707031 0.015625 -1.445312 -0.355469 c -0.742188 -0.371093 -1.554688 -1.3125 -1.554688 -2.644531 v -1 h -2 v -1 h 0.007812 c -0.003906 -0.265625 0.101563 -0.519531 0.285157 -0.707031 l 2 -2 c 0.195312 -0.195313 0.453125 -0.292969 0.707031 -0.292969 z m 0 0", "key": "2hrm6w" }]], "aliases": ["system-switch-user-rtl-symbolic"], "gtkIconName": "system-switch-user-rtl-symbolic" };
__iconData$1s.node;
const SystemSwitchUserRtl = createAdwaitaIcon(__iconData$1s);

const __iconData$1r = { "name": "system-switch-user", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 12 0 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m -8 2 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 7 3 c -1.3125 0 -2.417969 0.832031 -2.832031 2 h 7.664062 c -0.414062 -1.167969 -1.519531 -2 -2.832031 -2 z m -8 2 c -1.660156 0 -3 1.339844 -3 3 c 0 0.554688 0.445312 1 1 1 h 6 c 0.554688 0 1 -0.445312 1 -1 c 0 -1.660156 -1.339844 -3 -3 -3 z m 9 1 c -0.257812 0 -0.511719 0.097656 -0.707031 0.292969 l -2 2 c -0.183594 0.1875 -0.289063 0.441406 -0.285157 0.707031 h -0.007812 v 1 h 2 v 1 c -0.105469 0.800781 -0.5 1 -1 1 h -4 c -1 0 -1 -1 -1 -1 c 0 -0.550781 -0.449219 -1 -1 -1 s -1 0.449219 -1 1 c 0 1.332031 0.8125 2.273438 1.550781 2.644531 c 0.742188 0.371094 1.449219 0.355469 1.449219 0.355469 h 4 s 0.707031 0.015625 1.449219 -0.355469 c 0.738281 -0.371093 1.550781 -1.3125 1.550781 -2.644531 v -1 h 2 v -1 h -0.007812 c 0.003906 -0.265625 -0.101563 -0.519531 -0.285157 -0.707031 l -2 -2 c -0.195312 -0.195313 -0.449219 -0.292969 -0.707031 -0.292969 z m 0 0", "key": "1npknt" }]], "aliases": ["system-switch-user-symbolic"], "gtkIconName": "system-switch-user-symbolic" };
__iconData$1r.node;
const SystemSwitchUser = createAdwaitaIcon(__iconData$1r);

const __iconData$1q = { "name": "system-users", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 13.5 6.5 c 0 1.378906 -1.121094 2.5 -2.5 2.5 c -1.382812 0 -2.5 -1.121094 -2.5 -2.5 c 0 -1.382812 1.117188 -2.5 2.5 -2.5 c 1.378906 0 2.5 1.117188 2.5 2.5 z m 0 0", "key": "1giy3y" }], ["path", { "fill": "currentColor", "d": "m 7.5 3.5 c 0 1.378906 -1.121094 2.5 -2.5 2.5 s -2.5 -1.121094 -2.5 -2.5 s 1.121094 -2.5 2.5 -2.5 s 2.5 1.121094 2.5 2.5 z m 0 0", "key": "n6lro5" }], ["path", { "fill": "currentColor", "d": "m 3 7 c -1.660156 0 -3 1.339844 -3 3 v 2 c 0 0.554688 0.445312 1 1 1 h 4.074219 c 0 -2.042969 1.582031 -3.734375 3.582031 -3.90625 c -0.589844 -0.535156 -0.984375 -1.257812 -1.109375 -2.042969 c -0.175781 -0.03125 -0.359375 -0.050781 -0.546875 -0.050781 z m 6 3.925781 c -1.167969 0 -2.078125 0.90625 -2.078125 2.074219 h 2.078125 c 0.554688 0 1 -0.445312 1 -1 v -1.074219 z m 0 0", "key": "1fject" }], ["path", { "fill": "currentColor", "d": "m 9 10 c -1.664062 0 -3 1.335938 -3 3 v 2 c 0 0.554688 0.445312 1 1 1 h 8 c 0.554688 0 1 -0.445312 1 -1 v -2 c 0 -1.664062 -1.339844 -3 -3 -3 z m 0 0", "key": "idnvda" }]], "aliases": ["system-users-symbolic"], "gtkIconName": "system-users-symbolic" };
__iconData$1q.node;
const SystemUsers = createAdwaitaIcon(__iconData$1q);

const __iconData$1p = { "name": "tab-new", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 0 c -1.644531 0 -3 1.355469 -3 3 v 10 c 0 1.644531 1.355469 3 3 3 h 10 c 1.644531 0 3 -1.355469 3 -3 v -10 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 2 h 10 c 0.570312 0 1 0.429688 1 1 v 10 c 0 0.570312 -0.429688 1 -1 1 h -10 c -0.570312 0 -1 -0.429688 -1 -1 v -10 c 0 -0.570312 0.429688 -1 1 -1 z m 0 0", "key": "1tufud" }], ["path", { "fill": "currentColor", "d": "m 7 4 v 3 h -3 v 2 h 3 v 3 h 2 v -3 h 3 v -2 h -3 v -3 z m 0 0", "key": "1jxj6y" }]], "aliases": ["tab-new-symbolic"], "gtkIconName": "tab-new-symbolic" };
__iconData$1p.node;
const TabNew = createAdwaitaIcon(__iconData$1p);

const __iconData$1o = { "name": "tablet", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 1 c -1.644531 0 -3 1.355469 -3 3 v 8 c 0 1.644531 1.355469 3 3 3 h 10 c 1.644531 0 3 -1.355469 3 -3 v -8 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 2 h 10 c 0.570312 0 1 0.429688 1 1 v 7 c 0 0.554688 -0.445312 1 -1 1 h -10 c -0.554688 0 -1 -0.445312 -1 -1 v -7 c 0 -0.570312 0.429688 -1 1 -1 z m 0 0", "key": "8yj532" }]], "aliases": ["tablet-symbolic"], "gtkIconName": "tablet-symbolic" };
__iconData$1o.node;
const Tablet = createAdwaitaIcon(__iconData$1o);

const __iconData$1n = { "name": "task-due", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 0 c -0.554688 0 -1 0.445312 -1 1 h -2 c -1.644531 0 -3 1.355469 -3 3 v 9 c 0 1.644531 1.355469 3 3 3 h 2 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 h -2 c -0.570312 0 -1 -0.429688 -1 -1 v -9 c 0 -0.570312 0.429688 -1 1 -1 h 1 v 1 c 0 0.554688 0.445312 1 1 1 h 4 c 0.554688 0 1 -0.445312 1 -1 v -1 h 1 c 0.570312 0 1 0.429688 1 1 v 2 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -2 c 0 -1.644531 -1.355469 -3 -3 -3 h -2 c 0 -0.554688 -0.445312 -1 -1 -1 z m 0 0", "key": "1j479a" }], ["path", { "fill": "#ff7800", "d": "m 8.875 8 c -0.492188 0 -0.875 0.382812 -0.875 0.875 v 6.25 c 0 0.492188 0.382812 0.875 0.875 0.875 h 6.25 c 0.492188 0 0.875 -0.382812 0.875 -0.875 v -6.25 c 0 -0.492188 -0.382812 -0.875 -0.875 -0.875 z m 2.125 1 h 2 v 2.5 s 0 0.5 -0.5 0.5 h -1 c -0.5 0 -0.5 -0.5 -0.5 -0.5 z m 0.5 4 h 1 c 0.277344 0 0.5 0.222656 0.5 0.5 v 1 c 0 0.277344 -0.222656 0.5 -0.5 0.5 h -1 c -0.277344 0 -0.5 -0.222656 -0.5 -0.5 v -1 c 0 -0.277344 0.222656 -0.5 0.5 -0.5 z m 0 0", "key": "cwwk72" }]], "aliases": ["task-due-symbolic"], "gtkIconName": "task-due-symbolic", "monochrome": false };
__iconData$1n.node;
const TaskDue = createAdwaitaIcon(__iconData$1n);

const __iconData$1m = { "name": "task-past-due", "size": 16, "node": [["path", { "fill": "#e01b24", "d": "m 11.714844 8.011719 c -0.960938 0.066406 -1.863282 0.480469 -2.542969 1.160156 c -1.5625 1.5625 -1.5625 4.09375 0 5.65625 s 4.09375 1.5625 5.65625 0 s 1.5625 -4.09375 0 -5.65625 c -0.820313 -0.820313 -1.957031 -1.246094 -3.113281 -1.160156 z m -1.128906 1.570312 c 0.253906 0 0.511718 0.101563 0.707031 0.296875 l 0.707031 0.707032 l 0.707031 -0.707032 c 0.390625 -0.390625 1.023438 -0.390625 1.414063 0 s 0.390625 1.023438 0 1.414063 l -0.707032 0.707031 l 0.707032 0.707031 c 0.390625 0.390625 0.390625 1.023438 0 1.414063 s -1.023438 0.390625 -1.414063 0 l -0.707031 -0.707032 l -0.707031 0.707032 c -0.390625 0.390625 -1.023438 0.390625 -1.414063 0 s -0.390625 -1.023438 0 -1.414063 l 0.707032 -0.707031 l -0.707032 -0.707031 c -0.390625 -0.390625 -0.390625 -1.023438 0 -1.414063 c 0.195313 -0.195312 0.453125 -0.296875 0.707032 -0.296875 z m 0 0", "key": "3v6a2q" }], ["path", { "fill": "currentColor", "fill-opacity": "0.35", "d": "m 7 0 c -0.554688 0 -1 0.445312 -1 1 h -2 c -1.644531 0 -3 1.355469 -3 3 v 9 c 0 1.644531 1.355469 3 3 3 h 2 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 h -2 c -0.570312 0 -1 -0.429688 -1 -1 v -9 c 0 -0.570312 0.429688 -1 1 -1 h 1 v 1 c 0 0.554688 0.445312 1 1 1 h 4 c 0.554688 0 1 -0.445312 1 -1 v -1 h 1 c 0.570312 0 1 0.429688 1 1 v 2 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -2 c 0 -1.644531 -1.355469 -3 -3 -3 h -2 c 0 -0.554688 -0.445312 -1 -1 -1 z m 0 0", "key": "1fxfzy" }]], "aliases": ["task-past-due-symbolic"], "gtkIconName": "task-past-due-symbolic", "monochrome": false };
__iconData$1m.node;
const TaskPastDue = createAdwaitaIcon(__iconData$1m);

const __iconData$1l = { "name": "text-editor", "size": 16, "node": [["path", { "fill": "currentColor", "fill-rule": "evenodd", "d": "M5.002 10L12 3l2 2-7 7H5z", "key": "vs3yx1" }], ["path", { "fill": "currentColor", "d": "M1.094 0C.525 0 0 .503 0 1.063v13.874C0 15.498.525 16 1.094 16h10.812c.558 0 1.074-.485 1.094-1.031V8l-2 2v4H2V2h5l2 2 1.531-1.531L8.344.344A1.12 1.12 0 007.563 0z", "key": "14c5rm" }], ["path", { "fill": "currentColor", "fill-rule": "evenodd", "d": "M14.19 1.011a.513.513 0 00-.364.152l-1.162 1.16 2.004 2.005 1.163-1.162a.514.514 0 000-.728l-1.277-1.275a.514.514 0 00-.364-.152z", "key": "1ddn00" }]], "aliases": ["text-editor-symbolic"], "gtkIconName": "text-editor-symbolic" };
__iconData$1l.node;
const TextEditor = createAdwaitaIcon(__iconData$1l);

const __iconData$1k = { "name": "text-x-generic", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4.96875 1.003906 c -1.644531 0 -3 1.355469 -3 3 v 9 c 0 1.644532 1.355469 3 3 3 h 6 c 1.644531 0 3 -1.355468 3 -3 v -7.5 c 0 -0.265625 -0.105469 -0.519531 -0.292969 -0.707031 l -3.5 -3.5 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0 2 h 4 v 1.5 c 0 1 0.5 1.5 1.5 1.5 h 1.5 v 7 c 0 0.570313 -0.429688 1 -1 1 h -6 c -0.570312 0 -1 -0.429687 -1 -1 v -9 c 0 -0.570312 0.429688 -1 1 -1 z m 0 0", "key": "66wmj8" }]], "aliases": ["text-x-generic-symbolic"], "gtkIconName": "text-x-generic-symbolic" };
__iconData$1k.node;
const TextXGeneric = createAdwaitaIcon(__iconData$1k);

const __iconData$1j = { "name": "thunderbolt-acquiring", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 1.984375 0 l 0.015625 1 h -1 v 1 c 0 1 0.894531 1.996094 2 2 l -0.023438 1 h 1 l 0.023438 -1 c 1 0 1.984375 -0.890625 1.984375 -2 l 0.015625 -1 h -1 l -0.015625 -1 z m 7.015625 1 c -1.109375 0 -2 0.941406 -2 2.0625 v 1.9375 h 1 v -1.9375 c 0 -0.609375 0.449219 -1.0625 1 -1.0625 s 1 0.453125 1 1.0625 v 1.9375 h 1 v -1.9375 c 0 -1.121094 -0.890625 -2.0625 -2 -2.0625 z m 5.5 2 c -0.855469 0 -1.5 0.765625 -1.5 1.632812 v 0.367188 h 1 v -0.367188 c 0 -0.390624 0.25 -0.632812 0.5 -0.632812 h 1.5 v -1 z m -11.5 8 v 2.5 c 0 1.375 1.125 2.5 2.5 2.5 s 2.5 -1.125 2.5 -2.5 v -2.5 h -1 v 2.5 c 0 0.839844 -0.660156 1.5 -1.5 1.5 s -1.5 -0.660156 -1.5 -1.5 v -2.5 z m 7 0 v 1.9375 c 0 1.121094 0.890625 2.0625 2 2.0625 s 2 -0.941406 2 -2.0625 v -1.9375 h -1 v 1.9375 c 0 0.609375 -0.449219 1.0625 -1 1.0625 s -1 -0.453125 -1 -1.0625 v -1.9375 z m 0 0", "key": "oh8pfy" }], ["path", { "fill": "currentColor", "d": "m 3 6 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 5 0 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 5 0 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 0 0", "key": "14xcmx" }]], "aliases": ["thunderbolt-acquiring-symbolic"], "gtkIconName": "thunderbolt-acquiring-symbolic" };
__iconData$1j.node;
const ThunderboltAcquiring = createAdwaitaIcon(__iconData$1j);

const __iconData$1i = { "name": "thunderbolt", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7.546875 0 l -3.046875 8 h 3.714844 l -1.804688 3.613281 l -1.011718 -1.203125 l -0.351563 5.589844 l 4.332031 -3.585938 l -1.671875 -0.171874 l 4.339844 -6.242188 h -3.695313 l 3.195313 -6 z m -1.566406 1.304688 c -2.875 0.867187 -4.980469 3.546874 -4.980469 6.699218 c 0 2.445313 1.269531 4.605469 3.179688 5.855469 l 0.152343 -2.449219 c -0.824219 -0.890625 -1.332031 -2.085937 -1.332031 -3.40625 c 0 -1.617187 0.757812 -3.042968 1.9375 -3.957031 z m 5.628906 0.703124 l -0.9375 1.765626 c 0.515625 0.324218 0.96875 0.738281 1.332031 1.226562 h 0.042969 c 0.371094 0 0.714844 0.207031 0.886719 0.535156 c 0.171875 0.332032 0.144531 0.730469 -0.066406 1.035156 l -0.050782 0.078126 c 0.117188 0.429687 0.183594 0.882812 0.183594 1.355468 c 0 1.914063 -1.0625 3.570313 -2.636719 4.410156 c 0.003907 0.296876 -0.125 0.578126 -0.347656 0.769532 l -2.191406 1.816406 c 0.058593 0 0.117187 0.003906 0.175781 0.003906 c 3.855469 0 7 -3.144531 7 -7 c 0 -2.535156 -1.359375 -4.765625 -3.390625 -5.992187 z m 0 0", "key": "192whj" }]], "aliases": ["thunderbolt-symbolic"], "gtkIconName": "thunderbolt-symbolic" };
__iconData$1i.node;
const Thunderbolt = createAdwaitaIcon(__iconData$1i);

const __iconData$1h = { "name": "tools-check-spelling", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 3.011719 v 2 h 1.917969 c -0.054688 0 0.085937 0.160156 0.085937 0.082031 v 0.921875 h -1.003906 c -1.714844 0 -3.03125 1.128906 -3.054688 2.484375 c -0.011718 0.679688 0.304688 1.363281 0.859376 1.824219 c 0.558593 0.460937 1.316406 0.699219 2.195312 0.699219 h 3.003906 v -5.929688 c 0 -1.171875 -0.886718 -2.082031 -2.085937 -2.082031 z m 1 5.007812 h 1.003906 v 1.003907 h -1.003906 c -0.519531 0 -0.792969 -0.136719 -0.921875 -0.242188 c -0.125 -0.105469 -0.132813 -0.171875 -0.132813 -0.242188 c 0.003907 -0.144531 0.085938 -0.519531 1.054688 -0.519531 z m 0 0", "key": "bcbnqd" }], ["path", { "fill": "currentColor", "d": "m 7.996094 2 v 9.023438 h 3.003906 c 0.9375 0 1.769531 -0.371094 2.296875 -0.960938 c 0.53125 -0.585938 0.765625 -1.335938 0.757813 -2.0625 c -0.011719 -0.730469 -0.261719 -1.46875 -0.789063 -2.042969 c -0.527344 -0.578125 -1.34375 -0.957031 -2.265625 -0.957031 h -1.003906 v -3 z m 2 5 h 1.003906 c 0.421875 0 0.625 0.125 0.785156 0.300781 c 0.164063 0.179688 0.265625 0.449219 0.269532 0.722657 c 0.003906 0.277343 -0.089844 0.53125 -0.242188 0.699218 c -0.148438 0.167969 -0.355469 0.300782 -0.8125 0.300782 h -1.003906 z m 0 0", "key": "xzfhdf" }], ["path", { "fill": "currentColor", "d": "m 3 11.292969 l -2.355469 2.351562 c -0.195312 0.195313 -0.195312 0.515625 0 0.710938 c 0.195313 0.191406 0.511719 0.191406 0.707031 0 l 1.648438 -1.648438 l 2 2 l 2 -2 l 2 2 l 2 -2 l 2 2 l 2.351562 -2.351562 c 0.195313 -0.195313 0.195313 -0.515625 0 -0.710938 c -0.195312 -0.191406 -0.511718 -0.191406 -0.707031 0 l -1.644531 1.648438 l -2 -2 l -2 2 l -2 -2 l -2 2 z m 0 0", "key": "1ul5dl" }]], "aliases": ["tools-check-spelling-symbolic"], "gtkIconName": "tools-check-spelling-symbolic" };
__iconData$1h.node;
const ToolsCheckSpelling = createAdwaitaIcon(__iconData$1h);

const __iconData$1g = { "name": "touch-disabled", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 0 c -1.175781 0 -2.199219 0.695312 -2.6875 1.6875 l 0.15625 -0.15625 l 14 14 l 1.0625 -1.0625 l -1.292969 -1.292969 l 1.46875 -1.46875 c 0.449219 -0.449219 0.386719 -1.632812 -0.695312 -1.71875 c -0.273438 0.003907 -0.53125 0.109375 -0.71875 0.304688 l -1.503907 1.433593 l -0.789062 -0.789062 v -4.9375 h -2 v 2.9375 l -2.9375 -2.9375 h 2.9375 v -2 c 0 -0.554688 0.445312 -1 1 -1 s 1 0.445312 1 1 v 2 h 1 c 1.644531 0 3 -1.355469 3 -3 s -1.355469 -3 -3 -3 z m -2.99609375 3.066406 c 0.03515625 1.59375 1.33593775 2.894532 2.92968775 2.929688 z m 1.99609375 4.878906 c -0.554688 0 -1 0.445313 -1 1 v 4.054688 s 0 3 3 3 h 6 c 0.726562 -0.003906 1.507812 -0.296875 2.152344 -0.785156 l -5.328125 -5.328125 c -0.070313 0.066406 -0.171875 0.113281 -0.324219 0.113281 c -0.5 0 -0.5 -0.5 -0.5 -0.5 v -0.4375 l -1.054688 -1.054688 c -0.527343 0.027344 -0.945312 0.457032 -0.945312 0.992188 v 0.5 s 0 0.5 -0.5 0.5 s -0.5 -0.5 -0.5 -0.5 v -0.554688 c 0 -0.554687 -0.445312 -1 -1 -1 z m 0 0", "key": "1qvzxw" }]], "aliases": ["touch-disabled-symbolic"], "gtkIconName": "touch-disabled-symbolic" };
__iconData$1g.node;
const TouchDisabled = createAdwaitaIcon(__iconData$1g);

const __iconData$1f = { "name": "touchpad-disabled", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1.53125 0.46875 l -1.0625 1.0625 l 14 14 l 1.0625 -1.0625 l -0.957031 -0.957031 c 0.269531 -0.453125 0.425781 -0.980469 0.425781 -1.542969 v -7.9375 c 0 -1.667969 -1.363281 -3.03125 -3.03125 -3.03125 h -8.9375 c -0.292969 0 -0.578125 0.042969 -0.84375 0.125 z m 2.53125 2.53125 h 7.90625 c 0.597656 0 1.03125 0.433594 1.03125 1.03125 v 5.96875 h -1.9375 z m -3.9375 0.1875 c -0.0820312 0.265625 -0.125 0.550781 -0.125 0.84375 v 7.9375 c 0 1.667969 1.363281 3.03125 3.03125 3.03125 h 8.90625 l -2 -2 h -1.9375 v -1.9375 l -1.0625 -1.0625 h -4.9375 v -4.9375 z m 1.875 7.8125 h 5 v 2 h -3.96875 c -0.597656 0 -1.03125 -0.433594 -1.03125 -1.03125 z m 10.0625 0 h 0.9375 v 0.9375 z m 0 0", "key": "j2e8pp" }]], "aliases": ["touchpad-disabled-symbolic"], "gtkIconName": "touchpad-disabled-symbolic" };
__iconData$1f.node;
const TouchpadDisabled = createAdwaitaIcon(__iconData$1f);

const __iconData$1e = { "name": "tv", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 0 c -1.660156 0 -3 1.339844 -3 3 v 7 c 0 1.660156 1.339844 3 3 3 h 10 c 1.660156 0 3 -1.339844 3 -3 v -7 c 0 -1.660156 -1.339844 -3 -3 -3 z m 0 2 h 10 c 0.554688 0 1 0.445312 1 1 v 7 c 0 0.554688 -0.445312 1 -1 1 h -10 c -0.554688 0 -1 -0.445312 -1 -1 v -7 c 0 -0.554688 0.445312 -1 1 -1 z m 2 12 c -1.105469 0 -2 0.894531 -2 2 h 10 c 0 -1.105469 -0.894531 -2 -2 -2 z m 0 0", "key": "1hcz59" }]], "aliases": ["tv-symbolic"], "gtkIconName": "tv-symbolic" };
__iconData$1e.node;
const Tv = createAdwaitaIcon(__iconData$1e);

const __iconData$1d = { "name": "uninterruptible-power-supply", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 5 0 s -0.707031 -0.015625 -1.449219 0.355469 c -0.738281 0.371093 -1.550781 1.3125 -1.550781 2.644531 v 10 s -0.015625 0.707031 0.355469 1.449219 c 0.371093 0.738281 1.3125 1.550781 2.644531 1.550781 h 6 s 0.707031 0.015625 1.449219 -0.355469 c 0.738281 -0.371093 1.550781 -1.3125 1.550781 -2.644531 v -10 c 0 -1.332031 -0.8125 -2.273438 -1.550781 -2.644531 c -0.742188 -0.371094 -1.449219 -0.355469 -1.449219 -0.355469 z m 0 2 h 6 c 0.554688 0 1 0.445312 1 1 v 10 c 0 0.554688 -0.445312 1 -1 1 h -6 c -0.554688 0 -1 -0.445312 -1 -1 v -10 c 0 -0.554688 0.445312 -1 1 -1 z m 0 1 v 1 h 4 v -1 z m 5.472656 0 c -0.261718 0.011719 -0.472656 0.230469 -0.472656 0.5 c 0 0.277344 0.222656 0.5 0.5 0.5 s 0.5 -0.222656 0.5 -0.5 s -0.222656 -0.5 -0.5 -0.5 c -0.007812 0 -0.015625 0 -0.027344 0 z m -1.597656 1.992188 c -0.042969 0 -0.082031 0.003906 -0.125 0.007812 c -0.179688 0.050781 -0.34375 0.148438 -0.46875 0.28125 l -3.03125 3 c -0.234375 0.230469 -0.34375 0.582031 -0.28125 0.90625 v 0.8125 h 2.46875 l -1.1875 1.273438 c -0.210938 0.21875 -0.320312 0.539062 -0.28125 0.84375 v 0.09375 v 0.78125 h 1 c 0.265625 0.003906 0.53125 -0.097657 0.71875 -0.28125 l 3 -2.992188 c 0.1875 -0.191406 0.289062 -0.453125 0.28125 -0.71875 c 0.003906 -0.042969 0.003906 -0.082031 0 -0.125 v -0.875 h -2.5625 l 1.3125 -1.28125 c 0.214844 -0.21875 0.320312 -0.539062 0.28125 -0.84375 c 0 -0.03125 0 -0.0625 0 -0.09375 v -0.78125 h -0.9375 c -0.019531 0 -0.042969 0 -0.0625 0 c -0.042969 -0.003906 -0.082031 -0.007812 -0.125 -0.007812 z m 0 0", "key": "1cendu" }]], "aliases": ["uninterruptible-power-supply-symbolic"], "gtkIconName": "uninterruptible-power-supply-symbolic" };
__iconData$1d.node;
const UninterruptiblePowerSupply = createAdwaitaIcon(__iconData$1d);

const __iconData$1c = { "name": "user-available", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 1 c -1.644531 0 -3 1.355469 -3 3 v 6 c 0 1.644531 1.355469 3 3 3 h 1 v 3 l 3 -3 h 6 c 1.644531 0 3 -1.355469 3 -3 v -6 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 0", "key": "4j8irl" }]], "aliases": ["user-available-symbolic"], "gtkIconName": "user-available-symbolic" };
__iconData$1c.node;
const UserAvailable = createAdwaitaIcon(__iconData$1c);

const __iconData$1b = { "name": "user-away", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 1 c -1.644531 0 -3 1.355469 -3 3 v 6 c 0 1.644531 1.355469 3 3 3 h 1 v 3 l 3 -3 h 6 c 1.644531 0 3 -1.355469 3 -3 v -6 c 0 -1.644531 -1.355469 -3 -3 -3 z m 5 3 h 1 v 0.007812 c 0.265625 -0.003906 0.519531 0.101563 0.707031 0.285157 l 2 2 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 l -2 2 c -0.1875 0.183594 -0.441406 0.289063 -0.707031 0.289063 v 0.003906 h -1 v -2 h -4 v -2 h 4 z m 0 0", "key": "19fow9" }]], "aliases": ["user-away-symbolic"], "gtkIconName": "user-away-symbolic" };
__iconData$1b.node;
const UserAway = createAdwaitaIcon(__iconData$1b);

const __iconData$1a = { "name": "user-bookmarks", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4.96875 0.00390625 c -1.332031 0 -2.273438 0.81640575 -2.644531 1.55468775 c -0.371094 0.738281 -0.355469 1.445312 -0.355469 1.445312 l 0.03125 12.472656 l 5.996094 -2.402343 l 6.003906 2.402343 l -0.03125 -12.476562 c 0 -0.003906 0.011719 -0.707031 -0.355469 -1.441406 c -0.371093 -0.738282 -1.3125 -1.55468775 -2.644531 -1.55468775 z m 0 1.99999975 h 6 c 0.695312 0.011719 1.003906 0.367188 1 1 l 0.023438 9.519532 l -3.996094 -1.601563 l -4.003906 1.601563 l -0.023438 -9.523438 c -0.007812 -0.648438 0.398438 -0.996094 1 -0.996094 z m 0 0", "key": "1o9g4n" }]], "aliases": ["user-bookmarks-symbolic"], "gtkIconName": "user-bookmarks-symbolic" };
__iconData$1a.node;
const UserBookmarks = createAdwaitaIcon(__iconData$1a);

const __iconData$19 = { "name": "user-busy", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 1 c -1.644531 0 -3 1.355469 -3 3 v 6 c 0 1.644531 1.355469 3 3 3 h 1 v 3 l 3 -3 h 6 c 1.644531 0 3 -1.355469 3 -3 v -6 c 0 -1.644531 -1.355469 -3 -3 -3 z m 1 5 h 8 v 2 h -8 z m 0 0", "key": "q5pp4r" }]], "aliases": ["user-busy-symbolic"], "gtkIconName": "user-busy-symbolic" };
__iconData$19.node;
const UserBusy = createAdwaitaIcon(__iconData$19);

const __iconData$18 = { "name": "user-desktop", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 1.003906 c -1.644531 0 -3 1.355469 -3 3 v 8 c 0 1.644532 1.355469 3 3 3 h 10 c 1.644531 0 3 -1.355468 3 -3 v -6 c 0 -1.644531 -1.355469 -3 -3 -3 h -3.585938 l -1.707031 -1.707031 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0 2 h 3.585938 l 1 1 h -5.585938 c 0 -0.5625 0.4375 -1 1 -1 z m -1 2 h 11 c 0.5625 0 1 0.4375 1 1 v 6 c 0 0.5625 -0.4375 1 -1 1 h -10 c -0.5625 0 -1 -0.4375 -1 -1 z m 0 0", "key": "buhm2m" }]], "aliases": ["user-desktop-symbolic"], "gtkIconName": "user-desktop-symbolic" };
__iconData$18.node;
const UserDesktop = createAdwaitaIcon(__iconData$18);

const __iconData$17 = { "name": "user-home", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7.972656 0.363281 c -0.5 0 -1 0.171875 -1.40625 0.511719 l -4.464844 3.71875 c -0.714843 0.597656 -1.128906 1.480469 -1.128906 2.410156 v 6 c 0 1.65625 1.34375 3 3 3 h 8 c 1.65625 0 3 -1.34375 3 -3 v -6 c 0 -0.929687 -0.414062 -1.8125 -1.128906 -2.410156 l -4.464844 -3.71875 c -0.40625 -0.339844 -0.90625 -0.511719 -1.40625 -0.511719 z m -0.015625 2 c 0.050781 -0.003906 0.101563 0.011719 0.144531 0.046875 l 4.464844 3.71875 c 0.257813 0.21875 0.40625 0.539063 0.40625 0.875 v 6 c 0 0.5625 -0.4375 1 -1 1 h -2 v -5 c 0 -0.554687 -0.445312 -1 -1 -1 h -2 c -0.554687 0 -1 0.445313 -1 1 v 5 h -2 c -0.5625 0 -1 -0.4375 -1 -1 v -6 c 0 -0.335937 0.148438 -0.65625 0.40625 -0.875 l 4.464844 -3.71875 c 0.035156 -0.027344 0.074219 -0.042968 0.113281 -0.046875 z m 0 0", "key": "f98d8d" }]], "aliases": ["user-home-symbolic"], "gtkIconName": "user-home-symbolic" };
__iconData$17.node;
const UserHome = createAdwaitaIcon(__iconData$17);

const __iconData$16 = { "name": "user-idle", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 3 1 c -1.644531 0 -3 1.355469 -3 3 v 6 c 0 1.644531 1.355469 3 3 3 h 1 v 3 l 3 -3 h 6 c 1.644531 0 3 -1.355469 3 -3 v -6 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 0", "key": "jcp0a6" }]], "aliases": ["user-idle-symbolic"], "gtkIconName": "user-idle-symbolic" };
__iconData$16.node;
const UserIdle = createAdwaitaIcon(__iconData$16);

const __iconData$15 = { "name": "user-info", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M6 0a3 3 0 100 6 3 3 0 000-6zM4.5 7A4.49 4.49 0 000 11.5v.5c0 1 1 1 1 1h6V8.875c0-.83.587-1.554 1.355-1.79A4.532 4.532 0 007.5 7zM9 9v4h1V9z", "key": "9ufid" }], ["path", { "fill": "currentColor", "d": "M8.875 8A.863.863 0 008 8.875v6.25c0 .492.383.875.875.875h6.25a.863.863 0 00.875-.875v-6.25A.863.863 0 0015.125 8zM11 9h2v1h-2zm0 2h2v4h-2z", "key": "1w3hnj" }]], "aliases": ["user-info-symbolic"], "gtkIconName": "user-info-symbolic" };
__iconData$15.node;
const UserInfo = createAdwaitaIcon(__iconData$15);

const __iconData$14 = { "name": "user-invisible", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 3 1 c -1.644531 0 -3 1.355469 -3 3 v 6 c 0 1.644531 1.355469 3 3 3 h 1 v 3 l 3 -3 h 6 c 1.644531 0 3 -1.355469 3 -3 v -6 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 2 h 10 c 0.554688 0 1 0.445312 1 1 v 6 c 0 0.554688 -0.445312 1 -1 1 h -10 c -0.570312 0 -1 -0.429688 -1 -1 v -6 c 0 -0.554688 0.445312 -1 1 -1 z m 0 0", "key": "1wc4ry" }]], "aliases": ["user-invisible-symbolic"], "gtkIconName": "user-invisible-symbolic" };
__iconData$14.node;
const UserInvisible = createAdwaitaIcon(__iconData$14);

const __iconData$13 = { "name": "user-not-tracked", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1.53125 0.46875 l -1.0625 1.0625 l 14 14 l 1.0625 -1.0625 l -2.382812 -2.382812 c 1.265624 -1.0625 2.171874 -2.496094 2.589843 -4.097657 c -0.914062 -3.523437 -4.097656 -5.984375 -7.738281 -5.988281 c -1.367188 0.011719 -2.707031 0.371094 -3.894531 1.042969 z m 6.46875 3.53125 c 2.210938 0 4 1.789062 4 4 c -0.003906 0.800781 -0.246094 1.578125 -0.699219 2.238281 l -1.46875 -1.46875 c 0.105469 -0.242187 0.164063 -0.503906 0.167969 -0.769531 c 0 -1.105469 -0.894531 -2 -2 -2 c -0.265625 0.003906 -0.527344 0.0625 -0.769531 0.167969 l -1.46875 -1.46875 c 0.660156 -0.453125 1.4375 -0.695313 2.238281 -0.699219 z m -6.144531 0.917969 c -0.753907 0.898437 -1.296875 1.957031 -1.59375 3.09375 c 0.914062 3.523437 4.097656 5.984375 7.738281 5.988281 c 0.855469 -0.007812 1.703125 -0.152344 2.511719 -0.425781 l -1.667969 -1.667969 c -0.277344 0.058594 -0.5625 0.089844 -0.84375 0.09375 c -2.210938 0 -4 -1.789062 -4 -4 c 0.003906 -0.28125 0.035156 -0.566406 0.09375 -0.84375 z m 0 0", "key": "17iond" }]], "aliases": ["user-not-tracked-symbolic"], "gtkIconName": "user-not-tracked-symbolic" };
__iconData$13.node;
const UserNotTracked = createAdwaitaIcon(__iconData$13);

const __iconData$12 = { "name": "user-offline", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 3 1 c -1.644531 0 -3 1.355469 -3 3 v 6 c 0 1.644531 1.355469 3 3 3 h 1 v 3 l 3 -3 h 6 c 1.644531 0 3 -1.355469 3 -3 v -6 c 0 -1.644531 -1.355469 -3 -3 -3 z m 3 3 c 0.265625 0 0.519531 0.105469 0.707031 0.292969 l 1.292969 1.292969 l 1.292969 -1.292969 c 0.1875 -0.1875 0.441406 -0.292969 0.707031 -0.292969 s 0.519531 0.105469 0.707031 0.292969 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 l -1.292969 1.292969 l 1.292969 1.292969 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 s -1.023437 0.390625 -1.414062 0 l -1.292969 -1.292969 l -1.292969 1.292969 c -0.390625 0.390625 -1.023437 0.390625 -1.414062 0 s -0.390625 -1.023437 0 -1.414062 l 1.292969 -1.292969 l -1.292969 -1.292969 c -0.390625 -0.390625 -0.390625 -1.023437 0 -1.414062 c 0.1875 -0.1875 0.441406 -0.292969 0.707031 -0.292969 z m 0 0", "key": "3f6xwq" }]], "aliases": ["user-offline-symbolic"], "gtkIconName": "user-offline-symbolic" };
__iconData$12.node;
const UserOffline = createAdwaitaIcon(__iconData$12);

const __iconData$11 = { "name": "user-status-pending", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 6 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 5 0 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 5 0 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 0 0", "key": "14xcmx" }], ["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 3 1 c -1.644531 0 -3 1.355469 -3 3 v 1 h 16 v -1 c 0 -1.644531 -1.355469 -3 -3 -3 z m -2.824219 10 c 0.417969 1.160156 1.53125 2 2.824219 2 h 1 v 3 l 3 -3 h 6 c 1.292969 0 2.40625 -0.839844 2.824219 -2 z m 0 0", "key": "1urnp4" }]], "aliases": ["user-status-pending-symbolic"], "gtkIconName": "user-status-pending-symbolic" };
__iconData$11.node;
const UserStatusPending = createAdwaitaIcon(__iconData$11);

const __iconData$10 = { "name": "user-trash-full", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 6.5 0 c -1.378906 0 -2.5 1.121094 -2.5 2.5 v 0.5 h -3 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 h 0.660156 c -0.765625 2.683594 -0.808594 5.523438 -0.132812 8.230469 l 0.019531 0.070312 c 0.394531 1.589844 1.816406 2.699219 3.453125 2.699219 h 6 c 1.636719 0 3.058594 -1.109375 3.457031 -2.699219 l 0.015625 -0.070312 c 0.675782 -2.707031 0.632813 -5.546875 -0.128906 -8.230469 h 0.65625 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 h -3.019531 v -0.5 c 0 -1.378906 -1.121094 -2.5 -2.5 -2.5 z m 0 2 h 2.980469 c 0.285156 0 0.5 0.210938 0.5 0.5 v 0.5 h -3.980469 v -0.5 c 0 -0.289062 0.210938 -0.5 0.5 -0.5 z m -2.753906 3 h 8.511718 l 0.105469 0.351562 c 0.71875 2.40625 0.777344 4.957032 0.171875 7.390626 l -0.019531 0.074218 c -0.175781 0.699219 -0.792969 1.183594 -1.515625 1.183594 h -6 c -0.722656 0 -1.339844 -0.484375 -1.515625 -1.183594 l -0.015625 -0.074218 c -0.609375 -2.433594 -0.550781 -4.984376 0.171875 -7.390626 z m 0 0", "key": "acrbdl" }], ["path", { "fill": "currentColor", "d": "m 6.5 7.191406 c -0.355469 0.855469 -0.480469 1.644532 -0.460938 2.402344 c 0.023438 0.761719 0.195313 1.5 0.46875 2.234375 c 0.0625 0.167969 0.03125 0.355469 -0.082031 0.492187 c -0.117187 0.140626 -0.296875 0.207032 -0.472656 0.175782 s -0.324219 -0.152344 -0.382813 -0.324219 c -0.601562 -1.625 -0.808593 -3.390625 0.003907 -5.363281 c 0.105469 -0.253906 0.398437 -0.375 0.65625 -0.269532 c 0.253906 0.105469 0.375 0.398438 0.269531 0.652344 z m 0 0", "key": "mktbh6" }], ["path", { "fill": "currentColor", "d": "m 10.429688 6.808594 c 0.796874 1.929687 0.632812 3.707031 0.007812 5.367187 c -0.097656 0.257813 -0.386719 0.390625 -0.644531 0.292969 c -0.257813 -0.097656 -0.390625 -0.386719 -0.292969 -0.644531 c 0.558594 -1.484375 0.695312 -2.960938 0.007812 -4.632813 c -0.105468 -0.257812 0.015626 -0.546875 0.269532 -0.652344 c 0.253906 -0.105468 0.546875 0.015626 0.652344 0.269532 z m 0 0", "key": "q5lzjz" }]], "aliases": ["user-trash-full-symbolic"], "gtkIconName": "user-trash-full-symbolic" };
__iconData$10.node;
const UserTrashFull = createAdwaitaIcon(__iconData$10);

const __iconData$$ = { "name": "user-trash", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 6.5 0 c -1.378906 0 -2.5 1.121094 -2.5 2.5 v 0.5 h -3 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 h 1 v 8 c 0 1.65625 1.34375 3 3 3 h 6 c 1.65625 0 3 -1.34375 3 -3 v -8 h 1 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 h -3.023438 v -0.5 c 0 -1.378906 -1.117187 -2.5 -2.5 -2.5 z m 0 2 h 2.976562 c 0.289063 0 0.5 0.210938 0.5 0.5 v 0.5 h -3.976562 v -0.5 c 0 -0.289062 0.210938 -0.5 0.5 -0.5 z m -2.5 3 h 8 v 8 c 0 0.5625 -0.4375 1 -1 1 h -6 c -0.5625 0 -1 -0.4375 -1 -1 z m 0 0", "key": "qerapp" }], ["path", { "fill": "currentColor", "d": "m 7 7 v 5 c 0 0.277344 -0.222656 0.5 -0.5 0.5 s -0.5 -0.222656 -0.5 -0.5 v -5 c 0 -0.277344 0.222656 -0.5 0.5 -0.5 s 0.5 0.222656 0.5 0.5 z m 0 0", "key": "1b7jtx" }], ["path", { "fill": "currentColor", "d": "m 10 7 v 5 c 0 0.277344 -0.222656 0.5 -0.5 0.5 s -0.5 -0.222656 -0.5 -0.5 v -5 c 0 -0.277344 0.222656 -0.5 0.5 -0.5 s 0.5 0.222656 0.5 0.5 z m 0 0", "key": "1uy189" }]], "aliases": ["user-trash-symbolic"], "gtkIconName": "user-trash-symbolic" };
__iconData$$.node;
const UserTrash = createAdwaitaIcon(__iconData$$);

const __iconData$_ = { "name": "utilities-terminal", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M2.2 0C.993 0 0 1.007 0 2.209v10.582C0 13.993.994 15 2.2 15h11.6c1.206 0 2.2-1.007 2.2-2.209V2.209C16 1.007 15.006 0 13.8 0zm0 2h11.6c.124 0 .2.071.2.209v10.582c0 .138-.076.209-.2.209H2.2c-.124 0-.2-.071-.2-.209V2.209C2 2.071 2.076 2 2.2 2z", "key": "mwxlbq" }], ["path", { "fill": "currentColor", "d": "M4.494 5.895a.6.6 0 00-.418 1.029L5.652 8.5l-1.576 1.576a.6.6 0 10.848.848l2-2a.6.6 0 000-.848l-2-2a.6.6 0 00-.43-.181z", "key": "rtn6yu" }], ["path", { "fill": "currentColor", "d": "M8 10h3v1H8z", "key": "1htkpy" }]], "aliases": ["utilities-terminal-symbolic"], "gtkIconName": "utilities-terminal-symbolic" };
__iconData$_.node;
const UtilitiesTerminal = createAdwaitaIcon(__iconData$_);

const __iconData$Z = { "name": "value-decrease", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 7 h 10 v 2 h -10 z m 0 0", "key": "hrwg00" }]], "aliases": ["value-decrease-symbolic"], "gtkIconName": "value-decrease-symbolic" };
__iconData$Z.node;
const ValueDecrease = createAdwaitaIcon(__iconData$Z);

const __iconData$Y = { "name": "value-increase", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 3 v 4 h -4 v 2 h 4 v 4 h 2 v -4 h 4 v -2 h -4 v -4 z m 0 0", "key": "1ucih4" }]], "aliases": ["value-increase-symbolic"], "gtkIconName": "value-increase-symbolic" };
__iconData$Y.node;
const ValueIncrease = createAdwaitaIcon(__iconData$Y);

const __iconData$X = { "name": "video-display", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 0 c -1.660156 0 -3 1.339844 -3 3 v 7 c 0 1.660156 1.339844 3 3 3 h 10 c 1.660156 0 3 -1.339844 3 -3 v -7 c 0 -1.660156 -1.339844 -3 -3 -3 z m 0 2 h 10 c 0.554688 0 1 0.445312 1 1 v 7 c 0 0.554688 -0.445312 1 -1 1 h -10 c -0.554688 0 -1 -0.445312 -1 -1 v -7 c 0 -0.554688 0.445312 -1 1 -1 z m 2 12 c -1.105469 0 -2 0.894531 -2 2 h 10 c 0 -1.105469 -0.894531 -2 -2 -2 z m 0 0", "key": "1hcz59" }]], "aliases": ["video-display-symbolic"], "gtkIconName": "video-display-symbolic" };
__iconData$X.node;
const VideoDisplay = createAdwaitaIcon(__iconData$X);

const __iconData$W = { "name": "video-joined-displays", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 9.5 2 c -1.21875 0 -2.246094 0.898438 -2.457031 2.0625 c -0.175781 -0.042969 -0.359375 -0.0625 -0.542969 -0.0625 h -4 c -1.367188 0 -2.5 1.132812 -2.5 2.5 v 3 c 0 1.367188 1.132812 2.5 2.5 2.5 h 4 c 0.5625 0 1.082031 -0.191406 1.5 -0.511719 c 0.417969 0.320313 0.9375 0.511719 1.5 0.511719 h 4 c 1.367188 0 2.5 -1.132812 2.5 -2.5 v -5 c 0 -1.367188 -1.132812 -2.5 -2.5 -2.5 z m 0 2 h 4 c 0.292969 0 0.5 0.207031 0.5 0.5 v 5 c 0 0.292969 -0.207031 0.5 -0.5 0.5 h -4 c -0.292969 0 -0.5 -0.207031 -0.5 -0.5 v -5 c 0 -0.292969 0.207031 -0.5 0.5 -0.5 z m -7 2 h 4 c 0.292969 0 0.5 0.207031 0.5 0.5 v 3 c 0 0.292969 -0.207031 0.5 -0.5 0.5 h -4 c -0.292969 0 -0.5 -0.207031 -0.5 -0.5 v -3 c 0 -0.292969 0.207031 -0.5 0.5 -0.5 z m 0.5 7 c -0.554688 0 -1 0.445312 -1 1 h 5 c 0 -0.554688 -0.445312 -1 -1 -1 z m 7 0 c -0.554688 0 -1 0.445312 -1 1 h 5 c 0 -0.554688 -0.445312 -1 -1 -1 z m 0 0", "key": "8eart" }]], "aliases": ["video-joined-displays-symbolic"], "gtkIconName": "video-joined-displays-symbolic" };
__iconData$W.node;
const VideoJoinedDisplays = createAdwaitaIcon(__iconData$W);

const __iconData$V = { "name": "video-single-display", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 0 c -1.660156 0 -3 1.339844 -3 3 v 7 c 0 1.660156 1.339844 3 3 3 h 10 c 1.660156 0 3 -1.339844 3 -3 v -7 c 0 -1.660156 -1.339844 -3 -3 -3 z m 0 2 h 10 c 0.554688 0 1 0.445312 1 1 v 7 c 0 0.554688 -0.445312 1 -1 1 h -10 c -0.554688 0 -1 -0.445312 -1 -1 v -7 c 0 -0.554688 0.445312 -1 1 -1 z m 4 1 c 0 1.105469 -0.894531 2 -2 2 v 1 h 2 v 4 h 2 v -7 z m -2 11 c -1.105469 0 -2 0.894531 -2 2 h 10 c 0 -1.105469 -0.894531 -2 -2 -2 z m 0 0", "key": "1ny7zx" }]], "aliases": ["video-single-display-symbolic"], "gtkIconName": "video-single-display-symbolic" };
__iconData$V.node;
const VideoSingleDisplay = createAdwaitaIcon(__iconData$V);

const __iconData$U = { "name": "video-x-generic", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 0.679688 3.996094 h -0.679688 v 9 h 0.644531 l 4.355469 -4.53125 z m 0 0", "key": "1o29e4" }], ["path", { "fill": "currentColor", "d": "m 7 3.003906 c -1.644531 0 -3 1.355469 -3 3 v 5 c 0 1.644532 1.355469 3 3 3 h 6 c 1.644531 0 3 -1.355468 3 -3 v -5 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 2 h 6 c 0.570312 0 1 0.429688 1 1 v 5 c 0 0.570313 -0.429688 1 -1 1 h -6 c -0.570312 0 -1 -0.429687 -1 -1 v -5 c 0 -0.570312 0.429688 -1 1 -1 z m 0 0", "key": "hkfps1" }]], "aliases": ["video-x-generic-symbolic"], "gtkIconName": "video-x-generic-symbolic" };
__iconData$U.node;
const VideoXGeneric = createAdwaitaIcon(__iconData$U);

const __iconData$T = { "name": "view-app-grid", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3.992188 3 c -0.554688 0 -1 0.445312 -1 1 s 0.445312 1 1 1 c 0.554687 0 1 -0.445312 1 -1 s -0.445313 -1 -1 -1 z m 4 0 c -0.554688 0 -1 0.445312 -1 1 s 0.445312 1 1 1 c 0.554687 0 1 -0.445312 1 -1 s -0.445313 -1 -1 -1 z m 4 0 c -0.554688 0 -1 0.445312 -1 1 s 0.445312 1 1 1 c 0.554687 0 1 -0.445312 1 -1 s -0.445313 -1 -1 -1 z m -8 4 c -0.554688 0 -1 0.445312 -1 1 s 0.445312 1 1 1 c 0.554687 0 1 -0.445312 1 -1 s -0.445313 -1 -1 -1 z m 4 0 c -0.554688 0 -1 0.445312 -1 1 s 0.445312 1 1 1 c 0.554687 0 1 -0.445312 1 -1 s -0.445313 -1 -1 -1 z m 4 0 c -0.554688 0 -1 0.445312 -1 1 s 0.445312 1 1 1 c 0.554687 0 1 -0.445312 1 -1 s -0.445313 -1 -1 -1 z m -8 4 c -0.554688 0 -1 0.445312 -1 1 s 0.445312 1 1 1 c 0.554687 0 1 -0.445312 1 -1 s -0.445313 -1 -1 -1 z m 4 0 c -0.554688 0 -1 0.445312 -1 1 s 0.445312 1 1 1 c 0.554687 0 1 -0.445312 1 -1 s -0.445313 -1 -1 -1 z m 4 0 c -0.554688 0 -1 0.445312 -1 1 s 0.445312 1 1 1 c 0.554687 0 1 -0.445312 1 -1 s -0.445313 -1 -1 -1 z m 0 0", "key": "1n7yvx" }]], "aliases": ["view-app-grid-symbolic"], "gtkIconName": "view-app-grid-symbolic" };
__iconData$T.node;
const ViewAppGrid = createAdwaitaIcon(__iconData$T);

const __iconData$S = { "name": "view-conceal", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1.53125 0.46875 l -1.0625 1.0625 l 14 14 l 1.0625 -1.0625 l -2.382812 -2.382812 c 1.265624 -1.0625 2.171874 -2.496094 2.589843 -4.097657 c -0.914062 -3.523437 -4.097656 -5.984375 -7.738281 -5.988281 c -1.367188 0.011719 -2.707031 0.371094 -3.894531 1.042969 z m 6.46875 3.53125 c 2.210938 0 4 1.789062 4 4 c -0.003906 0.800781 -0.246094 1.578125 -0.699219 2.238281 l -1.46875 -1.46875 c 0.105469 -0.242187 0.164063 -0.503906 0.167969 -0.769531 c 0 -1.105469 -0.894531 -2 -2 -2 c -0.265625 0.003906 -0.527344 0.0625 -0.769531 0.167969 l -1.46875 -1.46875 c 0.660156 -0.453125 1.4375 -0.695313 2.238281 -0.699219 z m -6.144531 0.917969 c -0.753907 0.898437 -1.296875 1.957031 -1.59375 3.09375 c 0.914062 3.523437 4.097656 5.984375 7.738281 5.988281 c 0.855469 -0.007812 1.703125 -0.152344 2.511719 -0.425781 l -1.667969 -1.667969 c -0.277344 0.058594 -0.5625 0.089844 -0.84375 0.09375 c -2.210938 0 -4 -1.789062 -4 -4 c 0.003906 -0.28125 0.035156 -0.566406 0.09375 -0.84375 z m 0 0", "key": "17iond" }]], "aliases": ["view-conceal-symbolic"], "gtkIconName": "view-conceal-symbolic" };
__iconData$S.node;
const ViewConceal = createAdwaitaIcon(__iconData$S);

const __iconData$R = { "name": "view-continuous", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 5.5 0 c -0.277344 0 -0.5 0.222656 -0.5 0.5 v 1 c 0 0.277344 0.222656 0.5 0.5 0.5 h 5 c 0.277344 0 0.5 -0.222656 0.5 -0.5 v -1 c 0 -0.277344 -0.222656 -0.5 -0.5 -0.5 z m 0 3 c -0.277344 0 -0.5 0.222656 -0.5 0.5 v 1 c 0 0.277344 0.222656 0.5 0.5 0.5 h 5 c 0.277344 0 0.5 -0.222656 0.5 -0.5 v -1 c 0 -0.277344 -0.222656 -0.5 -0.5 -0.5 z m 0 8 c -0.277344 0 -0.5 0.222656 -0.5 0.5 v 1 c 0 0.277344 0.222656 0.5 0.5 0.5 h 5 c 0.277344 0 0.5 -0.222656 0.5 -0.5 v -1 c 0 -0.277344 -0.222656 -0.5 -0.5 -0.5 z m 0 3 c -0.277344 0 -0.5 0.222656 -0.5 0.5 v 1 c 0 0.277344 0.222656 0.5 0.5 0.5 h 5 c 0.277344 0 0.5 -0.222656 0.5 -0.5 v -1 c 0 -0.277344 -0.222656 -0.5 -0.5 -0.5 z m 0 0", "key": "15hqg5" }], ["path", { "fill": "currentColor", "d": "m 15 7 h -14 v 2 h 14 z m 0 0", "key": "9atgev" }]], "aliases": ["view-continuous-symbolic"], "gtkIconName": "view-continuous-symbolic" };
__iconData$R.node;
const ViewContinuous = createAdwaitaIcon(__iconData$R);

const __iconData$Q = { "name": "view-dual", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 3.5 5 c -0.277344 0 -0.5 0.222656 -0.5 0.5 v 1 c 0 0.277344 0.222656 0.5 0.5 0.5 h 2 c 0.277344 0 0.5 -0.222656 0.5 -0.5 v -1 c 0 -0.277344 -0.222656 -0.5 -0.5 -0.5 z m 7 0 c -0.277344 0 -0.5 0.222656 -0.5 0.5 v 1 c 0 0.277344 0.222656 0.5 0.5 0.5 h 2 c 0.277344 0 0.5 -0.222656 0.5 -0.5 v -1 c 0 -0.277344 -0.222656 -0.5 -0.5 -0.5 z m -7 3 c -0.277344 0 -0.5 0.222656 -0.5 0.5 v 1 c 0 0.277344 0.222656 0.5 0.5 0.5 h 2 c 0.277344 0 0.5 -0.222656 0.5 -0.5 v -1 c 0 -0.277344 -0.222656 -0.5 -0.5 -0.5 z m 7 0 c -0.277344 0 -0.5 0.222656 -0.5 0.5 v 1 c 0 0.277344 0.222656 0.5 0.5 0.5 h 2 c 0.277344 0 0.5 -0.222656 0.5 -0.5 v -1 c 0 -0.277344 -0.222656 -0.5 -0.5 -0.5 z m 0 0", "key": "l3wbfl" }], ["path", { "fill": "currentColor", "d": "m 3 1 c -1.644531 0 -3 1.355469 -3 3 v 8 c 0 1.644531 1.355469 3 3 3 h 10 c 1.644531 0 3 -1.355469 3 -3 v -8 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 2 h 4 v 10 h -4 c -0.570312 0 -1 -0.429688 -1 -1 v -8 c 0 -0.570312 0.429688 -1 1 -1 z m 6 0 h 4 c 0.570312 0 1 0.429688 1 1 v 8 c 0 0.570312 -0.429688 1 -1 1 h -4 z m 0 0", "key": "1vpx1e" }]], "aliases": ["view-dual-symbolic"], "gtkIconName": "view-dual-symbolic" };
__iconData$Q.node;
const ViewDual = createAdwaitaIcon(__iconData$Q);

const __iconData$P = { "name": "view-fullscreen", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1 9 c -0.550781 0 -1 0.449219 -1 1 v 6 h 6 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 h -2.585938 l 3.292969 -3.292969 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 s -0.519531 0.105469 -0.707031 0.292969 l -3.292969 3.292969 v -2.585938 c 0 -0.550781 -0.449219 -1 -1 -1 z m 0 0", "key": "zlubr7" }], ["path", { "fill": "currentColor", "d": "m 15 7 c 0.550781 0 1 -0.449219 1 -1 v -6 h -6 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 h 2.585938 l -3.292969 3.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 c 0.1875 0.1875 0.441406 0.292969 0.707031 0.292969 s 0.519531 -0.105469 0.707031 -0.292969 l 3.292969 -3.292969 v 2.585938 c 0 0.550781 0.449219 1 1 1 z m 0 0", "key": "yxdqfs" }]], "aliases": ["view-fullscreen-symbolic"], "gtkIconName": "view-fullscreen-symbolic" };
__iconData$P.node;
const ViewFullscreen = createAdwaitaIcon(__iconData$P);

const __iconData$O = { "name": "view-grid", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 2 1 c -0.554688 0 -1 0.445312 -1 1 v 4 c 0 0.554688 0.445312 1 1 1 h 4 c 0.554688 0 1 -0.445312 1 -1 v -4 c 0 -0.554688 -0.445312 -1 -1 -1 z m 8 0 c -0.554688 0 -1 0.445312 -1 1 v 4 c 0 0.554688 0.445312 1 1 1 h 4 c 0.554688 0 1 -0.445312 1 -1 v -4 c 0 -0.554688 -0.445312 -1 -1 -1 z m -8 8 c -0.554688 0 -1 0.445312 -1 1 v 4 c 0 0.554688 0.445312 1 1 1 h 4 c 0.554688 0 1 -0.445312 1 -1 v -4 c 0 -0.554688 -0.445312 -1 -1 -1 z m 8 0 c -0.554688 0 -1 0.445312 -1 1 v 4 c 0 0.554688 0.445312 1 1 1 h 4 c 0.554688 0 1 -0.445312 1 -1 v -4 c 0 -0.554688 -0.445312 -1 -1 -1 z m 0 0", "key": "1c48ma" }]], "aliases": ["view-grid-symbolic"], "gtkIconName": "view-grid-symbolic" };
__iconData$O.node;
const ViewGrid = createAdwaitaIcon(__iconData$O);

const __iconData$N = { "name": "view-list-bullet-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 13.5 2.007812 s 0.5 0.222657 0.5 0.5 v 0.988282 c 0 0.273437 -0.5 0.5 -0.5 0.5 h -1 s -0.5 -0.226563 -0.5 -0.5 v -0.988282 c 0 -0.277343 0.5 -0.5 0.5 -0.5 z m -4 0 c 0.277344 0 0.5 0.222657 0.5 0.5 v 0.988282 c 0 0.273437 -0.222656 0.5 -0.5 0.5 h -8 c -0.277344 0 -0.5 -0.226563 -0.5 -0.5 v -0.988282 c 0 -0.277343 0.222656 -0.5 0.5 -0.5 z m 4 5 s 0.5 0.222657 0.5 0.5 v 0.988282 c 0 0.273437 -0.5 0.5 -0.5 0.5 h -1 s -0.5 -0.226563 -0.5 -0.5 v -0.988282 c 0 -0.277343 0.5 -0.5 0.5 -0.5 z m -4 0 s 0.5 0.222657 0.5 0.5 v 0.988282 c 0 0.273437 -0.222656 0.5 -0.5 0.5 h -8 c -0.277344 0 -0.5 -0.226563 -0.5 -0.5 v -0.988282 c 0 -0.277343 0.5 -0.5 0.5 -0.5 z m 4 5 c 0.277344 0 0.5 0.222657 0.5 0.5 v 0.988282 c 0 0.273437 -0.5 0.5 -0.5 0.5 h -1 s -0.5 -0.226563 -0.5 -0.5 v -0.988282 c 0 -0.277343 0.222656 -0.5 0.5 -0.5 z m -4 0 c 0.277344 0 0.5 0.222657 0.5 0.5 v 0.988282 c 0 0.273437 -0.222656 0.5 -0.5 0.5 h -8 c -0.277344 0 -0.5 -0.226563 -0.5 -0.5 v -0.988282 c 0 -0.277343 0.222656 -0.5 0.5 -0.5 z m 0 0", "key": "15ncna" }]], "aliases": ["view-list-bullet-rtl-symbolic"], "gtkIconName": "view-list-bullet-rtl-symbolic" };
__iconData$N.node;
const ViewListBulletRtl = createAdwaitaIcon(__iconData$N);

const __iconData$M = { "name": "view-list-bullet", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 2.5 2.007812 s -0.5 0.222657 -0.5 0.5 v 0.988282 c 0 0.273437 0.5 0.5 0.5 0.5 h 1 s 0.5 -0.226563 0.5 -0.5 v -0.988282 c 0 -0.277343 -0.5 -0.5 -0.5 -0.5 z m 4 0 c -0.277344 0 -0.5 0.222657 -0.5 0.5 v 0.988282 c 0 0.273437 0.222656 0.5 0.5 0.5 h 8 c 0.277344 0 0.5 -0.226563 0.5 -0.5 v -0.988282 c 0 -0.277343 -0.222656 -0.5 -0.5 -0.5 z m -4 5 s -0.5 0.222657 -0.5 0.5 v 0.988282 c 0 0.273437 0.5 0.5 0.5 0.5 h 1 s 0.5 -0.226563 0.5 -0.5 v -0.988282 c 0 -0.277343 -0.5 -0.5 -0.5 -0.5 z m 4 0 s -0.5 0.222657 -0.5 0.5 v 0.988282 c 0 0.273437 0.222656 0.5 0.5 0.5 h 8 c 0.277344 0 0.5 -0.226563 0.5 -0.5 v -0.988282 c 0 -0.277343 -0.5 -0.5 -0.5 -0.5 z m -4 5 c -0.277344 0 -0.5 0.222657 -0.5 0.5 v 0.988282 c 0 0.273437 0.5 0.5 0.5 0.5 h 1 s 0.5 -0.226563 0.5 -0.5 v -0.988282 c 0 -0.277343 -0.222656 -0.5 -0.5 -0.5 z m 4 0 c -0.277344 0 -0.5 0.222657 -0.5 0.5 v 0.988282 c 0 0.273437 0.222656 0.5 0.5 0.5 h 8 c 0.277344 0 0.5 -0.226563 0.5 -0.5 v -0.988282 c 0 -0.277343 -0.222656 -0.5 -0.5 -0.5 z m 0 0", "key": "1eil80" }]], "aliases": ["view-list-bullet-symbolic"], "gtkIconName": "view-list-bullet-symbolic" };
__iconData$M.node;
const ViewListBullet = createAdwaitaIcon(__iconData$M);

const __iconData$L = { "name": "view-list-ordered-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 12.5 1 s 0 1 -1 1 l -0.003906 1 h 1.003906 v 2 h 1.5 v -4 z m -11 1.007812 c -0.277344 0 -0.5 0.222657 -0.5 0.5 v 0.988282 c 0 0.273437 0.222656 0.5 0.5 0.5 h 7 c 0.277344 0 0.5 -0.226563 0.5 -0.5 v -0.988282 c 0 -0.277343 -0.222656 -0.5 -0.5 -0.5 z m 11.433594 3.578126 c -0.738282 0.003906 -1.304688 0.351562 -1.933594 0.914062 l 0.5 1 c 0.898438 -0.589844 1.839844 -1.050781 1.863281 -0.304688 c 0.023438 0.535157 -1.550781 0.804688 -2.070312 1.835938 v 0.96875 h 3.707031 v -1 h -2 c 1.5 -0.5 1.777344 -1.296875 1.832031 -1.789062 c 0.089844 -0.808594 -0.894531 -1.632813 -1.898437 -1.625 z m -11.433594 1.421874 c -0.277344 0 -0.5 0.222657 -0.5 0.5 v 0.988282 c 0 0.273437 0.222656 0.5 0.5 0.5 h 7 c 0.277344 0 0.5 -0.226563 0.5 -0.5 v -0.988282 c 0 -0.277343 -0.222656 -0.5 -0.5 -0.5 z m 11.351562 3.679688 v 0.003906 c -0.542968 0 -1.105468 0.136719 -1.625 0.417969 l -0.140624 0.074219 l 0.363281 1.191406 l 0.199219 -0.085938 c 0.597656 -0.386718 1.488281 -0.492187 1.453124 -0.035156 c -0.035156 0.460938 -0.535156 0.433594 -1.132812 0.433594 v 0.96875 c 0.488281 0 1.53125 0.011719 1.382812 0.472656 c -0.179687 0.570313 -1.167968 0.128906 -1.734374 -0.007812 l -0.199219 -0.082032 l -0.367188 1.238282 l 0.15625 0.070312 c 0.496094 0.234375 0.945313 0.339844 1.5 0.339844 c 0.632813 0 1.167969 -0.132812 1.5625 -0.390625 c 0.390625 -0.261719 0.636719 -0.660156 0.636719 -1.121094 c 0 -0.539062 -0.371094 -0.902343 -0.855469 -1.117187 c 0.53125 -0.355469 0.492188 -0.628906 0.601563 -0.972656 c 0 -0.429688 -0.179688 -0.796876 -0.496094 -1.035157 c -0.320312 -0.242187 -0.761719 -0.363281 -1.304688 -0.363281 z m -11.351562 1.320312 c -0.277344 0 -0.5 0.222657 -0.5 0.5 v 0.988282 c 0 0.273437 0.222656 0.5 0.5 0.5 h 7 c 0.277344 0 0.5 -0.226563 0.5 -0.5 v -0.988282 c 0 -0.277343 -0.222656 -0.5 -0.5 -0.5 z m 0 0", "key": "vak5r4" }]], "aliases": ["view-list-ordered-rtl-symbolic"], "gtkIconName": "view-list-ordered-rtl-symbolic" };
__iconData$L.node;
const ViewListOrderedRtl = createAdwaitaIcon(__iconData$L);

const __iconData$K = { "name": "view-list-ordered", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 2.5 1 s 0 1 -1 1 l -0.003906 1 h 1.003906 v 2 h 1.5 v -4 z m 5 1.007812 c -0.277344 0 -0.5 0.222657 -0.5 0.5 v 0.988282 c 0 0.273437 0.222656 0.5 0.5 0.5 h 7 c 0.277344 0 0.5 -0.226563 0.5 -0.5 v -0.988282 c 0 -0.277343 -0.222656 -0.5 -0.5 -0.5 z m -4.5625 3.578126 c -0.742188 0.003906 -1.308594 0.351562 -1.9375 0.914062 l 0.5 1 c 0.898438 -0.589844 1.839844 -1.050781 1.863281 -0.304688 c 0.023438 0.535157 -1.550781 0.804688 -2.070312 1.835938 v 0.96875 h 3.707031 v -1 h -2 c 1.5 -0.5 1.777344 -1.296875 1.832031 -1.789062 c 0.089844 -0.808594 -0.894531 -1.632813 -1.894531 -1.625 z m 4.5625 1.421874 c -0.277344 0 -0.5 0.222657 -0.5 0.5 v 0.988282 c 0 0.273437 0.222656 0.5 0.5 0.5 h 7 c 0.277344 0 0.5 -0.226563 0.5 -0.5 v -0.988282 c 0 -0.277343 -0.222656 -0.5 -0.5 -0.5 z m -4.648438 3.679688 v 0.003906 c -0.542968 0 -1.105468 0.136719 -1.625 0.417969 l -0.140624 0.074219 l 0.363281 1.191406 l 0.199219 -0.085938 c 0.597656 -0.386718 1.488281 -0.492187 1.453124 -0.035156 c -0.035156 0.460938 -0.535156 0.433594 -1.128906 0.433594 v 0.96875 c 0.484375 0 1.527344 0.011719 1.382813 0.472656 c -0.183594 0.570313 -1.171875 0.128906 -1.734375 -0.011718 l -0.199219 -0.078126 l -0.371094 1.238282 l 0.15625 0.070312 c 0.496094 0.234375 0.945313 0.339844 1.5 0.339844 c 0.632813 0 1.167969 -0.132812 1.5625 -0.390625 c 0.390625 -0.261719 0.636719 -0.660156 0.636719 -1.121094 c 0 -0.539062 -0.371094 -0.902343 -0.855469 -1.117187 c 0.53125 -0.355469 0.492188 -0.628906 0.601563 -0.972656 c 0 -0.429688 -0.179688 -0.796876 -0.496094 -1.035157 c -0.320312 -0.242187 -0.761719 -0.363281 -1.304688 -0.363281 z m 4.648438 1.320312 c -0.277344 0 -0.5 0.222657 -0.5 0.5 v 0.988282 c 0 0.273437 0.222656 0.5 0.5 0.5 h 7 c 0.277344 0 0.5 -0.226563 0.5 -0.5 v -0.988282 c 0 -0.277343 -0.222656 -0.5 -0.5 -0.5 z m 0 0", "key": "1376lq" }]], "aliases": ["view-list-ordered-symbolic"], "gtkIconName": "view-list-ordered-symbolic" };
__iconData$K.node;
const ViewListOrdered = createAdwaitaIcon(__iconData$K);

const __iconData$J = { "name": "view-list-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 12 1 c -0.554688 0 -1 0.445312 -1 1 v 2 c 0 0.554688 0.445312 1 1 1 h 2 c 0.554688 0 1 -0.445312 1 -1 v -2 c 0 -0.554688 -0.445312 -1 -1 -1 z m -11 1 v 2 h 8 v -2 z m 11 4.015625 c -0.554688 0 -1 0.445313 -1 1 v 1.980469 c 0 0.550781 0.445312 1 1 1 h 2 c 0.554688 0 1 -0.449219 1 -1 v -1.980469 c 0 -0.554687 -0.445312 -1 -1 -1 z m -11 0.984375 v 2 h 8 v -2 z m 11 4 c -0.554688 0 -1 0.445312 -1 1 v 1.980469 c 0 0.550781 0.445312 1 1 1 h 2 c 0.554688 0 1 -0.449219 1 -1 v -1.980469 c 0 -0.554688 -0.445312 -1 -1 -1 z m -11 0.984375 v 2 h 8 v -2 z m 0 0", "key": "ubd7a3" }]], "aliases": ["view-list-rtl-symbolic"], "gtkIconName": "view-list-rtl-symbolic" };
__iconData$J.node;
const ViewListRtl = createAdwaitaIcon(__iconData$J);

const __iconData$I = { "name": "view-list", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 2 1 c -0.554688 0 -1 0.445312 -1 1 v 2 c 0 0.554688 0.445312 1 1 1 h 2 c 0.554688 0 1 -0.445312 1 -1 v -2 c 0 -0.554688 -0.445312 -1 -1 -1 z m 5 1 v 2 h 8 v -2 z m -5 4.015625 c -0.554688 0 -1 0.445313 -1 1 v 1.980469 c 0 0.550781 0.445312 1 1 1 h 2 c 0.554688 0 1 -0.449219 1 -1 v -1.980469 c 0 -0.554687 -0.445312 -1 -1 -1 z m 5 0.984375 v 2 h 8 v -2 z m -5 4 c -0.554688 0 -1 0.445312 -1 1 v 1.980469 c 0 0.550781 0.445312 1 1 1 h 2 c 0.554688 0 1 -0.449219 1 -1 v -1.980469 c 0 -0.554688 -0.445312 -1 -1 -1 z m 5 0.984375 v 2 h 8 v -2 z m 0 0", "key": "mc67qq" }]], "aliases": ["view-list-symbolic"], "gtkIconName": "view-list-symbolic" };
__iconData$I.node;
const ViewList = createAdwaitaIcon(__iconData$I);

const __iconData$H = { "name": "view-mirror", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1.996094 0 c -0.859375 0 -1.429688 0.320312 -1.710938 0.699219 c -0.285156 0.378906 -0.28906225 0.800781 -0.28906225 0.800781 v 13 s 0.00390625 0.421875 0.28906225 0.800781 c 0.28125 0.378907 0.851563 0.699219 1.710938 0.699219 c 0.109375 0 0.21875 -0.035156 0.304687 -0.105469 l 5.5 -4.25 c 0.125 -0.09375 0.195313 -0.238281 0.195313 -0.394531 v -6.75 c 0 -0.160156 -0.074219 -0.308594 -0.207032 -0.40625 l -5.5 -4 c -0.082031 -0.0585938 -0.1875 -0.09375 -0.292968 -0.09375 z m 0 1.117188 l 5 3.640624 v 6.246094 l -5 3.863282 z m 0 0", "key": "1079kn" }], ["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 13.996094 0 c -0.105469 0 -0.210938 0.0351562 -0.296875 0.09375 l -5.5 4 c -0.128907 0.097656 -0.203125 0.246094 -0.203125 0.40625 v 6.75 c 0 0.15625 0.070312 0.300781 0.191406 0.394531 l 5.5 4.25 c 0.089844 0.070313 0.199219 0.105469 0.308594 0.105469 c 0.859375 0 1.429687 -0.320312 1.714844 -0.699219 c 0.28125 -0.378906 0.285156 -0.800781 0.285156 -0.800781 v -13 s -0.003906 -0.421875 -0.285156 -0.800781 c -0.285157 -0.378907 -0.855469 -0.699219 -1.714844 -0.699219 z m 0 1.117188 v 13.75 l -5 -3.863282 v -6.246094 z m 0 0", "key": "nrkk2q" }]], "aliases": ["view-mirror-symbolic"], "gtkIconName": "view-mirror-symbolic" };
__iconData$H.node;
const ViewMirror = createAdwaitaIcon(__iconData$H);

const __iconData$G = { "name": "view-more-horizontal", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 2 6.007812 c -1.105469 0 -2 0.894532 -2 2 c 0 1.101563 0.894531 2 2 2 s 2 -0.898437 2 -2 c 0 -1.105468 -0.894531 -2 -2 -2 z m 6 0 c -1.105469 0 -2 0.894532 -2 2 c 0 1.101563 0.894531 2 2 2 s 2 -0.898437 2 -2 c 0 -1.105468 -0.894531 -2 -2 -2 z m 6 0 c -1.105469 0 -2 0.894532 -2 2 c 0 1.101563 0.894531 2 2 2 s 2 -0.898437 2 -2 c 0 -1.105468 -0.894531 -2 -2 -2 z m 0 0", "key": "jbnp3x" }]], "aliases": ["view-more-horizontal-symbolic"], "gtkIconName": "view-more-horizontal-symbolic" };
__iconData$G.node;
const ViewMoreHorizontal = createAdwaitaIcon(__iconData$G);

const __iconData$F = { "name": "view-more", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7.996094 0 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 c 1.101562 0 2 -0.894531 2 -2 s -0.898438 -2 -2 -2 z m 0 6 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 c 1.101562 0 2 -0.894531 2 -2 s -0.898438 -2 -2 -2 z m 0 6 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 c 1.101562 0 2 -0.894531 2 -2 s -0.898438 -2 -2 -2 z m 0 0", "key": "24emmg" }]], "aliases": ["view-more-symbolic"], "gtkIconName": "view-more-symbolic" };
__iconData$F.node;
const ViewMore = createAdwaitaIcon(__iconData$F);

const __iconData$E = { "name": "view-paged-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 7.5 4 c -0.277344 0 -0.5 0.222656 -0.5 0.5 v 1 c 0 0.277344 0.222656 0.5 0.5 0.5 h 3 c 0.277344 0 0.5 -0.222656 0.5 -0.5 v -1 c 0 -0.277344 -0.222656 -0.5 -0.5 -0.5 z m 0 3 c -0.277344 0 -0.5 0.222656 -0.5 0.5 v 1 c 0 0.277344 0.222656 0.5 0.5 0.5 h 3 c 0.277344 0 0.5 -0.222656 0.5 -0.5 v -1 c 0 -0.277344 -0.222656 -0.5 -0.5 -0.5 z m 0 0", "key": "1i2wcr" }], ["path", { "fill": "currentColor", "d": "m 12 0 c 1.644531 0 3 1.355469 3 3 v 7 c 0 1.644531 -1.355469 3 -3 3 h -6 c -1.644531 0 -3 -1.355469 -3 -3 v -7 c 0 -1.644531 1.355469 -3 3 -3 z m 0 2 h -6 c -0.570312 0 -1 0.429688 -1 1 v 7 c 0 0.570312 0.429688 1 1 1 h 6 c 0.570312 0 1 -0.429688 1 -1 v -7 c 0 -0.570312 -0.429688 -1 -1 -1 z m -11 2 c 0.550781 0 1 0.449219 1 1 v 8 c 0 0.550781 0.449219 1 1 1 h 7 c 0.550781 0 1 0.449219 1 1 s -0.449219 1 -1 1 h -7 c -1.65625 0 -3 -1.34375 -3 -3 v -8 c 0 -0.550781 0.449219 -1 1 -1 z m 0 0", "key": "2eu6zq" }]], "aliases": ["view-paged-rtl-symbolic"], "gtkIconName": "view-paged-rtl-symbolic" };
__iconData$E.node;
const ViewPagedRtl = createAdwaitaIcon(__iconData$E);

const __iconData$D = { "name": "view-paged", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 9 5.5 v -1 c 0 -0.277344 -0.222656 -0.5 -0.5 -0.5 h -3 c -0.277344 0 -0.5 0.222656 -0.5 0.5 v 1 c 0 0.277344 0.222656 0.5 0.5 0.5 h 3 c 0.277344 0 0.5 -0.222656 0.5 -0.5 z m 0 0", "key": "p58n3p" }], ["path", { "fill": "currentColor", "d": "m 4 0 c -1.644531 0 -3 1.355469 -3 3 v 7 c 0 1.644531 1.355469 3 3 3 h 6 c 1.644531 0 3 -1.355469 3 -3 v -7 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 2 h 6 c 0.570312 0 1 0.429688 1 1 v 7 c 0 0.570312 -0.429688 1 -1 1 h -6 c -0.570312 0 -1 -0.429688 -1 -1 v -7 c 0 -0.570312 0.429688 -1 1 -1 z m 11 2 c -0.550781 0 -1 0.449219 -1 1 v 8 c 0 0.550781 -0.449219 1 -1 1 h -7 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 h 7 c 1.65625 0 3 -1.34375 3 -3 v -8 c 0 -0.550781 -0.449219 -1 -1 -1 z m 0 0", "key": "v1sayk" }], ["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 9 8.5 v -1 c 0 -0.277344 -0.222656 -0.5 -0.5 -0.5 h -3 c -0.277344 0 -0.5 0.222656 -0.5 0.5 v 1 c 0 0.277344 0.222656 0.5 0.5 0.5 h 3 c 0.277344 0 0.5 -0.222656 0.5 -0.5 z m 0 0", "key": "5fd5zs" }]], "aliases": ["view-paged-symbolic"], "gtkIconName": "view-paged-symbolic" };
__iconData$D.node;
const ViewPaged = createAdwaitaIcon(__iconData$D);

const __iconData$C = { "name": "view-pin", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 5 0 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 h 0.140625 l 0.515625 3.59375 c -1.632812 0.867188 -2.652344 2.558594 -2.65625 4.40625 h 10 c -0.003906 -1.847656 -1.023438 -3.539062 -2.65625 -4.40625 l 0.511719 -3.59375 h 0.144531 c 0.550781 0 1 -0.449219 1 -1 c 0 -0.265625 -0.105469 -0.519531 -0.292969 -0.707031 s -0.441406 -0.292969 -0.707031 -0.292969 z m 2 11 v 4 l 1 1 l 1 -1 v -4 z m 0 0", "key": "pewycn" }]], "aliases": ["view-pin-symbolic"], "gtkIconName": "view-pin-symbolic" };
__iconData$C.node;
const ViewPin = createAdwaitaIcon(__iconData$C);

const __iconData$B = { "name": "view-refresh", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7.40625 1 c -0.613281 0.007812 -1.234375 0.089844 -1.847656 0.253906 c -3.273438 0.878906 -5.558594 3.855469 -5.558594 7.246094 s 2.285156 6.367188 5.558594 7.242188 c 3.273437 0.878906 6.742187 -0.558594 8.4375 -3.492188 c 0.277344 -0.480469 0.109375 -1.089844 -0.367188 -1.367188 c -0.476562 -0.273437 -1.089844 -0.109374 -1.367187 0.367188 c -1.246094 2.160156 -3.777344 3.207031 -6.1875 2.5625 c -2.40625 -0.644531 -4.074219 -2.820312 -4.074219 -5.3125 c 0 -2.496094 1.667969 -4.667969 4.074219 -5.3125 c 2.410156 -0.644531 4.941406 0.402344 6.1875 2.5625 c 0.058593 0.085938 0.125 0.164062 0.203125 0.226562 l -0.019532 0.015626 l -0.007812 0.007812 h -1.4375 c -0.550781 0 -1 0.449219 -1 1 c 0 0 0 1 1 1 h 5 v -5 s 0.003906 -1 -1 -1 c -0.550781 0 -1 0.449219 -1 1 v 1.6875 l -0.015625 0.011719 l -0.011719 0.011719 c -1.277344 -2.179688 -3.53125 -3.519532 -5.953125 -3.691407 c -0.203125 -0.015625 -0.40625 -0.019531 -0.613281 -0.019531 z m 0 0", "key": "1g79d8" }]], "aliases": ["view-refresh-symbolic"], "gtkIconName": "view-refresh-symbolic" };
__iconData$B.node;
const ViewRefresh = createAdwaitaIcon(__iconData$B);

const __iconData$A = { "name": "view-restore", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 2 8 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 h 2.585938 l -3.292969 3.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 s 1.023437 0.390625 1.414062 0 l 3.292969 -3.292969 v 2.585938 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -6 z m 0 0", "key": "14d3as" }], ["path", { "fill": "currentColor", "d": "m 14 8 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 h -2.585938 l 3.292969 -3.292969 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 s -1.023437 -0.390625 -1.414062 0 l -3.292969 3.292969 v -2.585938 c 0 -0.550781 -0.449219 -1 -1 -1 s -1 0.449219 -1 1 v 6 z m 0 0", "key": "ye3b0z" }]], "aliases": ["view-restore-symbolic"], "gtkIconName": "view-restore-symbolic" };
__iconData$A.node;
const ViewRestore = createAdwaitaIcon(__iconData$A);

const __iconData$z = { "name": "view-reveal", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8 2 c -3.648438 0.003906 -6.832031 2.476562 -7.738281 6.007812 c 0.914062 3.527344 4.097656 5.988282 7.738281 5.992188 c 3.648438 -0.003906 6.832031 -2.476562 7.738281 -6.011719 c -0.914062 -3.523437 -4.097656 -5.984375 -7.738281 -5.988281 z m 0 2 c 2.210938 0 4 1.789062 4 4 s -1.789062 4 -4 4 s -4 -1.789062 -4 -4 s 1.789062 -4 4 -4 z m 0 2 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 0 0", "key": "4wbj7r" }]], "aliases": ["view-reveal-symbolic"], "gtkIconName": "view-reveal-symbolic" };
__iconData$z.node;
const ViewReveal = createAdwaitaIcon(__iconData$z);

const __iconData$y = { "name": "view-sort-ascending-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "1", "d": "m 3,15.999904 c -0.55228,0 -1,-0.44772 -1,-1 V 3.9999037 H 1 0 v -1 h 0.006 c -0.002,-0.26436 0.10186,-0.51856 0.28711,-0.70703 l 2,-2.00000002 c 0.39053,-0.39037 1.02353,-0.39037 1.41406,0 l 2,2.00000002 c 0.18539,0.18847 0.28911,0.44267 0.28711,0.70703 h 0.006 v 1 h -1 -1 V 14.999904 c 0,0.55228 -0.44772,1 -1,1 z m 3.5,-2 c -0.277,0 -0.5,-0.223 -0.5,-0.5 v -1 c 0,-0.277 0.223,-0.5 0.5,-0.5 h 5 c 0.277,0 0.5,0.223 0.5,0.5 v 1 c 0,0.277 -0.223,0.5 -0.5,0.5 z m 0,-3 c -0.277,0 -0.5,-0.223 -0.5,-0.5 V 9.4999037 c 0,-0.277 0.223,-0.5 0.5,-0.5 h 7 c 0.277,0 0.5,0.223 0.5,0.5 v 1.0000003 c 0,0.277 -0.223,0.5 -0.5,0.5 z m 0,-3.0000003 c -0.277,0 -0.5,-0.223 -0.5,-0.5 v -1 c 0,-0.277 0.223,-0.5 0.5,-0.5 h 9 c 0.277,0 0.5,0.223 0.5,0.5 v 1 c 0,0.277 -0.223,0.5 -0.5,0.5 z", "key": "nb78zc" }]], "aliases": ["view-sort-ascending-rtl-symbolic"], "gtkIconName": "view-sort-ascending-rtl-symbolic" };
__iconData$y.node;
const ViewSortAscendingRtl = createAdwaitaIcon(__iconData$y);

const __iconData$x = { "name": "view-sort-ascending", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 6.5 6 c -0.277344 0 -0.5 0.222656 -0.5 0.5 v 1 c 0 0.277344 0.222656 0.5 0.5 0.5 h 5 c 0.277344 0 0.5 -0.222656 0.5 -0.5 v -1 c 0 -0.277344 -0.222656 -0.5 -0.5 -0.5 z m 0 3 c -0.277344 0 -0.5 0.222656 -0.5 0.5 v 1 c 0 0.277344 0.222656 0.5 0.5 0.5 h 7 c 0.277344 0 0.5 -0.222656 0.5 -0.5 v -1 c 0 -0.277344 -0.222656 -0.5 -0.5 -0.5 z m 0 3 c -0.277344 0 -0.5 0.222656 -0.5 0.5 v 1 c 0 0.277344 0.222656 0.5 0.5 0.5 h 9 c 0.277344 0 0.5 -0.222656 0.5 -0.5 v -1 c 0 -0.277344 -0.222656 -0.5 -0.5 -0.5 z m 0 0", "key": "s2xpm0" }], ["path", { "fill": "currentColor", "d": "m 3 16 c -0.550781 0 -1 -0.449219 -1 -1 v -11 h -2 v -1 h 0.0078125 c -0.00390625 -0.265625 0.1015625 -0.519531 0.2851565 -0.707031 l 2 -2 c 0.390625 -0.3906252 1.023437 -0.3906252 1.414062 0 l 2 2 c 0.183594 0.1875 0.289063 0.441406 0.289063 0.707031 h 0.003906 v 1 h -2 v 11 c 0 0.550781 -0.449219 1 -1 1 z m 0 0", "key": "1o92og" }]], "aliases": ["view-sort-ascending-symbolic"], "gtkIconName": "view-sort-ascending-symbolic" };
__iconData$x.node;
const ViewSortAscending = createAdwaitaIcon(__iconData$x);

const __iconData$w = { "name": "view-sort-descending-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 13 0 c 0.550781 0 1 0.449219 1 1 v 11 h 2 v 1 h -0.007812 c 0.003906 0.265625 -0.101563 0.519531 -0.285157 0.707031 l -2 2 c -0.390625 0.390625 -1.023437 0.390625 -1.414062 0 l -2 -2 c -0.183594 -0.1875 -0.289063 -0.441406 -0.289063 -0.707031 h -0.003906 v -1 h 2 v -11 c 0 -0.550781 0.449219 -1 1 -1 z m 0 0", "key": "3k6ukw" }], ["path", { "fill": "currentColor", "d": "m 9.5 10 c 0.277344 0 0.5 -0.222656 0.5 -0.5 v -1 c 0 -0.277344 -0.222656 -0.5 -0.5 -0.5 h -5 c -0.277344 0 -0.5 0.222656 -0.5 0.5 v 1 c 0 0.277344 0.222656 0.5 0.5 0.5 z m 0 -3 c 0.277344 0 0.5 -0.222656 0.5 -0.5 v -1 c 0 -0.277344 -0.222656 -0.5 -0.5 -0.5 h -7 c -0.277344 0 -0.5 0.222656 -0.5 0.5 v 1 c 0 0.277344 0.222656 0.5 0.5 0.5 z m 0 -3 c 0.277344 0 0.5 -0.222656 0.5 -0.5 v -1 c 0 -0.277344 -0.222656 -0.5 -0.5 -0.5 h -9 c -0.277344 0 -0.5 0.222656 -0.5 0.5 v 1 c 0 0.277344 0.222656 0.5 0.5 0.5 z m 0 0", "key": "9wp9h9" }]], "aliases": ["view-sort-descending-rtl-symbolic"], "gtkIconName": "view-sort-descending-rtl-symbolic" };
__iconData$w.node;
const ViewSortDescendingRtl = createAdwaitaIcon(__iconData$w);

const __iconData$v = { "name": "view-sort-descending", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 0 c -0.550781 0 -1 0.449219 -1 1 v 11 h -2 v 1 h 0.0078125 c -0.00390625 0.265625 0.1015625 0.519531 0.2851565 0.707031 l 2 2 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 l 2 -2 c 0.183594 -0.1875 0.289063 -0.441406 0.289063 -0.707031 h 0.003906 v -1 h -2 v -11 c 0 -0.550781 -0.449219 -1 -1 -1 z m 0 0", "key": "g4erkj" }], ["path", { "fill": "currentColor", "d": "m 6.5 10 c -0.277344 0 -0.5 -0.222656 -0.5 -0.5 v -1 c 0 -0.277344 0.222656 -0.5 0.5 -0.5 h 5 c 0.277344 0 0.5 0.222656 0.5 0.5 v 1 c 0 0.277344 -0.222656 0.5 -0.5 0.5 z m 0 -3 c -0.277344 0 -0.5 -0.222656 -0.5 -0.5 v -1 c 0 -0.277344 0.222656 -0.5 0.5 -0.5 h 7 c 0.277344 0 0.5 0.222656 0.5 0.5 v 1 c 0 0.277344 -0.222656 0.5 -0.5 0.5 z m 0 -3 c -0.277344 0 -0.5 -0.222656 -0.5 -0.5 v -1 c 0 -0.277344 0.222656 -0.5 0.5 -0.5 h 9 c 0.277344 0 0.5 0.222656 0.5 0.5 v 1 c 0 0.277344 -0.222656 0.5 -0.5 0.5 z m 0 0", "key": "ehsbq7" }]], "aliases": ["view-sort-descending-symbolic"], "gtkIconName": "view-sort-descending-symbolic" };
__iconData$v.node;
const ViewSortDescending = createAdwaitaIcon(__iconData$v);

const __iconData$u = { "name": "view-wrapped-rtl", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 9 0 c -2.753906 0 -5 2.246094 -5 5 v 0.585938 l -0.292969 -0.292969 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 s -0.519531 0.105469 -0.707031 0.292969 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 l 2 2 c 0.390625 0.390625 1.023437 0.390625 1.414062 0 l 2 -2 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 s -1.023437 -0.390625 -1.414062 0 l -0.292969 0.292969 v -0.585938 c 0 -1.679688 1.320312 -3 3 -3 s 3 1.320312 3 3 v 6 c 0 1.679688 -1.320312 3 -3 3 s -3 -1.320312 -3 -3 c 0 -0.550781 -0.449219 -1 -1 -1 s -1 0.449219 -1 1 c 0 2.753906 2.246094 5 5 5 s 5 -2.246094 5 -5 v -6 c 0 -2.753906 -2.246094 -5 -5 -5 z m 0 0", "key": "1u466p" }]], "aliases": ["view-wrapped-rtl-symbolic"], "gtkIconName": "view-wrapped-rtl-symbolic" };
__iconData$u.node;
const ViewWrappedRtl = createAdwaitaIcon(__iconData$u);

const __iconData$t = { "name": "view-wrapped", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 7 0 c 2.753906 0 5 2.246094 5 5 v 0.585938 l 0.292969 -0.292969 c 0.1875 -0.1875 0.441406 -0.292969 0.707031 -0.292969 s 0.519531 0.105469 0.707031 0.292969 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 l -2 2 c -0.390625 0.390625 -1.023437 0.390625 -1.414062 0 l -2 -2 c -0.390625 -0.390625 -0.390625 -1.023437 0 -1.414062 s 1.023437 -0.390625 1.414062 0 l 0.292969 0.292969 v -0.585938 c 0 -1.679688 -1.320312 -3 -3 -3 s -3 1.320312 -3 3 v 6 c 0 1.679688 1.320312 3 3 3 s 3 -1.320312 3 -3 c 0 -0.550781 0.449219 -1 1 -1 s 1 0.449219 1 1 c 0 2.753906 -2.246094 5 -5 5 s -5 -2.246094 -5 -5 v -6 c 0 -2.753906 2.246094 -5 5 -5 z m 0 0", "key": "xgidu4" }]], "aliases": ["view-wrapped-symbolic"], "gtkIconName": "view-wrapped-symbolic" };
__iconData$t.node;
const ViewWrapped = createAdwaitaIcon(__iconData$t);

const __iconData$s = { "name": "weather-clear-night", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 0.917969 8.003906 c 0 3.910156 3.167969 7.078125 7.078125 7.078125 c 3.597656 -0.007812 6.621094 -2.710937 7.023437 -6.285156 c 0.042969 -0.378906 -0.136719 -0.75 -0.457031 -0.957031 c -0.324219 -0.203125 -0.738281 -0.207032 -1.0625 -0.003906 c -0.609375 0.375 -1.316406 0.578124 -2.03125 0.578124 c -2.15625 0 -3.882812 -1.726562 -3.882812 -3.882812 c 0 -0.714844 0.203124 -1.421875 0.578124 -2.03125 c 0.203126 -0.324219 0.199219 -0.738281 -0.003906 -1.0625 c -0.207031 -0.320312 -0.578125 -0.5 -0.957031 -0.457031 c -3.574219 0.402343 -6.277344 3.425781 -6.285156 7.023437 z m 4.667969 -3.472656 c 0 3.25 2.632812 5.882812 5.886718 5.882812 c 1.085938 0 2.152344 -0.304687 3.078125 -0.878906 l -1.519531 -0.960937 c -0.289062 2.570312 -2.449219 4.503906 -5.035156 4.507812 c -2.816406 0 -5.078125 -2.261719 -5.078125 -5.078125 c 0.003906 -2.585937 1.9375 -4.746094 4.507812 -5.035156 l -0.960937 -1.519531 c -0.574219 0.925781 -0.875 1.992187 -0.878906 3.082031 z m 0 0", "key": "1473na" }]], "aliases": ["weather-clear-night-symbolic"], "gtkIconName": "weather-clear-night-symbolic" };
__iconData$s.node;
const WeatherClearNight = createAdwaitaIcon(__iconData$s);

const __iconData$r = { "name": "weather-clear", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 15 7 h -1 c -0.550781 0 -1 0.449219 -1 1 s 0.449219 1 1 1 h 1 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 z m -2.753906 -4.660156 l -0.707032 0.707031 c -0.390624 0.390625 -0.390624 1.023437 0 1.414063 c 0.390626 0.390624 1.023438 0.390624 1.414063 0 l 0.707031 -0.707032 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 s -1.023437 -0.390625 -1.414062 0 z m -5.242188 -1.347656 v 1 c 0 0.550781 0.449219 1 1 1 c 0.554688 0 1 -0.449219 1 -1 v -1 c 0 -0.554688 -0.445312 -1.0000005 -1 -1.0000005 c -0.550781 0 -1 0.4453125 -1 1.0000005 z m -4.660156 2.75 l 0.707031 0.707031 c 0.253907 0.253906 0.621094 0.355469 0.96875 0.261719 c 0.34375 -0.09375 0.613281 -0.363282 0.707031 -0.707032 c 0.089844 -0.347656 -0.007812 -0.714844 -0.261718 -0.96875 l -0.707032 -0.707031 c -0.253906 -0.253906 -0.621093 -0.351563 -0.964843 -0.257813 c -0.347657 0.089844 -0.617188 0.359376 -0.710938 0.707032 c -0.089843 0.34375 0.007813 0.714844 0.261719 0.964844 z m -1.347656 5.242187 h 1 c 0.550781 0 1 -0.445313 1 -1 c 0 -0.550781 -0.449219 -1 -1 -1 h -1 c -0.554688 0 -1.00000025 0.449219 -1.00000025 1 c 0 0.554687 0.44531225 1 1.00000025 1 z m 2.753906 4.664063 l 0.707031 -0.707032 c 0.390625 -0.390625 0.390625 -1.027344 0 -1.414062 c -0.390625 -0.390625 -1.027343 -0.390625 -1.414062 0 l -0.710938 0.707031 c -0.386719 0.390625 -0.386719 1.023437 0 1.414063 c 0.390625 0.390624 1.027344 0.390624 1.417969 0 z m 5.242188 1.347656 v -1 c 0 -0.554688 -0.449219 -1 -1 -1 c -0.554688 0 -1 0.445312 -1 1 v 1 c 0 0.550781 0.445312 1 1 1 c 0.550781 0 1 -0.449219 1 -1 z m 4.660156 -2.753906 l -0.707032 -0.707032 c -0.253906 -0.253906 -0.621093 -0.351562 -0.96875 -0.261718 c -0.34375 0.09375 -0.613281 0.363281 -0.707031 0.710937 c -0.09375 0.34375 0.007813 0.710937 0.261719 0.964844 l 0.707031 0.707031 c 0.25 0.253906 0.621094 0.351562 0.964844 0.261719 c 0.347656 -0.09375 0.617187 -0.363281 0.707031 -0.707031 c 0.09375 -0.347657 -0.003906 -0.714844 -0.257812 -0.96875 z m 0 0", "key": "123pki" }], ["path", { "fill": "currentColor", "d": "m 8 10 c -1.117188 0 -2 -0.882812 -2 -2 s 0.882812 -2 2 -2 s 2 0.882812 2 2 s -0.882812 2 -2 2 z m 0 -6 c -2.207031 0 -4 1.792969 -4 4 s 1.792969 4 4 4 s 4 -1.792969 4 -4 s -1.792969 -4 -4 -4 z m 0 0", "key": "b4zciy" }]], "aliases": ["weather-clear-symbolic"], "gtkIconName": "weather-clear-symbolic" };
__iconData$r.node;
const WeatherClear = createAdwaitaIcon(__iconData$r);

const __iconData$q = { "name": "weather-few-clouds-night", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 8.765625 7.316406 c -0.730469 -0.707031 -1.179687 -1.6875 -1.179687 -2.78125 c 0 -0.71875 0.203124 -1.425781 0.578124 -2.035156 c 0.203126 -0.324219 0.199219 -0.738281 -0.003906 -1.0625 c -0.207031 -0.320312 -0.578125 -0.5 -0.957031 -0.457031 c -3.574219 0.402343 -6.277344 3.425781 -6.285156 7.023437 c 0 1.933594 0.777343 3.691406 2.042969 4.96875 c 0.25 0.257813 0.617187 0.359375 0.964843 0.269532 c 0.34375 -0.089844 0.617188 -0.359376 0.710938 -0.703126 c 0.09375 -0.347656 -0.003907 -0.714843 -0.253907 -0.96875 c -0.90625 -0.917968 -1.464843 -2.171874 -1.464843 -3.566406 c 0.003906 -2.585937 1.9375 -4.746094 4.507812 -5.035156 l -0.960937 -1.519531 c -0.574219 0.925781 -0.875 1.992187 -0.878906 3.082031 c 0 1.652344 0.683593 3.152344 1.785156 4.222656 c 0.398437 0.382813 1.03125 0.375 1.414062 -0.023437 c 0.386719 -0.394531 0.375 -1.027344 -0.019531 -1.414063 z m 0 0", "key": "1xgmd4" }], ["path", { "fill": "currentColor", "d": "m 8.113281 11.097656 l 1.515625 -0.613281 c -0.484375 -0.316406 -1.050781 -0.484375 -1.628906 -0.484375 c -1.65625 0 -3 1.34375 -3 3 s 1.34375 3 3 3 h 4 c 2.207031 0 4 -1.792969 4 -4 s -1.792969 -4 -4 -4 c -1.863281 0 -3.46875 1.285156 -3.886719 3.097656 z m 5.886719 0.902344 c 0 1.117188 -0.882812 2 -2 2 h -4 c -0.5625 0 -1 -0.4375 -1 -1 s 0.4375 -1 1 -1 c 0.191406 0 0.378906 0.054688 0.542969 0.160156 c 0.273437 0.179688 0.613281 0.210938 0.917969 0.089844 c 0.300781 -0.121094 0.527343 -0.382812 0.597656 -0.703125 c 0.210937 -0.910156 1.011718 -1.546875 1.941406 -1.546875 c 1.117188 0 2 0.882812 2 2 z m 0 0", "key": "kh4jkh" }]], "aliases": ["weather-few-clouds-night-symbolic"], "gtkIconName": "weather-few-clouds-night-symbolic" };
__iconData$q.node;
const WeatherFewCloudsNight = createAdwaitaIcon(__iconData$q);

const __iconData$p = { "name": "weather-few-clouds", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 12.246094 2.339844 l -0.707032 0.707031 c -0.390624 0.390625 -0.390624 1.023437 0 1.414063 c 0.390626 0.390624 1.023438 0.390624 1.414063 0 l 0.707031 -0.707032 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 s -1.023437 -0.390625 -1.414062 0 z m -5.242188 -1.347656 v 1 c 0 0.550781 0.449219 1 1 1 c 0.554688 0 1 -0.449219 1 -1 v -1 c 0 -0.554688 -0.445312 -1.0000005 -1 -1.0000005 c -0.550781 0 -1 0.4453125 -1 1.0000005 z m -4.660156 2.75 l 0.707031 0.707031 c 0.253907 0.253906 0.621094 0.355469 0.964844 0.261719 c 0.347656 -0.09375 0.617187 -0.363282 0.710937 -0.707032 c 0.089844 -0.347656 -0.007812 -0.714844 -0.261718 -0.96875 l -0.707032 -0.707031 c -0.253906 -0.25 -0.621093 -0.351563 -0.964843 -0.257813 c -0.347657 0.089844 -0.617188 0.363282 -0.710938 0.707032 c -0.089843 0.34375 0.007813 0.714844 0.261719 0.964844 z m -1.347656 5.242187 h 1 c 0.550781 0 1 -0.445313 1 -1 c 0 -0.550781 -0.449219 -1 -1 -1 h -1 c -0.554688 0 -1.00000025 0.449219 -1.00000025 1 c 0 0.554687 0.44531225 1 1.00000025 1 z m 0 0", "key": "mk67db" }], ["path", { "fill": "currentColor", "d": "m 6.132812 8.71875 c -0.378906 -0.980469 0.054688 -2.070312 1.003907 -2.523438 c 0.953125 -0.453124 2.070312 -0.109374 2.59375 0.804688 c 0.277343 0.480469 0.890625 0.644531 1.367187 0.367188 c 0.480469 -0.277344 0.644532 -0.890626 0.367188 -1.367188 c -1.042969 -1.808594 -3.304688 -2.507812 -5.191406 -1.609375 c -1.882813 0.902344 -2.757813 3.101563 -2.003907 5.050781 c 0.199219 0.511719 0.777344 0.769532 1.292969 0.570313 s 0.769531 -0.777344 0.570312 -1.292969 z m 0 0", "key": "gjuomz" }], ["path", { "fill": "currentColor", "d": "m 8.113281 11.097656 l 1.515625 -0.613281 c -0.484375 -0.316406 -1.050781 -0.484375 -1.628906 -0.484375 c -1.65625 0 -3 1.34375 -3 3 s 1.34375 3 3 3 h 4 c 2.207031 0 4 -1.792969 4 -4 s -1.792969 -4 -4 -4 c -1.863281 0 -3.46875 1.285156 -3.886719 3.097656 z m 5.886719 0.902344 c 0 1.117188 -0.882812 2 -2 2 h -4 c -0.5625 0 -1 -0.4375 -1 -1 s 0.4375 -1 1 -1 c 0.191406 0 0.378906 0.054688 0.542969 0.160156 c 0.273437 0.179688 0.613281 0.210938 0.917969 0.089844 c 0.300781 -0.121094 0.527343 -0.382812 0.597656 -0.703125 c 0.210937 -0.910156 1.011718 -1.546875 1.941406 -1.546875 c 1.117188 0 2 0.882812 2 2 z m 0 0", "key": "kh4jkh" }]], "aliases": ["weather-few-clouds-symbolic"], "gtkIconName": "weather-few-clouds-symbolic" };
__iconData$p.node;
const WeatherFewClouds = createAdwaitaIcon(__iconData$p);

const __iconData$o = { "name": "weather-fog", "size": 16, "node": [["path", { "fill": "currentColor", "fill-opacity": "0.34902", "d": "m 3.316406 0.992188 c -0.621094 0 -1 0.332031 -1.273437 0.59375 c -0.273438 0.265624 -0.480469 0.542968 -0.675781 0.796874 c -0.191407 0.25 -0.371094 0.46875 -0.484376 0.578126 c -0.113281 0.113281 -0.121093 0.03125 0.113282 0.03125 c -0.546875 0 -0.996094 0.449218 -0.996094 0.996093 c 0 0.265625 0.105469 0.519531 0.292969 0.707031 s 0.441406 0.292969 0.703125 0.292969 c 0.625 0 1.003906 -0.328125 1.273437 -0.59375 c 0.273438 -0.265625 0.484375 -0.542969 0.675781 -0.792969 c 0.148438 -0.191406 0.261719 -0.324218 0.371094 -0.445312 c 0.109375 0.121094 0.222656 0.253906 0.371094 0.445312 c 0.191406 0.25 0.402344 0.53125 0.671875 0.792969 c 0.273437 0.265625 0.652344 0.59375 1.277344 0.59375 c 0.625 0.003907 1 -0.328125 1.273437 -0.59375 c 0.273438 -0.261719 0.484375 -0.542969 0.675782 -0.792969 c 0.148437 -0.191406 0.261718 -0.324218 0.371093 -0.445312 c 0.109375 0.121094 0.222657 0.257812 0.367188 0.445312 c 0.195312 0.253907 0.402343 0.53125 0.675781 0.796876 c 0.273438 0.265624 0.652344 0.59375 1.273438 0.59375 c 0.625 0 1.003906 -0.328126 1.273437 -0.59375 c 0.273437 -0.265626 0.484375 -0.542969 0.675781 -0.792969 c 0.148438 -0.191407 0.261719 -0.324219 0.371094 -0.445313 c 0.109375 0.121094 0.222656 0.253906 0.371094 0.445313 c 0.191406 0.25 0.402344 0.53125 0.675781 0.792969 c 0.273437 0.265624 0.648437 0.59375 1.273437 0.59375 c 0.550782 0.003906 0.996094 -0.445313 0.996094 -0.996094 c 0 -0.480469 -0.34375 -0.894532 -0.820312 -0.980469 c -0.011719 -0.007813 -0.03125 -0.019531 -0.058594 -0.046875 c -0.117188 -0.109375 -0.296875 -0.332031 -0.488281 -0.582031 c -0.191407 -0.25 -0.402344 -0.53125 -0.671875 -0.796875 c -0.273438 -0.261719 -0.652344 -0.589844 -1.273438 -0.59375 c -0.625 0 -1.003906 0.332031 -1.277344 0.59375 c -0.273437 0.265625 -0.480468 0.542968 -0.671874 0.792968 c -0.148438 0.191407 -0.265626 0.324219 -0.371094 0.445313 c -0.109375 -0.121094 -0.226563 -0.253906 -0.371094 -0.445313 c -0.195312 -0.25 -0.402344 -0.527343 -0.675781 -0.792968 c -0.273438 -0.265625 -0.648438 -0.59375 -1.273438 -0.59375 s -1.003906 0.328125 -1.273437 0.59375 c -0.273438 0.265625 -0.484375 0.542968 -0.675782 0.792968 c -0.148437 0.191407 -0.261718 0.324219 -0.371093 0.441407 c -0.109375 -0.117188 -0.222657 -0.25 -0.371094 -0.441407 c -0.191406 -0.25 -0.402344 -0.53125 -0.671875 -0.796874 c -0.273438 -0.261719 -0.652344 -0.589844 -1.273438 -0.59375 z m 0 5.003906 c -0.621094 0 -1 0.328125 -1.273437 0.59375 c -0.273438 0.265625 -0.480469 0.542968 -0.675781 0.792968 c -0.191407 0.25 -0.371094 0.472657 -0.484376 0.582032 c -0.113281 0.109375 -0.121093 0.03125 0.113282 0.03125 c -0.546875 0 -0.996094 0.445312 -0.996094 0.996094 c 0 0.265624 0.105469 0.519531 0.292969 0.707031 s 0.441406 0.292969 0.703125 0.289062 c 0.625 0.003907 1.003906 -0.328125 1.273437 -0.59375 c 0.273438 -0.261719 0.484375 -0.542969 0.675781 -0.792969 c 0.148438 -0.1875 0.261719 -0.320312 0.371094 -0.441406 c 0.109375 0.121094 0.222656 0.253906 0.371094 0.441406 c 0.191406 0.253907 0.402344 0.53125 0.671875 0.796876 c 0.273437 0.265624 0.652344 0.59375 1.277344 0.59375 s 1 -0.328126 1.273437 -0.59375 c 0.273438 -0.265626 0.484375 -0.542969 0.675782 -0.792969 c 0.148437 -0.191407 0.261718 -0.324219 0.371093 -0.445313 c 0.109375 0.121094 0.222657 0.253906 0.367188 0.445313 c 0.195312 0.25 0.402343 0.53125 0.675781 0.792969 c 0.273438 0.265624 0.652344 0.59375 1.273438 0.59375 c 0.625 0.003906 1.003906 -0.328126 1.273437 -0.59375 c 0.273437 -0.261719 0.484375 -0.542969 0.675781 -0.792969 c 0.148438 -0.1875 0.261719 -0.324219 0.371094 -0.445313 c 0.109375 0.121094 0.222656 0.253906 0.371094 0.445313 c 0.191406 0.253906 0.402344 0.53125 0.671875 0.796875 c 0.273437 0.265625 0.652343 0.59375 1.277343 0.59375 c 0.550782 0 0.996094 -0.445313 0.996094 -0.996094 c 0 -0.484375 -0.34375 -0.894531 -0.820312 -0.980469 c -0.011719 -0.007812 -0.03125 -0.023437 -0.058594 -0.046875 c -0.117188 -0.113281 -0.296875 -0.332031 -0.488281 -0.582031 c -0.191407 -0.253906 -0.402344 -0.53125 -0.671875 -0.796875 c -0.273438 -0.265625 -0.652344 -0.59375 -1.273438 -0.59375 c -0.625 0 -1.003906 0.328125 -1.277344 0.59375 c -0.273437 0.265625 -0.480468 0.542969 -0.671874 0.792969 c -0.148438 0.191406 -0.265626 0.324219 -0.371094 0.445312 c -0.109375 -0.121093 -0.226563 -0.253906 -0.371094 -0.445312 c -0.195312 -0.25 -0.402344 -0.53125 -0.675781 -0.792969 c -0.273438 -0.265625 -0.648438 -0.59375 -1.273438 -0.59375 c -0.625 -0.003906 -1.003906 0.328125 -1.273437 0.59375 c -0.273438 0.261719 -0.484375 0.542969 -0.675782 0.792969 c -0.148437 0.1875 -0.261718 0.320312 -0.371093 0.441406 c -0.109375 -0.121094 -0.222657 -0.253906 -0.371094 -0.441406 c -0.191406 -0.253907 -0.402344 -0.53125 -0.671875 -0.796875 c -0.273438 -0.265625 -0.652344 -0.59375 -1.273438 -0.59375 z m 0 5.003906 c -0.621094 -0.003906 -1 0.328125 -1.273437 0.59375 c -0.273438 0.261719 -0.480469 0.539062 -0.675781 0.792969 c -0.191407 0.25 -0.371094 0.46875 -0.484376 0.582031 c -0.113281 0.109375 -0.121093 0.027344 0.113282 0.027344 c -0.546875 0 -0.996094 0.449218 -0.996094 0.996094 c 0 0.265624 0.105469 0.519531 0.292969 0.707031 s 0.441406 0.292969 0.703125 0.292969 c 0.625 0 1.003906 -0.328126 1.273437 -0.59375 c 0.273438 -0.265626 0.484375 -0.542969 0.675781 -0.792969 c 0.148438 -0.191407 0.261719 -0.324219 0.371094 -0.445313 c 0.109375 0.121094 0.222656 0.253906 0.371094 0.445313 c 0.191406 0.25 0.402344 0.53125 0.671875 0.792969 c 0.273437 0.265624 0.652344 0.59375 1.277344 0.59375 c 0.625 0.003906 1 -0.328126 1.273437 -0.59375 c 0.273438 -0.261719 0.484375 -0.542969 0.675782 -0.792969 c 0.148437 -0.191407 0.261718 -0.324219 0.371093 -0.445313 c 0.109375 0.121094 0.222657 0.257813 0.367188 0.445313 c 0.195312 0.253906 0.402343 0.53125 0.675781 0.796875 s 0.652344 0.59375 1.273438 0.59375 c 0.625 0 1.003906 -0.328125 1.273437 -0.59375 c 0.273437 -0.265625 0.484375 -0.542969 0.675781 -0.792969 c 0.148438 -0.191406 0.261719 -0.324219 0.371094 -0.445313 c 0.109375 0.121094 0.222656 0.253907 0.371094 0.445313 c 0.191406 0.25 0.402344 0.53125 0.675781 0.792969 c 0.273437 0.265625 0.648437 0.59375 1.273437 0.59375 c 0.550782 0.003906 0.996094 -0.445313 0.996094 -0.996094 c 0 -0.480469 -0.34375 -0.894531 -0.820312 -0.980469 c -0.011719 -0.007812 -0.03125 -0.019531 -0.058594 -0.046875 c -0.117188 -0.109375 -0.296875 -0.332031 -0.488281 -0.582031 c -0.191407 -0.25 -0.402344 -0.527344 -0.671875 -0.792969 c -0.273438 -0.265625 -0.652344 -0.59375 -1.273438 -0.597656 c -0.625 0 -1.003906 0.332031 -1.277344 0.59375 c -0.273437 0.265625 -0.480468 0.542969 -0.671874 0.792969 c -0.148438 0.191406 -0.265626 0.324219 -0.371094 0.445312 c -0.109375 -0.121093 -0.226563 -0.253906 -0.371094 -0.445312 c -0.195312 -0.25 -0.402344 -0.527344 -0.675781 -0.792969 c -0.273438 -0.265625 -0.648438 -0.59375 -1.273438 -0.59375 s -1.003906 0.328125 -1.273437 0.59375 c -0.273438 0.265625 -0.484375 0.542969 -0.675782 0.792969 c -0.148437 0.191406 -0.261718 0.324219 -0.371093 0.441406 c -0.109375 -0.117187 -0.222657 -0.25 -0.371094 -0.441406 c -0.191406 -0.25 -0.402344 -0.53125 -0.671875 -0.796875 c -0.273438 -0.261719 -0.652344 -0.589844 -1.273438 -0.59375 z m 0 0", "key": "4eaj6x" }]], "aliases": ["weather-fog-symbolic"], "gtkIconName": "weather-fog-symbolic" };
__iconData$o.node;
const WeatherFog = createAdwaitaIcon(__iconData$o);

const __iconData$n = { "name": "weather-overcast", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m -0.0078125 8 c 0 3.292969 2.6679685 5.964844 5.9570315 5.960938 l 5.550781 0.039062 c 2.484375 0 4.5 -2.015625 4.5 -4.5 s -2.015625 -4.5 -4.5 -4.5 c -0.417969 0 -0.828125 0.058594 -1.226562 0.171875 l 1.203124 0.585937 c -0.910156 -2.25 -3.09375 -3.71875 -5.519531 -3.722656 c -3.296875 0 -5.9648435 2.671875 -5.9648435 5.964844 z m 9.6328125 -1.488281 c 0.191406 0.472656 0.710938 0.726562 1.203125 0.585937 c 0.21875 -0.066406 0.445313 -0.097656 0.671875 -0.097656 c 1.390625 0 2.5 1.109375 2.5 2.5 c 0 1.394531 -1.109375 2.5 -2.492188 2.5 l -5.554687 -0.035156 c -2.199219 0 -3.960937 -1.765625 -3.960937 -3.964844 s 1.761718 -3.964844 3.960937 -3.960938 c 1.617187 0 3.0625 0.972657 3.671875 2.472657 z m 0 0", "key": "1oxm7r" }]], "aliases": ["weather-overcast-symbolic"], "gtkIconName": "weather-overcast-symbolic" };
__iconData$n.node;
const WeatherOvercast = createAdwaitaIcon(__iconData$n);

const __iconData$m = { "name": "weather-severe-alert", "size": 16, "node": [["path", { "fill": "currentColor", "stroke-linecap": "round", "stroke-linejoin": "round", "d": "M6.008 2.068C2.726 2.068.044 4.75.045 8.031c0 3.282 2.681 5.963 5.963 5.963L7 14v-2l-.986-.006h-.008a3.946 3.946 0 0 1-3.961-3.963c0-2.2 1.76-3.963 3.96-3.963a3.96 3.96 0 0 1 3.67 2.473 1 1 0 0 0 .393.453h5.057q.072.001.142.008a4.5 4.5 0 0 0-3.714-1.97c-.15 0-.29.047-.438.062-1.053-1.826-2.96-3.024-5.107-3.026Z", "key": "sctpey" }], ["path", { "d": "M8.875 8A.864.864 0 0 0 8 8.875v6.25c0 .492.383.875.875.875h6.25a.864.864 0 0 0 .875-.875v-6.25A.864.864 0 0 0 15.125 8zM11 9h2v2.5s0 .5-.5.5h-1c-.5 0-.5-.5-.5-.5zm.5 4h1c.277 0 .5.223.5.5v1c0 .277-.223.5-.5.5h-1a.5.5 0 0 1-.5-.5v-1c0-.277.223-.5.5-.5m0 0", "key": "1tzz9y" }]], "aliases": ["weather-severe-alert-symbolic"], "gtkIconName": "weather-severe-alert-symbolic" };
__iconData$m.node;
const WeatherSevereAlert = createAdwaitaIcon(__iconData$m);

const __iconData$l = { "name": "weather-showers-scattered", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4 0.761719 c -0.476562 0 -0.972656 0.183593 -1.332031 0.597656 c -0.144531 0.171875 -0.78125 0.929687 -1.398438 1.953125 c -0.621093 1.019531 -1.269531 2.292969 -1.269531 3.6875 c 0 1.003906 0.347656 1.96875 1.003906 2.707031 c 0.523438 0.59375 1.539063 1.292969 2.996094 1.292969 c 1.238281 0 2.300781 -0.507812 2.984375 -1.273438 c 0.683594 -0.765624 1.015625 -1.75 1.015625 -2.726562 c 0 -1.394531 -0.644531 -2.667969 -1.269531 -3.6875 c -0.621094 -1.023438 -1.257813 -1.78125 -1.402344 -1.953125 c -0.355469 -0.410156 -0.851563 -0.597656 -1.328125 -0.597656 z m 0 2.164062 c 0.203125 0.246094 0.574219 0.6875 1.023438 1.421875 c 0.53125 0.878906 0.976562 1.953125 0.976562 2.652344 c 0 0.515625 -0.183594 1.03125 -0.507812 1.390625 c -0.324219 0.363281 -0.761719 0.609375 -1.492188 0.609375 c -0.859375 0 -1.25 -0.339844 -1.5 -0.621094 c -0.3125 -0.351562 -0.5 -0.835937 -0.5 -1.378906 c 0 -0.699219 0.445312 -1.773438 0.976562 -2.652344 c 0.449219 -0.734375 0.820313 -1.175781 1.023438 -1.421875 z m 8 1.835938 c -0.476562 0 -0.972656 0.183593 -1.332031 0.597656 c -0.144531 0.171875 -0.78125 0.929687 -1.398438 1.953125 c -0.621093 1.019531 -1.269531 2.292969 -1.269531 3.6875 c 0 1.003906 0.347656 1.96875 1.003906 2.707031 c 0.523438 0.59375 1.539063 1.292969 2.996094 1.292969 c 1.238281 0 2.300781 -0.507812 2.984375 -1.273438 c 0.683594 -0.765624 1.015625 -1.75 1.015625 -2.726562 c 0 -1.394531 -0.644531 -2.667969 -1.269531 -3.6875 c -0.621094 -1.023438 -1.257813 -1.78125 -1.402344 -1.953125 c -0.355469 -0.410156 -0.851563 -0.597656 -1.328125 -0.597656 z m 0 2.164062 c 0.203125 0.246094 0.574219 0.6875 1.023438 1.421875 c 0.53125 0.878906 0.976562 1.953125 0.976562 2.652344 c 0 0.515625 -0.183594 1.03125 -0.507812 1.394531 c -0.324219 0.359375 -0.761719 0.605469 -1.492188 0.605469 c -0.859375 0 -1.25 -0.339844 -1.5 -0.617188 c -0.3125 -0.355468 -0.5 -0.839843 -0.5 -1.382812 c 0 -0.699219 0.445312 -1.773438 0.976562 -2.652344 c 0.449219 -0.734375 0.820313 -1.175781 1.023438 -1.421875 z m 0 0", "key": "ea144c" }]], "aliases": ["weather-showers-scattered-symbolic"], "gtkIconName": "weather-showers-scattered-symbolic" };
__iconData$l.node;
const WeatherShowersScattered = createAdwaitaIcon(__iconData$l);

const __iconData$k = { "name": "weather-showers", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 14.691406 10.636719 c 0.8125 -0.816407 1.308594 -1.9375 1.308594 -3.171875 c 0 -2.484375 -2.015625 -4.5 -4.5 -4.5 c -0.417969 0 -0.828125 0.058594 -1.226562 0.171875 l 1.203124 0.585937 c -0.910156 -2.25 -3.09375 -3.722656 -5.519531 -3.722656 c -3.296875 0 -5.9648435 2.667969 -5.9648435 5.960938 c 0 1.367187 0.4570315 2.636718 1.2304685 3.652343 c 0.214844 0.285157 0.566406 0.4375 0.921875 0.390625 c 0.355469 -0.042968 0.660157 -0.273437 0.796875 -0.605468 c 0.140625 -0.328126 0.09375 -0.707032 -0.125 -0.992188 c -0.519531 -0.683594 -0.824218 -1.53125 -0.824218 -2.445312 c 0 -2.199219 1.761718 -3.960938 3.960937 -3.960938 c 1.617187 0 3.0625 0.976562 3.671875 2.472656 c 0.191406 0.476563 0.710938 0.726563 1.203125 0.585938 c 0.21875 -0.0625 0.445313 -0.09375 0.671875 -0.09375 c 1.390625 0 2.5 1.105468 2.5 2.5 c 0 0.691406 -0.277344 1.308594 -0.726562 1.761718 c -0.390626 0.390626 -0.386719 1.023438 0.003906 1.414063 c 0.390625 0.386719 1.023437 0.386719 1.414062 -0.003906 z m 0 0", "key": "15ky54" }], ["path", { "d": "m 7 10 v 1 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -1 c 0 -0.550781 -0.449219 -1 -1 -1 s -1 0.449219 -1 1 z m -3 -1 v 1 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -1 c 0 -0.550781 -0.449219 -1 -1 -1 s -1 0.449219 -1 1 z m 6 0 v 1 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -1 c 0 -0.550781 -0.449219 -1 -1 -1 s -1 0.449219 -1 1 z m 0 0", "key": "efoope" }], ["path", { "d": "m 7 14 v 1 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -1 c 0 -0.550781 -0.449219 -1 -1 -1 s -1 0.449219 -1 1 z m -3 -1 v 1 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -1 c 0 -0.550781 -0.449219 -1 -1 -1 s -1 0.449219 -1 1 z m 6 0 v 1 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -1 c 0 -0.550781 -0.449219 -1 -1 -1 s -1 0.449219 -1 1 z m 0 0", "key": "kd55sm" }]], "aliases": ["weather-showers-symbolic"], "gtkIconName": "weather-showers-symbolic" };
__iconData$k.node;
const WeatherShowers = createAdwaitaIcon(__iconData$k);

const __iconData$j = { "name": "weather-snow", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 14.691406 10.636719 c 0.8125 -0.816407 1.308594 -1.9375 1.308594 -3.171875 c 0 -2.484375 -2.015625 -4.5 -4.5 -4.5 c -0.417969 0 -0.828125 0.058594 -1.226562 0.171875 l 1.203124 0.585937 c -0.910156 -2.25 -3.09375 -3.722656 -5.519531 -3.722656 c -3.296875 0 -5.9648435 2.667969 -5.9648435 5.960938 c 0 1.367187 0.4570315 2.636718 1.2304685 3.652343 c 0.214844 0.285157 0.566406 0.4375 0.921875 0.390625 c 0.355469 -0.042968 0.660157 -0.273437 0.796875 -0.605468 c 0.140625 -0.328126 0.09375 -0.707032 -0.125 -0.992188 c -0.519531 -0.683594 -0.824218 -1.53125 -0.824218 -2.445312 c 0 -2.199219 1.761718 -3.960938 3.960937 -3.960938 c 1.617187 0 3.0625 0.976562 3.671875 2.472656 c 0.191406 0.476563 0.710938 0.726563 1.203125 0.585938 c 0.21875 -0.0625 0.445313 -0.09375 0.671875 -0.09375 c 1.390625 0 2.5 1.105468 2.5 2.5 c 0 0.691406 -0.277344 1.308594 -0.726562 1.761718 c -0.390626 0.390626 -0.386719 1.023438 0.003906 1.414063 c 0.390625 0.386719 1.023437 0.386719 1.414062 -0.003906 z m 0 0", "key": "15ky54" }], ["path", { "fill": "currentColor", "d": "m 4.992188 7 h 0.007812 c 0.550781 0 1 0.449219 1 1 s -0.449219 1 -1 1 h -0.007812 c -0.550782 0 -1 -0.449219 -1 -1 s 0.449218 -1 1 -1 z m 0 0", "key": "1lwico" }], ["path", { "fill": "currentColor", "d": "m 7.996094 8 h 0.007812 c 0.550782 0 1 0.449219 1 1 s -0.449218 1 -1 1 h -0.007812 c -0.550782 0 -1 -0.449219 -1 -1 s 0.449218 -1 1 -1 z m 0 0", "key": "18tz0d" }], ["path", { "fill": "currentColor", "d": "m 10.996094 7 h 0.007812 c 0.550782 0 1 0.449219 1 1 s -0.449218 1 -1 1 h -0.007812 c -0.550782 0 -1 -0.449219 -1 -1 s 0.449218 -1 1 -1 z m 0 0", "key": "eok6ta" }], ["path", { "fill": "currentColor", "d": "m 3.992188 10 h 0.007812 c 0.550781 0 1 0.449219 1 1 s -0.449219 1 -1 1 h -0.007812 c -0.550782 0 -1 -0.449219 -1 -1 s 0.449218 -1 1 -1 z m 0 0", "key": "1wmd68" }], ["path", { "fill": "currentColor", "d": "m 6.996094 11 h 0.007812 c 0.550782 0 1 0.449219 1 1 s -0.449218 1 -1 1 h -0.007812 c -0.550782 0 -1 -0.449219 -1 -1 s 0.449218 -1 1 -1 z m 0 0", "key": "zajcvy" }], ["path", { "fill": "currentColor", "d": "m 9.996094 10 h 0.007812 c 0.550782 0 1 0.449219 1 1 s -0.449218 1 -1 1 h -0.007812 c -0.550782 0 -1 -0.449219 -1 -1 s 0.449218 -1 1 -1 z m 0 0", "key": "q8edtc" }], ["path", { "fill": "currentColor", "d": "m 6.992188 14 h 0.007812 c 0.550781 0 1 0.449219 1 1 s -0.449219 1 -1 1 h -0.007812 c -0.550782 0 -1 -0.449219 -1 -1 s 0.449218 -1 1 -1 z m 0 0", "key": "1l0ct9" }], ["path", { "fill": "currentColor", "d": "m 9.996094 13 h 0.007812 c 0.550782 0 1 0.449219 1 1 s -0.449218 1 -1 1 h -0.007812 c -0.550782 0 -1 -0.449219 -1 -1 s 0.449218 -1 1 -1 z m 0 0", "key": "v7pjoz" }], ["path", { "fill": "currentColor", "d": "m 12.996094 12 h 0.007812 c 0.550782 0 1 0.449219 1 1 s -0.449218 1 -1 1 h -0.007812 c -0.550782 0 -1 -0.449219 -1 -1 s 0.449218 -1 1 -1 z m 0 0", "key": "b8s08" }]], "aliases": ["weather-snow-symbolic"], "gtkIconName": "weather-snow-symbolic" };
__iconData$j.node;
const WeatherSnow = createAdwaitaIcon(__iconData$j);

const __iconData$i = { "name": "weather-storm", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 14.691406 10.636719 c 0.8125 -0.816407 1.308594 -1.9375 1.308594 -3.171875 c 0 -2.484375 -2.015625 -4.5 -4.5 -4.5 c -0.417969 0 -0.828125 0.058594 -1.226562 0.171875 l 1.203124 0.585937 c -0.910156 -2.25 -3.09375 -3.722656 -5.519531 -3.722656 c -3.296875 0 -5.9648435 2.667969 -5.9648435 5.960938 c 0 1.367187 0.4570315 2.636718 1.2304685 3.652343 c 0.214844 0.285157 0.566406 0.4375 0.921875 0.390625 c 0.355469 -0.042968 0.660157 -0.273437 0.796875 -0.605468 c 0.140625 -0.328126 0.09375 -0.707032 -0.125 -0.992188 c -0.519531 -0.683594 -0.824218 -1.53125 -0.824218 -2.445312 c 0 -2.199219 1.761718 -3.960938 3.960937 -3.960938 c 1.617187 0 3.0625 0.976562 3.671875 2.472656 c 0.191406 0.476563 0.710938 0.726563 1.203125 0.585938 c 0.21875 -0.0625 0.445313 -0.09375 0.671875 -0.09375 c 1.390625 0 2.5 1.105468 2.5 2.5 c 0 0.691406 -0.277344 1.308594 -0.726562 1.761718 c -0.390626 0.390626 -0.386719 1.023438 0.003906 1.414063 c 0.390625 0.386719 1.023437 0.386719 1.414062 -0.003906 z m -6.398437 -3.34375 l -3 3 c -0.285157 0.285156 -0.371094 0.714843 -0.21875 1.089843 c 0.15625 0.375 0.519531 0.617188 0.925781 0.617188 h 4 l -0.707031 -1.707031 l -3 3 c -0.390625 0.390625 -0.390625 1.023437 0 1.414062 s 1.023437 0.390625 1.414062 0 l 3 -3 c 0.285157 -0.285156 0.371094 -0.714843 0.21875 -1.089843 c -0.15625 -0.375 -0.519531 -0.617188 -0.925781 -0.617188 h -4 l 0.707031 1.707031 l 3 -3 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 s -1.023437 -0.390625 -1.414062 0 z m 0 0", "key": "lolj3w" }]], "aliases": ["weather-storm-symbolic"], "gtkIconName": "weather-storm-symbolic" };
__iconData$i.node;
const WeatherStorm = createAdwaitaIcon(__iconData$i);

const __iconData$h = { "name": "weather-tornado", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 9.640625 1.074219 c -2.632813 -0.234375 -5.316406 0.046875 -7.074219 0.921875 c -0.4375 0.21875 -0.8125 0.46875 -1.105468 0.816406 c -0.292969 0.347656 -0.503907 0.84375 -0.453126 1.351562 c 0.097657 1.007813 0.902344 1.5625 1.832032 1.96875 c 1.859375 0.804688 4.613281 1.042969 7.199218 0.75 c 1.296876 -0.144531 2.394532 -0.414062 3.257813 -0.8125 c 0.429687 -0.203124 0.808594 -0.433593 1.121094 -0.753906 c 0.316406 -0.320312 0.582031 -0.785156 0.582031 -1.316406 c 0 -0.550781 -0.449219 -1 -1 -1 s -1 0.449219 -1 1 c 0 -0.105469 0.058594 -0.152344 -0.011719 -0.082031 c -0.066406 0.070312 -0.25 0.203125 -0.535156 0.335937 c -0.5625 0.261719 -1.496094 0.511719 -2.636719 0.640625 c -2.28125 0.257813 -4.910156 -0.046875 -6.179687 -0.597656 c -0.523438 -0.226563 -0.515625 -0.316406 -0.527344 -0.273437 c 0.074219 -0.0625 0.144531 -0.136719 0.347656 -0.234376 c 1.097657 -0.550781 3.675781 -0.929687 6.007813 -0.71875 c 0.550781 0.046876 1.035156 -0.359374 1.082031 -0.90625 c 0.023437 -0.265624 -0.058594 -0.53125 -0.226563 -0.734374 c -0.171874 -0.203126 -0.414062 -0.332032 -0.679687 -0.351563 z m 0 0", "key": "1chjf4" }], ["path", { "fill": "currentColor", "d": "m 4.035156 7.527344 c -0.527344 -0.15625 -1.082031 0.148437 -1.238281 0.679687 c -0.074219 0.253907 -0.042969 0.527344 0.082031 0.761719 c 0.128906 0.230469 0.34375 0.40625 0.597656 0.480469 c 1.261719 0.367187 2.855469 0.550781 4.523438 0.550781 s 3.261719 -0.183594 4.523438 -0.550781 c 0.53125 -0.15625 0.835937 -0.710938 0.679687 -1.242188 s -0.710937 -0.835937 -1.242187 -0.679687 c -0.988282 0.289062 -2.445313 0.472656 -3.960938 0.472656 s -2.972656 -0.183594 -3.964844 -0.472656 z m 0 0", "key": "1bs5r0" }], ["path", { "fill": "currentColor", "d": "m 10.765625 10.6875 c -1.242187 0.300781 -2.785156 0.390625 -4.207031 0.230469 c -0.550782 -0.0625 -1.042969 0.332031 -1.105469 0.882812 c -0.0625 0.546875 0.335937 1.042969 0.882813 1.105469 c 1.652343 0.183594 3.382812 0.09375 4.894531 -0.269531 c 0.261719 -0.0625 0.484375 -0.226563 0.621093 -0.453125 c 0.140626 -0.226563 0.183594 -0.496094 0.121094 -0.757813 c -0.0625 -0.257812 -0.222656 -0.480469 -0.449218 -0.617187 c -0.226563 -0.136719 -0.5 -0.179688 -0.757813 -0.121094 z m 0 0", "key": "at7q4g" }], ["path", { "fill": "currentColor", "d": "m 6.324219 13.886719 c -0.546875 -0.070313 -1.046875 0.316406 -1.121094 0.863281 c -0.03125 0.261719 0.039063 0.53125 0.199219 0.738281 c 0.160156 0.210938 0.402344 0.351563 0.664062 0.386719 c 0.769532 0.097656 1.570313 0.136719 2.371094 0.113281 c 0.550781 -0.015625 0.984375 -0.472656 0.96875 -1.027343 c -0.011719 -0.550782 -0.472656 -0.984376 -1.027344 -0.972657 c -0.695312 0.023438 -1.394531 -0.011719 -2.054687 -0.101562 z m 0 0", "key": "1f1epe" }]], "aliases": ["weather-tornado-symbolic"], "gtkIconName": "weather-tornado-symbolic" };
__iconData$h.node;
const WeatherTornado = createAdwaitaIcon(__iconData$h);

const __iconData$g = { "name": "weather-windy", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 5.542969 1.003906 c -0.132813 -0.003906 -0.269531 0.003906 -0.402344 0.019532 c -0.53125 0.070312 -1.042969 0.308593 -1.4375 0.707031 c -0.261719 0.253906 -0.367187 0.625 -0.277344 0.976562 c 0.09375 0.351563 0.367188 0.621094 0.71875 0.714844 c 0.351563 0.089844 0.722657 -0.015625 0.972657 -0.277344 c 0.164062 -0.164062 0.398437 -0.191406 0.597656 -0.078125 c 0.199218 0.113282 0.289062 0.339844 0.230468 0.5625 c -0.058593 0.226563 -0.25 0.371094 -0.476562 0.371094 h -5.46875 v 2 h 5.46875 c 1.125 0 2.121094 -0.765625 2.410156 -1.855469 c 0.289063 -1.085937 -0.1875 -2.246093 -1.160156 -2.808593 c -0.367188 -0.210938 -0.773438 -0.320313 -1.175781 -0.332032 z m 6.773437 1 c -1.550781 0.085938 -2.90625 1.203125 -3.238281 2.765625 c -0.117187 0.542969 0.226563 1.074219 0.769531 1.1875 c 0.539063 0.117188 1.070313 -0.230469 1.1875 -0.769531 c 0.164063 -0.78125 0.882813 -1.285156 1.675782 -1.175781 c 0.789062 0.113281 1.339843 0.796875 1.285156 1.59375 c -0.054688 0.796875 -0.699219 1.394531 -1.496094 1.394531 h -12.5 v 2 h 12.5 c 1.828125 0 3.363281 -1.429688 3.492188 -3.257812 c 0.128906 -1.824219 -1.195313 -3.453126 -3.003907 -3.710938 c -0.226562 -0.03125 -0.453125 -0.039062 -0.671875 -0.027344 z m -12.316406 7.996094 v 2 h 10 h 0.003906 c 0.464844 0 0.859375 0.3125 0.96875 0.769531 s -0.105468 0.914063 -0.523437 1.125 c -0.417969 0.210938 -0.910157 0.105469 -1.210938 -0.25 c -0.355469 -0.425781 -0.984375 -0.480469 -1.410156 -0.125 c -0.421875 0.355469 -0.476563 0.984375 -0.121094 1.40625 c 0.441407 0.53125 1.042969 0.875 1.691407 1.011719 c 0.644531 0.132812 1.332031 0.054688 1.949218 -0.257812 c 1.238282 -0.621094 1.890625 -2.023438 1.574219 -3.371094 c -0.320313 -1.347656 -1.535156 -2.308594 -2.917969 -2.308594 c -0.003906 0 -0.003906 0 -0.003906 0 z m 0 0", "key": "1iavfa" }]], "aliases": ["weather-windy-symbolic"], "gtkIconName": "weather-windy-symbolic" };
__iconData$g.node;
const WeatherWindy = createAdwaitaIcon(__iconData$g);

const __iconData$f = { "name": "web-browser", "size": 16, "node": [["path", { "fill": "currentColor", "d": "M8 4.846v10.38l-2.344-2.288-1.34 2.734c-.327.74-2.033.145-1.548-.844l1.326-2.839H1.136z", "key": "qgbbpq" }], ["path", { "fill": "currentColor", "d": "M7.156 1.063C3.33 1.522.578 5.02 1.063 8.843c.131 1.035.293 1.383.293 1.383l1.675-1.632A4.992 4.992 0 017.406 3.03a4.992 4.992 0 015.563 4.375c.314 2.608-1.391 5.025-3.969 5.532l.031 2s.521-.106.624-.131c3.416-.834 5.706-4.128 5.283-7.65-.46-3.827-3.955-6.555-7.782-6.095z", "key": "89173u" }], ["path", { "fill": "currentColor", "opacity": ".3", "d": "M4.113 7.815v-.206l-.198.019.05-.393h-.117l-.115.15-.116.056-.165-.093-.017-.206.033-.225.248-.186h.199l.033-.113.247.056.182.225.033-.374.314-.262.116-.28.231-.094.133-.187.297-.056.149-.225h-.446l.28-.13h.199l.28-.094.034-.112-.1-.094-.115-.037.033-.112-.083-.169-.198.075.033-.15-.231-.13-.182.317.017.113-.182.075-.116.243-.05-.225-.313-.13-.05-.169.413-.243.182-.168.017-.206-.1-.056L4.84 4l-.082.206s-.139.027-.174.036C4.13 4.66 3.214 5.562 3 7.266c.008.04.155.268.155.268l.347.206.347.093m3.966-4.3l-.43-.168-.496.056-.611.168-.116.112.38.262v.15l-.149.15.199.392.132-.075.165-.262a5.51 5.51 0 00.727-.28l.199-.505m2.529.342l-.375.094-.219.156v.125l-.375.25.094.344.219-.157.125.157.156.093.094-.28L10 4.5l.063-.094.218-.187h.094l-.094.218v.188c.09-.024.16-.051.25-.063l-.25.188v.125l-.312.219-.281-.063v-.156l-.125.062.062.157h-.219l-.125.218-.156.157-.094.03v.188l.032.157H9.03v.53l.063-.03.094-.219L9.375 6l.031-.094.282-.062.156.187.187.094-.093.187.156-.03.062-.22-.187-.218h.062l.22.156.03.219.157.219.062-.313.094-.031c.096.1.169.231.25.344h.281l.188.125-.094.093-.156.157h-.25l-.344-.094h-.188l-.125.156-.343-.375-.25-.062-.375.062-.157.094V9l.032.031.25-.156.093.094h.281l.125.156-.093.312.187.188V10l.125.25-.093.25c-.01.161 0 .307 0 .469.08.219.143.435.218.656l.063.344v.187h.125l.219-.125h.25l.375-.437-.032-.157.25-.218-.187-.188.219-.187.218-.125.094-.125-.062-.25V9.75l.187-.375.188-.25.25-.563v-.156c-.117.015-.23.023-.344.031-.072.005-.145 0-.219 0a7.442 7.442 0 01-.312-.78l-.157-.188-.093-.313.062-.062.219.25.25.562.156.156-.062.22.156.155.25-.25.312-.218.157-.188v-.219c-.04-.073-.055-.145-.094-.218l-.156.187-.125-.156-.188-.125v-.281l.219.218.219-.03c.101.091.192.207.28.312L13 7.28c0-.174-.2-1.02-.625-1.75S11.22 4.125 11.22 4.125l-.063.094-.218.218-.25-.25h.25l.125-.125-.47-.093-.25-.094z", "key": "1vkk69" }]], "aliases": ["web-browser-symbolic"], "gtkIconName": "web-browser-symbolic" };
__iconData$f.node;
const WebBrowser = createAdwaitaIcon(__iconData$f);

const __iconData$e = { "name": "window-close", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4 4 h 1 h 0.03125 c 0.253906 0.011719 0.511719 0.128906 0.6875 0.3125 l 2.28125 2.28125 l 2.3125 -2.28125 c 0.265625 -0.230469 0.445312 -0.304688 0.6875 -0.3125 h 1 v 1 c 0 0.285156 -0.035156 0.550781 -0.25 0.75 l -2.28125 2.28125 l 2.25 2.25 c 0.1875 0.1875 0.28125 0.453125 0.28125 0.71875 v 1 h -1 c -0.265625 0 -0.53125 -0.09375 -0.71875 -0.28125 l -2.28125 -2.28125 l -2.28125 2.28125 c -0.1875 0.1875 -0.453125 0.28125 -0.71875 0.28125 h -1 v -1 c 0 -0.265625 0.09375 -0.53125 0.28125 -0.71875 l 2.28125 -2.25 l -2.28125 -2.28125 c -0.210938 -0.195312 -0.304688 -0.46875 -0.28125 -0.75 z m 0 0", "key": "w4xqp1" }]], "aliases": ["window-close-symbolic"], "gtkIconName": "window-close-symbolic" };
__iconData$e.node;
const WindowClose = createAdwaitaIcon(__iconData$e);

const __iconData$d = { "name": "window-maximize", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3.988281 3.992188 v 8.011718 h 8.011719 v -8.011718 z m 2 2 h 4.011719 v 4.011718 h -4.011719 z m 0 0", "key": "1vyfth" }]], "aliases": ["window-maximize-symbolic"], "gtkIconName": "window-maximize-symbolic" };
__iconData$d.node;
const WindowMaximize = createAdwaitaIcon(__iconData$d);

const __iconData$c = { "name": "window-minimize", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4 10.007812 h 8 v 1.988282 h -8 z m 0 0", "key": "tv60fz" }]], "aliases": ["window-minimize-symbolic"], "gtkIconName": "window-minimize-symbolic" };
__iconData$c.node;
const WindowMinimize = createAdwaitaIcon(__iconData$c);

const __iconData$b = { "name": "window-new", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3 0 c -1.644531 0 -3 1.355469 -3 3 v 8 c 0 1.644531 1.355469 3 3 3 h 3 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 h -3 c -0.570312 0 -1 -0.429688 -1 -1 v -6 c 0 -0.554688 0.445312 -1 1 -1 h 10 c 0.554688 0 1 0.445312 1 1 v 3 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -5 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 0", "key": "2byw02" }], ["path", { "fill": "currentColor", "d": "m 11 8 v 3 h -3 v 2 h 3 v 3 h 2 v -3 h 3 v -2 h -3 v -3 z m 0 0", "key": "croqyq" }]], "aliases": ["window-new-symbolic"], "gtkIconName": "window-new-symbolic" };
__iconData$b.node;
const WindowNew = createAdwaitaIcon(__iconData$b);

const __iconData$a = { "name": "window-restore", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4.988281 4.992188 v 6.011718 h 6.011719 v -6.011718 z m 2 2 h 2.011719 v 2.011718 h -2.011719 z m 0 0", "key": "xg4480" }]], "aliases": ["window-restore-symbolic"], "gtkIconName": "window-restore-symbolic" };
__iconData$a.node;
const WindowRestore = createAdwaitaIcon(__iconData$a);

const __iconData$9 = { "name": "x-office-address-book", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 5 0 c -1.292969 0 -2.40625 0.839844 -2.824219 2 h -1.175781 v 2 h 1 v 1 h -1 v 2 h 1 v 1 h -1 v 2 h 1 v 1 h -1 v 2 h 1.175781 c 0.417969 1.160156 1.53125 2 2.824219 2 h 7 c 1.644531 0 3 -1.355469 3 -3 v -9 c 0 -1.644531 -1.355469 -3 -3 -3 z m 0 2 h 7 c 0.570312 0 0.886719 0.441406 1 1 v 9 c 0 0.570312 -0.429688 1 -1 1 h -7 c -0.554688 0 -1 -0.445312 -1 -1 v -9 c 0 -0.554688 0.445312 -1 1 -1 z m 3.527344 2 c -0.082032 0 -0.160156 0.003906 -0.242188 0.011719 c -0.214844 0.015625 -0.429687 0.046875 -0.640625 0.101562 c -1.710937 0.433594 -2.839843 2.082031 -2.617187 3.832031 s 1.722656 3.066407 3.488281 3.0625 c 0.847656 -0.003906 1.640625 -0.277343 1.640625 -0.277343 l -0.3125 -0.949219 s -0.707031 0.226562 -1.332031 0.226562 h -0.003907 c -1.265624 0.003907 -2.328124 -0.929687 -2.488281 -2.1875 c -0.160156 -1.257812 0.640625 -2.425781 1.867188 -2.738281 c 0.617187 -0.15625 1.28125 -0.078125 1.808593 0.164063 c 0.527344 0.242187 0.890626 0.628906 1.003907 1.058594 c 0.125 0.464843 0.085937 0.96875 -0.085938 1.277343 c -0.097656 0.175781 -0.402343 0.351563 -0.613281 0.425781 v -0.5 c 0 -0.824218 -0.675781 -1.5 -1.5 -1.5 s -1.5 0.675782 -1.5 1.5 c 0 0.820313 0.675781 1.5 1.5 1.5 c 0.175781 0 0.34375 -0.039062 0.5 -0.09375 v 0.042969 l 0.449219 0.046875 c 0.941406 0.097656 1.691406 -0.316406 2.039062 -0.933594 c 0.347657 -0.621093 0.355469 -1.359374 0.175781 -2.023437 c -0.207031 -0.785156 -0.816406 -1.371094 -1.554687 -1.707031 c -0.480469 -0.222656 -1.023437 -0.34375 -1.585937 -0.339844 z m -0.027344 3.007812 c 0.28125 0 0.5 0.214844 0.5 0.5 c 0 0.28125 -0.21875 0.5 -0.5 0.5 s -0.5 -0.21875 -0.5 -0.5 c 0 -0.285156 0.21875 -0.5 0.5 -0.5 z m 0 0", "key": "378aqt" }]], "aliases": ["x-office-address-book-symbolic"], "gtkIconName": "x-office-address-book-symbolic" };
__iconData$9.node;
const XOfficeAddressBook = createAdwaitaIcon(__iconData$9);

const __iconData$8 = { "name": "x-office-calendar", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4 1 v 1 c -1.644531 0 -3 1.355469 -3 3 v 7 c 0 1.644531 1.355469 3 3 3 h 8 c 1.644531 0 3 -1.355469 3 -3 v -7 c 0 -1.644531 -1.355469 -3 -3 -3 v -1 h -2 v 1 h -4 v -1 z m 0 5 h 8 c 0.554688 0 1 0.445312 1 1 v 5 c 0 0.570312 -0.441406 0.886719 -1 1 h -8 c -0.570312 0 -1 -0.429688 -1 -1 v -5 c 0 -0.554688 0.445312 -1 1 -1 z m 3 1 v 1 h 2 v -1 z m 3 0 v 1 h 2 v -1 z m -6 2 v 1 h 2 v -1 z m 3 0 v 1 h 2 v -1 z m 3 0 v 1 h 2 v -1 z m -6 2 v 1 h 2 v -1 z m 3 0 v 1 h 2 v -1 z m 3 0 v 1 h 2 v -1 z m 0 0", "key": "16owah" }]], "aliases": ["x-office-calendar-symbolic"], "gtkIconName": "x-office-calendar-symbolic" };
__iconData$8.node;
const XOfficeCalendar = createAdwaitaIcon(__iconData$8);

const __iconData$7 = { "name": "x-office-document", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4.96875 1.003906 c -1.644531 0 -3 1.355469 -3 3 v 9 c 0 1.644532 1.355469 3 3 3 h 6 c 1.644531 0 3 -1.355468 3 -3 v -7.5 c 0 -0.265625 -0.105469 -0.519531 -0.292969 -0.707031 l -3.5 -3.5 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0 2 h 4 v 1.5 c 0 1 0.5 1.5 1.5 1.5 h 1.5 v 7 c 0 0.570313 -0.429688 1 -1 1 h -6 c -0.570312 0 -1 -0.429687 -1 -1 v -9 c 0 -0.570312 0.429688 -1 1 -1 z m 1.5 2 c -0.824219 0 -1.5 0.675782 -1.5 1.5 c 0 0.824219 0.675781 1.5 1.5 1.5 s 1.5 -0.675781 1.5 -1.5 c 0 -0.824218 -0.675781 -1.5 -1.5 -1.5 z m 0 1 c 0.28125 0 0.5 0.21875 0.5 0.5 s -0.21875 0.5 -0.5 0.5 s -0.5 -0.21875 -0.5 -0.5 s 0.21875 -0.5 0.5 -0.5 z m 2.484375 1.988282 v 1 l 2.015625 0.011718 v -1 z m -3.984375 2.011718 v 1 h 6 v -1 z m 0 2 v 1 h 6 v -1 z m 0 0", "key": "157k3q" }]], "aliases": ["x-office-document-symbolic"], "gtkIconName": "x-office-document-symbolic" };
__iconData$7.node;
const XOfficeDocument = createAdwaitaIcon(__iconData$7);

const __iconData$6 = { "name": "x-office-drawing", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4.96875 1.003906 c -1.644531 0 -3 1.355469 -3 3 v 9 c 0 1.644532 1.355469 3 3 3 h 6 c 1.644531 0 3 -1.355468 3 -3 v -7.5 c 0 -0.265625 -0.105469 -0.519531 -0.292969 -0.707031 l -3.5 -3.5 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0 2 h 4 v 1.5 c 0 1 0.5 1.5 1.5 1.5 h 1.5 v 4.980469 c -1.023438 -0.085937 -1.480469 -0.445313 -1.921875 -0.847656 c -0.253906 -0.234375 -0.492187 -0.5 -0.8125 -0.726563 c -0.324219 -0.230468 -0.753906 -0.40625 -1.265625 -0.40625 s -0.941406 0.175782 -1.265625 0.40625 c -0.320313 0.226563 -0.558594 0.492188 -0.8125 0.726563 c -0.441406 0.402343 -0.898437 0.761719 -1.921875 0.847656 v -6.980469 c 0 -0.570312 0.429688 -1 1 -1 z m 1.5 2 c -0.824219 0 -1.5 0.675782 -1.5 1.5 c 0 0.824219 0.675781 1.5 1.5 1.5 s 1.5 -0.675781 1.5 -1.5 c 0 -0.824218 -0.675781 -1.5 -1.5 -1.5 z m 0 1 c 0.28125 0 0.5 0.21875 0.5 0.5 s -0.21875 0.5 -0.5 0.5 s -0.5 -0.21875 -0.5 -0.5 s 0.21875 -0.5 0.5 -0.5 z m 1.5 4 c 0.308594 0 0.480469 0.074219 0.683594 0.21875 c 0.203125 0.148438 0.425781 0.382813 0.71875 0.648438 c 0.519531 0.480468 1.296875 1.003906 2.597656 1.113281 v 1.019531 c 0 0.570313 -0.429688 1 -1 1 h -6 c -0.570312 0 -1 -0.429687 -1 -1 v -1.019531 c 1.300781 -0.109375 2.078125 -0.632813 2.597656 -1.113281 c 0.292969 -0.265625 0.515625 -0.5 0.71875 -0.648438 c 0.203125 -0.144531 0.375 -0.21875 0.683594 -0.21875 z m 0 0", "key": "18ow7x" }]], "aliases": ["x-office-drawing-symbolic"], "gtkIconName": "x-office-drawing-symbolic" };
__iconData$6.node;
const XOfficeDrawing = createAdwaitaIcon(__iconData$6);

const __iconData$5 = { "name": "x-office-presentation", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 1.097656 2.003906 c -0.554687 0 -0.9999998 0.445313 -0.9999998 1 c 0.0039058 0.507813 0.3945318 0.933594 0.9062498 0.984375 l 0.011719 8.027344 h 6 l -0.011719 1.742187 l -1.804687 1.378907 c -0.222657 0.167969 -0.261719 0.480469 -0.09375 0.703125 c 0.167969 0.21875 0.480469 0.257812 0.703125 0.089844 l 1.6875 -1.292969 l 1.695312 1.324219 c 0.21875 0.167968 0.535156 0.128906 0.707032 -0.085938 c 0.167968 -0.21875 0.128906 -0.535156 -0.089844 -0.703125 l -1.804688 -1.414063 l 0.011719 -1.742187 h 6 l -0.011719 -8.054687 c 0.425782 -0.125 0.722656 -0.515626 0.722656 -0.957032 c 0 -0.554687 -0.449218 -1 -1 -1 z m 6.90625 2 c 1.101563 0 2 0.894532 2 2 h -2 z m -1 1 v 2 h 2 c 0 1.101563 -0.898437 2 -2 2 c -1.105468 0 -2 -0.898437 -2 -2 c 0 -1.105468 0.894532 -2 2 -2 z m 0 0", "key": "1f3hd8" }]], "aliases": ["x-office-presentation-symbolic"], "gtkIconName": "x-office-presentation-symbolic" };
__iconData$5.node;
const XOfficePresentation = createAdwaitaIcon(__iconData$5);

const __iconData$4 = { "name": "x-office-spreadsheet", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 4.96875 1.003906 c -1.644531 0 -3 1.355469 -3 3 v 9 c 0 1.644532 1.355469 3 3 3 h 6 c 1.644531 0 3 -1.355468 3 -3 v -7.5 c 0 -0.265625 -0.105469 -0.519531 -0.292969 -0.707031 l -3.5 -3.5 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 z m 0 2 h 4 v 1.5 c 0 1 0.5 1.5 1.5 1.5 h 1.5 v 7 c 0 0.570313 -0.429688 1 -1 1 h -6 c -0.570312 0 -1 -0.429687 -1 -1 v -9 c 0 -0.570312 0.429688 -1 1 -1 z m 0 1 v 1 h 1 v -1 z m 2 0 v 1 h 1 v -1 z m -2 2 v 1 h 1 v -1 z m 2 0 v 1 h 1 v -1 z m 2.53125 1.449219 l -1.53125 2.046875 l -1.46875 -1.0625 l -1.53125 1.566406 v 1.011719 h 6 v -1.011719 z m -4.53125 4.550781 v 1 h 1 v -1 z m 2 0 v 1 h 1 v -1 z m 2 0 v 1 h 1 v -1 z m 0 0", "key": "89e9b9" }]], "aliases": ["x-office-spreadsheet-symbolic"], "gtkIconName": "x-office-spreadsheet-symbolic" };
__iconData$4.node;
const XOfficeSpreadsheet = createAdwaitaIcon(__iconData$4);

const __iconData$3 = { "name": "zoom-fit-best", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3.992188 1 c -1.660157 0 -3 1.339844 -3 3 v 8 c 0 1.660156 1.339843 3 3 3 h 8 c 1.660156 0 3 -1.339844 3 -3 v -8 c 0 -1.660156 -1.339844 -3 -3 -3 z m 0 2 h 3.011718 v 2 h -2 v 2 h -2 l -0.011718 -3 c 0 -0.128906 0.027343 -0.253906 0.074218 -0.375 c 0.003906 -0.003906 0.003906 -0.007812 0.007813 -0.011719 c 0.046875 -0.117187 0.117187 -0.21875 0.203125 -0.308593 c 0.007812 -0.007813 0.011718 -0.011719 0.019531 -0.019532 c 0.089844 -0.085937 0.191406 -0.15625 0.308594 -0.203125 c 0.003906 -0.003906 0.007812 -0.007812 0.015625 -0.007812 c 0.117187 -0.046875 0.242187 -0.074219 0.371094 -0.074219 z m 5 0 h 3.011718 c 0.125 0 0.253906 0.027344 0.371094 0.074219 c 0.003906 0.003906 0.011719 0.003906 0.015625 0.007812 c 0.113281 0.046875 0.21875 0.117188 0.304687 0.203125 c 0.007813 0.007813 0.015626 0.011719 0.019532 0.019532 c 0.089844 0.089843 0.160156 0.191406 0.207031 0.308593 c 0 0.003907 0.003906 0.007813 0.007813 0.015625 c 0.046874 0.117188 0.070312 0.242188 0.074218 0.371094 l -0.011718 3 h -2 v -2 h -2 z m -5.988282 6 h 2 v 2 h 2 v 2 h -3.011718 c -0.128907 0 -0.253907 -0.027344 -0.375 -0.074219 c -0.003907 -0.003906 -0.007813 -0.003906 -0.011719 -0.007812 c -0.117188 -0.046875 -0.21875 -0.117188 -0.308594 -0.203125 c -0.007813 -0.007813 -0.011719 -0.011719 -0.019531 -0.019532 c -0.085938 -0.089843 -0.15625 -0.191406 -0.203125 -0.308593 c -0.003907 -0.003907 -0.007813 -0.007813 -0.007813 -0.015625 c -0.046875 -0.117188 -0.074218 -0.242188 -0.074218 -0.371094 z m 7.988282 0 h 2 l 0.011718 3 c -0.003906 0.128906 -0.027344 0.253906 -0.074218 0.375 c -0.003907 0.003906 -0.003907 0.007812 -0.007813 0.011719 c -0.046875 0.117187 -0.117187 0.21875 -0.203125 0.308593 c -0.007812 0.007813 -0.015625 0.011719 -0.019531 0.019532 c -0.089844 0.085937 -0.195313 0.15625 -0.308594 0.203125 c -0.003906 0.003906 -0.011719 0.007812 -0.015625 0.007812 c -0.117188 0.046875 -0.246094 0.074219 -0.371094 0.074219 h -3.011718 v -2 h 2 z m 0 0", "key": "15hqjf" }]], "aliases": ["zoom-fit-best-symbolic"], "gtkIconName": "zoom-fit-best-symbolic" };
__iconData$3.node;
const ZoomFitBest = createAdwaitaIcon(__iconData$3);

const __iconData$2 = { "name": "zoom-in", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3.992188 1 c -1.660157 0 -3 1.339844 -3 3 v 8 c 0 1.660156 1.339843 3 3 3 h 8 c 1.660156 0 3 -1.339844 3 -3 v -8 c 0 -1.660156 -1.339844 -3 -3 -3 z m 3 3 h 2 v 3 h 3 v 2 h -3 v 3 h -2 v -3 h -3 v -2 h 3 z m 0 0", "key": "3qdply" }]], "aliases": ["zoom-in-symbolic"], "gtkIconName": "zoom-in-symbolic" };
__iconData$2.node;
const ZoomIn = createAdwaitaIcon(__iconData$2);

const __iconData$1 = { "name": "zoom-original", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3.992188 1 c -1.660157 0 -3 1.339844 -3 3 v 8 c 0 1.660156 1.339843 3 3 3 h 8 c 1.660156 0 3 -1.339844 3 -3 v -8 c 0 -1.660156 -1.339844 -3 -3 -3 z m 3 3 h 2 v 8 h -2 v -5 h -2 v -1 c 1.105468 0 2 -0.894531 2 -2 z m 0 0", "key": "axtgs2" }]], "aliases": ["zoom-original-symbolic"], "gtkIconName": "zoom-original-symbolic" };
__iconData$1.node;
const ZoomOriginal = createAdwaitaIcon(__iconData$1);

const __iconData = { "name": "zoom-out", "size": 16, "node": [["path", { "fill": "currentColor", "d": "m 3.992188 1 c -1.660157 0 -3 1.339844 -3 3 v 8 c 0 1.660156 1.339843 3 3 3 h 8 c 1.660156 0 3 -1.339844 3 -3 v -8 c 0 -1.660156 -1.339844 -3 -3 -3 z m 0 6 h 8 v 2 h -8 z m 0 0", "key": "hb0d5t" }]], "aliases": ["zoom-out-symbolic"], "gtkIconName": "zoom-out-symbolic" };
__iconData.node;
const ZoomOut = createAdwaitaIcon(__iconData);

var index = /*#__PURE__*/Object.freeze({
  __proto__: null,
  AcAdapter: AcAdapter,
  AccessoriesCalculator: AccessoriesCalculator,
  AccessoriesCharacterMap: AccessoriesCharacterMap,
  AccessoriesDictionary: AccessoriesDictionary,
  AccessoriesTextEditor: AccessoriesTextEditor,
  ActionUnavailable: ActionUnavailable,
  AddressBookNew: AddressBookNew,
  AdwAdaptivePreview: AdwAdaptivePreview,
  AdwApplicationExit: AdwApplicationExit,
  AdwApplicationExitRtl: AdwApplicationExitRtl,
  AdwAvatarDefault: AdwAvatarDefault,
  AdwEntryApply: AdwEntryApply,
  AdwEntryEdit: AdwEntryEdit,
  AdwExpanderArrow: AdwExpanderArrow,
  AdwExternalLink: AdwExternalLink,
  AdwMailSend: AdwMailSend,
  AdwRotateAcw: AdwRotateAcw,
  AdwRotateCw: AdwRotateCw,
  AdwScreenshot: AdwScreenshot,
  AdwSidebar: AdwSidebar,
  AdwSidebarRtl: AdwSidebarRtl,
  AdwTabCounter: AdwTabCounter,
  AdwTabIconMissing: AdwTabIconMissing,
  AdwTabNew: AdwTabNew,
  AdwTabOverflow: AdwTabOverflow,
  AdwTabUnpin: AdwTabUnpin,
  AirplaneMode: AirplaneMode,
  AirplaneModeDisabled: AirplaneModeDisabled,
  Alarm: Alarm,
  AppletsScreenshooter: AppletsScreenshooter,
  ApplicationCertificate: ApplicationCertificate,
  ApplicationExit: ApplicationExit,
  ApplicationExitRtl: ApplicationExitRtl,
  ApplicationRssXml: ApplicationRssXml,
  ApplicationXAddon: ApplicationXAddon,
  ApplicationXAppliance: ApplicationXAppliance,
  ApplicationXExecutable: ApplicationXExecutable,
  ApplicationXFirmware: ApplicationXFirmware,
  ApplicationXSharedlib: ApplicationXSharedlib,
  ApplicationsEngineering: ApplicationsEngineering,
  ApplicationsGames: ApplicationsGames,
  ApplicationsGraphics: ApplicationsGraphics,
  ApplicationsMultimedia: ApplicationsMultimedia,
  ApplicationsScience: ApplicationsScience,
  ApplicationsSystem: ApplicationsSystem,
  ApplicationsUtilities: ApplicationsUtilities,
  AppointmentMissed: AppointmentMissed,
  AppointmentNew: AppointmentNew,
  AppointmentSoon: AppointmentSoon,
  AudioCard: AudioCard,
  AudioHeadphones: AudioHeadphones,
  AudioHeadset: AudioHeadset,
  AudioInputMicrophone: AudioInputMicrophone,
  AudioSpeakers: AudioSpeakers,
  AudioSpeakersRtl: AudioSpeakersRtl,
  AudioVolumeHigh: AudioVolumeHigh,
  AudioVolumeHighRtl: AudioVolumeHighRtl,
  AudioVolumeLow: AudioVolumeLow,
  AudioVolumeLowRtl: AudioVolumeLowRtl,
  AudioVolumeMedium: AudioVolumeMedium,
  AudioVolumeMediumRtl: AudioVolumeMediumRtl,
  AudioVolumeMuted: AudioVolumeMuted,
  AudioVolumeMutedRtl: AudioVolumeMutedRtl,
  AudioVolumeOveramplified: AudioVolumeOveramplified,
  AudioVolumeOveramplifiedRtl: AudioVolumeOveramplifiedRtl,
  AudioXGeneric: AudioXGeneric,
  AuthFace: AuthFace,
  AuthFingerprint: AuthFingerprint,
  AuthSim: AuthSim,
  AuthSimLocked: AuthSimLocked,
  AuthSimMissing: AuthSimMissing,
  AuthSmartcard: AuthSmartcard,
  AvatarDefault: AvatarDefault,
  Battery: Battery,
  BatteryAction: BatteryAction,
  BatteryCaution: BatteryCaution,
  BatteryCautionCharging: BatteryCautionCharging,
  BatteryEmpty: BatteryEmpty,
  BatteryEmptyCharging: BatteryEmptyCharging,
  BatteryFull: BatteryFull,
  BatteryFullCharged: BatteryFullCharged,
  BatteryFullCharging: BatteryFullCharging,
  BatteryGood: BatteryGood,
  BatteryGoodCharging: BatteryGoodCharging,
  BatteryLevel0: BatteryLevel0,
  BatteryLevel0Charging: BatteryLevel0Charging,
  BatteryLevel0PluggedIn: BatteryLevel0PluggedIn,
  BatteryLevel10: BatteryLevel10,
  BatteryLevel100: BatteryLevel100,
  BatteryLevel100Charged: BatteryLevel100Charged,
  BatteryLevel100PluggedIn: BatteryLevel100PluggedIn,
  BatteryLevel10Charging: BatteryLevel10Charging,
  BatteryLevel10PluggedIn: BatteryLevel10PluggedIn,
  BatteryLevel20: BatteryLevel20,
  BatteryLevel20Charging: BatteryLevel20Charging,
  BatteryLevel20PluggedIn: BatteryLevel20PluggedIn,
  BatteryLevel30: BatteryLevel30,
  BatteryLevel30Charging: BatteryLevel30Charging,
  BatteryLevel30PluggedIn: BatteryLevel30PluggedIn,
  BatteryLevel40: BatteryLevel40,
  BatteryLevel40Charging: BatteryLevel40Charging,
  BatteryLevel40PluggedIn: BatteryLevel40PluggedIn,
  BatteryLevel50: BatteryLevel50,
  BatteryLevel50Charging: BatteryLevel50Charging,
  BatteryLevel50PluggedIn: BatteryLevel50PluggedIn,
  BatteryLevel60: BatteryLevel60,
  BatteryLevel60Charging: BatteryLevel60Charging,
  BatteryLevel60PluggedIn: BatteryLevel60PluggedIn,
  BatteryLevel70: BatteryLevel70,
  BatteryLevel70Charging: BatteryLevel70Charging,
  BatteryLevel70PluggedIn: BatteryLevel70PluggedIn,
  BatteryLevel80: BatteryLevel80,
  BatteryLevel80Charging: BatteryLevel80Charging,
  BatteryLevel80PluggedIn: BatteryLevel80PluggedIn,
  BatteryLevel90: BatteryLevel90,
  BatteryLevel90Charging: BatteryLevel90Charging,
  BatteryLevel90PluggedIn: BatteryLevel90PluggedIn,
  BatteryLow: BatteryLow,
  BatteryLowCharging: BatteryLowCharging,
  BatteryMissing: BatteryMissing,
  Bluetooth: Bluetooth,
  BluetoothAcquiring: BluetoothAcquiring,
  BluetoothActive: BluetoothActive,
  BluetoothDisabled: BluetoothDisabled,
  BluetoothDisconnected: BluetoothDisconnected,
  BluetoothHardwareDisabled: BluetoothHardwareDisabled,
  BookmarkNew: BookmarkNew,
  Bullet: Bullet,
  CallIncoming: CallIncoming,
  CallMissed: CallMissed,
  CallOutgoing: CallOutgoing,
  CallStart: CallStart,
  CallStop: CallStop,
  CameraDisabled: CameraDisabled,
  CameraHardwareDisabled: CameraHardwareDisabled,
  CameraPhoto: CameraPhoto,
  CameraSwitch: CameraSwitch,
  CameraVideo: CameraVideo,
  CameraWeb: CameraWeb,
  ChangesAllow: ChangesAllow,
  ChangesPrevent: ChangesPrevent,
  ChannelInsecure: ChannelInsecure,
  ChannelSecure: ChannelSecure,
  ChatMessageNew: ChatMessageNew,
  Check: Check,
  Checkbox: Checkbox,
  CheckboxChecked: CheckboxChecked,
  CheckboxMixed: CheckboxMixed,
  ColorSelect: ColorSelect,
  ColorimeterColorhug: ColorimeterColorhug,
  Computer: Computer,
  ComputerAppleIpad: ComputerAppleIpad,
  ComputerFail: ComputerFail,
  ContactNew: ContactNew,
  ContentLoading: ContentLoading,
  Dash: Dash,
  DaytimeSunrise: DaytimeSunrise,
  DaytimeSunset: DaytimeSunset,
  DialogError: DialogError,
  DialogInformation: DialogInformation,
  DialogPassword: DialogPassword,
  DialogQuestion: DialogQuestion,
  DialogWarning: DialogWarning,
  DisplayBrightness: DisplayBrightness,
  DisplayProjector: DisplayProjector,
  DocumentEdit: DocumentEdit,
  DocumentNew: DocumentNew,
  DocumentOpen: DocumentOpen,
  DocumentOpenRecent: DocumentOpenRecent,
  DocumentPageSetup: DocumentPageSetup,
  DocumentPrint: DocumentPrint,
  DocumentPrintPreview: DocumentPrintPreview,
  DocumentProperties: DocumentProperties,
  DocumentRevert: DocumentRevert,
  DocumentRevertRtl: DocumentRevertRtl,
  DocumentSave: DocumentSave,
  DocumentSaveAs: DocumentSaveAs,
  DocumentSend: DocumentSend,
  DriveHarddisk: DriveHarddisk,
  DriveHarddiskIeee1394: DriveHarddiskIeee1394,
  DriveHarddiskSolidstate: DriveHarddiskSolidstate,
  DriveHarddiskSystem: DriveHarddiskSystem,
  DriveHarddiskUsb: DriveHarddiskUsb,
  DriveMultidisk: DriveMultidisk,
  DriveOptical: DriveOptical,
  DriveRemovableMedia: DriveRemovableMedia,
  EditClear: EditClear,
  EditClearAll: EditClearAll,
  EditClearRtl: EditClearRtl,
  EditCopy: EditCopy,
  EditCut: EditCut,
  EditDelete: EditDelete,
  EditFind: EditFind,
  EditFindReplace: EditFindReplace,
  EditPaste: EditPaste,
  EditRedo: EditRedo,
  EditSelect: EditSelect,
  EditSelectAll: EditSelectAll,
  EditUndo: EditUndo,
  EmblemImportant: EmblemImportant,
  EmblemSystem: EmblemSystem,
  EmojiActivities: EmojiActivities,
  EmojiBody: EmojiBody,
  EmojiFlags: EmojiFlags,
  EmojiFood: EmojiFood,
  EmojiNature: EmojiNature,
  EmojiObjects: EmojiObjects,
  EmojiPeople: EmojiPeople,
  EmojiRecent: EmojiRecent,
  EmojiSymbols: EmojiSymbols,
  EmojiTravel: EmojiTravel,
  EmoteLove: EmoteLove,
  ErrorCorrect: ErrorCorrect,
  FaceAngel: FaceAngel,
  FaceAngry: FaceAngry,
  FaceConfused: FaceConfused,
  FaceCool: FaceCool,
  FaceCrying: FaceCrying,
  FaceDevilish: FaceDevilish,
  FaceEmbarrassed: FaceEmbarrassed,
  FaceGlasses: FaceGlasses,
  FaceKiss: FaceKiss,
  FaceLaugh: FaceLaugh,
  FaceMonkey: FaceMonkey,
  FacePlain: FacePlain,
  FaceRaspberry: FaceRaspberry,
  FaceSad: FaceSad,
  FaceShutmouth: FaceShutmouth,
  FaceSick: FaceSick,
  FaceSmile: FaceSmile,
  FaceSmileBig: FaceSmileBig,
  FaceSmirk: FaceSmirk,
  FaceSurprise: FaceSurprise,
  FaceTired: FaceTired,
  FaceUncertain: FaceUncertain,
  FaceWink: FaceWink,
  FaceWorried: FaceWorried,
  FaceYawn: FaceYawn,
  FindLocation: FindLocation,
  FocusLegacySystray: FocusLegacySystray,
  FocusTopBar: FocusTopBar,
  FocusWindows: FocusWindows,
  Folder: Folder,
  FolderDocuments: FolderDocuments,
  FolderDownload: FolderDownload,
  FolderDragAccept: FolderDragAccept,
  FolderMusic: FolderMusic,
  FolderNew: FolderNew,
  FolderOpen: FolderOpen,
  FolderPictures: FolderPictures,
  FolderPublicshare: FolderPublicshare,
  FolderRemote: FolderRemote,
  FolderSavedSearch: FolderSavedSearch,
  FolderTemplates: FolderTemplates,
  FolderVideos: FolderVideos,
  FolderVisiting: FolderVisiting,
  FontSelect: FontSelect,
  FontXGeneric: FontXGeneric,
  FormatIndentLess: FormatIndentLess,
  FormatIndentLessRtl: FormatIndentLessRtl,
  FormatIndentMore: FormatIndentMore,
  FormatIndentMoreRtl: FormatIndentMoreRtl,
  FormatJustifyCenter: FormatJustifyCenter,
  FormatJustifyFill: FormatJustifyFill,
  FormatJustifyLeft: FormatJustifyLeft,
  FormatJustifyRight: FormatJustifyRight,
  FormatTextBold: FormatTextBold,
  FormatTextDirection: FormatTextDirection,
  FormatTextDirectionLtr: FormatTextDirectionLtr,
  FormatTextDirectionRtl: FormatTextDirectionRtl,
  FormatTextItalic: FormatTextItalic,
  FormatTextPlaintext: FormatTextPlaintext,
  FormatTextRich: FormatTextRich,
  FormatTextStrikethrough: FormatTextStrikethrough,
  FormatTextUnderline: FormatTextUnderline,
  GnomePowerManager: GnomePowerManager,
  GoBottom: GoBottom,
  GoDown: GoDown,
  GoFirst: GoFirst,
  GoHome: GoHome,
  GoJump: GoJump,
  GoJumpRtl: GoJumpRtl,
  GoLast: GoLast,
  GoNext: GoNext,
  GoPrevious: GoPrevious,
  GoTop: GoTop,
  GoUp: GoUp,
  GoaPanel: GoaPanel,
  HelpAbout: HelpAbout,
  HelpBrowser: HelpBrowser,
  HelpContents: HelpContents,
  HelpFaq: HelpFaq,
  ImageLoading: ImageLoading,
  ImageMissing: ImageMissing,
  ImageXGeneric: ImageXGeneric,
  InodeDirectory: InodeDirectory,
  InputDialpad: InputDialpad,
  InputGaming: InputGaming,
  InputKeyboard: InputKeyboard,
  InputMouse: InputMouse,
  InputTablet: InputTablet,
  InputTouchpad: InputTouchpad,
  InsertImage: InsertImage,
  InsertLink: InsertLink,
  InsertObject: InsertObject,
  InsertText: InsertText,
  KeyboardBrightness: KeyboardBrightness,
  ListAdd: ListAdd,
  ListDragHandle: ListDragHandle,
  ListRemove: ListRemove,
  ListRemoveAll: ListRemoveAll,
  LocationServicesActive: LocationServicesActive,
  LocationServicesDisabled: LocationServicesDisabled,
  MailAttachment: MailAttachment,
  MailForward: MailForward,
  MailMarkImportant: MailMarkImportant,
  MailMarkJunk: MailMarkJunk,
  MailMarkNotjunk: MailMarkNotjunk,
  MailMessageNew: MailMessageNew,
  MailRead: MailRead,
  MailReplied: MailReplied,
  MailRepliedRtl: MailRepliedRtl,
  MailReplyAll: MailReplyAll,
  MailReplyAllRtl: MailReplyAllRtl,
  MailReplySender: MailReplySender,
  MailSend: MailSend,
  MailSendReceive: MailSendReceive,
  MailUnread: MailUnread,
  MarkLocation: MarkLocation,
  MediaEject: MediaEject,
  MediaFlash: MediaFlash,
  MediaFloppy: MediaFloppy,
  MediaOptical: MediaOptical,
  MediaOpticalBd: MediaOpticalBd,
  MediaOpticalCd: MediaOpticalCd,
  MediaOpticalCdAudio: MediaOpticalCdAudio,
  MediaOpticalDvd: MediaOpticalDvd,
  MediaPlaybackPause: MediaPlaybackPause,
  MediaPlaybackStart: MediaPlaybackStart,
  MediaPlaybackStop: MediaPlaybackStop,
  MediaPlaylistConsecutive: MediaPlaylistConsecutive,
  MediaPlaylistRepeat: MediaPlaylistRepeat,
  MediaPlaylistRepeatSong: MediaPlaylistRepeatSong,
  MediaPlaylistShuffle: MediaPlaylistShuffle,
  MediaRecord: MediaRecord,
  MediaRemovable: MediaRemovable,
  MediaSeekBackward: MediaSeekBackward,
  MediaSeekForward: MediaSeekForward,
  MediaSkipBackward: MediaSkipBackward,
  MediaSkipForward: MediaSkipForward,
  MediaTape: MediaTape,
  MediaViewSubtitles: MediaViewSubtitles,
  MediaZip: MediaZip,
  MicrophoneDisabled: MicrophoneDisabled,
  MicrophoneHardwareDisabled: MicrophoneHardwareDisabled,
  MicrophoneSensitivityHigh: MicrophoneSensitivityHigh,
  MicrophoneSensitivityLow: MicrophoneSensitivityLow,
  MicrophoneSensitivityMedium: MicrophoneSensitivityMedium,
  MicrophoneSensitivityMuted: MicrophoneSensitivityMuted,
  Modem: Modem,
  MultimediaPlayer: MultimediaPlayer,
  MultimediaPlayerAppleIpodTouch: MultimediaPlayerAppleIpodTouch,
  MultimediaVolumeControl: MultimediaVolumeControl,
  NetworkCellular: NetworkCellular,
  NetworkCellular2g: NetworkCellular2g,
  NetworkCellular3g: NetworkCellular3g,
  NetworkCellular4g: NetworkCellular4g,
  NetworkCellular5g: NetworkCellular5g,
  NetworkCellularAcquiring: NetworkCellularAcquiring,
  NetworkCellularAcquiringRtl: NetworkCellularAcquiringRtl,
  NetworkCellularConnected: NetworkCellularConnected,
  NetworkCellularDisabled: NetworkCellularDisabled,
  NetworkCellularDisabledRtl: NetworkCellularDisabledRtl,
  NetworkCellularEdge: NetworkCellularEdge,
  NetworkCellularGprs: NetworkCellularGprs,
  NetworkCellularHardwareDisabled: NetworkCellularHardwareDisabled,
  NetworkCellularHardwareDisabledRtl: NetworkCellularHardwareDisabledRtl,
  NetworkCellularHspa: NetworkCellularHspa,
  NetworkCellularNoRoute: NetworkCellularNoRoute,
  NetworkCellularNoRouteRtl: NetworkCellularNoRouteRtl,
  NetworkCellularOffline: NetworkCellularOffline,
  NetworkCellularOfflineRtl: NetworkCellularOfflineRtl,
  NetworkCellularSignalExcellent: NetworkCellularSignalExcellent,
  NetworkCellularSignalExcellentRtl: NetworkCellularSignalExcellentRtl,
  NetworkCellularSignalGood: NetworkCellularSignalGood,
  NetworkCellularSignalGoodRtl: NetworkCellularSignalGoodRtl,
  NetworkCellularSignalNone: NetworkCellularSignalNone,
  NetworkCellularSignalNoneRtl: NetworkCellularSignalNoneRtl,
  NetworkCellularSignalOk: NetworkCellularSignalOk,
  NetworkCellularSignalOkRtl: NetworkCellularSignalOkRtl,
  NetworkCellularSignalWeak: NetworkCellularSignalWeak,
  NetworkCellularSignalWeakRtl: NetworkCellularSignalWeakRtl,
  NetworkError: NetworkError,
  NetworkIdle: NetworkIdle,
  NetworkNoRoute: NetworkNoRoute,
  NetworkOffline: NetworkOffline,
  NetworkReceive: NetworkReceive,
  NetworkServer: NetworkServer,
  NetworkTransmit: NetworkTransmit,
  NetworkTransmitReceive: NetworkTransmitReceive,
  NetworkVpn: NetworkVpn,
  NetworkVpnAcquiring: NetworkVpnAcquiring,
  NetworkVpnDisabled: NetworkVpnDisabled,
  NetworkVpnDisconnected: NetworkVpnDisconnected,
  NetworkVpnNoRoute: NetworkVpnNoRoute,
  NetworkWired: NetworkWired,
  NetworkWiredAcquiring: NetworkWiredAcquiring,
  NetworkWiredDisconnected: NetworkWiredDisconnected,
  NetworkWiredNoRoute: NetworkWiredNoRoute,
  NetworkWireless: NetworkWireless,
  NetworkWirelessAcquiring: NetworkWirelessAcquiring,
  NetworkWirelessConnected: NetworkWirelessConnected,
  NetworkWirelessDisabled: NetworkWirelessDisabled,
  NetworkWirelessEncrypted: NetworkWirelessEncrypted,
  NetworkWirelessHardwareDisabled: NetworkWirelessHardwareDisabled,
  NetworkWirelessHotspot: NetworkWirelessHotspot,
  NetworkWirelessNoRoute: NetworkWirelessNoRoute,
  NetworkWirelessOffline: NetworkWirelessOffline,
  NetworkWirelessSignalExcellent: NetworkWirelessSignalExcellent,
  NetworkWirelessSignalGood: NetworkWirelessSignalGood,
  NetworkWirelessSignalNone: NetworkWirelessSignalNone,
  NetworkWirelessSignalOk: NetworkWirelessSignalOk,
  NetworkWirelessSignalWeak: NetworkWirelessSignalWeak,
  NetworkWorkgroup: NetworkWorkgroup,
  NightLight: NightLight,
  NightLightDisabled: NightLightDisabled,
  NonStarred: NonStarred,
  NotificationsDisabled: NotificationsDisabled,
  ObjectFlipHorizontal: ObjectFlipHorizontal,
  ObjectFlipVertical: ObjectFlipVertical,
  ObjectRotateLeft: ObjectRotateLeft,
  ObjectRotateRight: ObjectRotateRight,
  ObjectSelect: ObjectSelect,
  OpenMenu: OpenMenu,
  OrientationLandscape: OrientationLandscape,
  OrientationLandscapeInverse: OrientationLandscapeInverse,
  OrientationPortraitLeft: OrientationPortraitLeft,
  OrientationPortraitRight: OrientationPortraitRight,
  PackageXGeneric: PackageXGeneric,
  PanDown: PanDown,
  PanEnd: PanEnd,
  PanStart: PanStart,
  PanUp: PanUp,
  Pda: Pda,
  Phone: Phone,
  PhoneAppleIphone: PhoneAppleIphone,
  PhoneOld: PhoneOld,
  PowerProfileBalanced: PowerProfileBalanced,
  PowerProfilePerformance: PowerProfilePerformance,
  PowerProfilePowerSaver: PowerProfilePowerSaver,
  PreferencesColor: PreferencesColor,
  PreferencesDesktopAccessibility: PreferencesDesktopAccessibility,
  PreferencesDesktopApps: PreferencesDesktopApps,
  PreferencesDesktopDisplay: PreferencesDesktopDisplay,
  PreferencesDesktopFont: PreferencesDesktopFont,
  PreferencesDesktopKeyboard: PreferencesDesktopKeyboard,
  PreferencesDesktopKeyboardShortcuts: PreferencesDesktopKeyboardShortcuts,
  PreferencesDesktopLocale: PreferencesDesktopLocale,
  PreferencesDesktopMultitasking: PreferencesDesktopMultitasking,
  PreferencesDesktopRemoteDesktop: PreferencesDesktopRemoteDesktop,
  PreferencesDesktopScreensaver: PreferencesDesktopScreensaver,
  PreferencesDesktopWallpaper: PreferencesDesktopWallpaper,
  PreferencesOther: PreferencesOther,
  PreferencesSystem: PreferencesSystem,
  PreferencesSystemDetails: PreferencesSystemDetails,
  PreferencesSystemDevices: PreferencesSystemDevices,
  PreferencesSystemNetwork: PreferencesSystemNetwork,
  PreferencesSystemNetworkProxy: PreferencesSystemNetworkProxy,
  PreferencesSystemNotifications: PreferencesSystemNotifications,
  PreferencesSystemParentalControls: PreferencesSystemParentalControls,
  PreferencesSystemPrivacy: PreferencesSystemPrivacy,
  PreferencesSystemSearch: PreferencesSystemSearch,
  PreferencesSystemSharing: PreferencesSystemSharing,
  PreferencesSystemTime: PreferencesSystemTime,
  Printer: Printer,
  PrinterError: PrinterError,
  PrinterNetwork: PrinterNetwork,
  PrinterPrinting: PrinterPrinting,
  PrinterWarning: PrinterWarning,
  ProcessStop: ProcessStop,
  Radio: Radio,
  RadioChecked: RadioChecked,
  RadioMixed: RadioMixed,
  RotationAllowed: RotationAllowed,
  RotationLocked: RotationLocked,
  Scanner: Scanner,
  ScreenShared: ScreenShared,
  SecurityHigh: SecurityHigh,
  SecurityLow: SecurityLow,
  SecurityMedium: SecurityMedium,
  SecurityMediumRtl: SecurityMediumRtl,
  SelectionEnd: SelectionEnd,
  SelectionMode: SelectionMode,
  SelectionStart: SelectionStart,
  SemiStarred: SemiStarred,
  SemiStarredRtl: SemiStarredRtl,
  SendTo: SendTo,
  SidebarShow: SidebarShow,
  SidebarShowRight: SidebarShowRight,
  SoftwareUpdateAvailable: SoftwareUpdateAvailable,
  SoftwareUpdateUrgent: SoftwareUpdateUrgent,
  StarNew: StarNew,
  Starred: Starred,
  StartHere: StartHere,
  SystemFileManager: SystemFileManager,
  SystemHelp: SystemHelp,
  SystemLockScreen: SystemLockScreen,
  SystemLogOut: SystemLogOut,
  SystemLogOutRtl: SystemLogOutRtl,
  SystemReboot: SystemReboot,
  SystemRun: SystemRun,
  SystemSearch: SystemSearch,
  SystemShutdown: SystemShutdown,
  SystemSoftwareInstall: SystemSoftwareInstall,
  SystemSwitchUser: SystemSwitchUser,
  SystemSwitchUserRtl: SystemSwitchUserRtl,
  SystemUsers: SystemUsers,
  TabNew: TabNew,
  Tablet: Tablet,
  TaskDue: TaskDue,
  TaskPastDue: TaskPastDue,
  TextEditor: TextEditor,
  TextXGeneric: TextXGeneric,
  Thunderbolt: Thunderbolt,
  ThunderboltAcquiring: ThunderboltAcquiring,
  ToolsCheckSpelling: ToolsCheckSpelling,
  TouchDisabled: TouchDisabled,
  TouchpadDisabled: TouchpadDisabled,
  Tv: Tv,
  UninterruptiblePowerSupply: UninterruptiblePowerSupply,
  UserAvailable: UserAvailable,
  UserAway: UserAway,
  UserBookmarks: UserBookmarks,
  UserBusy: UserBusy,
  UserDesktop: UserDesktop,
  UserHome: UserHome,
  UserIdle: UserIdle,
  UserInfo: UserInfo,
  UserInvisible: UserInvisible,
  UserNotTracked: UserNotTracked,
  UserOffline: UserOffline,
  UserStatusPending: UserStatusPending,
  UserTrash: UserTrash,
  UserTrashFull: UserTrashFull,
  UtilitiesTerminal: UtilitiesTerminal,
  ValueDecrease: ValueDecrease,
  ValueIncrease: ValueIncrease,
  VideoDisplay: VideoDisplay,
  VideoJoinedDisplays: VideoJoinedDisplays,
  VideoSingleDisplay: VideoSingleDisplay,
  VideoXGeneric: VideoXGeneric,
  ViewAppGrid: ViewAppGrid,
  ViewConceal: ViewConceal,
  ViewContinuous: ViewContinuous,
  ViewDual: ViewDual,
  ViewFullscreen: ViewFullscreen,
  ViewGrid: ViewGrid,
  ViewList: ViewList,
  ViewListBullet: ViewListBullet,
  ViewListBulletRtl: ViewListBulletRtl,
  ViewListOrdered: ViewListOrdered,
  ViewListOrderedRtl: ViewListOrderedRtl,
  ViewListRtl: ViewListRtl,
  ViewMirror: ViewMirror,
  ViewMore: ViewMore,
  ViewMoreHorizontal: ViewMoreHorizontal,
  ViewPaged: ViewPaged,
  ViewPagedRtl: ViewPagedRtl,
  ViewPin: ViewPin,
  ViewRefresh: ViewRefresh,
  ViewRestore: ViewRestore,
  ViewReveal: ViewReveal,
  ViewSortAscending: ViewSortAscending,
  ViewSortAscendingRtl: ViewSortAscendingRtl,
  ViewSortDescending: ViewSortDescending,
  ViewSortDescendingRtl: ViewSortDescendingRtl,
  ViewWrapped: ViewWrapped,
  ViewWrappedRtl: ViewWrappedRtl,
  WeatherClear: WeatherClear,
  WeatherClearNight: WeatherClearNight,
  WeatherFewClouds: WeatherFewClouds,
  WeatherFewCloudsNight: WeatherFewCloudsNight,
  WeatherFog: WeatherFog,
  WeatherOvercast: WeatherOvercast,
  WeatherSevereAlert: WeatherSevereAlert,
  WeatherShowers: WeatherShowers,
  WeatherShowersScattered: WeatherShowersScattered,
  WeatherSnow: WeatherSnow,
  WeatherStorm: WeatherStorm,
  WeatherTornado: WeatherTornado,
  WeatherWindy: WeatherWindy,
  WebBrowser: WebBrowser,
  WindowClose: WindowClose,
  WindowMaximize: WindowMaximize,
  WindowMinimize: WindowMinimize,
  WindowNew: WindowNew,
  WindowRestore: WindowRestore,
  XOfficeAddressBook: XOfficeAddressBook,
  XOfficeCalendar: XOfficeCalendar,
  XOfficeDocument: XOfficeDocument,
  XOfficeDrawing: XOfficeDrawing,
  XOfficePresentation: XOfficePresentation,
  XOfficeSpreadsheet: XOfficeSpreadsheet,
  ZoomFitBest: ZoomFitBest,
  ZoomIn: ZoomIn,
  ZoomOriginal: ZoomOriginal,
  ZoomOut: ZoomOut
});

exports.AcAdapter = AcAdapter;
exports.AcAdapterIcon = AcAdapter;
exports.AcAdapterSymbolic = AcAdapter;
exports.AccessoriesCalculator = AccessoriesCalculator;
exports.AccessoriesCalculatorIcon = AccessoriesCalculator;
exports.AccessoriesCalculatorSymbolic = AccessoriesCalculator;
exports.AccessoriesCharacterMap = AccessoriesCharacterMap;
exports.AccessoriesCharacterMapIcon = AccessoriesCharacterMap;
exports.AccessoriesCharacterMapSymbolic = AccessoriesCharacterMap;
exports.AccessoriesDictionary = AccessoriesDictionary;
exports.AccessoriesDictionaryIcon = AccessoriesDictionary;
exports.AccessoriesDictionarySymbolic = AccessoriesDictionary;
exports.AccessoriesTextEditor = AccessoriesTextEditor;
exports.AccessoriesTextEditorIcon = AccessoriesTextEditor;
exports.AccessoriesTextEditorSymbolic = AccessoriesTextEditor;
exports.ActionUnavailable = ActionUnavailable;
exports.ActionUnavailableIcon = ActionUnavailable;
exports.ActionUnavailableSymbolic = ActionUnavailable;
exports.AddressBookNew = AddressBookNew;
exports.AddressBookNewIcon = AddressBookNew;
exports.AddressBookNewSymbolic = AddressBookNew;
exports.AdwAdaptivePreview = AdwAdaptivePreview;
exports.AdwAdaptivePreviewIcon = AdwAdaptivePreview;
exports.AdwAdaptivePreviewSymbolic = AdwAdaptivePreview;
exports.AdwApplicationExit = AdwApplicationExit;
exports.AdwApplicationExitIcon = AdwApplicationExit;
exports.AdwApplicationExitRtl = AdwApplicationExitRtl;
exports.AdwApplicationExitRtlIcon = AdwApplicationExitRtl;
exports.AdwApplicationExitSymbolic = AdwApplicationExit;
exports.AdwApplicationExitSymbolicRtl = AdwApplicationExitRtl;
exports.AdwAvatarDefault = AdwAvatarDefault;
exports.AdwAvatarDefaultIcon = AdwAvatarDefault;
exports.AdwAvatarDefaultSymbolic = AdwAvatarDefault;
exports.AdwEntryApply = AdwEntryApply;
exports.AdwEntryApplyIcon = AdwEntryApply;
exports.AdwEntryApplySymbolic = AdwEntryApply;
exports.AdwEntryEdit = AdwEntryEdit;
exports.AdwEntryEditIcon = AdwEntryEdit;
exports.AdwEntryEditSymbolic = AdwEntryEdit;
exports.AdwExpanderArrow = AdwExpanderArrow;
exports.AdwExpanderArrowIcon = AdwExpanderArrow;
exports.AdwExpanderArrowSymbolic = AdwExpanderArrow;
exports.AdwExternalLink = AdwExternalLink;
exports.AdwExternalLinkIcon = AdwExternalLink;
exports.AdwExternalLinkSymbolic = AdwExternalLink;
exports.AdwMailSend = AdwMailSend;
exports.AdwMailSendIcon = AdwMailSend;
exports.AdwMailSendSymbolic = AdwMailSend;
exports.AdwRotateAcw = AdwRotateAcw;
exports.AdwRotateAcwIcon = AdwRotateAcw;
exports.AdwRotateAcwSymbolic = AdwRotateAcw;
exports.AdwRotateCw = AdwRotateCw;
exports.AdwRotateCwIcon = AdwRotateCw;
exports.AdwRotateCwSymbolic = AdwRotateCw;
exports.AdwScreenshot = AdwScreenshot;
exports.AdwScreenshotIcon = AdwScreenshot;
exports.AdwScreenshotSymbolic = AdwScreenshot;
exports.AdwSidebar = AdwSidebar;
exports.AdwSidebarIcon = AdwSidebar;
exports.AdwSidebarRtl = AdwSidebarRtl;
exports.AdwSidebarRtlIcon = AdwSidebarRtl;
exports.AdwSidebarSymbolic = AdwSidebar;
exports.AdwSidebarSymbolicRtl = AdwSidebarRtl;
exports.AdwTabCounter = AdwTabCounter;
exports.AdwTabCounterIcon = AdwTabCounter;
exports.AdwTabCounterSymbolic = AdwTabCounter;
exports.AdwTabIconMissing = AdwTabIconMissing;
exports.AdwTabIconMissingIcon = AdwTabIconMissing;
exports.AdwTabIconMissingSymbolic = AdwTabIconMissing;
exports.AdwTabNew = AdwTabNew;
exports.AdwTabNewIcon = AdwTabNew;
exports.AdwTabNewSymbolic = AdwTabNew;
exports.AdwTabOverflow = AdwTabOverflow;
exports.AdwTabOverflowIcon = AdwTabOverflow;
exports.AdwTabOverflowSymbolic = AdwTabOverflow;
exports.AdwTabUnpin = AdwTabUnpin;
exports.AdwTabUnpinIcon = AdwTabUnpin;
exports.AdwTabUnpinSymbolic = AdwTabUnpin;
exports.AdwaitaAcAdapter = AcAdapter;
exports.AdwaitaAccessoriesCalculator = AccessoriesCalculator;
exports.AdwaitaAccessoriesCharacterMap = AccessoriesCharacterMap;
exports.AdwaitaAccessoriesDictionary = AccessoriesDictionary;
exports.AdwaitaAccessoriesTextEditor = AccessoriesTextEditor;
exports.AdwaitaActionUnavailable = ActionUnavailable;
exports.AdwaitaAddressBookNew = AddressBookNew;
exports.AdwaitaAdwAdaptivePreview = AdwAdaptivePreview;
exports.AdwaitaAdwApplicationExit = AdwApplicationExit;
exports.AdwaitaAdwApplicationExitRtl = AdwApplicationExitRtl;
exports.AdwaitaAdwAvatarDefault = AdwAvatarDefault;
exports.AdwaitaAdwEntryApply = AdwEntryApply;
exports.AdwaitaAdwEntryEdit = AdwEntryEdit;
exports.AdwaitaAdwExpanderArrow = AdwExpanderArrow;
exports.AdwaitaAdwExternalLink = AdwExternalLink;
exports.AdwaitaAdwMailSend = AdwMailSend;
exports.AdwaitaAdwRotateAcw = AdwRotateAcw;
exports.AdwaitaAdwRotateCw = AdwRotateCw;
exports.AdwaitaAdwScreenshot = AdwScreenshot;
exports.AdwaitaAdwSidebar = AdwSidebar;
exports.AdwaitaAdwSidebarRtl = AdwSidebarRtl;
exports.AdwaitaAdwTabCounter = AdwTabCounter;
exports.AdwaitaAdwTabIconMissing = AdwTabIconMissing;
exports.AdwaitaAdwTabNew = AdwTabNew;
exports.AdwaitaAdwTabOverflow = AdwTabOverflow;
exports.AdwaitaAdwTabUnpin = AdwTabUnpin;
exports.AdwaitaAirplaneMode = AirplaneMode;
exports.AdwaitaAirplaneModeDisabled = AirplaneModeDisabled;
exports.AdwaitaAlarm = Alarm;
exports.AdwaitaAppletsScreenshooter = AppletsScreenshooter;
exports.AdwaitaApplicationCertificate = ApplicationCertificate;
exports.AdwaitaApplicationExit = ApplicationExit;
exports.AdwaitaApplicationExitRtl = ApplicationExitRtl;
exports.AdwaitaApplicationRssXml = ApplicationRssXml;
exports.AdwaitaApplicationXAddon = ApplicationXAddon;
exports.AdwaitaApplicationXAppliance = ApplicationXAppliance;
exports.AdwaitaApplicationXExecutable = ApplicationXExecutable;
exports.AdwaitaApplicationXFirmware = ApplicationXFirmware;
exports.AdwaitaApplicationXSharedlib = ApplicationXSharedlib;
exports.AdwaitaApplicationsEngineering = ApplicationsEngineering;
exports.AdwaitaApplicationsGames = ApplicationsGames;
exports.AdwaitaApplicationsGraphics = ApplicationsGraphics;
exports.AdwaitaApplicationsMultimedia = ApplicationsMultimedia;
exports.AdwaitaApplicationsScience = ApplicationsScience;
exports.AdwaitaApplicationsSystem = ApplicationsSystem;
exports.AdwaitaApplicationsUtilities = ApplicationsUtilities;
exports.AdwaitaAppointmentMissed = AppointmentMissed;
exports.AdwaitaAppointmentNew = AppointmentNew;
exports.AdwaitaAppointmentSoon = AppointmentSoon;
exports.AdwaitaAudioCard = AudioCard;
exports.AdwaitaAudioHeadphones = AudioHeadphones;
exports.AdwaitaAudioHeadset = AudioHeadset;
exports.AdwaitaAudioInputMicrophone = AudioInputMicrophone;
exports.AdwaitaAudioSpeakers = AudioSpeakers;
exports.AdwaitaAudioSpeakersRtl = AudioSpeakersRtl;
exports.AdwaitaAudioVolumeHigh = AudioVolumeHigh;
exports.AdwaitaAudioVolumeHighRtl = AudioVolumeHighRtl;
exports.AdwaitaAudioVolumeLow = AudioVolumeLow;
exports.AdwaitaAudioVolumeLowRtl = AudioVolumeLowRtl;
exports.AdwaitaAudioVolumeMedium = AudioVolumeMedium;
exports.AdwaitaAudioVolumeMediumRtl = AudioVolumeMediumRtl;
exports.AdwaitaAudioVolumeMuted = AudioVolumeMuted;
exports.AdwaitaAudioVolumeMutedRtl = AudioVolumeMutedRtl;
exports.AdwaitaAudioVolumeOveramplified = AudioVolumeOveramplified;
exports.AdwaitaAudioVolumeOveramplifiedRtl = AudioVolumeOveramplifiedRtl;
exports.AdwaitaAudioXGeneric = AudioXGeneric;
exports.AdwaitaAuthFace = AuthFace;
exports.AdwaitaAuthFingerprint = AuthFingerprint;
exports.AdwaitaAuthSim = AuthSim;
exports.AdwaitaAuthSimLocked = AuthSimLocked;
exports.AdwaitaAuthSimMissing = AuthSimMissing;
exports.AdwaitaAuthSmartcard = AuthSmartcard;
exports.AdwaitaAvatarDefault = AvatarDefault;
exports.AdwaitaBattery = Battery;
exports.AdwaitaBatteryAction = BatteryAction;
exports.AdwaitaBatteryCaution = BatteryCaution;
exports.AdwaitaBatteryCautionCharging = BatteryCautionCharging;
exports.AdwaitaBatteryEmpty = BatteryEmpty;
exports.AdwaitaBatteryEmptyCharging = BatteryEmptyCharging;
exports.AdwaitaBatteryFull = BatteryFull;
exports.AdwaitaBatteryFullCharged = BatteryFullCharged;
exports.AdwaitaBatteryFullCharging = BatteryFullCharging;
exports.AdwaitaBatteryGood = BatteryGood;
exports.AdwaitaBatteryGoodCharging = BatteryGoodCharging;
exports.AdwaitaBatteryLevel0 = BatteryLevel0;
exports.AdwaitaBatteryLevel0Charging = BatteryLevel0Charging;
exports.AdwaitaBatteryLevel0PluggedIn = BatteryLevel0PluggedIn;
exports.AdwaitaBatteryLevel10 = BatteryLevel10;
exports.AdwaitaBatteryLevel100 = BatteryLevel100;
exports.AdwaitaBatteryLevel100Charged = BatteryLevel100Charged;
exports.AdwaitaBatteryLevel100PluggedIn = BatteryLevel100PluggedIn;
exports.AdwaitaBatteryLevel10Charging = BatteryLevel10Charging;
exports.AdwaitaBatteryLevel10PluggedIn = BatteryLevel10PluggedIn;
exports.AdwaitaBatteryLevel20 = BatteryLevel20;
exports.AdwaitaBatteryLevel20Charging = BatteryLevel20Charging;
exports.AdwaitaBatteryLevel20PluggedIn = BatteryLevel20PluggedIn;
exports.AdwaitaBatteryLevel30 = BatteryLevel30;
exports.AdwaitaBatteryLevel30Charging = BatteryLevel30Charging;
exports.AdwaitaBatteryLevel30PluggedIn = BatteryLevel30PluggedIn;
exports.AdwaitaBatteryLevel40 = BatteryLevel40;
exports.AdwaitaBatteryLevel40Charging = BatteryLevel40Charging;
exports.AdwaitaBatteryLevel40PluggedIn = BatteryLevel40PluggedIn;
exports.AdwaitaBatteryLevel50 = BatteryLevel50;
exports.AdwaitaBatteryLevel50Charging = BatteryLevel50Charging;
exports.AdwaitaBatteryLevel50PluggedIn = BatteryLevel50PluggedIn;
exports.AdwaitaBatteryLevel60 = BatteryLevel60;
exports.AdwaitaBatteryLevel60Charging = BatteryLevel60Charging;
exports.AdwaitaBatteryLevel60PluggedIn = BatteryLevel60PluggedIn;
exports.AdwaitaBatteryLevel70 = BatteryLevel70;
exports.AdwaitaBatteryLevel70Charging = BatteryLevel70Charging;
exports.AdwaitaBatteryLevel70PluggedIn = BatteryLevel70PluggedIn;
exports.AdwaitaBatteryLevel80 = BatteryLevel80;
exports.AdwaitaBatteryLevel80Charging = BatteryLevel80Charging;
exports.AdwaitaBatteryLevel80PluggedIn = BatteryLevel80PluggedIn;
exports.AdwaitaBatteryLevel90 = BatteryLevel90;
exports.AdwaitaBatteryLevel90Charging = BatteryLevel90Charging;
exports.AdwaitaBatteryLevel90PluggedIn = BatteryLevel90PluggedIn;
exports.AdwaitaBatteryLow = BatteryLow;
exports.AdwaitaBatteryLowCharging = BatteryLowCharging;
exports.AdwaitaBatteryMissing = BatteryMissing;
exports.AdwaitaBluetooth = Bluetooth;
exports.AdwaitaBluetoothAcquiring = BluetoothAcquiring;
exports.AdwaitaBluetoothActive = BluetoothActive;
exports.AdwaitaBluetoothDisabled = BluetoothDisabled;
exports.AdwaitaBluetoothDisconnected = BluetoothDisconnected;
exports.AdwaitaBluetoothHardwareDisabled = BluetoothHardwareDisabled;
exports.AdwaitaBookmarkNew = BookmarkNew;
exports.AdwaitaBullet = Bullet;
exports.AdwaitaCallIncoming = CallIncoming;
exports.AdwaitaCallMissed = CallMissed;
exports.AdwaitaCallOutgoing = CallOutgoing;
exports.AdwaitaCallStart = CallStart;
exports.AdwaitaCallStop = CallStop;
exports.AdwaitaCameraDisabled = CameraDisabled;
exports.AdwaitaCameraHardwareDisabled = CameraHardwareDisabled;
exports.AdwaitaCameraPhoto = CameraPhoto;
exports.AdwaitaCameraSwitch = CameraSwitch;
exports.AdwaitaCameraVideo = CameraVideo;
exports.AdwaitaCameraWeb = CameraWeb;
exports.AdwaitaChangesAllow = ChangesAllow;
exports.AdwaitaChangesPrevent = ChangesPrevent;
exports.AdwaitaChannelInsecure = ChannelInsecure;
exports.AdwaitaChannelSecure = ChannelSecure;
exports.AdwaitaChatMessageNew = ChatMessageNew;
exports.AdwaitaCheck = Check;
exports.AdwaitaCheckbox = Checkbox;
exports.AdwaitaCheckboxChecked = CheckboxChecked;
exports.AdwaitaCheckboxMixed = CheckboxMixed;
exports.AdwaitaColorSelect = ColorSelect;
exports.AdwaitaColorimeterColorhug = ColorimeterColorhug;
exports.AdwaitaComputer = Computer;
exports.AdwaitaComputerAppleIpad = ComputerAppleIpad;
exports.AdwaitaComputerFail = ComputerFail;
exports.AdwaitaContactNew = ContactNew;
exports.AdwaitaContentLoading = ContentLoading;
exports.AdwaitaDash = Dash;
exports.AdwaitaDaytimeSunrise = DaytimeSunrise;
exports.AdwaitaDaytimeSunset = DaytimeSunset;
exports.AdwaitaDialogError = DialogError;
exports.AdwaitaDialogInformation = DialogInformation;
exports.AdwaitaDialogPassword = DialogPassword;
exports.AdwaitaDialogQuestion = DialogQuestion;
exports.AdwaitaDialogWarning = DialogWarning;
exports.AdwaitaDisplayBrightness = DisplayBrightness;
exports.AdwaitaDisplayProjector = DisplayProjector;
exports.AdwaitaDocumentEdit = DocumentEdit;
exports.AdwaitaDocumentNew = DocumentNew;
exports.AdwaitaDocumentOpen = DocumentOpen;
exports.AdwaitaDocumentOpenRecent = DocumentOpenRecent;
exports.AdwaitaDocumentPageSetup = DocumentPageSetup;
exports.AdwaitaDocumentPrint = DocumentPrint;
exports.AdwaitaDocumentPrintPreview = DocumentPrintPreview;
exports.AdwaitaDocumentProperties = DocumentProperties;
exports.AdwaitaDocumentRevert = DocumentRevert;
exports.AdwaitaDocumentRevertRtl = DocumentRevertRtl;
exports.AdwaitaDocumentSave = DocumentSave;
exports.AdwaitaDocumentSaveAs = DocumentSaveAs;
exports.AdwaitaDocumentSend = DocumentSend;
exports.AdwaitaDriveHarddisk = DriveHarddisk;
exports.AdwaitaDriveHarddiskIeee1394 = DriveHarddiskIeee1394;
exports.AdwaitaDriveHarddiskSolidstate = DriveHarddiskSolidstate;
exports.AdwaitaDriveHarddiskSystem = DriveHarddiskSystem;
exports.AdwaitaDriveHarddiskUsb = DriveHarddiskUsb;
exports.AdwaitaDriveMultidisk = DriveMultidisk;
exports.AdwaitaDriveOptical = DriveOptical;
exports.AdwaitaDriveRemovableMedia = DriveRemovableMedia;
exports.AdwaitaEditClear = EditClear;
exports.AdwaitaEditClearAll = EditClearAll;
exports.AdwaitaEditClearRtl = EditClearRtl;
exports.AdwaitaEditCopy = EditCopy;
exports.AdwaitaEditCut = EditCut;
exports.AdwaitaEditDelete = EditDelete;
exports.AdwaitaEditFind = EditFind;
exports.AdwaitaEditFindReplace = EditFindReplace;
exports.AdwaitaEditPaste = EditPaste;
exports.AdwaitaEditRedo = EditRedo;
exports.AdwaitaEditSelect = EditSelect;
exports.AdwaitaEditSelectAll = EditSelectAll;
exports.AdwaitaEditUndo = EditUndo;
exports.AdwaitaEmblemImportant = EmblemImportant;
exports.AdwaitaEmblemSystem = EmblemSystem;
exports.AdwaitaEmojiActivities = EmojiActivities;
exports.AdwaitaEmojiBody = EmojiBody;
exports.AdwaitaEmojiFlags = EmojiFlags;
exports.AdwaitaEmojiFood = EmojiFood;
exports.AdwaitaEmojiNature = EmojiNature;
exports.AdwaitaEmojiObjects = EmojiObjects;
exports.AdwaitaEmojiPeople = EmojiPeople;
exports.AdwaitaEmojiRecent = EmojiRecent;
exports.AdwaitaEmojiSymbols = EmojiSymbols;
exports.AdwaitaEmojiTravel = EmojiTravel;
exports.AdwaitaEmoteLove = EmoteLove;
exports.AdwaitaErrorCorrect = ErrorCorrect;
exports.AdwaitaFaceAngel = FaceAngel;
exports.AdwaitaFaceAngry = FaceAngry;
exports.AdwaitaFaceConfused = FaceConfused;
exports.AdwaitaFaceCool = FaceCool;
exports.AdwaitaFaceCrying = FaceCrying;
exports.AdwaitaFaceDevilish = FaceDevilish;
exports.AdwaitaFaceEmbarrassed = FaceEmbarrassed;
exports.AdwaitaFaceGlasses = FaceGlasses;
exports.AdwaitaFaceKiss = FaceKiss;
exports.AdwaitaFaceLaugh = FaceLaugh;
exports.AdwaitaFaceMonkey = FaceMonkey;
exports.AdwaitaFacePlain = FacePlain;
exports.AdwaitaFaceRaspberry = FaceRaspberry;
exports.AdwaitaFaceSad = FaceSad;
exports.AdwaitaFaceShutmouth = FaceShutmouth;
exports.AdwaitaFaceSick = FaceSick;
exports.AdwaitaFaceSmile = FaceSmile;
exports.AdwaitaFaceSmileBig = FaceSmileBig;
exports.AdwaitaFaceSmirk = FaceSmirk;
exports.AdwaitaFaceSurprise = FaceSurprise;
exports.AdwaitaFaceTired = FaceTired;
exports.AdwaitaFaceUncertain = FaceUncertain;
exports.AdwaitaFaceWink = FaceWink;
exports.AdwaitaFaceWorried = FaceWorried;
exports.AdwaitaFaceYawn = FaceYawn;
exports.AdwaitaFindLocation = FindLocation;
exports.AdwaitaFocusLegacySystray = FocusLegacySystray;
exports.AdwaitaFocusTopBar = FocusTopBar;
exports.AdwaitaFocusWindows = FocusWindows;
exports.AdwaitaFolder = Folder;
exports.AdwaitaFolderDocuments = FolderDocuments;
exports.AdwaitaFolderDownload = FolderDownload;
exports.AdwaitaFolderDragAccept = FolderDragAccept;
exports.AdwaitaFolderMusic = FolderMusic;
exports.AdwaitaFolderNew = FolderNew;
exports.AdwaitaFolderOpen = FolderOpen;
exports.AdwaitaFolderPictures = FolderPictures;
exports.AdwaitaFolderPublicshare = FolderPublicshare;
exports.AdwaitaFolderRemote = FolderRemote;
exports.AdwaitaFolderSavedSearch = FolderSavedSearch;
exports.AdwaitaFolderTemplates = FolderTemplates;
exports.AdwaitaFolderVideos = FolderVideos;
exports.AdwaitaFolderVisiting = FolderVisiting;
exports.AdwaitaFontSelect = FontSelect;
exports.AdwaitaFontXGeneric = FontXGeneric;
exports.AdwaitaFormatIndentLess = FormatIndentLess;
exports.AdwaitaFormatIndentLessRtl = FormatIndentLessRtl;
exports.AdwaitaFormatIndentMore = FormatIndentMore;
exports.AdwaitaFormatIndentMoreRtl = FormatIndentMoreRtl;
exports.AdwaitaFormatJustifyCenter = FormatJustifyCenter;
exports.AdwaitaFormatJustifyFill = FormatJustifyFill;
exports.AdwaitaFormatJustifyLeft = FormatJustifyLeft;
exports.AdwaitaFormatJustifyRight = FormatJustifyRight;
exports.AdwaitaFormatTextBold = FormatTextBold;
exports.AdwaitaFormatTextDirection = FormatTextDirection;
exports.AdwaitaFormatTextDirectionLtr = FormatTextDirectionLtr;
exports.AdwaitaFormatTextDirectionRtl = FormatTextDirectionRtl;
exports.AdwaitaFormatTextItalic = FormatTextItalic;
exports.AdwaitaFormatTextPlaintext = FormatTextPlaintext;
exports.AdwaitaFormatTextRich = FormatTextRich;
exports.AdwaitaFormatTextStrikethrough = FormatTextStrikethrough;
exports.AdwaitaFormatTextUnderline = FormatTextUnderline;
exports.AdwaitaGnomePowerManager = GnomePowerManager;
exports.AdwaitaGoBottom = GoBottom;
exports.AdwaitaGoDown = GoDown;
exports.AdwaitaGoFirst = GoFirst;
exports.AdwaitaGoHome = GoHome;
exports.AdwaitaGoJump = GoJump;
exports.AdwaitaGoJumpRtl = GoJumpRtl;
exports.AdwaitaGoLast = GoLast;
exports.AdwaitaGoNext = GoNext;
exports.AdwaitaGoPrevious = GoPrevious;
exports.AdwaitaGoTop = GoTop;
exports.AdwaitaGoUp = GoUp;
exports.AdwaitaGoaPanel = GoaPanel;
exports.AdwaitaHelpAbout = HelpAbout;
exports.AdwaitaHelpBrowser = HelpBrowser;
exports.AdwaitaHelpContents = HelpContents;
exports.AdwaitaHelpFaq = HelpFaq;
exports.AdwaitaImageLoading = ImageLoading;
exports.AdwaitaImageMissing = ImageMissing;
exports.AdwaitaImageXGeneric = ImageXGeneric;
exports.AdwaitaInodeDirectory = InodeDirectory;
exports.AdwaitaInputDialpad = InputDialpad;
exports.AdwaitaInputGaming = InputGaming;
exports.AdwaitaInputKeyboard = InputKeyboard;
exports.AdwaitaInputMouse = InputMouse;
exports.AdwaitaInputTablet = InputTablet;
exports.AdwaitaInputTouchpad = InputTouchpad;
exports.AdwaitaInsertImage = InsertImage;
exports.AdwaitaInsertLink = InsertLink;
exports.AdwaitaInsertObject = InsertObject;
exports.AdwaitaInsertText = InsertText;
exports.AdwaitaKeyboardBrightness = KeyboardBrightness;
exports.AdwaitaListAdd = ListAdd;
exports.AdwaitaListDragHandle = ListDragHandle;
exports.AdwaitaListRemove = ListRemove;
exports.AdwaitaListRemoveAll = ListRemoveAll;
exports.AdwaitaLocationServicesActive = LocationServicesActive;
exports.AdwaitaLocationServicesDisabled = LocationServicesDisabled;
exports.AdwaitaMailAttachment = MailAttachment;
exports.AdwaitaMailForward = MailForward;
exports.AdwaitaMailMarkImportant = MailMarkImportant;
exports.AdwaitaMailMarkJunk = MailMarkJunk;
exports.AdwaitaMailMarkNotjunk = MailMarkNotjunk;
exports.AdwaitaMailMessageNew = MailMessageNew;
exports.AdwaitaMailRead = MailRead;
exports.AdwaitaMailReplied = MailReplied;
exports.AdwaitaMailRepliedRtl = MailRepliedRtl;
exports.AdwaitaMailReplyAll = MailReplyAll;
exports.AdwaitaMailReplyAllRtl = MailReplyAllRtl;
exports.AdwaitaMailReplySender = MailReplySender;
exports.AdwaitaMailSend = MailSend;
exports.AdwaitaMailSendReceive = MailSendReceive;
exports.AdwaitaMailUnread = MailUnread;
exports.AdwaitaMarkLocation = MarkLocation;
exports.AdwaitaMediaEject = MediaEject;
exports.AdwaitaMediaFlash = MediaFlash;
exports.AdwaitaMediaFloppy = MediaFloppy;
exports.AdwaitaMediaOptical = MediaOptical;
exports.AdwaitaMediaOpticalBd = MediaOpticalBd;
exports.AdwaitaMediaOpticalCd = MediaOpticalCd;
exports.AdwaitaMediaOpticalCdAudio = MediaOpticalCdAudio;
exports.AdwaitaMediaOpticalDvd = MediaOpticalDvd;
exports.AdwaitaMediaPlaybackPause = MediaPlaybackPause;
exports.AdwaitaMediaPlaybackStart = MediaPlaybackStart;
exports.AdwaitaMediaPlaybackStop = MediaPlaybackStop;
exports.AdwaitaMediaPlaylistConsecutive = MediaPlaylistConsecutive;
exports.AdwaitaMediaPlaylistRepeat = MediaPlaylistRepeat;
exports.AdwaitaMediaPlaylistRepeatSong = MediaPlaylistRepeatSong;
exports.AdwaitaMediaPlaylistShuffle = MediaPlaylistShuffle;
exports.AdwaitaMediaRecord = MediaRecord;
exports.AdwaitaMediaRemovable = MediaRemovable;
exports.AdwaitaMediaSeekBackward = MediaSeekBackward;
exports.AdwaitaMediaSeekForward = MediaSeekForward;
exports.AdwaitaMediaSkipBackward = MediaSkipBackward;
exports.AdwaitaMediaSkipForward = MediaSkipForward;
exports.AdwaitaMediaTape = MediaTape;
exports.AdwaitaMediaViewSubtitles = MediaViewSubtitles;
exports.AdwaitaMediaZip = MediaZip;
exports.AdwaitaMicrophoneDisabled = MicrophoneDisabled;
exports.AdwaitaMicrophoneHardwareDisabled = MicrophoneHardwareDisabled;
exports.AdwaitaMicrophoneSensitivityHigh = MicrophoneSensitivityHigh;
exports.AdwaitaMicrophoneSensitivityLow = MicrophoneSensitivityLow;
exports.AdwaitaMicrophoneSensitivityMedium = MicrophoneSensitivityMedium;
exports.AdwaitaMicrophoneSensitivityMuted = MicrophoneSensitivityMuted;
exports.AdwaitaModem = Modem;
exports.AdwaitaMultimediaPlayer = MultimediaPlayer;
exports.AdwaitaMultimediaPlayerAppleIpodTouch = MultimediaPlayerAppleIpodTouch;
exports.AdwaitaMultimediaVolumeControl = MultimediaVolumeControl;
exports.AdwaitaNetworkCellular = NetworkCellular;
exports.AdwaitaNetworkCellular2g = NetworkCellular2g;
exports.AdwaitaNetworkCellular3g = NetworkCellular3g;
exports.AdwaitaNetworkCellular4g = NetworkCellular4g;
exports.AdwaitaNetworkCellular5g = NetworkCellular5g;
exports.AdwaitaNetworkCellularAcquiring = NetworkCellularAcquiring;
exports.AdwaitaNetworkCellularAcquiringRtl = NetworkCellularAcquiringRtl;
exports.AdwaitaNetworkCellularConnected = NetworkCellularConnected;
exports.AdwaitaNetworkCellularDisabled = NetworkCellularDisabled;
exports.AdwaitaNetworkCellularDisabledRtl = NetworkCellularDisabledRtl;
exports.AdwaitaNetworkCellularEdge = NetworkCellularEdge;
exports.AdwaitaNetworkCellularGprs = NetworkCellularGprs;
exports.AdwaitaNetworkCellularHardwareDisabled = NetworkCellularHardwareDisabled;
exports.AdwaitaNetworkCellularHardwareDisabledRtl = NetworkCellularHardwareDisabledRtl;
exports.AdwaitaNetworkCellularHspa = NetworkCellularHspa;
exports.AdwaitaNetworkCellularNoRoute = NetworkCellularNoRoute;
exports.AdwaitaNetworkCellularNoRouteRtl = NetworkCellularNoRouteRtl;
exports.AdwaitaNetworkCellularOffline = NetworkCellularOffline;
exports.AdwaitaNetworkCellularOfflineRtl = NetworkCellularOfflineRtl;
exports.AdwaitaNetworkCellularSignalExcellent = NetworkCellularSignalExcellent;
exports.AdwaitaNetworkCellularSignalExcellentRtl = NetworkCellularSignalExcellentRtl;
exports.AdwaitaNetworkCellularSignalGood = NetworkCellularSignalGood;
exports.AdwaitaNetworkCellularSignalGoodRtl = NetworkCellularSignalGoodRtl;
exports.AdwaitaNetworkCellularSignalNone = NetworkCellularSignalNone;
exports.AdwaitaNetworkCellularSignalNoneRtl = NetworkCellularSignalNoneRtl;
exports.AdwaitaNetworkCellularSignalOk = NetworkCellularSignalOk;
exports.AdwaitaNetworkCellularSignalOkRtl = NetworkCellularSignalOkRtl;
exports.AdwaitaNetworkCellularSignalWeak = NetworkCellularSignalWeak;
exports.AdwaitaNetworkCellularSignalWeakRtl = NetworkCellularSignalWeakRtl;
exports.AdwaitaNetworkError = NetworkError;
exports.AdwaitaNetworkIdle = NetworkIdle;
exports.AdwaitaNetworkNoRoute = NetworkNoRoute;
exports.AdwaitaNetworkOffline = NetworkOffline;
exports.AdwaitaNetworkReceive = NetworkReceive;
exports.AdwaitaNetworkServer = NetworkServer;
exports.AdwaitaNetworkTransmit = NetworkTransmit;
exports.AdwaitaNetworkTransmitReceive = NetworkTransmitReceive;
exports.AdwaitaNetworkVpn = NetworkVpn;
exports.AdwaitaNetworkVpnAcquiring = NetworkVpnAcquiring;
exports.AdwaitaNetworkVpnDisabled = NetworkVpnDisabled;
exports.AdwaitaNetworkVpnDisconnected = NetworkVpnDisconnected;
exports.AdwaitaNetworkVpnNoRoute = NetworkVpnNoRoute;
exports.AdwaitaNetworkWired = NetworkWired;
exports.AdwaitaNetworkWiredAcquiring = NetworkWiredAcquiring;
exports.AdwaitaNetworkWiredDisconnected = NetworkWiredDisconnected;
exports.AdwaitaNetworkWiredNoRoute = NetworkWiredNoRoute;
exports.AdwaitaNetworkWireless = NetworkWireless;
exports.AdwaitaNetworkWirelessAcquiring = NetworkWirelessAcquiring;
exports.AdwaitaNetworkWirelessConnected = NetworkWirelessConnected;
exports.AdwaitaNetworkWirelessDisabled = NetworkWirelessDisabled;
exports.AdwaitaNetworkWirelessEncrypted = NetworkWirelessEncrypted;
exports.AdwaitaNetworkWirelessHardwareDisabled = NetworkWirelessHardwareDisabled;
exports.AdwaitaNetworkWirelessHotspot = NetworkWirelessHotspot;
exports.AdwaitaNetworkWirelessNoRoute = NetworkWirelessNoRoute;
exports.AdwaitaNetworkWirelessOffline = NetworkWirelessOffline;
exports.AdwaitaNetworkWirelessSignalExcellent = NetworkWirelessSignalExcellent;
exports.AdwaitaNetworkWirelessSignalGood = NetworkWirelessSignalGood;
exports.AdwaitaNetworkWirelessSignalNone = NetworkWirelessSignalNone;
exports.AdwaitaNetworkWirelessSignalOk = NetworkWirelessSignalOk;
exports.AdwaitaNetworkWirelessSignalWeak = NetworkWirelessSignalWeak;
exports.AdwaitaNetworkWorkgroup = NetworkWorkgroup;
exports.AdwaitaNightLight = NightLight;
exports.AdwaitaNightLightDisabled = NightLightDisabled;
exports.AdwaitaNonStarred = NonStarred;
exports.AdwaitaNotificationsDisabled = NotificationsDisabled;
exports.AdwaitaObjectFlipHorizontal = ObjectFlipHorizontal;
exports.AdwaitaObjectFlipVertical = ObjectFlipVertical;
exports.AdwaitaObjectRotateLeft = ObjectRotateLeft;
exports.AdwaitaObjectRotateRight = ObjectRotateRight;
exports.AdwaitaObjectSelect = ObjectSelect;
exports.AdwaitaOpenMenu = OpenMenu;
exports.AdwaitaOrientationLandscape = OrientationLandscape;
exports.AdwaitaOrientationLandscapeInverse = OrientationLandscapeInverse;
exports.AdwaitaOrientationPortraitLeft = OrientationPortraitLeft;
exports.AdwaitaOrientationPortraitRight = OrientationPortraitRight;
exports.AdwaitaPackageXGeneric = PackageXGeneric;
exports.AdwaitaPanDown = PanDown;
exports.AdwaitaPanEnd = PanEnd;
exports.AdwaitaPanStart = PanStart;
exports.AdwaitaPanUp = PanUp;
exports.AdwaitaPda = Pda;
exports.AdwaitaPhone = Phone;
exports.AdwaitaPhoneAppleIphone = PhoneAppleIphone;
exports.AdwaitaPhoneOld = PhoneOld;
exports.AdwaitaPowerProfileBalanced = PowerProfileBalanced;
exports.AdwaitaPowerProfilePerformance = PowerProfilePerformance;
exports.AdwaitaPowerProfilePowerSaver = PowerProfilePowerSaver;
exports.AdwaitaPreferencesColor = PreferencesColor;
exports.AdwaitaPreferencesDesktopAccessibility = PreferencesDesktopAccessibility;
exports.AdwaitaPreferencesDesktopApps = PreferencesDesktopApps;
exports.AdwaitaPreferencesDesktopDisplay = PreferencesDesktopDisplay;
exports.AdwaitaPreferencesDesktopFont = PreferencesDesktopFont;
exports.AdwaitaPreferencesDesktopKeyboard = PreferencesDesktopKeyboard;
exports.AdwaitaPreferencesDesktopKeyboardShortcuts = PreferencesDesktopKeyboardShortcuts;
exports.AdwaitaPreferencesDesktopLocale = PreferencesDesktopLocale;
exports.AdwaitaPreferencesDesktopMultitasking = PreferencesDesktopMultitasking;
exports.AdwaitaPreferencesDesktopRemoteDesktop = PreferencesDesktopRemoteDesktop;
exports.AdwaitaPreferencesDesktopScreensaver = PreferencesDesktopScreensaver;
exports.AdwaitaPreferencesDesktopWallpaper = PreferencesDesktopWallpaper;
exports.AdwaitaPreferencesOther = PreferencesOther;
exports.AdwaitaPreferencesSystem = PreferencesSystem;
exports.AdwaitaPreferencesSystemDetails = PreferencesSystemDetails;
exports.AdwaitaPreferencesSystemDevices = PreferencesSystemDevices;
exports.AdwaitaPreferencesSystemNetwork = PreferencesSystemNetwork;
exports.AdwaitaPreferencesSystemNetworkProxy = PreferencesSystemNetworkProxy;
exports.AdwaitaPreferencesSystemNotifications = PreferencesSystemNotifications;
exports.AdwaitaPreferencesSystemParentalControls = PreferencesSystemParentalControls;
exports.AdwaitaPreferencesSystemPrivacy = PreferencesSystemPrivacy;
exports.AdwaitaPreferencesSystemSearch = PreferencesSystemSearch;
exports.AdwaitaPreferencesSystemSharing = PreferencesSystemSharing;
exports.AdwaitaPreferencesSystemTime = PreferencesSystemTime;
exports.AdwaitaPrinter = Printer;
exports.AdwaitaPrinterError = PrinterError;
exports.AdwaitaPrinterNetwork = PrinterNetwork;
exports.AdwaitaPrinterPrinting = PrinterPrinting;
exports.AdwaitaPrinterWarning = PrinterWarning;
exports.AdwaitaProcessStop = ProcessStop;
exports.AdwaitaProvider = AdwaitaProvider;
exports.AdwaitaRadio = Radio;
exports.AdwaitaRadioChecked = RadioChecked;
exports.AdwaitaRadioMixed = RadioMixed;
exports.AdwaitaRotationAllowed = RotationAllowed;
exports.AdwaitaRotationLocked = RotationLocked;
exports.AdwaitaScanner = Scanner;
exports.AdwaitaScreenShared = ScreenShared;
exports.AdwaitaSecurityHigh = SecurityHigh;
exports.AdwaitaSecurityLow = SecurityLow;
exports.AdwaitaSecurityMedium = SecurityMedium;
exports.AdwaitaSecurityMediumRtl = SecurityMediumRtl;
exports.AdwaitaSelectionEnd = SelectionEnd;
exports.AdwaitaSelectionMode = SelectionMode;
exports.AdwaitaSelectionStart = SelectionStart;
exports.AdwaitaSemiStarred = SemiStarred;
exports.AdwaitaSemiStarredRtl = SemiStarredRtl;
exports.AdwaitaSendTo = SendTo;
exports.AdwaitaSidebarShow = SidebarShow;
exports.AdwaitaSidebarShowRight = SidebarShowRight;
exports.AdwaitaSoftwareUpdateAvailable = SoftwareUpdateAvailable;
exports.AdwaitaSoftwareUpdateUrgent = SoftwareUpdateUrgent;
exports.AdwaitaStarNew = StarNew;
exports.AdwaitaStarred = Starred;
exports.AdwaitaStartHere = StartHere;
exports.AdwaitaSystemFileManager = SystemFileManager;
exports.AdwaitaSystemHelp = SystemHelp;
exports.AdwaitaSystemLockScreen = SystemLockScreen;
exports.AdwaitaSystemLogOut = SystemLogOut;
exports.AdwaitaSystemLogOutRtl = SystemLogOutRtl;
exports.AdwaitaSystemReboot = SystemReboot;
exports.AdwaitaSystemRun = SystemRun;
exports.AdwaitaSystemSearch = SystemSearch;
exports.AdwaitaSystemShutdown = SystemShutdown;
exports.AdwaitaSystemSoftwareInstall = SystemSoftwareInstall;
exports.AdwaitaSystemSwitchUser = SystemSwitchUser;
exports.AdwaitaSystemSwitchUserRtl = SystemSwitchUserRtl;
exports.AdwaitaSystemUsers = SystemUsers;
exports.AdwaitaTabNew = TabNew;
exports.AdwaitaTablet = Tablet;
exports.AdwaitaTaskDue = TaskDue;
exports.AdwaitaTaskPastDue = TaskPastDue;
exports.AdwaitaTextEditor = TextEditor;
exports.AdwaitaTextXGeneric = TextXGeneric;
exports.AdwaitaThunderbolt = Thunderbolt;
exports.AdwaitaThunderboltAcquiring = ThunderboltAcquiring;
exports.AdwaitaToolsCheckSpelling = ToolsCheckSpelling;
exports.AdwaitaTouchDisabled = TouchDisabled;
exports.AdwaitaTouchpadDisabled = TouchpadDisabled;
exports.AdwaitaTv = Tv;
exports.AdwaitaUninterruptiblePowerSupply = UninterruptiblePowerSupply;
exports.AdwaitaUserAvailable = UserAvailable;
exports.AdwaitaUserAway = UserAway;
exports.AdwaitaUserBookmarks = UserBookmarks;
exports.AdwaitaUserBusy = UserBusy;
exports.AdwaitaUserDesktop = UserDesktop;
exports.AdwaitaUserHome = UserHome;
exports.AdwaitaUserIdle = UserIdle;
exports.AdwaitaUserInfo = UserInfo;
exports.AdwaitaUserInvisible = UserInvisible;
exports.AdwaitaUserNotTracked = UserNotTracked;
exports.AdwaitaUserOffline = UserOffline;
exports.AdwaitaUserStatusPending = UserStatusPending;
exports.AdwaitaUserTrash = UserTrash;
exports.AdwaitaUserTrashFull = UserTrashFull;
exports.AdwaitaUtilitiesTerminal = UtilitiesTerminal;
exports.AdwaitaValueDecrease = ValueDecrease;
exports.AdwaitaValueIncrease = ValueIncrease;
exports.AdwaitaVideoDisplay = VideoDisplay;
exports.AdwaitaVideoJoinedDisplays = VideoJoinedDisplays;
exports.AdwaitaVideoSingleDisplay = VideoSingleDisplay;
exports.AdwaitaVideoXGeneric = VideoXGeneric;
exports.AdwaitaViewAppGrid = ViewAppGrid;
exports.AdwaitaViewConceal = ViewConceal;
exports.AdwaitaViewContinuous = ViewContinuous;
exports.AdwaitaViewDual = ViewDual;
exports.AdwaitaViewFullscreen = ViewFullscreen;
exports.AdwaitaViewGrid = ViewGrid;
exports.AdwaitaViewList = ViewList;
exports.AdwaitaViewListBullet = ViewListBullet;
exports.AdwaitaViewListBulletRtl = ViewListBulletRtl;
exports.AdwaitaViewListOrdered = ViewListOrdered;
exports.AdwaitaViewListOrderedRtl = ViewListOrderedRtl;
exports.AdwaitaViewListRtl = ViewListRtl;
exports.AdwaitaViewMirror = ViewMirror;
exports.AdwaitaViewMore = ViewMore;
exports.AdwaitaViewMoreHorizontal = ViewMoreHorizontal;
exports.AdwaitaViewPaged = ViewPaged;
exports.AdwaitaViewPagedRtl = ViewPagedRtl;
exports.AdwaitaViewPin = ViewPin;
exports.AdwaitaViewRefresh = ViewRefresh;
exports.AdwaitaViewRestore = ViewRestore;
exports.AdwaitaViewReveal = ViewReveal;
exports.AdwaitaViewSortAscending = ViewSortAscending;
exports.AdwaitaViewSortAscendingRtl = ViewSortAscendingRtl;
exports.AdwaitaViewSortDescending = ViewSortDescending;
exports.AdwaitaViewSortDescendingRtl = ViewSortDescendingRtl;
exports.AdwaitaViewWrapped = ViewWrapped;
exports.AdwaitaViewWrappedRtl = ViewWrappedRtl;
exports.AdwaitaWeatherClear = WeatherClear;
exports.AdwaitaWeatherClearNight = WeatherClearNight;
exports.AdwaitaWeatherFewClouds = WeatherFewClouds;
exports.AdwaitaWeatherFewCloudsNight = WeatherFewCloudsNight;
exports.AdwaitaWeatherFog = WeatherFog;
exports.AdwaitaWeatherOvercast = WeatherOvercast;
exports.AdwaitaWeatherSevereAlert = WeatherSevereAlert;
exports.AdwaitaWeatherShowers = WeatherShowers;
exports.AdwaitaWeatherShowersScattered = WeatherShowersScattered;
exports.AdwaitaWeatherSnow = WeatherSnow;
exports.AdwaitaWeatherStorm = WeatherStorm;
exports.AdwaitaWeatherTornado = WeatherTornado;
exports.AdwaitaWeatherWindy = WeatherWindy;
exports.AdwaitaWebBrowser = WebBrowser;
exports.AdwaitaWindowClose = WindowClose;
exports.AdwaitaWindowMaximize = WindowMaximize;
exports.AdwaitaWindowMinimize = WindowMinimize;
exports.AdwaitaWindowNew = WindowNew;
exports.AdwaitaWindowRestore = WindowRestore;
exports.AdwaitaXOfficeAddressBook = XOfficeAddressBook;
exports.AdwaitaXOfficeCalendar = XOfficeCalendar;
exports.AdwaitaXOfficeDocument = XOfficeDocument;
exports.AdwaitaXOfficeDrawing = XOfficeDrawing;
exports.AdwaitaXOfficePresentation = XOfficePresentation;
exports.AdwaitaXOfficeSpreadsheet = XOfficeSpreadsheet;
exports.AdwaitaZoomFitBest = ZoomFitBest;
exports.AdwaitaZoomIn = ZoomIn;
exports.AdwaitaZoomOriginal = ZoomOriginal;
exports.AdwaitaZoomOut = ZoomOut;
exports.AirplaneMode = AirplaneMode;
exports.AirplaneModeDisabled = AirplaneModeDisabled;
exports.AirplaneModeDisabledIcon = AirplaneModeDisabled;
exports.AirplaneModeDisabledSymbolic = AirplaneModeDisabled;
exports.AirplaneModeIcon = AirplaneMode;
exports.AirplaneModeSymbolic = AirplaneMode;
exports.Alarm = Alarm;
exports.AlarmIcon = Alarm;
exports.AlarmSymbolic = Alarm;
exports.AppletsScreenshooter = AppletsScreenshooter;
exports.AppletsScreenshooterIcon = AppletsScreenshooter;
exports.AppletsScreenshooterSymbolic = AppletsScreenshooter;
exports.ApplicationCertificate = ApplicationCertificate;
exports.ApplicationCertificateIcon = ApplicationCertificate;
exports.ApplicationCertificateSymbolic = ApplicationCertificate;
exports.ApplicationExit = ApplicationExit;
exports.ApplicationExitIcon = ApplicationExit;
exports.ApplicationExitRtl = ApplicationExitRtl;
exports.ApplicationExitRtlIcon = ApplicationExitRtl;
exports.ApplicationExitRtlSymbolic = ApplicationExitRtl;
exports.ApplicationExitSymbolic = ApplicationExit;
exports.ApplicationRssXml = ApplicationRssXml;
exports.ApplicationRssXmlIcon = ApplicationRssXml;
exports.ApplicationRssXmlSymbolic = ApplicationRssXml;
exports.ApplicationXAddon = ApplicationXAddon;
exports.ApplicationXAddonIcon = ApplicationXAddon;
exports.ApplicationXAddonSymbolic = ApplicationXAddon;
exports.ApplicationXAppliance = ApplicationXAppliance;
exports.ApplicationXApplianceIcon = ApplicationXAppliance;
exports.ApplicationXApplianceSymbolic = ApplicationXAppliance;
exports.ApplicationXExecutable = ApplicationXExecutable;
exports.ApplicationXExecutableIcon = ApplicationXExecutable;
exports.ApplicationXExecutableSymbolic = ApplicationXExecutable;
exports.ApplicationXFirmware = ApplicationXFirmware;
exports.ApplicationXFirmwareIcon = ApplicationXFirmware;
exports.ApplicationXFirmwareSymbolic = ApplicationXFirmware;
exports.ApplicationXSharedlib = ApplicationXSharedlib;
exports.ApplicationXSharedlibIcon = ApplicationXSharedlib;
exports.ApplicationXSharedlibSymbolic = ApplicationXSharedlib;
exports.ApplicationsEngineering = ApplicationsEngineering;
exports.ApplicationsEngineeringIcon = ApplicationsEngineering;
exports.ApplicationsEngineeringSymbolic = ApplicationsEngineering;
exports.ApplicationsGames = ApplicationsGames;
exports.ApplicationsGamesIcon = ApplicationsGames;
exports.ApplicationsGamesSymbolic = ApplicationsGames;
exports.ApplicationsGraphics = ApplicationsGraphics;
exports.ApplicationsGraphicsIcon = ApplicationsGraphics;
exports.ApplicationsGraphicsSymbolic = ApplicationsGraphics;
exports.ApplicationsMultimedia = ApplicationsMultimedia;
exports.ApplicationsMultimediaIcon = ApplicationsMultimedia;
exports.ApplicationsMultimediaSymbolic = ApplicationsMultimedia;
exports.ApplicationsScience = ApplicationsScience;
exports.ApplicationsScienceIcon = ApplicationsScience;
exports.ApplicationsScienceSymbolic = ApplicationsScience;
exports.ApplicationsSystem = ApplicationsSystem;
exports.ApplicationsSystemIcon = ApplicationsSystem;
exports.ApplicationsSystemSymbolic = ApplicationsSystem;
exports.ApplicationsUtilities = ApplicationsUtilities;
exports.ApplicationsUtilitiesIcon = ApplicationsUtilities;
exports.ApplicationsUtilitiesSymbolic = ApplicationsUtilities;
exports.AppointmentMissed = AppointmentMissed;
exports.AppointmentMissedIcon = AppointmentMissed;
exports.AppointmentMissedSymbolic = AppointmentMissed;
exports.AppointmentNew = AppointmentNew;
exports.AppointmentNewIcon = AppointmentNew;
exports.AppointmentNewSymbolic = AppointmentNew;
exports.AppointmentSoon = AppointmentSoon;
exports.AppointmentSoonIcon = AppointmentSoon;
exports.AppointmentSoonSymbolic = AppointmentSoon;
exports.AudioCard = AudioCard;
exports.AudioCardIcon = AudioCard;
exports.AudioCardSymbolic = AudioCard;
exports.AudioHeadphones = AudioHeadphones;
exports.AudioHeadphonesIcon = AudioHeadphones;
exports.AudioHeadphonesSymbolic = AudioHeadphones;
exports.AudioHeadset = AudioHeadset;
exports.AudioHeadsetIcon = AudioHeadset;
exports.AudioHeadsetSymbolic = AudioHeadset;
exports.AudioInputMicrophone = AudioInputMicrophone;
exports.AudioInputMicrophoneIcon = AudioInputMicrophone;
exports.AudioInputMicrophoneSymbolic = AudioInputMicrophone;
exports.AudioSpeakers = AudioSpeakers;
exports.AudioSpeakersIcon = AudioSpeakers;
exports.AudioSpeakersRtl = AudioSpeakersRtl;
exports.AudioSpeakersRtlIcon = AudioSpeakersRtl;
exports.AudioSpeakersRtlSymbolic = AudioSpeakersRtl;
exports.AudioSpeakersSymbolic = AudioSpeakers;
exports.AudioVolumeHigh = AudioVolumeHigh;
exports.AudioVolumeHighIcon = AudioVolumeHigh;
exports.AudioVolumeHighRtl = AudioVolumeHighRtl;
exports.AudioVolumeHighRtlIcon = AudioVolumeHighRtl;
exports.AudioVolumeHighRtlSymbolic = AudioVolumeHighRtl;
exports.AudioVolumeHighSymbolic = AudioVolumeHigh;
exports.AudioVolumeLow = AudioVolumeLow;
exports.AudioVolumeLowIcon = AudioVolumeLow;
exports.AudioVolumeLowRtl = AudioVolumeLowRtl;
exports.AudioVolumeLowRtlIcon = AudioVolumeLowRtl;
exports.AudioVolumeLowRtlSymbolic = AudioVolumeLowRtl;
exports.AudioVolumeLowSymbolic = AudioVolumeLow;
exports.AudioVolumeMedium = AudioVolumeMedium;
exports.AudioVolumeMediumIcon = AudioVolumeMedium;
exports.AudioVolumeMediumRtl = AudioVolumeMediumRtl;
exports.AudioVolumeMediumRtlIcon = AudioVolumeMediumRtl;
exports.AudioVolumeMediumRtlSymbolic = AudioVolumeMediumRtl;
exports.AudioVolumeMediumSymbolic = AudioVolumeMedium;
exports.AudioVolumeMuted = AudioVolumeMuted;
exports.AudioVolumeMutedIcon = AudioVolumeMuted;
exports.AudioVolumeMutedRtl = AudioVolumeMutedRtl;
exports.AudioVolumeMutedRtlIcon = AudioVolumeMutedRtl;
exports.AudioVolumeMutedRtlSymbolic = AudioVolumeMutedRtl;
exports.AudioVolumeMutedSymbolic = AudioVolumeMuted;
exports.AudioVolumeOveramplified = AudioVolumeOveramplified;
exports.AudioVolumeOveramplifiedIcon = AudioVolumeOveramplified;
exports.AudioVolumeOveramplifiedRtl = AudioVolumeOveramplifiedRtl;
exports.AudioVolumeOveramplifiedRtlIcon = AudioVolumeOveramplifiedRtl;
exports.AudioVolumeOveramplifiedRtlSymbolic = AudioVolumeOveramplifiedRtl;
exports.AudioVolumeOveramplifiedSymbolic = AudioVolumeOveramplified;
exports.AudioXGeneric = AudioXGeneric;
exports.AudioXGenericIcon = AudioXGeneric;
exports.AudioXGenericSymbolic = AudioXGeneric;
exports.AuthFace = AuthFace;
exports.AuthFaceIcon = AuthFace;
exports.AuthFaceSymbolic = AuthFace;
exports.AuthFingerprint = AuthFingerprint;
exports.AuthFingerprintIcon = AuthFingerprint;
exports.AuthFingerprintSymbolic = AuthFingerprint;
exports.AuthSim = AuthSim;
exports.AuthSimIcon = AuthSim;
exports.AuthSimLocked = AuthSimLocked;
exports.AuthSimLockedIcon = AuthSimLocked;
exports.AuthSimLockedSymbolic = AuthSimLocked;
exports.AuthSimMissing = AuthSimMissing;
exports.AuthSimMissingIcon = AuthSimMissing;
exports.AuthSimMissingSymbolic = AuthSimMissing;
exports.AuthSimSymbolic = AuthSim;
exports.AuthSmartcard = AuthSmartcard;
exports.AuthSmartcardIcon = AuthSmartcard;
exports.AuthSmartcardSymbolic = AuthSmartcard;
exports.AvatarDefault = AvatarDefault;
exports.AvatarDefaultIcon = AvatarDefault;
exports.AvatarDefaultSymbolic = AvatarDefault;
exports.Battery = Battery;
exports.BatteryAction = BatteryAction;
exports.BatteryActionIcon = BatteryAction;
exports.BatteryActionSymbolic = BatteryAction;
exports.BatteryCaution = BatteryCaution;
exports.BatteryCautionCharging = BatteryCautionCharging;
exports.BatteryCautionChargingIcon = BatteryCautionCharging;
exports.BatteryCautionChargingSymbolic = BatteryCautionCharging;
exports.BatteryCautionIcon = BatteryCaution;
exports.BatteryCautionSymbolic = BatteryCaution;
exports.BatteryEmpty = BatteryEmpty;
exports.BatteryEmptyCharging = BatteryEmptyCharging;
exports.BatteryEmptyChargingIcon = BatteryEmptyCharging;
exports.BatteryEmptyChargingSymbolic = BatteryEmptyCharging;
exports.BatteryEmptyIcon = BatteryEmpty;
exports.BatteryEmptySymbolic = BatteryEmpty;
exports.BatteryFull = BatteryFull;
exports.BatteryFullCharged = BatteryFullCharged;
exports.BatteryFullChargedIcon = BatteryFullCharged;
exports.BatteryFullChargedSymbolic = BatteryFullCharged;
exports.BatteryFullCharging = BatteryFullCharging;
exports.BatteryFullChargingIcon = BatteryFullCharging;
exports.BatteryFullChargingSymbolic = BatteryFullCharging;
exports.BatteryFullIcon = BatteryFull;
exports.BatteryFullSymbolic = BatteryFull;
exports.BatteryGood = BatteryGood;
exports.BatteryGoodCharging = BatteryGoodCharging;
exports.BatteryGoodChargingIcon = BatteryGoodCharging;
exports.BatteryGoodChargingSymbolic = BatteryGoodCharging;
exports.BatteryGoodIcon = BatteryGood;
exports.BatteryGoodSymbolic = BatteryGood;
exports.BatteryIcon = Battery;
exports.BatteryLevel0 = BatteryLevel0;
exports.BatteryLevel0Charging = BatteryLevel0Charging;
exports.BatteryLevel0ChargingIcon = BatteryLevel0Charging;
exports.BatteryLevel0ChargingSymbolic = BatteryLevel0Charging;
exports.BatteryLevel0Icon = BatteryLevel0;
exports.BatteryLevel0PluggedIn = BatteryLevel0PluggedIn;
exports.BatteryLevel0PluggedInIcon = BatteryLevel0PluggedIn;
exports.BatteryLevel0PluggedInSymbolic = BatteryLevel0PluggedIn;
exports.BatteryLevel0Symbolic = BatteryLevel0;
exports.BatteryLevel10 = BatteryLevel10;
exports.BatteryLevel100 = BatteryLevel100;
exports.BatteryLevel100Charged = BatteryLevel100Charged;
exports.BatteryLevel100ChargedIcon = BatteryLevel100Charged;
exports.BatteryLevel100ChargedSymbolic = BatteryLevel100Charged;
exports.BatteryLevel100Icon = BatteryLevel100;
exports.BatteryLevel100PluggedIn = BatteryLevel100PluggedIn;
exports.BatteryLevel100PluggedInIcon = BatteryLevel100PluggedIn;
exports.BatteryLevel100PluggedInSymbolic = BatteryLevel100PluggedIn;
exports.BatteryLevel100Symbolic = BatteryLevel100;
exports.BatteryLevel10Charging = BatteryLevel10Charging;
exports.BatteryLevel10ChargingIcon = BatteryLevel10Charging;
exports.BatteryLevel10ChargingSymbolic = BatteryLevel10Charging;
exports.BatteryLevel10Icon = BatteryLevel10;
exports.BatteryLevel10PluggedIn = BatteryLevel10PluggedIn;
exports.BatteryLevel10PluggedInIcon = BatteryLevel10PluggedIn;
exports.BatteryLevel10PluggedInSymbolic = BatteryLevel10PluggedIn;
exports.BatteryLevel10Symbolic = BatteryLevel10;
exports.BatteryLevel20 = BatteryLevel20;
exports.BatteryLevel20Charging = BatteryLevel20Charging;
exports.BatteryLevel20ChargingIcon = BatteryLevel20Charging;
exports.BatteryLevel20ChargingSymbolic = BatteryLevel20Charging;
exports.BatteryLevel20Icon = BatteryLevel20;
exports.BatteryLevel20PluggedIn = BatteryLevel20PluggedIn;
exports.BatteryLevel20PluggedInIcon = BatteryLevel20PluggedIn;
exports.BatteryLevel20PluggedInSymbolic = BatteryLevel20PluggedIn;
exports.BatteryLevel20Symbolic = BatteryLevel20;
exports.BatteryLevel30 = BatteryLevel30;
exports.BatteryLevel30Charging = BatteryLevel30Charging;
exports.BatteryLevel30ChargingIcon = BatteryLevel30Charging;
exports.BatteryLevel30ChargingSymbolic = BatteryLevel30Charging;
exports.BatteryLevel30Icon = BatteryLevel30;
exports.BatteryLevel30PluggedIn = BatteryLevel30PluggedIn;
exports.BatteryLevel30PluggedInIcon = BatteryLevel30PluggedIn;
exports.BatteryLevel30PluggedInSymbolic = BatteryLevel30PluggedIn;
exports.BatteryLevel30Symbolic = BatteryLevel30;
exports.BatteryLevel40 = BatteryLevel40;
exports.BatteryLevel40Charging = BatteryLevel40Charging;
exports.BatteryLevel40ChargingIcon = BatteryLevel40Charging;
exports.BatteryLevel40ChargingSymbolic = BatteryLevel40Charging;
exports.BatteryLevel40Icon = BatteryLevel40;
exports.BatteryLevel40PluggedIn = BatteryLevel40PluggedIn;
exports.BatteryLevel40PluggedInIcon = BatteryLevel40PluggedIn;
exports.BatteryLevel40PluggedInSymbolic = BatteryLevel40PluggedIn;
exports.BatteryLevel40Symbolic = BatteryLevel40;
exports.BatteryLevel50 = BatteryLevel50;
exports.BatteryLevel50Charging = BatteryLevel50Charging;
exports.BatteryLevel50ChargingIcon = BatteryLevel50Charging;
exports.BatteryLevel50ChargingSymbolic = BatteryLevel50Charging;
exports.BatteryLevel50Icon = BatteryLevel50;
exports.BatteryLevel50PluggedIn = BatteryLevel50PluggedIn;
exports.BatteryLevel50PluggedInIcon = BatteryLevel50PluggedIn;
exports.BatteryLevel50PluggedInSymbolic = BatteryLevel50PluggedIn;
exports.BatteryLevel50Symbolic = BatteryLevel50;
exports.BatteryLevel60 = BatteryLevel60;
exports.BatteryLevel60Charging = BatteryLevel60Charging;
exports.BatteryLevel60ChargingIcon = BatteryLevel60Charging;
exports.BatteryLevel60ChargingSymbolic = BatteryLevel60Charging;
exports.BatteryLevel60Icon = BatteryLevel60;
exports.BatteryLevel60PluggedIn = BatteryLevel60PluggedIn;
exports.BatteryLevel60PluggedInIcon = BatteryLevel60PluggedIn;
exports.BatteryLevel60PluggedInSymbolic = BatteryLevel60PluggedIn;
exports.BatteryLevel60Symbolic = BatteryLevel60;
exports.BatteryLevel70 = BatteryLevel70;
exports.BatteryLevel70Charging = BatteryLevel70Charging;
exports.BatteryLevel70ChargingIcon = BatteryLevel70Charging;
exports.BatteryLevel70ChargingSymbolic = BatteryLevel70Charging;
exports.BatteryLevel70Icon = BatteryLevel70;
exports.BatteryLevel70PluggedIn = BatteryLevel70PluggedIn;
exports.BatteryLevel70PluggedInIcon = BatteryLevel70PluggedIn;
exports.BatteryLevel70PluggedInSymbolic = BatteryLevel70PluggedIn;
exports.BatteryLevel70Symbolic = BatteryLevel70;
exports.BatteryLevel80 = BatteryLevel80;
exports.BatteryLevel80Charging = BatteryLevel80Charging;
exports.BatteryLevel80ChargingIcon = BatteryLevel80Charging;
exports.BatteryLevel80ChargingSymbolic = BatteryLevel80Charging;
exports.BatteryLevel80Icon = BatteryLevel80;
exports.BatteryLevel80PluggedIn = BatteryLevel80PluggedIn;
exports.BatteryLevel80PluggedInIcon = BatteryLevel80PluggedIn;
exports.BatteryLevel80PluggedInSymbolic = BatteryLevel80PluggedIn;
exports.BatteryLevel80Symbolic = BatteryLevel80;
exports.BatteryLevel90 = BatteryLevel90;
exports.BatteryLevel90Charging = BatteryLevel90Charging;
exports.BatteryLevel90ChargingIcon = BatteryLevel90Charging;
exports.BatteryLevel90ChargingSymbolic = BatteryLevel90Charging;
exports.BatteryLevel90Icon = BatteryLevel90;
exports.BatteryLevel90PluggedIn = BatteryLevel90PluggedIn;
exports.BatteryLevel90PluggedInIcon = BatteryLevel90PluggedIn;
exports.BatteryLevel90PluggedInSymbolic = BatteryLevel90PluggedIn;
exports.BatteryLevel90Symbolic = BatteryLevel90;
exports.BatteryLow = BatteryLow;
exports.BatteryLowCharging = BatteryLowCharging;
exports.BatteryLowChargingIcon = BatteryLowCharging;
exports.BatteryLowChargingSymbolic = BatteryLowCharging;
exports.BatteryLowIcon = BatteryLow;
exports.BatteryLowSymbolic = BatteryLow;
exports.BatteryMissing = BatteryMissing;
exports.BatteryMissingIcon = BatteryMissing;
exports.BatteryMissingSymbolic = BatteryMissing;
exports.BatterySymbolic = Battery;
exports.Bluetooth = Bluetooth;
exports.BluetoothAcquiring = BluetoothAcquiring;
exports.BluetoothAcquiringIcon = BluetoothAcquiring;
exports.BluetoothAcquiringSymbolic = BluetoothAcquiring;
exports.BluetoothActive = BluetoothActive;
exports.BluetoothActiveIcon = BluetoothActive;
exports.BluetoothActiveSymbolic = BluetoothActive;
exports.BluetoothDisabled = BluetoothDisabled;
exports.BluetoothDisabledIcon = BluetoothDisabled;
exports.BluetoothDisabledSymbolic = BluetoothDisabled;
exports.BluetoothDisconnected = BluetoothDisconnected;
exports.BluetoothDisconnectedIcon = BluetoothDisconnected;
exports.BluetoothDisconnectedSymbolic = BluetoothDisconnected;
exports.BluetoothHardwareDisabled = BluetoothHardwareDisabled;
exports.BluetoothHardwareDisabledIcon = BluetoothHardwareDisabled;
exports.BluetoothHardwareDisabledSymbolic = BluetoothHardwareDisabled;
exports.BluetoothIcon = Bluetooth;
exports.BluetoothSymbolic = Bluetooth;
exports.BookmarkNew = BookmarkNew;
exports.BookmarkNewIcon = BookmarkNew;
exports.BookmarkNewSymbolic = BookmarkNew;
exports.Bullet = Bullet;
exports.BulletIcon = Bullet;
exports.BulletSymbolic = Bullet;
exports.CallIncoming = CallIncoming;
exports.CallIncomingIcon = CallIncoming;
exports.CallIncomingSymbolic = CallIncoming;
exports.CallMissed = CallMissed;
exports.CallMissedIcon = CallMissed;
exports.CallMissedSymbolic = CallMissed;
exports.CallOutgoing = CallOutgoing;
exports.CallOutgoingIcon = CallOutgoing;
exports.CallOutgoingSymbolic = CallOutgoing;
exports.CallStart = CallStart;
exports.CallStartIcon = CallStart;
exports.CallStartSymbolic = CallStart;
exports.CallStop = CallStop;
exports.CallStopIcon = CallStop;
exports.CallStopSymbolic = CallStop;
exports.CameraDisabled = CameraDisabled;
exports.CameraDisabledIcon = CameraDisabled;
exports.CameraDisabledSymbolic = CameraDisabled;
exports.CameraHardwareDisabled = CameraHardwareDisabled;
exports.CameraHardwareDisabledIcon = CameraHardwareDisabled;
exports.CameraHardwareDisabledSymbolic = CameraHardwareDisabled;
exports.CameraPhoto = CameraPhoto;
exports.CameraPhotoIcon = CameraPhoto;
exports.CameraPhotoSymbolic = CameraPhoto;
exports.CameraSwitch = CameraSwitch;
exports.CameraSwitchIcon = CameraSwitch;
exports.CameraSwitchSymbolic = CameraSwitch;
exports.CameraVideo = CameraVideo;
exports.CameraVideoIcon = CameraVideo;
exports.CameraVideoSymbolic = CameraVideo;
exports.CameraWeb = CameraWeb;
exports.CameraWebIcon = CameraWeb;
exports.CameraWebSymbolic = CameraWeb;
exports.ChangesAllow = ChangesAllow;
exports.ChangesAllowIcon = ChangesAllow;
exports.ChangesAllowSymbolic = ChangesAllow;
exports.ChangesPrevent = ChangesPrevent;
exports.ChangesPreventIcon = ChangesPrevent;
exports.ChangesPreventSymbolic = ChangesPrevent;
exports.ChannelInsecure = ChannelInsecure;
exports.ChannelInsecureIcon = ChannelInsecure;
exports.ChannelInsecureSymbolic = ChannelInsecure;
exports.ChannelSecure = ChannelSecure;
exports.ChannelSecureIcon = ChannelSecure;
exports.ChannelSecureSymbolic = ChannelSecure;
exports.ChatMessageNew = ChatMessageNew;
exports.ChatMessageNewIcon = ChatMessageNew;
exports.ChatMessageNewSymbolic = ChatMessageNew;
exports.Check = Check;
exports.CheckIcon = Check;
exports.CheckSymbolic = Check;
exports.Checkbox = Checkbox;
exports.CheckboxChecked = CheckboxChecked;
exports.CheckboxCheckedIcon = CheckboxChecked;
exports.CheckboxCheckedSymbolic = CheckboxChecked;
exports.CheckboxIcon = Checkbox;
exports.CheckboxMixed = CheckboxMixed;
exports.CheckboxMixedIcon = CheckboxMixed;
exports.CheckboxMixedSymbolic = CheckboxMixed;
exports.CheckboxSymbolic = Checkbox;
exports.ColorSelect = ColorSelect;
exports.ColorSelectIcon = ColorSelect;
exports.ColorSelectSymbolic = ColorSelect;
exports.ColorimeterColorhug = ColorimeterColorhug;
exports.ColorimeterColorhugIcon = ColorimeterColorhug;
exports.ColorimeterColorhugSymbolic = ColorimeterColorhug;
exports.Computer = Computer;
exports.ComputerAppleIpad = ComputerAppleIpad;
exports.ComputerAppleIpadIcon = ComputerAppleIpad;
exports.ComputerAppleIpadSymbolic = ComputerAppleIpad;
exports.ComputerFail = ComputerFail;
exports.ComputerFailIcon = ComputerFail;
exports.ComputerFailSymbolic = ComputerFail;
exports.ComputerIcon = Computer;
exports.ComputerSymbolic = Computer;
exports.ContactNew = ContactNew;
exports.ContactNewIcon = ContactNew;
exports.ContactNewSymbolic = ContactNew;
exports.ContentLoading = ContentLoading;
exports.ContentLoadingIcon = ContentLoading;
exports.ContentLoadingSymbolic = ContentLoading;
exports.Dash = Dash;
exports.DashIcon = Dash;
exports.DashSymbolic = Dash;
exports.DaytimeSunrise = DaytimeSunrise;
exports.DaytimeSunriseIcon = DaytimeSunrise;
exports.DaytimeSunriseSymbolic = DaytimeSunrise;
exports.DaytimeSunset = DaytimeSunset;
exports.DaytimeSunsetIcon = DaytimeSunset;
exports.DaytimeSunsetSymbolic = DaytimeSunset;
exports.DialogError = DialogError;
exports.DialogErrorIcon = DialogError;
exports.DialogErrorSymbolic = DialogError;
exports.DialogInformation = DialogInformation;
exports.DialogInformationIcon = DialogInformation;
exports.DialogInformationSymbolic = DialogInformation;
exports.DialogPassword = DialogPassword;
exports.DialogPasswordIcon = DialogPassword;
exports.DialogPasswordSymbolic = DialogPassword;
exports.DialogQuestion = DialogQuestion;
exports.DialogQuestionIcon = DialogQuestion;
exports.DialogQuestionSymbolic = DialogQuestion;
exports.DialogWarning = DialogWarning;
exports.DialogWarningIcon = DialogWarning;
exports.DialogWarningSymbolic = DialogWarning;
exports.DisplayBrightness = DisplayBrightness;
exports.DisplayBrightnessIcon = DisplayBrightness;
exports.DisplayBrightnessSymbolic = DisplayBrightness;
exports.DisplayProjector = DisplayProjector;
exports.DisplayProjectorIcon = DisplayProjector;
exports.DisplayProjectorSymbolic = DisplayProjector;
exports.DocumentEdit = DocumentEdit;
exports.DocumentEditIcon = DocumentEdit;
exports.DocumentEditSymbolic = DocumentEdit;
exports.DocumentNew = DocumentNew;
exports.DocumentNewIcon = DocumentNew;
exports.DocumentNewSymbolic = DocumentNew;
exports.DocumentOpen = DocumentOpen;
exports.DocumentOpenIcon = DocumentOpen;
exports.DocumentOpenRecent = DocumentOpenRecent;
exports.DocumentOpenRecentIcon = DocumentOpenRecent;
exports.DocumentOpenRecentSymbolic = DocumentOpenRecent;
exports.DocumentOpenSymbolic = DocumentOpen;
exports.DocumentPageSetup = DocumentPageSetup;
exports.DocumentPageSetupIcon = DocumentPageSetup;
exports.DocumentPageSetupSymbolic = DocumentPageSetup;
exports.DocumentPrint = DocumentPrint;
exports.DocumentPrintIcon = DocumentPrint;
exports.DocumentPrintPreview = DocumentPrintPreview;
exports.DocumentPrintPreviewIcon = DocumentPrintPreview;
exports.DocumentPrintPreviewSymbolic = DocumentPrintPreview;
exports.DocumentPrintSymbolic = DocumentPrint;
exports.DocumentProperties = DocumentProperties;
exports.DocumentPropertiesIcon = DocumentProperties;
exports.DocumentPropertiesSymbolic = DocumentProperties;
exports.DocumentRevert = DocumentRevert;
exports.DocumentRevertIcon = DocumentRevert;
exports.DocumentRevertRtl = DocumentRevertRtl;
exports.DocumentRevertRtlIcon = DocumentRevertRtl;
exports.DocumentRevertRtlSymbolic = DocumentRevertRtl;
exports.DocumentRevertSymbolic = DocumentRevert;
exports.DocumentSave = DocumentSave;
exports.DocumentSaveAs = DocumentSaveAs;
exports.DocumentSaveAsIcon = DocumentSaveAs;
exports.DocumentSaveAsSymbolic = DocumentSaveAs;
exports.DocumentSaveIcon = DocumentSave;
exports.DocumentSaveSymbolic = DocumentSave;
exports.DocumentSend = DocumentSend;
exports.DocumentSendIcon = DocumentSend;
exports.DocumentSendSymbolic = DocumentSend;
exports.DriveHarddisk = DriveHarddisk;
exports.DriveHarddiskIcon = DriveHarddisk;
exports.DriveHarddiskIeee1394 = DriveHarddiskIeee1394;
exports.DriveHarddiskIeee1394Icon = DriveHarddiskIeee1394;
exports.DriveHarddiskIeee1394Symbolic = DriveHarddiskIeee1394;
exports.DriveHarddiskSolidstate = DriveHarddiskSolidstate;
exports.DriveHarddiskSolidstateIcon = DriveHarddiskSolidstate;
exports.DriveHarddiskSolidstateSymbolic = DriveHarddiskSolidstate;
exports.DriveHarddiskSymbolic = DriveHarddisk;
exports.DriveHarddiskSystem = DriveHarddiskSystem;
exports.DriveHarddiskSystemIcon = DriveHarddiskSystem;
exports.DriveHarddiskSystemSymbolic = DriveHarddiskSystem;
exports.DriveHarddiskUsb = DriveHarddiskUsb;
exports.DriveHarddiskUsbIcon = DriveHarddiskUsb;
exports.DriveHarddiskUsbSymbolic = DriveHarddiskUsb;
exports.DriveMultidisk = DriveMultidisk;
exports.DriveMultidiskIcon = DriveMultidisk;
exports.DriveMultidiskSymbolic = DriveMultidisk;
exports.DriveOptical = DriveOptical;
exports.DriveOpticalIcon = DriveOptical;
exports.DriveOpticalSymbolic = DriveOptical;
exports.DriveRemovableMedia = DriveRemovableMedia;
exports.DriveRemovableMediaIcon = DriveRemovableMedia;
exports.DriveRemovableMediaSymbolic = DriveRemovableMedia;
exports.EditClear = EditClear;
exports.EditClearAll = EditClearAll;
exports.EditClearAllIcon = EditClearAll;
exports.EditClearAllSymbolic = EditClearAll;
exports.EditClearIcon = EditClear;
exports.EditClearRtl = EditClearRtl;
exports.EditClearRtlIcon = EditClearRtl;
exports.EditClearRtlSymbolic = EditClearRtl;
exports.EditClearSymbolic = EditClear;
exports.EditCopy = EditCopy;
exports.EditCopyIcon = EditCopy;
exports.EditCopySymbolic = EditCopy;
exports.EditCut = EditCut;
exports.EditCutIcon = EditCut;
exports.EditCutSymbolic = EditCut;
exports.EditDelete = EditDelete;
exports.EditDeleteIcon = EditDelete;
exports.EditDeleteSymbolic = EditDelete;
exports.EditFind = EditFind;
exports.EditFindIcon = EditFind;
exports.EditFindReplace = EditFindReplace;
exports.EditFindReplaceIcon = EditFindReplace;
exports.EditFindReplaceSymbolic = EditFindReplace;
exports.EditFindSymbolic = EditFind;
exports.EditPaste = EditPaste;
exports.EditPasteIcon = EditPaste;
exports.EditPasteSymbolic = EditPaste;
exports.EditRedo = EditRedo;
exports.EditRedoIcon = EditRedo;
exports.EditRedoSymbolic = EditRedo;
exports.EditSelect = EditSelect;
exports.EditSelectAll = EditSelectAll;
exports.EditSelectAllIcon = EditSelectAll;
exports.EditSelectAllSymbolic = EditSelectAll;
exports.EditSelectIcon = EditSelect;
exports.EditSelectSymbolic = EditSelect;
exports.EditUndo = EditUndo;
exports.EditUndoIcon = EditUndo;
exports.EditUndoSymbolic = EditUndo;
exports.EmblemImportant = EmblemImportant;
exports.EmblemImportantIcon = EmblemImportant;
exports.EmblemImportantSymbolic = EmblemImportant;
exports.EmblemSystem = EmblemSystem;
exports.EmblemSystemIcon = EmblemSystem;
exports.EmblemSystemSymbolic = EmblemSystem;
exports.EmojiActivities = EmojiActivities;
exports.EmojiActivitiesIcon = EmojiActivities;
exports.EmojiActivitiesSymbolic = EmojiActivities;
exports.EmojiBody = EmojiBody;
exports.EmojiBodyIcon = EmojiBody;
exports.EmojiBodySymbolic = EmojiBody;
exports.EmojiFlags = EmojiFlags;
exports.EmojiFlagsIcon = EmojiFlags;
exports.EmojiFlagsSymbolic = EmojiFlags;
exports.EmojiFood = EmojiFood;
exports.EmojiFoodIcon = EmojiFood;
exports.EmojiFoodSymbolic = EmojiFood;
exports.EmojiNature = EmojiNature;
exports.EmojiNatureIcon = EmojiNature;
exports.EmojiNatureSymbolic = EmojiNature;
exports.EmojiObjects = EmojiObjects;
exports.EmojiObjectsIcon = EmojiObjects;
exports.EmojiObjectsSymbolic = EmojiObjects;
exports.EmojiPeople = EmojiPeople;
exports.EmojiPeopleIcon = EmojiPeople;
exports.EmojiPeopleSymbolic = EmojiPeople;
exports.EmojiRecent = EmojiRecent;
exports.EmojiRecentIcon = EmojiRecent;
exports.EmojiRecentSymbolic = EmojiRecent;
exports.EmojiSymbols = EmojiSymbols;
exports.EmojiSymbolsIcon = EmojiSymbols;
exports.EmojiSymbolsSymbolic = EmojiSymbols;
exports.EmojiTravel = EmojiTravel;
exports.EmojiTravelIcon = EmojiTravel;
exports.EmojiTravelSymbolic = EmojiTravel;
exports.EmoteLove = EmoteLove;
exports.EmoteLoveIcon = EmoteLove;
exports.EmoteLoveSymbolic = EmoteLove;
exports.ErrorCorrect = ErrorCorrect;
exports.ErrorCorrectIcon = ErrorCorrect;
exports.ErrorCorrectSymbolic = ErrorCorrect;
exports.FaceAngel = FaceAngel;
exports.FaceAngelIcon = FaceAngel;
exports.FaceAngelSymbolic = FaceAngel;
exports.FaceAngry = FaceAngry;
exports.FaceAngryIcon = FaceAngry;
exports.FaceAngrySymbolic = FaceAngry;
exports.FaceConfused = FaceConfused;
exports.FaceConfusedIcon = FaceConfused;
exports.FaceConfusedSymbolic = FaceConfused;
exports.FaceCool = FaceCool;
exports.FaceCoolIcon = FaceCool;
exports.FaceCoolSymbolic = FaceCool;
exports.FaceCrying = FaceCrying;
exports.FaceCryingIcon = FaceCrying;
exports.FaceCryingSymbolic = FaceCrying;
exports.FaceDevilish = FaceDevilish;
exports.FaceDevilishIcon = FaceDevilish;
exports.FaceDevilishSymbolic = FaceDevilish;
exports.FaceEmbarrassed = FaceEmbarrassed;
exports.FaceEmbarrassedIcon = FaceEmbarrassed;
exports.FaceEmbarrassedSymbolic = FaceEmbarrassed;
exports.FaceGlasses = FaceGlasses;
exports.FaceGlassesIcon = FaceGlasses;
exports.FaceGlassesSymbolic = FaceGlasses;
exports.FaceKiss = FaceKiss;
exports.FaceKissIcon = FaceKiss;
exports.FaceKissSymbolic = FaceKiss;
exports.FaceLaugh = FaceLaugh;
exports.FaceLaughIcon = FaceLaugh;
exports.FaceLaughSymbolic = FaceLaugh;
exports.FaceMonkey = FaceMonkey;
exports.FaceMonkeyIcon = FaceMonkey;
exports.FaceMonkeySymbolic = FaceMonkey;
exports.FacePlain = FacePlain;
exports.FacePlainIcon = FacePlain;
exports.FacePlainSymbolic = FacePlain;
exports.FaceRaspberry = FaceRaspberry;
exports.FaceRaspberryIcon = FaceRaspberry;
exports.FaceRaspberrySymbolic = FaceRaspberry;
exports.FaceSad = FaceSad;
exports.FaceSadIcon = FaceSad;
exports.FaceSadSymbolic = FaceSad;
exports.FaceShutmouth = FaceShutmouth;
exports.FaceShutmouthIcon = FaceShutmouth;
exports.FaceShutmouthSymbolic = FaceShutmouth;
exports.FaceSick = FaceSick;
exports.FaceSickIcon = FaceSick;
exports.FaceSickSymbolic = FaceSick;
exports.FaceSmile = FaceSmile;
exports.FaceSmileBig = FaceSmileBig;
exports.FaceSmileBigIcon = FaceSmileBig;
exports.FaceSmileBigSymbolic = FaceSmileBig;
exports.FaceSmileIcon = FaceSmile;
exports.FaceSmileSymbolic = FaceSmile;
exports.FaceSmirk = FaceSmirk;
exports.FaceSmirkIcon = FaceSmirk;
exports.FaceSmirkSymbolic = FaceSmirk;
exports.FaceSurprise = FaceSurprise;
exports.FaceSurpriseIcon = FaceSurprise;
exports.FaceSurpriseSymbolic = FaceSurprise;
exports.FaceTired = FaceTired;
exports.FaceTiredIcon = FaceTired;
exports.FaceTiredSymbolic = FaceTired;
exports.FaceUncertain = FaceUncertain;
exports.FaceUncertainIcon = FaceUncertain;
exports.FaceUncertainSymbolic = FaceUncertain;
exports.FaceWink = FaceWink;
exports.FaceWinkIcon = FaceWink;
exports.FaceWinkSymbolic = FaceWink;
exports.FaceWorried = FaceWorried;
exports.FaceWorriedIcon = FaceWorried;
exports.FaceWorriedSymbolic = FaceWorried;
exports.FaceYawn = FaceYawn;
exports.FaceYawnIcon = FaceYawn;
exports.FaceYawnSymbolic = FaceYawn;
exports.FindLocation = FindLocation;
exports.FindLocationIcon = FindLocation;
exports.FindLocationSymbolic = FindLocation;
exports.FocusLegacySystray = FocusLegacySystray;
exports.FocusLegacySystrayIcon = FocusLegacySystray;
exports.FocusLegacySystraySymbolic = FocusLegacySystray;
exports.FocusTopBar = FocusTopBar;
exports.FocusTopBarIcon = FocusTopBar;
exports.FocusTopBarSymbolic = FocusTopBar;
exports.FocusWindows = FocusWindows;
exports.FocusWindowsIcon = FocusWindows;
exports.FocusWindowsSymbolic = FocusWindows;
exports.Folder = Folder;
exports.FolderDocuments = FolderDocuments;
exports.FolderDocumentsIcon = FolderDocuments;
exports.FolderDocumentsSymbolic = FolderDocuments;
exports.FolderDownload = FolderDownload;
exports.FolderDownloadIcon = FolderDownload;
exports.FolderDownloadSymbolic = FolderDownload;
exports.FolderDragAccept = FolderDragAccept;
exports.FolderDragAcceptIcon = FolderDragAccept;
exports.FolderDragAcceptSymbolic = FolderDragAccept;
exports.FolderIcon = Folder;
exports.FolderMusic = FolderMusic;
exports.FolderMusicIcon = FolderMusic;
exports.FolderMusicSymbolic = FolderMusic;
exports.FolderNew = FolderNew;
exports.FolderNewIcon = FolderNew;
exports.FolderNewSymbolic = FolderNew;
exports.FolderOpen = FolderOpen;
exports.FolderOpenIcon = FolderOpen;
exports.FolderOpenSymbolic = FolderOpen;
exports.FolderPictures = FolderPictures;
exports.FolderPicturesIcon = FolderPictures;
exports.FolderPicturesSymbolic = FolderPictures;
exports.FolderPublicshare = FolderPublicshare;
exports.FolderPublicshareIcon = FolderPublicshare;
exports.FolderPublicshareSymbolic = FolderPublicshare;
exports.FolderRemote = FolderRemote;
exports.FolderRemoteIcon = FolderRemote;
exports.FolderRemoteSymbolic = FolderRemote;
exports.FolderSavedSearch = FolderSavedSearch;
exports.FolderSavedSearchIcon = FolderSavedSearch;
exports.FolderSavedSearchSymbolic = FolderSavedSearch;
exports.FolderSymbolic = Folder;
exports.FolderTemplates = FolderTemplates;
exports.FolderTemplatesIcon = FolderTemplates;
exports.FolderTemplatesSymbolic = FolderTemplates;
exports.FolderVideos = FolderVideos;
exports.FolderVideosIcon = FolderVideos;
exports.FolderVideosSymbolic = FolderVideos;
exports.FolderVisiting = FolderVisiting;
exports.FolderVisitingIcon = FolderVisiting;
exports.FolderVisitingSymbolic = FolderVisiting;
exports.FontSelect = FontSelect;
exports.FontSelectIcon = FontSelect;
exports.FontSelectSymbolic = FontSelect;
exports.FontXGeneric = FontXGeneric;
exports.FontXGenericIcon = FontXGeneric;
exports.FontXGenericSymbolic = FontXGeneric;
exports.FormatIndentLess = FormatIndentLess;
exports.FormatIndentLessIcon = FormatIndentLess;
exports.FormatIndentLessRtl = FormatIndentLessRtl;
exports.FormatIndentLessRtlIcon = FormatIndentLessRtl;
exports.FormatIndentLessRtlSymbolic = FormatIndentLessRtl;
exports.FormatIndentLessSymbolic = FormatIndentLess;
exports.FormatIndentMore = FormatIndentMore;
exports.FormatIndentMoreIcon = FormatIndentMore;
exports.FormatIndentMoreRtl = FormatIndentMoreRtl;
exports.FormatIndentMoreRtlIcon = FormatIndentMoreRtl;
exports.FormatIndentMoreRtlSymbolic = FormatIndentMoreRtl;
exports.FormatIndentMoreSymbolic = FormatIndentMore;
exports.FormatJustifyCenter = FormatJustifyCenter;
exports.FormatJustifyCenterIcon = FormatJustifyCenter;
exports.FormatJustifyCenterSymbolic = FormatJustifyCenter;
exports.FormatJustifyFill = FormatJustifyFill;
exports.FormatJustifyFillIcon = FormatJustifyFill;
exports.FormatJustifyFillSymbolic = FormatJustifyFill;
exports.FormatJustifyLeft = FormatJustifyLeft;
exports.FormatJustifyLeftIcon = FormatJustifyLeft;
exports.FormatJustifyLeftSymbolic = FormatJustifyLeft;
exports.FormatJustifyRight = FormatJustifyRight;
exports.FormatJustifyRightIcon = FormatJustifyRight;
exports.FormatJustifyRightSymbolic = FormatJustifyRight;
exports.FormatTextBold = FormatTextBold;
exports.FormatTextBoldIcon = FormatTextBold;
exports.FormatTextBoldSymbolic = FormatTextBold;
exports.FormatTextDirection = FormatTextDirection;
exports.FormatTextDirectionIcon = FormatTextDirection;
exports.FormatTextDirectionLtr = FormatTextDirectionLtr;
exports.FormatTextDirectionLtrIcon = FormatTextDirectionLtr;
exports.FormatTextDirectionLtrSymbolic = FormatTextDirectionLtr;
exports.FormatTextDirectionRtl = FormatTextDirectionRtl;
exports.FormatTextDirectionRtlIcon = FormatTextDirectionRtl;
exports.FormatTextDirectionRtlSymbolic = FormatTextDirectionRtl;
exports.FormatTextDirectionSymbolic = FormatTextDirection;
exports.FormatTextItalic = FormatTextItalic;
exports.FormatTextItalicIcon = FormatTextItalic;
exports.FormatTextItalicSymbolic = FormatTextItalic;
exports.FormatTextPlaintext = FormatTextPlaintext;
exports.FormatTextPlaintextIcon = FormatTextPlaintext;
exports.FormatTextPlaintextSymbolic = FormatTextPlaintext;
exports.FormatTextRich = FormatTextRich;
exports.FormatTextRichIcon = FormatTextRich;
exports.FormatTextRichSymbolic = FormatTextRich;
exports.FormatTextStrikethrough = FormatTextStrikethrough;
exports.FormatTextStrikethroughIcon = FormatTextStrikethrough;
exports.FormatTextStrikethroughSymbolic = FormatTextStrikethrough;
exports.FormatTextUnderline = FormatTextUnderline;
exports.FormatTextUnderlineIcon = FormatTextUnderline;
exports.FormatTextUnderlineSymbolic = FormatTextUnderline;
exports.GnomePowerManager = GnomePowerManager;
exports.GnomePowerManagerIcon = GnomePowerManager;
exports.GnomePowerManagerSymbolic = GnomePowerManager;
exports.GoBottom = GoBottom;
exports.GoBottomIcon = GoBottom;
exports.GoBottomSymbolic = GoBottom;
exports.GoDown = GoDown;
exports.GoDownIcon = GoDown;
exports.GoDownSymbolic = GoDown;
exports.GoFirst = GoFirst;
exports.GoFirstIcon = GoFirst;
exports.GoFirstSymbolic = GoFirst;
exports.GoHome = GoHome;
exports.GoHomeIcon = GoHome;
exports.GoHomeSymbolic = GoHome;
exports.GoJump = GoJump;
exports.GoJumpIcon = GoJump;
exports.GoJumpRtl = GoJumpRtl;
exports.GoJumpRtlIcon = GoJumpRtl;
exports.GoJumpRtlSymbolic = GoJumpRtl;
exports.GoJumpSymbolic = GoJump;
exports.GoLast = GoLast;
exports.GoLastIcon = GoLast;
exports.GoLastSymbolic = GoLast;
exports.GoNext = GoNext;
exports.GoNextIcon = GoNext;
exports.GoNextSymbolic = GoNext;
exports.GoPrevious = GoPrevious;
exports.GoPreviousIcon = GoPrevious;
exports.GoPreviousSymbolic = GoPrevious;
exports.GoTop = GoTop;
exports.GoTopIcon = GoTop;
exports.GoTopSymbolic = GoTop;
exports.GoUp = GoUp;
exports.GoUpIcon = GoUp;
exports.GoUpSymbolic = GoUp;
exports.GoaPanel = GoaPanel;
exports.GoaPanelIcon = GoaPanel;
exports.GoaPanelSymbolic = GoaPanel;
exports.HelpAbout = HelpAbout;
exports.HelpAboutIcon = HelpAbout;
exports.HelpAboutSymbolic = HelpAbout;
exports.HelpBrowser = HelpBrowser;
exports.HelpBrowserIcon = HelpBrowser;
exports.HelpBrowserSymbolic = HelpBrowser;
exports.HelpContents = HelpContents;
exports.HelpContentsIcon = HelpContents;
exports.HelpContentsSymbolic = HelpContents;
exports.HelpFaq = HelpFaq;
exports.HelpFaqIcon = HelpFaq;
exports.HelpFaqSymbolic = HelpFaq;
exports.Icon = Icon;
exports.ImageLoading = ImageLoading;
exports.ImageLoadingIcon = ImageLoading;
exports.ImageLoadingSymbolic = ImageLoading;
exports.ImageMissing = ImageMissing;
exports.ImageMissingIcon = ImageMissing;
exports.ImageMissingSymbolic = ImageMissing;
exports.ImageXGeneric = ImageXGeneric;
exports.ImageXGenericIcon = ImageXGeneric;
exports.ImageXGenericSymbolic = ImageXGeneric;
exports.InodeDirectory = InodeDirectory;
exports.InodeDirectoryIcon = InodeDirectory;
exports.InodeDirectorySymbolic = InodeDirectory;
exports.InputDialpad = InputDialpad;
exports.InputDialpadIcon = InputDialpad;
exports.InputDialpadSymbolic = InputDialpad;
exports.InputGaming = InputGaming;
exports.InputGamingIcon = InputGaming;
exports.InputGamingSymbolic = InputGaming;
exports.InputKeyboard = InputKeyboard;
exports.InputKeyboardIcon = InputKeyboard;
exports.InputKeyboardSymbolic = InputKeyboard;
exports.InputMouse = InputMouse;
exports.InputMouseIcon = InputMouse;
exports.InputMouseSymbolic = InputMouse;
exports.InputTablet = InputTablet;
exports.InputTabletIcon = InputTablet;
exports.InputTabletSymbolic = InputTablet;
exports.InputTouchpad = InputTouchpad;
exports.InputTouchpadIcon = InputTouchpad;
exports.InputTouchpadSymbolic = InputTouchpad;
exports.InsertImage = InsertImage;
exports.InsertImageIcon = InsertImage;
exports.InsertImageSymbolic = InsertImage;
exports.InsertLink = InsertLink;
exports.InsertLinkIcon = InsertLink;
exports.InsertLinkSymbolic = InsertLink;
exports.InsertObject = InsertObject;
exports.InsertObjectIcon = InsertObject;
exports.InsertObjectSymbolic = InsertObject;
exports.InsertText = InsertText;
exports.InsertTextIcon = InsertText;
exports.InsertTextSymbolic = InsertText;
exports.KeyboardBrightness = KeyboardBrightness;
exports.KeyboardBrightnessIcon = KeyboardBrightness;
exports.KeyboardBrightnessSymbolic = KeyboardBrightness;
exports.ListAdd = ListAdd;
exports.ListAddIcon = ListAdd;
exports.ListAddSymbolic = ListAdd;
exports.ListDragHandle = ListDragHandle;
exports.ListDragHandleIcon = ListDragHandle;
exports.ListDragHandleSymbolic = ListDragHandle;
exports.ListRemove = ListRemove;
exports.ListRemoveAll = ListRemoveAll;
exports.ListRemoveAllIcon = ListRemoveAll;
exports.ListRemoveAllSymbolic = ListRemoveAll;
exports.ListRemoveIcon = ListRemove;
exports.ListRemoveSymbolic = ListRemove;
exports.LocationServicesActive = LocationServicesActive;
exports.LocationServicesActiveIcon = LocationServicesActive;
exports.LocationServicesActiveSymbolic = LocationServicesActive;
exports.LocationServicesDisabled = LocationServicesDisabled;
exports.LocationServicesDisabledIcon = LocationServicesDisabled;
exports.LocationServicesDisabledSymbolic = LocationServicesDisabled;
exports.MailAttachment = MailAttachment;
exports.MailAttachmentIcon = MailAttachment;
exports.MailAttachmentSymbolic = MailAttachment;
exports.MailForward = MailForward;
exports.MailForwardIcon = MailForward;
exports.MailForwardSymbolic = MailForward;
exports.MailMarkImportant = MailMarkImportant;
exports.MailMarkImportantIcon = MailMarkImportant;
exports.MailMarkImportantSymbolic = MailMarkImportant;
exports.MailMarkJunk = MailMarkJunk;
exports.MailMarkJunkIcon = MailMarkJunk;
exports.MailMarkJunkSymbolic = MailMarkJunk;
exports.MailMarkNotjunk = MailMarkNotjunk;
exports.MailMarkNotjunkIcon = MailMarkNotjunk;
exports.MailMarkNotjunkSymbolic = MailMarkNotjunk;
exports.MailMessageNew = MailMessageNew;
exports.MailMessageNewIcon = MailMessageNew;
exports.MailMessageNewSymbolic = MailMessageNew;
exports.MailRead = MailRead;
exports.MailReadIcon = MailRead;
exports.MailReadSymbolic = MailRead;
exports.MailReplied = MailReplied;
exports.MailRepliedIcon = MailReplied;
exports.MailRepliedRtl = MailRepliedRtl;
exports.MailRepliedRtlIcon = MailRepliedRtl;
exports.MailRepliedRtlSymbolic = MailRepliedRtl;
exports.MailRepliedSymbolic = MailReplied;
exports.MailReplyAll = MailReplyAll;
exports.MailReplyAllIcon = MailReplyAll;
exports.MailReplyAllRtl = MailReplyAllRtl;
exports.MailReplyAllRtlIcon = MailReplyAllRtl;
exports.MailReplyAllRtlSymbolic = MailReplyAllRtl;
exports.MailReplyAllSymbolic = MailReplyAll;
exports.MailReplySender = MailReplySender;
exports.MailReplySenderIcon = MailReplySender;
exports.MailReplySenderSymbolic = MailReplySender;
exports.MailSend = MailSend;
exports.MailSendIcon = MailSend;
exports.MailSendReceive = MailSendReceive;
exports.MailSendReceiveIcon = MailSendReceive;
exports.MailSendReceiveSymbolic = MailSendReceive;
exports.MailSendSymbolic = MailSend;
exports.MailUnread = MailUnread;
exports.MailUnreadIcon = MailUnread;
exports.MailUnreadSymbolic = MailUnread;
exports.MarkLocation = MarkLocation;
exports.MarkLocationIcon = MarkLocation;
exports.MarkLocationSymbolic = MarkLocation;
exports.MediaEject = MediaEject;
exports.MediaEjectIcon = MediaEject;
exports.MediaEjectSymbolic = MediaEject;
exports.MediaFlash = MediaFlash;
exports.MediaFlashIcon = MediaFlash;
exports.MediaFlashSymbolic = MediaFlash;
exports.MediaFloppy = MediaFloppy;
exports.MediaFloppyIcon = MediaFloppy;
exports.MediaFloppySymbolic = MediaFloppy;
exports.MediaOptical = MediaOptical;
exports.MediaOpticalBd = MediaOpticalBd;
exports.MediaOpticalBdIcon = MediaOpticalBd;
exports.MediaOpticalBdSymbolic = MediaOpticalBd;
exports.MediaOpticalCd = MediaOpticalCd;
exports.MediaOpticalCdAudio = MediaOpticalCdAudio;
exports.MediaOpticalCdAudioIcon = MediaOpticalCdAudio;
exports.MediaOpticalCdAudioSymbolic = MediaOpticalCdAudio;
exports.MediaOpticalCdIcon = MediaOpticalCd;
exports.MediaOpticalCdSymbolic = MediaOpticalCd;
exports.MediaOpticalDvd = MediaOpticalDvd;
exports.MediaOpticalDvdIcon = MediaOpticalDvd;
exports.MediaOpticalDvdSymbolic = MediaOpticalDvd;
exports.MediaOpticalIcon = MediaOptical;
exports.MediaOpticalSymbolic = MediaOptical;
exports.MediaPlaybackPause = MediaPlaybackPause;
exports.MediaPlaybackPauseIcon = MediaPlaybackPause;
exports.MediaPlaybackPauseSymbolic = MediaPlaybackPause;
exports.MediaPlaybackStart = MediaPlaybackStart;
exports.MediaPlaybackStartIcon = MediaPlaybackStart;
exports.MediaPlaybackStartSymbolic = MediaPlaybackStart;
exports.MediaPlaybackStop = MediaPlaybackStop;
exports.MediaPlaybackStopIcon = MediaPlaybackStop;
exports.MediaPlaybackStopSymbolic = MediaPlaybackStop;
exports.MediaPlaylistConsecutive = MediaPlaylistConsecutive;
exports.MediaPlaylistConsecutiveIcon = MediaPlaylistConsecutive;
exports.MediaPlaylistConsecutiveSymbolic = MediaPlaylistConsecutive;
exports.MediaPlaylistRepeat = MediaPlaylistRepeat;
exports.MediaPlaylistRepeatIcon = MediaPlaylistRepeat;
exports.MediaPlaylistRepeatSong = MediaPlaylistRepeatSong;
exports.MediaPlaylistRepeatSongIcon = MediaPlaylistRepeatSong;
exports.MediaPlaylistRepeatSongSymbolic = MediaPlaylistRepeatSong;
exports.MediaPlaylistRepeatSymbolic = MediaPlaylistRepeat;
exports.MediaPlaylistShuffle = MediaPlaylistShuffle;
exports.MediaPlaylistShuffleIcon = MediaPlaylistShuffle;
exports.MediaPlaylistShuffleSymbolic = MediaPlaylistShuffle;
exports.MediaRecord = MediaRecord;
exports.MediaRecordIcon = MediaRecord;
exports.MediaRecordSymbolic = MediaRecord;
exports.MediaRemovable = MediaRemovable;
exports.MediaRemovableIcon = MediaRemovable;
exports.MediaRemovableSymbolic = MediaRemovable;
exports.MediaSeekBackward = MediaSeekBackward;
exports.MediaSeekBackwardIcon = MediaSeekBackward;
exports.MediaSeekBackwardSymbolic = MediaSeekBackward;
exports.MediaSeekForward = MediaSeekForward;
exports.MediaSeekForwardIcon = MediaSeekForward;
exports.MediaSeekForwardSymbolic = MediaSeekForward;
exports.MediaSkipBackward = MediaSkipBackward;
exports.MediaSkipBackwardIcon = MediaSkipBackward;
exports.MediaSkipBackwardSymbolic = MediaSkipBackward;
exports.MediaSkipForward = MediaSkipForward;
exports.MediaSkipForwardIcon = MediaSkipForward;
exports.MediaSkipForwardSymbolic = MediaSkipForward;
exports.MediaTape = MediaTape;
exports.MediaTapeIcon = MediaTape;
exports.MediaTapeSymbolic = MediaTape;
exports.MediaViewSubtitles = MediaViewSubtitles;
exports.MediaViewSubtitlesIcon = MediaViewSubtitles;
exports.MediaViewSubtitlesSymbolic = MediaViewSubtitles;
exports.MediaZip = MediaZip;
exports.MediaZipIcon = MediaZip;
exports.MediaZipSymbolic = MediaZip;
exports.MicrophoneDisabled = MicrophoneDisabled;
exports.MicrophoneDisabledIcon = MicrophoneDisabled;
exports.MicrophoneDisabledSymbolic = MicrophoneDisabled;
exports.MicrophoneHardwareDisabled = MicrophoneHardwareDisabled;
exports.MicrophoneHardwareDisabledIcon = MicrophoneHardwareDisabled;
exports.MicrophoneHardwareDisabledSymbolic = MicrophoneHardwareDisabled;
exports.MicrophoneSensitivityHigh = MicrophoneSensitivityHigh;
exports.MicrophoneSensitivityHighIcon = MicrophoneSensitivityHigh;
exports.MicrophoneSensitivityHighSymbolic = MicrophoneSensitivityHigh;
exports.MicrophoneSensitivityLow = MicrophoneSensitivityLow;
exports.MicrophoneSensitivityLowIcon = MicrophoneSensitivityLow;
exports.MicrophoneSensitivityLowSymbolic = MicrophoneSensitivityLow;
exports.MicrophoneSensitivityMedium = MicrophoneSensitivityMedium;
exports.MicrophoneSensitivityMediumIcon = MicrophoneSensitivityMedium;
exports.MicrophoneSensitivityMediumSymbolic = MicrophoneSensitivityMedium;
exports.MicrophoneSensitivityMuted = MicrophoneSensitivityMuted;
exports.MicrophoneSensitivityMutedIcon = MicrophoneSensitivityMuted;
exports.MicrophoneSensitivityMutedSymbolic = MicrophoneSensitivityMuted;
exports.Modem = Modem;
exports.ModemIcon = Modem;
exports.ModemSymbolic = Modem;
exports.MultimediaPlayer = MultimediaPlayer;
exports.MultimediaPlayerAppleIpodTouch = MultimediaPlayerAppleIpodTouch;
exports.MultimediaPlayerAppleIpodTouchIcon = MultimediaPlayerAppleIpodTouch;
exports.MultimediaPlayerAppleIpodTouchSymbolic = MultimediaPlayerAppleIpodTouch;
exports.MultimediaPlayerIcon = MultimediaPlayer;
exports.MultimediaPlayerSymbolic = MultimediaPlayer;
exports.MultimediaVolumeControl = MultimediaVolumeControl;
exports.MultimediaVolumeControlIcon = MultimediaVolumeControl;
exports.MultimediaVolumeControlSymbolic = MultimediaVolumeControl;
exports.NetworkCellular = NetworkCellular;
exports.NetworkCellular2g = NetworkCellular2g;
exports.NetworkCellular2gIcon = NetworkCellular2g;
exports.NetworkCellular2gSymbolic = NetworkCellular2g;
exports.NetworkCellular3g = NetworkCellular3g;
exports.NetworkCellular3gIcon = NetworkCellular3g;
exports.NetworkCellular3gSymbolic = NetworkCellular3g;
exports.NetworkCellular4g = NetworkCellular4g;
exports.NetworkCellular4gIcon = NetworkCellular4g;
exports.NetworkCellular4gSymbolic = NetworkCellular4g;
exports.NetworkCellular5g = NetworkCellular5g;
exports.NetworkCellular5gIcon = NetworkCellular5g;
exports.NetworkCellular5gSymbolic = NetworkCellular5g;
exports.NetworkCellularAcquiring = NetworkCellularAcquiring;
exports.NetworkCellularAcquiringIcon = NetworkCellularAcquiring;
exports.NetworkCellularAcquiringRtl = NetworkCellularAcquiringRtl;
exports.NetworkCellularAcquiringRtlIcon = NetworkCellularAcquiringRtl;
exports.NetworkCellularAcquiringRtlSymbolic = NetworkCellularAcquiringRtl;
exports.NetworkCellularAcquiringSymbolic = NetworkCellularAcquiring;
exports.NetworkCellularConnected = NetworkCellularConnected;
exports.NetworkCellularConnectedIcon = NetworkCellularConnected;
exports.NetworkCellularConnectedSymbolic = NetworkCellularConnected;
exports.NetworkCellularDisabled = NetworkCellularDisabled;
exports.NetworkCellularDisabledIcon = NetworkCellularDisabled;
exports.NetworkCellularDisabledRtl = NetworkCellularDisabledRtl;
exports.NetworkCellularDisabledRtlIcon = NetworkCellularDisabledRtl;
exports.NetworkCellularDisabledRtlSymbolic = NetworkCellularDisabledRtl;
exports.NetworkCellularDisabledSymbolic = NetworkCellularDisabled;
exports.NetworkCellularEdge = NetworkCellularEdge;
exports.NetworkCellularEdgeIcon = NetworkCellularEdge;
exports.NetworkCellularEdgeSymbolic = NetworkCellularEdge;
exports.NetworkCellularGprs = NetworkCellularGprs;
exports.NetworkCellularGprsIcon = NetworkCellularGprs;
exports.NetworkCellularGprsSymbolic = NetworkCellularGprs;
exports.NetworkCellularHardwareDisabled = NetworkCellularHardwareDisabled;
exports.NetworkCellularHardwareDisabledIcon = NetworkCellularHardwareDisabled;
exports.NetworkCellularHardwareDisabledRtl = NetworkCellularHardwareDisabledRtl;
exports.NetworkCellularHardwareDisabledRtlIcon = NetworkCellularHardwareDisabledRtl;
exports.NetworkCellularHardwareDisabledRtlSymbolic = NetworkCellularHardwareDisabledRtl;
exports.NetworkCellularHardwareDisabledSymbolic = NetworkCellularHardwareDisabled;
exports.NetworkCellularHspa = NetworkCellularHspa;
exports.NetworkCellularHspaIcon = NetworkCellularHspa;
exports.NetworkCellularHspaSymbolic = NetworkCellularHspa;
exports.NetworkCellularIcon = NetworkCellular;
exports.NetworkCellularNoRoute = NetworkCellularNoRoute;
exports.NetworkCellularNoRouteIcon = NetworkCellularNoRoute;
exports.NetworkCellularNoRouteRtl = NetworkCellularNoRouteRtl;
exports.NetworkCellularNoRouteRtlIcon = NetworkCellularNoRouteRtl;
exports.NetworkCellularNoRouteRtlSymbolic = NetworkCellularNoRouteRtl;
exports.NetworkCellularNoRouteSymbolic = NetworkCellularNoRoute;
exports.NetworkCellularOffline = NetworkCellularOffline;
exports.NetworkCellularOfflineIcon = NetworkCellularOffline;
exports.NetworkCellularOfflineRtl = NetworkCellularOfflineRtl;
exports.NetworkCellularOfflineRtlIcon = NetworkCellularOfflineRtl;
exports.NetworkCellularOfflineRtlSymbolic = NetworkCellularOfflineRtl;
exports.NetworkCellularOfflineSymbolic = NetworkCellularOffline;
exports.NetworkCellularSignalExcellent = NetworkCellularSignalExcellent;
exports.NetworkCellularSignalExcellentIcon = NetworkCellularSignalExcellent;
exports.NetworkCellularSignalExcellentRtl = NetworkCellularSignalExcellentRtl;
exports.NetworkCellularSignalExcellentRtlIcon = NetworkCellularSignalExcellentRtl;
exports.NetworkCellularSignalExcellentRtlSymbolic = NetworkCellularSignalExcellentRtl;
exports.NetworkCellularSignalExcellentSymbolic = NetworkCellularSignalExcellent;
exports.NetworkCellularSignalGood = NetworkCellularSignalGood;
exports.NetworkCellularSignalGoodIcon = NetworkCellularSignalGood;
exports.NetworkCellularSignalGoodRtl = NetworkCellularSignalGoodRtl;
exports.NetworkCellularSignalGoodRtlIcon = NetworkCellularSignalGoodRtl;
exports.NetworkCellularSignalGoodRtlSymbolic = NetworkCellularSignalGoodRtl;
exports.NetworkCellularSignalGoodSymbolic = NetworkCellularSignalGood;
exports.NetworkCellularSignalNone = NetworkCellularSignalNone;
exports.NetworkCellularSignalNoneIcon = NetworkCellularSignalNone;
exports.NetworkCellularSignalNoneRtl = NetworkCellularSignalNoneRtl;
exports.NetworkCellularSignalNoneRtlIcon = NetworkCellularSignalNoneRtl;
exports.NetworkCellularSignalNoneRtlSymbolic = NetworkCellularSignalNoneRtl;
exports.NetworkCellularSignalNoneSymbolic = NetworkCellularSignalNone;
exports.NetworkCellularSignalOk = NetworkCellularSignalOk;
exports.NetworkCellularSignalOkIcon = NetworkCellularSignalOk;
exports.NetworkCellularSignalOkRtl = NetworkCellularSignalOkRtl;
exports.NetworkCellularSignalOkRtlIcon = NetworkCellularSignalOkRtl;
exports.NetworkCellularSignalOkRtlSymbolic = NetworkCellularSignalOkRtl;
exports.NetworkCellularSignalOkSymbolic = NetworkCellularSignalOk;
exports.NetworkCellularSignalWeak = NetworkCellularSignalWeak;
exports.NetworkCellularSignalWeakIcon = NetworkCellularSignalWeak;
exports.NetworkCellularSignalWeakRtl = NetworkCellularSignalWeakRtl;
exports.NetworkCellularSignalWeakRtlIcon = NetworkCellularSignalWeakRtl;
exports.NetworkCellularSignalWeakRtlSymbolic = NetworkCellularSignalWeakRtl;
exports.NetworkCellularSignalWeakSymbolic = NetworkCellularSignalWeak;
exports.NetworkCellularSymbolic = NetworkCellular;
exports.NetworkError = NetworkError;
exports.NetworkErrorIcon = NetworkError;
exports.NetworkErrorSymbolic = NetworkError;
exports.NetworkIdle = NetworkIdle;
exports.NetworkIdleIcon = NetworkIdle;
exports.NetworkIdleSymbolic = NetworkIdle;
exports.NetworkNoRoute = NetworkNoRoute;
exports.NetworkNoRouteIcon = NetworkNoRoute;
exports.NetworkNoRouteSymbolic = NetworkNoRoute;
exports.NetworkOffline = NetworkOffline;
exports.NetworkOfflineIcon = NetworkOffline;
exports.NetworkOfflineSymbolic = NetworkOffline;
exports.NetworkReceive = NetworkReceive;
exports.NetworkReceiveIcon = NetworkReceive;
exports.NetworkReceiveSymbolic = NetworkReceive;
exports.NetworkServer = NetworkServer;
exports.NetworkServerIcon = NetworkServer;
exports.NetworkServerSymbolic = NetworkServer;
exports.NetworkTransmit = NetworkTransmit;
exports.NetworkTransmitIcon = NetworkTransmit;
exports.NetworkTransmitReceive = NetworkTransmitReceive;
exports.NetworkTransmitReceiveIcon = NetworkTransmitReceive;
exports.NetworkTransmitReceiveSymbolic = NetworkTransmitReceive;
exports.NetworkTransmitSymbolic = NetworkTransmit;
exports.NetworkVpn = NetworkVpn;
exports.NetworkVpnAcquiring = NetworkVpnAcquiring;
exports.NetworkVpnAcquiringIcon = NetworkVpnAcquiring;
exports.NetworkVpnAcquiringSymbolic = NetworkVpnAcquiring;
exports.NetworkVpnDisabled = NetworkVpnDisabled;
exports.NetworkVpnDisabledIcon = NetworkVpnDisabled;
exports.NetworkVpnDisabledSymbolic = NetworkVpnDisabled;
exports.NetworkVpnDisconnected = NetworkVpnDisconnected;
exports.NetworkVpnDisconnectedIcon = NetworkVpnDisconnected;
exports.NetworkVpnDisconnectedSymbolic = NetworkVpnDisconnected;
exports.NetworkVpnIcon = NetworkVpn;
exports.NetworkVpnNoRoute = NetworkVpnNoRoute;
exports.NetworkVpnNoRouteIcon = NetworkVpnNoRoute;
exports.NetworkVpnNoRouteSymbolic = NetworkVpnNoRoute;
exports.NetworkVpnSymbolic = NetworkVpn;
exports.NetworkWired = NetworkWired;
exports.NetworkWiredAcquiring = NetworkWiredAcquiring;
exports.NetworkWiredAcquiringIcon = NetworkWiredAcquiring;
exports.NetworkWiredAcquiringSymbolic = NetworkWiredAcquiring;
exports.NetworkWiredDisconnected = NetworkWiredDisconnected;
exports.NetworkWiredDisconnectedIcon = NetworkWiredDisconnected;
exports.NetworkWiredDisconnectedSymbolic = NetworkWiredDisconnected;
exports.NetworkWiredIcon = NetworkWired;
exports.NetworkWiredNoRoute = NetworkWiredNoRoute;
exports.NetworkWiredNoRouteIcon = NetworkWiredNoRoute;
exports.NetworkWiredNoRouteSymbolic = NetworkWiredNoRoute;
exports.NetworkWiredSymbolic = NetworkWired;
exports.NetworkWireless = NetworkWireless;
exports.NetworkWirelessAcquiring = NetworkWirelessAcquiring;
exports.NetworkWirelessAcquiringIcon = NetworkWirelessAcquiring;
exports.NetworkWirelessAcquiringSymbolic = NetworkWirelessAcquiring;
exports.NetworkWirelessConnected = NetworkWirelessConnected;
exports.NetworkWirelessConnectedIcon = NetworkWirelessConnected;
exports.NetworkWirelessConnectedSymbolic = NetworkWirelessConnected;
exports.NetworkWirelessDisabled = NetworkWirelessDisabled;
exports.NetworkWirelessDisabledIcon = NetworkWirelessDisabled;
exports.NetworkWirelessDisabledSymbolic = NetworkWirelessDisabled;
exports.NetworkWirelessEncrypted = NetworkWirelessEncrypted;
exports.NetworkWirelessEncryptedIcon = NetworkWirelessEncrypted;
exports.NetworkWirelessEncryptedSymbolic = NetworkWirelessEncrypted;
exports.NetworkWirelessHardwareDisabled = NetworkWirelessHardwareDisabled;
exports.NetworkWirelessHardwareDisabledIcon = NetworkWirelessHardwareDisabled;
exports.NetworkWirelessHardwareDisabledSymbolic = NetworkWirelessHardwareDisabled;
exports.NetworkWirelessHotspot = NetworkWirelessHotspot;
exports.NetworkWirelessHotspotIcon = NetworkWirelessHotspot;
exports.NetworkWirelessHotspotSymbolic = NetworkWirelessHotspot;
exports.NetworkWirelessIcon = NetworkWireless;
exports.NetworkWirelessNoRoute = NetworkWirelessNoRoute;
exports.NetworkWirelessNoRouteIcon = NetworkWirelessNoRoute;
exports.NetworkWirelessNoRouteSymbolic = NetworkWirelessNoRoute;
exports.NetworkWirelessOffline = NetworkWirelessOffline;
exports.NetworkWirelessOfflineIcon = NetworkWirelessOffline;
exports.NetworkWirelessOfflineSymbolic = NetworkWirelessOffline;
exports.NetworkWirelessSignalExcellent = NetworkWirelessSignalExcellent;
exports.NetworkWirelessSignalExcellentIcon = NetworkWirelessSignalExcellent;
exports.NetworkWirelessSignalExcellentSymbolic = NetworkWirelessSignalExcellent;
exports.NetworkWirelessSignalGood = NetworkWirelessSignalGood;
exports.NetworkWirelessSignalGoodIcon = NetworkWirelessSignalGood;
exports.NetworkWirelessSignalGoodSymbolic = NetworkWirelessSignalGood;
exports.NetworkWirelessSignalNone = NetworkWirelessSignalNone;
exports.NetworkWirelessSignalNoneIcon = NetworkWirelessSignalNone;
exports.NetworkWirelessSignalNoneSymbolic = NetworkWirelessSignalNone;
exports.NetworkWirelessSignalOk = NetworkWirelessSignalOk;
exports.NetworkWirelessSignalOkIcon = NetworkWirelessSignalOk;
exports.NetworkWirelessSignalOkSymbolic = NetworkWirelessSignalOk;
exports.NetworkWirelessSignalWeak = NetworkWirelessSignalWeak;
exports.NetworkWirelessSignalWeakIcon = NetworkWirelessSignalWeak;
exports.NetworkWirelessSignalWeakSymbolic = NetworkWirelessSignalWeak;
exports.NetworkWirelessSymbolic = NetworkWireless;
exports.NetworkWorkgroup = NetworkWorkgroup;
exports.NetworkWorkgroupIcon = NetworkWorkgroup;
exports.NetworkWorkgroupSymbolic = NetworkWorkgroup;
exports.NightLight = NightLight;
exports.NightLightDisabled = NightLightDisabled;
exports.NightLightDisabledIcon = NightLightDisabled;
exports.NightLightDisabledSymbolic = NightLightDisabled;
exports.NightLightIcon = NightLight;
exports.NightLightSymbolic = NightLight;
exports.NonStarred = NonStarred;
exports.NonStarredIcon = NonStarred;
exports.NonStarredSymbolic = NonStarred;
exports.NotificationsDisabled = NotificationsDisabled;
exports.NotificationsDisabledIcon = NotificationsDisabled;
exports.NotificationsDisabledSymbolic = NotificationsDisabled;
exports.ObjectFlipHorizontal = ObjectFlipHorizontal;
exports.ObjectFlipHorizontalIcon = ObjectFlipHorizontal;
exports.ObjectFlipHorizontalSymbolic = ObjectFlipHorizontal;
exports.ObjectFlipVertical = ObjectFlipVertical;
exports.ObjectFlipVerticalIcon = ObjectFlipVertical;
exports.ObjectFlipVerticalSymbolic = ObjectFlipVertical;
exports.ObjectRotateLeft = ObjectRotateLeft;
exports.ObjectRotateLeftIcon = ObjectRotateLeft;
exports.ObjectRotateLeftSymbolic = ObjectRotateLeft;
exports.ObjectRotateRight = ObjectRotateRight;
exports.ObjectRotateRightIcon = ObjectRotateRight;
exports.ObjectRotateRightSymbolic = ObjectRotateRight;
exports.ObjectSelect = ObjectSelect;
exports.ObjectSelectIcon = ObjectSelect;
exports.ObjectSelectSymbolic = ObjectSelect;
exports.OpenMenu = OpenMenu;
exports.OpenMenuIcon = OpenMenu;
exports.OpenMenuSymbolic = OpenMenu;
exports.OrientationLandscape = OrientationLandscape;
exports.OrientationLandscapeIcon = OrientationLandscape;
exports.OrientationLandscapeInverse = OrientationLandscapeInverse;
exports.OrientationLandscapeInverseIcon = OrientationLandscapeInverse;
exports.OrientationLandscapeInverseSymbolic = OrientationLandscapeInverse;
exports.OrientationLandscapeSymbolic = OrientationLandscape;
exports.OrientationPortraitLeft = OrientationPortraitLeft;
exports.OrientationPortraitLeftIcon = OrientationPortraitLeft;
exports.OrientationPortraitLeftSymbolic = OrientationPortraitLeft;
exports.OrientationPortraitRight = OrientationPortraitRight;
exports.OrientationPortraitRightIcon = OrientationPortraitRight;
exports.OrientationPortraitRightSymbolic = OrientationPortraitRight;
exports.PackageXGeneric = PackageXGeneric;
exports.PackageXGenericIcon = PackageXGeneric;
exports.PackageXGenericSymbolic = PackageXGeneric;
exports.PanDown = PanDown;
exports.PanDownIcon = PanDown;
exports.PanDownSymbolic = PanDown;
exports.PanEnd = PanEnd;
exports.PanEndIcon = PanEnd;
exports.PanEndSymbolic = PanEnd;
exports.PanStart = PanStart;
exports.PanStartIcon = PanStart;
exports.PanStartSymbolic = PanStart;
exports.PanUp = PanUp;
exports.PanUpIcon = PanUp;
exports.PanUpSymbolic = PanUp;
exports.Pda = Pda;
exports.PdaIcon = Pda;
exports.PdaSymbolic = Pda;
exports.Phone = Phone;
exports.PhoneAppleIphone = PhoneAppleIphone;
exports.PhoneAppleIphoneIcon = PhoneAppleIphone;
exports.PhoneAppleIphoneSymbolic = PhoneAppleIphone;
exports.PhoneIcon = Phone;
exports.PhoneOld = PhoneOld;
exports.PhoneOldIcon = PhoneOld;
exports.PhoneOldSymbolic = PhoneOld;
exports.PhoneSymbolic = Phone;
exports.PowerProfileBalanced = PowerProfileBalanced;
exports.PowerProfileBalancedIcon = PowerProfileBalanced;
exports.PowerProfileBalancedSymbolic = PowerProfileBalanced;
exports.PowerProfilePerformance = PowerProfilePerformance;
exports.PowerProfilePerformanceIcon = PowerProfilePerformance;
exports.PowerProfilePerformanceSymbolic = PowerProfilePerformance;
exports.PowerProfilePowerSaver = PowerProfilePowerSaver;
exports.PowerProfilePowerSaverIcon = PowerProfilePowerSaver;
exports.PowerProfilePowerSaverSymbolic = PowerProfilePowerSaver;
exports.PreferencesColor = PreferencesColor;
exports.PreferencesColorIcon = PreferencesColor;
exports.PreferencesColorSymbolic = PreferencesColor;
exports.PreferencesDesktopAccessibility = PreferencesDesktopAccessibility;
exports.PreferencesDesktopAccessibilityIcon = PreferencesDesktopAccessibility;
exports.PreferencesDesktopAccessibilitySymbolic = PreferencesDesktopAccessibility;
exports.PreferencesDesktopApps = PreferencesDesktopApps;
exports.PreferencesDesktopAppsIcon = PreferencesDesktopApps;
exports.PreferencesDesktopAppsSymbolic = PreferencesDesktopApps;
exports.PreferencesDesktopDisplay = PreferencesDesktopDisplay;
exports.PreferencesDesktopDisplayIcon = PreferencesDesktopDisplay;
exports.PreferencesDesktopDisplaySymbolic = PreferencesDesktopDisplay;
exports.PreferencesDesktopFont = PreferencesDesktopFont;
exports.PreferencesDesktopFontIcon = PreferencesDesktopFont;
exports.PreferencesDesktopFontSymbolic = PreferencesDesktopFont;
exports.PreferencesDesktopKeyboard = PreferencesDesktopKeyboard;
exports.PreferencesDesktopKeyboardIcon = PreferencesDesktopKeyboard;
exports.PreferencesDesktopKeyboardShortcuts = PreferencesDesktopKeyboardShortcuts;
exports.PreferencesDesktopKeyboardShortcutsIcon = PreferencesDesktopKeyboardShortcuts;
exports.PreferencesDesktopKeyboardShortcutsSymbolic = PreferencesDesktopKeyboardShortcuts;
exports.PreferencesDesktopKeyboardSymbolic = PreferencesDesktopKeyboard;
exports.PreferencesDesktopLocale = PreferencesDesktopLocale;
exports.PreferencesDesktopLocaleIcon = PreferencesDesktopLocale;
exports.PreferencesDesktopLocaleSymbolic = PreferencesDesktopLocale;
exports.PreferencesDesktopMultitasking = PreferencesDesktopMultitasking;
exports.PreferencesDesktopMultitaskingIcon = PreferencesDesktopMultitasking;
exports.PreferencesDesktopMultitaskingSymbolic = PreferencesDesktopMultitasking;
exports.PreferencesDesktopRemoteDesktop = PreferencesDesktopRemoteDesktop;
exports.PreferencesDesktopRemoteDesktopIcon = PreferencesDesktopRemoteDesktop;
exports.PreferencesDesktopRemoteDesktopSymbolic = PreferencesDesktopRemoteDesktop;
exports.PreferencesDesktopScreensaver = PreferencesDesktopScreensaver;
exports.PreferencesDesktopScreensaverIcon = PreferencesDesktopScreensaver;
exports.PreferencesDesktopScreensaverSymbolic = PreferencesDesktopScreensaver;
exports.PreferencesDesktopWallpaper = PreferencesDesktopWallpaper;
exports.PreferencesDesktopWallpaperIcon = PreferencesDesktopWallpaper;
exports.PreferencesDesktopWallpaperSymbolic = PreferencesDesktopWallpaper;
exports.PreferencesOther = PreferencesOther;
exports.PreferencesOtherIcon = PreferencesOther;
exports.PreferencesOtherSymbolic = PreferencesOther;
exports.PreferencesSystem = PreferencesSystem;
exports.PreferencesSystemDetails = PreferencesSystemDetails;
exports.PreferencesSystemDetailsIcon = PreferencesSystemDetails;
exports.PreferencesSystemDetailsSymbolic = PreferencesSystemDetails;
exports.PreferencesSystemDevices = PreferencesSystemDevices;
exports.PreferencesSystemDevicesIcon = PreferencesSystemDevices;
exports.PreferencesSystemDevicesSymbolic = PreferencesSystemDevices;
exports.PreferencesSystemIcon = PreferencesSystem;
exports.PreferencesSystemNetwork = PreferencesSystemNetwork;
exports.PreferencesSystemNetworkIcon = PreferencesSystemNetwork;
exports.PreferencesSystemNetworkProxy = PreferencesSystemNetworkProxy;
exports.PreferencesSystemNetworkProxyIcon = PreferencesSystemNetworkProxy;
exports.PreferencesSystemNetworkProxySymbolic = PreferencesSystemNetworkProxy;
exports.PreferencesSystemNetworkSymbolic = PreferencesSystemNetwork;
exports.PreferencesSystemNotifications = PreferencesSystemNotifications;
exports.PreferencesSystemNotificationsIcon = PreferencesSystemNotifications;
exports.PreferencesSystemNotificationsSymbolic = PreferencesSystemNotifications;
exports.PreferencesSystemParentalControls = PreferencesSystemParentalControls;
exports.PreferencesSystemParentalControlsIcon = PreferencesSystemParentalControls;
exports.PreferencesSystemParentalControlsSymbolic = PreferencesSystemParentalControls;
exports.PreferencesSystemPrivacy = PreferencesSystemPrivacy;
exports.PreferencesSystemPrivacyIcon = PreferencesSystemPrivacy;
exports.PreferencesSystemPrivacySymbolic = PreferencesSystemPrivacy;
exports.PreferencesSystemSearch = PreferencesSystemSearch;
exports.PreferencesSystemSearchIcon = PreferencesSystemSearch;
exports.PreferencesSystemSearchSymbolic = PreferencesSystemSearch;
exports.PreferencesSystemSharing = PreferencesSystemSharing;
exports.PreferencesSystemSharingIcon = PreferencesSystemSharing;
exports.PreferencesSystemSharingSymbolic = PreferencesSystemSharing;
exports.PreferencesSystemSymbolic = PreferencesSystem;
exports.PreferencesSystemTime = PreferencesSystemTime;
exports.PreferencesSystemTimeIcon = PreferencesSystemTime;
exports.PreferencesSystemTimeSymbolic = PreferencesSystemTime;
exports.Printer = Printer;
exports.PrinterError = PrinterError;
exports.PrinterErrorIcon = PrinterError;
exports.PrinterErrorSymbolic = PrinterError;
exports.PrinterIcon = Printer;
exports.PrinterNetwork = PrinterNetwork;
exports.PrinterNetworkIcon = PrinterNetwork;
exports.PrinterNetworkSymbolic = PrinterNetwork;
exports.PrinterPrinting = PrinterPrinting;
exports.PrinterPrintingIcon = PrinterPrinting;
exports.PrinterPrintingSymbolic = PrinterPrinting;
exports.PrinterSymbolic = Printer;
exports.PrinterWarning = PrinterWarning;
exports.PrinterWarningIcon = PrinterWarning;
exports.PrinterWarningSymbolic = PrinterWarning;
exports.ProcessStop = ProcessStop;
exports.ProcessStopIcon = ProcessStop;
exports.ProcessStopSymbolic = ProcessStop;
exports.Radio = Radio;
exports.RadioChecked = RadioChecked;
exports.RadioCheckedIcon = RadioChecked;
exports.RadioCheckedSymbolic = RadioChecked;
exports.RadioIcon = Radio;
exports.RadioMixed = RadioMixed;
exports.RadioMixedIcon = RadioMixed;
exports.RadioMixedSymbolic = RadioMixed;
exports.RadioSymbolic = Radio;
exports.RotationAllowed = RotationAllowed;
exports.RotationAllowedIcon = RotationAllowed;
exports.RotationAllowedSymbolic = RotationAllowed;
exports.RotationLocked = RotationLocked;
exports.RotationLockedIcon = RotationLocked;
exports.RotationLockedSymbolic = RotationLocked;
exports.Scanner = Scanner;
exports.ScannerIcon = Scanner;
exports.ScannerSymbolic = Scanner;
exports.ScreenShared = ScreenShared;
exports.ScreenSharedIcon = ScreenShared;
exports.ScreenSharedSymbolic = ScreenShared;
exports.SecurityHigh = SecurityHigh;
exports.SecurityHighIcon = SecurityHigh;
exports.SecurityHighSymbolic = SecurityHigh;
exports.SecurityLow = SecurityLow;
exports.SecurityLowIcon = SecurityLow;
exports.SecurityLowSymbolic = SecurityLow;
exports.SecurityMedium = SecurityMedium;
exports.SecurityMediumIcon = SecurityMedium;
exports.SecurityMediumRtl = SecurityMediumRtl;
exports.SecurityMediumRtlIcon = SecurityMediumRtl;
exports.SecurityMediumRtlSymbolic = SecurityMediumRtl;
exports.SecurityMediumSymbolic = SecurityMedium;
exports.SelectionEnd = SelectionEnd;
exports.SelectionEndIcon = SelectionEnd;
exports.SelectionEndSymbolic = SelectionEnd;
exports.SelectionMode = SelectionMode;
exports.SelectionModeIcon = SelectionMode;
exports.SelectionModeSymbolic = SelectionMode;
exports.SelectionStart = SelectionStart;
exports.SelectionStartIcon = SelectionStart;
exports.SelectionStartSymbolic = SelectionStart;
exports.SemiStarred = SemiStarred;
exports.SemiStarredIcon = SemiStarred;
exports.SemiStarredRtl = SemiStarredRtl;
exports.SemiStarredRtlIcon = SemiStarredRtl;
exports.SemiStarredRtlSymbolic = SemiStarredRtl;
exports.SemiStarredSymbolic = SemiStarred;
exports.SendTo = SendTo;
exports.SendToIcon = SendTo;
exports.SendToSymbolic = SendTo;
exports.SidebarShow = SidebarShow;
exports.SidebarShowIcon = SidebarShow;
exports.SidebarShowRight = SidebarShowRight;
exports.SidebarShowRightIcon = SidebarShowRight;
exports.SidebarShowRightSymbolic = SidebarShowRight;
exports.SidebarShowSymbolic = SidebarShow;
exports.SoftwareUpdateAvailable = SoftwareUpdateAvailable;
exports.SoftwareUpdateAvailableIcon = SoftwareUpdateAvailable;
exports.SoftwareUpdateAvailableSymbolic = SoftwareUpdateAvailable;
exports.SoftwareUpdateUrgent = SoftwareUpdateUrgent;
exports.SoftwareUpdateUrgentIcon = SoftwareUpdateUrgent;
exports.SoftwareUpdateUrgentSymbolic = SoftwareUpdateUrgent;
exports.StarNew = StarNew;
exports.StarNewIcon = StarNew;
exports.StarNewSymbolic = StarNew;
exports.Starred = Starred;
exports.StarredIcon = Starred;
exports.StarredSymbolic = Starred;
exports.StartHere = StartHere;
exports.StartHereIcon = StartHere;
exports.StartHereSymbolic = StartHere;
exports.SystemFileManager = SystemFileManager;
exports.SystemFileManagerIcon = SystemFileManager;
exports.SystemFileManagerSymbolic = SystemFileManager;
exports.SystemHelp = SystemHelp;
exports.SystemHelpIcon = SystemHelp;
exports.SystemHelpSymbolic = SystemHelp;
exports.SystemLockScreen = SystemLockScreen;
exports.SystemLockScreenIcon = SystemLockScreen;
exports.SystemLockScreenSymbolic = SystemLockScreen;
exports.SystemLogOut = SystemLogOut;
exports.SystemLogOutIcon = SystemLogOut;
exports.SystemLogOutRtl = SystemLogOutRtl;
exports.SystemLogOutRtlIcon = SystemLogOutRtl;
exports.SystemLogOutRtlSymbolic = SystemLogOutRtl;
exports.SystemLogOutSymbolic = SystemLogOut;
exports.SystemReboot = SystemReboot;
exports.SystemRebootIcon = SystemReboot;
exports.SystemRebootSymbolic = SystemReboot;
exports.SystemRun = SystemRun;
exports.SystemRunIcon = SystemRun;
exports.SystemRunSymbolic = SystemRun;
exports.SystemSearch = SystemSearch;
exports.SystemSearchIcon = SystemSearch;
exports.SystemSearchSymbolic = SystemSearch;
exports.SystemShutdown = SystemShutdown;
exports.SystemShutdownIcon = SystemShutdown;
exports.SystemShutdownSymbolic = SystemShutdown;
exports.SystemSoftwareInstall = SystemSoftwareInstall;
exports.SystemSoftwareInstallIcon = SystemSoftwareInstall;
exports.SystemSoftwareInstallSymbolic = SystemSoftwareInstall;
exports.SystemSwitchUser = SystemSwitchUser;
exports.SystemSwitchUserIcon = SystemSwitchUser;
exports.SystemSwitchUserRtl = SystemSwitchUserRtl;
exports.SystemSwitchUserRtlIcon = SystemSwitchUserRtl;
exports.SystemSwitchUserRtlSymbolic = SystemSwitchUserRtl;
exports.SystemSwitchUserSymbolic = SystemSwitchUser;
exports.SystemUsers = SystemUsers;
exports.SystemUsersIcon = SystemUsers;
exports.SystemUsersSymbolic = SystemUsers;
exports.TabNew = TabNew;
exports.TabNewIcon = TabNew;
exports.TabNewSymbolic = TabNew;
exports.Tablet = Tablet;
exports.TabletIcon = Tablet;
exports.TabletSymbolic = Tablet;
exports.TaskDue = TaskDue;
exports.TaskDueIcon = TaskDue;
exports.TaskDueSymbolic = TaskDue;
exports.TaskPastDue = TaskPastDue;
exports.TaskPastDueIcon = TaskPastDue;
exports.TaskPastDueSymbolic = TaskPastDue;
exports.TextEditor = TextEditor;
exports.TextEditorIcon = TextEditor;
exports.TextEditorSymbolic = TextEditor;
exports.TextXGeneric = TextXGeneric;
exports.TextXGenericIcon = TextXGeneric;
exports.TextXGenericSymbolic = TextXGeneric;
exports.Thunderbolt = Thunderbolt;
exports.ThunderboltAcquiring = ThunderboltAcquiring;
exports.ThunderboltAcquiringIcon = ThunderboltAcquiring;
exports.ThunderboltAcquiringSymbolic = ThunderboltAcquiring;
exports.ThunderboltIcon = Thunderbolt;
exports.ThunderboltSymbolic = Thunderbolt;
exports.ToolsCheckSpelling = ToolsCheckSpelling;
exports.ToolsCheckSpellingIcon = ToolsCheckSpelling;
exports.ToolsCheckSpellingSymbolic = ToolsCheckSpelling;
exports.TouchDisabled = TouchDisabled;
exports.TouchDisabledIcon = TouchDisabled;
exports.TouchDisabledSymbolic = TouchDisabled;
exports.TouchpadDisabled = TouchpadDisabled;
exports.TouchpadDisabledIcon = TouchpadDisabled;
exports.TouchpadDisabledSymbolic = TouchpadDisabled;
exports.Tv = Tv;
exports.TvIcon = Tv;
exports.TvSymbolic = Tv;
exports.UninterruptiblePowerSupply = UninterruptiblePowerSupply;
exports.UninterruptiblePowerSupplyIcon = UninterruptiblePowerSupply;
exports.UninterruptiblePowerSupplySymbolic = UninterruptiblePowerSupply;
exports.UserAvailable = UserAvailable;
exports.UserAvailableIcon = UserAvailable;
exports.UserAvailableSymbolic = UserAvailable;
exports.UserAway = UserAway;
exports.UserAwayIcon = UserAway;
exports.UserAwaySymbolic = UserAway;
exports.UserBookmarks = UserBookmarks;
exports.UserBookmarksIcon = UserBookmarks;
exports.UserBookmarksSymbolic = UserBookmarks;
exports.UserBusy = UserBusy;
exports.UserBusyIcon = UserBusy;
exports.UserBusySymbolic = UserBusy;
exports.UserDesktop = UserDesktop;
exports.UserDesktopIcon = UserDesktop;
exports.UserDesktopSymbolic = UserDesktop;
exports.UserHome = UserHome;
exports.UserHomeIcon = UserHome;
exports.UserHomeSymbolic = UserHome;
exports.UserIdle = UserIdle;
exports.UserIdleIcon = UserIdle;
exports.UserIdleSymbolic = UserIdle;
exports.UserInfo = UserInfo;
exports.UserInfoIcon = UserInfo;
exports.UserInfoSymbolic = UserInfo;
exports.UserInvisible = UserInvisible;
exports.UserInvisibleIcon = UserInvisible;
exports.UserInvisibleSymbolic = UserInvisible;
exports.UserNotTracked = UserNotTracked;
exports.UserNotTrackedIcon = UserNotTracked;
exports.UserNotTrackedSymbolic = UserNotTracked;
exports.UserOffline = UserOffline;
exports.UserOfflineIcon = UserOffline;
exports.UserOfflineSymbolic = UserOffline;
exports.UserStatusPending = UserStatusPending;
exports.UserStatusPendingIcon = UserStatusPending;
exports.UserStatusPendingSymbolic = UserStatusPending;
exports.UserTrash = UserTrash;
exports.UserTrashFull = UserTrashFull;
exports.UserTrashFullIcon = UserTrashFull;
exports.UserTrashFullSymbolic = UserTrashFull;
exports.UserTrashIcon = UserTrash;
exports.UserTrashSymbolic = UserTrash;
exports.UtilitiesTerminal = UtilitiesTerminal;
exports.UtilitiesTerminalIcon = UtilitiesTerminal;
exports.UtilitiesTerminalSymbolic = UtilitiesTerminal;
exports.ValueDecrease = ValueDecrease;
exports.ValueDecreaseIcon = ValueDecrease;
exports.ValueDecreaseSymbolic = ValueDecrease;
exports.ValueIncrease = ValueIncrease;
exports.ValueIncreaseIcon = ValueIncrease;
exports.ValueIncreaseSymbolic = ValueIncrease;
exports.VideoDisplay = VideoDisplay;
exports.VideoDisplayIcon = VideoDisplay;
exports.VideoDisplaySymbolic = VideoDisplay;
exports.VideoJoinedDisplays = VideoJoinedDisplays;
exports.VideoJoinedDisplaysIcon = VideoJoinedDisplays;
exports.VideoJoinedDisplaysSymbolic = VideoJoinedDisplays;
exports.VideoSingleDisplay = VideoSingleDisplay;
exports.VideoSingleDisplayIcon = VideoSingleDisplay;
exports.VideoSingleDisplaySymbolic = VideoSingleDisplay;
exports.VideoXGeneric = VideoXGeneric;
exports.VideoXGenericIcon = VideoXGeneric;
exports.VideoXGenericSymbolic = VideoXGeneric;
exports.ViewAppGrid = ViewAppGrid;
exports.ViewAppGridIcon = ViewAppGrid;
exports.ViewAppGridSymbolic = ViewAppGrid;
exports.ViewConceal = ViewConceal;
exports.ViewConcealIcon = ViewConceal;
exports.ViewConcealSymbolic = ViewConceal;
exports.ViewContinuous = ViewContinuous;
exports.ViewContinuousIcon = ViewContinuous;
exports.ViewContinuousSymbolic = ViewContinuous;
exports.ViewDual = ViewDual;
exports.ViewDualIcon = ViewDual;
exports.ViewDualSymbolic = ViewDual;
exports.ViewFullscreen = ViewFullscreen;
exports.ViewFullscreenIcon = ViewFullscreen;
exports.ViewFullscreenSymbolic = ViewFullscreen;
exports.ViewGrid = ViewGrid;
exports.ViewGridIcon = ViewGrid;
exports.ViewGridSymbolic = ViewGrid;
exports.ViewList = ViewList;
exports.ViewListBullet = ViewListBullet;
exports.ViewListBulletIcon = ViewListBullet;
exports.ViewListBulletRtl = ViewListBulletRtl;
exports.ViewListBulletRtlIcon = ViewListBulletRtl;
exports.ViewListBulletRtlSymbolic = ViewListBulletRtl;
exports.ViewListBulletSymbolic = ViewListBullet;
exports.ViewListIcon = ViewList;
exports.ViewListOrdered = ViewListOrdered;
exports.ViewListOrderedIcon = ViewListOrdered;
exports.ViewListOrderedRtl = ViewListOrderedRtl;
exports.ViewListOrderedRtlIcon = ViewListOrderedRtl;
exports.ViewListOrderedRtlSymbolic = ViewListOrderedRtl;
exports.ViewListOrderedSymbolic = ViewListOrdered;
exports.ViewListRtl = ViewListRtl;
exports.ViewListRtlIcon = ViewListRtl;
exports.ViewListRtlSymbolic = ViewListRtl;
exports.ViewListSymbolic = ViewList;
exports.ViewMirror = ViewMirror;
exports.ViewMirrorIcon = ViewMirror;
exports.ViewMirrorSymbolic = ViewMirror;
exports.ViewMore = ViewMore;
exports.ViewMoreHorizontal = ViewMoreHorizontal;
exports.ViewMoreHorizontalIcon = ViewMoreHorizontal;
exports.ViewMoreHorizontalSymbolic = ViewMoreHorizontal;
exports.ViewMoreIcon = ViewMore;
exports.ViewMoreSymbolic = ViewMore;
exports.ViewPaged = ViewPaged;
exports.ViewPagedIcon = ViewPaged;
exports.ViewPagedRtl = ViewPagedRtl;
exports.ViewPagedRtlIcon = ViewPagedRtl;
exports.ViewPagedRtlSymbolic = ViewPagedRtl;
exports.ViewPagedSymbolic = ViewPaged;
exports.ViewPin = ViewPin;
exports.ViewPinIcon = ViewPin;
exports.ViewPinSymbolic = ViewPin;
exports.ViewRefresh = ViewRefresh;
exports.ViewRefreshIcon = ViewRefresh;
exports.ViewRefreshSymbolic = ViewRefresh;
exports.ViewRestore = ViewRestore;
exports.ViewRestoreIcon = ViewRestore;
exports.ViewRestoreSymbolic = ViewRestore;
exports.ViewReveal = ViewReveal;
exports.ViewRevealIcon = ViewReveal;
exports.ViewRevealSymbolic = ViewReveal;
exports.ViewSortAscending = ViewSortAscending;
exports.ViewSortAscendingIcon = ViewSortAscending;
exports.ViewSortAscendingRtl = ViewSortAscendingRtl;
exports.ViewSortAscendingRtlIcon = ViewSortAscendingRtl;
exports.ViewSortAscendingRtlSymbolic = ViewSortAscendingRtl;
exports.ViewSortAscendingSymbolic = ViewSortAscending;
exports.ViewSortDescending = ViewSortDescending;
exports.ViewSortDescendingIcon = ViewSortDescending;
exports.ViewSortDescendingRtl = ViewSortDescendingRtl;
exports.ViewSortDescendingRtlIcon = ViewSortDescendingRtl;
exports.ViewSortDescendingRtlSymbolic = ViewSortDescendingRtl;
exports.ViewSortDescendingSymbolic = ViewSortDescending;
exports.ViewWrapped = ViewWrapped;
exports.ViewWrappedIcon = ViewWrapped;
exports.ViewWrappedRtl = ViewWrappedRtl;
exports.ViewWrappedRtlIcon = ViewWrappedRtl;
exports.ViewWrappedRtlSymbolic = ViewWrappedRtl;
exports.ViewWrappedSymbolic = ViewWrapped;
exports.WeatherClear = WeatherClear;
exports.WeatherClearIcon = WeatherClear;
exports.WeatherClearNight = WeatherClearNight;
exports.WeatherClearNightIcon = WeatherClearNight;
exports.WeatherClearNightSymbolic = WeatherClearNight;
exports.WeatherClearSymbolic = WeatherClear;
exports.WeatherFewClouds = WeatherFewClouds;
exports.WeatherFewCloudsIcon = WeatherFewClouds;
exports.WeatherFewCloudsNight = WeatherFewCloudsNight;
exports.WeatherFewCloudsNightIcon = WeatherFewCloudsNight;
exports.WeatherFewCloudsNightSymbolic = WeatherFewCloudsNight;
exports.WeatherFewCloudsSymbolic = WeatherFewClouds;
exports.WeatherFog = WeatherFog;
exports.WeatherFogIcon = WeatherFog;
exports.WeatherFogSymbolic = WeatherFog;
exports.WeatherOvercast = WeatherOvercast;
exports.WeatherOvercastIcon = WeatherOvercast;
exports.WeatherOvercastSymbolic = WeatherOvercast;
exports.WeatherSevereAlert = WeatherSevereAlert;
exports.WeatherSevereAlertIcon = WeatherSevereAlert;
exports.WeatherSevereAlertSymbolic = WeatherSevereAlert;
exports.WeatherShowers = WeatherShowers;
exports.WeatherShowersIcon = WeatherShowers;
exports.WeatherShowersScattered = WeatherShowersScattered;
exports.WeatherShowersScatteredIcon = WeatherShowersScattered;
exports.WeatherShowersScatteredSymbolic = WeatherShowersScattered;
exports.WeatherShowersSymbolic = WeatherShowers;
exports.WeatherSnow = WeatherSnow;
exports.WeatherSnowIcon = WeatherSnow;
exports.WeatherSnowSymbolic = WeatherSnow;
exports.WeatherStorm = WeatherStorm;
exports.WeatherStormIcon = WeatherStorm;
exports.WeatherStormSymbolic = WeatherStorm;
exports.WeatherTornado = WeatherTornado;
exports.WeatherTornadoIcon = WeatherTornado;
exports.WeatherTornadoSymbolic = WeatherTornado;
exports.WeatherWindy = WeatherWindy;
exports.WeatherWindyIcon = WeatherWindy;
exports.WeatherWindySymbolic = WeatherWindy;
exports.WebBrowser = WebBrowser;
exports.WebBrowserIcon = WebBrowser;
exports.WebBrowserSymbolic = WebBrowser;
exports.WindowClose = WindowClose;
exports.WindowCloseIcon = WindowClose;
exports.WindowCloseSymbolic = WindowClose;
exports.WindowMaximize = WindowMaximize;
exports.WindowMaximizeIcon = WindowMaximize;
exports.WindowMaximizeSymbolic = WindowMaximize;
exports.WindowMinimize = WindowMinimize;
exports.WindowMinimizeIcon = WindowMinimize;
exports.WindowMinimizeSymbolic = WindowMinimize;
exports.WindowNew = WindowNew;
exports.WindowNewIcon = WindowNew;
exports.WindowNewSymbolic = WindowNew;
exports.WindowRestore = WindowRestore;
exports.WindowRestoreIcon = WindowRestore;
exports.WindowRestoreSymbolic = WindowRestore;
exports.XOfficeAddressBook = XOfficeAddressBook;
exports.XOfficeAddressBookIcon = XOfficeAddressBook;
exports.XOfficeAddressBookSymbolic = XOfficeAddressBook;
exports.XOfficeCalendar = XOfficeCalendar;
exports.XOfficeCalendarIcon = XOfficeCalendar;
exports.XOfficeCalendarSymbolic = XOfficeCalendar;
exports.XOfficeDocument = XOfficeDocument;
exports.XOfficeDocumentIcon = XOfficeDocument;
exports.XOfficeDocumentSymbolic = XOfficeDocument;
exports.XOfficeDrawing = XOfficeDrawing;
exports.XOfficeDrawingIcon = XOfficeDrawing;
exports.XOfficeDrawingSymbolic = XOfficeDrawing;
exports.XOfficePresentation = XOfficePresentation;
exports.XOfficePresentationIcon = XOfficePresentation;
exports.XOfficePresentationSymbolic = XOfficePresentation;
exports.XOfficeSpreadsheet = XOfficeSpreadsheet;
exports.XOfficeSpreadsheetIcon = XOfficeSpreadsheet;
exports.XOfficeSpreadsheetSymbolic = XOfficeSpreadsheet;
exports.ZoomFitBest = ZoomFitBest;
exports.ZoomFitBestIcon = ZoomFitBest;
exports.ZoomFitBestSymbolic = ZoomFitBest;
exports.ZoomIn = ZoomIn;
exports.ZoomInIcon = ZoomIn;
exports.ZoomInSymbolic = ZoomIn;
exports.ZoomOriginal = ZoomOriginal;
exports.ZoomOriginalIcon = ZoomOriginal;
exports.ZoomOriginalSymbolic = ZoomOriginal;
exports.ZoomOut = ZoomOut;
exports.ZoomOutIcon = ZoomOut;
exports.ZoomOutSymbolic = ZoomOut;
exports.createAdwaitaIcon = createAdwaitaIcon;
exports.icons = index;
exports.useAdwaitaContext = useAdwaitaContext;
//# sourceMappingURL=adwaita_react.js.map
