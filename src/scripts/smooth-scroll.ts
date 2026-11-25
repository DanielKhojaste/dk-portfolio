/**
 * Smooth scrolling with GSAP ScrollSmoother: the page keeps its normal scrollbar and scrolls freely,
 * but glides to a stop instead of stopping dead. In-page links (#about, #projects…) glide to their
 * section too. Off for reduced motion, and on touch screens unless `smoothTouch` is set.
 *
 * Needs the page wrapped as #smooth-wrapper > #smooth-content (see pages/index.astro). Anything fixed
 * (header, side nav, menu, background glow) must stay outside the wrapper.
 */
import { gsap } from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

export interface SmoothScrollSettings {
	smooth: number;
	smoothTouch: number;
}

export function setupSmoothScroll(
	{ smooth, smoothTouch }: SmoothScrollSettings,
	root: Document = document,
	reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches,
): ScrollSmoother | null {
	if (reducedMotion || smooth <= 0 || !root.getElementById("smooth-wrapper")) return null;

	const smoother = ScrollSmoother.create({
		wrapper: "#smooth-wrapper",
		content: "#smooth-content",
		smooth,
		smoothTouch: smoothTouch > 0 ? smoothTouch : false,
		effects: false,
	});
	// The smoother does the easing; CSS smooth scrolling on top of it would fight it.
	root.documentElement.style.scrollBehavior = "auto";
	// Scroll-triggered animations made before the smoother need to measure again.
	ScrollTrigger.refresh();

	// Tabbing to a link, find-in-page or scrollIntoView scroll the wrapper itself (it hides overflow
	// but can still be scrolled), which would knock the content out of line. Hand that scroll to the
	// smoother instead.
	const wrapper = smoother.wrapper();
	wrapper.addEventListener("scroll", () => {
		const by = wrapper.scrollTop;
		if (!by) return;
		wrapper.scrollTop = 0;
		smoother.scrollTop(smoother.scrollTop() + by);
	});

	// Where a section starts, in scroll px: its distance from the top of the content (both move
	// together, so the smoother's current offset cancels out), up to the furthest the page scrolls.
	// Worked out here rather than with scrollTo(element): measuring an element makes the smoother
	// jump the content to it for a frame, which shows as a flash of the destination before the glide.
	const content = smoother.content();
	const sectionTop = (el: Element) => {
		const top = el.getBoundingClientRect().top - content.getBoundingClientRect().top;
		const max = ScrollTrigger.maxScroll(window);
		return Math.max(0, Math.min(top, max));
	};

	// Focus the section once the glide gets there. Focusing it any earlier, even with
	// preventScroll, makes the browser bring it into view for a frame: a flash of the destination
	// before the glide (and on touch screens it can scroll the page for real). If the visitor
	// scrolls on their own before it arrives, it isn't focused at all.
	let arrival = 0;
	const focusOnArrival = (target: HTMLElement, y: number) => {
		cancelAnimationFrame(arrival);
		const started = performance.now();
		let interrupted = false;
		const stop = () => (interrupted = true);
		const events = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
		events.forEach((e) => root.addEventListener(e, stop, { once: true, passive: true }));
		const done = () => events.forEach((e) => root.removeEventListener(e, stop));
		const check = () => {
			if (interrupted) return done();
			const shown = -new DOMMatrix(getComputedStyle(content).transform).m42;
			if (Math.abs(shown - y) < 2 || performance.now() - started > 4000) {
				done();
				target.focus({ preventScroll: true });
				return;
			}
			arrival = requestAnimationFrame(check);
		};
		arrival = requestAnimationFrame(check);
	};

	root.addEventListener("click", (event) => {
		const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
		const id = link?.getAttribute("href")?.slice(1);
		const target = id ? root.getElementById(id) : null;
		if (!target) return;
		event.preventDefault();
		history.pushState(null, "", `#${id}`);
		// Move keyboard focus there too, so the next Tab carries on from that section.
		if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
		// Let the menu close (and give scrolling back) first, then glide.
		requestAnimationFrame(() => {
			const y = sectionTop(target);
			smoother.scrollTo(y, true);
			focusOnArrival(target, y);
		});
	});

	return smoother;
}
