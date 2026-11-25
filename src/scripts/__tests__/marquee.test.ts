import { describe, expect, it } from "vitest";
import { MARQUEE_PAD, marqueeSlide } from "../marquee";

describe("marqueeSlide", () => {
	it("doesn't move a line that fits", () => {
		expect(marqueeSlide(200, 300, 100)).toEqual({ distance: 0, duration: 0 });
		expect(marqueeSlide(300.5, 300, 100)).toEqual({ distance: 0, duration: 0 });
	});

	it("slides a long line past its end, at the given speed", () => {
		expect(marqueeSlide(900, 300, 100)).toEqual({
			distance: 600 + MARQUEE_PAD,
			duration: (600 + MARQUEE_PAD) / 100,
		});
	});

	it("never slides faster than 1.4 seconds, however short the overflow", () => {
		expect(marqueeSlide(320, 300, 100).duration).toBe(1.4);
	});
});
