# frozen_string_literal: true

# Adwaita's class names, as the table the components resolve through.
#
# The pipeline's first stage already turns Adwaita's declarations into Tailwind. What went
# wrong was everything after it: each component was handed the utilities its classes
# resolved to, inlined, and the ones the stylesheet states about a widget BECAUSE OF WHERE
# IT IS could not be inlined anywhere -- so they were left as six thousand lines of CSS and
# the components carried the name and the measurements both.
#
# So nothing is calculated per component any more. Every name Adwaita addresses is
# registered here against the utilities it resolves to, and a component names itself the
# way GTK does -- `cn("button flat circular")`. The node is the first name, exactly as the
# node is in a selector, and the classes after it resolve in its context.
#
# A rule with a context is registered against the compound that OWNS it -- the leftmost one
# -- as a Tailwind arbitrary variant, which is how `.navigation-sidebar > row` becomes
# something the sidebar itself can carry: `[&>[data-node=row]]:rounded-md`. The cascade
# stops being a thing the registry needs and becomes a thing the component tree already is.
require "set"

module RegistryClasses
  STATES = {
    "hover" => ":hover", "active" => ":active", "disabled" => ":disabled",
    "focus" => ":focus", "focus-visible" => ":focus-visible",
    "indeterminate" => ":indeterminate", "first" => ":first-child",
    "last" => ":last-child", "only" => ":only-child",
    "data-[state=checked]" => '[data-state="checked"]', "data-[selected]" => "[data-selected]",
  }.freeze

  # A compound as a selector: the node by the attribute every component renders, the
  # classes as classes.
  def self.compound(one)
    element = one[/\A[a-z][a-z0-9-]*/]
    classes = one.scan(/\.[a-z0-9-]+/).join

    "#{element ? "[data-node=#{element}]" : ''}#{classes}"
  end

  # A compound as the key it is registered under: a node, a class, or a node's class.
  def self.key(one)
    element = one[/\A[a-z][a-z0-9-]*/]
    classes = one.scan(/\.[a-z0-9-]+/).map{|c| c.delete_prefix(".") }

    return nil if element.nil? && classes.empty?
    return element if classes.empty?
    return classes.join(".") if element.nil?

    "#{element}.#{classes.join('.')}"
  end

  # A selector, split into its compounds with the combinator that reached each.
  def self.compounds(selector)
    selector.scan(/(>|\A|\s)\s*([^\s>]+)/).map{|before, one| [before.strip == ">" ? ">" : " ", one] }
  end

  # The state, as the suffix it selects. Nil when it is a state with no selector, which is
  # a state the component carries itself rather than one a rule can ask for.
  def self.state_suffix(state)
    return "" if state == "base"

    parts = state.split(":").map{|one| STATES[one] }

    parts.any?(&:nil?) ? nil : parts.join
  end

  # The utilities of a contextual rule, each behind the arbitrary variant which selects its
  # subject from the owner. Tailwind reads an underscore in an arbitrary value back as a
  # space, which is what makes a descendant combinator survive being written in a class.
  def self.contextual(path, state, utilities)
    suffix = self.state_suffix(state)

    return [] if suffix.nil?

    # `:where()` SO THE PATH COUNTS FOR NOTHING. Adwaita states what a widget is because of
    # where it is with elements -- `preferencesgroup > box > box > label` is four of them and
    # weighs less than the `.heading` the label carries -- and the same path written with
    # `[data-node]` is four attributes, which weighs more and won. Every group heading came
    # out at normal weight and dimmed, because the rule about where it sat beat the rule
    # about what it is.
    written = path.map{|combinator, one| "#{combinator == '>' ? '>' : '_'}:where(#{self.compound(one)})" }.join
    variant = "[&#{written}#{suffix}]"

    utilities.map{|one| "#{variant}:#{one}" }
  end

  # The utilities a widget carries itself, each behind the prefix of the state it belongs to.
  def self.direct(state, utilities)
    return utilities if state == "base"

    utilities.map{|one| "#{state}:#{one}" }
  end

  # Merge a node's structural utilities -- what its layout manager does, which is a fact
  # about the node and not about any one component that renders as it -- into the table.
  # Reported rather than resolved when two components disagree about a node: a node which
  # is a grid in one tree and a flex row in another is a node the table cannot speak for,
  # and silently unioning the two produced a box that was both.
  # Merged onto the node where every tree agrees about it. Where they do not -- a `box` is a
  # GtkBox in one place and a GtkCenterBox in another, and GTK gives both the same CSS node --
  # the node cannot speak for it, so each layout is registered under the manager that arranges
  # it and the component names which one it is. The manager's name is GTK's own.
  def self.structural(nodes, scoped, structure)
    structure.each do |node, utilities|
      # EVERY NODE IS REGISTERED, even where Adwaita says nothing about it and nothing is
      # left to say. A node is what sets the context the names after it resolve in, so a node
      # missing from the table is a node `cn` does not recognise -- and `cn("box", "box")`
      # then looked up nothing, which is every box in the registry laid out as a block.
      nodes[node] ||= []

      # A node reached where nothing said what it arranges says nothing about it, which is
      # not the same as disagreeing with the tree that did.
      found = utilities.reject{|kind, one| one.to_s.empty? }.uniq{|_kind, one| one }

      next if found.empty?

      if found.length == 1
        (nodes[node] ||= []).concat(found.first.last.split(" "))
        next
      end

      found.each{|kind, one| (scoped["#{node}.#{kind}"] ||= []).concat(one.split(" ")) }
    end
  end

  # The nodes whose layout depends on which widget rendered them, so the component has to
  # name the manager.
  def self.conflicted(structure)
    structure.filter_map do |node, utilities|
      found = utilities.reject{|_kind, one| one.to_s.empty? }.uniq{|_kind, one| one }

      node if found.length > 1
    end.to_set
  end

  # node -> utilities, "node.class" -> utilities, class -> utilities.
  #
  # Built from what the earlier stages already worked out, in one pass, so that a name
  # resolves to the same utilities wherever it is written.
  def self.table(final, structure = {}, measurements = {})
    nodes = {}
    scoped = {}
    universal = {}

    add = lambda do |into, key, list|
      next if key.nil? || list.empty?

      (into[key] ||= []).concat(list)
    end

    final.fetch("components").each_value do |component|
      node = component["node"]

      next if node.nil? || node.empty?

      (component["classes"] || {}).each{|state, list| add.call(nodes, node, self.direct(state, list)) }

      (component["variants"] || {}).each do |name, variant|
        (variant["classes"] || {}).each do |state, list|
          add.call(scoped, "#{node}.#{name}", self.direct(state, list))
        end
      end
    end

    final.fetch("universal", {}).each do |name, variant|
      (variant["classes"] || {}).each{|state, list| add.call(universal, name, self.direct(state, list)) }
    end

    # The rules with a context, in the order the stylesheet states them, so that two rules
    # reaching the same subject stay in the order which decided between them.
    final.fetch("styles", {}).each do |selector, states|
      found = self.compounds(selector)

      next if found.empty?

      _, owner = found.first
      key = self.key(owner)
      path = found.drop(1)

      next if key.nil?

      into = if path.empty? && !key.include?(".") && nodes.key?(key) then nodes
             elsif key.include?(".") then scoped
             elsif owner.start_with?(".") then universal
             else nodes
             end

      states.each do |state, list|
        next if list.empty?

        add.call(into, key, path.empty? ? self.direct(state, list) : self.contextual(path, state, list))
      end
    end

    self.structural(nodes, scoped, structure)

    # What a node measures wherever it is: a trough is as thick as the slider in it, a label
    # places its own text. Merged rather than weighed against each other, because these are
    # facts about the node and not competing claims about it.
    measurements.each do |node, utilities|
      found = utilities.flat_map{|one| one.to_s.split(" ") }.uniq

      (nodes[node] ||= []).concat(found)
    end

    [nodes, scoped, universal].each do |into|
      into.each{|key, list| into[key] = list.uniq.join(" ") }
    end

    { "nodes" => nodes.sort.to_h, "scoped" => scoped.sort.to_h, "universal" => universal.sort.to_h }
  end
end
