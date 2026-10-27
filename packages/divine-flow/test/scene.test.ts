import { describe, expect, it } from "vitest";
import { createScene, createThreads, emberPosition } from "../src/scene.js";
import {
	makePointBuffer,
	sampleThread,
	samplesForWidth,
	type FlowLayout,
} from "../src/geometry.js";

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

	it("scales sample count with width inside fixed bounds", () => {
		expect(samplesForWidth(100)).toBe(44);
		expect(samplesForWidth(1600)).toBe(57);
		expect(samplesForWidth(10_000)).toBe(72);
	});
});
