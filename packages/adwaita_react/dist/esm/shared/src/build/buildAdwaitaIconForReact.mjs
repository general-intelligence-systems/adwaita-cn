import buildAdwaitaIconNode from './buildAdwaitaIconNode.mjs';

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

export { buildAdwaitaIconForReact as default };
//# sourceMappingURL=buildAdwaitaIconForReact.mjs.map
