/**
 * The root attributes every Adwaita icon carries, in React's spelling.
 *
 * Where lucide's defaults describe a 24px stroked drawing -- `fill: none`, `stroke:
 * currentColor`, a stroke width and its joins -- Adwaita's describe a 16px filled one. The
 * grid is 16 because that is the size GTK draws a symbolic icon at, and the paint is a fill
 * because that is what the GNOME icon set is. There is no stroke default: the libadwaita
 * icons that are stroked carry their own stroke attributes per path, since they are the
 * exception rather than the rule.
 */
const defaultReactAttributes = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'currentColor',
} as const;

export default defaultReactAttributes;
