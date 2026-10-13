# frozen_string_literal: true

# A process viewer: the running processes in the three views GTK 3 left behind, with
# the filters above them and a status bar below.
#
# The tree, icon and cell views and both combo boxes are deprecated in GTK 4, which is
# why they are here together: this is the application which still uses them.
#
# Rendered again from the registry's components in App.tsx beside this.

class ConsoleApp
  PROCESSES = %w[systemd gnome-shell tracker-miner pipewire ruby].freeze

  def build
    toolbar_view.tap do |view|
      view.add_top_bar(header_bar)
      view.content = column

      header_bar.tap{|bar| bar.title_widget = filters }

      filters.tap do |box|
        box.append(scope_combo)
        box.append(sort_combo)
      end

      column.tap do |box|
        box.append(notebook)
        box.append(details)
        box.append(statusbar)

        notebook.tap do |book|
          book.append_page(tree_scrolled_window, Gtk::Label.new("Processes"))
          book.append_page(icon_scrolled_window, Gtk::Label.new("Icons"))
        end

        tree_scrolled_window.tap{|one| one.child = tree_view }
        icon_scrolled_window.tap{|one| one.child = icon_view }

        tree_view.tap{|one| one.append_column(name_column) }

        details.tap{|one| one.child = cell_view }

        cell_view.tap do |one|
          one.pack_start(cell_renderer, true)
          one.add_attribute(cell_renderer, "text", 0)
        end

        scope_combo.tap do |one|
          one.pack_start(scope_renderer, true)
          one.add_attribute(scope_renderer, "text", 0)
        end

        sort_combo.tap do |one|
          %w[By name By memory By CPU].each{|label| one.append_text(label) }
          one.active = 0
        end

        statusbar.tap{|one| one.push(one.get_context_id("console"), "5 processes, 1.2 GB in use") }
      end
    end
  end

  # The menu bar, which this application shows instead of a header menu when the
  # desktop asks for one.
  def menubar
    window_handle.tap do |handle|
      handle.child = menubar_box

      menubar_box.tap do |box|
        box.append(menu_bar)
        box.append(window_controls)
      end
    end
  end

  def toolbar_view = @toolbar_view ||= Adwaita::ToolbarView.new
  def header_bar = @header_bar ||= Adwaita::HeaderBar.new
  def filters = @filters ||= Gtk::Box.new(:horizontal, 6)

  def column
    @column ||= Gtk::Box.new(:vertical, 0)
  end

  def store
    @store ||= Gtk::ListStore.new(String).tap do |one|
      PROCESSES.each{|name| one.append.set_value(0, name) }
    end
  end

  def notebook = @notebook ||= Gtk::Notebook.new.tap{|one| one.vexpand = true }
  def tree_scrolled_window = @tree_scrolled_window ||= Gtk::ScrolledWindow.new
  def icon_scrolled_window = @icon_scrolled_window ||= Gtk::ScrolledWindow.new
  def tree_view = @tree_view ||= Gtk::TreeView.new(store)
  def name_column = @name_column ||= Gtk::TreeViewColumn.new("Process", Gtk::CellRendererText.new, text: 0)

  def icon_view
    @icon_view ||= Gtk::IconView.new.tap do |one|
      one.model = store
      one.text_column = 0
      one.columns = 4
    end
  end

  # The selected process, shown the way a cell renderer draws it in the list.
  def details = @details ||= Gtk::Expander.new("Selected process").tap{|one| one.expanded = true }
  def cell_view = @cell_view ||= Gtk::CellView.new.tap{|one| one.model = store; one.displayed_row = Gtk::TreePath.new("0") }
  def cell_renderer = @cell_renderer ||= Gtk::CellRendererText.new
  def scope_combo = @scope_combo ||= Gtk::ComboBox.new.tap{|one| one.model = store; one.active = 0 }
  def scope_renderer = @scope_renderer ||= Gtk::CellRendererText.new
  def sort_combo = @sort_combo ||= Gtk::ComboBoxText.new
  def statusbar = @statusbar ||= Gtk::Statusbar.new
  def window_handle = @window_handle ||= Gtk::WindowHandle.new
  def menubar_box = @menubar_box ||= Gtk::Box.new(:horizontal, 0)
  def menu_bar = @menu_bar ||= Gtk::PopoverMenuBar.new(menu_model).tap{|one| one.hexpand = true }
  def window_controls = @window_controls ||= Gtk::WindowControls.new(:end)

  def menu_model
    @menu_model ||= Gio::Menu.new.tap do |menu|
      menu.append_submenu("File", Gio::Menu.new.tap{|one| one.append("Quit", "app.quit") })
      menu.append_submenu("View", Gio::Menu.new.tap{|one| one.append("Refresh", "app.refresh") })
      menu.append_submenu("Help", Gio::Menu.new.tap{|one| one.append("About", "app.about") })
    end
  end
end
