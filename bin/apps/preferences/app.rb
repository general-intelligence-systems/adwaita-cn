# frozen_string_literal: true

# A preferences window: the rows almost every GNOME application has.
#
# The same screen is built from the registry's components in App.tsx beside this,
# and the two are shot and put side by side, which is the only way to find out
# whether a row built from Adwaita's measurements comes out the way Adwaita
# builds it.

class PreferencesApp
  def build
    toolbar_view.tap do |view|
      view.add_top_bar(header_bar)
      view.content = page

      header_bar.tap do |bar|
        bar.title_widget = window_title
        bar.pack_start(back_button)
      end

      page.tap do |found|
        found.add(appearance_group)
        found.add(account_group)

        appearance_group.tap do |group|
          group.add(theme_row)
          group.add(animations_row)
          group.add(spacing_row)
        end

        account_group.tap do |group|
          group.add(name_row)
          group.add(email_row)
          group.add(sync_row)
        end
      end
    end
  end

  def toolbar_view = @toolbar_view ||= Adwaita::ToolbarView.new
  def header_bar = @header_bar ||= Adwaita::HeaderBar.new
  def window_title = @window_title ||= Adwaita::WindowTitle.new("Preferences", "Three groups")

  def back_button
    @back_button ||= Gtk::Button.new.tap do |button|
      button.icon_name = "go-previous-symbolic"
      button.add_css_class("flat")
    end
  end

  def page = @page ||= Adwaita::PreferencesPage.new

  def appearance_group
    @appearance_group ||= Adwaita::PreferencesGroup.new.tap do |group|
      group.title = "Appearance"
      group.description = "How the window looks."
    end
  end

  def account_group
    @account_group ||= Adwaita::PreferencesGroup.new.tap do |group|
      group.title = "Account"
    end
  end

  def theme_row
    @theme_row ||= Adwaita::ComboRow.new.tap do |row|
      row.title = "Theme"
      row.subtitle = "Follows the system by default"
      row.model = Gtk::StringList.new(%w[System Light Dark])
      row.selected = 0
    end
  end

  def animations_row
    @animations_row ||= Adwaita::SwitchRow.new.tap do |row|
      row.title = "Animations"
      row.subtitle = "200ms on Adwaita's own curve"
      row.active = true
    end
  end

  def spacing_row
    @spacing_row ||= Adwaita::SpinRow.new(Gtk::Adjustment.new(12.0, 0.0, 48.0, 1.0, 6.0, 0.0), 1.0, 0).tap do |row|
      row.title = "Spacing"
    end
  end

  def name_row
    @name_row ||= Adwaita::EntryRow.new.tap do |row|
      row.title = "Name"
      row.text = "Ada Lovelace"
    end
  end

  def email_row
    @email_row ||= Adwaita::EntryRow.new.tap do |row|
      row.title = "Email"
      row.text = "ada@example.org"
    end
  end

  def sync_row
    @sync_row ||= Adwaita::ActionRow.new.tap do |row|
      row.title = "Last synchronised"
      row.subtitle = "Today at 09:41"
      row.add_suffix(sync_button)
      row.activatable_widget = sync_button
    end
  end

  def sync_button
    @sync_button ||= Gtk::Button.new(label: "Sync now").tap do |button|
      button.valign = :center
      button.add_css_class("suggested-action")
    end
  end
end
