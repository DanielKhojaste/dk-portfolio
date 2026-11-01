import { describe, expect, it } from "vitest";
import { createScene, createThreads, emberPosition } from "../scene";
import {
	makePointBuffer,
	tiltLift,
	sampleThread,
	samplesForWidth,
	type FlowLayout,
} from "../geometry";

const config = {
	lineCount: 7,
	scatterCount: 2,
	seed: 8400,
	sparkleCount: null,
	speckCount: 28,
	emberCount: 40,
};

const layout: FlowLayout = {
	width: 1440,
	height: 900,
	originX: 0.5,
	originY: 0.45,
	innerGap: 108,
	motion: 1,
	still: false,
};

describe("createThreads", () => {
	it("creates lineCount + scatterCount filaments per side", () => {
		const threads = createThreads(config);
		expect(threads).toHaveLength(18);
		expect(threads.filter((t) => t.side === -1)).toHaveLength(9);
		expect(threads.filter((t) => t.side === 1)).toHaveLength(9);
	});

	it("is deterministic for a seed and changes with the seed", () => {
		expect(createThreads(config)).toEqual(createThreads(config));
		expect(createThreads({ ...config, seed: 1 })).not.toEqual(createThreads(config));
	});

	it("only builds the requested side, without reshaping it", () => {
		const both = createThreads(config);
		const right = createThreads({ ...config, sides: "right" });
		const left = createThreads({ ...config, sides: "left" });
		expect(right.every((t) => t.side === 1)).toBe(true);
		expect(left.every((t) => t.side === -1)).toBe(true);
		expect(right).toEqual(both.filter((t) => t.side === 1));
		expect(left).toEqual(both.filter((t) => t.side === -1));
	});

	it("handles zero filaments", () => {
		const scene = createScene({ ...config, lineCount: 0, scatterCount: 0 });
		expect(scene.threads).toEqual([]);
		expect(scene.sparkles).toEqual([]);
		expect(scene.specks).toEqual([]);
	});
});

describe("createScene", () => {
	it("references only existing filaments", () => {
		const scene = createScene(config);
		for (const item of [...scene.sparkles, ...scene.specks]) {
			expect(item.thread).toBeGreaterThanOrEqual(0);
			expect(item.thread).toBeLessThan(scene.threads.length);
		}
	});

	it("defaults to min(10, 4 + filaments) sparkles and honours explicit counts", () => {
		expect(createScene(config).sparkles).toHaveLength(10);
		expect(createScene({ ...config, sparkleCount: 3 }).sparkles).toHaveLength(3);
		expect(createScene({ ...config, lineCount: 1, scatterCount: 0 }).sparkles).toHaveLength(6);
	});

	it("creates the requested number of embers and specks", () => {
		const scene = createScene(config);
		expect(scene.embers).toHaveLength(40);
		expect(scene.specks).toHaveLength(28);
	});
});

describe("emberPosition", () => {
	it("is a pure function of time that wraps inside the canvas", () => {
		const [ember] = createScene(config).embers;
		expect(emberPosition(ember!, 12)).toEqual(emberPosition(ember!, 12));
		for (const t of [0, 1, 50, 1e4]) {
			const p = emberPosition(ember!, t);
			expect(p.x).toBeGreaterThanOrEqual(0);
			expect(p.x).toBeLessThan(1);
			expect(p.y).toBeGreaterThanOrEqual(0);
			expect(p.y).toBeLessThan(1);
		}
	});

	it("rises over time", () => {
		const ember = {
			x: 0.5,
			y: 0.5,
			size: 1,
			vx: 0,
			rise: 0.01,
			alpha: 1,
			phase: 0,
			twinkleSpeed: 1,
		};
		expect(emberPosition(ember, 10).y).toBeCloseTo(0.4);
	});
});

