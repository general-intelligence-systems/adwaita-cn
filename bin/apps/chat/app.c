/* A chat application: conversations down the side, the thread beside them, and the
 * composer along the bottom with the emoji chooser and menu it opens.
 *
 * The same scene as App.tsx beside this. This one is built with the toolkit, so what it
 * lays out is what the components have to match -- bin/02-app-trees walks it and writes
 * out every node, where it was put and what it draws.
 */

#include <adwaita.h>

/* Name, the line of the last message, and the initials the avatar falls back to. */
static const char *const adw_cn_chat_people[][3] = {
  { "Ada Lovelace", "See you at three", "AL" },
  { "Alan Turing", "Sent the paper", "AT" },
  { "Grace Hopper", "Nanoseconds", "GH" },
  { NULL, NULL, NULL },
};

static const char *const adw_cn_chat_messages[] = {
  "Morning — did the build finish?",
  "It did, about ten minutes ago.",
  "Good. I will cut the release after lunch.",
  NULL,
};

static void
adw_cn_chat_setup (GtkSignalListItemFactory *factory,
                   GtkListItem              *item,
                   gpointer                  data)
{
  (void) factory;
  (void) data;

  GtkWidget *label = gtk_label_new (NULL);

  gtk_label_set_xalign (GTK_LABEL (label), 0.0);
  gtk_label_set_wrap (GTK_LABEL (label), TRUE);
  gtk_widget_set_margin_top (label, 6);
  gtk_widget_set_margin_bottom (label, 6);
  gtk_widget_set_margin_start (label, 12);
  gtk_widget_set_margin_end (label, 12);

  gtk_list_item_set_child (item, label);
}

static void
adw_cn_chat_bind (GtkSignalListItemFactory *factory,
                  GtkListItem              *item,
                  gpointer                  data)
{
  (void) factory;
  (void) data;

  GtkStringObject *string = GTK_STRING_OBJECT (gtk_list_item_get_item (item));

  gtk_label_set_text (GTK_LABEL (gtk_list_item_get_child (item)),
                      gtk_string_object_get_string (string));
}

