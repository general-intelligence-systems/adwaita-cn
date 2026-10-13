# frozen_string_literal: true

# Keeping the toolkit off the desktop it is run from.
#
# These scripts stage one window per scene and present each one. Presented on the
# session's own display that is forty-odd windows flashing up in front of whoever is
# working there, which was never the point: nothing is ever looked at on screen,
# because every shot is taken by rendering a widget to a texture.
#
# UNSETTING THE DISPLAY VARIABLES IS NOT ENOUGH, which is worth writing down because it
# looks like it should be. `DISPLAY` closes the X11 door, but libwayland's
# wl_display_connect(NULL) falls back to the default socket name -- `wayland-0` under
# XDG_RUNTIME_DIR -- so GDK finds the compositor anyway and maps real windows. The
# variable was never what pointed it there.
#
# So the run is given a display of its own: an X server with a framebuffer and no
# screen behind it. GDK is pinned to X11 so it cannot find the session's Wayland socket
# instead, and every window a scene stages is mapped into a framebuffer nobody is
# looking at.

module Offscreen
  # Far enough from :0 to stay out of the way of a real session.
  NUMBER = 77
  SIZE = "1920x1200x24"

  def self.start
    ENV.delete("WAYLAND_DISPLAY")

    @pid = Process.spawn(
      "Xvfb", ":#{NUMBER}", "-screen", "0", SIZE, "-nolisten", "tcp",
      out: File::NULL, err: File::NULL,
    )
    at_exit{ self.stop }

    ready? || abort("Xvfb :#{NUMBER} did not start; the toolkit has nowhere to draw")

    ENV["DISPLAY"] = ":#{NUMBER}"
    # Pinned, so that GDK cannot decide to use the session's Wayland socket instead of
    # the display it was just given.
    ENV["GDK_BACKEND"] = "x11"
    # An X server with a framebuffer has no GL, and GSK's default renderer wants one:
    # left to choose, it failed on this display and every window came back with nothing
    # drawn in it. Cairo is what the shots are rendered with anyway.
    ENV["GSK_RENDERER"] = "cairo"
  end

  # The desktop's own font and theme preferences, carried onto the display this run made
  # for itself. Called after the toolkit is initialised, because it reads GtkSettings.
  #
  # GTK takes these from the settings daemon on the display it is on, and a bare X
  # server has none, so the shots came out in GTK's built-in fallback font rather than
  # the one the desktop is set to -- which is a difference in every label in every shot
  # and nothing to do with the components.
  def self.match_desktop
    Gtk::Settings.default.tap do |settings|
      setting("font-name").then{|font| settings.gtk_font_name = font if font }

      # The font's size in points is resolved against this, and a bare X server has no
      # answer, so GTK used its own 96dpi and every label came out larger than the
      # desktop draws it. GNOME keeps the scaling here rather than in the font name.
      scaling.then{|factor| settings.gtk_xft_dpi = (96 * 1024 * factor).round }

      # Which window buttons the title bar carries. Unanswered, GTK shows minimise,
      # maximise and close, where this desktop asks for close alone -- a difference in
      # the header bar of every shot which says nothing about the components.
      layout.then{|found| settings.gtk_decoration_layout = found if found }
    end
  end

  # The same three answers, for a CHILD PROCESS to apply to itself.
  #
  # bin/lib/app-trees.c builds its scenes in a process of its own, and GtkSettings is per
  # process: what match_desktop sets here reaches nothing over there. The values are
  # carried in the environment instead, and the C reads them back in its own activate.
  #
  # The DPI is in dots per inch rather than GTK's own 1024ths, because the C multiplies.
  def self.env
    {
      "ADW_CN_FONT" => setting("font-name"),
      "ADW_CN_DPI" => (96 * scaling).to_s,
      "ADW_CN_DECORATION" => layout,
    }.compact
  end

  def self.scaling = setting("text-scaling-factor")&.to_f&.then{|one| one.positive? ? one : 1.0 } || 1.0

  def self.layout
    `gsettings get org.gnome.desktop.wm.preferences button-layout 2>/dev/null`.strip.then do |value|
      value.empty? ? nil : value.delete_prefix("'").delete_suffix("'")
    end
  rescue StandardError
    nil
  end

  # A value out of the desktop's own settings, or nil where there is no answer. dconf
  # does not care which display is being used, so this reads what the session has.
  def self.setting(key)
    `gsettings get org.gnome.desktop.interface #{key} 2>/dev/null`.strip.then do |value|
      value.empty? ? nil : value.delete_prefix("'").delete_suffix("'")
    end
  rescue StandardError
    nil
  end

  def self.stop
    return if @pid.nil?

    Process.kill("TERM", @pid)
    Process.wait(@pid)
    @pid = nil
  rescue Errno::ESRCH, Errno::ECHILD
    @pid = nil
  end

  # The server's socket, waited for: GDK opening the display before Xvfb is listening
  # fails the run rather than retrying.
  def self.ready?(limit = 100)
    limit.times do
      return true if File.exist?("/tmp/.X11-unix/X#{NUMBER}")

      sleep(0.05)
    end

    false
  end
end
