# frozen_string_literal: true

# What a widget draws inside itself, as JSX.
#
# ERB owns the shape of the file and this owns the walk, because a widget tree is
# recursive and a template that recurses is a template nobody can read.
#
# The tree is the `given` tree out of widgets.json -- the widget as a caller would
# actually build it -- so an AdwHeaderBar is its window handle, its box, its three
# positions and the window controls in the end one, which is what GTK puts there before
# a caller has handed over anything at all.
#
# EACH NODE IS A FUNCTION OF ITS OWN rather than a div nested in the root's markup. A
# composite collapsed into one element is a composite with nothing in it: the header bar
# written that way had its twelve nodes flattened to one and drew an empty bar.

require_relative "components"

module Markup
  # The layout manager a node arranges its children with, as the utility that means it.
  # These are in GTK's and libadwaita's C and in no stylesheet anywhere, which is why
  # theme.css states them and why a node that names none of them does not lay out at all.
  LAYOUTS = {
    "GtkBoxLayout" => "box-layout",
    "GtkBinLayout" => "bin-layout",
    "GtkCenterLayout" => "center-layout",
    "GtkOverlayLayout" => "overlay-layout",
    "GtkGridLayout" => "grid-layout",
    "GtkFixedLayout" => "fixed-layout",
    "AdwClampLayout" => "clamp-layout",
    "AdwWrapLayout" => "wrap-layout",
  }.freeze

  # A node with no manager of its own still arranges its children, and `arranges` is
  # what the walk read back: a bin hands its child the whole allocation, a row runs
  # across and a column runs down.
  ARRANGES = { "bin" => "bin-layout", "row" => "box-layout", "column" => "box-layout" }.freeze

  # The property a node draws, by the node it is and the class it carries. A row has two
  # labels and `.title` and `.subtitle` are the only thing that tells them apart.
  DRAWN = {
    %w[label title] => "title",
    %w[label subtitle] => "subtitle",
    %w[label] => "label",
    %w[image] => "icon-name",
  }.freeze

  # Nodes the toolkit paints in order to NOT show them. `indicatorbin > mask` is filled
  # black and used as the alpha mask the indicator is composited through, which is a GSK
  # operation and not a thing a stylesheet does. Rendered as an element it is what it
  # says it is: a black dot where the toolkit draws none.
  HIDDEN = %w[mask].to_set

  Part = Struct.new(:function, :node, :element, :classes, :icon, keyword_init: true)

  # The root's children, the part functions beside it, and which props were drawn.
  def self.for(component)
    state = {
      component: component,
      names: component.props.map(&:gtk).to_set,
      slots: component.slots.to_h { |prop, where| [bare(where.fetch("path")), Components.camel(prop)] },
      consumed: [],
      filled: [],
      parts: [],
      taken: Hash.new(0),
    }

    pad = " " * 8
    rendered = component.tree.fetch("children", []).map { |child| [child, node(child, state, 8)] }

    # A slot whose marker is nowhere in the tree still has to be rendered.
    #
    # `slots` probes a widget by putting a marked child in and reading back where it came
    # out, and for a widget whose own chrome is built around that child -- an
    # AdwToolbarView is a top bar, the content, and a bottom bar -- the probe ran with no
    # bars present and recorded `toolbarview > label`, a path the built tree does not
    # contain. Matched only by path, `content` was never written and every application
    # built on a toolbar view drew its header and nothing under it.
    #
    # Where it goes is in the classes Adwaita already states: a child marked as trailing
    # is after the content and everything else is before it.
    missing = state[:slots].values - state[:filled]

    inner = []
    placed = false

    rendered.each do |child, lines|
      if !placed && trailing?(child)
        inner.concat(handed(missing, pad))
        placed = true
      end

      inner.concat(lines)
    end

    inner.concat(handed(missing, pad)) unless placed

    [inner.join("\n"), state[:parts], state[:consumed]]
  end

  # `{children}` and whatever slot the walk could not place, in the order GTK takes them.
  #
  # CHILDREN COME FIRST WHERE THERE IS A CONTENT SLOT. A widget which names its content
  # as a property takes its children as the chrome around that content --
  # `adw_toolbar_view_add_top_bar` is what a child of an AdwToolbarView is -- so writing
  # them after the content put every application's header bar along the bottom of its
  # window.
  def self.handed(missing, pad)
    children = "#{pad}{children}"
    return [children] if missing.empty?

    [children, *missing.map { |prop| "#{pad}{#{prop}}" }]
  end

  # A child the widget draws AFTER whatever it was handed: a bottom bar, an end box.
  # Adwaita names these on the node itself, so the order is read rather than assumed.
  TRAILING = %w[bottom-bar bottom end].freeze

  def self.trailing?(child)
    (child.fetch("classes", []) & TRAILING).any?
  end

  # A path with the classes taken off each step. `slots` records where a handed-over
  # widget landed as bare node names -- `headerbar > windowhandle > box > widget > label`
  # -- and the tree states the same step as `label.title`, so the two only line up once
  # both are reduced to the nodes. Compared as written, no slot in the registry matched
  # and every title a caller passed was dropped.
  def self.bare(path) = path.split(" > ").map { |step| step.split(".").first }.join(" > ")

  def self.node(child, state, indent)
    name = child.fetch("node")
    return [] if HIDDEN.include?(name)

    pad = " " * indent
    slot = state[:slots][bare(child.fetch("path"))]

    # A node the caller's widget replaces is not rendered: it is a marker the walk put
    # there to read the path back, and drawing it as well put an empty label beside
    # whatever was handed over.
    drawn = DRAWN[[name, *child.fetch("classes", [])].first(2)] || DRAWN[[name]]
    drawn = nil unless drawn && state[:names].include?(drawn)

    # A node can be BOTH the slot and what draws a property, and it is the common case
    # rather than the odd one: a button's label node is where its `label` is drawn and
    # also where a child handed over lands. Returning the slot and stopping there left
    # every button, every row and every menu item in the registry with no text in it.
    if slot
      state[:filled] << slot

      return ["#{pad}{#{slot}}"] if drawn.nil?
    end

    part = part_for(child, state, drawn == "icon-name")
    state[:consumed] << drawn if drawn

    body = child.fetch("children", []).flat_map { |c| node(c, state, indent + 2) }
    body << "#{pad}  {#{Components.camel(drawn)}}" if drawn && drawn != "icon-name"

    # Same reason the root omits them: a void element takes no children, so a node which
    # is one is written closed whatever the toolkit hung under it.
    lines =
      if body.empty? || Components::VOID.include?(part.element)
        ["#{pad}<#{part.function} />"]
      else
        ["#{pad}<#{part.function}>", *body, "#{pad}</#{part.function}>"]
      end

    slot ? lines + ["#{pad}{#{slot}}"] : lines
  end

  # One function per node, named for the component and the node it is. A second `box` in
  # the same widget is `Box2`, because two functions of one name is a file that does not
  # compile.
  def self.part_for(child, state, icon)
    name = child.fetch("node")
    base = state[:component].name + Components.pascal(name.tr("-", "_").gsub("_", "-"))
    state[:taken][base] += 1
    count = state[:taken][base]
    function = count == 1 ? base : "#{base}#{count}"

    part = Part.new(
      function: function,
      node: name,
      element: icon ? "Icon" : Components::ELEMENTS.fetch(name, "div"),
      classes: classes_for(child),
      icon: icon ? child.fetch("properties", {})["icon-name"] : nil,
    )

    state[:parts] << part
    part
  end

  # What the node is addressed by, what it carries, and what arranges its children.
  # What the node is addressed by, what it carries, and what arranges its children.
  #
  # THE CLASS NAMES ARE COPIED, NOT DERIVED. `gtk_widget_get_css_classes` is what the
  # walk asked every node at the moment it existed, so `box` carrying `header` and
  # `horizontal` is what GTK itself put there -- the same names its own cascade matches
  # against. `cn` turns them into utilities; nothing here has to work out which rule
  # applies, and a step that tried to was a second opinion about something already known.
  def self.classes_for(child)
    [child.fetch("node"), *child.fetch("classes", []), *arrangement(child).compact]
  end

  # The layout manager and the axis it runs along.
  #
  # THE AXIS IS NOT ONLY `orientation`. box-layout deliberately states no direction --
  # GTK puts `.horizontal` or `.vertical` on every orientable widget and the component
  # writes whichever it was given -- so a flex container that is handed neither falls
  # back to the browser's default, which is a row. An AdwToolbarView states no
  # orientation and arranges a column, and written without this its header bar was laid
  # out BESIDE its content instead of above it, off the side of the window.
  def self.arrangement(node)
    layout = LAYOUTS[node["layout"]] || ARRANGES[node["arranges"]]

    axis =
      case node["orientation"] || node["arranges"]
      when "vertical", "column" then "vertical"
      when "horizontal", "row" then "horizontal"
      end

    [layout, layout == "box-layout" ? axis : nil]
  end
end
