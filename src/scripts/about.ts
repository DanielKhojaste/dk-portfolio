/**
 * About's entrance (GSAP): when the section comes into view, the headline's words light up one after
 * another, then each red word fills in from the left (its solid copy is wiped in with a clip-path),
 * then the facts slide in. The text under the headline is there from the start. Runs once. Reduced motion shows everything straight away.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export interface AboutTiming {
	delay: number;
	wordStagger: number;
	word: number;
	highlight: number;
	/** Pause between one red word finishing and the next starting. */
	highlightGap: number;
	rest: number;
}

const DIM = "rgb(245 236 236 / 0.14)";

/**
 * The red copy's clip: empty (its right edge pulled back to its left edge), then the whole word. The
 * sides reach just past the word's box so overhanging letters are covered, but no further: anything
 * more is time spent wiping across empty space, which reads as a delay before the fill starts.
 */
export const FILL_EMPTY = "inset(-30% 108% -30% -8%)";
export const FILL_FULL = "inset(-30% -8% -30% -8%)";

export function aboutTimeline(section: HTMLElement, t: AboutTiming): gsap.core.Timeline {
	const words = section.querySelectorAll<HTMLElement>(".about__word");
	const fills = section.querySelectorAll<HTMLElement>("[data-fill]");
	const rest = section.querySelectorAll<HTMLElement>("[data-about-rest]");

	const tl = gsap.timeline({ paused: true, delay: t.delay });
	tl.fromTo(
		words,
		{ color: DIM, opacity: 0.6 },
		{ color: "#ffffff", opacity: 1, duration: t.word, stagger: t.wordStagger, ease: "power2.out" },
	)
		.fromTo(
			fills,
			{ clipPath: FILL_EMPTY },
			{
				clipPath: FILL_FULL,
				duration: t.highlight,
				// One after another, with a short pause in between.
				stagger: t.highlight + t.highlightGap,
				ease: "power3.inOut",
			},
			// Each red word fills just after it has lit up.
			`-=${t.word * 0.4}`,
		)
		.fromTo(
			rest,
			{ opacity: 0, y: 16 },
			{ opacity: 1, y: 0, duration: t.rest, stagger: 0.12, ease: "power3.out" },
			`-=${t.highlight * 0.6}`,
		);
	return tl;
}

export function revealAbout(
	section: HTMLElement,
	timing: AboutTiming,
	reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches,
) {
	if (reducedMotion) return null;
	const tl = aboutTimeline(section, timing);
	// The fromTo tweens have already set the dim start state, so nothing flashes before it plays.
	ScrollTrigger.create({
		trigger: section,
		start: "top 60%",
		once: true,
		onEnter: () => void tl.play(0),
	});
	return tl;
}
