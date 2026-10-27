/** A function returning a pseudo-random number in `[0, 1)`. */
export type RandomFn = () => number;

/**
 * Mulberry32: a tiny, fast, seedable PRNG. Good enough for visuals, not for anything security-related.
 * The same seed always yields the same sequence, which keeps layouts stable between renders.
 */
export function mulberry32(seed: number): RandomFn {
	let state = seed >>> 0;
	return function random() {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
