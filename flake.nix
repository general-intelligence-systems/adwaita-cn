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
      in
      {
        devShells.default = pkgs.mkShell {
          # THE SHELL NAMES THE LIBRARIES RATHER THAN LETTING THE SCRIPTS LOOK. Both fetch
          # scripts used to glob /nix/store, which sorts by hash and so picked whichever path
          # came last -- the stylesheet came out of libadwaita 1.9.0 and the introspection data
          # out of 1.9.3, so the metrics and the props described different releases. The flake
          # knows exactly which it provides, so it says.
          ADWAITA_LIB = pkgs.libadwaita;
          ADWAITA_DEV = pkgs.libadwaita.dev;
          GTK_LIB = pkgs.gtk4;
          GTK_DEV = pkgs.gtk4.dev;

          buildInputs = with pkgs; [
            # bin/adwaita-tailwind needs nothing but stdlib. bin/gtk-schemas needs
            # rexml, which Ruby 3.4 unbundled, so it comes from here rather than
            # from a Gemfile this project otherwise has no use for.
            (ruby.withPackages (ps: [ ps.rexml ]))

            # bin/fetch-adwaita reads the compiled stylesheet back out of these.
            # glib provides gresource(1); the other two carry the sheet inside
            # their GResource bundles, which is the only place the CSS exists as
            # CSS rather than as the SCSS GNOME publishes.
            glib
            gtk4
            libadwaita

            # And bin/fetch-gir reads the introspection data out of their dev
            # outputs, which is where share/gir-1.0 lives.
            gtk4.dev
            libadwaita.dev

            # `shadcn build`, which turns registry.json into public/r/.
            nodejs
            pnpm
          ];
        };
      }));
}
