# frozen_string_literal: true

# A file manager: places down the side, the folder's contents beside them, and the
# dialogs a file manager opens -- a context menu, a delete confirmation, a properties
# sheet and the chooser which picks an application to open a file with.
#
# Rendered again from the registry's components in App.tsx beside this.

class FilesApp
  PLACES = ["Home", "Documents", "Downloads", "Pictures"].freeze
  ENTRIES = %w[Reports Invoices notes.md photo.jpg archive.zip].freeze

  def build
    split_view.tap do |split|
      split.sidebar = sidebar
      split.content = toolbar_view
      split.show_sidebar = true

      toolbar_view.tap do |view|
        view.add_top_bar(header_bar)
        view.content = views

        header_bar.tap do |bar|
          bar.title_widget = window_title
          bar.pack_start(back_button)
          bar.pack_start(view_switcher)
          bar.pack_end(search_entry)
        end

        # The two ways a file manager shows a folder, one of which is on screen.
        views.tap do |stack|
          stack.add_titled(scrolled_window, "icons", "Icons")
          stack.add_titled(list_scrolled_window, "list", "List")
        end

        scrolled_window.tap{|one| one.child = grid_view }
        list_scrolled_window.tap{|one| one.child = column_view }

        view_switcher.tap{|one| one.stack = views }
      end
    end
  end

  # The menu a right click opens over a file.
  def menu(_window)
    popover.tap do |one|
      one.child = menu_box
      one.set_parent(grid_view)

      menu_box.tap{|box| %w[Open Rename Delete].each{|label| box.append(menu_item(label)) } }

      one.popup
    end
  end

  # What it asks before deleting.
  def delete(window)
    delete_dialog.tap do |one|
      one.add_response("cancel", "Cancel")
      one.add_response("delete", "Delete")
      one.set_response_appearance("delete", Adwaita::ResponseAppearance::DESTRUCTIVE)
      one.present(window)
    end
  end

  # The properties sheet.
  def properties(window)
    properties_dialog.tap do |one|
      one.child = properties_view

      properties_view.tap do |view|
        view.add_top_bar(Adwaita::HeaderBar.new)
        view.content = properties_list

        properties_list.tap do |list|
          list.add(property("Name", "photo.jpg"))
          list.add(property("Size", "2.4 MB"))
          list.add(property("Modified", "Today 09:14"))
        end
      end

      one.present(window)
    end
  end

  def open_with(application)
    open_with_dialog.tap{|win| application.add_window(win) }
  end

  def split_view
    @split_view ||= Adwaita::OverlaySplitView.new.tap do |one|
      one.min_sidebar_width = 200
      one.max_sidebar_width = 240
    end
  end

  def sidebar = @sidebar ||= Adwaita::Sidebar.new.tap{|one| one.width_request = 200 }
  def toolbar_view = @toolbar_view ||= Adwaita::ToolbarView.new
  def header_bar = @header_bar ||= Adwaita::HeaderBar.new
  def window_title = @window_title ||= Adwaita::WindowTitle.new("Documents", "5 items")

  def back_button
    @back_button ||= Gtk::Button.new.tap do |one|
      one.icon_name = "go-previous-symbolic"
      one.add_css_class("flat")
    end
  end

  def search_entry = @search_entry ||= Gtk::SearchEntry.new.tap{|one| one.placeholder_text = "Search" }
  def scrolled_window = @scrolled_window ||= Gtk::ScrolledWindow.new
  def model = @model ||= Gtk::StringList.new(ENTRIES)

  # A selection per view: a GtkSelectionModel belongs to the view it is given to.
  def grid_selection = @grid_selection ||= Gtk::SingleSelection.new(model)
  def column_selection = @column_selection ||= Gtk::SingleSelection.new(Gtk::StringList.new(ENTRIES))

  def factory
    Gtk::SignalListItemFactory.new.tap do |one|
      one.signal_connect("setup"){|_, item| item.child = Gtk::Label.new.tap{|label| label.xalign = 0 } }
      one.signal_connect("bind"){|_, item| item.child.text = item.item.string }
    end
  end

  # The icon grid, with the two other views a file manager offers under it.
  def grid_view
    @grid_view ||= Gtk::GridView.new(grid_selection, factory).tap do |one|
      one.max_columns = 4
      one.min_columns = 2
    end
  end

  def views = @views ||= Gtk::Stack.new
  def view_switcher = @view_switcher ||= Gtk::StackSwitcher.new
  def list_scrolled_window = @list_scrolled_window ||= Gtk::ScrolledWindow.new


  def column_view
    @column_view ||= Gtk::ColumnView.new(column_selection).tap do |one|
      one.append_column(Gtk::ColumnViewColumn.new("Name", name_factory).tap{|col| col.expand = true })
      one.append_column(Gtk::ColumnViewColumn.new("Size", factory))
    end
  end

  # A folder's row carries the expander which opens it, which is where a file manager
  # puts one.
  def name_factory
    Gtk::SignalListItemFactory.new.tap do |one|
      one.signal_connect("setup") do |_, item|
        item.child = Gtk::TreeExpander.new.tap{|expander| expander.child = Gtk::Label.new.tap{|label| label.xalign = 0 } }
      end
      one.signal_connect("bind"){|_, item| item.child.child.text = item.item.string }
    end
  end
  def popover = @popover ||= Gtk::Popover.new
  def menu_box = @menu_box ||= Gtk::Box.new(:vertical, 0)

  def menu_item(label)
    Gtk::Button.new(label: label).tap do |one|
      one.add_css_class("flat")
      one.child.xalign = 0
    end
  end

  def delete_dialog
    @delete_dialog ||= Adwaita::AlertDialog.new.tap do |one|
      one.heading = "Delete “photo.jpg”?"
      one.body = "It will be moved to the wastebasket."
    end
  end

  def properties_dialog
    @properties_dialog ||= Adwaita::Dialog.new.tap do |one|
      one.title = "Properties"
      one.content_width = 360
      one.content_height = 260
    end
  end

  def properties_view = @properties_view ||= Adwaita::ToolbarView.new
  def properties_list = @properties_list ||= Adwaita::PreferencesGroup.new

  def property(title, subtitle)
    Adwaita::ActionRow.new.tap{|one| one.title = title; one.subtitle = subtitle }
  end

  def open_with_dialog
    @open_with_dialog ||= Gtk::AppChooserDialog.new(nil, :modal, Gio::File.new_for_path("/etc/hostname"))
  end
end
