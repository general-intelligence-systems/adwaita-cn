# frozen_string_literal: true

# A software centre: the application being looked at, what installing it is doing, and
# the assistant which sets one up afterwards.
#
# Rendered again from the registry's components in App.tsx beside this.

class SoftwareApp
  def build
    toolbar_view.tap do |view|
      view.add_top_bar(header_bar)
      view.content = toast_overlay

      header_bar.tap{|bar| bar.pack_end(install_button) }

      toast_overlay.tap do |one|
        one.child = scrolled_window
        one.add_toast(Adwaita::Toast.new("Inkscape installed"))
      end

      scrolled_window.tap{|one| one.child = column }

      column.tap do |box|
        box.append(info_bar)
        box.append(status_page)
        box.append(progress_group)

        info_bar.tap{|one| one.add_child(info_label) }

        status_page.tap{|page| page.child = status_actions }

        status_actions.tap do |row|
          row.append(install_button_large)
          row.append(website_link)
        end

        progress_group.tap do |group|
          group.add(progress_bar)
          group.add(level_bar)
          group.add(spinner)
          group.add(rating_row)
        end
      end
    end
  end

  # The assistant which sets the application up after it is installed.
  def install(application)
    assistant.tap do |win|
      application.add_window(win)

      win.append_page(intro_page)
      win.set_page_title(intro_page, "Welcome")
      win.set_page_type(intro_page, :intro)
      win.set_page_complete(intro_page, true)

      win.append_page(done_page)
      win.set_page_title(done_page, "Finish")
      win.set_page_type(done_page, :confirm)
    end
  end

  def toolbar_view = @toolbar_view ||= Adwaita::ToolbarView.new
  def header_bar = @header_bar ||= Adwaita::HeaderBar.new

  def install_button
    @install_button ||= Gtk::Button.new.tap do |one|
      one.child = install_content
      one.add_css_class("suggested-action")
    end
  end

  def install_content
    @install_content ||= Adwaita::ButtonContent.new.tap do |one|
      one.icon_name = "folder-download-symbolic"
      one.label = "Install"
    end
  end

  def toast_overlay = @toast_overlay ||= Adwaita::ToastOverlay.new
  def scrolled_window = @scrolled_window ||= Gtk::ScrolledWindow.new

  def column
    @column ||= Gtk::Box.new(:vertical, 12).tap do |box|
      box.margin_top = 12
      box.margin_bottom = 12
      box.margin_start = 12
      box.margin_end = 12
    end
  end

  def info_bar
    @info_bar ||= Gtk::InfoBar.new.tap do |one|
      one.message_type = :warning
      one.revealed = true
      one.show_close_button = true
    end
  end

  def info_label = @info_label ||= Gtk::Label.new("This application is not sandboxed.")

  def status_page
    @status_page ||= Adwaita::StatusPage.new.tap do |one|
      one.icon_name = "application-x-executable-symbolic"
      one.title = "Inkscape"
      one.description = "A vector graphics editor."
    end
  end

  def status_actions = @status_actions ||= Gtk::Box.new(:horizontal, 12).tap{|one| one.halign = :center }

  def install_button_large
    @install_button_large ||= Gtk::Button.new(label: "Install").tap do |one|
      one.add_css_class("pill")
      one.add_css_class("suggested-action")
    end
  end

  def website_link = @website_link ||= Gtk::LinkButton.new("https://inkscape.org", "Website")
  def progress_group = @progress_group ||= Adwaita::PreferencesGroup.new.tap{|one| one.title = "Downloading" }
  def progress_bar = @progress_bar ||= Gtk::ProgressBar.new.tap{|one| one.fraction = 0.62; one.show_text = true; one.text = "62%" }
  def level_bar = @level_bar ||= Gtk::LevelBar.new.tap{|one| one.value = 0.4 }
  def spinner = @spinner ||= Gtk::Spinner.new.tap{|one| one.spinning = true; one.halign = :center }

  # A button row, which is the row a preferences group offers for an action.
  def rating_row
    @rating_row ||= Adwaita::ButtonRow.new.tap do |one|
      one.title = "Rate this application"
      one.start_icon_name = "starred-symbolic"
    end
  end

  def assistant = @assistant ||= Gtk::Assistant.new
  def intro_page = @intro_page ||= Gtk::Label.new("Inkscape is installed. This assistant will set it up.")
  def done_page = @done_page ||= Gtk::Label.new("Everything is ready.")
end
