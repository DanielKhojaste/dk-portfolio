/**
 * About's entrance (GSAP): when the section comes into view, the headline's words light up one after
 * another, then each red word fills in from the left with a glow, then the text and facts slide in.
 * Runs once. Reduced motion shows everything straight away.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export interface AboutTiming {
	delay: number;
	wordStagger: number;
	word: number;
	highlight: number;
	highlightStagger: number;
	rest: number;
}

const DIM = "rgb(245 236 236 / 0.14)";

export function aboutTimeline(section: HTMLElement, t: AboutTiming): gsap.core.Timeline {
	const words = section.querySelectorAll<HTMLElement>(".about__word");
	const highlights = section.querySelectorAll<HTMLElement>("[data-highlight]");
	const rest = section.querySelectorAll<HTMLElement>("[data-about-rest]");

	const tl = gsap.timeline({ paused: true, delay: t.delay });
	tl.fromTo(
		words,
		{ color: DIM, opacity: 0.6 },
		{ color: "#ffffff", opacity: 1, duration: t.word, stagger: t.wordStagger, ease: "power2.out" },
	)
		.fromTo(
			highlights,
			{ backgroundSize: "0% 100%", filter: "drop-shadow(0 0 0px rgb(230 40 55 / 0))" },
			{
				backgroundSize: "100% 100%",
				filter: "drop-shadow(0 0 22px rgb(230 40 55 / 0.45))",
				duration: t.highlight,
				stagger: t.highlightStagger,
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
