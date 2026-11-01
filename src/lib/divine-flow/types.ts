/** An RGB colour as three 0–255 channels. */
export type RGB = readonly [r: number, g: number, b: number];

/** Every colour the renderer uses. Themes are complete palettes; overrides can be partial. */
export interface DivineFlowPalette {
	/** Wide, low-resolution glow pass under each filament. */
	bloom: RGB;
	/** Soft halo stroked around each filament. */
	glow: RGB;
	/** Thin bright core of each filament. */
	core: RGB;
	/** Travelling highlight pulse along "hero" filaments. */
	shimmer: RGB;
	/** Hot centre of sparkles. */
	sparkle: RGB;
	/** Coloured halo around sparkles. */
	sparkleHalo: RGB;
	/** Edges of the horizontal lens flare on large sparkles. */
	flare: RGB;
	/** Faint dust specks scattered along filaments. */
	speck: RGB;
	/** Inner colour of the glow where filaments originate. */
	originInner: RGB;
	/** Outer colour of the origin glow. */
	originOuter: RGB;
	/** Ambient embers drifting across the whole canvas. */
	ember: RGB;
}

export type DivineFlowThemeName = "gold" | "crimson" | "violet" | "white";

/** Which side(s) of the origin filaments flow towards. */
export type DivineFlowSides = "both" | "left" | "right";

export interface DivineFlowOptions {
	/** Built-in theme name or a complete palette. Default `"gold"`. */
	theme?: DivineFlowThemeName | DivineFlowPalette;
	/** Per-colour overrides applied on top of `theme`. */
	palette?: Partial<DivineFlowPalette>;
	/** Main-band filaments per side. Default `7`. */
	lineCount?: number;
	/** Extra high/low filaments per side. Default `2`. */
	scatterCount?: number;
	/** How far from the origin filaments emerge, in CSS px (capped by canvas width). Default `108`. */
	innerGap?: number;
	/** Horizontal position of the origin, 0–1 of the canvas width. Default `0.5`. */
	originX?: number;
	/**
	 * Which way filaments flow from the origin. `"right"` with `originX: 0` (or `"left"` with
	 * `originX: 1`) turns the burst into a single strand, e.g. an underline. Default `"both"`.
	 */
	sides?: DivineFlowSides;
	/**
	 * Vertical spread of the filaments, as a multiple of the default fan. Small values (0.1–0.3) keep
	 * them in a tight band. Default `1`.
	 */
	spread?: number;
	/**
	 * Wave height multiplier. Waves scale with the canvas height, so short canvases need more. Unlike
	 * `motion`, this does not change the speed. Default `1`.
	 */
	amplitude?: number;
	/** Line thickness multiplier for every filament (core, glow and bloom). Default `1`. */
	thickness?: number;
	/**
	 * Give every filament the same width and brightness (taken from the first), e.g. so the two halves
	 * of a strand drawn out from the middle match. Default `false`.
	 */
	uniform?: boolean;
	/** Fixed opacity (0–1) for every filament, instead of each picking its own. */
	alpha?: number;
	/**
	 * When drawing in, how far apart (as a share of the draw-in) filaments start. `0` starts them all
	 * together, e.g. for a symmetric strand. Default `0.25`.
	 */
	revealStagger?: number;
	/**
	 * Slant every filament by this angle in degrees: positive rises from bottom left to top right,
	 * whichever way the filament flows. Default `0`.
	 */
	tilt?: number;
	/**
	 * How much of each filament is drawn, 0–1, growing outwards from the origin. Start at `0` and
	 * animate it with `setReveal()` to draw the flow in. Default `1`.
	 */
	reveal?: number;
	/** Vertical position of the origin, 0–1 of the canvas height. Default `0.5`. */
	originY?: number;
	/** Animation intensity. `0` renders a still frame. Default `1`. */
	motion?: number;
	/** Seed for the deterministic layout. Same seed, same filaments. Default `8400`. */
	seed?: number;
	/** Sparkles travelling along filaments. Default: `min(10, 4 + filamentCount)`. */
	sparkleCount?: number;
	/** Dust specks along filaments. Default `28`. */
	speckCount?: number;
	/** Ambient embers drifting upwards across the canvas. Default `0` (off). */
	emberCount?: number;
	/** Ember drift speed multiplier. Default `1`. */
	emberSpeed?: number;
	/**
	 * Per-filament colour variation, 0–1. Each filament gets its own stable shade of the theme
	 * (up to ±14° hue and ±14% lightness at `1`). Default `0`.
	 */
	variance?: number;
	/**
	 * Hue range (degrees) a filament's shade is picked from at `variance: 1`, e.g. `[-9, 0]` to only
	 * shift towards one neighbour. Default `[-14, 14]`.
	 */
	hueRange?: readonly [number, number];
	/** Lightness range (−1–1) a filament's shade is picked from at `variance: 1`. Default `[-0.14, 0.14]`. */
	lightRange?: readonly [number, number];
	/** Frame-rate cap. Keeps high-refresh displays from doing 2–3x the work. Default `60`. */
	maxFps?: number;
	/** Device-pixel-ratio cap for the main canvas. Default `2`. */
	maxDpr?: number;
	/** Resolution of the bloom pass relative to the canvas, 0.1–1. Default `0.28`. */
	bloomScale?: number;
	/**
	 * `"auto"` follows `prefers-reduced-motion`; `true` always renders still frames; `false` always animates.
	 * Default `"auto"`.
	 */
	reducedMotion?: "auto" | boolean;
	/** Pause the loop while the canvas is off-screen or the tab is hidden. Default `true`. */
	pauseWhenHidden?: boolean;
	/**
	 * Draw in a web worker on an `OffscreenCanvas`, keeping the main thread free for the rest of the
	 * page. Falls back to the main thread where that isn't supported, or when `canvas` is given.
	 * Default `true`.
	 */
	offscreen?: boolean;
	/** Draw into this canvas instead of creating one inside the container. */
	canvas?: HTMLCanvasElement;
	/** Class name added to the canvas the engine creates. */
	className?: string;
}

