import { TAU, normalAt, pointAt, type Point } from "./math.js";
import { rgba, shade } from "./palette.js";
import { mulberry32 } from "./random.js";
import { emberPosition, type Scene, type Sparkle, type Thread } from "./scene.js";
import { sampleThread, writePoint, type FlowLayout } from "./geometry.js";
import type { DivineFlowPalette, RGB } from "./types.js";

type Ctx = CanvasRenderingContext2D;
type CanvasFactory = (width: number, height: number) => HTMLCanvasElement;

/** Per-filament resources that only change when the canvas size, palette or scene changes. */
interface ThreadCache {
	bloom: CanvasGradient;
	glow: CanvasGradient;
	core: CanvasGradient;
	shimmer: string;
}

interface Sprite {
	canvas: HTMLCanvasElement;
	/** Half the sprite's size in CSS px; the sprite is drawn centred on its point. */
	extent: number;
}

export interface RenderCache {
	threads: ThreadCache[];
	origin: CanvasGradient;
	sparkles: Sprite[];
	speck: Sprite;
	ember: Sprite;
	emberHalo: Sprite;
}

export interface FrameState {
	ctx: Ctx;
	bloomCtx: Ctx;
	scene: Scene;
	/** One reusable point buffer per thread. */
	buffers: Point[][];
	samples: number;
	layout: FlowLayout;
	palette: DivineFlowPalette;
	emberSpeed: number;
	/** Draw the bloom into the main canvas (false when the bloom is its own, CSS-scaled canvas). */
	composeBloom: boolean;
	cache: RenderCache;
}

/** Fades in near the origin, peaks around 40%, and dissolves before the edge. */
export function makeTrailGradient(
	ctx: Ctx,
	from: Point,
	to: Point,
	color: RGB,
	alpha: number,
): CanvasGradient {
	const grad = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
	grad.addColorStop(0, rgba(color, 0));
	grad.addColorStop(0.1, rgba(color, alpha * 0.8));
	grad.addColorStop(0.42, rgba(color, alpha));
	grad.addColorStop(0.66, rgba(color, alpha * 0.42));
	grad.addColorStop(0.83, rgba(color, alpha * 0.1));
	grad.addColorStop(1, rgba(color, 0));
	return grad;
}

/** Deterministic hue/lightness offset for a filament, scaled by `variance` (0–1). */
export function threadShade(thread: Thread, variance: number): { hue: number; light: number } {
	if (variance <= 0) return { hue: 0, light: 0 };
	const random = mulberry32(Math.floor(thread.seed * 1000) ^ (thread.side === 1 ? 0x9e37 : 0));
	return {
		hue: (random() * 2 - 1) * 14 * variance,
		light: (random() * 2 - 1) * 0.14 * variance,
	};
}

function makeSprite(
	create: CanvasFactory,
	extent: number,
	dpr: number,
	paint: (ctx: Ctx) => void,
): Sprite {
	const px = Math.max(2, Math.ceil(extent * 2 * dpr));
	const canvas = create(px, px);
	const ctx = canvas.getContext("2d");
	if (ctx) {
		ctx.setTransform(px / (extent * 2), 0, 0, px / (extent * 2), px / 2, px / 2);
		paint(ctx);
	}
	return { canvas, extent };
}

