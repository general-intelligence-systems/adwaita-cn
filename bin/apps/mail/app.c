/* A mail client: the mailboxes as a view stack with every switcher libadwaita offers,
 * a banner across the top when it is offline, and the message list under it.
 *
 * The same scene as App.tsx beside this. This one is built with the toolkit, so what it
 * lays out is what the components have to match -- bin/02-app-trees walks it and writes
 * out every node, where it was put and what it draws.
 */

#include <adwaita.h>

/* Sender, subject, and the initials the avatar falls back to. */
static const char *const adw_cn_mail_messages[][3] = {
  { "Ada Lovelace", "The analytical engine", "AL" },
  { "Alan Turing", "On computable numbers", "AT" },
  { "Grace Hopper", "Re: the compiler", "GH" },
  { NULL, NULL, NULL },
};

static GtkWidget *
adw_cn_mail_page (const char *text)
{
  GtkWidget *label = gtk_label_new (text);

  gtk_widget_add_css_class (label, "title-2");

  return label;
}

GtkWidget *
adw_cn_build_mail (void)
{
  GtkBox *row = GTK_BOX (gtk_box_new (GTK_ORIENTATION_HORIZONTAL, 0));

  AdwViewStack *stack = ADW_VIEW_STACK (adw_view_stack_new ());

  gtk_widget_set_vexpand (GTK_WIDGET (stack), TRUE);

  /* Every switcher libadwaita offers, all pointed at the one stack: this application
   * exists to put them side by side. */
  AdwViewSwitcherSidebar *sidebar =
    ADW_VIEW_SWITCHER_SIDEBAR (adw_view_switcher_sidebar_new ());

  adw_view_switcher_sidebar_set_stack (sidebar, stack);
  gtk_widget_set_size_request (GTK_WIDGET (sidebar), 200, -1);
  gtk_box_append (row, GTK_WIDGET (sidebar));

  AdwToolbarView *view = ADW_TOOLBAR_VIEW (adw_toolbar_view_new ());

  gtk_widget_set_hexpand (GTK_WIDGET (view), TRUE);
  gtk_box_append (row, GTK_WIDGET (view));

  AdwHeaderBar *bar = ADW_HEADER_BAR (adw_header_bar_new ());

  AdwViewSwitcherTitle *title = ADW_VIEW_SWITCHER_TITLE (adw_view_switcher_title_new ());

  adw_view_switcher_title_set_stack (title, stack);
  adw_view_switcher_title_set_title (title, "Mail");
  adw_header_bar_set_title_widget (bar, GTK_WIDGET (title));

  AdwViewSwitcher *switcher = ADW_VIEW_SWITCHER (adw_view_switcher_new ());

  adw_view_switcher_set_stack (switcher, stack);
  adw_header_bar_pack_start (bar, GTK_WIDGET (switcher));

  AdwInlineViewSwitcher *inline_switcher =
    ADW_INLINE_VIEW_SWITCHER (adw_inline_view_switcher_new ());

  adw_inline_view_switcher_set_stack (inline_switcher, stack);
  adw_header_bar_pack_start (bar, GTK_WIDGET (inline_switcher));

  GtkWidget *compose = gtk_button_new_from_icon_name ("mail-message-new-symbolic");

  gtk_widget_add_css_class (compose, "flat");
  adw_header_bar_pack_end (bar, compose);

  adw_toolbar_view_add_top_bar (view, GTK_WIDGET (bar));

  AdwViewSwitcherBar *switcher_bar = ADW_VIEW_SWITCHER_BAR (adw_view_switcher_bar_new ());

  adw_view_switcher_bar_set_stack (switcher_bar, stack);
  adw_view_switcher_bar_set_reveal (switcher_bar, TRUE);
  adw_toolbar_view_add_bottom_bar (view, GTK_WIDGET (switcher_bar));

  GtkBox *column = GTK_BOX (gtk_box_new (GTK_ORIENTATION_VERTICAL, 0));

  adw_toolbar_view_set_content (view, GTK_WIDGET (column));

  AdwBanner *banner = ADW_BANNER (adw_banner_new ("You are working offline"));

  adw_banner_set_button_label (banner, "Reconnect");
  adw_banner_set_revealed (banner, TRUE);
  gtk_box_append (column, GTK_WIDGET (banner));

  /* ── the inbox ───────────────────────────────────────────────────────── */

  GtkListBox *inbox = GTK_LIST_BOX (gtk_list_box_new ());

  gtk_list_box_set_selection_mode (inbox, GTK_SELECTION_SINGLE);
  gtk_widget_add_css_class (GTK_WIDGET (inbox), "navigation-sidebar");

  /* An unread marker, which is a plain list box row rather than an action row. */
  GtkWidget *unread = gtk_list_box_row_new ();
  GtkWidget *unread_label = gtk_label_new ("3 unread");

  gtk_label_set_xalign (GTK_LABEL (unread_label), 0.0);
  gtk_widget_set_margin_start (unread_label, 12);
  gtk_widget_set_margin_top (unread_label, 6);
  gtk_widget_set_margin_bottom (unread_label, 6);
  gtk_list_box_row_set_child (GTK_LIST_BOX_ROW (unread), unread_label);
  gtk_list_box_append (inbox, unread);

  for (gsize i = 0; adw_cn_mail_messages[i][0]; i++)
    {
      AdwActionRow *message = ADW_ACTION_ROW (adw_action_row_new ());

      adw_preferences_row_set_title (ADW_PREFERENCES_ROW (message), adw_cn_mail_messages[i][0]);
      adw_action_row_set_subtitle (message, adw_cn_mail_messages[i][1]);
      adw_action_row_add_prefix (message, adw_avatar_new (32, adw_cn_mail_messages[i][2], TRUE));

      gtk_list_box_append (inbox, GTK_WIDGET (message));
    }

  adw_view_stack_add_titled_with_icon (stack, GTK_WIDGET (inbox),
                                       "inbox", "Inbox", "mail-unread-symbolic");
  adw_view_stack_add_titled_with_icon (stack, adw_cn_mail_page ("Drafts"),
                                       "drafts", "Drafts", "document-edit-symbolic");
  adw_view_stack_add_titled_with_icon (stack, adw_cn_mail_page ("Sent"),
                                       "sent", "Sent", "mail-send-symbolic");

  gtk_box_append (column, GTK_WIDGET (stack));

  return GTK_WIDGET (row);
}
