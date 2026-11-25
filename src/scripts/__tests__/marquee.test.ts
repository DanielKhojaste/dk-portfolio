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

	it("keeps the same pace for short and long overflows", () => {
		const short = marqueeSlide(320, 300, 50);
		const long = marqueeSlide(1200, 300, 50);
		expect(short.distance / short.duration).toBe(50);
		expect(long.distance / long.duration).toBe(50);
	});
});
