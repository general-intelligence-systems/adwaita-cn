/* The widget factory: the page an application developer opens to see a widget on its
 * own. GNOME ships one for the same reason this exists -- a handful of widgets are
 * parts rather than screens, and no real application puts them anywhere.
 *
 * Everything a real application does reach is in one of the other applications.
 *
 * The same scene as App.tsx beside this. This one is built with the toolkit, so what it
 * lays out is what the components have to match -- bin/02-app-trees walks it and writes
 * out every node, where it was put and what it draws.
 */

#include <adwaita.h>

/* GtkShortcutsGroup has no public constructor -- GTK 4.18 deprecated the whole family
 * and left them buildable only -- so it is built through GtkBuilder, which is how an
 * application would reach one now. */
static const char adw_cn_factory_group[] =
  "<interface>"
  "  <object class=\"GtkShortcutsGroup\" id=\"group\">"
  "    <property name=\"title\">Editing</property>"
  "    <child>"
  "      <object class=\"GtkShortcutsShortcut\">"
  "        <property name=\"title\">Copy</property>"
  "        <property name=\"accelerator\">&lt;ctrl&gt;c</property>"
  "      </object>"
  "    </child>"
  "  </object>"
  "</interface>";

G_GNUC_BEGIN_IGNORE_DEPRECATIONS

