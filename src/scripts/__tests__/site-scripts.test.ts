import { describe, expect, it } from "vitest";
import { dkLogoPens } from "../../assets/brand/dk-logo-pens";
import { optionsFor, parseOptions } from "../divine-flow";

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

	it("clips the K stem so it never reaches the arm or leg", () => {
		const stem = dkLogoPens[2]!;
		expect(stem.clip).toBeDefined();
		const xs = [...stem.clip!.matchAll(/[ML]([\d.]+) [\d.]+/g)].map((m) => Number(m[1]));
		// The arm starts at x≈60 and the leg ends at x≈58; the stem's right edge stays well left of both,
		// and of the junction (x≈42 at y≈29), which the arm pen reveals.
		expect(Math.max(...xs)).toBeLessThan(49);
		const arm = dkLogoPens[3]!.d.match(/^M([\d.]+)/)!;
		expect(Number(arm[1])).toBeGreaterThan(Math.max(...xs));
	});
});