function paintSparkle(ctx: Ctx, sparkle: Sparkle, palette: DivineFlowPalette) {
	const { size, flare } = sparkle;
	const radius = size * (flare ? 6.2 : 3.1);
	const disc = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
	disc.addColorStop(0, rgba(palette.sparkle, 0.9));
	disc.addColorStop(0.22, rgba(palette.sparkleHalo, 0.28));
	disc.addColorStop(1, "rgba(0, 0, 0, 0)");
	ctx.fillStyle = disc;
	ctx.beginPath();
	ctx.arc(0, 0, radius, 0, TAU);
	ctx.fill();

	if (flare) {
		const hx = size * 13;
		const hy = size * 0.14;
		const hg = ctx.createLinearGradient(-hx, 0, hx, 0);
		hg.addColorStop(0, rgba(palette.flare, 0));
		hg.addColorStop(0.5, rgba(palette.sparkle, 0.82));
		hg.addColorStop(1, rgba(palette.flare, 0));
		ctx.fillStyle = hg;
		ctx.beginPath();
		ctx.moveTo(-hx, 0);
		ctx.lineTo(0, -hy);
		ctx.lineTo(hx, 0);
		ctx.lineTo(0, hy);
		ctx.closePath();
		ctx.fill();
	} else {
		ctx.fillStyle = rgba(palette.sparkle, 0.65);
		const arm = size * 2.1;
		ctx.fillRect(-arm, -0.3, arm * 2, 0.6);
		ctx.fillRect(-0.3, -arm * 0.65, 0.6, arm * 1.3);
	}

	ctx.fillStyle = rgba(palette.sparkle, 1);
	ctx.beginPath();
	ctx.arc(0, 0, Math.max(0.4, size * 0.24), 0, TAU);
	ctx.fill();
}

function sparkleExtent(sparkle: Sparkle): number {
	return sparkle.flare ? sparkle.size * 13 : Math.max(sparkle.size * 3.1, sparkle.size * 2.1);
}

/**
 * Build everything that does not change from frame to frame. Filament endpoints never move (the noise
 * envelope is zero at both ends), so their gradients can be created once per size/palette.
 */
export function buildRenderCache(
	state: Omit<FrameState, "cache">,
	options: { variance: number; dpr: number; createCanvas: CanvasFactory },
): RenderCache {
	const { ctx, bloomCtx, scene, layout, palette } = state;
	const start: Point = { x: 0, y: 0 };
	const end: Point = { x: 0, y: 0 };
	const rest: FlowLayout = { ...layout, still: true };

	const threads = scene.threads.map((thread) => {
		writePoint(thread, 0, 0, rest, start);
		writePoint(thread, 1, 0, rest, end);
		const { hue, light } = threadShade(thread, options.variance);
		const tint = (color: RGB) => (hue || light ? shade(color, hue, light) : color);
		return {
			bloom: makeTrailGradient(bloomCtx, start, end, tint(palette.bloom), thread.alpha * 0.5),
			glow: makeTrailGradient(ctx, start, end, tint(palette.glow), thread.alpha * 0.22),
			core: makeTrailGradient(ctx, start, end, tint(palette.core), thread.alpha * 0.78),
			shimmer: rgba(tint(palette.shimmer), 1),
		};
	});

	const { dpr, createCanvas } = options;
	const dot = (color: RGB) => (c: Ctx) => {
		c.fillStyle = rgba(color, 1);
		c.beginPath();
		c.arc(0, 0, 1, 0, TAU);
		c.fill();
	};

	const r = Math.min(layout.width, layout.height) * 0.2;
	const origin = bloomCtx.createRadialGradient(0, 0, r * 0.12, 0, 0, r);
	origin.addColorStop(0, rgba(palette.originInner, 0.12));
	origin.addColorStop(0.34, rgba(palette.originOuter, 0.05));
	origin.addColorStop(1, "rgba(0, 0, 0, 0)");

	return {
		threads,
		origin,
		sparkles: scene.sparkles.map((sparkle) =>
			makeSprite(createCanvas, sparkleExtent(sparkle), dpr, (c) =>
				paintSparkle(c, sparkle, palette),
			),
		),
		// Unit-radius dots, scaled per particle when drawn. Rendered at 8x so scaling up stays crisp.
		speck: makeSprite(createCanvas, 1, dpr * 8, dot(palette.speck)),
		ember: makeSprite(createCanvas, 1, dpr * 8, dot(palette.ember)),
		emberHalo: makeSprite(createCanvas, 4, dpr * 4, (c) => {
			c.fillStyle = rgba(palette.ember, 0.15);
			c.beginPath();
			c.arc(0, 0, 4, 0, TAU);
			c.fill();
		}),
	};
}

