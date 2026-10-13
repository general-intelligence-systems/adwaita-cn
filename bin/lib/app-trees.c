/* app-trees — every application, as the toolkit lays it out.
 *
 * THE APPLICATIONS ARE THE SUCCESS CRITERION, so the applications are what gets measured.
 * bin/apps/<name>/app.c builds a scene with real GTK and libadwaita; this walks what it
 * built and writes out, for every CSS node in it:
 *
 *   selector   the node's own name and style classes -- `button.suggested-action`
 *   path       the chain of those from the window down, which is what a rule matches
 *   rect       where the toolkit put it, in the scene's own coordinates
 *   minimum    what it asked for, which is what GTK will not go below
 *   layout     what arranges its children, which no stylesheet states
 *   paint      what it actually draws: background, radius, border, shadow, font, colour
 *
 * The same four questions the browser answers about the components with
 * getBoundingClientRect and getComputedStyle, asked of the toolkit about the same screen.
 * Two files of the same shape, so the comparison is a diff rather than a photograph
 * somebody has to look at.
 *
 * Built and run by bin/02-app-trees.
 */

#include <adwaita.h>
#include <gtk/gtk.h>
#include <stdio.h>
#include <string.h>

#include "apps.h"

static void
print_escaped (const char *text)
{
  for (const char *c = text; c && *c; c++)
    {
      switch (*c)
        {
        case '"':  fputs ("\\\"", stdout); break;
        case '\\': fputs ("\\\\", stdout); break;
        case '\n': fputs ("\\n", stdout); break;
        case '\t': fputs ("\\t", stdout); break;
        default:
          if ((unsigned char) *c < 0x20)
            printf ("\\u%04x", *c);
          else
            fputc (*c, stdout);
        }
    }
}

static void
print_string (const char *text)
{
  fputc ('"', stdout);
  print_escaped (text);
  fputc ('"', stdout);
}

static void
print_rgba (const char *key, const GdkRGBA *colour)
{
  printf (",\"%s\":\"rgba(%.0f,%.0f,%.0f,%g)\"", key,
          colour->red * 255.0, colour->green * 255.0, colour->blue * 255.0, colour->alpha);
}

static void
print_radius (const GskRoundedRect *rect)
{
  printf (",\"radius\":[%g,%g,%g,%g]",
          rect->corner[GSK_CORNER_TOP_LEFT].width,
          rect->corner[GSK_CORNER_TOP_RIGHT].width,
          rect->corner[GSK_CORNER_BOTTOM_RIGHT].width,
          rect->corner[GSK_CORNER_BOTTOM_LEFT].width);
}

/* What this node draws of itself.
 *
 * The frame is walked only as far as the first thing drawn at a size other than this
 * node's own: a widget paints its background and its border over its whole allocation and
 * then paints its children, so what is bounded by the node's own rectangle is the node's
 * own style and the rest belongs to something below it.
 */
/* Whether this operation is the node's own.
 *
 * A widget paints its background and its border over the whole of its allocation and then
 * paints its children, and the walk sees both. What covers the node is the node's style;
 * what is smaller belongs to something below it, which is walked on its own and reports it
 * there. Without the test, a toolbar view's paint was every button, entry and switch in
 * the window. */
static gboolean
covers (GskRenderNode *node, float width, float height)
{
  graphene_rect_t bounds;

  gsk_render_node_get_bounds (node, &bounds);

  return bounds.size.width >= width - 1 && bounds.size.height >= height - 1;
}

