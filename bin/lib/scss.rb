# frozen_string_literal: true

# libadwaita's stylesheet as its own source states it, rather than as the shipped sheet
# leaves it.
#
# WHY THE SOURCE AND NOT THE OUTPUT. bin/03 reads adwaita.css, which is 4,135 flat
# selectors with no record of which widget any of them belongs to, so the stage after it
# had to guess from the selector's subject -- and a subject is not an owner: `headerbar
# button`, `.linked > button` and `button.destructive-action` all report as `button`, were
# merged into one bag of utilities per node, and the context which chose between them was
# gone. `button` alone is reached at 78 different specificities.
#
# The source states the owner by the file: `widgets/_toggle-group.scss` is AdwToggleGroup's
# rules and nothing else's. Dart Sass is asked for a source map, and the map says which
# partial every rule in the compiled sheet came from.
#
# THE COMPILER IS DART SASS AND NOT A PARSER OF OURS. Variables, nesting, `&`, the five
# mixins, `@at-root`, 22 placeholders and 122 `@extend`s are the preprocessor's job, and
# each is a way to get the answer subtly wrong by hand: `:not(.raised)` is a filter and not
# a class on the subject, `$popover_radius: $menu_radius + 6` is arithmetic, and an
# `@extend` reaches across partials. This runs the real thing.

require "json"
require "open3"
require "tmpdir"
require "fileutils"

module Scss
  ROOT = "bin/02-fetch-gir.out/src/libadwaita/src/stylesheet"
  ENTRY = "gtk.scss"

  # libadwaita's own source does not compile.
  #
  # `calc(#{$button_radius} - var(---group-padding);` in _toggle-group.scss is missing its
  # closing bracket. libadwaita builds with sassc, which is libsass and lets it through;
  # Dart Sass refuses the file, and the browser -- which is what matters here -- drops the
  # declaration, so every toggle in a toggle group has no radius and no height.
  #
  # Patched on a copy. The vendored tree stays as it was fetched.
  PATCHES = [
    [
      "widgets/_toggle-group.scss",
      "- var(---group-padding);",
      "- var(---group-padding));",
    ],
  ].freeze

  # `prefers-contrast` and `print` are overrides rather than the shape, which is the call
  # bin/03 already makes about them.
  SKIPPED_MEDIA = /prefers-contrast|print/.freeze

  Rule = Struct.new(:widget, :selector, :declarations, :media, keyword_init: true)

  def self.read(root)
    Dir.mktmpdir("adwaita-scss") do |scratch|
      source = self.staged(root, scratch)
      css, map = self.compile(root, source, scratch)

      next [] if css.nil?

      self.rules(css, self.owners(map))
    end
  end

  # The stylesheet copied somewhere writable, with the patches applied.
  def self.staged(root, scratch)
    staged = File.join(scratch, "stylesheet")

    FileUtils.cp_r(File.join(root, ROOT), staged)

    PATCHES.each do |relative, from, to|
      path = File.join(staged, relative)

      next unless File.exist?(path)

      text = File.read(path)

      next unless text.include?(from)

      File.write(path, text.sub(from, to))
    end

    File.join(staged, ENTRY)
  end

  def self.compile(root, source, scratch)
    out = File.join(scratch, "adwaita.css")

    command = [
      "pnpm", "exec", "sass", "--no-charset", "--style=expanded", "--source-map",
      "--quiet-deps", "--silence-deprecation=import", source, out
    ]

    _stdout, stderr, status = Open3.capture3(*command, chdir: root)

    unless status.success? && File.exist?(out)
      warn("scss: sass failed: #{stderr.lines.reject{|one| one.include?('DEPRECATION') }.first(3).join.strip}")
      return [nil, nil]
    end

    [File.read(out), JSON.parse(File.read("#{out}.map"))]
  end

  # Which partial each line of the compiled sheet came from.
  #
  # A line rather than a column: a rule's selector starts a line, and the line is the thing
  # being attributed. The map's `sources` are the partials; its `mappings` are one
  # semicolon-separated group per output line, each a comma-separated run of VLQ segments
  # whose second field is a DELTA on the index of the source.
  def self.owners(map)
    sources = map.fetch("sources").map{|one| self.widget(one) }
    found = []
    file = 0

    map.fetch("mappings").split(";", -1).each do |group|
      owner = nil

      group.split(",").each do |segment|
        values = self.vlq(segment)

        next if values.length < 2

        file += values[1]
        owner ||= sources[file]
      end

      found << owner
    end

    # A line the map says nothing about belongs to whatever opened above it.
    carried = nil
    found.map{|one| carried = one || carried }
  end

  BASE64 = (("A".."Z").to_a + ("a".."z").to_a + ("0".."9").to_a + ["+", "/"]).freeze
  DIGITS = BASE64.each_with_index.to_h.freeze

  # One source-map segment, as the numbers it encodes.
  def self.vlq(segment)
    values = []
    shift = 0
    current = 0

    segment.each_char do |char|
      digit = DIGITS[char]

      next if digit.nil?

      current += (digit & 31) << shift

      if (digit & 32).zero?
        negative = (current & 1) == 1
        current >>= 1
        values << (negative ? -current : current)
        shift = 0
        current = 0
      else
        shift += 5
      end
    end

    values
  end

  # The widget a partial is about: `widgets/_toggle-group.scss` is `toggle-group`.
  def self.widget(path)
    File.basename(path, ".scss").delete_prefix("_")
  end

  # The compiled sheet, read into rules, each tagged with its owner.
  def self.rules(css, owners)
    found = {}
    media = []
    selectors = []
    line = -1

    css.each_line do |text|
      line += 1
      stripped = text.strip

      next if stripped.empty? || stripped.start_with?("/*")

      if stripped.end_with?("{")
        head = stripped.delete_suffix("{").strip

        if head.start_with?("@")
          media.push(head)
          selectors.push(nil)
        else
          media.push(nil)
          selectors.push([head, owners[line]])
        end

        next
      end

      if stripped.start_with?("}")
        media.pop
        selectors.pop
        next
      end

      current = selectors.compact.last

      next if current.nil?

      property, _, value = stripped.delete_suffix(";").partition(":")

      next if value.strip.empty? || property.strip.empty?

      query = media.compact.find{|one| one.start_with?("@media") }

      next if query&.match?(SKIPPED_MEDIA)

      head, owner = current

      head.split(",").each do |one|
        selector = one.strip

        next if selector.empty?

        rule = (found[[selector, query]] ||= Rule.new(widget: owner, selector: selector, declarations: {}, media: query))
        rule.declarations[property.strip] = value.strip
      end
    end

    found.values.reject{|rule| rule.widget.nil? || rule.declarations.empty? }
  end
end
