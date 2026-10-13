# frozen_string_literal: true

# A text editor: tabbed documents, a find bar over the text, and a status bar under it.
# Its dialogs -- the shortcuts sheet, about, open, print, page setup and font -- are
# scenes of this application rather than applications of their own.
#
# Rendered again from the registry's components in App.tsx beside this.

class EditorApp
  def build
    tab_overview.tap do |overview|
      overview.view = tab_view
      overview.child = toolbar_view

      toolbar_view.tap do |view|
        view.add_top_bar(header_bar)
        view.add_top_bar(tab_bar)
        view.add_top_bar(search_bar)
        view.add_bottom_bar(action_bar)
        view.content = scrolled_window

        header_bar.tap do |bar|
          bar.pack_start(tab_button)
          bar.pack_start(save_button)
          bar.pack_end(menu_button)
        end

        tab_bar.tap{|bar| bar.view = tab_view }
        search_bar.tap{|bar| bar.child = search_entry }

        tab_view.tap do |one|
          DOCUMENTS.each{|title| one.append(document(title)).tap{|page| page.title = title } }
        end

        scrolled_window.tap{|one| one.child = text_view }

        action_bar.tap do |bar|
          bar.pack_start(statusbar)
          bar.pack_end(line_entry)
        end

        statusbar.tap{|one| one.push(one.get_context_id("editor"), "Ln 1, Col 1") }
      end
    end
  end

  # The tab overview, opened. Its thumbnails are built by the overview itself, so this
  # is the only screen they are ever on.
  def tabs = build.tap{|overview| overview.open = true }

  # The keyboard shortcuts it advertises.
  def shortcuts(window) = shortcuts_dialog.tap{|one| one.present(window) }

  # The about window, which this application still uses rather than the dialog.
  def about(application)
    about_window.tap{|win| application.add_window(win) }
  end

  def open(application)
    open_dialog.tap{|win| application.add_window(win) }
  end

  def print(application)
    print_dialog.tap{|win| application.add_window(win) }
  end

  def page_setup(application)
    page_setup_dialog.tap{|win| application.add_window(win) }
  end

  def font(application)
    font_dialog.tap{|win| application.add_window(win) }
  end

  DOCUMENTS = ["notes.md", "README", "LICENCE"].freeze

  TEXT = <<~BODY
    # Notes

    The editor is a tab view of documents, a find bar over the text and a
    status bar under it.

    Everything here is drawn by the components beside it.
  BODY

  def tab_overview = @tab_overview ||= Adwaita::TabOverview.new
  def toolbar_view = @toolbar_view ||= Adwaita::ToolbarView.new
  def header_bar = @header_bar ||= Adwaita::HeaderBar.new
  def tab_bar = @tab_bar ||= Adwaita::TabBar.new
  def tab_button = @tab_button ||= Adwaita::TabButton.new.tap{|one| one.view = tab_view }
  def tab_view = @tab_view ||= Adwaita::TabView.new

  def save_button
    @save_button ||= Adwaita::SplitButton.new.tap do |one|
      one.label = "Save"
      one.add_css_class("suggested-action")
    end
  end

  def menu_button
    @menu_button ||= Gtk::MenuButton.new.tap do |one|
      one.icon_name = "open-menu-symbolic"
      one.add_css_class("flat")
    end
  end

  def search_bar = @search_bar ||= Gtk::SearchBar.new.tap{|one| one.search_mode = true }
  def search_entry = @search_entry ||= Gtk::SearchEntry.new.tap{|one| one.placeholder_text = "Find in document" }
  def scrolled_window = @scrolled_window ||= Gtk::ScrolledWindow.new

  def text_view
    @text_view ||= Gtk::TextView.new.tap do |one|
      one.buffer.text = TEXT
      one.monospace = true
      one.left_margin = 12
      one.right_margin = 12
      one.top_margin = 12
    end
  end

  def action_bar = @action_bar ||= Gtk::ActionBar.new.tap{|one| one.revealed = true }
  def statusbar = @statusbar ||= Gtk::Statusbar.new

  # A bare GtkText rather than an entry: it is what an entry is built from, and the
  # line-number box is the one place this application wants it unadorned.
  def line_entry = @line_entry ||= Gtk::Text.new.tap{|one| one.text = "1"; one.width_chars = 4 }

  def document(title) = Gtk::Label.new(title).tap{|one| one.add_css_class("dim-label") }
  def shortcuts_dialog = @shortcuts_dialog ||= Adwaita::ShortcutsDialog.new

  def about_window
    @about_window ||= Adwaita::AboutWindow.new.tap do |one|
      one.application_name = "Text Editor"
      one.application_icon = "text-editor-symbolic"
      one.developer_name = "The adwaita-cn authors"
      one.version = "1.0.0"
      one.website = "https://example.org"
      one.license_type = Gtk::License::GPL_3_0
    end
  end

  def open_dialog = @open_dialog ||= Gtk::FileChooserDialog.new(title: "Open Document", action: :open)
  def print_dialog = @print_dialog ||= Gtk::PrintUnixDialog.new("Print", nil)
  def page_setup_dialog = @page_setup_dialog ||= Gtk::PageSetupUnixDialog.new("Page Setup", nil)
  def font_dialog = @font_dialog ||= Gtk::FontChooserDialog.new.tap{|one| one.title = "Editor Font" }
end
