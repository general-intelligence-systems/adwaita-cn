/** A page of an Adw.ViewStack, as its switchers read it. */
export interface ViewPage {
  /** The name `adw_view_stack_add_titled` filed the page under. */
  name: string
  /** The page's title, which a switcher shows as its label. */
  title?: string
  /** The page's icon, which a switcher shows above or beside the label. */
  iconName?: string
  /** AdwViewStackPage:badge-number. Shown in the indicator when it is not zero. */
  badgeNumber?: number
  /** AdwViewStackPage:needs-attention. Shown as a dot when there is no badge. */
  needsAttention?: boolean
}
