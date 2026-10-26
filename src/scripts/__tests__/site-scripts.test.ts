import { describe, expect, it } from "vitest";
import { splitSubpaths } from "../svg-path";
import { optionsFor, parseOptions } from "../divine-flow";

describe("splitSubpaths", () => {
	it("splits compound path data at every absolute move", () => {
		expect(splitSubpaths("M0 0L1 1ZM2 2L3 3Z M4 4H5Z")).toEqual([
			"M0 0L1 1Z",
			"M2 2L3 3Z",
			"M4 4H5Z",
		]);
	});

	it("returns nothing for empty data", () => {
		expect(splitSubpaths("")).toEqual([]);
	});
});

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
