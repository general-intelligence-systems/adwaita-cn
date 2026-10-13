/* widget-trees — every widget's CSS node tree, read out of a running toolkit.
 *
 * THE TOOLKIT BUILDS THE TREE, so the toolkit is what says what it is. A widget's CSS
 * nodes are made in its own C -- gtk_widget_class_set_css_name for its own, a gizmo or a
 * template child for each one under it -- and nothing declarative states the result: a
 * stylesheet mentions whichever nodes it happens to have a rule for, and a doc comment
 * draws a picture of some of them. Both were being read as if they were the structure,
 * which is how a GtkDropDown came out as a chevron with no button under it.
 *
 * So this builds each widget and walks it. gtk_widget_get_css_name and
 * gtk_widget_get_css_classes are what GTK's own cascade matches against, and
 * gtk_widget_get_first_child walks the same tree the cascade walks, so what comes out is
 * the tree Adwaita was written against rather than an account of it.
 *
 * Each widget is walked TWICE: once as it is constructed, and once with the properties a
 * caller would set -- a label, a title, an icon, a placeholder. GTK builds a node only
 * when it has something to put in it, so the second walk is what says that a check button
 * has a label node when it is given a label, and the difference between the two is which
 * nodes are conditional on what.
 *
 * Built and run by bin/01-fetch-adwaita, beside the stylesheets it vendors from the same
 * two libraries.
 */

#include <adwaita.h>
#include <gtk/gtk.h>
#include <girepository.h>
#include <stdio.h>
#include <string.h>

/* The properties a caller sets, which is what makes the optional nodes appear. Each is
 * applied only where the widget really has it and the type matches, so this is a list of
 * what applications set and not a list of special cases. */
static const struct { const char *name; const char *value; } TEXTS[] = {
  { "label", "Label" },
  { "title", "Title" },
  { "subtitle", "Subtitle" },
  { "description", "Description" },
  { "text", "Text" },
  { "placeholder-text", "Placeholder" },
  { "icon-name", "list-add-symbolic" },
  { "secondary-icon-name", "edit-clear-symbolic" },
  { "accelerator", "<ctrl>c" },
};

static const struct { const char *name; gboolean value; } FLAGS[] = {
  { "active", TRUE },
  { "expanded", TRUE },
  { "show-peek-icon", TRUE },
  { "show-arrow", TRUE },
  { "enable-search", TRUE },
  { "draw-value", TRUE },
  { "show-title-buttons", TRUE },
};

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

/* One node: what the cascade calls it, what it carries, and what is under it. */
static void
print_node (GtkWidget *widget)
{
  const char *name = gtk_widget_get_css_name (widget);
  char **classes = gtk_widget_get_css_classes (widget);
  GType type = G_OBJECT_TYPE (widget);

  fputs ("{\"node\":", stdout);
  print_string (name ? name : "");
  fputs (",\"type\":", stdout);
  print_string (g_type_name (type));
  fputs (",\"classes\":[", stdout);

  for (guint i = 0; classes && classes[i]; i++)
    {
      if (i > 0)
        fputc (',', stdout);
      print_string (classes[i]);
    }

  fputs ("]", stdout);

  /* WHAT ARRANGES THE CHILDREN, which no stylesheet states and which was a table written
   * out by hand: a box is a row because its layout manager is a GtkBoxLayout, a bin hands
   * its child the whole allocation, a clamp eases it on a curve. The widget knows which it
   * is, so it is asked. */
  GtkLayoutManager *layout = gtk_widget_get_layout_manager (widget);

  if (layout != NULL)
    {
      fputs (",\"layout\":", stdout);
      print_string (g_type_name (G_OBJECT_TYPE (layout)));

      if (GTK_IS_ORIENTABLE (layout))
        {
          fputs (",\"orientation\":", stdout);
          print_string (gtk_orientable_get_orientation (GTK_ORIENTABLE (layout)) == GTK_ORIENTATION_VERTICAL ? "vertical" : "horizontal");
        }
    }

  /* And how much room it asks for, which is the measurement every rule in the stylesheet
   * is finally about. The minimum is what GTK will not allocate less than. */
  GtkRequisition minimum, natural;
  gtk_widget_get_preferred_size (widget, &minimum, &natural);
  printf (",\"minimum\":[%d,%d],\"natural\":[%d,%d]",
          minimum.width, minimum.height, natural.width, natural.height);

  fputs (",\"children\":[", stdout);

  gboolean first = TRUE;
  for (GtkWidget *child = gtk_widget_get_first_child (widget);
       child != NULL;
       child = gtk_widget_get_next_sibling (child))
    {
      if (!first)
        fputc (',', stdout);
      first = FALSE;
      print_node (child);
    }

  fputs ("]}", stdout);
  g_strfreev (classes);
}

