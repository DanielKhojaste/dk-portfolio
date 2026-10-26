# Changelog

All notable changes to `divine-flow` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this package adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Framework-agnostic `createDivineFlow(container, options)` ported from the ApotheonAI React component.
- Built-in `gold`, `crimson` and `violet` palettes plus partial palette overrides.
- Ambient embers layer (`emberCount`, `emberSpeed`).
- `originX`, `seed`, `sparkleCount`, `speckCount`, `maxDpr`, `bloomScale`, `reducedMotion` and
  `pauseWhenHidden` options.
- Instance API: `start`, `stop`, `update`, `resize`, `renderFrame`, `destroy`.
- `variance` option: each filament gets its own stable shade of the theme colour.
- `maxFps` option (default 60) so high-refresh displays don't do 2–3x the work.
- Performance: per-filament gradients and sparkle/particle sprites are built once per size/palette,
  each filament's polyline is a single reused `Path2D`, and when the engine owns the canvas the bloom is a
  separate canvas scaled by the browser and blended with `mix-blend-mode: plus-lighter` instead of being
  upscaled into the main canvas every frame.
