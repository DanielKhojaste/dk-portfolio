import { describe, expect, it } from "vitest";
import { dkLogoPens } from "../../assets/brand/dk-logo-pens";
import { optionsFor, parseOptions } from "../divine-flow";
import { containedRect, maskVariables } from "../name-ghost";

describe("parseOptions", () => {
	it("parses JSON objects and ignores everything else", () => {
		expect(parseOptions('{"theme":"crimson"}')).toEqual({ theme: "crimson" });
		expect(parseOptions(undefined)).toEqual({});
		expect(parseOptions("null")).toEqual({});
	});

	it("falls back to defaults on invalid JSON", () => {
		const warn = console.warn;
		console.warn = () => {};
		expect(parseOptions("{oops")).toEqual({});
		console.warn = warn;
	});
});

describe("optionsFor", () => {
	const base = { theme: "crimson" as const, originY: 0.46, lineCount: 8 };
	const compact = { originY: 0.4, emberCount: 36 };

	it("returns the base options without a compact override", () => {
		expect(optionsFor(base, null, true)).toBe(base);
	});

	it("merges compact options over the base while compact", () => {
		expect(optionsFor(base, compact, true)).toEqual({ ...base, ...compact });
	});

	it("resets compact-only keys to defaults when leaving compact", () => {
		expect(optionsFor(base, compact, false)).toEqual({ ...base, emberCount: undefined });
	});
});

describe("containedRect", () => {
	const box = { x: 100, y: 50, width: 400, height: 400 };

	it("fits a tall image by height and aligns it bottom-centre", () => {
		const rect = containedRect(box, 723, 1210);
		expect(rect.height).toBeCloseTo(400);
		expect(rect.width).toBeCloseTo(400 * (723 / 1210));
		expect(rect.x).toBeCloseTo(100 + (400 - rect.width) / 2);
		expect(rect.y).toBeCloseTo(50);
	});

	it("fits a wide image by width and honours vertical alignment", () => {
		const rect = containedRect(box, 800, 400, 0.5, 1);
		expect(rect).toEqual({ x: 100, y: 250, width: 400, height: 200 });
		expect(containedRect(box, 800, 400, 0, 0).y).toBe(50);
	});

	it("returns an empty rect for unloaded images", () => {
		expect(containedRect(box, 0, 0).width).toBe(0);
	});
});

describe("maskVariables", () => {
	it("positions the mask relative to the target box", () => {
		const vars = maskVariables(
			{ x: 300, y: 120, width: 240.5, height: 400 },
			{ x: 0, y: 100, width: 1440, height: 300 },
		);
		expect(vars).toEqual({
			"--mask-x": "300px",
			"--mask-y": "20px",
			"--mask-w": "240.5px",
			"--mask-h": "400px",
		});
	});
});

describe("dkLogoPens", () => {
	it("has four strokes in writing order: D stem, D bowl, K stem, K arm and leg", () => {
		expect(dkLogoPens).toHaveLength(4);
		const starts = dkLogoPens.map((pen) =>
			pen.d
				.match(/^M([\d.]+) ([\d.]+)/)!
				.slice(1)
				.map(Number),
		);
		// The D is written before the K (strokes start further right as writing progresses).
		expect(starts[0]![0]).toBeLessThan(starts[2]![0]);
		expect(starts[1]![0]).toBeLessThan(starts[2]![0]);
		for (const pen of dkLogoPens) expect(pen.width).toBeGreaterThan(0);
	});
});
