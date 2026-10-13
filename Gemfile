# frozen_string_literal: true

source "https://rubygems.org"

# bin/07-gtk-schemas parses Gtk-4.0.gir and Adw-1.gir with it. Ruby 3.4 unbundled rexml, so it
# is a dependency now rather than something stdlib provides.
gem "rexml"

# bin/14-app-screenshots renders each application for real, so that a screenshot of the
# toolkit can be put beside a screenshot of the component built from its measurements.
gem "adwaita"
gem "gtk4"

group :development do
  # bin/14-app-screenshots drives headless Chrome with it, over the devtools protocol, and serves
  # the harness to it with webrick, which Ruby 3 unbundled.
  gem "ferrum"
  gem "webrick"

  gem "rubocop"
  # Its cops are the house style for the ruby under bin/.
  gem "rubocop-socketry"
end
