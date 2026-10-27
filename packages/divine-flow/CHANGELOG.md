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
