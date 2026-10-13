/* The applications, as the harness sees them.
 *
 * One entry per scene: the name it is shot under, the size the manifest gives it, and the
 * function in bin/apps/<name>/app.c which builds it. bin/02-app-trees walks what each one
 * builds; bin/14-app-screenshots shoots the same scene beside the components' own.
 *
 * The sizes are bin/apps/manifest.json's, which is what the browser side reads too, so
 * both halves of a comparison are the same window twice.
 */

#pragma once

#include <gtk/gtk.h>

typedef struct {
  const char *name;
  int width;
  int height;
  GtkWidget *(*build) (void);
} AdwCnApp;

GtkWidget *adw_cn_build_calendar (void);
GtkWidget *adw_cn_build_chat (void);
GtkWidget *adw_cn_build_clocks (void);
GtkWidget *adw_cn_build_console (void);
GtkWidget *adw_cn_build_controls (void);
GtkWidget *adw_cn_build_editor (void);
GtkWidget *adw_cn_build_factory (void);
GtkWidget *adw_cn_build_feedback (void);
GtkWidget *adw_cn_build_files (void);
GtkWidget *adw_cn_build_library (void);
GtkWidget *adw_cn_build_mail (void);
GtkWidget *adw_cn_build_music (void);
GtkWidget *adw_cn_build_paint (void);
GtkWidget *adw_cn_build_photos (void);
GtkWidget *adw_cn_build_preferences (void);
GtkWidget *adw_cn_build_software (void);

static const AdwCnApp adw_cn_apps[] = {
  { "calendar", 760, 600, adw_cn_build_calendar },
  { "chat", 820, 600, adw_cn_build_chat },
  { "clocks", 720, 560, adw_cn_build_clocks },
  { "console", 820, 560, adw_cn_build_console },
  { "controls", 560, 720, adw_cn_build_controls },
  { "editor", 800, 600, adw_cn_build_editor },
  { "factory", 760, 680, adw_cn_build_factory },
  { "feedback", 560, 420, adw_cn_build_feedback },
  { "files", 900, 620, adw_cn_build_files },
  { "library", 900, 600, adw_cn_build_library },
  { "mail", 920, 620, adw_cn_build_mail },
  { "music", 760, 560, adw_cn_build_music },
  { "paint", 820, 600, adw_cn_build_paint },
  { "photos", 820, 600, adw_cn_build_photos },
  { "preferences", 480, 640, adw_cn_build_preferences },
  { "software", 880, 620, adw_cn_build_software },
  { NULL, 0, 0, NULL },
};