/* The properties an application sets, where this widget really has them. */
static void
populate (GObject *object)
{
  GObjectClass *klass = G_OBJECT_GET_CLASS (object);

  for (gsize i = 0; i < G_N_ELEMENTS (TEXTS); i++)
    {
      GParamSpec *spec = g_object_class_find_property (klass, TEXTS[i].name);

      if (spec == NULL || !(spec->flags & G_PARAM_WRITABLE) || (spec->flags & G_PARAM_CONSTRUCT_ONLY))
        continue;
      if (spec->value_type != G_TYPE_STRING)
        continue;

      g_object_set (object, TEXTS[i].name, TEXTS[i].value, NULL);
    }

  for (gsize i = 0; i < G_N_ELEMENTS (FLAGS); i++)
    {
      GParamSpec *spec = g_object_class_find_property (klass, FLAGS[i].name);

      if (spec == NULL || !(spec->flags & G_PARAM_WRITABLE) || (spec->flags & G_PARAM_CONSTRUCT_ONLY))
        continue;
      if (spec->value_type != G_TYPE_BOOLEAN)
        continue;

      g_object_set (object, FLAGS[i].name, FLAGS[i].value, NULL);
    }
}

/* One turn of the loop, so that what a widget builds when it is mapped is built before it
 * is walked: a popover's contents, a row's expansion, an entry's placeholder. */
static void
settle (void)
{
  for (int i = 0; i < 64 && g_main_context_pending (NULL); i++)
    g_main_context_iteration (NULL, FALSE);
}

/* A widget of this type, in a window, realised. NULL where the type cannot be built with
 * no arguments -- which is what a type with a construct-only property it cannot default
 * amounts to. */
/* The construct-only properties a widget cannot be built without.
 *
 * AdwLayoutSlot aborts -- g_error, which is always fatal -- when it is constructed with
 * no `id`, so a run which built every widget in the two libraries died partway through
 * the alphabet. A construct-only string is given one here rather than the type being
 * skipped: what the widget builds is the point, and it builds it either way. */
static GObject *
construct (GType type)
{
  GObjectClass *klass = g_type_class_ref (type);
  guint count = 0;
  GParamSpec **specs = g_object_class_list_properties (klass, &count);
  const char *names[16];
  GValue values[16] = { G_VALUE_INIT };
  guint given = 0;

  for (guint i = 0; i < count && given < G_N_ELEMENTS (names); i++)
    {
      GParamSpec *spec = specs[i];

      if (!(spec->flags & G_PARAM_CONSTRUCT_ONLY) || !(spec->flags & G_PARAM_WRITABLE))
        continue;
      if (spec->value_type != G_TYPE_STRING)
        continue;
      /* ONLY WHERE THE WIDGET REFUSES TO BE BUILT WITHOUT IT. A value handed to every
       * construct-only string instead sent AdwAboutDialog looking for a resource called
       * `/x` and it aborted on not finding one. `id` is the one a widget asserts on. */
      if (!g_str_equal (spec->name, "id"))
        continue;

      names[given] = spec->name;
      g_value_init (&values[given], G_TYPE_STRING);
      g_value_set_string (&values[given], "main");
      given++;
    }

  GObject *object = g_object_new_with_properties (type, given, names, values);

  for (guint i = 0; i < given; i++)
    g_value_unset (&values[i]);

  g_free (specs);
  g_type_class_unref (klass);

  return object;
}

static GtkWidget *
build (GType type, GtkWidget *host)
{
  GObject *object = construct (type);

  if (object == NULL)
    return NULL;

  if (!GTK_IS_WIDGET (object))
    {
      g_object_unref (object);
      return NULL;
    }

  GtkWidget *widget = GTK_WIDGET (object);

  /* A toplevel is its own window; anything else goes in one, because a widget which was
   * never put in a window is a widget GTK has not built the inside of. */
  if (GTK_IS_WINDOW (widget) || ADW_IS_DIALOG (widget))
    return widget;

  gtk_box_append (GTK_BOX (host), widget);

  return widget;
}

