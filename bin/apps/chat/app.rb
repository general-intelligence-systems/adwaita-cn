# frozen_string_literal: true

# A chat application: conversations down the side, the thread beside them, and the
# composer along the bottom with the emoji chooser and menu it opens.
#
# Rendered again from the registry's components in App.tsx beside this.

class ChatApp
  PEOPLE = [
    ["Ada Lovelace", "See you at three", "AL"],
    ["Alan Turing", "Sent the paper", "AT"],
    ["Grace Hopper", "Nanoseconds", "GH"],
  ].freeze

  MESSAGES = [
    "Morning — did the build finish?",
    "It did, about ten minutes ago.",
    "Good. I will cut the release after lunch.",
  ].freeze

  def build
    split_view.tap do |split|
      split.sidebar = sidebar_page
      split.content = content_page
      split.min_sidebar_width = 240

      sidebar_toolbar.tap do |view|
        view.add_top_bar(sidebar_header)
        view.content = conversations

        sidebar_header.tap{|bar| bar.title_widget = name_label }

        conversations.tap{|list| rows.each{|one| list.append(one) } }
      end

      # The thread is pushed onto a navigation view, which is how a chat application
      # goes back to the conversation list on a narrow window.
      content_toolbar.tap do |view|
        view.add_top_bar(content_header)
        view.content = navigation_view

        content_header.tap do |bar|
          bar.title_widget = thread_title
          bar.pack_end(menu_button)
        end

        navigation_view.tap{|nav| nav.add(thread_page) }

        thread_column.tap do |box|
          box.append(scrolled_window)
          box.append(composer)

          scrolled_window.tap{|one| one.child = message_list }

          composer.tap do |bar|
            bar.append(entry)
            bar.append(emoji_button)
            bar.append(send_button)
          end
        end
      end
    end
  end

  # The emoji chooser the composer opens.
  def emoji(_window) = emoji_chooser.tap{ emoji_button.popup }

  # The conversation menu.
  def menu(_window) = popover_menu.tap{ menu_button.popup }

  def split_view = @split_view ||= Adwaita::NavigationSplitView.new
  def sidebar_page = @sidebar_page ||= Adwaita::NavigationPage.new(sidebar_toolbar, "Chats")
  def content_page = @content_page ||= Adwaita::NavigationPage.new(content_toolbar, "Thread")
  def sidebar_toolbar = @sidebar_toolbar ||= Adwaita::ToolbarView.new
  def content_toolbar = @content_toolbar ||= Adwaita::ToolbarView.new
  def sidebar_header = @sidebar_header ||= Adwaita::HeaderBar.new
  def content_header = @content_header ||= Adwaita::HeaderBar.new

  # The user's own name, which they can rename in place.
  def name_label = @name_label ||= Gtk::EditableLabel.new("Nathan")
  def thread_title = @thread_title ||= Gtk::Label.new("Ada Lovelace").tap{|one| one.add_css_class("heading") }

  def conversations
    @conversations ||= Gtk::ListBox.new.tap do |one|
      one.selection_mode = :single
      one.add_css_class("navigation-sidebar")
    end
  end

  def rows
    @rows ||= PEOPLE.map do |name, preview, initials|
      Adwaita::ActionRow.new.tap do |one|
        one.title = name
        one.subtitle = preview
        one.add_prefix(Adwaita::Avatar.new(32, initials, true))
      end
    end
  end

  def navigation_view = @navigation_view ||= Adwaita::NavigationView.new
  def thread_page = @thread_page ||= Adwaita::NavigationPage.new(thread_column, "Ada Lovelace")
  def thread_column = @thread_column ||= Gtk::Box.new(:vertical, 0)
  def scrolled_window = @scrolled_window ||= Gtk::ScrolledWindow.new.tap{|one| one.vexpand = true }
  def model = @model ||= Gtk::StringList.new(MESSAGES)
  def selection = @selection ||= Gtk::NoSelection.new(model)

  def factory
    Gtk::SignalListItemFactory.new.tap do |one|
      one.signal_connect("setup") do |_, item|
        item.child = Gtk::Label.new.tap do |label|
          label.xalign = 0
          label.wrap = true
          label.margin_top = 6
          label.margin_bottom = 6
          label.margin_start = 12
          label.margin_end = 12
        end
      end
      one.signal_connect("bind"){|_, item| item.child.text = item.item.string }
    end
  end

  def message_list = @message_list ||= Gtk::ListView.new(selection, factory)

  def composer
    @composer ||= Gtk::Box.new(:horizontal, 6).tap do |box|
      box.margin_top = 6
      box.margin_bottom = 6
      box.margin_start = 6
      box.margin_end = 6
    end
  end

  def entry = @entry ||= Gtk::Entry.new.tap{|one| one.placeholder_text = "Message"; one.hexpand = true }

  def emoji_button
    @emoji_button ||= Gtk::MenuButton.new.tap do |one|
      one.icon_name = "face-smile-symbolic"
      one.add_css_class("flat")
      one.popover = emoji_chooser
    end
  end

  def emoji_chooser = @emoji_chooser ||= Gtk::EmojiChooser.new

  def send_button
    @send_button ||= Gtk::Button.new.tap do |one|
      one.icon_name = "document-send-symbolic"
      one.add_css_class("suggested-action")
    end
  end

  def menu_button
    @menu_button ||= Gtk::MenuButton.new.tap do |one|
      one.icon_name = "view-more-symbolic"
      one.add_css_class("flat")
      one.popover = popover_menu
    end
  end

  def popover_menu = @popover_menu ||= Gtk::PopoverMenu.new(menu_model)

  def menu_model
    @menu_model ||= Gio::Menu.new.tap do |menu|
      menu.append("Search in Conversation", "app.search")
      menu.append("Mute Notifications", "app.mute")
      menu.append("Block Contact", "app.block")
    end
  end
end
