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
  lightness ranges, one-sided strands (`sides`), fan `spread`, wave `amplitude`, a `tilt` angle,
  `thickness`, `uniform`/`alpha` strands, a draw-in `reveal` with `revealStagger`, ambient embers, a
  frame-rate cap, reduced-motion support and unit tests. Gradients and sprites are cached and the bloom
  is a separate GPU-scaled layer, so frames are cheap.
- Full-viewport hero (`100svh`, 600px floor on desktop, 480px on compact screens) with the masthead name
  ("DANIEL" in white, "KHOJASTE" as a deep red shape behind the throne so the photo leads), the throne
  photo at 90% of the hero height and centred calls to action.
- Two hero claims on either side of the throne, low in the hero: "Software Developer" (based in Canada)
  and the current project (Lineup, linked), in white expanded caps with a red glow. Their labels and
  the first lines of their headlines always line up.
- DivineFlow draws in on load, at the same time as the logo: filaments grow out from the origin towards
  the sides (GSAP-driven, skipped for reduced motion), with a bright tip leading each one.
- Tablet and mobile share the desktop composition (large throne, info and buttons over a bottom scrim),
  and the whole hero fits on portrait phones without scrolling.
- `src/site.config.ts`: one file for everything tweakable: the copy, every animation timing (logo,
  DivineFlow draw-in, menu, hovers), the DivineFlow colours and options, and the menu underline.
- Real copy: based in Canada, and Lineup (linked) as the current project.
- Full-screen menu with the section links centred over a blurred page. Hovering, focusing or pressing a
  link draws a single strand of the background's DivineFlow out from the middle of the word, fading
  out at both ends. Esc, a section link or a click anywhere else closes it; the rest of the page is
  inert while it is open, and DivineFlow pauses behind it.
- The header (logo and menu button) stays fixed at the top while scrolling.
- Crimson DivineFlow background in varying shades of deep red (never drifting towards orange) with
  drifting embers behind the hero, with separate settings for compact screens.
- Header with the DK logo, written stroke by stroke on page load like handwriting (GSAP DrawSVG; skipped
  for reduced motion), and a hamburger menu button on every screen size. The K's stem writes as a clean
  italic I before its arm and leg.
- DivineFlow draws in a web worker on `OffscreenCanvas`es (one worker shared by every flow on the page),
  so the main thread only handles layout and input: in testing, the page's main thread went from ~79%
  busy to ~3% while the hero animates, and stayed at 60fps on a 4x-throttled CPU (24fps before).
  Browsers without `OffscreenCanvas` draw on the main thread as before.
- Smooth intro: the DivineFlow bloom layer composites without a blend mode and the hero caps its pixel
  density at 1.5, so the logo, the draw-in and hovers stay smooth together. The fonts and the hero
  photo are preloaded.
- Placeholder Work, Skills, About and Contact sections (lorem ipsum) and a footer, so the page scrolls
  and the hero links have targets.
- SVG favicon from the DK logo.
- Unit tests for the site's client scripts (Vitest) and end-to-end tests for the hero, header and menu.
