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
  /* NOT AN ICON. A button given a label and an icon name is an `.image-button` with an
   * image in it and no label -- GTK picks one -- so a walk which set both reported every
   * button in the toolkit as an icon button. What a component draws for an icon it draws
   * from its own `icon-name` prop, which is the same decision made in the same place. */
  { "accelerator", "<ctrl>c" },
};

/* NOT THE FLAGS. Setting `show-title-buttons`, `expanded` and the rest made each widget
 * build structure no caller had asked for -- a header bar came back with window controls
 * and a back button in it, which the components then drew in every application. What a
 * property turns on is the component's own decision, made from the prop it was given; what
 * belongs in the tree is what the widget builds when it is handed content. */
static const struct { const char *name; gboolean value; } FLAGS[] = {
  { "", FALSE },
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

/* ── what a widget takes ──────────────────────────────────────────────────────
 *
 * A property is a GParamSpec, which carries everything the registry needs to turn it into
 * a prop: its name, its type, whether it can be written, what it defaults to, and -- for an
 * enum -- every value it can take. All of it is asked of the class rather than read out of
 * a GIR, a schema dump or a documentation page, which is three files and two stages of the
 * pipeline that said the same thing less exactly.
 */
static void
print_default (GParamSpec *spec)
{
  const GValue *value = g_param_spec_get_default_value (spec);

  if (value == NULL)
    return;

  switch (G_TYPE_FUNDAMENTAL (G_VALUE_TYPE (value)))
    {
    case G_TYPE_BOOLEAN:
      printf (",\"default\":%s", g_value_get_boolean (value) ? "true" : "false");
      return;
    case G_TYPE_INT:
      printf (",\"default\":%d", g_value_get_int (value));
      return;
    case G_TYPE_UINT:
      printf (",\"default\":%u", g_value_get_uint (value));
      return;
    case G_TYPE_LONG:
      printf (",\"default\":%ld", g_value_get_long (value));
      return;
    case G_TYPE_DOUBLE:
      printf (",\"default\":%g", g_value_get_double (value));
      return;
    case G_TYPE_FLOAT:
      printf (",\"default\":%g", g_value_get_float (value));
      return;
    case G_TYPE_STRING:
      {
        const char *text = g_value_get_string (value);

        if (text == NULL)
          return;

        fputs (",\"default\":", stdout);
        print_string (text);
        return;
      }
    case G_TYPE_ENUM:
      {
        GEnumClass *klass = g_type_class_ref (G_VALUE_TYPE (value));
        GEnumValue *found = g_enum_get_value (klass, g_value_get_enum (value));

        if (found != NULL)
          {
            fputs (",\"default\":", stdout);
            print_string (found->value_nick);
          }

        g_type_class_unref (klass);
        return;
      }
    default:
      return;
    }
}

/* An enum's values, by the nick GTK gives each one, which is the name a .ui file writes
 * and the one the registry turns into a string union. */
static void
print_enum (GType type)
{
  if (!G_TYPE_IS_ENUM (type) && !G_TYPE_IS_FLAGS (type))
    return;

  printf (",\"enum\":\"%s\",\"values\":[", g_type_name (type));

  if (G_TYPE_IS_ENUM (type))
    {
      GEnumClass *klass = g_type_class_ref (type);

      for (guint i = 0; i < klass->n_values; i++)
        {
          if (i > 0)
            fputc (',', stdout);
          print_string (klass->values[i].value_nick);
        }

      g_type_class_unref (klass);
    }
  else
    {
      GFlagsClass *klass = g_type_class_ref (type);

      for (guint i = 0; i < klass->n_values; i++)
        {
          if (i > 0)
            fputc (',', stdout);
          print_string (klass->values[i].value_nick);
        }

      g_type_class_unref (klass);
    }

  fputc (']', stdout);
}

/* Every property this widget adds, which is the ones whose owner is this class: a button
 * takes a label, and the forty-odd a GtkWidget takes are the widget's and are written out
 * once, against GtkWidget itself. */
static void
print_properties (GType type, GObject *built)
{
  /* EVERY PROPERTY THE BUILT OBJECT HAS, with the class which gave it to it. A widget's
   * own are only some of them: `orientation` comes from GtkOrientable and `text` from
   * GtkEditable, and keeping only the ones the class itself owns left every box with no
   * direction and every entry with no text. Where each came from is written out, so the
   * registry can still tell a button's own from the forty every widget has. */
  GObjectClass *klass = built != NULL ? G_OBJECT_GET_CLASS (built) : g_type_class_ref (type);
  guint count = 0;
  GParamSpec **specs = g_object_class_list_properties (klass, &count);
  gboolean first = TRUE;

  fputs (",\"properties\":[", stdout);

  for (guint i = 0; i < count; i++)
    {
      GParamSpec *spec = specs[i];

      /* THE INTERFACES COUNT TOO. `orientation` belongs to GtkOrientable and `text` to
       * GtkEditable, not to the box or the entry which implements them, so a walk of a
       * class's own properties alone left every box with no direction and every entry with
       * no text. An interface's properties are the widget's where the widget is the first
       * in its chain to implement it. */

      if (!first)
        fputc (',', stdout);
      first = FALSE;

      fputs ("{\"name\":", stdout);
      print_string (spec->name);
      fputs (",\"owner\":", stdout);
      print_string (g_type_name (spec->owner_type));
      fputs (",\"type\":", stdout);
      print_string (g_type_name (spec->value_type));
      printf (",\"readable\":%s,\"writable\":%s,\"constructOnly\":%s",
              (spec->flags & G_PARAM_READABLE) ? "true" : "false",
              (spec->flags & G_PARAM_WRITABLE) ? "true" : "false",
              (spec->flags & G_PARAM_CONSTRUCT_ONLY) ? "true" : "false");

      if (g_type_is_a (spec->value_type, GTK_TYPE_WIDGET))
        fputs (",\"takesWidget\":true", stdout);

      if (g_param_spec_get_blurb (spec) != NULL)
        {
          fputs (",\"blurb\":", stdout);
          print_string (g_param_spec_get_blurb (spec));
        }

      print_enum (spec->value_type);
      print_default (spec);

      fputc ('}', stdout);
    }

  fputs ("]", stdout);

  g_free (specs);

  if (built == NULL)
    g_type_class_unref (klass);
}

/* One node: what the cascade calls it, what it carries, and what is under it. */
static void
print_node (GtkWidget *widget, const char *above)
{
  const char *name = gtk_widget_get_css_name (widget);
  char **classes = gtk_widget_get_css_classes (widget);
  GType type = G_OBJECT_TYPE (widget);

  /* THE SELECTOR THIS NODE IS ADDRESSED BY, which is the whole point of the walk: the
   * cascade matches a node by its name and the style classes on it, and a rule reaches it
   * through the chain of those from the widget down. `entry.search > text > placeholder`
   * is what Adwaita writes and what the registry resolves through, so it is what comes
   * out of here rather than a tree somebody has to rebuild the names from. */
  GString *selector = g_string_new (name ? name : "widget");

  for (guint i = 0; classes && classes[i]; i++)
    g_string_append_printf (selector, ".%s", classes[i]);

  char *path = above == NULL
    ? g_strdup (selector->str)
    : g_strdup_printf ("%s > %s", above, selector->str);

  fputs ("{\"selector\":", stdout);
  print_string (selector->str);
  fputs (",\"path\":", stdout);
  print_string (path);
  fputs (",\"node\":", stdout);
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
  /* HOW THE CHILDREN CAME OUT, for the widgets which arrange them in their own C and name
   * no layout manager at all -- a toolbar view, an entry, a scale, a switch. GTK has just
   * laid them out, so where they ended up says what the arrangement is: side by side is a
   * row, stacked is a column, and on top of each other is a bin. Guessing this per widget
   * was a table of forty-odd entries somebody had to keep true. */
  {
    GtkWidget *first_child = gtk_widget_get_first_child (widget);
    int count = 0;
    gboolean across = FALSE, down = FALSE;
    graphene_rect_t last = GRAPHENE_RECT_INIT (0, 0, 0, 0);

    for (GtkWidget *child = first_child; child != NULL; child = gtk_widget_get_next_sibling (child))
      {
        graphene_rect_t bounds;

        if (!gtk_widget_get_visible (child) || !gtk_widget_compute_bounds (child, widget, &bounds))
          continue;

        if (count > 0)
          {
            if (bounds.origin.x >= last.origin.x + last.size.width - 1)
              across = TRUE;
            if (bounds.origin.y >= last.origin.y + last.size.height - 1)
              down = TRUE;
          }

        last = bounds;
        count++;
      }

    if (count > 1)
      printf (",\"arranges\":\"%s\"", across && !down ? "row" : down && !across ? "column" : "bin");
    else if (count == 1)
      fputs (",\"arranges\":\"bin\"", stdout);
  }

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
  /* WHETHER IT IS ON SCREEN. A widget builds children it does not show: AdwHeaderBar makes
   * a back button and keeps it hidden until it is inside a navigation view, and a window
   * controls box is built empty. Drawn because the walk found them, they were a back arrow
   * and a close button in every header bar in every application. */
  printf (",\"visible\":%s", gtk_widget_get_visible (widget) ? "true" : "false");

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
      print_node (child, path);
    }

  fputs ("]}", stdout);
  g_strfreev (classes);
  g_string_free (selector, TRUE);
  g_free (path);
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
      if (FLAGS[i].name[0] == '\0')
        continue;

      GParamSpec *spec = g_object_class_find_property (klass, FLAGS[i].name);

      if (spec == NULL || !(spec->flags & G_PARAM_WRITABLE) || (spec->flags & G_PARAM_CONSTRUCT_ONLY))
        continue;
      if (spec->value_type != G_TYPE_BOOLEAN)
        continue;

      g_object_set (object, FLAGS[i].name, FLAGS[i].value, NULL);
    }
}

