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

	root.addEventListener("click", (event) => {
		const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
		const id = link?.getAttribute("href")?.slice(1);
		const target = id ? root.getElementById(id) : null;
		if (!target) return;
		event.preventDefault();
		history.pushState(null, "", `#${id}`);
		// Let the menu close (and give scrolling back) first.
		requestAnimationFrame(() => smoother.scrollTo(target, true, "top top"));
		// Move keyboard focus there too, so the next Tab carries on from that section.
		if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
		target.focus({ preventScroll: true });
	});

	return smoother;
}