function polyline(points: readonly Point[], from: number, to: number): Path2D {
	const path = new Path2D();
	path.moveTo(points[from]!.x, points[from]!.y);
	for (let i = from + 1; i <= to; i += 1) path.lineTo(points[i]!.x, points[i]!.y);
	return path;
}

function strokeShimmer(
	ctx: Ctx,
	points: readonly Point[],
	samples: number,
	headU: number,
	length: number,
	width: number,
	alpha: number,
	color: string,
): void {
	const uStart = Math.max(0.1, headU - length);
	const uEnd = Math.min(0.76, headU);
	const span = uEnd - uStart;
	if (span < 0.03) return;

	ctx.strokeStyle = color;
	ctx.lineWidth = width;
	const chunks = 8;
	for (let c = 0; c < chunks; c += 1) {
		const t0 = c / chunks;
		const t1 = (c + 1) / chunks;
		const envelope = Math.sin(Math.PI * ((t0 + t1) * 0.5));
		const a = alpha * envelope * envelope;
		if (a < 0.02) continue;
		const i0 = Math.max(0, Math.floor((uStart + span * t0) * samples));
		const i1 = Math.min(samples, Math.ceil((uStart + span * t1) * samples));
		if (i1 <= i0) continue;
		ctx.globalAlpha = a;
		ctx.stroke(polyline(points, i0, i1));
	}
	ctx.globalAlpha = 1;
}

function stamp(ctx: Ctx, sprite: Sprite, x: number, y: number, scale: number, alpha: number) {
	if (alpha <= 0.003) return;
	const e = sprite.extent * scale;
	ctx.globalAlpha = Math.min(1, alpha);
	ctx.drawImage(sprite.canvas, x - e, y - e, e * 2, e * 2);
}