/* WHERE WHAT A CALLER GIVES IT GOES.
 *
 * A widget's own nodes are half its structure; the other half is where the thing an
 * application hands it ends up. AdwToolbarView puts its content between its bars,
 * AdwNavigationSplitView puts two widgets in two panes, AdwClamp puts one in the middle.
 * Nothing in a stylesheet says so and a walk of an empty widget cannot show it, which is
 * why every composite in the registry had its slots placed by hand -- and why a split view
 * drew its sidebar and its content beside the panes they belong in.
 *
 * So the widget is asked: put a marked label in the slot, walk the tree, report the path
 * it came out at.
 */
#define SLOT_MARK "adw-cn-slot"

/* Which of its parent's children the marked widget is. */
static gboolean
marked (GtkWidget *widget)
{
  if (gtk_widget_has_css_class (widget, SLOT_MARK))
    return TRUE;

  for (GtkWidget *child = gtk_widget_get_first_child (widget);
       child != NULL;
       child = gtk_widget_get_next_sibling (child))
    if (marked (child))
      return TRUE;

  return FALSE;
}

static int
marked_index (GtkWidget *widget)
{
  int index = 0;

  for (GtkWidget *child = gtk_widget_get_first_child (widget);
       child != NULL;
       child = gtk_widget_get_next_sibling (child))
    {
      if (marked (child))
        return gtk_widget_has_css_class (child, SLOT_MARK) ? index : marked_index (child);

      index++;
    }

  return index;
}

