# frozen_string_literal: true

# The widget factory: the page an application developer opens to see a widget on its
# own. GNOME ships one for the same reason this exists -- a handful of widgets are
# parts rather than screens, and no real application puts them anywhere.
#
# Everything a real application does reach is in one of the other applications.
#
# Rendered again from the registry's components in App.tsx beside this.

class FactoryApp
  GROUP = <<~XML
    <interface>
      <object class="GtkShortcutsGroup" id="group">
        <property name="title">Editing</property>
        <child>
          <object class="GtkShortcutsShortcut">
            <property name="title">Copy</property>
            <property name="accelerator">&lt;ctrl&gt;c</property>
          </object>
        </child>
      </object>
    </interface>
  XML

  def build
    breakpoint_bin.tap do |bin|
      bin.child = toolbar_view

      toolbar_view.tap do |view|
        view.add_top_bar(header_bar)
        view.content = page

        page.tap do |one|
          one.add(rows_group)
          one.add(parts_group)
          one.add(choosers_group)

          rows_group.tap do |group|
            group.add(expander_row)
            group.add(password_row)
            group.add(custom_row)

            expander_row.tap{|row| row.add_row(nested_row) }

            custom_row.tap{|row| row.child = custom_child }
          end

          parts_group.tap do |group|
            group.add(parts_box)

            parts_box.tap do |box|
              box.append(range)
              box.append(password_entry)
              box.append(lock_button)
              box.append(app_chooser_button)
              box.append(shortcut_label)
              box.append(shortcuts_group)
              box.append(multi_layout_view)
              box.append(bin_wrapper)
              box.append(popover_bin)
              box.append(clamp_scrollable)
            end

            multi_layout_view.tap do |one2|
              one2.add_layout(layout)
              one2.set_child("main", slot_label)
            end

            bin_wrapper.tap{|one2| one2.child = bin_label }

            clamp_scrollable.tap{|one2| one2.child = clamped_text }
          end

          choosers_group.tap do |group|
            group.add(chooser_box)

            chooser_box.tap do |box|
              box.append(app_chooser_widget)
              box.append(file_chooser_widget)
              box.append(font_chooser_widget)
            end
          end
        end
      end
    end
  end

  # The window an application's own main window is.
  def application(gtk_application)
    application_window(gtk_application).tap do |win|
      win.content = application_view

      application_view.tap do |view|
        view.add_top_bar(Adwaita::HeaderBar.new)
        view.content = Gtk::Label.new("An AdwApplicationWindow")
      end
    end
  end

  # The shortcuts window GTK 4.18 deprecated, built through GtkBuilder because the
  # bindings register the class as its parent's type.
  def shortcuts(gtk_application)
    shortcuts_window.tap{|win| gtk_application.add_window(win) }
  end

  # The preferences dialog, and the window it replaced.
  def preferences(window)
    preferences_dialog.tap do |dialog|
      dialog.add(preferences_page)

      preferences_page.tap{|one| one.add(preferences_group) }

      preferences_group.tap{|one| one.add(preferences_row) }

      dialog.present(window)
    end
  end

  def preferences_legacy(gtk_application)
    window_form.tap do |win|
      gtk_application.add_window(win)
      win.add(window_page)

      window_page.tap{|one| one.add(window_group) }

      window_group.tap{|one| one.add(window_row) }
    end
  end

  def breakpoint_bin = @breakpoint_bin ||= Adwaita::BreakpointBin.new.tap{|one| one.width_request = 360; one.height_request = 320 }
  def toolbar_view = @toolbar_view ||= Adwaita::ToolbarView.new
  def header_bar = @header_bar ||= Adwaita::HeaderBar.new
  def page = @page ||= Adwaita::PreferencesPage.new
  def rows_group = @rows_group ||= Adwaita::PreferencesGroup.new.tap{|one| one.title = "Rows" }
  def parts_group = @parts_group ||= Adwaita::PreferencesGroup.new.tap{|one| one.title = "Parts" }
  def choosers_group = @choosers_group ||= Adwaita::PreferencesGroup.new.tap{|one| one.title = "Choosers" }

  def expander_row
    @expander_row ||= Adwaita::ExpanderRow.new.tap do |one|
      one.title = "An expander row"
      one.subtitle = "With a row inside it"
      one.expanded = true
    end
  end

  def nested_row = @nested_row ||= Adwaita::ActionRow.new.tap{|one| one.title = "Inside" }
  def password_row = @password_row ||= Adwaita::PasswordEntryRow.new.tap{|one| one.title = "Password" }

  def custom_row
    @custom_row ||= Adwaita::PreferencesRow.new.tap do |one|
      one.title = "A row an application filled itself"
      one.activatable = false
    end
  end

  def custom_child
    @custom_child ||= Gtk::Label.new("Whatever the application put here").tap do |one|
      one.xalign = 0
      one.margin_top = 12
      one.margin_bottom = 12
      one.margin_start = 12
      one.margin_end = 12
    end
  end

  def parts_box = @parts_box ||= Gtk::Box.new(:vertical, 12)

  # A bare GtkRange, which is what a scale and a scrollbar are built from.
  def range
    @range ||= Gtk::Range.new.tap do |one|
      one.adjustment = Gtk::Adjustment.new(35, 0, 100, 1, 10, 0)
      one.hexpand = true
    end
  end

  def password_entry = @password_entry ||= Gtk::PasswordEntry.new.tap{|one| one.show_peek_icon = true }
  def lock_button = @lock_button ||= Gtk::LockButton.new
  def app_chooser_button = @app_chooser_button ||= Gtk::AppChooserButton.new("text/plain")
  def shortcut_label = @shortcut_label ||= Gtk::ShortcutLabel.new("<ctrl><shift>n").tap{|one| one.halign = :start }
  def shortcuts_group = @shortcuts_group ||= Gtk::Builder.new(string: GROUP).get_object("group")
  def multi_layout_view = @multi_layout_view ||= Adwaita::MultiLayoutView.new.tap{|one| one.height_request = 32 }
  def layout = @layout ||= Adwaita::Layout.new(layout_slot).tap{|one| one.name = "only" }
  def layout_slot = @layout_slot ||= Adwaita::LayoutSlot.new("main")
  def slot_label = @slot_label ||= Gtk::Label.new("In the layout's slot").tap{|one| one.add_css_class("dim-label") }
  def bin_wrapper = @bin_wrapper ||= Adwaita::Bin.new
  def bin_label = @bin_label ||= Gtk::Label.new("In a bin").tap{|one| one.add_css_class("dim-label") }
  def popover_bin = @popover_bin ||= Gtk::PopoverBin.new
  def clamp_scrollable = @clamp_scrollable ||= Adwaita::ClampScrollable.new.tap{|one| one.maximum_size = 240 }

  # A scrollable child, because AdwClampScrollable binds its own adjustments onto
  # whatever it holds: given a label it reported that GtkLabel has no `hadjustment`.
  def clamped_text
    @clamped_text ||= Gtk::TextView.new.tap do |one|
      one.buffer.text = "Clamped to 240px"
      one.height_request = 32
      one.left_margin = 6
      one.top_margin = 6
    end
  end

  def chooser_box = @chooser_box ||= Gtk::Box.new(:vertical, 12)
  def app_chooser_widget = @app_chooser_widget ||= Gtk::AppChooserWidget.new("text/plain").tap{|one| one.height_request = 120 }
  def file_chooser_widget = @file_chooser_widget ||= Gtk::FileChooserWidget.new(:open).tap{|one| one.height_request = 160 }
  def font_chooser_widget = @font_chooser_widget ||= Gtk::FontChooserWidget.new.tap{|one| one.height_request = 160 }
  def application_window(gtk_application) = @application_window ||= Adwaita::ApplicationWindow.new(gtk_application)
  def application_view = @application_view ||= Adwaita::ToolbarView.new
  def shortcuts_window = @shortcuts_window ||= Gtk::Builder.new(string: WINDOW).get_object("window")
  def preferences_dialog = @preferences_dialog ||= Adwaita::PreferencesDialog.new
  def preferences_page = @preferences_page ||= Adwaita::PreferencesPage.new.tap{|one| one.title = "General" }
  def preferences_group = @preferences_group ||= Adwaita::PreferencesGroup.new.tap{|one| one.title = "Appearance" }
  def preferences_row = @preferences_row ||= Adwaita::SwitchRow.new.tap{|one| one.title = "Dark mode"; one.active = true }
  def window_form = @window_form ||= Adwaita::PreferencesWindow.new
  def window_page = @window_page ||= Adwaita::PreferencesPage.new.tap{|one| one.title = "General" }
  def window_group = @window_group ||= Adwaita::PreferencesGroup.new.tap{|one| one.title = "Appearance" }
  def window_row = @window_row ||= Adwaita::SwitchRow.new.tap{|one| one.title = "Dark mode"; one.active = true }

  WINDOW = <<~XML
    <interface>
      <object class="GtkShortcutsWindow" id="window">
        <child>
          <object class="GtkShortcutsSection">
            <child>
              <object class="GtkShortcutsGroup">
                <property name="title">Editing</property>
                <child>
                  <object class="GtkShortcutsShortcut">
                    <property name="title">Copy</property>
                    <property name="accelerator">&lt;ctrl&gt;c</property>
                  </object>
                </child>
              </object>
            </child>
          </object>
        </child>
      </object>
    </interface>
  XML
end
