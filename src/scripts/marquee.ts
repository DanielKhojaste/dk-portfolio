/**
 * Lines too long for their box slide to show the rest, at a steady (linear) pace.
 *
 * Which lines: worked out automatically. Any line whose text is wider than its box is marked
 * `.is-overflowing` (cut off with a fade at its right edge); lines that fit never move. This is
 * measured again when the box changes size and once the fonts load.
 *
 * When: a line only moves when its card (`[data-marquee-trigger]`) is hovered or focused. One run
 * is: a short pause, every long line in the card slides left until its end shows, a pause on the
 * end, then the lines fade back to the start. Leaving the card doesn't stop a run: it finishes on
 * its own and then rests at the start. Still hovered at the end of a run, it goes again.
 * Touch screens have no hover, so there a card runs once each time it scrolls into view.
 * With reduced motion nothing moves (the lines end in an ellipsis instead, in CSS).
 *
 * Markup: `<a data-marquee-trigger> … <span data-marquee><span>Text</span></span> … </a>`. The outer
 * span is the visible width (overflow hidden); the inner one is the text that moves.
 */
import { gsap } from "gsap";

export interface MarqueeTiming {
	/** Slide speed, px a second. */
	speed: number;
	/** Slide speed on phones and tablets (up to 1023px wide), px a second: the text is smaller there. */
	mobileSpeed: number;
	/** Seconds from the hover to the first move. */
	start: number;
	/** Seconds to rest on the end before fading back. */
	wait: number;
	/** Seconds for each half of the fade back to the start. */
	fade: number;
}

/** Extra px past the end, so the last letter clears the fade at the right edge. */
export const MARQUEE_PAD = 16;

/** How far a line slides (px, 0 if it fits) and how long the slide takes (s). */
export function marqueeSlide(textWidth: number, boxWidth: number, speed: number) {
	const over = textWidth - boxWidth;
	if (over <= 1) return { distance: 0, duration: 0 };
	const distance = over + MARQUEE_PAD;
	return { distance, duration: distance / speed };
}

export function setupMarquee(
	root: ParentNode,
	timing: MarqueeTiming,
	{
		reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches,
		canHover = matchMedia("(hover: hover) and (pointer: fine)").matches,
	} = {},
) {
	const cards = [...root.querySelectorAll<HTMLElement>("[data-marquee-trigger]")];
	const mobile = matchMedia("(max-width: 1023px)");
	const speed = () => (mobile.matches ? timing.mobileSpeed : timing.speed);
	const players = cards.map((card) => {
		const boxes = [...card.querySelectorAll<HTMLElement>("[data-marquee]")];
		let run: gsap.core.Timeline | null = null;
		let hovered = false;

		/** Marks the lines that don't fit; returns each one's slide. */
		const measure = () =>
			boxes.flatMap((box) => {
				const text = box.firstElementChild as HTMLElement | null;
				if (!text) return [];
				const slide = marqueeSlide(text.scrollWidth, box.clientWidth, speed());
				box.classList.toggle("is-overflowing", slide.distance > 0);
				return slide.distance > 0 ? [{ text, ...slide }] : [];
			});

		const play = () => {
			if (run || reducedMotion) return;
			const lines = measure();
			if (!lines.length) return;
			const texts = lines.map((l) => l.text);
			const tl = gsap.timeline({
				onComplete: () => {
					run = null;
					if (hovered) play();
				},
			});
			// Every long line slides at the same speed; the card waits for the longest one.
			for (const { text, distance, duration } of lines) {
				tl.to(text, { x: -distance, duration, ease: "none" }, timing.start);
			}
			tl.to(texts, { opacity: 0, duration: timing.fade, ease: "power1.in" }, `+=${timing.wait}`)
				.set(texts, { x: 0 })
				.to(texts, { opacity: 1, duration: timing.fade, ease: "power1.out" });
			run = tl;
		};

		const enter = () => {
			hovered = true;
			play();
		};
		// Leaving doesn't stop a run; it just won't start another.
		const leave = () => {
			hovered = false;
		};

		if (canHover) {
			card.addEventListener("pointerenter", enter);
			card.addEventListener("pointerleave", leave);
		}
		card.addEventListener("focusin", enter);
		card.addEventListener("focusout", leave);

		return { card, measure, play, isRunning: () => run !== null };
	});

	// Measure now, once the fonts are in, and whenever a card changes size.
	const measureAll = () => players.forEach((p) => p.measure());
	measureAll();
	document.fonts?.ready.then(measureAll);
	let timer: ReturnType<typeof setTimeout> | undefined;
	const resized = new ResizeObserver(() => {
		clearTimeout(timer);
		timer = setTimeout(measureAll, 150);
	});
	cards.forEach((card) => resized.observe(card));

	// Touch screens: run a card once each time it comes into view.
	if (!canHover && !reducedMotion) {
		const seen = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) players.find((p) => p.card === entry.target)?.play();
				}
			},
			{ threshold: 0.75 },
		);
		cards.forEach((card) => seen.observe(card));
	}

	return players;
}
