/* A photo library: a grid of pictures with a selection badge over one of them, and the
 * tags under it.
 *
 * The same scene as App.tsx beside this. This one is built with the toolkit, so what it
 * lays out is what the components have to match -- bin/02-app-trees walks it and writes
 * out every node, where it was put and what it draws.
 */

#include <adwaita.h>

static const char *const adw_cn_photos_tags[] = {
  "Holiday", "Family", "Landscape", "Portrait", "Archive", NULL,
};

static void
adw_cn_photos_swatch (GtkDrawingArea *area,
                      cairo_t        *context,
                      int             width,
                      int             height,
                      gpointer        data)
{
  (void) area;
  (void) data;

  cairo_set_source_rgb (context, 0.21, 0.52, 0.89);
  cairo_rectangle (context, 0, 0, width, height);
  cairo_fill (context);
}

GtkWidget *
adw_cn_build_photos (void)
{
  AdwToolbarView *view = ADW_TOOLBAR_VIEW (adw_toolbar_view_new ());
  AdwHeaderBar *bar = ADW_HEADER_BAR (adw_header_bar_new ());

  GtkWidget *select = gtk_button_new_with_label ("Select");

  gtk_widget_add_css_class (select, "flat");
  adw_header_bar_pack_end (bar, select);
  adw_toolbar_view_add_top_bar (view, GTK_WIDGET (bar));

  GtkBox *column = GTK_BOX (gtk_box_new (GTK_ORIENTATION_VERTICAL, 12));

  gtk_widget_set_margin_top (GTK_WIDGET (column), 12);
  gtk_widget_set_margin_bottom (GTK_WIDGET (column), 12);
  gtk_widget_set_margin_start (GTK_WIDGET (column), 12);
  gtk_widget_set_margin_end (GTK_WIDGET (column), 12);
  adw_toolbar_view_set_content (view, GTK_WIDGET (column));

  /* ── the grid ────────────────────────────────────────────────────────── */

  GtkWidget *scrolled = gtk_scrolled_window_new ();

  gtk_widget_set_size_request (scrolled, -1, 180);

  GtkFlowBox *flow = GTK_FLOW_BOX (gtk_flow_box_new ());

  gtk_flow_box_set_min_children_per_line (flow, 3);
  gtk_flow_box_set_max_children_per_line (flow, 5);
  gtk_flow_box_set_row_spacing (flow, 6);
  gtk_flow_box_set_column_spacing (flow, 6);
  gtk_flow_box_set_selection_mode (flow, GTK_SELECTION_NONE);

  /* Each thumbnail is a child in its own right, because what the application built is a
   * GtkFlowBoxChild and not the image inside it. */
  for (int index = 1; index <= 8; index++)
    {
      GtkWidget *child = gtk_flow_box_child_new ();
      GtkWidget *image = gtk_image_new_from_icon_name ("image-x-generic-symbolic");
      char *tooltip = g_strdup_printf ("Photo %d", index);

      gtk_image_set_pixel_size (GTK_IMAGE (image), 48);
      gtk_flow_box_child_set_child (GTK_FLOW_BOX_CHILD (child), image);
      gtk_widget_set_tooltip_text (child, tooltip);
      gtk_flow_box_append (flow, child);

      g_free (tooltip);
    }

  gtk_scrolled_window_set_child (GTK_SCROLLED_WINDOW (scrolled), GTK_WIDGET (flow));
  gtk_box_append (column, scrolled);

  /* ── the selected photo ──────────────────────────────────────────────── */

  GtkOverlay *hero = GTK_OVERLAY (gtk_overlay_new ());
  GtkWidget *frame = gtk_aspect_frame_new (0.5, 0.5, 1.5, FALSE);
  GtkWidget *offload = gtk_graphics_offload_new (NULL);
  GtkWidget *picture = gtk_picture_new ();

  gtk_picture_set_alternative_text (GTK_PICTURE (picture), "The selected photo");
  gtk_widget_set_size_request (picture, -1, 120);
  gtk_graphics_offload_set_child (GTK_GRAPHICS_OFFLOAD (offload), picture);
  gtk_aspect_frame_set_child (GTK_ASPECT_FRAME (frame), offload);
  gtk_overlay_set_child (hero, frame);

  GtkWidget *badge = gtk_label_new ("1 selected");

  gtk_widget_set_halign (badge, GTK_ALIGN_END);
  gtk_widget_set_valign (badge, GTK_ALIGN_START);
  gtk_widget_add_css_class (badge, "osd");
  gtk_overlay_add_overlay (hero, badge);

  gtk_box_append (column, GTK_WIDGET (hero));

  /* The editor's canvas, which is where a photo application draws its own pixels. */
  GtkWidget *canvas = gtk_drawing_area_new ();

  gtk_drawing_area_set_content_width (GTK_DRAWING_AREA (canvas), 120);
  gtk_drawing_area_set_content_height (GTK_DRAWING_AREA (canvas), 48);
  gtk_drawing_area_set_draw_func (GTK_DRAWING_AREA (canvas), adw_cn_photos_swatch, NULL, NULL);
  gtk_box_append (column, canvas);

  GtkWidget *gl = gtk_gl_area_new ();

  gtk_widget_set_size_request (gl, -1, 48);
  gtk_box_append (column, gl);

  /* ── the tags ────────────────────────────────────────────────────────── */

  AdwWrapBox *tags = ADW_WRAP_BOX (adw_wrap_box_new ());

  adw_wrap_box_set_child_spacing (tags, 6);
  adw_wrap_box_set_line_spacing (tags, 6);

  for (gsize i = 0; adw_cn_photos_tags[i]; i++)
    {
      GtkWidget *tag = gtk_label_new (adw_cn_photos_tags[i]);

      gtk_widget_add_css_class (tag, "dim-label");
      adw_wrap_box_append (tags, tag);
    }

  gtk_box_append (column, GTK_WIDGET (tags));

  return GTK_WIDGET (view);
}
