# DivineFlow

Slow, glowing light filaments, travelling sparkles and drifting embers on a `<canvas>`.
Plain TypeScript with no dependencies, part of the site (not a separate package). The site mounts it
through `src/components/DivineFlow.astro` and `src/scripts/divine-flow.ts`.

## Usage

```ts
import { createDivineFlow } from "../lib/divine-flow";

const hero = document.querySelector<HTMLElement>(".hero")!;
const flow = createDivineFlow(hero, {
  theme: "crimson",
  originY: 0.45,
  emberCount: 60,
});

// later, e.g. on route change
flow.destroy();
```

The container should be positioned (`position: relative` or similar). The engine appends an
absolutely positioned, `aria-hidden` canvas that fills it, keeps it sized with a `ResizeObserver`, and
removes it again on `destroy()`.

## Options

| Option            | Default                  | Description                                                          |
| ----------------- | ------------------------ | -------------------------------------------------------------------- |
| `theme`           | `"gold"`                 | `"gold"`, `"crimson"`, `"violet"` or a complete palette object       |
| `palette`         | `{}`                     | Partial palette overrides applied on top of `theme`                  |
| `lineCount`       | `7`                      | Main-band filaments per side                                         |
| `scatterCount`    | `2`                      | Extra high/low filaments per side                                    |
| `innerGap`        | `108`                    | Distance (CSS px) from the origin where filaments emerge             |
| `originX`         | `0.5`                    | Origin x as a fraction of the canvas width                           |
| `originY`         | `0.5`                    | Origin y as a fraction of the canvas height                          |
| `motion`          | `1`                      | Animation intensity; `0` draws a still frame                         |
| `seed`            | `8400`                   | Layout seed; the same seed always gives the same filaments           |
| `sparkleCount`    | `min(10, 4 + filaments)` | Sparkles sliding along filaments                                     |
| `speckCount`      | `28`                     | Dust specks hovering beside filaments                                |
| `emberCount`      | `0`                      | Ambient embers drifting upwards across the canvas                    |
| `emberSpeed`      | `1`                      | Ember drift multiplier                                               |
| `variance`        | `0`                      | Per-filament colour variation, 0–1 (up to ±14° hue / ±14% lightness) |
| `maxFps`          | `60`                     | Frame-rate cap                                                       |
| `maxDpr`          | `2`                      | Device-pixel-ratio cap                                               |
| `bloomScale`      | `0.28`                   | Resolution of the soft-glow pass (0.1–1)                             |
| `reducedMotion`   | `"auto"`                 | `"auto"` follows `prefers-reduced-motion`; `true`/`false` force it   |
| `pauseWhenHidden` | `true`                   | Pause while off-screen or in a background tab                        |
| `canvas`          | —                        | Draw into an existing canvas instead of creating one                 |
| `className`       | —                        | Class for the created canvas                                         |

Out-of-range values are clamped rather than thrown; unknown theme names and invalid colours throw.

## Instance

```ts
interface DivineFlowInstance {
  readonly canvas: HTMLCanvasElement;
  readonly options: ResolvedDivineFlowOptions;
  readonly isRunning: boolean;
  start(): void; // resume the loop
  stop(): void; // pause (last frame stays)
  update(options): void; // merge options and rebuild the scene
  resize(): void; // re-measure (automatic on resize)
  renderFrame(timeMs?): void; // draw a single frame
  destroy(): void; // remove listeners and the created canvas
}
```

## Palettes

Every colour is an `[r, g, b]` tuple:

`bloom`, `glow`, `core`, `shimmer`, `sparkle`, `sparkleHalo`, `flare`, `speck`, `originInner`,
`originOuter`, `ember`.

```ts
import { createDivineFlow, themes } from "../lib/divine-flow";

createDivineFlow(el, { theme: "violet", palette: { core: [255, 255, 255] } });
createDivineFlow(el, { theme: { ...themes.gold, ember: [255, 120, 40] } });
```

## Performance and accessibility

- The glow is drawn on a low-resolution canvas (`bloomScale`). When the engine creates the canvases, the
  bloom is its own element that the browser scales on the GPU, with the filament canvas blended over it
  using `mix-blend-mode: plus-lighter`; otherwise it is upscaled into the main canvas.
- Gradients and sprites are built once per size/palette, not per frame; each filament's path is one
  `Path2D` reused for every pass.
- `maxFps` (default 60) caps work on high-refresh displays.
- The loop pauses when the canvas is off-screen or the tab is hidden.
- With `prefers-reduced-motion: reduce` a single still frame is drawn and no loop runs; switching the
  setting at runtime is picked up.
- Point buffers are allocated once per filament and reused every frame.

## Tests

Unit tests live in `__tests__/` and run with the rest of the site's unit tests (`npm run test:unit`).
