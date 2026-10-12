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
          buildInputs = with pkgs; [
            # bin/adwaita-tailwind is plain Ruby and needs no gems: the one thing
            # it requires is json, which is stdlib.
            ruby

            # bin/fetch-adwaita reads the compiled stylesheet back out of these.
            # glib provides gresource(1); the other two carry the sheet inside
            # their GResource bundles, which is the only place the CSS exists as
            # CSS rather than as the SCSS GNOME publishes.
            glib
            gtk4
            libadwaita

            # `shadcn build`, which turns registry.json into public/r/.
            nodejs
            pnpm
          ];
        };
      }));
}
