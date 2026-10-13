# frozen_string_literal: true

# A sidebar application: a list down the left, a page on the right.
#
# Rendered again from the registry's components in App.tsx beside this.

class LibraryApp
  def build
    split_view.tap do |split|
      split.sidebar = sidebar_page
      split.content = content_page
      split.min_sidebar_width = 260

      sidebar_toolbar.tap do |view|
        view.add_top_bar(sidebar_header)
        view.content = list_box

        sidebar_header.tap do |bar|
          bar.title_widget = search_entry
          bar.pack_end(add_button)
        end

        list_box.tap do |list|
          rows.each{|row| list.append(row) }
        end
      end

      content_toolbar.tap do |view|
        view.add_top_bar(content_header)
        view.content = status_page

        content_header.tap do |bar|
          bar.title_widget = window_title
          bar.pack_end(menu_button)
        end
      end
    end
  end

  def split_view = @split_view ||= Adwaita::NavigationSplitView.new
  def sidebar_page = @sidebar_page ||= Adwaita::NavigationPage.new(sidebar_toolbar, "Library")
  def content_page = @content_page ||= Adwaita::NavigationPage.new(content_toolbar, "Details")
  def sidebar_toolbar = @sidebar_toolbar ||= Adwaita::ToolbarView.new
  def content_toolbar = @content_toolbar ||= Adwaita::ToolbarView.new
  def sidebar_header = @sidebar_header ||= Adwaita::HeaderBar.new
  def content_header = @content_header ||= Adwaita::HeaderBar.new
  def window_title = @window_title ||= Adwaita::WindowTitle.new("Ada Lovelace", "Mathematician")

  def search_entry
    @search_entry ||= Gtk::SearchEntry.new.tap{|one| one.placeholder_text = "Search"; one.hexpand = true }
  end

  def add_button
    @add_button ||= Gtk::Button.new.tap do |one|
      one.icon_name = "list-add-symbolic"
      one.add_css_class("flat")
    end
  end

  def menu_button
    @menu_button ||= Gtk::Button.new.tap do |one|
      one.icon_name = "open-menu-symbolic"
      one.add_css_class("flat")
    end
  end

  def list_box
    @list_box ||= Gtk::ListBox.new.tap do |list|
      list.add_css_class("navigation-sidebar")
      list.selection_mode = :single
    end
  end

  PEOPLE = [
    ["Ada Lovelace", "Mathematician", "AL"],
    ["Alan Turing", "Computer scientist", "AT"],
    ["Grace Hopper", "Rear admiral", "GH"],
    ["Katherine Johnson", "Physicist", "KJ"],
  ].freeze

  def rows
    @rows ||= PEOPLE.map do |title, subtitle, initials|
      Adwaita::ActionRow.new.tap do |row|
        row.title = title
        row.subtitle = subtitle
        row.add_prefix(Adwaita::Avatar.new(32, initials, true))
      end
    end
  end

  def status_page
    @status_page ||= Adwaita::StatusPage.new.tap do |page|
      page.icon_name = "avatar-default-symbolic"
      page.title = "Ada Lovelace"
      page.description = "Select a different person to see their details."
      page.child = open_button
    end
  end

  def open_button
    @open_button ||= Gtk::Button.new(label: "Open").tap do |one|
      one.halign = :center
      one.add_css_class("pill")
      one.add_css_class("suggested-action")
    end
  end
end
