{
  description = "Sara's OSINT Resources";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
    treefmt-nix = {
      url = "github:numtide/treefmt-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    inputs@{ flake-parts, self, ... }:
    let
      packageJson = builtins.fromJSON (builtins.readFile ./package.json);
      version = self.lastModifiedDate or "dev";
    in
    flake-parts.lib.mkFlake { inherit inputs; } {
      imports = [
        inputs.treefmt-nix.flakeModule
      ];

      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];

      perSystem =
        {
          config,
          pkgs,
          lib,
          system,
          ...
        }:
        let
          devPackages = with pkgs; [
            bun
            nodejs_22
            git
            config.treefmt.build.wrapper
          ];

          devScript = pkgs.writeShellScriptBin "dev" ''
            if [ ! -d "node_modules" ]; then
              echo "Installing dependencies..."
              ${pkgs.bun}/bin/bun install
            fi
            echo "Starting dev server..."
            exec ${pkgs.bun}/bin/bun run dev
          '';
        in
        {
          treefmt = {
            projectRootFile = "flake.nix";
            flakeCheck = false;
            programs = {
              nixfmt.enable = true;
              prettier = {
                enable = true;
                includes = [
                  "*.js"
                  "*.ts"
                  "*.tsx"
                  "*.json"
                  "*.css"
                  "*.astro"
                  "*.md"
                ];
                excludes = [
                  "node_modules/**"
                  "dist/**"
                  ".astro/**"
                  "bun.lock"
                ];
              };
            };
          };

          formatter = config.treefmt.build.wrapper;

          apps = {
            default = {
              type = "app";
              program = "${devScript}/bin/dev";
              meta.description = "Start Astro development server";
            };
            dev = {
              type = "app";
              program = "${devScript}/bin/dev";
              meta.description = "Start Astro development server";
            };
          };

          devShells.default = pkgs.mkShell {
            packages = devPackages;

            shellHook = ''
              echo "${packageJson.name} v${version}"
              echo "Sara's OSINT Resources"
              echo ""
              echo "Commands:"
              echo "  bun install     - Install dependencies"
              echo "  bun run dev     - Start dev server"
              echo "  bun run build   - Build for production"
              echo "  bun run check   - TypeScript checks"
              echo "  treefmt         - Format all files"
              echo ""
            '';
          };
        };
    };
}
