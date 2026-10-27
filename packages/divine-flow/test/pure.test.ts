import { describe, expect, it } from "vitest";
import {
	clamp,
	cubicBezier,
	cubicBezierDerivative,
	normalAt,
	pointAt,
	smoothNoise,
	wrap01,
} from "../src/math.js";
import { mulberry32 } from "../src/random.js";
import {
	PALETTE_KEYS,
	hslToRgb,
	isRGB,
	resolvePalette,
	rgbToHsl,
	rgba,
	shade,
	themes,
} from "../src/palette.js";
import { DEFAULTS, resolveOptions } from "../src/options.js";

describe("mulberry32", () => {
	it("is deterministic for a seed", () => {
		const a = mulberry32(42);
		const b = mulberry32(42);
		const seqA = Array.from({ length: 20 }, a);
		const seqB = Array.from({ length: 20 }, b);
		expect(seqA).toEqual(seqB);
	});

	it("produces different sequences for different seeds", () => {
		expect(mulberry32(1)()).not.toBe(mulberry32(2)());
	});

	it("stays within [0, 1)", () => {
		const random = mulberry32(8400);
		for (let i = 0; i < 5000; i += 1) {
			const v = random();
			expect(v).toBeGreaterThanOrEqual(0);
			expect(v).toBeLessThan(1);
		}
	});

	it("handles negative seeds", () => {
		const v = mulberry32(-173)();
		expect(v).toBeGreaterThanOrEqual(0);
		expect(v).toBeLessThan(1);
	});
});

describe("math", () => {
	it("clamps", () => {
		expect(clamp(5, 0, 1)).toBe(1);
		expect(clamp(-5, 0, 1)).toBe(0);
		expect(clamp(0.5, 0, 1)).toBe(0.5);
	});

	it("hits the endpoints of a cubic Bézier", () => {
		expect(cubicBezier(0, 1, 2, 3, 4)).toBe(1);
		expect(cubicBezier(1, 1, 2, 3, 4)).toBe(4);
	});

	it("has a constant derivative for evenly spaced control points", () => {
		for (const t of [0, 0.25, 0.5, 1]) {
			expect(cubicBezierDerivative(t, 0, 1, 2, 3)).toBeCloseTo(3);
		}
	});

	it("smoothNoise stays in [0, 1] and is continuous", () => {
		let previous = smoothNoise(0, 7);
		for (let x = 0.01; x < 20; x += 0.01) {
			const value = smoothNoise(x, 7);
			expect(value).toBeGreaterThanOrEqual(0);
			expect(value).toBeLessThanOrEqual(1);
			expect(Math.abs(value - previous)).toBeLessThan(0.05);
			previous = value;
		}
	});

	it("interpolates and finds normals on a polyline", () => {
		const samples = 4;
		const points = Array.from({ length: samples + 1 }, (_, i) => ({ x: i * 10, y: 0 }));
		expect(pointAt(points, samples, 0.5)).toEqual({ x: 20, y: 0 });
		expect(pointAt(points, samples, 2)).toEqual({ x: 40, y: 0 });
		const n = normalAt(points, samples, 0.5);
		expect(n.x).toBeCloseTo(0);
		expect(Math.abs(n.y)).toBeCloseTo(1);
	});

	it("wraps into [0, 1)", () => {
		expect(wrap01(1.25)).toBeCloseTo(0.25);
		expect(wrap01(-0.25)).toBeCloseTo(0.75);
	});
});

describe("palette", () => {
	it("ships complete, valid themes", () => {
		for (const theme of Object.values(themes)) {
			for (const key of PALETTE_KEYS) {
				expect(isRGB(theme[key]), key).toBe(true);
			}
		}
	});

	it("resolves a theme name and applies overrides", () => {
		const palette = resolvePalette("crimson", { core: [1, 2, 3] });
		expect(palette.core).toEqual([1, 2, 3]);
		expect(palette.glow).toEqual(themes.crimson.glow);
	});

	it("accepts a full custom palette", () => {
		const custom = { ...themes.violet, ember: [9, 9, 9] as const };
		expect(resolvePalette(custom).ember).toEqual([9, 9, 9]);
	});

	it("rejects unknown themes and invalid colours", () => {
		// @ts-expect-error testing a bad theme name
		expect(() => resolvePalette("teal")).toThrow(/unknown theme/);
		expect(() => resolvePalette("gold", { core: [300, 0, 0] })).toThrow(/palette\.core/);
	});

	it("formats rgba strings with clamped alpha", () => {
		expect(rgba([1, 2, 3], 0.5)).toBe("rgba(1, 2, 3, 0.5)");
		expect(rgba([1, 2, 3], 2)).toBe("rgba(1, 2, 3, 1)");
		expect(rgba([1, 2, 3], -1)).toBe("rgba(1, 2, 3, 0)");
	});
});

describe("colour shading", () => {
	it("round-trips RGB through HSL", () => {
		for (const color of [
			themes.crimson.glow,
			themes.gold.core,
			themes.violet.bloom,
			[0, 0, 0],
			[255, 255, 255],
		] as const) {
			const [h, s, l] = rgbToHsl(color);
			const back = hslToRgb(h, s, l);
			back.forEach((channel, i) => expect(Math.abs(channel - color[i]!)).toBeLessThanOrEqual(1));
		}
	});

	it("shifts hue and lightness but keeps colours valid", () => {
		const base = themes.crimson.glow;
		expect(shade(base, 0, 0)).toEqual(base);
		const lighter = shade(base, 0, 0.1);
		expect(rgbToHsl(lighter)[2]).toBeGreaterThan(rgbToHsl(base)[2]);
		expect(isRGB(shade(base, 400, 2))).toBe(true);
		expect(shade(base, 0, -2)).toEqual([0, 0, 0]);
	});
});

describe("resolveOptions", () => {
	it("applies defaults", () => {
		const options = resolveOptions();
		expect(options.lineCount).toBe(DEFAULTS.lineCount);
		expect(options.originY).toBe(0.5);
		expect(options.palette).toEqual(themes.gold);
		expect(options.reducedMotion).toBe("auto");
		expect(options.pauseWhenHidden).toBe(true);
		expect(options.sparkleCount).toBeNull();
		expect(options.variance).toBe(0);
		expect(options.maxFps).toBe(60);
	});

	it("clamps out-of-range and non-finite values", () => {
		const options = resolveOptions({
			lineCount: -3,
			scatterCount: 2.6,
			originX: 4,
			originY: Number.NaN,
			motion: -1,
			bloomScale: 0,
			maxDpr: 99,
			variance: 3,
			maxFps: 0,
		});
		expect(options.variance).toBe(1);
		expect(options.maxFps).toBe(1);
		expect(options.lineCount).toBe(0);
		expect(options.scatterCount).toBe(3);
		expect(options.originX).toBe(1);
		expect(options.originY).toBe(DEFAULTS.originY);
		expect(options.motion).toBe(0);
		expect(options.bloomScale).toBe(0.1);
		expect(options.maxDpr).toBe(4);
	});
});
