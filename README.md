# dk-portfolio

Personal portfolio of Daniel Khojaste, software developer. Built with [Astro](https://astro.build),
[GSAP](https://gsap.com) and DivineFlow, a canvas light-filament background that lives in
[`packages/divine-flow`](packages/divine-flow) and will be published to npm.

## Requirements

- Node.js 22.23.4 or newer (Astro 7 requirement)

## Scripts

| Command                | What it does                                                   |
| ---------------------- | -------------------------------------------------------------- |
| `npm install`          | Install dependencies for the site and workspace packages       |
| `npm run dev`          | Build workspace packages, then start the dev server on `:4321` |
| `npm run build`        | Build packages, type-check (`astro check`) and build the site  |
| `npm run preview`      | Serve the production build                                     |
| `npm run test:unit`    | Run unit tests in every workspace package (Vitest)             |
| `npm run test:e2e`     | Build + preview the site and run Playwright tests              |
| `npm test`             | Unit tests, then end-to-end tests                              |
| `npm run format`       | Format everything with Prettier                                |
| `npm run format:check` | Check formatting (used in CI)                                  |

First end-to-end run on a new machine: `npx playwright install chromium`.

## Project layout

```
src/
  layouts/      BaseLayout (fonts, meta, global styles)
  pages/        routes
  styles/       global tokens and resets
packages/
  divine-flow/  framework-agnostic canvas renderer (npm package-to-be)
tests/e2e/      Playwright specs
```

See [CHANGELOG.md](CHANGELOG.md) for what changed and when.
