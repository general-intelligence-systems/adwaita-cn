/* A drawing application: the canvas, the tools above it, and the colour and font
 * pickers a drawing application keeps to hand.
 *
 * The same scene as App.tsx beside this. This one is built with the toolkit, so what it
 * lays out is what the components have to match -- bin/02-app-trees walks it and writes
 * out every node, where it was put and what it draws.
 */

#include <adwaita.h>

/* Something on the canvas, so the shot is of a drawing application with a drawing in it
 * rather than an empty rectangle. */
static void
adw_cn_paint_sketch (GtkDrawingArea *area,
                     cairo_t        *context,
                     int             width,
                     int             height,
                     gpointer        data)
{
  (void) area;
  (void) data;

  cairo_set_source_rgb (context, 1, 1, 1);
  cairo_rectangle (context, 0, 0, width, height);
  cairo_fill (context);

  cairo_set_source_rgb (context, 0.21, 0.52, 0.89);
  cairo_set_line_width (context, 6);
  cairo_move_to (context, width * 0.15, height * 0.7);
  cairo_curve_to (context,
                  width * 0.35, height * 0.2,
                  width * 0.65, height * 0.9,
                  width * 0.85, height * 0.35);
  cairo_stroke (context);
}

GtkWidget *
adw_cn_build_paint (void)
{
  AdwToolbarView *view = ADW_TOOLBAR_VIEW (adw_toolbar_view_new ());
  AdwHeaderBar *bar = ADW_HEADER_BAR (adw_header_bar_new ());

  /* The tools ARE the title, linked into one segmented control. */
  GtkBox *tools = GTK_BOX (gtk_box_new (GTK_ORIENTATION_HORIZONTAL, 0));

  gtk_widget_add_css_class (GTK_WIDGET (tools), "linked");

  GtkWidget *pen = gtk_toggle_button_new ();

  gtk_button_set_icon_name (GTK_BUTTON (pen), "edit-symbolic");
  gtk_toggle_button_set_active (GTK_TOGGLE_BUTTON (pen), TRUE);
  gtk_box_append (tools, pen);

  GtkWidget *brush = gtk_toggle_button_new ();

  gtk_button_set_icon_name (GTK_BUTTON (brush), "applications-graphics-symbolic");
  gtk_toggle_button_set_group (GTK_TOGGLE_BUTTON (brush), GTK_TOGGLE_BUTTON (pen));
  gtk_box_append (tools, brush);

  GtkWidget *eraser = gtk_toggle_button_new ();

  gtk_button_set_icon_name (GTK_BUTTON (eraser), "edit-clear-symbolic");
  gtk_toggle_button_set_group (GTK_TOGGLE_BUTTON (eraser), GTK_TOGGLE_BUTTON (pen));
  gtk_box_append (tools, eraser);

  adw_header_bar_set_title_widget (bar, GTK_WIDGET (tools));

  GdkRGBA accent;

  gdk_rgba_parse (&accent, "#3584e4");

  GtkWidget *color = gtk_color_button_new_with_rgba (&accent);

  adw_header_bar_pack_end (bar, color);
  adw_toolbar_view_add_top_bar (view, GTK_WIDGET (bar));

  /* ── the sidebar and the canvas ──────────────────────────────────────── */

  GtkBox *row = GTK_BOX (gtk_box_new (GTK_ORIENTATION_HORIZONTAL, 12));

  gtk_widget_set_margin_top (GTK_WIDGET (row), 12);
  gtk_widget_set_margin_bottom (GTK_WIDGET (row), 12);
  gtk_widget_set_margin_start (GTK_WIDGET (row), 12);
  gtk_widget_set_margin_end (GTK_WIDGET (row), 12);
  adw_toolbar_view_set_content (view, GTK_WIDGET (row));

  GtkBox *sidebar = GTK_BOX (gtk_box_new (GTK_ORIENTATION_VERTICAL, 12));

  gtk_widget_set_size_request (GTK_WIDGET (sidebar), 220, -1);
  gtk_box_append (row, GTK_WIDGET (sidebar));

  GtkWidget *swatches = gtk_color_chooser_widget_new ();

  g_object_set (swatches, "show-editor", FALSE, NULL);
  gtk_box_append (sidebar, swatches);

  gtk_box_append (sidebar, gtk_color_dialog_button_new (gtk_color_dialog_new ()));
  gtk_box_append (sidebar, gtk_font_button_new ());
  gtk_box_append (sidebar, gtk_font_dialog_button_new (gtk_font_dialog_new ()));

  GtkWidget *size = gtk_scale_button_new (1, 64, 1,
    (const char *[]){ "zoom-in-symbolic", NULL });

  gtk_scale_button_set_adjustment (GTK_SCALE_BUTTON (size),
                                   gtk_adjustment_new (8, 1, 64, 1, 4, 0));
  gtk_widget_set_halign (size, GTK_ALIGN_START);
  gtk_box_append (sidebar, size);

  GtkWidget *opacity = gtk_scale_new (GTK_ORIENTATION_HORIZONTAL,
                                      gtk_adjustment_new (80, 0, 100, 1, 10, 0));

  gtk_scale_set_draw_value (GTK_SCALE (opacity), TRUE);
  gtk_box_append (sidebar, opacity);

  gtk_box_append (row, gtk_separator_new (GTK_ORIENTATION_VERTICAL));

  GtkWidget *canvas = gtk_drawing_area_new ();

  gtk_widget_set_hexpand (canvas, TRUE);
  gtk_widget_set_vexpand (canvas, TRUE);
  gtk_drawing_area_set_draw_func (GTK_DRAWING_AREA (canvas), adw_cn_paint_sketch, NULL, NULL);
  gtk_box_append (row, canvas);

  return GTK_WIDGET (view);
}
