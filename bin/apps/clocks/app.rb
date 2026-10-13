# frozen_string_literal: true

# A clock application: world clocks, alarms, a stopwatch and a timer as pages of a
# stack, with the switcher in the header and the sidebar beside it.
#
# Rendered again from the registry's components in App.tsx beside this.

class ClocksApp
  CITIES = [["London", "09:14"], ["Lisbon", "09:14"], ["New York", "04:14"]].freeze

  def build
    toolbar_view.tap do |view|
      view.add_top_bar(header_bar)
      view.content = paned

      header_bar.tap do |bar|
        bar.title_widget = stack_switcher
        bar.pack_end(add_button)
      end

      paned.tap do |split|
        split.start_child = stack_sidebar
        split.end_child = stack
        split.position = 180
        split.resize_start_child = false

        stack_sidebar.tap{|one| one.stack = stack }

        stack.tap do |one|
          one.add_titled(world_page, "world", "World")
          one.add_titled(alarms_page, "alarms", "Alarms")
          one.add_titled(stopwatch_page, "stopwatch", "Stopwatch")
        end

        world_page.tap do |box|
          CITIES.each{|city, time| box.append(city_row(city, time)) }
        end

        stopwatch_page.tap do |box|
          box.append(squeezer)
          box.append(spinner)
          box.append(revealer)

          squeezer.tap do |one|
            one.add(long_reading)
            one.add(short_reading)
          end

          revealer.tap{|one| one.child = lap_label }
        end
      end

      stack_switcher.tap{|one| one.stack = stack }
    end
  end

  # The timer, which this application puts in a window of its own.
  def timer(application)
    timer_window.tap do |win|
      application.add_window(win)
      win.content = timer_view

      timer_view.tap do |view|
        view.add_top_bar(Adwaita::HeaderBar.new)
        view.content = timer_body

        timer_body.tap do |box|
          box.append(Gtk::Label.new("00:05:00").tap{|l| l.add_css_class("title-1") })
          box.append(Gtk::Button.new(label: "Start").tap{|b| b.add_css_class("pill"); b.add_css_class("suggested-action"); b.halign = :center })
        end
      end
    end
  end

  def toolbar_view = @toolbar_view ||= Adwaita::ToolbarView.new
  def header_bar = @header_bar ||= Adwaita::HeaderBar.new
  def stack_switcher = @stack_switcher ||= Gtk::StackSwitcher.new

  def add_button
    @add_button ||= Gtk::Button.new.tap do |one|
      one.icon_name = "list-add-symbolic"
      one.add_css_class("flat")
    end
  end

  def paned = @paned ||= Gtk::Paned.new(:horizontal)
  def stack_sidebar = @stack_sidebar ||= Gtk::StackSidebar.new
  def stack = @stack ||= Gtk::Stack.new

  def world_page
    @world_page ||= Gtk::Box.new(:vertical, 6).tap do |box|
      box.margin_top = 12
      box.margin_bottom = 12
      box.margin_start = 12
      box.margin_end = 12
    end
  end

  def city_row(city, time)
    Gtk::Box.new(:horizontal, 12).tap do |box|
      box.append(Gtk::Label.new(city).tap{|one| one.xalign = 0; one.hexpand = true })
      box.append(Gtk::Label.new(time).tap{|one| one.add_css_class("numeric") })
    end
  end

  def alarms_page = @alarms_page ||= Gtk::Label.new("No alarms set").tap{|one| one.add_css_class("dim-label") }

  def stopwatch_page
    @stopwatch_page ||= Gtk::Box.new(:vertical, 12).tap do |box|
      box.margin_top = 12
      box.margin_bottom = 12
      box.margin_start = 12
      box.margin_end = 12
    end
  end

  def squeezer = @squeezer ||= Adwaita::Squeezer.new
  def long_reading = @long_reading ||= Gtk::Label.new("00:00:12.48 elapsed").tap{|one| one.add_css_class("title-1") }
  def short_reading = @short_reading ||= Gtk::Label.new("12.48").tap{|one| one.add_css_class("title-1") }
  def spinner = @spinner ||= Gtk::Spinner.new.tap{|one| one.spinning = true; one.halign = :center }
  def revealer = @revealer ||= Gtk::Revealer.new.tap{|one| one.reveal_child = true }
  def lap_label = @lap_label ||= Gtk::Label.new("Lap 3 — 4.12").tap{|one| one.add_css_class("dim-label") }
  def timer_window = @timer_window ||= Adwaita::Window.new
  def timer_view = @timer_view ||= Adwaita::ToolbarView.new

  def timer_body
    @timer_body ||= Gtk::Box.new(:vertical, 12).tap do |box|
      box.valign = :center
      box.margin_top = 18
      box.margin_bottom = 18
      box.margin_start = 18
      box.margin_end = 18
    end
  end
end
