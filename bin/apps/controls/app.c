/* One of each control, in the composition a settings or editor pane puts them in.
 *
 * The same scene as App.tsx beside this. This one is built with the toolkit, so what it
 * lays out is what the components have to match -- bin/02-app-trees walks it and writes
 * out every node, where it was put and what it draws.
 */

#include <adwaita.h>

GtkWidget *
adw_cn_build_controls (void)
{
  AdwToolbarView *view = ADW_TOOLBAR_VIEW (adw_toolbar_view_new ());
  AdwHeaderBar *bar = ADW_HEADER_BAR (adw_header_bar_new ());

  adw_header_bar_set_title_widget (bar, adw_window_title_new ("Controls", "One of each"));
  adw_toolbar_view_add_top_bar (view, GTK_WIDGET (bar));

  AdwClamp *clamp = ADW_CLAMP (adw_clamp_new ());

  adw_clamp_set_maximum_size (clamp, 400);
  gtk_widget_set_margin_top (GTK_WIDGET (clamp), 24);
  gtk_widget_set_margin_bottom (GTK_WIDGET (clamp), 24);
  gtk_widget_set_margin_start (GTK_WIDGET (clamp), 24);
  gtk_widget_set_margin_end (GTK_WIDGET (clamp), 24);

  GtkBox *column = GTK_BOX (gtk_box_new (GTK_ORIENTATION_VERTICAL, 18));

  adw_clamp_set_child (clamp, GTK_WIDGET (column));
  adw_toolbar_view_set_content (view, GTK_WIDGET (clamp));

  /* The buttons: one of each kind, in a row. */
  GtkBox *buttons = GTK_BOX (gtk_box_new (GTK_ORIENTATION_HORIZONTAL, 8));

  gtk_box_append (buttons, gtk_button_new_with_label ("Label"));

  GtkWidget *suggested = gtk_button_new_with_label ("Save");
  gtk_widget_add_css_class (suggested, "suggested-action");
  gtk_box_append (buttons, suggested);

  GtkWidget *destructive = gtk_button_new_with_label ("Delete");
  gtk_widget_add_css_class (destructive, "destructive-action");
  gtk_box_append (buttons, destructive);

  GtkWidget *flat = gtk_button_new_with_label ("Cancel");
  gtk_widget_add_css_class (flat, "flat");
  gtk_box_append (buttons, flat);

  GtkWidget *circular = gtk_button_new_from_icon_name ("list-add-symbolic");
  gtk_widget_add_css_class (circular, "circular");
  gtk_box_append (buttons, circular);

  gtk_box_append (column, GTK_WIDGET (buttons));

  /* The segmented control. */
  AdwToggleGroup *toggles = ADW_TOGGLE_GROUP (adw_toggle_group_new ());

  for (const char **label = (const char *[]){ "Day", "Week", "Month", NULL }; *label; label++)
    {
      AdwToggle *toggle = adw_toggle_new ();

      adw_toggle_set_label (toggle, *label);
      adw_toggle_group_add (toggles, toggle);
    }

  gtk_box_append (column, GTK_WIDGET (toggles));

  GtkWidget *entry = gtk_entry_new ();
  gtk_entry_set_placeholder_text (GTK_ENTRY (entry), "Placeholder text");
  gtk_box_append (column, entry);

  GtkWidget *search = gtk_search_entry_new ();
  gtk_editable_set_text (GTK_EDITABLE (search), "");
  gtk_search_entry_set_placeholder_text (GTK_SEARCH_ENTRY (search), "Search");
  gtk_box_append (column, search);

  GtkAdjustment *adjustment = gtk_adjustment_new (60.0, 0.0, 100.0, 1.0, 10.0, 0.0);
  GtkWidget *scale = gtk_scale_new (GTK_ORIENTATION_HORIZONTAL, adjustment);
  gtk_scale_set_draw_value (GTK_SCALE (scale), FALSE);
  gtk_box_append (column, scale);

  /* A label and a switch, which is the shape of a settings row before it is a row. */
  GtkBox *switch_row = GTK_BOX (gtk_box_new (GTK_ORIENTATION_HORIZONTAL, 12));
  GtkWidget *switch_label = gtk_label_new ("Enabled");

  gtk_widget_set_hexpand (switch_label, TRUE);
  gtk_label_set_xalign (GTK_LABEL (switch_label), 0.0);
  gtk_box_append (switch_row, switch_label);

  GtkWidget *toggle = gtk_switch_new ();
  gtk_switch_set_active (GTK_SWITCH (toggle), TRUE);
  gtk_widget_set_halign (toggle, GTK_ALIGN_END);
  gtk_box_append (switch_row, toggle);
  gtk_box_append (column, GTK_WIDGET (switch_row));

  GtkWidget *check = gtk_check_button_new_with_label ("Remember me");
  gtk_check_button_set_active (GTK_CHECK_BUTTON (check), TRUE);
  gtk_box_append (column, check);

  GtkStringList *model = gtk_string_list_new ((const char *[]){ "Everyone", "Only me", "Nobody", NULL });
  gtk_box_append (column, gtk_drop_down_new (G_LIST_MODEL (model), NULL));

  GtkWidget *progress = gtk_progress_bar_new ();
  gtk_progress_bar_set_fraction (GTK_PROGRESS_BAR (progress), 0.6);
  gtk_box_append (column, progress);

  GtkWidget *level = gtk_level_bar_new ();
  gtk_level_bar_set_value (GTK_LEVEL_BAR (level), 0.4);
  gtk_box_append (column, level);

  GtkAdjustment *counted = gtk_adjustment_new (3.0, 0.0, 10.0, 1.0, 2.0, 0.0);
  gtk_box_append (column, gtk_spin_button_new (counted, 1.0, 0));

  return GTK_WIDGET (view);
}
