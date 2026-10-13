# frozen_string_literal: true

# A music player: the album art and the carousel of covers above, the transport and
# volume below, and an about dialog behind the menu.
#
# Rendered again from the registry's components in App.tsx beside this.

class MusicApp
  ALBUMS = ["Kind of Blue", "Blue Train", "A Love Supreme"].freeze

  def build
    toolbar_view.tap do |view|
      view.add_top_bar(header_bar)
      view.content = column

      header_bar.tap do |bar|
        bar.pack_end(volume_button)
        bar.pack_end(speed_button)
      end

      column.tap do |box|
        box.append(carousel)
        box.append(dots)
        box.append(lines)
        box.append(separator)
        box.append(now_playing)
        box.append(media_controls)
        box.append(seek)
        box.append(video)

        carousel.tap{|one| ALBUMS.each{|title| one.append(cover(title)) } }

        now_playing.tap do |row|
          row.append(art)
          row.append(title_label)
          row.append(play_button)
        end
      end
    end
  end

  # The about dialog behind its menu.
  def about(window) = about_dialog.tap{|one| one.present(window) }

  def toolbar_view = @toolbar_view ||= Adwaita::ToolbarView.new
  def header_bar = @header_bar ||= Adwaita::HeaderBar.new
  def volume_button = @volume_button ||= Gtk::VolumeButton.new

  def column
    @column ||= Gtk::Box.new(:vertical, 12).tap do |box|
      box.margin_top = 12
      box.margin_bottom = 12
      box.margin_start = 12
      box.margin_end = 12
    end
  end

  def carousel = @carousel ||= Adwaita::Carousel.new.tap{|one| one.height_request = 140 }
  def dots = @dots ||= Adwaita::CarouselIndicatorDots.new.tap{|one| one.carousel = carousel }
  def lines = @lines ||= Adwaita::CarouselIndicatorLines.new.tap{|one| one.carousel = carousel }
  def separator = @separator ||= Gtk::Separator.new(:horizontal)
  def now_playing = @now_playing ||= Gtk::Box.new(:horizontal, 12)
  def art = @art ||= Gtk::Image.new.tap{|one| one.icon_name = "audio-x-generic-symbolic"; one.pixel_size = 48 }

  def title_label
    @title_label ||= Gtk::Label.new("So What").tap do |one|
      one.add_css_class("title-4")
      one.xalign = 0
      one.hexpand = true
    end
  end

  def play_button
    @play_button ||= Gtk::Button.new.tap do |one|
      one.icon_name = "media-playback-start-symbolic"
      one.add_css_class("circular")
      one.add_css_class("suggested-action")
    end
  end

  def media_controls = @media_controls ||= Gtk::MediaControls.new

  # The seek slider the transport does not provide on its own.
  def seek
    @seek ||= Gtk::Scale.new(:horizontal, Gtk::Adjustment.new(38, 0, 100, 1, 10, 0)).tap do |one|
      one.draw_value = false
    end
  end

  # The player's video pane, for when what is playing has a picture.
  def video = @video ||= Gtk::Video.new.tap{|one| one.height_request = 80 }

  # A scale button beside the volume one, for playback speed.
  def speed_button
    @speed_button ||= Gtk::ScaleButton.new.tap do |one|
      one.adjustment = Gtk::Adjustment.new(1, 0.5, 2, 0.1, 0.5, 0)
      one.icons = %w[media-playlist-repeat-symbolic]
    end
  end

  def cover(title)
    Gtk::Label.new(title).tap do |one|
      one.add_css_class("title-2")
      one.width_request = 200
    end
  end

  def about_dialog
    @about_dialog ||= Adwaita::AboutDialog.new.tap do |one|
      one.application_name = "Music"
      one.application_icon = "audio-x-generic-symbolic"
      one.developer_name = "The adwaita-cn authors"
      one.version = "1.0.0"
      one.website = "https://example.org"
      one.license_type = Gtk::License::GPL_3_0
    end
  end
end
