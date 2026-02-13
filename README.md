# Sara's OSINT Resources

A curated collection of OSINT (Open Source Intelligence) tools, techniques, and resources. Originally ported from a Google Sites mirror of [osint.al](https://www.osint.al).

## Development

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Build for production
bun run build

# Type checking
bun run check

# Lint
bun run lint
```

## Site Structure

- `/tools/` — Web-based OSINT tools (search engines, social media, clearnet, darknet, document forensics)
- `/resources/` — Reading lists, investigative journalism resources, OSINT professionals
- `/challenges/` — OSINT challenge writeups (Gary's challenges, LinkedIn CTF)
- `/blog/` — Blog posts and updates
- `/about/` — About page

## Tech Stack

- **Astro 5** — Static site generator
- **Tailwind CSS 4** — Utility-first CSS (via Vite plugin)
- **TypeScript** — Type safety
- **Bun** — Package manager & runtime

## Deployment

Pushes to `main` trigger GitHub Actions (`.github/workflows/deploy.yml`) which builds and deploys to GitHub Pages.

Live URL: https://urandomio.github.io/sara.osint
