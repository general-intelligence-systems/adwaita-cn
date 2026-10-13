# frozen_string_literal: true

# A calendar: the month picker down the side, the week laid out in a grid beside it,
# and the dialog which opens an event.
#
# Rendered again from the registry's components in App.tsx beside this.

class CalendarApp
  DAYS = %w[Mon Tue Wed Thu Fri Sat Sun].freeze

  def build
    toolbar_view.tap do |view|
      view.add_top_bar(header_bar)
      view.content = row

      header_bar.tap{|bar| bar.title_widget = title_box }

      title_box.tap do |box|
        box.start_widget = previous_button
        box.center_widget = month_label
        box.end_widget = next_button
      end

      row.tap do |box|
        box.append(side)
        box.append(week)

        side.tap do |column|
          column.append(calendar)
          column.append(summary_frame)

          summary_frame.tap{|frame| frame.child = summary_bin }

          summary_bin.tap{|bin| bin.child = summary }
        end

        week.tap do |grid|
          DAYS.each_with_index{|day, index| grid.attach(day_heading(day), index, 0, 1, 1) }
          DAYS.each_with_index{|_, index| grid.attach(day_cell(index), index, 1, 1, 1) }
        end
      end

      # One event is placed at a fixed offset, the way a day view positions a block.
      week.tap{|grid| grid.attach(pinned, 0, 2, 7, 1) }

      pinned.tap{|one| one.put(event_chip, 12, 4) }
    end
  end

  # The dialog which opens an event.
  def event(window)
    event_dialog.tap do |one|
      one.child = event_view

      event_view.tap do |view|
        view.add_top_bar(Adwaita::HeaderBar.new)
        view.content = event_body

        event_body.tap do |box|
          box.append(Gtk::Label.new("Design review").tap{|l| l.add_css_class("title-2") })
          box.append(Gtk::Label.new("Today, 14:00 – 15:00").tap{|l| l.add_css_class("dim-label") })
        end
      end

      one.present(window)
    end
  end

  def toolbar_view = @toolbar_view ||= Adwaita::ToolbarView.new
  def header_bar = @header_bar ||= Adwaita::HeaderBar.new
  def title_box = @title_box ||= Gtk::CenterBox.new.tap{|one| one.hexpand = true }
  def month_label = @month_label ||= Gtk::Label.new("October 2026").tap{|one| one.add_css_class("heading") }

  def previous_button
    @previous_button ||= Gtk::Button.new.tap do |one|
      one.icon_name = "go-previous-symbolic"
      one.add_css_class("flat")
    end
  end

  def next_button
    @next_button ||= Gtk::Button.new.tap do |one|
      one.icon_name = "go-next-symbolic"
      one.add_css_class("flat")
    end
  end

  def row = @row ||= Gtk::Box.new(:horizontal, 12).tap do |one|
    one.margin_top = 12
    one.margin_bottom = 12
    one.margin_start = 12
    one.margin_end = 12
  end

  def side = @side ||= Gtk::Box.new(:vertical, 12)
  def calendar = @calendar ||= Gtk::Calendar.new
  def summary_frame = @summary_frame ||= Gtk::Frame.new("Today")
  def summary_bin = @summary_bin ||= Adwaita::Bin.new

  # An inscription rather than a label: it is the widget GTK added for text which is
  # only ever shown, and a summary line is exactly that.
  def summary = @summary ||= Gtk::Inscription.new("Three events, one all day").tap do |one|
    one.margin_top = 6
    one.margin_bottom = 6
    one.margin_start = 6
    one.margin_end = 6
  end

  def week
    @week ||= Gtk::Grid.new.tap do |one|
      one.column_spacing = 6
      one.row_spacing = 6
      one.column_homogeneous = true
      one.hexpand = true
    end
  end

  def day_heading(day) = Gtk::Label.new(day).tap{|one| one.add_css_class("heading") }
  def day_cell(index) = Gtk::Label.new((12 + index).to_s).tap{|one| one.add_css_class("dim-label") }
  def pinned = @pinned ||= Gtk::Fixed.new.tap{|one| one.height_request = 40 }

  def event_chip
    @event_chip ||= Gtk::Button.new(label: "Design review 14:00").tap do |one|
      one.add_css_class("suggested-action")
      one.add_css_class("pill")
    end
  end

  def event_dialog
    @event_dialog ||= Adwaita::Dialog.new.tap do |one|
      one.title = "Event"
      one.content_width = 360
      one.content_height = 220
    end
  end

  def event_view = @event_view ||= Adwaita::ToolbarView.new

  def event_body
    @event_body ||= Gtk::Box.new(:vertical, 6).tap do |box|
      box.margin_top = 18
      box.margin_bottom = 18
      box.margin_start = 18
      box.margin_end = 18
    end
  end
end
