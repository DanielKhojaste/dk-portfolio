import { TAU, normalAt, pointAt, type Point } from "./math.js";
import { rgba } from "./palette.js";
import { emberPosition, type Scene } from "./scene.js";
import { sampleThread, type FlowLayout } from "./geometry.js";
import type { DivineFlowPalette, RGB } from "./types.js";

type Ctx = CanvasRenderingContext2D;

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
}

export function strokeRange(
	ctx: Ctx,
	points: readonly Point[],
	samples: number,
	u0: number,
	u1: number,
	width: number,
	color: string | CanvasGradient,
): void {
	const i0 = Math.max(0, Math.floor(u0 * samples));
	const i1 = Math.min(samples, Math.ceil(u1 * samples));
	if (i1 <= i0) return;

	ctx.beginPath();
	ctx.moveTo(points[i0]!.x, points[i0]!.y);
	for (let i = i0 + 1; i <= i1; i += 1) {
		ctx.lineTo(points[i]!.x, points[i]!.y);
	}
	ctx.strokeStyle = color;
	ctx.lineWidth = width;
	ctx.stroke();
}

/** Fades in near the origin, peaks around 40%, and dissolves before the edge. */
export function makeTrailGradient(
	ctx: Ctx,
	points: readonly Point[],
	samples: number,
	color: RGB,
	alpha: number,
): CanvasGradient {
	const from = points[0]!;
	const to = points[samples]!;
	const grad = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
	grad.addColorStop(0, rgba(color, 0));
	grad.addColorStop(0.1, rgba(color, alpha * 0.8));
	grad.addColorStop(0.42, rgba(color, alpha));
	grad.addColorStop(0.66, rgba(color, alpha * 0.42));
	grad.addColorStop(0.83, rgba(color, alpha * 0.1));
	grad.addColorStop(1, rgba(color, 0));
	return grad;
}

function strokeShimmer(
	ctx: Ctx,
	points: readonly Point[],
	samples: number,
	headU: number,
	length: number,
	width: number,
	alpha: number,
	color: RGB,
): void {
	const uStart = Math.max(0.1, headU - length);
	const uEnd = Math.min(0.76, headU);
	const span = uEnd - uStart;
	if (span < 0.03) return;

	const chunks = 8;
	for (let c = 0; c < chunks; c += 1) {
		const t0 = c / chunks;
		const t1 = (c + 1) / chunks;
		const envelope = Math.sin(Math.PI * ((t0 + t1) * 0.5));
		const a = alpha * envelope * envelope;
		if (a < 0.02) continue;
		strokeRange(
			ctx,
			points,
			samples,
			uStart + span * t0,
			uStart + span * t1,
			width,
			rgba(color, a),
		);
	}
}

function drawOriginBloom(target: Ctx, layout: FlowLayout, palette: DivineFlowPalette): void {
	const cx = layout.width * layout.originX;
	const cy = layout.height * layout.originY;
	const rx = Math.min(layout.width, layout.height) * 0.2;
	const ry = Math.min(layout.width, layout.height) * 0.28;

	target.save();
	target.translate(cx, cy);
	target.scale(1, ry / rx);
	const glow = target.createRadialGradient(0, 0, rx * 0.12, 0, 0, rx);
	glow.addColorStop(0, rgba(palette.originInner, 0.12));
	glow.addColorStop(0.34, rgba(palette.originOuter, 0.05));
	glow.addColorStop(1, "rgba(0, 0, 0, 0)");
	target.fillStyle = glow;
	target.beginPath();
	target.arc(0, 0, rx, 0, TAU);
	target.fill();
	target.restore();
}

function drawSparkle(
	ctx: Ctx,
	x: number,
	y: number,
	size: number,
	intensity: number,
	flare: boolean,
	tilt: number,
	palette: DivineFlowPalette,
): void {
	ctx.save();
	ctx.translate(x, y);
	if (!flare) ctx.rotate(tilt);

	const radius = size * (flare ? 6.2 : 3.1);
	const disc = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
	disc.addColorStop(0, rgba(palette.sparkle, 0.9 * intensity));
	disc.addColorStop(0.22, rgba(palette.sparkleHalo, 0.28 * intensity));
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
		hg.addColorStop(0.5, rgba(palette.sparkle, 0.82 * intensity));
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
		ctx.fillStyle = rgba(palette.sparkle, 0.65 * intensity);
		const arm = size * 2.1;
		ctx.fillRect(-arm, -0.3, arm * 2, 0.6);
		ctx.fillRect(-0.3, -arm * 0.65, 0.6, arm * 1.3);
	}

	ctx.fillStyle = rgba(palette.sparkle, intensity);
	ctx.beginPath();
	ctx.arc(0, 0, Math.max(0.4, size * 0.24), 0, TAU);
	ctx.fill();
	ctx.restore();
}

