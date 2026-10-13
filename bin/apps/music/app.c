/* A music player: the album art and the carousel of covers above, the transport and
 * volume below.
 *
 * The same scene as App.tsx beside this. This one is built with the toolkit, so what it
 * lays out is what the components have to match -- bin/02-app-trees walks it and writes
 * out every node, where it was put and what it draws.
 */

#include <adwaita.h>

static const char *const adw_cn_music_albums[] = {
  "Kind of Blue", "Blue Train", "A Love Supreme", NULL,
};

GtkWidget *
adw_cn_build_music (void)
{
  AdwToolbarView *view = ADW_TOOLBAR_VIEW (adw_toolbar_view_new ());
  AdwHeaderBar *bar = ADW_HEADER_BAR (adw_header_bar_new ());

  adw_header_bar_pack_end (bar, gtk_volume_button_new ());

  /* A scale button beside the volume one, for playback speed. */
  GtkWidget *speed = gtk_scale_button_new (0.5, 2, 0.1,
    (const char *[]){ "media-playlist-repeat-symbolic", NULL });

  gtk_scale_button_set_adjustment (GTK_SCALE_BUTTON (speed),
                                   gtk_adjustment_new (1, 0.5, 2, 0.1, 0.5, 0));
  adw_header_bar_pack_end (bar, speed);

  adw_toolbar_view_add_top_bar (view, GTK_WIDGET (bar));

  GtkBox *column = GTK_BOX (gtk_box_new (GTK_ORIENTATION_VERTICAL, 12));

  gtk_widget_set_margin_top (GTK_WIDGET (column), 12);
  gtk_widget_set_margin_bottom (GTK_WIDGET (column), 12);
  gtk_widget_set_margin_start (GTK_WIDGET (column), 12);
  gtk_widget_set_margin_end (GTK_WIDGET (column), 12);
  adw_toolbar_view_set_content (view, GTK_WIDGET (column));

  /* ── the covers ──────────────────────────────────────────────────────── */

  AdwCarousel *carousel = ADW_CAROUSEL (adw_carousel_new ());

  gtk_widget_set_size_request (GTK_WIDGET (carousel), -1, 140);

  for (gsize i = 0; adw_cn_music_albums[i]; i++)
    {
      GtkWidget *cover = gtk_label_new (adw_cn_music_albums[i]);

      gtk_widget_add_css_class (cover, "title-2");
      gtk_widget_set_size_request (cover, 200, -1);
      adw_carousel_append (carousel, cover);
    }

  gtk_box_append (column, GTK_WIDGET (carousel));

  /* Both indicators, because they are two widgets rather than two styles of one. */
  AdwCarouselIndicatorDots *dots =
    ADW_CAROUSEL_INDICATOR_DOTS (adw_carousel_indicator_dots_new ());

  adw_carousel_indicator_dots_set_carousel (dots, carousel);
  gtk_box_append (column, GTK_WIDGET (dots));

  AdwCarouselIndicatorLines *lines =
    ADW_CAROUSEL_INDICATOR_LINES (adw_carousel_indicator_lines_new ());

  adw_carousel_indicator_lines_set_carousel (lines, carousel);
  gtk_box_append (column, GTK_WIDGET (lines));

  gtk_box_append (column, gtk_separator_new (GTK_ORIENTATION_HORIZONTAL));

  /* ── now playing ─────────────────────────────────────────────────────── */

  GtkBox *now_playing = GTK_BOX (gtk_box_new (GTK_ORIENTATION_HORIZONTAL, 12));

  GtkWidget *art = gtk_image_new_from_icon_name ("audio-x-generic-symbolic");

  gtk_image_set_pixel_size (GTK_IMAGE (art), 48);
  gtk_box_append (now_playing, art);

  GtkWidget *title = gtk_label_new ("So What");

  gtk_widget_add_css_class (title, "title-4");
  gtk_label_set_xalign (GTK_LABEL (title), 0.0);
  gtk_widget_set_hexpand (title, TRUE);
  gtk_box_append (now_playing, title);

  GtkWidget *play = gtk_button_new_from_icon_name ("media-playback-start-symbolic");

  gtk_widget_add_css_class (play, "circular");
  gtk_widget_add_css_class (play, "suggested-action");
  gtk_box_append (now_playing, play);

  gtk_box_append (column, GTK_WIDGET (now_playing));

  gtk_box_append (column, gtk_media_controls_new (NULL));

  /* The seek slider the transport does not provide on its own. */
  GtkWidget *seek = gtk_scale_new (GTK_ORIENTATION_HORIZONTAL,
                                   gtk_adjustment_new (38, 0, 100, 1, 10, 0));

  gtk_scale_set_draw_value (GTK_SCALE (seek), FALSE);
  gtk_box_append (column, seek);

  /* The player's video pane, for when what is playing has a picture. */
  GtkWidget *video = gtk_video_new ();

  gtk_widget_set_size_request (video, -1, 80);
  gtk_box_append (column, video);

  return GTK_WIDGET (view);
}
