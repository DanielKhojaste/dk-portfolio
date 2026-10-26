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
- `divine-flow` workspace package: framework-agnostic canvas renderer for the light-filament background,
  with themes, ambient embers, reduced-motion support and unit tests.
- Full-viewport hero (`100svh`, 600px floor on desktop, 640px on compact screens) with the masthead name
  ("DANIEL" solid, "KHOJASTE" as a white outline behind the throne), cropped throne photo, aligned side
  info groups and centred calls to action.
- Crimson DivineFlow background with drifting embers behind the hero, with separate settings for compact
  screens.
- Header with the DK logo, drawn on page load with GSAP DrawSVG (skipped for reduced motion), and a
  hamburger menu button on every screen size.
- SVG favicon from the DK logo.
- Unit tests for the site's client scripts (Vitest) and end-to-end tests for the hero and header.
