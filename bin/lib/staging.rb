# frozen_string_literal: true

# Putting an application on screen, shared by the script which shoots the applications
# and the one which measures them so that both stage the same application the same way.
#
# An application is a class in bin/apps/<name>/app.rb, and the manifest says which of
# three modes it is staged in:
#
#   content   `build` returns a widget, which becomes the window's content. The subject
#             is that widget. This is almost every application.
#
#   window    `build(application)` returns a toplevel of its own, because a GtkWindow
#             cannot be another window's content -- AdwPreferencesWindow and the GTK
#             chooser dialogs are windows, not widgets to put in one. The subject is
#             that window.
#
#   overlay   `build` returns the content as in content mode, and `overlay(window)`
#             presents a dialog or popover over it and returns it. Those live above the
#             content area rather than in it: an AdwDialog sits in the window's
#             AdwDialogHost and a GtkPopover is a native surface of its own, so neither
#             is painted by the content's paintable. The subject is the overlay itself.
#
# THE SUBJECT IS WHAT GETS PAINTED AND MEASURED. Returning the window for an overlay
# gave a shot of the application behind the dialog and none of the dialog, because the
# dialog is not inside the content it was presented over.

module Staging
  ROOT = File.expand_path("../..", __dir__)

  # The window an application is staged in, the subject handed to the block, and both
  # torn down after.
  def self.stage(app, one)
    name = one.fetch("name")
    width = one.fetch("width")
    height = one.fetch("height")
    mode = one.fetch("mode", "content")

    win = mode == "window" ? instance(name).build(app) : host(app, name)

    win.set_default_size(width, height)
    # The size request rather than the default size alone: with no display a presented
    # window settles at its minimum, and a 560x720 application was being shot at
    # 451x548 -- which is a different layout, not a smaller picture of the same one.
    win.set_size_request(width, height)
    win.present
    settle(win, width, height)

    yield(subject(win, name, mode))
  ensure
    win&.destroy
    pump(20)
  end

  # The window the application is staged in, for the two modes which do not build their
  # own. An Adwaita window rather than a GTK one because that is what keeps an AdwDialog
  # inside the window instead of spawning a second toplevel.
  def self.host(app, name)
    Adwaita::ApplicationWindow.new(app).tap{|win| win.content = instance(name).build }
  end

  # The widget to paint and to measure in.
  def self.subject(win, name, mode)
    case mode
    when "window" then win
    when "overlay" then presented(win, name)
    else win.content
    end
  end

  # The overlay, presented over the staged window and settled before it is handed back.
  #
  # An AdwDialog fills the window and paints a dimming scrim over it, and the card is a
  # node inside it. The card is what the components render, so the card is the subject:
  # painting the dialog itself put the whole darkened window in a shot which the other
  # side has no way to draw.
  def self.presented(win, name)
    instance(name).overlay(win).tap do |overlay|
      pump(400)

      break sheet(overlay) || overlay unless overlay.is_a?(Gtk::Popover)
    end
  end

  # The `sheet` node of an AdwDialog -- the card itself, without the scrim around it.
  # Found by its CSS name because it is an AdwGizmo, which the bindings give no class of
  # its own.
  def self.sheet(widget)
    return widget if widget.css_name == "sheet"

    child = widget.first_child
    while child
      found = sheet(child)
      return found if found

      child = child.next_sibling
    end

    nil
  end

  # `preferences` is PreferencesApp in bin/apps/preferences/app.rb, and `dialog-alert`
  # is DialogAlertApp.
  def self.instance(name)
    require(File.join(ROOT, "bin/apps", name, "app.rb"))

    Object.const_get("#{name.split(/[-_]/).map(&:capitalize).join}App").new
  end

  def self.settle(win, width, height, limit = 800)
    limit.times do |index|
      break if win.width >= width && win.height >= height

      GLib::MainContext.default.iteration(false)
      sleep(0.002) if (index % 10).zero?
    end

    # A window at its size is not yet a window which has drawn its contents, and one
    # which has drawn them is not yet one whose open animation has finished: a
    # preferences window shot too early came out with two crossfading copies of its
    # first group on top of each other.
    pump(240)
  end

  def self.pump(times)
    times.times do |index|
      GLib::MainContext.default.iteration(false)
      sleep(0.002) if (index % 10).zero?
    end
  end
end
