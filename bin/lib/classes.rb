# frozen_string_literal: true

# Adwaita's rules for a node, as the Tailwind which reproduces them, shared by the
# scripts which generate components and the ones which generate examples so that both
# split a component's style classes the same way.

module AdwaitaClasses
  # The classes a widget puts on itself from what it is holding, which bin/08 marks
  # `applied`. They are not a choice a caller makes -- gtkbutton.c adds `.text-button` to
  # every button whose child is a label -- so a component applies them itself and does
  # not offer them as props.
  CONTENT = %w[text-button image-button image-text-button horizontal vertical].freeze

  # The style classes a caller chooses between: not the ones the content decides, and
  # not the ones the widget's own `_init` puts on and nothing takes off.
  def self.offered(variants)
    variants.reject{|style, variant| self.content?(style, variant) || variant.fetch("automatic", false) }
  end

  def self.content?(style, variant)
    CONTENT.include?(style) && variant.fetch("applied", false)
  end

  # A class which only changes geometry is a size; anything which changes how the
  # component looks is a variant.
  GEOMETRY = %w[
    p- px- py- pt- pb- pl- pr- ps- pe- m- mx- my- mt- mb- ml- mr- ms- me-
    min- max- w- h- size- rounded- gap- aspect- inset-
  ].freeze

  # The base state's classes, then every other state behind the prefix which selects it.
  def self.stated(classes)
    return [] if classes.nil?

    base = classes.fetch("base", [])
    states = classes.reject{|state, _| state == "base"}.map do |state, list|
      list.map{|one| "#{state}:#{one}"}
    end

    [base] + states
  end

  # The state groups as one TypeScript expression: a string when there is one group, and
  # an array of them when there are several, which is what cva and cn both take.
  #
  # `name` is the style class itself, written first. A component which carried only the
  # measurements a style class resolves to was a component the rest of the stylesheet
  # could not see: `.flat`, `.text-button` and `.horizontal` are what
  # `headerbar button.flat`, `button.text-button > box` and `progressbar.horizontal >
  # trough` are written against, and registry/adwaita/styles.css is six thousand lines
  # of exactly those rules, addressing a class no component put on.
  def self.expression(classes, indent, name: nil)
    groups = self.stated(classes).reject(&:empty?).map{|group| group.join(" ")}
    groups = if name.nil?
               groups
             else
               [[name, groups.first].compact.join(" ")] + groups.drop(1)
             end

    case groups.length
    when 0 then nil
    when 1 then groups.first.inspect
    else
      pad = " " * indent
      "[\n#{groups.map{|group| "#{pad}  #{group.inspect},"}.join("\n")}\n#{pad}]"
    end
  end

  def self.geometry?(classes)
    found = self.stated(classes).flatten

    !found.empty? && found.all?{|one| GEOMETRY.any?{|prefix| one.start_with?(prefix)}}
  end

  # A component's style classes, as [variants, sizes].
  def self.split(variants)
    sizes, appearance = variants.to_h.partition do |_name, variant|
      self.geometry?(variant["classes"])
    end

    [appearance.to_h, sizes.to_h]
  end
end