static char *
marked_path (GtkWidget *widget, const char *above)
{
  const char *name = gtk_widget_get_css_name (widget);
  char **classes = gtk_widget_get_css_classes (widget);
  GString *selector = g_string_new (name ? name : "widget");
  gboolean found = FALSE;

  for (guint i = 0; classes && classes[i]; i++)
    {
      if (g_str_equal (classes[i], SLOT_MARK))
        found = TRUE;
      else
        g_string_append_printf (selector, ".%s", classes[i]);
    }

  char *path = above == NULL ? g_strdup (selector->str) : g_strdup_printf ("%s > %s", above, selector->str);

  g_string_free (selector, TRUE);
  g_strfreev (classes);

  if (found)
    return path;

  for (GtkWidget *child = gtk_widget_get_first_child (widget);
       child != NULL;
       child = gtk_widget_get_next_sibling (child))
    {
      char *under = marked_path (child, path);

      if (under != NULL)
        {
          g_free (path);
          return under;
        }
    }

  g_free (path);

  return NULL;
}

/* One turn of the loop, so that what a widget builds when it is mapped is built before it
 * is walked: a popover's contents, a row's expansion, an entry's placeholder. */
static gboolean
stop (gpointer loop)
{
  g_main_loop_quit (loop);
  return G_SOURCE_REMOVE;
}

/* THE FRAME CLOCK HAS TO RUN, not just the pending work.
 *
 * GTK lays out and renders from the frame clock, and draining what is pending returns
 * immediately because none of it is pending yet: every widget came back 0x0 and drew
 * nothing, so there was no frame to read a background or a radius out of. Giving the loop
 * back for a few milliseconds is what lets the layout and the frame happen. */
