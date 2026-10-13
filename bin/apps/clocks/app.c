/* A clock application: world clocks, alarms and a stopwatch as pages of a stack, with
 * the switcher in the header and the sidebar beside it.
 *
 * The same scene as App.tsx beside this. This one is built with the toolkit, so what it
 * lays out is what the components have to match -- bin/02-app-trees walks it and writes
 * out every node, where it was put and what it draws.
 */

#include <adwaita.h>

static const char *const adw_cn_clocks_cities[][2] = {
  { "London", "09:14" },
  { "Lisbon", "09:14" },
  { "New York", "04:14" },
  { NULL, NULL },
};

static GtkWidget *
adw_cn_clocks_city_row (const char *city,
                        const char *time)
{
  GtkBox *box = GTK_BOX (gtk_box_new (GTK_ORIENTATION_HORIZONTAL, 12));
  GtkWidget *name = gtk_label_new (city);

  gtk_label_set_xalign (GTK_LABEL (name), 0.0);
  gtk_widget_set_hexpand (name, TRUE);
  gtk_box_append (box, name);

  GtkWidget *reading = gtk_label_new (time);

  gtk_widget_add_css_class (reading, "numeric");
  gtk_box_append (box, reading);

  return GTK_WIDGET (box);
}

/* The margin every page in this application carries. */
static void
adw_cn_clocks_pad (GtkWidget *widget)
{
  gtk_widget_set_margin_top (widget, 12);
  gtk_widget_set_margin_bottom (widget, 12);
  gtk_widget_set_margin_start (widget, 12);
  gtk_widget_set_margin_end (widget, 12);
}

G_GNUC_BEGIN_IGNORE_DEPRECATIONS

GtkWidget *
adw_cn_build_clocks (void)
{
  AdwToolbarView *view = ADW_TOOLBAR_VIEW (adw_toolbar_view_new ());
  AdwHeaderBar *bar = ADW_HEADER_BAR (adw_header_bar_new ());

  GtkStack *stack = GTK_STACK (gtk_stack_new ());

  /* The switcher IS the title, and it is pointed at the stack below. */
  GtkWidget *switcher = gtk_stack_switcher_new ();

  gtk_stack_switcher_set_stack (GTK_STACK_SWITCHER (switcher), stack);
  adw_header_bar_set_title_widget (bar, switcher);

  GtkWidget *add = gtk_button_new_from_icon_name ("list-add-symbolic");

  gtk_widget_add_css_class (add, "flat");
  adw_header_bar_pack_end (bar, add);

  adw_toolbar_view_add_top_bar (view, GTK_WIDGET (bar));

  GtkPaned *paned = GTK_PANED (gtk_paned_new (GTK_ORIENTATION_HORIZONTAL));

  adw_toolbar_view_set_content (view, GTK_WIDGET (paned));

  GtkWidget *sidebar = gtk_stack_sidebar_new ();

  gtk_stack_sidebar_set_stack (GTK_STACK_SIDEBAR (sidebar), stack);
  gtk_paned_set_start_child (paned, sidebar);
  gtk_paned_set_end_child (paned, GTK_WIDGET (stack));
  gtk_paned_set_position (paned, 180);
  gtk_paned_set_resize_start_child (paned, FALSE);

  /* ── world ───────────────────────────────────────────────────────────── */

  GtkBox *world = GTK_BOX (gtk_box_new (GTK_ORIENTATION_VERTICAL, 6));

  adw_cn_clocks_pad (GTK_WIDGET (world));

  for (gsize i = 0; adw_cn_clocks_cities[i][0]; i++)
    gtk_box_append (world, adw_cn_clocks_city_row (adw_cn_clocks_cities[i][0],
                                                   adw_cn_clocks_cities[i][1]));

  gtk_stack_add_titled (stack, GTK_WIDGET (world), "world", "World");

  /* ── alarms ──────────────────────────────────────────────────────────── */

  GtkWidget *alarms = gtk_label_new ("No alarms set");

  gtk_widget_add_css_class (alarms, "dim-label");
  gtk_stack_add_titled (stack, alarms, "alarms", "Alarms");

  /* ── stopwatch ───────────────────────────────────────────────────────── */

  GtkBox *stopwatch = GTK_BOX (gtk_box_new (GTK_ORIENTATION_VERTICAL, 12));

  adw_cn_clocks_pad (GTK_WIDGET (stopwatch));

  /* The squeezer holds both readings and shows whichever fits. */
  AdwSqueezer *squeezer = ADW_SQUEEZER (adw_squeezer_new ());

  GtkWidget *long_reading = gtk_label_new ("00:00:12.48 elapsed");

  gtk_widget_add_css_class (long_reading, "title-1");
  adw_squeezer_add (squeezer, long_reading);

  GtkWidget *short_reading = gtk_label_new ("12.48");

  gtk_widget_add_css_class (short_reading, "title-1");
  adw_squeezer_add (squeezer, short_reading);

  gtk_box_append (stopwatch, GTK_WIDGET (squeezer));

  GtkWidget *spinner = gtk_spinner_new ();

  gtk_spinner_set_spinning (GTK_SPINNER (spinner), TRUE);
  gtk_widget_set_halign (spinner, GTK_ALIGN_CENTER);
  gtk_box_append (stopwatch, spinner);

  GtkWidget *revealer = gtk_revealer_new ();
  GtkWidget *lap = gtk_label_new ("Lap 3 — 4.12");

  gtk_widget_add_css_class (lap, "dim-label");
  gtk_revealer_set_child (GTK_REVEALER (revealer), lap);
  gtk_revealer_set_reveal_child (GTK_REVEALER (revealer), TRUE);
  gtk_box_append (stopwatch, revealer);

  gtk_stack_add_titled (stack, GTK_WIDGET (stopwatch), "stopwatch", "Stopwatch");

  return GTK_WIDGET (view);
}

G_GNUC_END_IGNORE_DEPRECATIONS
