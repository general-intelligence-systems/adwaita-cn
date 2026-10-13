{
  description = "adwaita-cn — a shadcn registry built to Adwaita's geometry";

  inputs = {
    nixpkgs.url = "nixpkgs";
    utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, utils }:
    (utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        # Shared libraries every ruby-gnome extension links against.
        gtkStack = with pkgs; [
          glib
          gobject-introspection
          cairo
          pango
          gdk-pixbuf
          graphene
          atk
          gtk4
          libadwaita
          harfbuzz
          librsvg
        ]
        # The Ruby `pkg-config` gem resolves `Requires.private` transitively and
        # hard-fails if any .pc in the chain is missing, so gtk4's whole private
        # closure has to be on PKG_CONFIG_PATH, not just its public deps.
        ++ (with pkgs; [
          fontconfig
          freetype
          libepoxy
          libpng
          libxkbcommon
          pcre2
          util-linux
          wayland
          zlib
          fribidi
          libdatrie
          libthai
          libselinux
          libsepol
          expat
          brotli
          bzip2
          graphite2
          icu
          libffi
          libxml2
          lerc
          libdeflate
          xz
          zstd
        ])
        # Un-prefixed names: the `xorg.*` package set is deprecated.
        ++ (with pkgs; [
          libx11
          libxau
          libxcursor
          libxdmcp
          libxext
          libxfixes
          libxi
          libxinerama
          libxrandr
          libxrender
          libxcb
          xorgproto
        ]);

        # ruby-gnome gems build C extensions with extconf.rb + the pkg-config
        # gem; nixpkgs only ships gemConfig entries for the GTK3-era subset, so
        # the GTK4 gems get their build inputs declared here.
        rubyGnomeGem = _attrs: {
          nativeBuildInputs = [ pkgs.pkg-config ];
          buildInputs = gtkStack;
        };

        gemConfig = pkgs.defaultGemConfig // {
          gdk4 = rubyGnomeGem;
          gsk4 = rubyGnomeGem;
          gtk4 = rubyGnomeGem;
          graphene1 = rubyGnomeGem;
          adwaita = rubyGnomeGem;
          rsvg2 = rubyGnomeGem;
        };

        # `makeSearchPath` would take each package's *first* output, and glib's
        # first output is `bin`, which carries no typelibs — hence the explicit
        # `.out`. at-spi2-core is here for the Atk typelib.
        typelibPath = pkgs.lib.makeSearchPath "lib/girepository-1.0"
          (map (drv: drv.out or drv) (gtkStack ++ [ pkgs.at-spi2-core ]));

        gems = pkgs.bundlerEnv {
          name = "adwaita-cn";
          ruby = pkgs.ruby_3_4;
          inherit gemConfig;
          gemfile = ./Gemfile;
          lockfile = ./Gemfile.lock;
          gemset = ./gemset.nix;
        };
      in
      {
        devShells.default = pkgs.mkShell {
          ADWAITA_LIB = pkgs.libadwaita;
          ADWAITA_DEV = pkgs.libadwaita.dev;
          GTK_LIB = pkgs.gtk4;
          GTK_DEV = pkgs.gtk4.dev;
          BROWSER_PATH = "${pkgs.chromium}/bin/chromium";

          buildInputs = with pkgs; [
            gems
            gems.wrappedRuby

            bundler
            bundix
            pkg-config

            nodejs
            pnpm

            chromium

            # bin/14-app-screenshots renders offscreen; Broadway gives GDK a backend
            # with no display server, and the icon theme keeps the shots from
            # coming out with blank icons.
            adwaita-icon-theme
            gsettings-desktop-schemas
            imagemagick
            xvfb-run
          ] ++ gtkStack;

          shellHook = /* bash */ ''
            export BUNDLE_FORCE_RUBY_PLATFORM=false
            export BUNDLE_GEMFILE="$PWD/Gemfile"
            export BUNDLE_FROZEN=false

            # Icons and GSettings schemas resolve through XDG_DATA_DIRS; without
            # these the window opens with blank icons and Adwaita cannot read the
            # colour scheme.
            export XDG_DATA_DIRS="${pkgs.gsettings-desktop-schemas}/share/gsettings-schemas/${pkgs.gsettings-desktop-schemas.name}:${pkgs.gtk4}/share/gsettings-schemas/${pkgs.gtk4.name}:${pkgs.adwaita-icon-theme}/share:$XDG_DATA_DIRS"
            export GI_TYPELIB_PATH="${typelibPath}''${GI_TYPELIB_PATH:+:$GI_TYPELIB_PATH}"
          '';
        };
      }));
}
