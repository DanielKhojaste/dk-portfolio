/**
 * Lines too long for their box slide to show the rest: wait at the start, glide left until the end
 * shows, wait on the end, fade back to the start, repeat. Lines that fit don't move, and nothing
 * moves with reduced motion (the line is cut with an ellipsis instead, in CSS).
 *
 * Markup: `<span data-marquee><span>Text</span></span>`. The outer box is the visible width
 * (overflow hidden); the inner span is the text that moves. The outer one gets `.is-moving` while it
 * slides (for the fade at its right edge).
 */
import { gsap } from "gsap";

export interface MarqueeTiming {
	/** Slide speed, px a second. */
	speed: number;
	/** Seconds to wait at each end. */
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
	return { distance, duration: Math.max(1.4, distance / speed) };
}

export function setupMarquee(
	root: ParentNode,
	timing: MarqueeTiming,
	reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches,
) {
	const boxes = [...root.querySelectorAll<HTMLElement>("[data-marquee]")];
	const runs = new Map<HTMLElement, gsap.core.Timeline>();

	const fit = () => {
		for (const box of boxes) {
			const text = box.firstElementChild as HTMLElement | null;
			if (!text) continue;
			runs.get(box)?.kill();
			runs.delete(box);
			gsap.set(text, { x: 0, opacity: 1 });
			const { distance, duration } = marqueeSlide(text.scrollWidth, box.clientWidth, timing.speed);
			const moving = distance > 0 && !reducedMotion;
			box.classList.toggle("is-moving", moving);
			if (!moving) continue;
			runs.set(
				box,
				gsap
					.timeline({ repeat: -1 })
					.to(text, { x: -distance, duration, ease: "sine.inOut" }, timing.wait)
					.to(text, { opacity: 0, duration: timing.fade, ease: "power1.in" }, `+=${timing.wait}`)
					.set(text, { x: 0 })
					.to(text, { opacity: 1, duration: timing.fade, ease: "power1.out" }),
			);
		}
	};

	fit();
	document.fonts?.ready.then(fit);
	// Measure again when the width changes (resize, rotation), once it settles.
	let timer: ReturnType<typeof setTimeout> | undefined;
	const observer = new ResizeObserver(() => {
		clearTimeout(timer);
		timer = setTimeout(fit, 150);
	});
	for (const box of boxes) observer.observe(box);
	return { fit, runs };
}
