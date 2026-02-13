# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sara's OSINT Resources — a static site cataloguing OSINT (Open Source Intelligence) tools, techniques, and resources. Originally ported from a Google Sites mirror of osint.al. Deployed to GitHub Pages at `https://urandomio.github.io/sara.osint`.

## Commands

```bash
bun install          # Install dependencies
bun run dev          # Start Astro dev server (localhost:4321)
bun run build        # Type-check then build (astro check && astro build)
bun run check        # TypeScript type-checking only
bun run lint         # ESLint
bun run preview      # Preview production build locally
treefmt              # Format all files (requires Nix devShell)
npx prettier --write "src/**/*.astro"  # Format outside Nix
```

## Architecture

**Stack:** Astro 5 static site, Tailwind CSS 4 (via `@tailwindcss/vite` plugin), TypeScript, Bun package manager.

**Layout:** `src/layouts/BaseLayout.astro` — Single shared layout used by all pages. Includes:
- Sticky header with dropdown nav (Tools, Resources sections) and mobile dialog menu
- Background effect layers (gradient blob, grid SVG, radial gradient, noise SVG)
- Footer with copyright and links

**Components:** `src/components/`
- `PageHeader.astro` — Gradient heading used on all section pages
- `Breadcrumb.astro` — Navigation breadcrumbs
- `ToolSection.astro` — Reusable card for tool category pages (accepts title, description, links array)
- `BlogCard.astro` — Card component for blog post listings

**Pages:** `src/pages/` — 21 `.astro` files organized as:
- `/tools/` (5 pages) — clearnet, darknet, document-forensics, search-engines, social-media
- `/resources/` (5 pages) — fact-checking, journalism, mental-health, osint4good, professionals
- `/challenges/` (3 pages) — index, garys-challenge-5, linkedin-challenge
- `/blog/` (4 pages) — index + 3 posts. Blog index has a hardcoded `posts` array — new posts must be added there manually.
- Root pages — index, about, all-pages, Welcome (redirect alias)

**Styles:** `src/styles/global.css` — Tailwind v4 import + custom utilities (`gradient-text`, `surface`, `surface-card`, `focus-ring`, `link-accent`) and prose component styles.

**Static assets:**
- `public/assets/` — SVG backgrounds (grid, noise, radar)
- `public/images/challenges/` — Locally-hosted WebP images for challenge writeups

## Key Conventions

**Routing:** All internal links must be prefixed with `/sara.osint` (the `base` path in `astro.config.mjs`). This is critical — bare paths like `/tools` won't work on GitHub Pages.

**External links:** Must have `target="_blank" rel="noopener noreferrer"`.

**Page patterns:**
- **Tool/resource pages** use the `ToolSection` component with structured link arrays.
- **Challenge writeups** are hand-authored with inline `<img>` tags pointing to local `/sara.osint/images/challenges/*.webp` files.
- **Blog posts** are hand-authored Astro components with inline Tailwind markup.

## Deployment

Pushes to `main` trigger GitHub Actions (`.github/workflows/deploy.yml`) which runs `bun install && bun run build` and deploys `dist/` to GitHub Pages.

## Nix

A `flake.nix` provides a dev shell with bun, node 22, and treefmt (prettier + nixfmt). Enter with `nix develop`.
