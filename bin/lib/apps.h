/* The applications, as the harness sees them.
 *
 * One entry per scene: the name it is shot under, the size the manifest gives it, and the
 * function in bin/apps/<name>/app.c which builds it. bin/02-app-trees walks what each one
 * builds; bin/14-app-screenshots shoots the same scene beside the components' own.
 */

#pragma once

#include <gtk/gtk.h>

typedef struct {
  const char *name;
  int width;
  int height;
  GtkWidget *(*build) (void);
} AdwCnApp;

GtkWidget *adw_cn_build_controls (void);

static const AdwCnApp adw_cn_apps[] = {
  { "controls", 560, 720, adw_cn_build_controls },
  { NULL, 0, 0, NULL },
};
