# dk-portfolio

Personal portfolio of Daniel Khojaste, software developer. Built with [Astro](https://astro.build),
[GSAP](https://gsap.com) and DivineFlow, a canvas light-filament background in
[`src/lib/divine-flow`](src/lib/divine-flow).

## Requirements

- Node.js 22.23.4 or newer (Astro 7 requirement); `.nvmrc` pins the version CI uses (`nvm use`)

## Scripts

| Command                | What it does                                      |
| ---------------------- | ------------------------------------------------- |
| `npm install`          | Install dependencies                              |
| `npm run dev`          | Start the dev server on `http://localhost:4321`   |
| `npm run build`        | Type-check (`astro check`) and build the site     |
| `npm run preview`      | Serve the production build                        |
| `npm run test:unit`    | Run unit tests (Vitest)                           |
| `npm run test:e2e`     | Build + preview the site and run Playwright tests |
| `npm test`             | Unit tests, then end-to-end tests                 |
| `npm run format`       | Format everything with Prettier                   |
| `npm run format:check` | Check formatting (used in CI)                     |

First end-to-end run on a new machine: `npx playwright install chromium`.

## Project layout

```
src/
  assets/       throne photo and DK logo (optimised by Astro at build time)
  components/   Header, Logo, Hero, DivineFlow wrapper
  layouts/      BaseLayout (fonts, meta, global styles)
  pages/        routes
  lib/
    divine-flow/  canvas renderer for the light-filament background + unit tests
  scripts/      client scripts (logo draw, DivineFlow mount, name ghost) + unit tests
  styles/       global tokens and resets
tests/e2e/      Playwright specs
```

See [CHANGELOG.md](CHANGELOG.md) for what changed and when.
