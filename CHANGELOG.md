# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Astro 7 project with strict TypeScript, Prettier and EditorConfig.
- Base layout with self-hosted Archivo (variable width) and Inter fonts, dark design tokens and
  reduced-motion defaults.
- Playwright end-to-end setup (desktop and mobile projects) with a smoke test.
- GitHub Actions CI: format check, type check, unit tests, build and end-to-end tests.
- DivineFlow (`src/lib/divine-flow`): framework-agnostic canvas renderer for the light-filament background,
  with themes (gold, crimson, violet, white), per-filament colour variance within configurable hue and
  lightness ranges, one-sided strands (`sides`), fan `spread` and wave `amplitude` controls, ambient embers, a frame-rate cap, reduced-motion support and
  unit tests. Gradients and sprites are cached and the bloom is a separate GPU-scaled layer, so frames
  are cheap.
- Full-viewport hero (`100svh`, 600px floor on desktop, 480px on compact screens) with the masthead name
  ("DANIEL" in white, "KHOJASTE" as a deep red shape behind the throne so the photo leads), the throne
  photo at 90% of the hero height and centred calls to action.
- Two hero claims on either side of the throne: "Software Developer" (based in Canada, open to
  relocating) and the current project (Lineup, linked), in a silver-to-red metal finish. Each is
  underlined by a strand of white DivineFlow that flows at the same pace as the background.
- Tablet and mobile share the desktop composition (large throne, info and buttons over a bottom scrim),
  and the whole hero fits on portrait phones without scrolling.
- Real copy from `src/data/site.ts`: based in Canada and open to relocating, coaching soccer, and Lineup
  (linked) as the current project.
- Full-screen menu with numbered section links and quick facts; Esc and link clicks close it, the rest of
  the page is inert while it is open, and DivineFlow pauses behind it.
- Crimson DivineFlow background in varying shades of deep red (never drifting towards orange) with
  drifting embers behind the hero, with separate settings for compact screens.
- Header with the DK logo, written stroke by stroke on page load like handwriting (GSAP DrawSVG; skipped
  for reduced motion), and a hamburger menu button on every screen size. The K's stem writes as a clean
  italic I before its arm and leg.
- DivineFlow starts once the logo is written and fades in, its bloom layer composites without a blend mode
  and the hero caps its pixel density at 1.5, so the intro animations and hovers stay smooth. The fonts are
  preloaded.
- Placeholder Work, Skills, About and Contact sections (lorem ipsum) and a footer, so the page scrolls
  and the hero links have targets.
- SVG favicon from the DK logo.
- Unit tests for the site's client scripts (Vitest) and end-to-end tests for the hero, header and menu.