static void
print_paint (GskRenderNode *node, float width, float height, gboolean *first, int depth, gboolean leaf)
{
  if (node == NULL || depth > 6)
    return;

  switch (gsk_render_node_get_node_type (node))
    {
    case GSK_CONTAINER_NODE:
      for (guint i = 0; i < gsk_container_node_get_n_children (node); i++)
        print_paint (gsk_container_node_get_child (node, i), width, height, first, depth, leaf);
      return;

    case GSK_TRANSFORM_NODE:
      print_paint (gsk_transform_node_get_child (node), width, height, first, depth + 1, leaf);
      return;

    case GSK_CLIP_NODE:
      print_paint (gsk_clip_node_get_child (node), width, height, first, depth, leaf);
      return;

    case GSK_OPACITY_NODE:
      print_paint (gsk_opacity_node_get_child (node), width, height, first, depth, leaf);
      return;

    case GSK_DEBUG_NODE:
      print_paint (gsk_debug_node_get_child (node), width, height, first, depth, leaf);
      return;

    case GSK_ROUNDED_CLIP_NODE:
      {
        const GskRoundedRect *clip = gsk_rounded_clip_node_get_clip (node);

        if (!covers (node, width, height))
          {
            print_paint (gsk_rounded_clip_node_get_child (node), width, height, first, depth, leaf);
            return;
          }

        if (!*first)
          fputc (',', stdout);
        *first = FALSE;
        fputs ("{\"draw\":\"radius\"", stdout);
        print_radius (clip);
        fputc ('}', stdout);

        print_paint (gsk_rounded_clip_node_get_child (node), width, height, first, depth, leaf);
        return;
      }

    case GSK_COLOR_NODE:
      {
        graphene_rect_t bounds;

        gsk_render_node_get_bounds (node, &bounds);

        /* The node's own background covers the node. Anything smaller is a child's. */
        if (bounds.size.width < width - 1 || bounds.size.height < height - 1)
          return;

        if (!*first)
          fputc (',', stdout);
        *first = FALSE;
        fputs ("{\"draw\":\"background\"", stdout);
        print_rgba ("color", gsk_color_node_get_color (node));
        fputc ('}', stdout);
        return;
      }

    case GSK_BORDER_NODE:
      {
        const float *widths = gsk_border_node_get_widths (node);

        if (!covers (node, width, height))
          return;

        if (!*first)
          fputc (',', stdout);
        *first = FALSE;
        printf ("{\"draw\":\"border\",\"widths\":[%g,%g,%g,%g]", widths[0], widths[1], widths[2], widths[3]);
        print_rgba ("color", gsk_border_node_get_colors (node));
        print_radius (gsk_border_node_get_outline (node));
        fputc ('}', stdout);
        return;
      }

    case GSK_INSET_SHADOW_NODE:
      {
        if (!covers (node, width, height))
          return;

        if (!*first)
          fputc (',', stdout);
        *first = FALSE;
        printf ("{\"draw\":\"inset-shadow\",\"offset\":[%g,%g],\"blur\":%g,\"spread\":%g",
                gsk_inset_shadow_node_get_dx (node), gsk_inset_shadow_node_get_dy (node),
                gsk_inset_shadow_node_get_blur_radius (node), gsk_inset_shadow_node_get_spread (node));
        print_rgba ("color", gsk_inset_shadow_node_get_color (node));
        fputc ('}', stdout);
        return;
      }

    case GSK_OUTSET_SHADOW_NODE:
      {
        if (!covers (node, width, height))
          return;

        if (!*first)
          fputc (',', stdout);
        *first = FALSE;
        printf ("{\"draw\":\"shadow\",\"offset\":[%g,%g],\"blur\":%g,\"spread\":%g",
                gsk_outset_shadow_node_get_dx (node), gsk_outset_shadow_node_get_dy (node),
                gsk_outset_shadow_node_get_blur_radius (node), gsk_outset_shadow_node_get_spread (node));
        print_rgba ("color", gsk_outset_shadow_node_get_color (node));
        fputc ('}', stdout);
        return;
      }

    case GSK_TEXT_NODE:
      {
        if (!leaf)
          return;

        PangoFont *font = gsk_text_node_get_font (node);
        PangoFontDescription *described = pango_font_describe (font);
        char *text = pango_font_description_to_string (described);

        if (!*first)
          fputc (',', stdout);
        *first = FALSE;
        fputs ("{\"draw\":\"text\",\"font\":", stdout);
        print_string (text);
        print_rgba ("color", gsk_text_node_get_color (node));
        fputc ('}', stdout);

        g_free (text);
        pango_font_description_free (described);
        return;
      }

    default:
      return;
    }
}

static void
print_paints (GtkWidget *widget)
{
  int width = gtk_widget_get_width (widget);
  int height = gtk_widget_get_height (widget);

  fputs (",\"paint\":[", stdout);

  if (width > 0 && height > 0)
    {
      GtkSnapshot *snapshot = gtk_snapshot_new ();
      GdkPaintable *paintable = gtk_widget_paintable_new (widget);

      gdk_paintable_snapshot (paintable, GDK_SNAPSHOT (snapshot), width, height);

      GskRenderNode *node = gtk_snapshot_free_to_node (snapshot);
      gboolean first = TRUE;

      print_paint (node, width, height, &first, 0, gtk_widget_get_first_child (widget) == NULL);

      if (node != NULL)
        gsk_render_node_unref (node);
      g_object_unref (paintable);
    }

  fputc (']', stdout);
}

