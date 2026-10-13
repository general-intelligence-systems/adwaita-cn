# frozen_string_literal: true

# One of each control, in the composition a settings or editor pane puts them in.
#
# Rendered again from the registry's components in App.tsx beside this.

class ControlsApp
  def build
    toolbar_view.tap do |view|
      view.add_top_bar(header_bar)
      view.content = clamp

      header_bar.tap{|bar| bar.title_widget = window_title }

      clamp.tap{|found| found.child = column }

      column.tap do |box|
        box.append(buttons_group)
        box.append(toggle_group)
        box.append(entry)
        box.append(search_entry)
        box.append(scale)
        box.append(switch_row_box)
        box.append(check_button)
        box.append(drop_down)
        box.append(progress_bar)
        box.append(level_bar)
        box.append(spin_button)

        buttons_group.tap do |row|
          row.append(plain_button)
          row.append(suggested_button)
          row.append(destructive_button)
          row.append(flat_button)
          row.append(circular_button)
        end

        switch_row_box.tap do |row|
          row.append(switch_label)
          row.append(switch)
        end
      end
    end
  end

  def toolbar_view = @toolbar_view ||= Adwaita::ToolbarView.new
  def header_bar = @header_bar ||= Adwaita::HeaderBar.new
  def window_title = @window_title ||= Adwaita::WindowTitle.new("Controls", "One of each")

  def clamp
    @clamp ||= Adwaita::Clamp.new.tap do |found|
      found.maximum_size = 400
      found.margin_top = 24
      found.margin_bottom = 24
      found.margin_start = 24
      found.margin_end = 24
    end
  end

  def column = @column ||= Gtk::Box.new(:vertical, 18)

  def buttons_group = @buttons_group ||= Gtk::Box.new(:horizontal, 8)
  def switch_row_box = @switch_row_box ||= Gtk::Box.new(:horizontal, 12)

  def plain_button = @plain_button ||= Gtk::Button.new(label: "Label")

  def suggested_button
    @suggested_button ||= Gtk::Button.new(label: "Save").tap{|one| one.add_css_class("suggested-action") }
  end

  def destructive_button
    @destructive_button ||= Gtk::Button.new(label: "Delete").tap{|one| one.add_css_class("destructive-action") }
  end

  def flat_button
    @flat_button ||= Gtk::Button.new(label: "Cancel").tap{|one| one.add_css_class("flat") }
  end

  def circular_button
    @circular_button ||= Gtk::Button.new.tap do |one|
      one.icon_name = "list-add-symbolic"
      one.add_css_class("circular")
    end
  end

  def toggle_group
    @toggle_group ||= Adwaita::ToggleGroup.new.tap do |group|
      %w[Day Week Month].each do |label|
        group.add(Adwaita::Toggle.new.tap{|toggle| toggle.label = label })
      end
    end
  end

  def entry
    @entry ||= Gtk::Entry.new.tap{|one| one.placeholder_text = "Placeholder text" }
  end

  def search_entry
    @search_entry ||= Gtk::SearchEntry.new.tap{|one| one.placeholder_text = "Search" }
  end

  def scale
    @scale ||= Gtk::Scale.new(:horizontal, Gtk::Adjustment.new(60.0, 0.0, 100.0, 1.0, 10.0, 0.0)).tap do |one|
      one.draw_value = false
    end
  end

  def switch_label
    @switch_label ||= Gtk::Label.new("Enabled").tap{|one| one.hexpand = true; one.xalign = 0 }
  end

  def switch = @switch ||= Gtk::Switch.new.tap{|one| one.active = true; one.halign = :end }

  def check_button
    @check_button ||= Gtk::CheckButton.new.tap{|one| one.label = "Remember me"; one.active = true }
  end

  def drop_down
    @drop_down ||= Gtk::DropDown.new(Gtk::StringList.new(["Everyone", "Only me", "Nobody"]), nil)
  end

  def progress_bar
    @progress_bar ||= Gtk::ProgressBar.new.tap{|one| one.fraction = 0.6 }
  end

  def level_bar
    @level_bar ||= Gtk::LevelBar.new.tap{|one| one.value = 0.4 }
  end

  def spin_button
    @spin_button ||= Gtk::SpinButton.new(Gtk::Adjustment.new(3.0, 0.0, 10.0, 1.0, 2.0, 0.0), 1.0, 0)
  end
end