/** Draw one complete frame at `time` seconds. */
export function drawFrame(state: FrameState, time: number): void {
	const { ctx, bloomCtx, scene, buffers, samples, layout, palette } = state;
	const { width, height, motion, still } = layout;
	const animate = !still && motion > 0;

	for (let i = 0; i < scene.threads.length; i += 1) {
		sampleThread(scene.threads[i]!, time, layout, samples, buffers[i]!);
	}

	// Low-resolution bloom pass, upscaled onto the main canvas for a cheap soft glow.
	bloomCtx.globalCompositeOperation = "source-over";
	bloomCtx.clearRect(0, 0, width, height);
	bloomCtx.globalCompositeOperation = "lighter";
	drawOriginBloom(bloomCtx, layout, palette);

	for (let i = 0; i < scene.threads.length; i += 1) {
		const thread = scene.threads[i]!;
		const shimmer = 0.8 + 0.2 * Math.sin(time * thread.shimmerSpeed + thread.phase);
		const points = buffers[i]!;
		strokeRange(
			bloomCtx,
			points,
			samples,
			0,
			1,
			thread.glowWidth * 1.7,
			makeTrailGradient(bloomCtx, points, samples, palette.bloom, thread.alpha * shimmer * 0.5),
		);
	}

	ctx.globalCompositeOperation = "source-over";
	ctx.clearRect(0, 0, width, height);
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = "high";
	ctx.globalCompositeOperation = "lighter";
	ctx.drawImage(bloomCtx.canvas, 0, 0, width, height);

	for (let i = 0; i < scene.threads.length; i += 1) {
		const thread = scene.threads[i]!;
		const points = buffers[i]!;
		const shimmer = 0.82 + 0.18 * Math.sin(time * thread.shimmerSpeed + thread.phase);
		const a = Math.min(1, thread.alpha * shimmer);

		strokeRange(
			ctx,
			points,
			samples,
			0,
			1,
			thread.glowWidth * 0.32,
			makeTrailGradient(ctx, points, samples, palette.glow, a * 0.22),
		);
		strokeRange(
			ctx,
			points,
			samples,
			0,
			1,
			thread.coreWidth,
			makeTrailGradient(ctx, points, samples, palette.core, a * 0.78),
		);

		if (thread.hasPulse && animate) {
			const pulseU = ((thread.pulsePhase + time * thread.pulseSpeed * motion) % 0.58) + 0.12;
			strokeShimmer(
				ctx,
				points,
				samples,
				pulseU,
				thread.pulseLength,
				thread.coreWidth,
				a * 0.38,
				palette.shimmer,
			);
		}
	}

	for (const speck of scene.specks) {
		const points = buffers[speck.thread]!;
		const p = pointAt(points, samples, speck.u);
		const n = normalAt(points, samples, speck.u);
		const wander = animate ? Math.sin(time * speck.drift + speck.phase) * 2 * motion : 0;
		const pulse = 0.06 + (Math.sin(time * 0.7 + speck.phase) + 1) * 0.05;
		ctx.fillStyle = rgba(palette.speck, pulse);
		ctx.beginPath();
		ctx.arc(p.x + n.x * speck.nOff, p.y + n.y * speck.nOff + wander, speck.size, 0, TAU);
		ctx.fill();
	}

	for (const sparkle of scene.sparkles) {
		const u = animate
			? ((sparkle.phase + time * sparkle.speed * motion) % 0.62) + 0.12
			: sparkle.phase;
		const p = pointAt(buffers[sparkle.thread]!, samples, u);
		const twinkle = Math.pow(
			0.5 + 0.5 * Math.sin(time * sparkle.twinkleSpeed + sparkle.twinklePhase),
			2.2,
		);
		drawSparkle(
			ctx,
			p.x,
			p.y,
			sparkle.size,
			0.3 + twinkle * 0.7,
			sparkle.flare,
			sparkle.tilt,
			palette,
		);
	}

	const emberTime = animate ? time * state.emberSpeed * motion : 0;
	for (const ember of scene.embers) {
		const pos = emberPosition(ember, emberTime);
		const x = pos.x * width;
		const y = pos.y * height;
		const twinkle = 0.55 + 0.45 * Math.sin(time * ember.twinkleSpeed + ember.phase);
		const alpha = ember.alpha * twinkle;

		ctx.fillStyle = rgba(palette.ember, alpha);
		ctx.beginPath();
		ctx.arc(x, y, ember.size, 0, TAU);
		ctx.fill();

		if (ember.size > 1.3) {
			ctx.fillStyle = rgba(palette.ember, alpha * 0.15);
			ctx.beginPath();
			ctx.arc(x, y, ember.size * 4, 0, TAU);
			ctx.fill();
		}
	}

	ctx.globalCompositeOperation = "source-over";
}
