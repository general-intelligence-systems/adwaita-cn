# frozen_string_literal: true

source "https://rubygems.org"

# bin/07-gtk-schemas parses Gtk-4.0.gir and Adw-1.gir with it. Ruby 3.4 unbundled rexml, so it
# is a dependency now rather than something stdlib provides.
gem "rexml"

group :development do
  gem "rubocop"
  # Its cops are the house style for the ruby under bin/.
  gem "rubocop-socketry"
end