GtkWidget *
adw_cn_build_factory (void)
{
  AdwBreakpointBin *bin = ADW_BREAKPOINT_BIN (adw_breakpoint_bin_new ());

  gtk_widget_set_size_request (GTK_WIDGET (bin), 360, 320);

  AdwToolbarView *view = ADW_TOOLBAR_VIEW (adw_toolbar_view_new ());

  adw_breakpoint_bin_set_child (bin, GTK_WIDGET (view));
  adw_toolbar_view_add_top_bar (view, adw_header_bar_new ());

  AdwPreferencesPage *page = ADW_PREFERENCES_PAGE (adw_preferences_page_new ());

  adw_toolbar_view_set_content (view, GTK_WIDGET (page));

  /* ── the rows ────────────────────────────────────────────────────────── */

  AdwPreferencesGroup *rows = ADW_PREFERENCES_GROUP (adw_preferences_group_new ());

  adw_preferences_group_set_title (rows, "Rows");
  adw_preferences_page_add (page, rows);

  AdwExpanderRow *expander = ADW_EXPANDER_ROW (adw_expander_row_new ());

  adw_preferences_row_set_title (ADW_PREFERENCES_ROW (expander), "An expander row");
  adw_expander_row_set_subtitle (expander, "With a row inside it");
  adw_expander_row_set_expanded (expander, TRUE);

  AdwActionRow *nested = ADW_ACTION_ROW (adw_action_row_new ());

  adw_preferences_row_set_title (ADW_PREFERENCES_ROW (nested), "Inside");
  adw_expander_row_add_row (expander, GTK_WIDGET (nested));
  adw_preferences_group_add (rows, GTK_WIDGET (expander));

  AdwPasswordEntryRow *password_row = ADW_PASSWORD_ENTRY_ROW (adw_password_entry_row_new ());

  adw_preferences_row_set_title (ADW_PREFERENCES_ROW (password_row), "Password");
  adw_preferences_group_add (rows, GTK_WIDGET (password_row));

  /* A bare preferences row, which is the one an application fills itself. */
  AdwPreferencesRow *custom = ADW_PREFERENCES_ROW (adw_preferences_row_new ());

  adw_preferences_row_set_title (custom, "A row an application filled itself");
  gtk_list_box_row_set_activatable (GTK_LIST_BOX_ROW (custom), FALSE);

  GtkWidget *custom_child = gtk_label_new ("Whatever the application put here");

  gtk_label_set_xalign (GTK_LABEL (custom_child), 0.0);
  gtk_widget_set_margin_top (custom_child, 12);
  gtk_widget_set_margin_bottom (custom_child, 12);
  gtk_widget_set_margin_start (custom_child, 12);
  gtk_widget_set_margin_end (custom_child, 12);
  gtk_list_box_row_set_child (GTK_LIST_BOX_ROW (custom), custom_child);

  adw_preferences_group_add (rows, GTK_WIDGET (custom));

  /* ── the parts ───────────────────────────────────────────────────────── */

  AdwPreferencesGroup *parts = ADW_PREFERENCES_GROUP (adw_preferences_group_new ());

  adw_preferences_group_set_title (parts, "Parts");
  adw_preferences_page_add (page, parts);

  GtkBox *parts_box = GTK_BOX (gtk_box_new (GTK_ORIENTATION_VERTICAL, 12));

  adw_preferences_group_add (parts, GTK_WIDGET (parts_box));

  /* A scale without its own node names, which is as close to a bare GtkRange as a
   * caller can get: GtkRange itself is abstract. */
  GtkWidget *range = gtk_scale_new (GTK_ORIENTATION_HORIZONTAL,
                                    gtk_adjustment_new (35, 0, 100, 1, 10, 0));

  gtk_scale_set_draw_value (GTK_SCALE (range), FALSE);
  gtk_widget_set_hexpand (range, TRUE);
  gtk_box_append (parts_box, range);

  GtkWidget *password = gtk_password_entry_new ();

  gtk_password_entry_set_show_peek_icon (GTK_PASSWORD_ENTRY (password), TRUE);
  gtk_box_append (parts_box, password);

  gtk_box_append (parts_box, gtk_lock_button_new (NULL));
  gtk_box_append (parts_box, gtk_app_chooser_button_new ("text/plain"));

  GtkWidget *shortcut = gtk_shortcut_label_new ("<ctrl><shift>n");

  gtk_widget_set_halign (shortcut, GTK_ALIGN_START);
  gtk_box_append (parts_box, shortcut);

  GtkBuilder *builder = gtk_builder_new_from_string (adw_cn_factory_group, -1);
  GObject *group = gtk_builder_get_object (builder, "group");

  if (GTK_IS_WIDGET (group))
    gtk_box_append (parts_box, GTK_WIDGET (group));

  /* The layout view, and the one layout it switches between. */
  AdwMultiLayoutView *multi = ADW_MULTI_LAYOUT_VIEW (adw_multi_layout_view_new ());

  gtk_widget_set_size_request (GTK_WIDGET (multi), -1, 32);

  AdwLayout *layout = adw_layout_new (adw_layout_slot_new ("main"));

  adw_layout_set_name (layout, "only");
  adw_multi_layout_view_add_layout (multi, layout);

  GtkWidget *slot_label = gtk_label_new ("In the layout's slot");

  gtk_widget_add_css_class (slot_label, "dim-label");
  adw_multi_layout_view_set_child (multi, "main", slot_label);
  gtk_box_append (parts_box, GTK_WIDGET (multi));

  GtkWidget *wrapper = adw_bin_new ();
  GtkWidget *bin_label = gtk_label_new ("In a bin");

  gtk_widget_add_css_class (bin_label, "dim-label");
  adw_bin_set_child (ADW_BIN (wrapper), bin_label);
  gtk_box_append (parts_box, wrapper);

  AdwClampScrollable *clamp = ADW_CLAMP_SCROLLABLE (adw_clamp_scrollable_new ());

  adw_clamp_scrollable_set_maximum_size (clamp, 240);

  /* A scrollable child, because AdwClampScrollable binds its own adjustments onto
   * whatever it holds: given a label it reported that GtkLabel has no `hadjustment`. */
  GtkWidget *clamped = gtk_text_view_new ();

  gtk_text_buffer_set_text (gtk_text_view_get_buffer (GTK_TEXT_VIEW (clamped)),
                            "Clamped to 240px", -1);
  gtk_widget_set_size_request (clamped, -1, 32);
  gtk_text_view_set_left_margin (GTK_TEXT_VIEW (clamped), 6);
  gtk_text_view_set_top_margin (GTK_TEXT_VIEW (clamped), 6);
  adw_clamp_scrollable_set_child (clamp, clamped);
  gtk_box_append (parts_box, GTK_WIDGET (clamp));

  /* ── the choosers ────────────────────────────────────────────────────── */

  AdwPreferencesGroup *choosers = ADW_PREFERENCES_GROUP (adw_preferences_group_new ());

  adw_preferences_group_set_title (choosers, "Choosers");
  adw_preferences_page_add (page, choosers);

  GtkBox *chooser_box = GTK_BOX (gtk_box_new (GTK_ORIENTATION_VERTICAL, 12));

  adw_preferences_group_add (choosers, GTK_WIDGET (chooser_box));

  GtkWidget *app_chooser = gtk_app_chooser_widget_new ("text/plain");

  gtk_widget_set_size_request (app_chooser, -1, 120);
  gtk_box_append (chooser_box, app_chooser);

  GtkWidget *file_chooser = gtk_file_chooser_widget_new (GTK_FILE_CHOOSER_ACTION_OPEN);

  gtk_widget_set_size_request (file_chooser, -1, 160);
  gtk_box_append (chooser_box, file_chooser);

  GtkWidget *font_chooser = gtk_font_chooser_widget_new ();

  gtk_widget_set_size_request (font_chooser, -1, 160);
  gtk_box_append (chooser_box, font_chooser);

  g_object_unref (builder);

  return GTK_WIDGET (bin);
}

G_GNUC_END_IGNORE_DEPRECATIONS
