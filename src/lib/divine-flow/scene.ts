import { TAU, wrap01 } from "./math";
import { mulberry32 } from "./random";

/** One light filament: a noisy cubic Bézier from near the origin out past one edge. */
export interface Thread {
	side: -1 | 1;
	/** Vertical offsets as fractions of the canvas height, relative to the origin. */
	startY: number;
	endY: number;
	/** 0–1 position inside the origin gap where the filament emerges. */
	startInset: number;
	/** How far past the edge the filament reaches (1 = exactly to the edge). */
	reach: number;
	c1t: number;
	c2t: number;
	bow1: number;
	bow2: number;
	amp1: number;
	amp2: number;
	speed: number;
	phase: number;
	seed: number;
	coreWidth: number;
	glowWidth: number;
	alpha: number;
	pulsePhase: number;
	pulseSpeed: number;
	pulseLength: number;
	shimmerSpeed: number;
	hasPulse: boolean;
}

/** A star-like glint that slides along a filament. */
export interface Sparkle {
	thread: number;
	phase: number;
	speed: number;
	size: number;
	flare: boolean;
	tilt: number;
	twinklePhase: number;
	twinkleSpeed: number;
}

/** A faint dust mote hovering beside a filament. */
export interface Speck {
	thread: number;
	u: number;
	nOff: number;
	size: number;
	phase: number;
	drift: number;
}

/** An ambient ember drifting upwards across the whole canvas. Positions are 0–1 fractions. */
export interface Ember {
	x: number;
	y: number;
	size: number;
	/** Horizontal drift in canvas widths per second. */
	vx: number;
	/** Upward rise in canvas heights per second. */
	rise: number;
	alpha: number;
	phase: number;
	twinkleSpeed: number;
}

export interface Scene {
	threads: Thread[];
	sparkles: Sparkle[];
	specks: Speck[];
	embers: Ember[];
}

export interface SceneConfig {
	lineCount: number;
	scatterCount: number;
	seed: number;
	sparkleCount: number | null;
	speckCount: number;
	emberCount: number;
}

/** Filaments for both sides: `lineCount` in the main band plus `scatterCount` high/low strays. */
export function createThreads({
	lineCount,
	scatterCount,
	seed,
}: Pick<SceneConfig, "lineCount" | "scatterCount" | "seed">): Thread[] {
	const threads: Thread[] = [];

	for (const side of [-1, 1] as const) {
		const random = mulberry32(seed + side * 173);

		for (let i = 0; i < lineCount; i += 1) {
			const slot = (i + random() * 0.82) / lineCount;
			const centered = slot * 2 - 1;
			const startY = centered * 0.055 + (random() - 0.5) * 0.05;
			const endY = centered * 0.33 + (random() - 0.5) * 0.26;
			const hero = random() > 0.62;

			threads.push({
				side,
				startY,
				endY,
				startInset: random(),
				reach: 1.08 + random() * 0.12,
				c1t: 0.18 + random() * 0.2,
				c2t: 0.5 + random() * 0.28,
				bow1: centered * 0.05 + (random() - 0.5) * 0.1,
				bow2: (random() - 0.5) * 0.09,
				amp1: 0.004 + random() * 0.009,
				amp2: 0.002 + random() * 0.005,
				speed: 0.14 + random() * 0.24,
				phase: random() * TAU,
				seed: 12 + random() * 220,
				coreWidth: hero ? 0.55 + random() * 0.35 : 0.28 + random() * 0.32,
				glowWidth: hero ? 3.2 + random() * 2.4 : 1.8 + random() * 2.2,
				alpha: hero ? 0.55 + random() * 0.4 : 0.18 + random() * 0.38,
				pulsePhase: random(),
				pulseSpeed: 0.03 + random() * 0.05,
				pulseLength: 0.16 + random() * 0.1,
				shimmerSpeed: 0.2 + random() * 0.32,
				hasPulse: hero,
			});
		}

		for (let s = 0; s < scatterCount; s += 1) {
			const pole = s % 2 === 0 ? 1 : -1;
			const sign = pole * (random() > 0.18 ? 1 : -1);

			threads.push({
				side,
				startY: sign * (0.03 + random() * 0.05),
				endY: sign * (0.48 + random() * 0.18),
				startInset: random(),
				reach: 1.08 + random() * 0.14,
				c1t: 0.2 + random() * 0.22,
				c2t: 0.52 + random() * 0.26,
				bow1: sign * (0.06 + random() * 0.08),
				bow2: (random() - 0.5) * 0.1,
				amp1: 0.005 + random() * 0.01,
				amp2: 0.002 + random() * 0.006,
				speed: 0.14 + random() * 0.24,
				phase: random() * TAU,
				seed: 40 + random() * 200,
				coreWidth: 0.26 + random() * 0.28,
				glowWidth: 1.6 + random() * 2,
				alpha: 0.16 + random() * 0.28,
				pulsePhase: random(),
				pulseSpeed: 0.03 + random() * 0.045,
				pulseLength: 0.05 + random() * 0.07,
				shimmerSpeed: 0.18 + random() * 0.3,
				hasPulse: false,
			});
		}
	}

	return threads;
}

