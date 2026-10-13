/* The things an application says to its user: a banner, a toast and an empty state.
 *
 * The same scene as App.tsx beside this. This one is built with the toolkit, so what it
 * lays out is what the components have to match -- bin/02-app-trees walks it and writes
 * out every node, where it was put and what it draws.
 */

#include <adwaita.h>

GtkWidget *
adw_cn_build_feedback (void)
{
  AdwToolbarView *view = ADW_TOOLBAR_VIEW (adw_toolbar_view_new ());
  AdwHeaderBar *bar = ADW_HEADER_BAR (adw_header_bar_new ());

  adw_header_bar_set_title_widget (bar, adw_window_title_new ("Feedback", "Banner, toast, empty state"));
  adw_toolbar_view_add_top_bar (view, GTK_WIDGET (bar));

  AdwToastOverlay *overlay = ADW_TOAST_OVERLAY (adw_toast_overlay_new ());
  GtkBox *column = GTK_BOX (gtk_box_new (GTK_ORIENTATION_VERTICAL, 0));

  adw_toast_overlay_set_child (overlay, GTK_WIDGET (column));
  adw_toolbar_view_set_content (view, GTK_WIDGET (overlay));

  AdwBanner *banner = ADW_BANNER (adw_banner_new ("You are working offline"));

  adw_banner_set_button_label (banner, "Reconnect");
  adw_banner_set_revealed (banner, TRUE);
  gtk_box_append (column, GTK_WIDGET (banner));

  /* The empty state, which is a status page with the one action it offers in it. */
  AdwStatusPage *status = ADW_STATUS_PAGE (adw_status_page_new ());

  adw_status_page_set_icon_name (status, "folder-symbolic");
  adw_status_page_set_title (status, "No documents");
  adw_status_page_set_description (status, "Documents you create will appear here.");
  gtk_widget_set_vexpand (GTK_WIDGET (status), TRUE);

  GtkWidget *new_button = gtk_button_new_with_label ("New document");

  gtk_widget_set_halign (new_button, GTK_ALIGN_CENTER);
  gtk_widget_add_css_class (new_button, "pill");
  gtk_widget_add_css_class (new_button, "suggested-action");
  adw_status_page_set_child (status, new_button);

  gtk_box_append (column, GTK_WIDGET (status));

  /* Added last, because a toast is presented over what is already there. */
  adw_toast_overlay_add_toast (overlay, adw_toast_new ("Everything saved"));

  return GTK_WIDGET (view);
}
