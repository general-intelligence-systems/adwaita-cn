# frozen_string_literal: true

# A mail client: the mailboxes as a view stack with every switcher libadwaita offers,
# a banner across the top when it is offline, and the message list under it.
#
# Rendered again from the registry's components in App.tsx beside this.

class MailApp
  MESSAGES = [
    ["Ada Lovelace", "The analytical engine", "AL"],
    ["Alan Turing", "On computable numbers", "AT"],
    ["Grace Hopper", "Re: the compiler", "GH"],
  ].freeze

  def build
    row.tap do |outer|
      outer.append(view_switcher_sidebar)
      outer.append(toolbar_view)

      view_switcher_sidebar.tap{|one| one.stack = view_stack }

      toolbar_view.tap do |view|
        view.add_top_bar(header_bar)
        view.add_bottom_bar(view_switcher_bar)
        view.content = column

        header_bar.tap do |bar|
          bar.title_widget = view_switcher_title
          bar.pack_start(view_switcher)
          bar.pack_start(inline_view_switcher)
          bar.pack_end(compose_button)
        end

        column.tap do |box|
          box.append(banner)
          box.append(view_stack)

          view_stack.tap do |stack|
            stack.add_titled_with_icon(inbox, "inbox", "Inbox", "mail-unread-symbolic")
            stack.add_titled_with_icon(page("Drafts"), "drafts", "Drafts", "document-edit-symbolic")
            stack.add_titled_with_icon(page("Sent"), "sent", "Sent", "mail-send-symbolic")
          end

          inbox.tap do |list|
            list.append(unread_row)
            rows.each{|one| list.append(one) }
          end
        end

        view_switcher_bar.tap{|bar| bar.stack = view_stack; bar.reveal = true }
        view_switcher_title.tap{|title| title.stack = view_stack; title.title = "Mail" }
        inline_view_switcher.tap{|one| one.stack = view_stack }
      end
    end
  end

  # The mailbox tree, which folds away on a narrow window.
  def folders
    leaflet.tap do |one|
      one.append(flap)

      flap.tap do |two|
        two.flap = folder_list
        two.content = folder_content
        two.reveal_flap = true

        folder_list.tap do |box|
          %w[Inbox Archive Spam].each{|name| box.append(Gtk::Label.new(name).tap{|l| l.xalign = 0; l.margin_start = 12 }) }
        end
      end
    end
  end

  # The window it opens to write a message, which is still the old message dialog.
  def compose(application)
    compose_dialog.tap do |win|
      application.add_window(win)
      win.add_response("discard", "Discard")
      win.add_response("send", "Send")
      win.set_response_appearance("send", Adwaita::ResponseAppearance::SUGGESTED)
    end
  end

  def row = @row ||= Gtk::Box.new(:horizontal, 0)
  def view_switcher_sidebar = @view_switcher_sidebar ||= Adwaita::ViewSwitcherSidebar.new.tap{|one| one.width_request = 200 }
  def toolbar_view = @toolbar_view ||= Adwaita::ToolbarView.new.tap{|one| one.hexpand = true }
  def header_bar = @header_bar ||= Adwaita::HeaderBar.new
  def view_switcher_title = @view_switcher_title ||= Adwaita::ViewSwitcherTitle.new
  def view_switcher_bar = @view_switcher_bar ||= Adwaita::ViewSwitcherBar.new
  def inline_view_switcher = @inline_view_switcher ||= Adwaita::InlineViewSwitcher.new
  def view_switcher = @view_switcher ||= Adwaita::ViewSwitcher.new.tap{|one| one.stack = view_stack }

  def compose_button
    @compose_button ||= Gtk::Button.new.tap do |one|
      one.icon_name = "mail-message-new-symbolic"
      one.add_css_class("flat")
    end
  end

  def column = @column ||= Gtk::Box.new(:vertical, 0)

  def banner
    @banner ||= Adwaita::Banner.new("You are working offline").tap do |one|
      one.button_label = "Reconnect"
      one.revealed = true
    end
  end

  def view_stack = @view_stack ||= Adwaita::ViewStack.new.tap{|one| one.vexpand = true }

  def inbox
    @inbox ||= Gtk::ListBox.new.tap do |one|
      one.selection_mode = :single
      one.add_css_class("navigation-sidebar")
    end
  end

  def rows
    @rows ||= MESSAGES.map do |sender, subject, initials|
      Adwaita::ActionRow.new.tap do |one|
        one.title = sender
        one.subtitle = subject
        one.add_prefix(Adwaita::Avatar.new(32, initials, true))
      end
    end
  end

  # An unread marker, which is a plain list box row rather than an action row.
  def unread_row
    @unread_row ||= Gtk::ListBoxRow.new.tap do |one|
      one.child = Gtk::Label.new("3 unread").tap{|label| label.xalign = 0; label.margin_start = 12; label.margin_top = 6; label.margin_bottom = 6 }
    end
  end

  def page(text) = Gtk::Label.new(text).tap{|one| one.add_css_class("title-2") }
  def leaflet = @leaflet ||= Adwaita::Leaflet.new
  def flap = @flap ||= Adwaita::Flap.new
  def folder_list = @folder_list ||= Gtk::Box.new(:vertical, 6).tap{|one| one.width_request = 160; one.margin_top = 12 }
  def folder_content = @folder_content ||= Gtk::Label.new("Pick a folder").tap{|one| one.hexpand = true }

  def compose_dialog
    @compose_dialog ||= Adwaita::MessageDialog.new(nil, "Send this message?", "It will be delivered to three recipients.")
  end
end