describe("geometry", () => {
	it("starts near the origin and ends beyond the edge on its side", () => {
		const threads = createThreads(config);
		const samples = samplesForWidth(layout.width);
		const buffer = makePointBuffer();

		for (const thread of threads) {
			sampleThread(thread, 0, layout, samples, buffer);
			const start = buffer[0]!;
			const end = buffer[samples]!;
			expect(Math.abs(start.x - layout.width * layout.originX)).toBeLessThan(layout.innerGap);
			if (thread.side === 1) expect(end.x).toBeGreaterThan(layout.width);
			else expect(end.x).toBeLessThan(0);
		}
	});

	it("holds its shape when still, and moves when animated", () => {
		const [thread] = createThreads(config);
		const samples = 44;
		const a = makePointBuffer();
		const b = makePointBuffer();

		sampleThread(thread!, 0, { ...layout, still: true }, samples, a);
		sampleThread(thread!, 30, { ...layout, still: true }, samples, b);
		expect(b).toEqual(a);

		sampleThread(thread!, 30, layout, samples, b);
		expect(b).not.toEqual(a);
	});

	it("narrows the fan with spread and scales waves with amplitude", () => {
		const threads = createThreads(config);
		const samples = 44;
		const buffer = makePointBuffer();
		const cy = layout.height * layout.originY;
		const reach = (l: FlowLayout) =>
			Math.max(
				...threads.map((t) => {
					sampleThread(t, 0, { ...l, still: true }, samples, buffer);
					return Math.max(...buffer.slice(0, samples + 1).map((p) => Math.abs(p.y - cy)));
				}),
			);
		expect(reach({ ...layout, spread: 0.2 })).toBeLessThan(reach(layout) * 0.25);

		const [thread] = threads;
		const flat = makePointBuffer();
		const tall = makePointBuffer();
		const rest = makePointBuffer();
		sampleThread(thread!, 7, { ...layout, amplitude: 0 }, samples, rest);
		sampleThread(thread!, 7, layout, samples, flat);
		sampleThread(thread!, 7, { ...layout, amplitude: 3 }, samples, tall);
		const offset = (b: typeof flat) => Math.abs(b[samples / 2]!.y - rest[samples / 2]!.y);
		expect(offset(tall)).toBeCloseTo(offset(flat) * 3, 3);
	});

	it("slants filaments by the tilt angle, rising to the right either way", () => {
		const tan5 = Math.tan((5 * Math.PI) / 180);
		expect(tiltLift(0, 0, 5)).toBe(0);
		expect(tiltLift(400, 0, 5)).toBeCloseTo(400 * tan5, 6);
		// Flowing left from the right edge, the line drops as it goes: still bottom left to top right.
		expect(tiltLift(0, 400, 5)).toBeCloseTo(-400 * tan5, 6);

		const strip: FlowLayout = { ...layout, width: 400, height: 60, originY: 0.5, innerGap: 0 };
		for (const [sides, originX] of [
			["right", 0],
			["left", 1],
		] as const) {
			const [thread] = createThreads({ ...config, sides });
			const flat = makePointBuffer();
			const slanted = makePointBuffer();
			const rest = { ...strip, originX, still: true };
			sampleThread(thread!, 0, rest, 44, flat);
			sampleThread(thread!, 0, { ...rest, tilt: 5 }, 44, slanted);
			const lift = (i: number) => flat[i]!.y - slanted[i]!.y;
			expect(lift(0)).toBeCloseTo(0, 6);
			const i = 30;
			expect(lift(i)).toBeCloseTo(tan5 * (flat[i]!.x - flat[0]!.x), 2);
		}
	});

	it("scales sample count with width inside fixed bounds", () => {
		expect(samplesForWidth(100)).toBe(44);
		expect(samplesForWidth(1600)).toBe(57);
		expect(samplesForWidth(10_000)).toBe(72);
	});
});

describe("threadProgress", () => {
	it("grows each filament from nothing to full length, staggered by its offset", async () => {
		const { threadProgress } = await import("../renderer");
		expect(threadProgress(0, 0)).toBe(0);
		expect(threadProgress(1, 0.9)).toBe(1);
		expect(threadProgress(0.2, 1)).toBe(0);
		expect(threadProgress(0.5, 0)).toBeGreaterThan(threadProgress(0.5, 1));
		let last = 0;
		for (let r = 0; r <= 1; r += 0.05) {
			const p = threadProgress(r, 0.4);
			expect(p).toBeGreaterThanOrEqual(last);
			last = p;
		}
		expect(threadProgress(0.999, 1)).toBeGreaterThan(0.99);
	});
});

describe("threadShade", () => {
	it("is zero without variance and stable, bounded and varied with it", async () => {
		const { threadShade } = await import("../renderer");
		const threads = createThreads(config);
		expect(threadShade(threads[0]!, 0)).toEqual({ hue: 0, light: 0 });

		const shades = threads.map((t) => threadShade(t, 1));
		expect(threads.map((t) => threadShade(t, 1))).toEqual(shades);
		for (const s of shades) {
			expect(Math.abs(s.hue)).toBeLessThanOrEqual(14);
			expect(Math.abs(s.light)).toBeLessThanOrEqual(0.14);
		}
		expect(new Set(shades.map((s) => s.hue.toFixed(3))).size).toBeGreaterThan(threads.length / 2);
	});

	it("picks from custom ranges, scaled by variance", async () => {
		const { threadShade } = await import("../renderer");
		const ranges = { hue: [-9, 0] as const, light: [-0.21, 0.07] as const };
		for (const thread of createThreads(config)) {
			const { hue, light } = threadShade(thread, 0.5, ranges);
			expect(hue).toBeGreaterThanOrEqual(-4.5);
			expect(hue).toBeLessThanOrEqual(0);
			expect(light).toBeGreaterThanOrEqual(-0.105);
			expect(light).toBeLessThanOrEqual(0.035);
		}
	});
});
