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

        gems = pkgs.bundlerEnv {
          name = "adwaita-cn";
          ruby = pkgs.ruby_3_4;
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

            glib
            gtk4
            libadwaita

            gtk4.dev
            libadwaita.dev

            nodejs
            pnpm

            chromium
          ];

          shellHook = /* bash */ ''
            export BUNDLE_FORCE_RUBY_PLATFORM=false
            export BUNDLE_GEMFILE="$PWD/Gemfile"
            export BUNDLE_FROZEN=false
          '';
        };
      }));
}