static void
settle (void)
{
  GMainLoop *loop = g_main_loop_new (NULL, FALSE);

  g_timeout_add (30, stop, loop);
  g_main_loop_run (loop);
  g_main_loop_unref (loop);

  for (int i = 0; i < 256 && g_main_context_pending (NULL); i++)
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

/* Every slot this widget has: a property which takes a widget, and the path the widget
 * put in it came out at. Asked of a fresh widget each time, because a composite which has
 * been given one child places the next one somewhere else. */
static void
print_slots (GType type, GtkWidget *host)
{
  fputs (",\"slots\":{", stdout);

  GObjectClass *klass = g_type_class_ref (type);
  guint count = 0;
  GParamSpec **specs = g_object_class_list_properties (klass, &count);
  gboolean first = TRUE;

  for (guint i = 0; i < count; i++)
    {
      GParamSpec *spec = specs[i];

      if (!(spec->flags & G_PARAM_WRITABLE) || (spec->flags & G_PARAM_CONSTRUCT_ONLY))
        continue;
      if (!g_type_is_a (spec->value_type, GTK_TYPE_WIDGET))
        continue;

      GtkWidget *widget = build (type, host);

      if (widget == NULL)
        continue;

      /* A WIDGET WITH A SURFACE OF ITS OWN IS NOT ASKED. A window, a popover and a drag
       * icon each put their child on a surface rather than in the tree, and GtkDragIcon
       * asserts outright when it is given one while it sits in a box. gtk_native is the
       * toolkit's own name for that set. */
      if (GTK_IS_NATIVE (widget) || ADW_IS_DIALOG (widget))
        {
          gtk_box_remove (GTK_BOX (host), widget);
          continue;
        }

      /* OF THE TYPE THE SLOT TAKES. AdwNavigationSplitView's two take an
       * AdwNavigationPage and nothing else, so a label handed to either was refused and
       * the split view reported no slots at all. */
      GType wanted = spec->value_type;
      GtkWidget *mark = G_TYPE_IS_INSTANTIATABLE (wanted) && !G_TYPE_IS_ABSTRACT (wanted)
        ? GTK_WIDGET (g_object_new (wanted, NULL))
        : gtk_label_new ("slot");

      gtk_widget_add_css_class (mark, SLOT_MARK);
      g_object_set (widget, spec->name, mark, NULL);
      settle ();

      char *path = marked_path (widget, NULL);

      if (path != NULL)
        {
          if (!first)
            fputc (',', stdout);
          first = FALSE;
          print_string (spec->name);
          fputs (":{\"path\":", stdout);
          print_string (path);

          /* AND WHERE AMONG THE CHILDREN. AdwToolbarView puts its content between its two
           * bars, not after them: a slot rendered at the end of the parent put every
           * application's content under its bottom bar and 46px up the window. */
          printf (",\"index\":%d}", marked_index (widget));

          g_free (path);
        }

      gtk_box_remove (GTK_BOX (host), widget);
    }

  g_free (specs);
  g_type_class_unref (klass);

  fputc ('}', stdout);
}

static void
dump (GType type, GtkWidget *host, gboolean full, gboolean *first)
{
  if (!g_type_is_a (type, GTK_TYPE_WIDGET))
    return;

  /* AN ABSTRACT WIDGET HAS NO TREE AND STILL HAS PROPERTIES. GtkWidget's forty are every
   * widget's, GtkRange's are a scale's and a scrollbar's, and the registry needs the chain
   * to know which of a component's props are its own. One cannot be built, so it is
   * written out with what it takes and nothing it draws. */
  if (G_TYPE_IS_ABSTRACT (type))
    {
      if (!*first)
        fputs (",\n  ", stdout);
      *first = FALSE;

      fputs ("{\"class\":", stdout);
      print_string (g_type_name (type));
      fputs (",\"parent\":", stdout);
      print_string (g_type_name (g_type_parent (type)));
      fputs (",\"abstract\":true", stdout);
      print_properties (type, NULL);
      fputc ('}', stdout);
      return;
    }

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
  print_properties (type, G_OBJECT (bare));

  fputs (",\"bare\":", stdout);
  print_node (bare, NULL);

  if (given != NULL)
    {
      fputs (",\"given\":", stdout);
      print_node (given, NULL);
    }

  print_slots (type, host);

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

          if (type != G_TYPE_INVALID && g_type_is_a (type, GTK_TYPE_WIDGET))
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
