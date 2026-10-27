export const TAU = Math.PI * 2;

export interface Point {
	x: number;
	y: number;
}

export function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

/** Position on a 1-D cubic Bézier at `t` (0–1). */
export function cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
	const mt = 1 - t;
	return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

/** First derivative of a 1-D cubic Bézier at `t`. */
export function cubicBezierDerivative(
	t: number,
	p0: number,
	p1: number,
	p2: number,
	p3: number,
): number {
	const mt = 1 - t;
	return 3 * mt * mt * (p1 - p0) + 6 * mt * t * (p2 - p1) + 3 * t * t * (p3 - p2);
}

/** Smooth 1-D value noise in `[0, 1]`, continuous in `x`. */
export function smoothNoise(x: number, seed: number): number {
	const i0 = Math.floor(x);
	const f = x - i0;
	const s = f * f * (3 - 2 * f);
	const hash = (n: number) => {
		const k = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453;
		return k - Math.floor(k);
	};
	return hash(i0) * (1 - s) + hash(i0 + 1) * s;
}

/** Linear interpolation along a sampled polyline, `u` in 0–1. */
export function pointAt(points: readonly Point[], samples: number, u: number): Point {
	const f = clamp(u, 0, 1) * samples;
	const i = Math.min(samples - 1, Math.floor(f));
	const t = f - i;
	const a = points[i]!;
	const b = points[i + 1]!;
	return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Unit normal of a sampled polyline near `u` (central difference). */
export function normalAt(points: readonly Point[], samples: number, u: number): Point {
	const i = Math.max(1, Math.min(samples - 1, Math.round(u * samples)));
	const a = points[i - 1]!;
	const b = points[i + 1]!;
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const len = Math.hypot(dx, dy) || 1;
	return { x: -dy / len, y: dx / len };
}

/** Wrap `value` into `[0, 1)`. */
export function wrap01(value: number): number {
	return value - Math.floor(value);
}
