import { clamp } from "./math";
import { resolvePalette } from "./palette";
import type { DivineFlowOptions, ResolvedDivineFlowOptions } from "./types";

export const DEFAULTS = {
	lineCount: 7,
	scatterCount: 2,
	innerGap: 108,
	originX: 0.5,
	originY: 0.5,
	sides: "both",
	spread: 1,
	amplitude: 1,
	tilt: 0,
	reveal: 1,
	motion: 1,
	seed: 8400,
	speckCount: 28,
	emberCount: 0,
	emberSpeed: 1,
	variance: 0,
	hueRange: [-14, 14],
	lightRange: [-0.14, 0.14],
	maxFps: 60,
	maxDpr: 2,
	bloomScale: 0.28,
} as const;

function finite(value: number | undefined, fallback: number): number {
	return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** A `[min, max]` pair of finite numbers within `limit`, sorted; falls back when invalid. */
function range(
	value: readonly [number, number] | undefined,
	fallback: readonly [number, number],
	limit: number,
): readonly [number, number] {
	if (!Array.isArray(value) || value.length !== 2) return fallback;
	const [a, b] = value.map((v) => clamp(finite(v, NaN), -limit, limit));
	if (!Number.isFinite(a) || !Number.isFinite(b)) return fallback;
	return a <= b ? [a!, b!] : [b!, a!];
}

const SIDES = ["both", "left", "right"] as const;

function count(value: number | undefined, fallback: number, max: number): number {
	return Math.round(clamp(finite(value, fallback), 0, max));
}

/** Apply defaults and clamp every option to a range the renderer can handle. */
export function resolveOptions(options: DivineFlowOptions = {}): ResolvedDivineFlowOptions {
	return {
		palette: resolvePalette(options.theme, options.palette),
		lineCount: count(options.lineCount, DEFAULTS.lineCount, 64),
		scatterCount: count(options.scatterCount, DEFAULTS.scatterCount, 32),
		innerGap: clamp(finite(options.innerGap, DEFAULTS.innerGap), 0, 4096),
		originX: clamp(finite(options.originX, DEFAULTS.originX), 0, 1),
		originY: clamp(finite(options.originY, DEFAULTS.originY), 0, 1),
		sides: SIDES.includes(options.sides as never) ? options.sides! : DEFAULTS.sides,
		spread: clamp(finite(options.spread, DEFAULTS.spread), 0, 4),
		amplitude: clamp(finite(options.amplitude, DEFAULTS.amplitude), 0, 40),
		tilt: clamp(finite(options.tilt, DEFAULTS.tilt), -45, 45),
		reveal: clamp(finite(options.reveal, DEFAULTS.reveal), 0, 1),
		motion: clamp(finite(options.motion, DEFAULTS.motion), 0, 10),
		seed: Math.trunc(finite(options.seed, DEFAULTS.seed)),
		sparkleCount: options.sparkleCount === undefined ? null : count(options.sparkleCount, 0, 200),
		speckCount: count(options.speckCount, DEFAULTS.speckCount, 1000),
		emberCount: count(options.emberCount, DEFAULTS.emberCount, 2000),
		emberSpeed: clamp(finite(options.emberSpeed, DEFAULTS.emberSpeed), 0, 20),
		variance: clamp(finite(options.variance, DEFAULTS.variance), 0, 1),
		hueRange: range(options.hueRange, DEFAULTS.hueRange, 180),
		lightRange: range(options.lightRange, DEFAULTS.lightRange, 1),
		maxFps: clamp(finite(options.maxFps, DEFAULTS.maxFps), 1, 240),
		maxDpr: clamp(finite(options.maxDpr, DEFAULTS.maxDpr), 0.5, 4),
		bloomScale: clamp(finite(options.bloomScale, DEFAULTS.bloomScale), 0.1, 1),
		reducedMotion: options.reducedMotion ?? "auto",
		pauseWhenHidden: options.pauseWhenHidden ?? true,
	};
}