/** Options after defaults, clamping and palette resolution. */
export interface ResolvedDivineFlowOptions {
	palette: DivineFlowPalette;
	lineCount: number;
	scatterCount: number;
	innerGap: number;
	originX: number;
	originY: number;
	sides: DivineFlowSides;
	spread: number;
	amplitude: number;
	tilt: number;
	reveal: number;
	thickness: number;
	uniform: boolean;
	alpha: number | null;
	revealStagger: number;
	motion: number;
	seed: number;
	sparkleCount: number | null;
	speckCount: number;
	emberCount: number;
	emberSpeed: number;
	variance: number;
	hueRange: readonly [number, number];
	lightRange: readonly [number, number];
	maxFps: number;
	maxDpr: number;
	bloomScale: number;
	reducedMotion: "auto" | boolean;
	pauseWhenHidden: boolean;
	offscreen: boolean;
}

export interface DivineFlowInstance {
	/** The canvas being drawn into. */
	readonly canvas: HTMLCanvasElement;
	/** Current resolved options. */
	readonly options: Readonly<ResolvedDivineFlowOptions>;
	/** `true` while the animation loop is allowed to run. */
	readonly isRunning: boolean;
	/** `true` when this flow is drawn in a worker (see the `offscreen` option). */
	readonly offscreen: boolean;
	/** Resume the animation loop. */
	start(): void;
	/** Pause the animation loop (the last frame stays on screen). */
	stop(): void;
	/** Merge new options and rebuild the scene. */
	update(options: DivineFlowOptions): void;
	/** Current draw-in progress, 0–1. */
	readonly reveal: number;
	/** Set the draw-in progress (0–1). Cheap enough to call every frame from a tween. */
	setReveal(progress: number): void;
	/** Re-measure the container. Called automatically on resize. */
	resize(): void;
	/** Draw one frame at `timeMs` (defaults to `performance.now()`). */
	renderFrame(timeMs?: number): void;
	/** Stop everything, remove listeners and (if the engine created it) the canvas. */
	destroy(): void;
}
