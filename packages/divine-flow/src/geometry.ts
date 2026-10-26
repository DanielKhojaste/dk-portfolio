import { cubicBezier, cubicBezierDerivative, smoothNoise, type Point } from "./math.js";
import type { Thread } from "./scene.js";

/** Everything about the canvas that affects where a filament sits. */
export interface FlowLayout {
	width: number;
	height: number;
	originX: number;
	originY: number;
	innerGap: number;
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

/** Write the point at `u` (0–1) along `thread` at `time` seconds into `out`. */
export function writePoint(
	thread: Thread,
	u: number,
	time: number,
	layout: FlowLayout,
	out: Point,
): void {
	const { width, height } = layout;
	const cx = width * layout.originX;
	const cy = height * layout.originY;
	const originR = Math.min(layout.innerGap, Math.max(64, width * 0.072));
	const startX = cx + thread.side * originR * (0.4 + thread.startInset * 0.34);
	const startY = cy + thread.startY * height;
	const edgeX = thread.side === 1 ? width + 48 : -48;
	const endX = startX + (edgeX - startX) * thread.reach;
	const endY = cy + thread.endY * height;
	const span = Math.abs(endX - startX);
	const c1x = startX + thread.side * span * thread.c1t;
	const c1y = startY + thread.bow1 * height;
	const c2x = startX + thread.side * span * thread.c2t;
	const c2y = endY + thread.bow2 * height;

	const x0 = cubicBezier(u, startX, c1x, c2x, endX);
	const y0 = cubicBezier(u, startY, c1y, c2y, endY);
	const dx = cubicBezierDerivative(u, startX, c1x, c2x, endX);
	const dy = cubicBezierDerivative(u, startY, c1y, c2y, endY);
	const len = Math.hypot(dx, dy) || 1;
	const nx = -dy / len;
	const ny = dx / len;

	const t = layout.still ? 0 : time;
	const envelope = Math.sin(Math.PI * u);
	const n1 = smoothNoise(u * 2.1 + t * thread.speed + thread.phase, thread.seed);
	const n2 = smoothNoise(u * 5.4 - t * thread.speed * 0.4 + thread.phase * 1.4, thread.seed + 11);
	const wave =
		((n1 - 0.5) * thread.amp1 + (n2 - 0.5) * thread.amp2) * envelope * layout.motion * height;

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
