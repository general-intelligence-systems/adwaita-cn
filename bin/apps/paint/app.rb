# frozen_string_literal: true

# A drawing application: the canvas, the tools above it, and the colour and font
# pickers a drawing application keeps to hand.
#
# Rendered again from the registry's components in App.tsx beside this.

class PaintApp
  def build
    toolbar_view.tap do |view|
      view.add_top_bar(header_bar)
      view.content = row

      header_bar.tap do |bar|
        bar.title_widget = tools
        bar.pack_end(color_button)
      end

      tools.tap do |box|
        box.append(pen_button)
        box.append(brush_button)
        box.append(eraser_button)
      end

      row.tap do |box|
        box.append(sidebar)
        box.append(separator)
        box.append(canvas)

        sidebar.tap do |column|
          column.append(swatches)
          column.append(color_dialog_button)
          column.append(font_button)
          column.append(font_dialog_button)
          column.append(size_button)
          column.append(opacity)
        end
      end
    end
  end

  # The colour chooser it opens for a colour not in the palette.
  def palette(application)
    palette_dialog.tap{|win| application.add_window(win) }
  end

  def toolbar_view = @toolbar_view ||= Adwaita::ToolbarView.new
  def header_bar = @header_bar ||= Adwaita::HeaderBar.new
  def tools = @tools ||= Gtk::Box.new(:horizontal, 0).tap{|one| one.add_css_class("linked") }
  def pen_button = @pen_button ||= Gtk::ToggleButton.new.tap{|one| one.icon_name = "edit-symbolic"; one.active = true }
  def brush_button = @brush_button ||= Gtk::ToggleButton.new.tap{|one| one.icon_name = "applications-graphics-symbolic"; one.group = pen_button }
  def eraser_button = @eraser_button ||= Gtk::ToggleButton.new.tap{|one| one.icon_name = "edit-clear-symbolic"; one.group = pen_button }
  def color_button = @color_button ||= Gtk::ColorButton.new.tap{|one| one.rgba = Gdk::RGBA.parse("#3584e4") }

  def row = @row ||= Gtk::Box.new(:horizontal, 12).tap do |one|
    one.margin_top = 12
    one.margin_bottom = 12
    one.margin_start = 12
    one.margin_end = 12
  end

  def sidebar = @sidebar ||= Gtk::Box.new(:vertical, 12).tap{|one| one.width_request = 220 }
  def swatches = @swatches ||= Gtk::ColorChooserWidget.new.tap{|one| one.show_editor = false }
  def color_dialog_button = @color_dialog_button ||= Gtk::ColorDialogButton.new(Gtk::ColorDialog.new)
  def font_button = @font_button ||= Gtk::FontButton.new
  def font_dialog_button = @font_dialog_button ||= Gtk::FontDialogButton.new(Gtk::FontDialog.new)

  def size_button
    @size_button ||= Gtk::ScaleButton.new.tap do |one|
      one.adjustment = Gtk::Adjustment.new(8, 1, 64, 1, 4, 0)
      one.icons = %w[zoom-in-symbolic]
      one.halign = :start
    end
  end

  def opacity
    @opacity ||= Gtk::Scale.new(:horizontal, Gtk::Adjustment.new(80, 0, 100, 1, 10, 0)).tap do |one|
      one.draw_value = true
    end
  end

  def separator = @separator ||= Gtk::Separator.new(:vertical)

  def canvas
    @canvas ||= Gtk::DrawingArea.new.tap do |one|
      one.hexpand = true
      one.vexpand = true
      one.set_draw_func{|_area, cr, width, height| sketch(cr, width, height) }
    end
  end

  def palette_dialog = @palette_dialog ||= Gtk::ColorChooserDialog.new.tap{|one| one.title = "Pick a Colour" }

  # Something on the canvas, so the shot is of a drawing application with a drawing in
  # it rather than an empty rectangle.
  def sketch(context, width, height)
    context.set_source_rgb(1, 1, 1)
    context.rectangle(0, 0, width, height)
    context.fill

    context.set_source_rgb(0.21, 0.52, 0.89)
    context.line_width = 6
    context.move_to(width * 0.15, height * 0.7)
    context.curve_to(width * 0.35, height * 0.2, width * 0.65, height * 0.9, width * 0.85, height * 0.35)
    context.stroke
  end
end
