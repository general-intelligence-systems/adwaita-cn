/* A software centre: the application being looked at, and what installing it is doing.
 *
 * The same scene as App.tsx beside this. This one is built with the toolkit, so what it
 * lays out is what the components have to match -- bin/02-app-trees walks it and writes
 * out every node, where it was put and what it draws.
 */

#include <adwaita.h>

G_GNUC_BEGIN_IGNORE_DEPRECATIONS

GtkWidget *
adw_cn_build_software (void)
{
  AdwToolbarView *view = ADW_TOOLBAR_VIEW (adw_toolbar_view_new ());
  AdwHeaderBar *bar = ADW_HEADER_BAR (adw_header_bar_new ());

  /* A button content rather than a label, which is what gives it its icon. */
  AdwButtonContent *content = ADW_BUTTON_CONTENT (adw_button_content_new ());

  adw_button_content_set_icon_name (content, "folder-download-symbolic");
  adw_button_content_set_label (content, "Install");

  GtkWidget *install = gtk_button_new ();

  gtk_button_set_child (GTK_BUTTON (install), GTK_WIDGET (content));
  gtk_widget_add_css_class (install, "suggested-action");
  adw_header_bar_pack_end (bar, install);

  adw_toolbar_view_add_top_bar (view, GTK_WIDGET (bar));

  AdwToastOverlay *overlay = ADW_TOAST_OVERLAY (adw_toast_overlay_new ());
  GtkWidget *scrolled = gtk_scrolled_window_new ();

  adw_toast_overlay_set_child (overlay, scrolled);
  adw_toolbar_view_set_content (view, GTK_WIDGET (overlay));

  GtkBox *column = GTK_BOX (gtk_box_new (GTK_ORIENTATION_VERTICAL, 12));

  gtk_widget_set_margin_top (GTK_WIDGET (column), 12);
  gtk_widget_set_margin_bottom (GTK_WIDGET (column), 12);
  gtk_widget_set_margin_start (GTK_WIDGET (column), 12);
  gtk_widget_set_margin_end (GTK_WIDGET (column), 12);
  gtk_scrolled_window_set_child (GTK_SCROLLED_WINDOW (scrolled), GTK_WIDGET (column));

  /* ── the warning ─────────────────────────────────────────────────────── */

  GtkInfoBar *info = GTK_INFO_BAR (gtk_info_bar_new ());

  gtk_info_bar_set_message_type (info, GTK_MESSAGE_WARNING);
  gtk_info_bar_set_revealed (info, TRUE);
  gtk_info_bar_set_show_close_button (info, TRUE);
  gtk_info_bar_add_child (info, gtk_label_new ("This application is not sandboxed."));
  gtk_box_append (column, GTK_WIDGET (info));

  /* ── the application ─────────────────────────────────────────────────── */

  AdwStatusPage *status = ADW_STATUS_PAGE (adw_status_page_new ());

  adw_status_page_set_icon_name (status, "application-x-executable-symbolic");
  adw_status_page_set_title (status, "Inkscape");
  adw_status_page_set_description (status, "A vector graphics editor.");

  GtkBox *actions = GTK_BOX (gtk_box_new (GTK_ORIENTATION_HORIZONTAL, 12));

  gtk_widget_set_halign (GTK_WIDGET (actions), GTK_ALIGN_CENTER);

  GtkWidget *install_large = gtk_button_new_with_label ("Install");

  gtk_widget_add_css_class (install_large, "pill");
  gtk_widget_add_css_class (install_large, "suggested-action");
  gtk_box_append (actions, install_large);

  gtk_box_append (actions, gtk_link_button_new_with_label ("https://inkscape.org", "Website"));

  adw_status_page_set_child (status, GTK_WIDGET (actions));
  gtk_box_append (column, GTK_WIDGET (status));

  /* ── what the download is doing ──────────────────────────────────────── */

  AdwPreferencesGroup *progress_group = ADW_PREFERENCES_GROUP (adw_preferences_group_new ());

  adw_preferences_group_set_title (progress_group, "Downloading");

  GtkWidget *progress = gtk_progress_bar_new ();

  gtk_progress_bar_set_fraction (GTK_PROGRESS_BAR (progress), 0.62);
  gtk_progress_bar_set_show_text (GTK_PROGRESS_BAR (progress), TRUE);
  gtk_progress_bar_set_text (GTK_PROGRESS_BAR (progress), "62%");
  adw_preferences_group_add (progress_group, progress);

  GtkWidget *level = gtk_level_bar_new ();

  gtk_level_bar_set_value (GTK_LEVEL_BAR (level), 0.4);
  adw_preferences_group_add (progress_group, level);

  GtkWidget *spinner = gtk_spinner_new ();

  gtk_spinner_set_spinning (GTK_SPINNER (spinner), TRUE);
  gtk_widget_set_halign (spinner, GTK_ALIGN_CENTER);
  adw_preferences_group_add (progress_group, spinner);

  /* A button row, which is the row a preferences group offers for an action. */
  AdwButtonRow *rating = ADW_BUTTON_ROW (adw_button_row_new ());

  adw_preferences_row_set_title (ADW_PREFERENCES_ROW (rating), "Rate this application");
  adw_button_row_set_start_icon_name (rating, "starred-symbolic");
  adw_preferences_group_add (progress_group, GTK_WIDGET (rating));

  gtk_box_append (column, GTK_WIDGET (progress_group));

  /* Added last, because a toast is presented over what is already there. */
  adw_toast_overlay_add_toast (overlay, adw_toast_new ("Inkscape installed"));

  return GTK_WIDGET (view);
}

G_GNUC_END_IGNORE_DEPRECATIONS
