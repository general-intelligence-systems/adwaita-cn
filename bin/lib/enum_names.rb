# frozen_string_literal: true

# The TypeScript name an enumeration is written under, which bin/09-gtk-enums declares and
# bin/11-generate-components refers to. Both derive it from the same set, so neither can
# name a union the other does not.
#
# A bare name wherever a bare name is unambiguous, and the namespace in front of it where it
# is not: GTK and Pango both declare a `WrapMode`, a GtkTextView's `wrap-mode` is GTK's and a
# GtkLabel's is Pango's, and writing both as `WrapMode` gave one of them the other's values.
module EnumNames
  # Which namespace keeps the bare name when two claim it. Adw before Gtk is the order the
  # rest of the pipeline consolidates class names in.
  PRECEDENCE = %w[Adw Gtk Gdk Pango Gsk Gio GObject GLib GdkPixbuf Graphene].freeze

  def self.map(enums)
    claimed = {}

    PRECEDENCE.each do |namespace|
      enums.each_key do |qualified|
        next unless qualified.start_with?("#{namespace}.")

        bare = qualified.split(".", 2).last
        claimed[bare] ||= qualified
      end
    end

    # A namespace the precedence does not name still claims a bare name no one else wants.
    enums.keys.sort.each do |qualified|
      claimed[qualified.split(".", 2).last] ||= qualified
    end

    enums.keys.to_h do |qualified|
      namespace, bare = qualified.split(".", 2)

      [qualified, claimed[bare] == qualified ? bare : "#{namespace}#{bare}"]
    end
  end
end
