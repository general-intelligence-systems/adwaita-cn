// `shadcn add` wants an absolute URL, and a page rendered at build time cannot
// read window.location, so the deployed host is named here rather than guessed.
export const siteUrl = "https://general-intelligence-systems.github.io/adwaita-cn"

export function itemUrl(name: string) {
  return `${siteUrl}/r/${name}.json`
}
