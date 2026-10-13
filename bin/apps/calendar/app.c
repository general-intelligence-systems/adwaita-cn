/* A calendar: the month picker down the side, the week laid out in a grid beside it.
 *
 * The same scene as App.tsx beside this. This one is built with the toolkit, so what it
 * lays out is what the components have to match -- bin/02-app-trees walks it and writes
 * out every node, where it was put and what it draws.
 */

#include <adwaita.h>

static const char *const adw_cn_calendar_days[] = {
  "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", NULL,
};

GtkWidget *
adw_cn_build_calendar (void)
{
  AdwToolbarView *view = ADW_TOOLBAR_VIEW (adw_toolbar_view_new ());
  AdwHeaderBar *bar = ADW_HEADER_BAR (adw_header_bar_new ());

  /* The title is a centre box, so the month stays centred against the whole bar rather
   * than against what is left of it. */
  GtkCenterBox *title = GTK_CENTER_BOX (gtk_center_box_new ());

  gtk_widget_set_hexpand (GTK_WIDGET (title), TRUE);

  GtkWidget *previous = gtk_button_new_from_icon_name ("go-previous-symbolic");

  gtk_widget_add_css_class (previous, "flat");
  gtk_center_box_set_start_widget (title, previous);

  GtkWidget *month = gtk_label_new ("October 2026");

  gtk_widget_add_css_class (month, "heading");
  gtk_center_box_set_center_widget (title, month);

  GtkWidget *next = gtk_button_new_from_icon_name ("go-next-symbolic");

  gtk_widget_add_css_class (next, "flat");
  gtk_center_box_set_end_widget (title, next);

  adw_header_bar_set_title_widget (bar, GTK_WIDGET (title));
  adw_toolbar_view_add_top_bar (view, GTK_WIDGET (bar));

  GtkBox *row = GTK_BOX (gtk_box_new (GTK_ORIENTATION_HORIZONTAL, 12));

  gtk_widget_set_margin_top (GTK_WIDGET (row), 12);
  gtk_widget_set_margin_bottom (GTK_WIDGET (row), 12);
  gtk_widget_set_margin_start (GTK_WIDGET (row), 12);
  gtk_widget_set_margin_end (GTK_WIDGET (row), 12);
  adw_toolbar_view_set_content (view, GTK_WIDGET (row));

  /* ── the side ────────────────────────────────────────────────────────── */

  GtkBox *side = GTK_BOX (gtk_box_new (GTK_ORIENTATION_VERTICAL, 12));

  gtk_box_append (side, gtk_calendar_new ());

  GtkWidget *frame = gtk_frame_new ("Today");
  GtkWidget *bin = adw_bin_new ();

  /* An inscription rather than a label: it is the widget GTK added for text which is
   * only ever shown, and a summary line is exactly that. */
  GtkWidget *summary = gtk_inscription_new ("Three events, one all day");

  gtk_widget_set_margin_top (summary, 6);
  gtk_widget_set_margin_bottom (summary, 6);
  gtk_widget_set_margin_start (summary, 6);
  gtk_widget_set_margin_end (summary, 6);

  adw_bin_set_child (ADW_BIN (bin), summary);
  gtk_frame_set_child (GTK_FRAME (frame), bin);
  gtk_box_append (side, frame);

  gtk_box_append (row, GTK_WIDGET (side));

  /* ── the week ────────────────────────────────────────────────────────── */

  GtkGrid *week = GTK_GRID (gtk_grid_new ());

  gtk_grid_set_column_spacing (week, 6);
  gtk_grid_set_row_spacing (week, 6);
  gtk_grid_set_column_homogeneous (week, TRUE);
  gtk_widget_set_hexpand (GTK_WIDGET (week), TRUE);

  for (int index = 0; adw_cn_calendar_days[index]; index++)
    {
      GtkWidget *heading = gtk_label_new (adw_cn_calendar_days[index]);

      gtk_widget_add_css_class (heading, "heading");
      gtk_grid_attach (week, heading, index, 0, 1, 1);

      char *number = g_strdup_printf ("%d", 12 + index);
      GtkWidget *cell = gtk_label_new (number);

      gtk_widget_add_css_class (cell, "dim-label");
      gtk_grid_attach (week, cell, index, 1, 1, 1);

      g_free (number);
    }

  /* One event is placed at a fixed offset, the way a day view positions a block. */
  GtkFixed *pinned = GTK_FIXED (gtk_fixed_new ());

  gtk_widget_set_size_request (GTK_WIDGET (pinned), -1, 40);

  GtkWidget *chip = gtk_button_new_with_label ("Design review 14:00");

  gtk_widget_add_css_class (chip, "suggested-action");
  gtk_widget_add_css_class (chip, "pill");
  gtk_fixed_put (pinned, chip, 12, 4);

  gtk_grid_attach (week, GTK_WIDGET (pinned), 0, 2, 7, 1);

  gtk_box_append (row, GTK_WIDGET (week));

  return GTK_WIDGET (view);
}