GtkWidget *
adw_cn_build_chat (void)
{
  AdwNavigationSplitView *split = ADW_NAVIGATION_SPLIT_VIEW (adw_navigation_split_view_new ());

  /* ── the conversations ───────────────────────────────────────────────── */

  AdwToolbarView *sidebar_toolbar = ADW_TOOLBAR_VIEW (adw_toolbar_view_new ());
  AdwHeaderBar *sidebar_header = ADW_HEADER_BAR (adw_header_bar_new ());

  /* The user's own name, which they can rename in place. */
  adw_header_bar_set_title_widget (sidebar_header, gtk_editable_label_new ("Nathan"));
  adw_toolbar_view_add_top_bar (sidebar_toolbar, GTK_WIDGET (sidebar_header));

  GtkListBox *conversations = GTK_LIST_BOX (gtk_list_box_new ());

  gtk_list_box_set_selection_mode (conversations, GTK_SELECTION_SINGLE);
  gtk_widget_add_css_class (GTK_WIDGET (conversations), "navigation-sidebar");

  for (gsize i = 0; adw_cn_chat_people[i][0]; i++)
    {
      AdwActionRow *row = ADW_ACTION_ROW (adw_action_row_new ());

      adw_preferences_row_set_title (ADW_PREFERENCES_ROW (row), adw_cn_chat_people[i][0]);
      adw_action_row_set_subtitle (row, adw_cn_chat_people[i][1]);
      adw_action_row_add_prefix (row, adw_avatar_new (32, adw_cn_chat_people[i][2], TRUE));

      gtk_list_box_append (conversations, GTK_WIDGET (row));
    }

  adw_toolbar_view_set_content (sidebar_toolbar, GTK_WIDGET (conversations));

  /* ── the thread ──────────────────────────────────────────────────────── */

  AdwToolbarView *content_toolbar = ADW_TOOLBAR_VIEW (adw_toolbar_view_new ());
  AdwHeaderBar *content_header = ADW_HEADER_BAR (adw_header_bar_new ());

  GtkWidget *thread_title = gtk_label_new ("Ada Lovelace");

  gtk_widget_add_css_class (thread_title, "heading");
  adw_header_bar_set_title_widget (content_header, thread_title);

  GMenu *menu_model = g_menu_new ();

  g_menu_append (menu_model, "Search in Conversation", "app.search");
  g_menu_append (menu_model, "Mute Notifications", "app.mute");
  g_menu_append (menu_model, "Block Contact", "app.block");

  GtkWidget *menu_button = gtk_menu_button_new ();

  gtk_menu_button_set_icon_name (GTK_MENU_BUTTON (menu_button), "view-more-symbolic");
  gtk_widget_add_css_class (menu_button, "flat");
  gtk_menu_button_set_popover (GTK_MENU_BUTTON (menu_button),
                               gtk_popover_menu_new_from_model (G_MENU_MODEL (menu_model)));
  adw_header_bar_pack_end (content_header, menu_button);

  adw_toolbar_view_add_top_bar (content_toolbar, GTK_WIDGET (content_header));

  GtkBox *thread = GTK_BOX (gtk_box_new (GTK_ORIENTATION_VERTICAL, 0));

  GtkWidget *scrolled = gtk_scrolled_window_new ();

  gtk_widget_set_vexpand (scrolled, TRUE);

  GtkStringList *model = gtk_string_list_new (adw_cn_chat_messages);
  GtkSelectionModel *selection = GTK_SELECTION_MODEL (gtk_no_selection_new (G_LIST_MODEL (model)));
  GtkListItemFactory *factory = gtk_signal_list_item_factory_new ();

  g_signal_connect (factory, "setup", G_CALLBACK (adw_cn_chat_setup), NULL);
  g_signal_connect (factory, "bind", G_CALLBACK (adw_cn_chat_bind), NULL);

  gtk_scrolled_window_set_child (GTK_SCROLLED_WINDOW (scrolled),
                                 gtk_list_view_new (selection, factory));
  gtk_box_append (thread, scrolled);

  /* ── the composer ────────────────────────────────────────────────────── */

  GtkBox *composer = GTK_BOX (gtk_box_new (GTK_ORIENTATION_HORIZONTAL, 6));

  gtk_widget_set_margin_top (GTK_WIDGET (composer), 6);
  gtk_widget_set_margin_bottom (GTK_WIDGET (composer), 6);
  gtk_widget_set_margin_start (GTK_WIDGET (composer), 6);
  gtk_widget_set_margin_end (GTK_WIDGET (composer), 6);

  GtkWidget *entry = gtk_entry_new ();

  gtk_entry_set_placeholder_text (GTK_ENTRY (entry), "Message");
  gtk_widget_set_hexpand (entry, TRUE);
  gtk_box_append (composer, entry);

  GtkWidget *emoji = gtk_menu_button_new ();

  gtk_menu_button_set_icon_name (GTK_MENU_BUTTON (emoji), "face-smile-symbolic");
  gtk_widget_add_css_class (emoji, "flat");
  gtk_menu_button_set_popover (GTK_MENU_BUTTON (emoji), gtk_emoji_chooser_new ());
  gtk_box_append (composer, emoji);

  GtkWidget *send = gtk_button_new_from_icon_name ("document-send-symbolic");

  gtk_widget_add_css_class (send, "suggested-action");
  gtk_box_append (composer, send);

  gtk_box_append (thread, GTK_WIDGET (composer));

  /* The thread is pushed onto a navigation view, which is how a chat application goes
   * back to the conversation list on a narrow window. */
  AdwNavigationView *navigation = ADW_NAVIGATION_VIEW (adw_navigation_view_new ());

  adw_navigation_view_add (navigation,
    ADW_NAVIGATION_PAGE (adw_navigation_page_new (GTK_WIDGET (thread), "Ada Lovelace")));
  adw_toolbar_view_set_content (content_toolbar, GTK_WIDGET (navigation));

  adw_navigation_split_view_set_sidebar (split,
    ADW_NAVIGATION_PAGE (adw_navigation_page_new (GTK_WIDGET (sidebar_toolbar), "Chats")));
  adw_navigation_split_view_set_content (split,
    ADW_NAVIGATION_PAGE (adw_navigation_page_new (GTK_WIDGET (content_toolbar), "Thread")));
  adw_navigation_split_view_set_min_sidebar_width (split, 240);

  return GTK_WIDGET (split);
}
