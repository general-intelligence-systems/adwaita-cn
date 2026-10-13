/* A sidebar application: a list down the left, a page on the right.
 *
 * The same scene as App.tsx beside this. This one is built with the toolkit, so what it
 * lays out is what the components have to match -- bin/02-app-trees walks it and writes
 * out every node, where it was put and what it draws.
 */

#include <adwaita.h>

/* Title, subtitle, and the initials the avatar falls back to. */
static const char *const adw_cn_library_people[][3] = {
  { "Ada Lovelace", "Mathematician", "AL" },
  { "Alan Turing", "Computer scientist", "AT" },
  { "Grace Hopper", "Rear admiral", "GH" },
  { "Katherine Johnson", "Physicist", "KJ" },
  { NULL, NULL, NULL },
};

GtkWidget *
adw_cn_build_library (void)
{
  AdwNavigationSplitView *split = ADW_NAVIGATION_SPLIT_VIEW (adw_navigation_split_view_new ());

  /* ── the sidebar ─────────────────────────────────────────────────────── */

  AdwToolbarView *sidebar_toolbar = ADW_TOOLBAR_VIEW (adw_toolbar_view_new ());
  AdwHeaderBar *sidebar_header = ADW_HEADER_BAR (adw_header_bar_new ());

  /* The search entry IS the sidebar's title, rather than something under it. */
  GtkWidget *search = gtk_search_entry_new ();

  gtk_search_entry_set_placeholder_text (GTK_SEARCH_ENTRY (search), "Search");
  gtk_widget_set_hexpand (search, TRUE);
  adw_header_bar_set_title_widget (sidebar_header, search);

  GtkWidget *add = gtk_button_new_from_icon_name ("list-add-symbolic");

  gtk_widget_add_css_class (add, "flat");
  adw_header_bar_pack_end (sidebar_header, add);

  adw_toolbar_view_add_top_bar (sidebar_toolbar, GTK_WIDGET (sidebar_header));

  GtkListBox *list = GTK_LIST_BOX (gtk_list_box_new ());

  gtk_widget_add_css_class (GTK_WIDGET (list), "navigation-sidebar");
  gtk_list_box_set_selection_mode (list, GTK_SELECTION_SINGLE);

  for (gsize i = 0; adw_cn_library_people[i][0]; i++)
    {
      AdwActionRow *row = ADW_ACTION_ROW (adw_action_row_new ());

      adw_preferences_row_set_title (ADW_PREFERENCES_ROW (row), adw_cn_library_people[i][0]);
      adw_action_row_set_subtitle (row, adw_cn_library_people[i][1]);
      adw_action_row_add_prefix (row, adw_avatar_new (32, adw_cn_library_people[i][2], TRUE));

      gtk_list_box_append (list, GTK_WIDGET (row));
    }

  adw_toolbar_view_set_content (sidebar_toolbar, GTK_WIDGET (list));

  /* ── the content ─────────────────────────────────────────────────────── */

  AdwToolbarView *content_toolbar = ADW_TOOLBAR_VIEW (adw_toolbar_view_new ());
  AdwHeaderBar *content_header = ADW_HEADER_BAR (adw_header_bar_new ());

  adw_header_bar_set_title_widget (content_header,
                                   adw_window_title_new ("Ada Lovelace", "Mathematician"));

  GtkWidget *menu = gtk_button_new_from_icon_name ("open-menu-symbolic");

  gtk_widget_add_css_class (menu, "flat");
  adw_header_bar_pack_end (content_header, menu);

  adw_toolbar_view_add_top_bar (content_toolbar, GTK_WIDGET (content_header));

  AdwStatusPage *status = ADW_STATUS_PAGE (adw_status_page_new ());

  adw_status_page_set_icon_name (status, "avatar-default-symbolic");
  adw_status_page_set_title (status, "Ada Lovelace");
  adw_status_page_set_description (status, "Select a different person to see their details.");

  GtkWidget *open = gtk_button_new_with_label ("Open");

  gtk_widget_set_halign (open, GTK_ALIGN_CENTER);
  gtk_widget_add_css_class (open, "pill");
  gtk_widget_add_css_class (open, "suggested-action");
  adw_status_page_set_child (status, open);

  adw_toolbar_view_set_content (content_toolbar, GTK_WIDGET (status));

  /* A split view's halves are pages and not widgets: the page carries the title the
   * other half's back button is labelled with when the two collapse into one. */
  adw_navigation_split_view_set_sidebar (split,
    ADW_NAVIGATION_PAGE (adw_navigation_page_new (GTK_WIDGET (sidebar_toolbar), "Library")));
  adw_navigation_split_view_set_content (split,
    ADW_NAVIGATION_PAGE (adw_navigation_page_new (GTK_WIDGET (content_toolbar), "Details")));
  adw_navigation_split_view_set_min_sidebar_width (split, 260);

  return GTK_WIDGET (split);
}
