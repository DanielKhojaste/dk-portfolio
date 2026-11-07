// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from "vitest";
import { animation } from "../../site.config";

let aboutTimeline: typeof import("../about").aboutTimeline;

beforeAll(async () => {
	// GSAP's ScrollTrigger asks for matchMedia when it loads; jsdom doesn't have it.
	window.matchMedia = ((query: string) => ({
		matches: false,
		media: query,
		addEventListener() {},
		removeEventListener() {},
		addListener() {},
		removeListener() {},
	})) as unknown as typeof window.matchMedia;
	({ aboutTimeline } = await import("../about"));
});

describe("About entrance", () => {
	it("slides the facts in alongside the red words, not after them, and starts early", () => {
		document.body.innerHTML = `
			<section>
				<span class="about__word">I</span><span class="about__word">build</span>
				<span class="about__word"><span data-fill>fast</span></span>
				<span class="about__word"><span data-fill>sharp</span></span>
				<dl data-about-rest></dl>
			</section>`;
		const t = animation.about;
		const tl = aboutTimeline(document.querySelector("section")!, t);
		const [, fills, rest] = tl.getChildren(false, true, false);
		// The facts start while the red words are still filling in.
		expect(rest!.startTime()).toBeLessThan(fills!.endTime());
		expect(rest!.startTime()).toBeCloseTo(fills!.startTime() + t.restAfter);
		// The section starts it once its top is in the lower part of the screen.
		expect(t.start).toBeGreaterThanOrEqual(0.75);
	});
});
