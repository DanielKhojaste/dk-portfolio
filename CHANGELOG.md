# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- README titled "Daniel's Portfolio", showing the desktop home page with a button to a screenshot gallery
  (`SCREENSHOTS.md`: home and menu on desktop, tablet and phone), and a DivineFlow section (soon its
  own npm package; copyright Daniel Khojaste).
- About section, right under the hero and one screen tall: a short headline ("I build web apps that
  are fast, look sharp and hold up."), one line of text and three facts (based in, focus, building).
  The text under the headline is there from the start. When it comes into view the headline lights
  up word by word, the red words are wiped in from the left (GSAP, a clip-path over a solid copy, so
  every letter fills completely), 0.9s each with a 0.2s pause between them
  (`animation.about.highlight`, `highlightGap`), and then the facts slide in. Copy lives in
  `site.config.ts`; `[brackets]` mark the red words.
- Side nav on desktop, in place of the menu button: the sections down the left in outlined caps.
  Hovering one lights it up white with a glow in the main colour, slides it right a little and turns
  its marker white (`animation.textHover`, `colors.textHover`, `animation.sideNav.nudge`). The
  current section is filled white with a glowing marker and a DivineFlow underline with its own,
  flatter settings (`sideNavUnderlineFlow`). Moving to another section, the old label empties and
  the new one fills at the underline's pace (`animation.sideNav.labelIn` / `labelOut`). Hidden on
  the hero; phones and tablets keep the menu button.
- Smooth scrolling (GSAP ScrollSmoother, `animation.scroll`): the page glides to a stop, and section
  links glide to their section. Off for reduced motion and, by default, on touch screens.
- A fixed dark red glow behind the sections after the hero (`colors.sectionGlow`).
- The Lineup link in About nudges its arrow up and right on hover, like the hero's Lineup link.
- Hovering the DK logo makes it glow in the main colour and grow a touch (`colors.logoHover`,
  `animation.logoHover`).
- Settings for all of the above in `site.config.ts` (timings, side nav marker, underline settings per
  device).
- One main colour (`brand` in `site.config.ts`) that every colour is worked out from
  (`scripts/brand.ts`): buttons, highlights, glows, the hero's last name, the section glow, the
  logo hover, every DivineFlow palette, and a faint tint in the background and text. Each shade
  turns and saturates with the main colour but keeps its designed lightness. In CSS they're
  `--shade-*` variables. The hero photo is regraded to match with a CSS filter (none for the
  original red).
- Shared timings (`motion` in `site.config.ts`: quick, hover, draw, glide, plus matching CSS and
  GSAP eases), which the hovers, fills, underlines and smooth scrolling now use. In CSS:
  `--motion-*`, `--ease-out` and `--ease-in-out`.
- Text link hover (`.text-link`): the same glow as the side nav's labels, at the same pace, without
  the movement, for links in running text.
- Scroll prompt at the bottom of the hero ("Scroll to see more", `hero.scrollHint`): fades in after
  4 seconds on the hero (`animation.scrollHint.delay`), one line of small caps near the bottom edge
  with a small downward chevron under it that bobs gently.
  It brightens on hover (no glow, so it keeps its weight), hides once you scroll and takes you to
  About when clicked.

### Changed

- The hero's "View my work" and "Get in touch" buttons are gone; the scroll prompt takes their place.
- Menu underline settings: no tail sway, faster glide (`travelSpeed` 6) and 30 sparkles.
- Sections run Intro, About, Work, Skills, Contact; every section is at least one screen tall and
  section headings no longer have numbers.
- The temporary Work section is shorter so it fits on one desktop screen.
- The side nav fill and About's red-word wipe start on the first letter: the wipe no longer crosses
  empty space first, and hover fills use an ease that starts at full speed.

## [0.1.0-alpha.1] - 2026-10-31

### Added

- Astro 7 project with strict TypeScript, Prettier and EditorConfig.
- Base layout with self-hosted Archivo (variable width) and Inter fonts, dark design tokens and
  reduced-motion defaults.
- Playwright end-to-end setup (desktop and mobile projects) with a smoke test.
- GitHub Actions CI: format check, type check, unit tests, build and end-to-end tests.
- DivineFlow (`src/lib/divine-flow`): framework-agnostic canvas renderer for the light-filament background,
  with themes (gold, crimson, violet, white), per-filament colour variance within configurable hue and
  lightness ranges, one-sided strands (`sides`), fan `spread`, wave `amplitude`, a `tilt` angle,
  `wave`, `tailSway`, `thickness`, `uniform`/`alpha` strands, a draw-in `reveal` with `revealStagger`, ambient embers, a
  frame-rate cap, reduced-motion support and unit tests. Light pulses and sparkles glide smoothly
  (pulses are one gradient stroke ending exactly at their position, not snapped to samples) and fade in
  and out instead of popping; their speed is adjustable (`travelSpeed`). Gradients and sprites are cached and the bloom
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
  link draws a single strand of the background's DivineFlow with a gentle "~" wave, from the centre,
  the left or the right (set in `site.config.ts`), fading out at both ends. It eases in and out, its
  tail ends sway slowly up and down while it stays one smooth curve, and its sparkle and light pulse
  glide along it. Every link draws the same strand, in its own configurable colour (`colors.menuUnderline`,
  the background's red by default). Esc, a section link or a click anywhere else closes it; the rest of the page is
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

[Unreleased]: https://github.com/DanielKhojaste/dk-portfolio/compare/v0.1.0-alpha.1...dev
[0.1.0-alpha.1]: https://github.com/DanielKhojaste/dk-portfolio/releases/tag/v0.1.0-alpha.1