/* One node of the scene: what it is called, where it was put, and what it draws. */
static void
print_node (GtkWidget *widget, GtkWidget *scene, const char *above, gboolean *first)
{
  if (!gtk_widget_get_visible (widget))
    return;

  const char *name = gtk_widget_get_css_name (widget);
  char **classes = gtk_widget_get_css_classes (widget);
  GString *selector = g_string_new (name ? name : "widget");

  for (guint i = 0; classes && classes[i]; i++)
    g_string_append_printf (selector, ".%s", classes[i]);

  char *path = above == NULL ? g_strdup (selector->str) : g_strdup_printf ("%s > %s", above, selector->str);

  graphene_rect_t bounds;
  gboolean placed = gtk_widget_compute_bounds (widget, scene, &bounds);

  GtkRequisition minimum, natural;
  gtk_widget_get_preferred_size (widget, &minimum, &natural);

  if (!*first)
    fputs (",\n  ", stdout);
  *first = FALSE;

  fputs ("{\"selector\":", stdout);
  print_string (selector->str);
  fputs (",\"path\":", stdout);
  print_string (path);
  fputs (",\"node\":", stdout);
  print_string (name ? name : "");
  fputs (",\"type\":", stdout);
  print_string (G_OBJECT_TYPE_NAME (widget));

  printf (",\"rect\":[%g,%g,%g,%g]",
          placed ? bounds.origin.x : 0.0, placed ? bounds.origin.y : 0.0,
          placed ? bounds.size.width : 0.0, placed ? bounds.size.height : 0.0);
  printf (",\"minimum\":[%d,%d],\"natural\":[%d,%d]",
          minimum.width, minimum.height, natural.width, natural.height);

  GtkLayoutManager *layout = gtk_widget_get_layout_manager (widget);

  if (layout != NULL)
    {
      fputs (",\"layout\":", stdout);
      print_string (G_OBJECT_TYPE_NAME (layout));

      if (GTK_IS_ORIENTABLE (layout))
        {
          fputs (",\"orientation\":", stdout);
          print_string (gtk_orientable_get_orientation (GTK_ORIENTABLE (layout)) == GTK_ORIENTATION_VERTICAL
                        ? "vertical" : "horizontal");
        }
    }

  print_paints (widget);
  fputc ('}', stdout);

  for (GtkWidget *child = gtk_widget_get_first_child (widget);
       child != NULL;
       child = gtk_widget_get_next_sibling (child))
    print_node (child, scene, path, first);

  g_strfreev (classes);
  g_string_free (selector, TRUE);
  g_free (path);
}

static gboolean
stop (gpointer loop)
{
  g_main_loop_quit (loop);
  return G_SOURCE_REMOVE;
}

/* The frame clock has to run: GTK lays out and renders from it, and a widget which has
 * not been through a frame is 0x0 and draws nothing. */
static void
settle (void)
{
  GMainLoop *loop = g_main_loop_new (NULL, FALSE);

  g_timeout_add (60, stop, loop);
  g_main_loop_run (loop);
  g_main_loop_unref (loop);

  for (int i = 0; i < 256 && g_main_context_pending (NULL); i++)
    g_main_context_iteration (NULL, FALSE);
}

static void
activate (GtkApplication *app, gpointer data)
{
  (void) data;

  /* The scheme and the font the shots are taken in. A scene measured in the dark palette
   * against components rendered in the light one is a comparison of two themes. */
  adw_style_manager_set_color_scheme (adw_style_manager_get_default (), ADW_COLOR_SCHEME_FORCE_LIGHT);

  /* GTK reads the font off the desktop and a bare X server has none, so the same two
   * settings bin/lib/offscreen.rb carries over are carried over here: without them the
   * scene is laid out in GTK's fallback font and every width in it is a different
   * question from the one the browser is being asked. */
  {
    const char *font = g_getenv ("ADW_CN_FONT");
    const char *dpi = g_getenv ("ADW_CN_DPI");

    if (font != NULL)
      g_object_set (gtk_settings_get_default (), "gtk-font-name", font, NULL);
    if (dpi != NULL)
      g_object_set (gtk_settings_get_default (), "gtk-xft-dpi", (int) (g_ascii_strtod (dpi, NULL) * 1024), NULL);
  }

  fputs ("{\n \"scenes\": {\n", stdout);

  gboolean first_scene = TRUE;

  for (const AdwCnApp *one = adw_cn_apps; one->name != NULL; one++)
    {
      GtkWidget *window = GTK_WIDGET (adw_application_window_new (app));
      GtkWidget *content = one->build ();

      adw_application_window_set_content (ADW_APPLICATION_WINDOW (window), content);
      gtk_window_set_default_size (GTK_WINDOW (window), one->width, one->height);

      /* The size is asked of the content and not of the window, for the same reason the
       * shots are: with no settings daemon a presented window settles at its minimum, and
       * a scene measured at the wrong size is a different layout rather than a smaller
       * picture of one. */
      gtk_widget_set_size_request (content, one->width, one->height);
      gtk_window_present (GTK_WINDOW (window));
      settle ();

      if (!first_scene)
        fputs (",\n", stdout);
      first_scene = FALSE;

      fputc (' ', stdout);
      print_string (one->name);
      printf (": {\"width\":%d,\"height\":%d,\"nodes\":[\n  ", one->width, one->height);

      gboolean first = TRUE;
      print_node (content, content, NULL, &first);

      fputs ("\n ]}", stdout);

      gtk_window_destroy (GTK_WINDOW (window));
      settle ();
    }

  fputs ("\n }\n}\n", stdout);

  g_application_quit (G_APPLICATION (app));
}

int
main (int argc, char **argv)
{
  (void) argc;
  (void) argv;

  g_log_set_always_fatal (G_LOG_LEVEL_ERROR);

  AdwApplication *app = adw_application_new ("dev.adwaita-cn.app-trees", G_APPLICATION_DEFAULT_FLAGS);

  g_signal_connect (app, "activate", G_CALLBACK (activate), NULL);

  int status = g_application_run (G_APPLICATION (app), 0, NULL);

  g_object_unref (app);

  return status;
}
