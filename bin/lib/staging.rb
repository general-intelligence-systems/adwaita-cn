# frozen_string_literal: true

# Putting a scene on screen, shared by the script which shoots the applications and the
# one which measures them so that both stage the same scene the same way.
#
# An application is a class in bin/apps/<name>/app.rb. A real application is a window
# and the dialogs it opens, so the manifest gives it one scene per shot and each scene
# names the method which builds it: `main` is `build`, and `page-setup` is `page_setup`.
#
# A scene's mode says what that method returns and how it is staged:
#
#   content   The method takes nothing and returns a widget, which becomes the window's
#             content. Every application's `main` scene is one of these.
#
#   window    The method takes the GtkApplication and returns a toplevel of its own,
#             because a GtkWindow cannot be another window's content -- an application's
#             print dialog and its about window are windows, not widgets to put in one.
#
#   overlay   The method takes the window and presents a dialog or popover over it,
#             returning it. Those live above the content area rather than in it: an
#             AdwDialog sits in the window's AdwDialogHost and a GtkPopover is a native
#             surface of its own, so neither is painted by the content's paintable.
#
# An overlay scene is staged over the application's own `main` content, so the shot is
# the dialog this application opens rather than a dialog floating on nothing.
#
# WHAT GETS PAINTED IS NOT ALWAYS WHERE THE WALK STARTS, so `stage` yields both. They
# are the same widget in content and window mode. In overlay mode the painted one is an
# AdwDialog's card, without the scrim which would put a darkened window in a shot the
# other side has no way to draw -- and the walked one is the dialog itself, because the
# dialog is the card's ANCESTOR and a walk from the card never saw the component it was
# a shot of.

module Staging
  ROOT = File.expand_path("../..", __dir__)

  # The window a scene is staged in, the two widgets handed to the block, and all of it
  # torn down after.
  def self.stage(app, one, scene)
    name = one.fetch("name")
    width = one.fetch("width")
    height = one.fetch("height")
    mode = scene.fetch("mode", "content")

    win = mode == "window" ? call(name, scene, app) : host(app, name, scene, mode)

    win.set_default_size(width, height)
    # The size request rather than the default size alone: with no display a presented
    # window settles at its minimum, and a 560x720 application was being shot at
    # 451x548 -- which is a different layout, not a smaller picture of the same one.
    win.set_size_request(width, height)
    win.present
    settle(win, width, height)

    whole = mode == "overlay" ? presented(win, name, scene) : nil
    painted = whole.nil? ? subject(win, mode) : card(whole)

    yield(painted, whole || painted)
  ensure
    win&.destroy
    forget(name)
    pump(20)
  end

  # The window the scene is staged in, for the two modes which do not build their own.
  # An Adwaita window rather than a GTK one because that is what keeps an AdwDialog
  # inside the window instead of spawning a second toplevel.
  #
  # A content scene is its own content; an overlay scene is presented over the
  # application's `main` content, because that is the window the dialog belongs to.
  def self.host(app, name, scene, mode)
    content = mode == "overlay" ? instance(name).build : call(name, scene)

    Adwaita::ApplicationWindow.new(app).tap{|win| win.content = content }
  end

  # The widget to paint and to measure in, for the two modes which are a window.
  def self.subject(win, mode) = mode == "window" ? win : win.content

  # The overlay, presented over the staged window and settled before it is handed back.
  #
  # The window is waited for first: a GtkPopover pops up relative to the surface of the
  # window it is in, and asking one to pop up over a window GTK had not mapped yet left
  # it unmapped at 0x0. That only ever happened from the second scene of a run onwards,
  # so the wait is for the window being mapped rather than for a count of iterations.
  def self.presented(win, name, scene)
    mapped(win)

    call(name, scene, win).tap{|overlay| opened(overlay) }
  end

  def self.mapped(win) = until_true{ win.mapped? }

  # What an overlay paints of its own: a popover is its own card, and an AdwDialog's is
  # the `sheet` node inside it.
  def self.card(overlay) = overlay.is_a?(Gtk::Popover) ? overlay : (sheet(overlay) || overlay)

  # `main` is `build`, and `page-setup` is `page_setup`.
  def self.call(name, scene, *arguments)
    method = scene.fetch("name") == "main" ? "build" : scene.fetch("name").tr("-", "_")

    instance(name).public_send(method, *arguments)
  end

  # Pumped until the overlay is actually on screen, rather than for a fixed count.
  #
  # A fixed pump was enough for the first scene of a run and not for the rest: the
  # second popover in a process came back unmapped at 0x0, and painting it wrote a nil
  # texture. What the shot waits for is the thing it needs -- mapped, and a size.
  # Waited for by giving GTK the main loop back, not by draining pending work: a
  # popover is mapped from a timeout GTK schedules for itself, and a loop of
  # `MainContext#iteration(false)` never lets that timeout come due. The same scene shot
  # on its own worked and shot after another came back unmapped at 0x0, which is what a
  # busy wait looks like from the outside.
  def self.opened(overlay) = until_true{ overlay.mapped? && overlay.width.positive? && overlay.height.positive? }

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

  # `preferences` is PreferencesApp in bin/apps/preferences/app.rb, and `text-editor`
  # would be TextEditorApp.
  #
  # ONE INSTANCE PER STAGING, kept for as long as the scene is on screen. An overlay
  # scene is asked for two things -- the content to present over, and the overlay itself
  # -- and building a second instance to ask the second question gave it a popover whose
  # button had never been put in the window, which GTK refused to pop up because the
  # widget was in no toplevel.
  def self.instance(name)
    require(File.join(ROOT, "bin/apps", name, "app.rb"))

    @instances ||= {}
    @instances[name] ||= Object.const_get("#{name.split(/[-_]/).map(&:capitalize).join}App").new
  end

  # The application is torn down with its window, so the next scene builds a new one.
  def self.forget(name) = @instances&.delete(name)

  # Every scene of every application, as [application, scene] pairs.
  def self.scenes(apps)
    apps.flat_map{|one| one.fetch("scenes").map{|scene| [one, scene] } }
  end

  # `editor` and its `main` scene is editor; its `print` scene is editor-print.
  def self.shot(one, scene)
    scene.fetch("name") == "main" ? one.fetch("name") : "#{one.fetch('name')}-#{scene.fetch('name')}"
  end

  def self.settle(win, width, height)
    until_true{ win.width >= width && win.height >= height }

    # A window at its size is not yet a window which has drawn its contents.
    pump
  end

  # One turn of the real main loop, which is where GTK lays out, maps and renders.
  def self.pump(milliseconds = 120)
    GLib::MainLoop.new.tap do |loop|
      GLib::Timeout.add(milliseconds){ loop.quit; false }
      loop.run
    end
  end

  # Turns of the main loop until the block is true, or until it has waited long enough
  # that it is not going to be.
  def self.until_true(limit = 40)
    limit.times do
      return true if yield

      pump(50)
    end

    false
  end
end
