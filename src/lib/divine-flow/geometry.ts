import { cubicBezier, cubicBezierDerivative, smoothNoise, type Point } from "./math";
import type { Thread } from "./scene";

/** Everything about the canvas that affects where a filament sits. */
export interface FlowLayout {
	width: number;
	height: number;
	originX: number;
	originY: number;
	innerGap: number;
	/** Vertical spread multiplier for the filaments' fan. Default `1`. */
	spread?: number;
	/** Wave height multiplier. Default `1`. */
	amplitude?: number;
	/** Slant in degrees, rising to the right (see `DivineFlowOptions.tilt`). Default `0`. */
	tilt?: number;
	/** Wave height in px and number of waves across the canvas (see `DivineFlowOptions.wave`). */
	wave?: number;
	wavePeriods?: number;
	/** See `DivineFlowOptions.tailSway`. Default `0`. */
	tailSway?: number;
	/** See `DivineFlowOptions.fadeFromOrigin`. Default `true`. */
	fadeFromOrigin?: boolean;
	motion: number;
	/** When true, time is frozen and filaments hold their resting shape. */
	still: boolean;
}

/** Maximum polyline samples per filament. Buffers are allocated once at this size. */
export const MAX_SAMPLES = 72;

export function makePointBuffer(): Point[] {
	return Array.from({ length: MAX_SAMPLES + 1 }, () => ({ x: 0, y: 0 }));
}

/** Samples per filament for a canvas width: more for wider canvases, within 44–MAX_SAMPLES. */
export function samplesForWidth(width: number): number {
	return Math.max(44, Math.min(MAX_SAMPLES, Math.round(width / 28)));
}

/** How far a point `x` px along from `startX` is lifted by a `tiltDeg` slant (rising to the right). */
export function tiltLift(x: number, startX: number, tiltDeg: number): number {
	return Math.tan((tiltDeg * Math.PI) / 180) * (x - startX);
}

/**
 * How far a point at `x` is lifted by a `height` px wave with `periods` waves across `width`: one wave
 * dips under the left half and rises under the right ("~"), level at both edges and the middle.
 */
export function waveLift(x: number, width: number, height: number, periods = 1): number {
	if (width <= 0) return 0;
	return height * Math.sin(Math.PI * periods * ((2 * x) / width - 1));
}

/**
 * How far the line at `x` is lifted by the tail sway at `time` seconds: nothing in the middle of the
 * canvas, growing smoothly (with the square of the distance) to `height` px at the edges. Each tail
 * sways on its own slow rhythm. `speed` scales how fast.
 */
export function tailSwayLift(
	x: number,
	width: number,
	height: number,
	time: number,
	speed = 1,
): number {
	if (width <= 0 || height === 0) return 0;
	const s = (2 * x) / width - 1;
	const phase = s < 0 ? 0 : 2.3;
	const sway =
		Math.sin(time * 0.9 * speed + phase) * 0.65 +
		Math.sin(time * 0.53 * speed + phase * 1.7 + 1) * 0.35;
	return height * sway * Math.min(1, s * s);
}

/** Write the point at `u` (0–1) along `thread` at `time` seconds into `out`. */
export function writePoint(
	thread: Thread,
	u: number,
	time: number,
	layout: FlowLayout,
	out: Point,
): void {
	const { width, height } = layout;
	const spread = layout.spread ?? 1;
	const cx = width * layout.originX;
	const cy = height * layout.originY;
	const originR = Math.min(layout.innerGap, Math.max(64, width * 0.072));
	const startX = cx + thread.side * originR * (0.4 + thread.startInset * 0.34);
	const startY = cy + thread.startY * spread * height;
	const edgeX = thread.side === 1 ? width + 48 : -48;
	const endX = startX + (edgeX - startX) * thread.reach;
	const endY = cy + thread.endY * spread * height;
	const span = Math.abs(endX - startX);
	const c1x = startX + thread.side * span * thread.c1t;
	const c1y = startY + thread.bow1 * spread * height;
	const c2x = startX + thread.side * span * thread.c2t;
	const c2y = endY + thread.bow2 * spread * height;

	const x0 = cubicBezier(u, startX, c1x, c2x, endX);
	let y0 = cubicBezier(u, startY, c1y, c2y, endY);
	const dx = cubicBezierDerivative(u, startX, c1x, c2x, endX);
	const dy = cubicBezierDerivative(u, startY, c1y, c2y, endY);
	const len = Math.hypot(dx, dy) || 1;
	const nx = -dy / len;
	const ny = dx / len;

	if (layout.tilt) y0 -= tiltLift(x0, startX, layout.tilt);
	if (layout.wave) y0 -= waveLift(x0, width, layout.wave, layout.wavePeriods ?? 1);

	const t = layout.still ? 0 : time;
	if (layout.tailSway) y0 -= tailSwayLift(x0, width, layout.tailSway, t, layout.motion);
	const envelope = Math.sin(Math.PI * u);
	const n1 = smoothNoise(u * 2.1 + t * thread.speed + thread.phase, thread.seed);
	const n2 = smoothNoise(u * 5.4 - t * thread.speed * 0.4 + thread.phase * 1.4, thread.seed + 11);
	const wave =
		((n1 - 0.5) * thread.amp1 + (n2 - 0.5) * thread.amp2) *
		envelope *
		layout.motion *
		(layout.amplitude ?? 1) *
		height;

	out.x = x0 + nx * wave;
	out.y = y0 + ny * wave;
}

/** Fill `out[0..samples]` with the filament's polyline. */
export function sampleThread(
	thread: Thread,
	time: number,
	layout: FlowLayout,
	samples: number,
	out: Point[],
): void {
	for (let i = 0; i <= samples; i += 1) {
		writePoint(thread, i / samples, time, layout, out[i]!);
	}
}
