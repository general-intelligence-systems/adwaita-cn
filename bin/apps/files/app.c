/* A file manager: places down the side, the folder's contents beside them.
 *
 * The same scene as App.tsx beside this. This one is built with the toolkit, so what it
 * lays out is what the components have to match -- bin/02-app-trees walks it and writes
 * out every node, where it was put and what it draws.
 */

#include <adwaita.h>

static const char *const adw_cn_files_entries[] = {
  "Reports", "Invoices", "notes.md", "photo.jpg", "archive.zip", NULL,
};

static void
adw_cn_files_setup (GtkSignalListItemFactory *factory,
                    GtkListItem              *item,
                    gpointer                  data)
{
  (void) factory;
  (void) data;

  GtkWidget *label = gtk_label_new (NULL);

  gtk_label_set_xalign (GTK_LABEL (label), 0.0);
  gtk_list_item_set_child (item, label);
}

static void
adw_cn_files_bind (GtkSignalListItemFactory *factory,
                   GtkListItem              *item,
                   gpointer                  data)
{
  (void) factory;
  (void) data;

  GtkStringObject *string = GTK_STRING_OBJECT (gtk_list_item_get_item (item));

  gtk_label_set_text (GTK_LABEL (gtk_list_item_get_child (item)),
                      gtk_string_object_get_string (string));
}

/* A folder's row carries the expander which opens it, which is where a file manager
 * puts one. */
static void
adw_cn_files_name_setup (GtkSignalListItemFactory *factory,
                         GtkListItem              *item,
                         gpointer                  data)
{
  (void) factory;
  (void) data;

  GtkWidget *expander = gtk_tree_expander_new ();
  GtkWidget *label = gtk_label_new (NULL);

  gtk_label_set_xalign (GTK_LABEL (label), 0.0);
  gtk_tree_expander_set_child (GTK_TREE_EXPANDER (expander), label);
  gtk_list_item_set_child (item, expander);
}

static void
adw_cn_files_name_bind (GtkSignalListItemFactory *factory,
                        GtkListItem              *item,
                        gpointer                  data)
{
  (void) factory;
  (void) data;

  GtkTreeExpander *expander = GTK_TREE_EXPANDER (gtk_list_item_get_child (item));
  GtkStringObject *string = GTK_STRING_OBJECT (gtk_list_item_get_item (item));

  gtk_label_set_text (GTK_LABEL (gtk_tree_expander_get_child (expander)),
                      gtk_string_object_get_string (string));
}

static GtkListItemFactory *
adw_cn_files_factory (void)
{
  GtkListItemFactory *factory = gtk_signal_list_item_factory_new ();

  g_signal_connect (factory, "setup", G_CALLBACK (adw_cn_files_setup), NULL);
  g_signal_connect (factory, "bind", G_CALLBACK (adw_cn_files_bind), NULL);

  return factory;
}

GtkWidget *
adw_cn_build_files (void)
{
  AdwOverlaySplitView *split = ADW_OVERLAY_SPLIT_VIEW (adw_overlay_split_view_new ());

  adw_overlay_split_view_set_min_sidebar_width (split, 200);
  adw_overlay_split_view_set_max_sidebar_width (split, 240);

  GtkWidget *sidebar = adw_sidebar_new ();

  gtk_widget_set_size_request (sidebar, 200, -1);
  adw_overlay_split_view_set_sidebar (split, sidebar);
  adw_overlay_split_view_set_show_sidebar (split, TRUE);

  AdwToolbarView *view = ADW_TOOLBAR_VIEW (adw_toolbar_view_new ());
  AdwHeaderBar *bar = ADW_HEADER_BAR (adw_header_bar_new ());

  adw_header_bar_set_title_widget (bar, adw_window_title_new ("Documents", "5 items"));

  GtkWidget *back = gtk_button_new_from_icon_name ("go-previous-symbolic");

  gtk_widget_add_css_class (back, "flat");
  adw_header_bar_pack_start (bar, back);

  /* The two ways a file manager shows a folder, one of which is on screen. */
  GtkStack *views = GTK_STACK (gtk_stack_new ());
  GtkWidget *switcher = gtk_stack_switcher_new ();

  gtk_stack_switcher_set_stack (GTK_STACK_SWITCHER (switcher), views);
  adw_header_bar_pack_start (bar, switcher);

  GtkWidget *search = gtk_search_entry_new ();

  gtk_search_entry_set_placeholder_text (GTK_SEARCH_ENTRY (search), "Search");
  adw_header_bar_pack_end (bar, search);

  adw_toolbar_view_add_top_bar (view, GTK_WIDGET (bar));
  adw_toolbar_view_set_content (view, GTK_WIDGET (views));

  /* ── the icon grid ───────────────────────────────────────────────────── */

  GtkWidget *scrolled = gtk_scrolled_window_new ();

  /* A selection per view: a GtkSelectionModel belongs to the view it is given to. */
  GtkSelectionModel *grid_selection = GTK_SELECTION_MODEL (gtk_single_selection_new (
    G_LIST_MODEL (gtk_string_list_new (adw_cn_files_entries))));

  GtkWidget *grid = gtk_grid_view_new (grid_selection, adw_cn_files_factory ());

  gtk_grid_view_set_max_columns (GTK_GRID_VIEW (grid), 4);
  gtk_grid_view_set_min_columns (GTK_GRID_VIEW (grid), 2);
  gtk_scrolled_window_set_child (GTK_SCROLLED_WINDOW (scrolled), grid);
  gtk_stack_add_titled (views, scrolled, "icons", "Icons");

  /* ── the column list ─────────────────────────────────────────────────── */

  GtkWidget *list_scrolled = gtk_scrolled_window_new ();

  GtkSelectionModel *column_selection = GTK_SELECTION_MODEL (gtk_single_selection_new (
    G_LIST_MODEL (gtk_string_list_new (adw_cn_files_entries))));

  GtkColumnView *columns = GTK_COLUMN_VIEW (gtk_column_view_new (column_selection));

  GtkListItemFactory *name_factory = gtk_signal_list_item_factory_new ();

  g_signal_connect (name_factory, "setup", G_CALLBACK (adw_cn_files_name_setup), NULL);
  g_signal_connect (name_factory, "bind", G_CALLBACK (adw_cn_files_name_bind), NULL);

  GtkColumnViewColumn *name = gtk_column_view_column_new ("Name", name_factory);

  gtk_column_view_column_set_expand (name, TRUE);
  gtk_column_view_append_column (columns, name);
  gtk_column_view_append_column (columns,
    gtk_column_view_column_new ("Size", adw_cn_files_factory ()));

  gtk_scrolled_window_set_child (GTK_SCROLLED_WINDOW (list_scrolled), GTK_WIDGET (columns));
  gtk_stack_add_titled (views, list_scrolled, "list", "List");

  adw_overlay_split_view_set_content (split, GTK_WIDGET (view));

  return GTK_WIDGET (split);
}
