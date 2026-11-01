# Daniel's Portfolio

Personal portfolio of Daniel Khojaste, software developer. Built with [Astro](https://astro.build),
[GSAP](https://gsap.com) and DivineFlow, a canvas light-filament background in
[`src/lib/divine-flow`](src/lib/divine-flow).

![Home page on desktop: Daniel on a throne of golf clubs, with red DivineFlow light filaments behind](screenshots/home-desktop.png)

<p align="center">
  <a href="screenshots/README.md"><img src="https://img.shields.io/badge/View_all_screenshots-C8202B?style=for-the-badge" alt="View all screenshots" /></a>
</p>

## DivineFlow

DivineFlow draws the hero's light filaments and the menu's underline. It lives in this repo for now, and
it will soon be published as its own npm package.

Copyright © 2026 Daniel Khojaste. All rights reserved. 😎

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
  site.config.ts  the one file to edit: copy, animation timings, DivineFlow colours and options
  assets/       throne photo and DK logo (optimised by Astro at build time)
  components/   Header, Menu, Logo, Hero, DivineFlow wrapper
  layouts/      BaseLayout (fonts, meta, global styles)
  pages/        routes
  lib/
    divine-flow/  canvas renderer for the light-filament background + unit tests
  scripts/      client scripts (logo draw, DivineFlow mount, menu) + unit tests
  styles/       global tokens and resets
tests/e2e/      Playwright specs
screenshots/    screenshots shown in the README, with a gallery (screenshots/README.md)
```

See [CHANGELOG.md](CHANGELOG.md) for what changed and when.
