# frozen_string_literal: true

# The things an application says to its user: a banner, a toast and an empty state.
#
# Rendered again from the registry's components in App.tsx beside this.

class FeedbackApp
  def build
    toolbar_view.tap do |view|
      view.add_top_bar(header_bar)
      view.content = toast_overlay

      header_bar.tap{|bar| bar.title_widget = window_title }

      toast_overlay.tap do |overlay|
        overlay.child = column

        column.tap do |box|
          box.append(banner)
          box.append(status_page)
        end

        overlay.add_toast(Adwaita::Toast.new("Everything saved"))
      end
    end
  end

  def toolbar_view = @toolbar_view ||= Adwaita::ToolbarView.new
  def header_bar = @header_bar ||= Adwaita::HeaderBar.new
  def window_title = @window_title ||= Adwaita::WindowTitle.new("Feedback", "Banner, toast, empty state")
  def toast_overlay = @toast_overlay ||= Adwaita::ToastOverlay.new
  def column = @column ||= Gtk::Box.new(:vertical, 0)

  def banner
    @banner ||= Adwaita::Banner.new("You are working offline").tap do |one|
      one.button_label = "Reconnect"
      one.revealed = true
    end
  end

  def status_page
    @status_page ||= Adwaita::StatusPage.new.tap do |page|
      page.icon_name = "folder-symbolic"
      page.title = "No documents"
      page.description = "Documents you create will appear here."
      page.child = new_button
      page.vexpand = true
    end
  end

  def new_button
    @new_button ||= Gtk::Button.new(label: "New document").tap do |one|
      one.halign = :center
      one.add_css_class("pill")
      one.add_css_class("suggested-action")
    end
  end
end
