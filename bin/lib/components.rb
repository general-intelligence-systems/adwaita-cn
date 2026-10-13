# frozen_string_literal: true

# The component model: what a widget is, as the templates need it stated.
#
# Built from two files and nothing else -- bin/01-fetch-adwaita.out/widgets.json, which is
# what a running GTK said about every widget in Gtk and Adw, and
# bin/03-adwaita-tailwind.out/scss-widgets.json, which is what libadwaita's own stylesheet
# says about every name it addresses. There is no intermediate stage: the slow one that
# used to sit here took 23 minutes to produce a blob this derives in under a second.

require "json"
require "set"

module Components
  # A GType, as the TypeScript a prop is declared with. A widget is a ReactNode because
  # the caller hands over markup; anything else the DOM has no place for -- a GListModel,
  # a GtkAdjustment, a GVariant, a GdkRGBA -- is accepted and not rendered.
  SCALARS = {
    "gchararray" => "string",
    "gboolean" => "boolean",
    "gint" => "number", "guint" => "number", "gint64" => "number", "guint64" => "number",
    "glong" => "number", "gulong" => "number",
    "gdouble" => "number", "gfloat" => "number",
  }.freeze

  # The element a CSS node is, where the DOM has one that means the same thing. Anything
  # not named here is a div, which is what a GTK container is.
  ELEMENTS = {
    "appchooserbutton" => "button", "button" => "button", "checkbutton" => "button",
    "colorbutton" => "button", "fontbutton" => "button", "menubutton" => "button",
    "splitbutton" => "button", "switch" => "button", "tabbutton" => "button",
    "togglebutton" => "button",
    "editablelabel" => "input", "entry" => "input",
    "spinbutton" => "input", "text" => "input",
    "textview" => "textarea",
    "buttoncontent" => "span", "image" => "span", "label" => "span",
    "windowtitle" => "span",
    "shortcut-label" => "kbd",
    "picture" => "img", "video" => "video",
    "separator" => "hr",
    "flowbox" => "ul", "gridview" => "ul", "iconview" => "ul", "list" => "ul",
    "listview" => "ul",
    "flowboxchild" => "li", "listboxrow" => "li",
    "headerbar" => "header", "statusbar" => "footer",
  }.freeze

  # A utility which only moves or sizes a box. A style class whose every utility is one of
  # these changes geometry and nothing else, which is what makes it a size rather than a
  # variant -- `.circular` and `.pill` are the button's two sizes, and `.flat`, `.osd` and
  # `.suggested-action` are three of its variants.
  GEOMETRY = /\A(?:-?(?:min-|max-)?[wh]-|size-|aspect-|p[xytrbles]?-|m[xytrbles]?-|gap-|
                 rounded|border-\d|inset-|top-|left-|right-|bottom-|basis-|grow|shrink)/x

  # A class the widget puts on itself according to what it was given rather than one a
  # caller chooses. `text-button` is what a button with a label is, not a variant of it,
  # and offering it as one put a second spelling of the same thing in the API.
  AUTOMATIC = %w[
    text-button image-button image-text-button arrow-button
    horizontal vertical
  ].to_set

  # The elements the HTML parser closes itself. React refuses to render children into one
  # -- "is a void element tag and must neither have children" -- and a component which
  # wrote `children:` onto its `<input>` anyway threw on mount, which took the whole
  # application down with it: every entry, separator and picture in the registry.
  VOID = %w[area base br col embed hr img input link meta param source track wbr].to_set

  Prop = Struct.new(:name, :gtk, :type, :owner, :gtype, keyword_init: true)
  Variant = Struct.new(:name, :key, :classes, keyword_init: true)

  class Component
    attr_reader :gtk, :node, :element, :props, :variants, :sizes, :tree, :slots, :enums

    def initialize(gtk:, node:, element:, props:, variants:, sizes:, tree:, slots:)
      @gtk = gtk
      @node = node
      @element = element
      @props = props
      @variants = variants
      @sizes = sizes
      @tree = tree
      @slots = slots
      @enums = props.map(&:type).select { |t| t.match?(/\A[A-Z]/) && !t.start_with?("React.") }.uniq.sort
    end

    # Gtk.Button is Button, Adw.ActionRow is ActionRow: the library is not part of a
    # component's name, because a registry holds one of each.
    def name = gtk.sub(/\A(Gtk|Adw)/, "")
    def slug = Components.kebab(name)
    def file = "ui/#{slug}.tsx"
    def library = gtk.start_with?("Adw") ? "Adw" : "Gtk"
    def cva? = !(variants.empty? && sizes.empty?)
    def void? = Components::VOID.include?(element)
  end

  def self.kebab(name)
    name.gsub(/([a-z0-9])([A-Z])/, '\1-\2').gsub(/([A-Z]+)([A-Z][a-z])/, '\1-\2').downcase
  end

  # `icon-name` is `iconName`. A GObject property is kebab and a React prop is camel, and
  # a generated file which forgot this step declared `focus-on-click?: boolean`, which is
  # a subtraction and not an identifier -- 41 syntax errors in one file.
  def self.camel(name) = name.gsub(/-([a-z0-9])/) { ::Regexp.last_match(1).upcase }

  def self.pascal(name) = camel(name).sub(/\A([a-z])/) { ::Regexp.last_match(1).upcase }


  # The namespaces an enumeration can come from, in the order that decides who keeps the
  # bare name when two claim it. GTK and Pango both declare a `WrapMode`, a GtkTextView's
  # `wrap-mode` is GTK's and a GtkLabel's is Pango's, and writing both as `WrapMode` gave
  # one of them the other's values.
  NAMESPACES = %w[Adw Gtk Gdk Pango Gsk Gio GObject GLib GdkPixbuf Graphene].freeze

  # Every enumeration any property is declared with, against the TypeScript name it is
  # written under and the values it takes.
  def self.enumerations(widgets)
    seen = {}

    widgets.each do |widget|
      widget.fetch("properties").each do |prop|
        next unless prop["enum"]

        seen[prop.fetch("enum")] ||= prop.fetch("values")
      end
    end

    claimed = {}

    NAMESPACES.each do |namespace|
      seen.each_key do |qualified|
        next unless qualified.start_with?(namespace)

        claimed[qualified.delete_prefix(namespace)] ||= qualified
      end
    end

    seen.to_h do |qualified, values|
      namespace = NAMESPACES.find { |n| qualified.start_with?(n) }
      bare = namespace ? qualified.delete_prefix(namespace) : qualified
      name = claimed[bare] == qualified ? bare : qualified

      [qualified, { name: name, values: values }]
    end
  end

  # Every widget the two libraries have, as a component each.
  #
  # The abstract ones are skipped: GtkWidget and GtkListBase were never built, so they
  # carry properties and no tree, and a component with no node to render is not one.
  def self.load(root)
    widgets = JSON.parse(File.read(File.join(root, "bin/01-fetch-adwaita.out/widgets.json")))
                  .fetch("widgets")
    styles = style_classes(root)
    enums = enumerations(widgets)
    ENUMS.merge!(enums)
    shared = widgets.find { |w| w.fetch("class") == "GtkWidget" }.fetch("properties")
    inherited = shared.select { |p| writable?(p) }.map { |p| p.fetch("name") }.to_set

    # Which GTypes are widgets has to be known before any property is typed, because
    # that is what tells a GtkWidget-valued prop (markup the caller hands over) from a
    # GtkAdjustment-valued one (a value the DOM has no place for).
    WIDGETS.merge(widgets.map { |w| w.fetch("class") })

    built = widgets.reject { |w| w["abstract"] }

    components = consolidated(built.map { |widget| build(widget, styles, inherited) })

    {
      components: components.sort_by(&:name),
      shared: props_for(shared, Set.new),
      enums: enums.values.sort_by { |e| e[:name] },
    }
  end


  # One component per name. GTK and libadwaita both declare a Window, a Dialog, a
  # HeaderBar and five others, and libadwaita's is the one this registry is of -- an
  # AdwWindow IS a GtkWindow with Adwaita's chrome, so emitting both put two spellings
  # of the same component in the registry and left the caller to guess.
  def self.consolidated(components)
    components.group_by(&:name).map do |_, same|
      same.find { |c| c.library == "Adw" } || same.first
    end
  end

  def self.build(widget, styles, inherited)
    tree = widget.fetch("given")
    node = tree.fetch("node")
    offered = (styles[node] || {}).reject { |name, _| AUTOMATIC.include?(name) }

    Component.new(
      gtk: widget.fetch("class"),
      node: node,
      element: ELEMENTS.fetch(node, "div"),
      props: props_for(widget.fetch("properties"), inherited),
      variants: offered.reject { |_, classes| geometry_only?(classes) }
                       .map { |name, classes| Variant.new(name: camel(name), key: name, classes: classes) },
      sizes: offered.select { |_, classes| geometry_only?(classes) }
                    .map { |name, classes| Variant.new(name: camel(name), key: name, classes: classes) },
      tree: tree,
      slots: widget.fetch("slots", {}),
    )
  end

  def self.geometry_only?(classes) = classes.all? { |c| c.match?(GEOMETRY) }

  # A property which cannot be written is not a prop, and one every widget already has is
  # declared once on WidgetProps rather than 164 times.
  def self.writable?(prop) = prop.fetch("writable") && !prop.fetch("constructOnly")

  def self.props_for(properties, inherited)
    properties
      .select { |p| writable?(p) }
      .reject { |p| inherited.include?(p.fetch("name")) }
      .map do |p|
        Prop.new(
          name: camel(p.fetch("name")),
          gtk: p.fetch("name"),
          type: type_for(p),
          owner: p.fetch("owner"),
          gtype: p.fetch("type"),
        )
      end
  end

  def self.type_for(prop)
    gtype = prop.fetch("type")

    return ENUMS.fetch(prop.fetch("enum")).fetch(:name) if prop["enum"]
    return SCALARS[gtype] if SCALARS.key?(gtype)
    # A widget is markup the caller hands over. Anything else -- a GListModel, a
    # GtkAdjustment, a GtkExpression -- is a value the DOM has no place for.
    return "React.ReactNode" if WIDGETS.include?(gtype)

    "unknown"
  end

  # Which GTypes are widgets, so that a GtkWidget-valued property is markup and a
  # GtkAdjustment-valued one is not. Filled by `load`, because the answer is the file.
  WIDGETS = Set.new

  # Every enumeration, against its TypeScript name. Filled by `load`, because which
  # namespace keeps a bare name depends on which other namespaces turned up.
  ENUMS = {}

  # Every `node.class` the stylesheet states a rule for, against the Tailwind it resolves
  # to. A selector with a descendant, a state or a filter in it is not a style class a
  # caller can ask for, so only the two-part ones are read.
  def self.style_classes(root)
    found = Hash.new { |h, k| h[k] = {} }

    JSON.parse(File.read(File.join(root, "bin/03-adwaita-tailwind.out/scss-widgets.json")))
        .each_value do |rules|
      rules.each do |rule|
        match = /\A([a-z][a-z0-9-]*)\.([a-z][a-z0-9-]*)\z/.match(rule.fetch("selector"))
        next if match.nil?

        found[match[1]][match[2]] = rule.fetch("classes")
      end
    end

    found
  end
end
