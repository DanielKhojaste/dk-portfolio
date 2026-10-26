# dk-portfolio

Personal portfolio of Daniel Khojaste, software developer. Built with [Astro](https://astro.build) and
[GSAP](https://gsap.com).

## Requirements

- Node.js 22.23.4 or newer (Astro 7 requirement)

## Scripts

| Command                | What it does                                      |
| ---------------------- | ------------------------------------------------- |
| `npm install`          | Install dependencies                              |
| `npm run dev`          | Start the dev server on `http://localhost:4321`   |
| `npm run build`        | Type-check (`astro check`) and build the site     |
| `npm run preview`      | Serve the production build                        |
| `npm run test:e2e`     | Build + preview the site and run Playwright tests |
| `npm test`             | Run every test suite                              |
| `npm run format`       | Format everything with Prettier                   |
| `npm run format:check` | Check formatting (used in CI)                     |

First end-to-end run on a new machine: `npx playwright install chromium`.

## Project layout

```
src/
  layouts/      BaseLayout (fonts, meta, global styles)
  pages/        routes
  styles/       global tokens and resets
tests/e2e/      Playwright specs
```

See [CHANGELOG.md](CHANGELOG.md) for what changed and when.
