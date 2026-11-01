// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { strokeDurations } from "../logo-draw";

describe("strokeDurations", () => {
	it("splits the total time in proportion to stroke length", () => {
		const durations = strokeDurations([10, 30, 60], 2);
		expect(durations).toEqual([0.2, 0.6, 1.2]);
		expect(durations.reduce((a, b) => a + b, 0)).toBeCloseTo(2);
	});

	it("handles empty or zero-length input", () => {
		expect(strokeDurations([], 2)).toEqual([]);
		expect(strokeDurations([0, 0], 2)).toEqual([0, 0]);
	});
});
