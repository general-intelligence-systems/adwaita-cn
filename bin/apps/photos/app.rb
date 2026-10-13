# frozen_string_literal: true

# A photo library: a grid of pictures with a selection badge over one of them, the
# tags under it, and the share sheet which slides up from the bottom.
#
# Rendered again from the registry's components in App.tsx beside this.

class PhotosApp
  TAGS = %w[Holiday Family Landscape Portrait Archive].freeze

  def build
    toolbar_view.tap do |view|
      view.add_top_bar(header_bar)
      view.content = column

      header_bar.tap{|bar| bar.pack_end(select_button) }

      column.tap do |box|
        box.append(scrolled_window)
        box.append(hero)
        box.append(canvas)
        box.append(gl_area)
        box.append(tags)

        scrolled_window.tap{|one| one.child = flow_box }

        flow_box.tap{|one| thumbnails.each{|child| one.append(child) } }

        hero.tap do |one|
          one.child = aspect_frame
          one.add_overlay(badge)

          aspect_frame.tap{|frame| frame.child = offload }

          offload.tap{|one2| one2.child = picture }
        end

        tags.tap{|one| TAGS.each{|tag| one.append(tag_label(tag)) } }
      end
    end
  end

  # The sheet which slides up to share a photo.
  def share
    bottom_sheet.tap do |one|
      one.content = sheet_content
      one.sheet = sheet_body
      one.open = true

      sheet_body.tap do |box|
        box.append(Gtk::Label.new("Share “photo.jpg”").tap{|label| label.add_css_class("title-4") })
        box.append(Gtk::Label.new("Pick somewhere to send it.").tap{|label| label.add_css_class("dim-label") })
      end
    end
  end

  def toolbar_view = @toolbar_view ||= Adwaita::ToolbarView.new
  def header_bar = @header_bar ||= Adwaita::HeaderBar.new
  def select_button = @select_button ||= Gtk::Button.new(label: "Select").tap{|one| one.add_css_class("flat") }

  def column
    @column ||= Gtk::Box.new(:vertical, 12).tap do |box|
      box.margin_top = 12
      box.margin_bottom = 12
      box.margin_start = 12
      box.margin_end = 12
    end
  end

  def scrolled_window = @scrolled_window ||= Gtk::ScrolledWindow.new.tap{|one| one.height_request = 180 }

  def flow_box
    @flow_box ||= Gtk::FlowBox.new.tap do |one|
      one.min_children_per_line = 3
      one.max_children_per_line = 5
      one.row_spacing = 6
      one.column_spacing = 6
      one.selection_mode = :none
    end
  end

  # Each thumbnail is a child in its own right, because what the application built is a
  # FlowBoxChild and not the label inside it.
  def thumbnails
    @thumbnails ||= (1..8).map do |index|
      Gtk::FlowBoxChild.new.tap do |child|
        child.child = Gtk::Image.new.tap{|one| one.icon_name = "image-x-generic-symbolic"; one.pixel_size = 48 }
        child.tooltip_text = "Photo #{index}"
      end
    end
  end

  def hero = @hero ||= Gtk::Overlay.new
  def aspect_frame = @aspect_frame ||= Gtk::AspectFrame.new(0.5, 0.5, 1.5, false)
  def offload = @offload ||= Gtk::GraphicsOffload.new
  def picture = @picture ||= Gtk::Picture.new.tap{|one| one.alternative_text = "The selected photo"; one.height_request = 120 }

  def badge
    @badge ||= Gtk::Label.new("1 selected").tap do |one|
      one.halign = :end
      one.valign = :start
      one.add_css_class("osd")
    end
  end

  def tags = @tags ||= Adwaita::WrapBox.new.tap{|one| one.child_spacing = 6; one.line_spacing = 6 }
  def tag_label(text) = Gtk::Label.new(text).tap{|one| one.add_css_class("dim-label") }

  # The editor's canvas, which is where a photo application draws its own pixels.
  def canvas
    @canvas ||= Gtk::DrawingArea.new.tap do |one|
      one.content_width = 120
      one.content_height = 48
      one.set_draw_func{|_area, cr, width, height| swatch(cr, width, height) }
    end
  end

  def gl_area = @gl_area ||= Gtk::GLArea.new.tap{|one| one.height_request = 48 }
  def bottom_sheet = @bottom_sheet ||= Adwaita::BottomSheet.new
  def sheet_content = @sheet_content ||= Gtk::Label.new("The library, behind the sheet")

  def sheet_body
    @sheet_body ||= Gtk::Box.new(:vertical, 6).tap do |box|
      box.margin_top = 18
      box.margin_bottom = 18
      box.margin_start = 18
      box.margin_end = 18
    end
  end

  def swatch(context, width, height)
    context.set_source_rgb(0.21, 0.52, 0.89)
    context.rectangle(0, 0, width, height)
    context.fill
  end
end