static void
dump (GType type, GtkWidget *host, gboolean full, gboolean *first)
{
  if (!g_type_is_a (type, GTK_TYPE_WIDGET) || G_TYPE_IS_ABSTRACT (type))
    return;

  GtkWidget *bare = build (type, host);

  if (bare == NULL)
    return;

  settle ();

  GtkWidget *given = build (type, host);

  if (given != NULL)
    {
      populate (G_OBJECT (given));
      settle ();
    }

  if (!*first)
    fputs (",\n  ", stdout);
  *first = FALSE;

  fputs ("{\"class\":", stdout);
  print_string (g_type_name (type));
  fputs (",\"parent\":", stdout);
  print_string (g_type_name (g_type_parent (type)));
  fputs (",\"bare\":", stdout);
  print_node (bare);

  if (given != NULL)
    {
      fputs (",\"given\":", stdout);
      print_node (given);
    }

  fputc ('}', stdout);

  if (GTK_IS_WINDOW (bare))
    gtk_window_destroy (GTK_WINDOW (bare));
  else if (!ADW_IS_DIALOG (bare))
    gtk_box_remove (GTK_BOX (host), bare);

  if (given != NULL)
    {
      if (GTK_IS_WINDOW (given))
        gtk_window_destroy (GTK_WINDOW (given));
      else if (!ADW_IS_DIALOG (given))
        gtk_box_remove (GTK_BOX (host), given);
    }

  (void) full;
}

/* Every widget type the two libraries have.
 *
 * Through the typelibs rather than through g_type_children: a GType does not exist until
 * something has called its _get_type, so walking the type tree of a freshly started
 * process finds whatever GTK happened to have registered for itself and nothing else.
 * The typelib is the list of what the library HAS, and asking it for each type is what
 * registers it. */
static GList *
types (const char *namespace_)
{
  GIRepository *repository = g_irepository_get_default ();
  GError *error = NULL;
  GList *found = NULL;

  if (g_irepository_require (repository, namespace_, NULL, 0, &error) == NULL)
    {
      g_printerr ("widget-trees: %s: %s\n", namespace_, error->message);
      g_clear_error (&error);
      return NULL;
    }

  gint count = g_irepository_get_n_infos (repository, namespace_);

  for (gint i = 0; i < count; i++)
    {
      GIBaseInfo *info = g_irepository_get_info (repository, namespace_, i);

      if (GI_IS_OBJECT_INFO (info))
        {
          GType type = g_registered_type_info_get_g_type ((GIRegisteredTypeInfo *) info);

          if (type != G_TYPE_INVALID && g_type_is_a (type, GTK_TYPE_WIDGET) && !G_TYPE_IS_ABSTRACT (type))
            found = g_list_prepend (found, GSIZE_TO_POINTER (type));
        }

      g_base_info_unref (info);
    }

  return g_list_reverse (found);
}

int
main (int argc, char **argv)
{
  (void) argc;
  (void) argv;

  /* A critical from a widget built with nothing set is not a reason to lose the run: the
   * point is what the widget builds, and a complaint about a model it has not been given
   * is not that. */
  g_log_set_always_fatal (G_LOG_LEVEL_ERROR);

  gtk_init ();
  adw_init ();

  /* The scheme the shots are taken in, so a node which only exists in one is the one the
   * rest of the pipeline sees. */
  adw_style_manager_set_color_scheme (adw_style_manager_get_default (), ADW_COLOR_SCHEME_FORCE_LIGHT);

  GtkWidget *window = gtk_window_new ();
  GtkWidget *host = gtk_box_new (GTK_ORIENTATION_VERTICAL, 0);

  gtk_window_set_child (GTK_WINDOW (window), host);
  gtk_window_set_default_size (GTK_WINDOW (window), 800, 600);
  gtk_window_present (GTK_WINDOW (window));
  settle ();

  fputs ("{\n  \"widgets\": [\n  ", stdout);

  gboolean first = TRUE;

  for (const char **namespace_ = (const char *[]){ "Gtk", "Adw", NULL }; *namespace_; namespace_++)
    {
      GList *found = types (*namespace_);

      for (GList *one = found; one != NULL; one = one->next)
        dump ((GType) GPOINTER_TO_SIZE (one->data), host, TRUE, &first);

      g_list_free (found);
    }

  fputs ("\n  ]\n}\n", stdout);

  return 0;
}