export function createSparkles(threadCount: number, count: number | null, seed: number): Sparkle[] {
	if (threadCount === 0) return [];
	const random = mulberry32(seed + 13701);
	const total = count ?? Math.min(10, 4 + threadCount);
	const sparkles: Sparkle[] = [];

	for (let i = 0; i < total; i += 1) {
		sparkles.push({
			thread: Math.floor(random() * threadCount),
			phase: 0.16 + random() * 0.7,
			speed: random() < 0.4 ? 0.01 + random() * 0.018 : 0.003 + random() * 0.007,
			size: random() < 0.3 ? 1.5 + random() * 1.2 : 0.7 + random() * 0.7,
			flare: random() < 0.28,
			tilt: (random() - 0.5) * 0.55,
			twinklePhase: random() * TAU,
			twinkleSpeed: 1.05 + random() * 1.7,
		});
	}

	return sparkles;
}

export function createSpecks(threadCount: number, count: number, seed: number): Speck[] {
	if (threadCount === 0) return [];
	const random = mulberry32(seed + 69011);
	const specks: Speck[] = [];

	for (let i = 0; i < count; i += 1) {
		specks.push({
			thread: Math.floor(random() * threadCount),
			u: 0.14 + random() * 0.58,
			nOff: (random() - 0.5) * 22,
			size: 0.3 + random() * 0.75,
			phase: random() * TAU,
			drift: 0.1 + random() * 0.2,
		});
	}

	return specks;
}

export function createEmbers(count: number, seed: number): Ember[] {
	const random = mulberry32(seed + 31337);
	const embers: Ember[] = [];

	for (let i = 0; i < count; i += 1) {
		embers.push({
			x: random(),
			y: random(),
			size: 0.5 + random() * 1.5,
			vx: (random() - 0.5) * 0.008,
			rise: 0.004 + random() * 0.018,
			alpha: 0.15 + random() * 0.7,
			phase: random() * TAU,
			twinkleSpeed: 0.6 + random() * 1.2,
		});
	}

	return embers;
}

/** Ember position at `time` seconds, wrapped so embers re-enter at the bottom. Pure, so it is stable. */
export function emberPosition(ember: Ember, time: number): { x: number; y: number } {
	return {
		x: wrap01(ember.x + ember.vx * time),
		y: wrap01(ember.y - ember.rise * time),
	};
}

export function createScene(config: SceneConfig): Scene {
	const threads = createThreads(config);
	return {
		threads,
		sparkles: createSparkles(threads.length, config.sparkleCount, config.seed),
		specks: createSpecks(threads.length, config.speckCount, config.seed),
		embers: createEmbers(config.emberCount, config.seed),
	};
}
