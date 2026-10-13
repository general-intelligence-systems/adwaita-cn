import buildAdwaitaIconNode from './buildAdwaitaIconNode';
import type { AdwaitaBuildParams, AdwaitaIconData, AdwaitaIconNode } from './types';

const entities = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
} as const;

const escapeAttribute = (value: string) =>
  value.replace(/[&<>"']/g, (char) => entities[char as keyof typeof entities]);

const buildDomNode = ([tagName, attributes, children = []]: AdwaitaIconNode): string =>
  `<${tagName} ${Object.entries(attributes)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([attrName, value]) => `${attrName}="${escapeAttribute(String(value))}"`)
    .join(' ')}>${children?.map((child) => buildDomNode(child)).join('')}</${tagName}>`;

/**
 * Creates an SVG string from a Adwaita icon object.
 *
 * @param icon The icon to build.
 * @param params Additional build parameters.
 */
function buildAdwaitaSvg(icon: AdwaitaIconData, params: AdwaitaBuildParams = {}) {
  return buildDomNode(buildAdwaitaIconNode(icon, params));
}

export default buildAdwaitaSvg;
