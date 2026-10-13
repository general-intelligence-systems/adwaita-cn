/* A process viewer: the running processes in the three views GTK 3 left behind, with
 * the filters above them and a status bar below.
 *
 * The tree, icon and cell views and both combo boxes are deprecated in GTK 4, which is
 * why they are here together: this is the application which still uses them.
 *
 * The same scene as App.tsx beside this. This one is built with the toolkit, so what it
 * lays out is what the components have to match -- bin/02-app-trees walks it and writes
 * out every node, where it was put and what it draws.
 */

#include <adwaita.h>

static const char *const adw_cn_console_processes[] = {
  "systemd", "gnome-shell", "tracker-miner", "pipewire", "ruby", NULL,
};

/* One column of strings, which every one of the deprecated views reads. */
static GtkListStore *
adw_cn_console_store (void)
{
  GtkListStore *store = gtk_list_store_new (1, G_TYPE_STRING);

  for (gsize i = 0; adw_cn_console_processes[i]; i++)
    {
      GtkTreeIter iter;

      gtk_list_store_append (store, &iter);
      gtk_list_store_set (store, &iter, 0, adw_cn_console_processes[i], -1);
    }

  return store;
}

G_GNUC_BEGIN_IGNORE_DEPRECATIONS

GtkWidget *
adw_cn_build_console (void)
{
  GtkListStore *store = adw_cn_console_store ();

  AdwToolbarView *view = ADW_TOOLBAR_VIEW (adw_toolbar_view_new ());
  AdwHeaderBar *bar = ADW_HEADER_BAR (adw_header_bar_new ());

  /* The filters ARE the title. */
  GtkBox *filters = GTK_BOX (gtk_box_new (GTK_ORIENTATION_HORIZONTAL, 6));

  GtkWidget *scope = gtk_combo_box_new_with_model (GTK_TREE_MODEL (store));
  GtkCellRenderer *scope_renderer = gtk_cell_renderer_text_new ();

  gtk_cell_layout_pack_start (GTK_CELL_LAYOUT (scope), scope_renderer, TRUE);
  gtk_cell_layout_add_attribute (GTK_CELL_LAYOUT (scope), scope_renderer, "text", 0);
  gtk_combo_box_set_active (GTK_COMBO_BOX (scope), 0);
  gtk_box_append (filters, scope);

  GtkWidget *sort = gtk_combo_box_text_new ();

  for (const char **label = (const char *[]){ "By name", "By memory", "By CPU", NULL };
       *label; label++)
    gtk_combo_box_text_append_text (GTK_COMBO_BOX_TEXT (sort), *label);

  gtk_combo_box_set_active (GTK_COMBO_BOX (sort), 0);
  gtk_box_append (filters, sort);

  adw_header_bar_set_title_widget (bar, GTK_WIDGET (filters));
  adw_toolbar_view_add_top_bar (view, GTK_WIDGET (bar));

  GtkBox *column = GTK_BOX (gtk_box_new (GTK_ORIENTATION_VERTICAL, 0));

  adw_toolbar_view_set_content (view, GTK_WIDGET (column));

  /* ── the two views, in a notebook ────────────────────────────────────── */

  GtkNotebook *notebook = GTK_NOTEBOOK (gtk_notebook_new ());

  gtk_widget_set_vexpand (GTK_WIDGET (notebook), TRUE);

  GtkWidget *tree_scrolled = gtk_scrolled_window_new ();
  GtkWidget *tree = gtk_tree_view_new_with_model (GTK_TREE_MODEL (store));

  gtk_tree_view_append_column (GTK_TREE_VIEW (tree),
    gtk_tree_view_column_new_with_attributes ("Process",
                                              gtk_cell_renderer_text_new (),
                                              "text", 0, NULL));
  gtk_scrolled_window_set_child (GTK_SCROLLED_WINDOW (tree_scrolled), tree);
  gtk_notebook_append_page (notebook, tree_scrolled, gtk_label_new ("Processes"));

  GtkWidget *icon_scrolled = gtk_scrolled_window_new ();
  GtkWidget *icons = gtk_icon_view_new ();

  gtk_icon_view_set_model (GTK_ICON_VIEW (icons), GTK_TREE_MODEL (store));
  gtk_icon_view_set_text_column (GTK_ICON_VIEW (icons), 0);
  gtk_icon_view_set_columns (GTK_ICON_VIEW (icons), 4);
  gtk_scrolled_window_set_child (GTK_SCROLLED_WINDOW (icon_scrolled), icons);
  gtk_notebook_append_page (notebook, icon_scrolled, gtk_label_new ("Icons"));

  gtk_box_append (column, GTK_WIDGET (notebook));

  /* The selected process, shown the way a cell renderer draws it in the list. */
  GtkWidget *details = gtk_expander_new ("Selected process");
  GtkWidget *cell = gtk_cell_view_new ();
  GtkCellRenderer *cell_renderer = gtk_cell_renderer_text_new ();
  GtkTreePath *first = gtk_tree_path_new_from_string ("0");

  gtk_cell_view_set_model (GTK_CELL_VIEW (cell), GTK_TREE_MODEL (store));
  gtk_cell_view_set_displayed_row (GTK_CELL_VIEW (cell), first);
  gtk_cell_layout_pack_start (GTK_CELL_LAYOUT (cell), cell_renderer, TRUE);
  gtk_cell_layout_add_attribute (GTK_CELL_LAYOUT (cell), cell_renderer, "text", 0);
  gtk_tree_path_free (first);

  gtk_expander_set_child (GTK_EXPANDER (details), cell);
  gtk_expander_set_expanded (GTK_EXPANDER (details), TRUE);
  gtk_box_append (column, details);

  GtkWidget *status = gtk_statusbar_new ();

  gtk_statusbar_push (GTK_STATUSBAR (status),
                      gtk_statusbar_get_context_id (GTK_STATUSBAR (status), "console"),
                      "5 processes, 1.2 GB in use");
  gtk_box_append (column, status);

  return GTK_WIDGET (view);
}

G_GNUC_END_IGNORE_DEPRECATIONS
