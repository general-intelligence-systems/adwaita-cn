/* A preferences window: the rows almost every GNOME application has.
 *
 * The same scene as App.tsx beside this. This one is built with the toolkit, so what it
 * lays out is what the components have to match -- bin/02-app-trees walks it and writes
 * out every node, where it was put and what it draws.
 */

#include <adwaita.h>

GtkWidget *
adw_cn_build_preferences (void)
{
  AdwToolbarView *view = ADW_TOOLBAR_VIEW (adw_toolbar_view_new ());
  AdwHeaderBar *bar = ADW_HEADER_BAR (adw_header_bar_new ());

  adw_header_bar_set_title_widget (bar, adw_window_title_new ("Preferences", "Three groups"));

  GtkWidget *back = gtk_button_new_from_icon_name ("go-previous-symbolic");

  gtk_widget_add_css_class (back, "flat");
  adw_header_bar_pack_start (bar, back);

  adw_toolbar_view_add_top_bar (view, GTK_WIDGET (bar));

  AdwPreferencesPage *page = ADW_PREFERENCES_PAGE (adw_preferences_page_new ());

  adw_toolbar_view_set_content (view, GTK_WIDGET (page));

  /* ── appearance ──────────────────────────────────────────────────────── */

  AdwPreferencesGroup *appearance = ADW_PREFERENCES_GROUP (adw_preferences_group_new ());

  adw_preferences_group_set_title (appearance, "Appearance");
  adw_preferences_group_set_description (appearance, "How the window looks.");
  adw_preferences_page_add (page, appearance);

  AdwComboRow *theme = ADW_COMBO_ROW (adw_combo_row_new ());

  adw_preferences_row_set_title (ADW_PREFERENCES_ROW (theme), "Theme");
  adw_action_row_set_subtitle (ADW_ACTION_ROW (theme), "Follows the system by default");
  adw_combo_row_set_model (theme,
    G_LIST_MODEL (gtk_string_list_new ((const char *[]){ "System", "Light", "Dark", NULL })));
  adw_combo_row_set_selected (theme, 0);
  adw_preferences_group_add (appearance, GTK_WIDGET (theme));

  AdwSwitchRow *animations = ADW_SWITCH_ROW (adw_switch_row_new ());

  adw_preferences_row_set_title (ADW_PREFERENCES_ROW (animations), "Animations");
  adw_action_row_set_subtitle (ADW_ACTION_ROW (animations), "200ms on Adwaita's own curve");
  adw_switch_row_set_active (animations, TRUE);
  adw_preferences_group_add (appearance, GTK_WIDGET (animations));

  AdwSpinRow *spacing = ADW_SPIN_ROW (adw_spin_row_new (
    gtk_adjustment_new (12.0, 0.0, 48.0, 1.0, 6.0, 0.0), 1.0, 0));

  adw_preferences_row_set_title (ADW_PREFERENCES_ROW (spacing), "Spacing");
  adw_preferences_group_add (appearance, GTK_WIDGET (spacing));

  /* ── account ─────────────────────────────────────────────────────────── */

  AdwPreferencesGroup *account = ADW_PREFERENCES_GROUP (adw_preferences_group_new ());

  adw_preferences_group_set_title (account, "Account");
  adw_preferences_page_add (page, account);

  AdwEntryRow *name = ADW_ENTRY_ROW (adw_entry_row_new ());

  adw_preferences_row_set_title (ADW_PREFERENCES_ROW (name), "Name");
  gtk_editable_set_text (GTK_EDITABLE (name), "Ada Lovelace");
  adw_preferences_group_add (account, GTK_WIDGET (name));

  AdwEntryRow *email = ADW_ENTRY_ROW (adw_entry_row_new ());

  adw_preferences_row_set_title (ADW_PREFERENCES_ROW (email), "Email");
  gtk_editable_set_text (GTK_EDITABLE (email), "ada@example.org");
  adw_preferences_group_add (account, GTK_WIDGET (email));

  AdwActionRow *sync = ADW_ACTION_ROW (adw_action_row_new ());
  GtkWidget *sync_button = gtk_button_new_with_label ("Sync now");

  /* Centred rather than filling, because a row is taller than its button. */
  gtk_widget_set_valign (sync_button, GTK_ALIGN_CENTER);
  gtk_widget_add_css_class (sync_button, "suggested-action");

  adw_preferences_row_set_title (ADW_PREFERENCES_ROW (sync), "Last synchronised");
  adw_action_row_set_subtitle (sync, "Today at 09:41");
  adw_action_row_add_suffix (sync, sync_button);
  adw_action_row_set_activatable_widget (sync, sync_button);
  adw_preferences_group_add (account, GTK_WIDGET (sync));

  return GTK_WIDGET (view);
}