/** Draw one complete frame at `time` seconds. */
export function drawFrame(state: FrameState, time: number): void {
	const { ctx, bloomCtx, scene, buffers, samples, layout, cache } = state;
	const { width, height, motion, still } = layout;
	const animate = !still && motion > 0;
	const paths: Path2D[] = new Array(scene.threads.length);

	for (let i = 0; i < scene.threads.length; i += 1) {
		const points = buffers[i]!;
		sampleThread(scene.threads[i]!, time, layout, samples, points);
		paths[i] = polyline(points, 0, samples);
	}

	// Low-resolution bloom pass, upscaled onto the main canvas for a cheap soft glow.
	bloomCtx.globalCompositeOperation = "source-over";
	bloomCtx.globalAlpha = 1;
	bloomCtx.clearRect(0, 0, width, height);
	bloomCtx.globalCompositeOperation = "lighter";
	drawOriginBloom(bloomCtx, layout, cache.origin);

	for (let i = 0; i < scene.threads.length; i += 1) {
		const thread = scene.threads[i]!;
		bloomCtx.globalAlpha = 0.8 + 0.2 * Math.sin(time * thread.shimmerSpeed + thread.phase);
		bloomCtx.strokeStyle = cache.threads[i]!.bloom;
		bloomCtx.lineWidth = thread.glowWidth * 1.7;
		bloomCtx.stroke(paths[i]!);
	}
	bloomCtx.globalAlpha = 1;

	ctx.globalCompositeOperation = "source-over";
	ctx.globalAlpha = 1;
	ctx.clearRect(0, 0, width, height);
	ctx.globalCompositeOperation = "lighter";
	if (state.composeBloom) {
		// The bloom is already blurry, so bilinear ("low") upscaling looks the same and costs less.
		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = "low";
		ctx.drawImage(bloomCtx.canvas, 0, 0, width, height);
	}

	for (let i = 0; i < scene.threads.length; i += 1) {
		const thread = scene.threads[i]!;
		const threadCache = cache.threads[i]!;
		const shimmer = 0.82 + 0.18 * Math.sin(time * thread.shimmerSpeed + thread.phase);

		ctx.globalAlpha = shimmer;
		ctx.strokeStyle = threadCache.glow;
		ctx.lineWidth = thread.glowWidth * 0.32;
		ctx.stroke(paths[i]!);
		ctx.strokeStyle = threadCache.core;
		ctx.lineWidth = thread.coreWidth;
		ctx.stroke(paths[i]!);

		if (thread.hasPulse && animate) {
			const pulseU = ((thread.pulsePhase + time * thread.pulseSpeed * motion) % 0.58) + 0.12;
			strokeShimmer(
				ctx,
				buffers[i]!,
				samples,
				pulseU,
				thread.pulseLength,
				thread.coreWidth,
				Math.min(1, thread.alpha * shimmer) * 0.38,
				threadCache.shimmer,
			);
		}
	}

	for (const speck of scene.specks) {
		const points = buffers[speck.thread]!;
		const p = pointAt(points, samples, speck.u);
		const n = normalAt(points, samples, speck.u);
		const wander = animate ? Math.sin(time * speck.drift + speck.phase) * 2 * motion : 0;
		const pulse = 0.06 + (Math.sin(time * 0.7 + speck.phase) + 1) * 0.05;
		stamp(
			ctx,
			cache.speck,
			p.x + n.x * speck.nOff,
			p.y + n.y * speck.nOff + wander,
			speck.size,
			pulse,
		);
	}

	for (let s = 0; s < scene.sparkles.length; s += 1) {
		const sparkle = scene.sparkles[s]!;
		const sprite = cache.sparkles[s]!;
		const u = animate
			? ((sparkle.phase + time * sparkle.speed * motion) % 0.62) + 0.12
			: sparkle.phase;
		const p = pointAt(buffers[sparkle.thread]!, samples, u);
		const twinkle = Math.pow(
			0.5 + 0.5 * Math.sin(time * sparkle.twinkleSpeed + sparkle.twinklePhase),
			2.2,
		);
		ctx.globalAlpha = 0.3 + twinkle * 0.7;
		if (sparkle.flare) {
			ctx.drawImage(
				sprite.canvas,
				p.x - sprite.extent,
				p.y - sprite.extent,
				sprite.extent * 2,
				sprite.extent * 2,
			);
		} else {
			ctx.save();
			ctx.translate(p.x, p.y);
			ctx.rotate(sparkle.tilt);
			ctx.drawImage(
				sprite.canvas,
				-sprite.extent,
				-sprite.extent,
				sprite.extent * 2,
				sprite.extent * 2,
			);
			ctx.restore();
		}
	}

	const emberTime = animate ? time * state.emberSpeed * motion : 0;
	for (const ember of scene.embers) {
		const pos = emberPosition(ember, emberTime);
		const x = pos.x * width;
		const y = pos.y * height;
		const alpha = ember.alpha * (0.55 + 0.45 * Math.sin(time * ember.twinkleSpeed + ember.phase));
		if (ember.size > 1.3) stamp(ctx, cache.emberHalo, x, y, ember.size, alpha);
		stamp(ctx, cache.ember, x, y, ember.size, alpha);
	}

	ctx.globalAlpha = 1;
	ctx.globalCompositeOperation = "source-over";
}

function drawOriginBloom(target: Ctx, layout: FlowLayout, glow: CanvasGradient): void {
	const rx = Math.min(layout.width, layout.height) * 0.2;
	const ry = Math.min(layout.width, layout.height) * 0.28;
	target.save();
	target.translate(layout.width * layout.originX, layout.height * layout.originY);
	target.scale(1, ry / rx);
	target.fillStyle = glow;
	target.beginPath();
	target.arc(0, 0, rx, 0, TAU);
	target.fill();
	target.restore();
}
