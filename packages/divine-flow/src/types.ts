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

export type DivineFlowThemeName = "gold" | "crimson" | "violet";

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
	motion: number;
	seed: number;
	sparkleCount: number | null;
	speckCount: number;
	emberCount: number;
	emberSpeed: number;
	maxDpr: number;
	bloomScale: number;
	reducedMotion: "auto" | boolean;
	pauseWhenHidden: boolean;
}

export interface DivineFlowInstance {
	/** The canvas being drawn into. */
	readonly canvas: HTMLCanvasElement;
	/** Current resolved options. */
	readonly options: Readonly<ResolvedDivineFlowOptions>;
	/** `true` while the animation loop is allowed to run. */
	readonly isRunning: boolean;
	/** Resume the animation loop. */
	start(): void;
	/** Pause the animation loop (the last frame stays on screen). */
	stop(): void;
	/** Merge new options and rebuild the scene. */
	update(options: DivineFlowOptions): void;
	/** Re-measure the container. Called automatically on resize. */
	resize(): void;
	/** Draw one frame at `timeMs` (defaults to `performance.now()`). */
	renderFrame(timeMs?: number): void;
	/** Stop everything, remove listeners and (if the engine created it) the canvas. */
	destroy(): void;
}
