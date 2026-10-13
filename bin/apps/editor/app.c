/* A text editor: tabbed documents, a find bar over the text, and a status bar under it.
 *
 * The same scene as App.tsx beside this. This one is built with the toolkit, so what it
 * lays out is what the components have to match -- bin/02-app-trees walks it and writes
 * out every node, where it was put and what it draws.
 */

#include <adwaita.h>

static const char *const adw_cn_editor_documents[] = {
  "notes.md", "README", "LICENCE", NULL,
};

static const char adw_cn_editor_text[] =
  "# Notes\n"
  "\n"
  "The editor is a tab view of documents, a find bar over the text and a\n"
  "status bar under it.\n"
  "\n"
  "Everything here is drawn by the components beside it.\n";

G_GNUC_BEGIN_IGNORE_DEPRECATIONS

GtkWidget *
adw_cn_build_editor (void)
{
  AdwTabOverview *overview = ADW_TAB_OVERVIEW (adw_tab_overview_new ());
  AdwTabView *tabs = ADW_TAB_VIEW (adw_tab_view_new ());

  adw_tab_overview_set_view (overview, tabs);

  AdwToolbarView *view = ADW_TOOLBAR_VIEW (adw_toolbar_view_new ());

  adw_tab_overview_set_child (overview, GTK_WIDGET (view));

  /* ── the header ──────────────────────────────────────────────────────── */

  AdwHeaderBar *bar = ADW_HEADER_BAR (adw_header_bar_new ());

  AdwTabButton *tab_button = ADW_TAB_BUTTON (adw_tab_button_new ());

  adw_tab_button_set_view (tab_button, tabs);
  adw_header_bar_pack_start (bar, GTK_WIDGET (tab_button));

  AdwSplitButton *save = ADW_SPLIT_BUTTON (adw_split_button_new ());

  adw_split_button_set_label (save, "Save");
  gtk_widget_add_css_class (GTK_WIDGET (save), "suggested-action");
  adw_header_bar_pack_start (bar, GTK_WIDGET (save));

  GtkWidget *menu = gtk_menu_button_new ();

  gtk_menu_button_set_icon_name (GTK_MENU_BUTTON (menu), "open-menu-symbolic");
  gtk_widget_add_css_class (menu, "flat");
  adw_header_bar_pack_end (bar, menu);

  adw_toolbar_view_add_top_bar (view, GTK_WIDGET (bar));

  /* ── the tabs, and the find bar over the text ────────────────────────── */

  AdwTabBar *tab_bar = ADW_TAB_BAR (adw_tab_bar_new ());

  adw_tab_bar_set_view (tab_bar, tabs);
  adw_toolbar_view_add_top_bar (view, GTK_WIDGET (tab_bar));

  GtkSearchBar *search_bar = GTK_SEARCH_BAR (gtk_search_bar_new ());
  GtkWidget *search = gtk_search_entry_new ();

  gtk_search_entry_set_placeholder_text (GTK_SEARCH_ENTRY (search), "Find in document");
  gtk_search_bar_set_child (search_bar, search);
  gtk_search_bar_set_search_mode (search_bar, TRUE);
  adw_toolbar_view_add_top_bar (view, GTK_WIDGET (search_bar));

  for (gsize i = 0; adw_cn_editor_documents[i]; i++)
    {
      GtkWidget *document = gtk_label_new (adw_cn_editor_documents[i]);

      gtk_widget_add_css_class (document, "dim-label");
      adw_tab_page_set_title (adw_tab_view_append (tabs, document),
                              adw_cn_editor_documents[i]);
    }

  /* ── the text ────────────────────────────────────────────────────────── */

  GtkWidget *scrolled = gtk_scrolled_window_new ();
  GtkWidget *text = gtk_text_view_new ();

  gtk_text_buffer_set_text (gtk_text_view_get_buffer (GTK_TEXT_VIEW (text)),
                            adw_cn_editor_text, -1);
  gtk_text_view_set_monospace (GTK_TEXT_VIEW (text), TRUE);
  gtk_text_view_set_left_margin (GTK_TEXT_VIEW (text), 12);
  gtk_text_view_set_right_margin (GTK_TEXT_VIEW (text), 12);
  gtk_text_view_set_top_margin (GTK_TEXT_VIEW (text), 12);

  gtk_scrolled_window_set_child (GTK_SCROLLED_WINDOW (scrolled), text);
  adw_toolbar_view_set_content (view, scrolled);

  /* ── the status bar ──────────────────────────────────────────────────── */

  GtkActionBar *actions = GTK_ACTION_BAR (gtk_action_bar_new ());
  GtkWidget *status = gtk_statusbar_new ();

  gtk_statusbar_push (GTK_STATUSBAR (status),
                      gtk_statusbar_get_context_id (GTK_STATUSBAR (status), "editor"),
                      "Ln 1, Col 1");
  gtk_action_bar_pack_start (actions, status);

  /* A bare GtkText rather than an entry: it is what an entry is built from, and the
   * line-number box is the one place this application wants it unadorned. */
  GtkWidget *line = gtk_text_new ();

  gtk_editable_set_text (GTK_EDITABLE (line), "1");
  gtk_editable_set_width_chars (GTK_EDITABLE (line), 4);
  gtk_action_bar_pack_end (actions, line);

  gtk_action_bar_set_revealed (actions, TRUE);
  adw_toolbar_view_add_bottom_bar (view, GTK_WIDGET (actions));

  return GTK_WIDGET (overview);
}

G_GNUC_END_IGNORE_DEPRECATIONS
