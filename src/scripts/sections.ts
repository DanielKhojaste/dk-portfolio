/**
 * The one-pager's sections: which one you're on, and moving between them one at a time.
 *
 * - `trackSections()` announces the section in view with a `section:change` event (detail: its id).
 * - `setupPaging()` makes a wheel flick, swipe, arrow key, Page Up/Down or space move exactly one
 *   section with a smooth GSAP scroll, so nobody flies past the page; in-page links glide too. It is
 *   only on while every section fits on the screen; otherwise the page scrolls normally, so nothing is
 *   ever skipped.
 */
import { gsap } from "gsap";
import { Observer } from "gsap/Observer";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(Observer, ScrollToPlugin);

export const SECTION_SELECTOR = "main > section[id]";

/** Index of the section in view: the last one whose top is above the middle of the screen. */
export function sectionAt(tops: readonly number[], scrollY: number, viewport: number): number {
	const middle = scrollY + viewport / 2;
	let index = 0;
	tops.forEach((top, i) => {
		if (top <= middle) index = i;
	});
	return index;
}

/**
 * Scroll positions paging stops at: the top of each section, plus the very bottom of the page when
 * there's more below the last section (the footer).
 */
export function pageStops(tops: readonly number[], maxScroll: number): number[] {
	const stops = tops.map((top) => Math.min(top, maxScroll));
	const last = stops[stops.length - 1] ?? 0;
	if (maxScroll - last > 2) stops.push(maxScroll);
	return stops.filter((stop, i) => i === 0 || stop - stops[i - 1]! > 2);
}

/** The stop nearest to `scrollY`. */
export function nearestStop(stops: readonly number[], scrollY: number): number {
	let best = 0;
	stops.forEach((stop, i) => {
		if (Math.abs(stop - scrollY) < Math.abs(stops[best]! - scrollY)) best = i;
	});
	return best;
}

const sectionsIn = (root: Document) =>
	Array.from(root.querySelectorAll<HTMLElement>(SECTION_SELECTOR));

const announce = (root: Document, id: string) =>
	root.dispatchEvent(new CustomEvent("section:change", { detail: id }));

export function trackSections(root: Document = document) {
	const sections = sectionsIn(root);
	let current = "";
	let frame = 0;
	const check = () => {
		frame = 0;
		const i = sectionAt(
			sections.map((s) => s.offsetTop),
			window.scrollY,
			window.innerHeight,
		);
		const id = sections[i]?.id ?? "";
		if (id !== current) {
			current = id;
			announce(root, id);
		}
	};
	const schedule = () => (frame ||= requestAnimationFrame(check));
	addEventListener("scroll", schedule, { passive: true });
	addEventListener("resize", schedule);
	check();
	return {
		get current() {
			return current;
		},
	};
}

export interface PagingSettings {
	duration: number;
	ease: string;
}

export function setupPaging(
	{ duration, ease }: PagingSettings,
	root: Document = document,
	reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches,
) {
	const sections = sectionsIn(root);
	const html = root.documentElement;
	let moving = false;
	let observer: Observer | null = null;

	const maxScroll = () => html.scrollHeight - window.innerHeight;
	const stops = () =>
		pageStops(
			sections.map((s) => s.offsetTop),
			maxScroll(),
		);

	const glide = (y: number) => {
		if (moving) return;
		moving = true;
		gsap.to(window, {
			scrollTo: { y, autoKill: false },
			duration: reducedMotion ? 0 : duration,
			ease,
			overwrite: true,
			// A short cool-down, so one long trackpad swipe doesn't carry on into a second section.
			onComplete: () => void gsap.delayedCall(0.25, () => (moving = false)),
		});
	};
	const step = (by: 1 | -1) => {
		const all = stops();
		const next = nearestStop(all, window.scrollY) + by;
		if (next >= 0 && next < all.length) glide(all[next]!);
	};

	const fits = () => sections.every((s) => s.offsetHeight <= window.innerHeight + 2);
	const enable = () => {
		// GSAP does the smoothing; CSS smooth scrolling would fight it.
		html.style.scrollBehavior = "auto";
		observer = Observer.create({
			target: window,
			type: "wheel,touch",
			wheelSpeed: -1,
			tolerance: 12,
			preventDefault: true,
			// The menu scrolls on its own.
			ignore: "[data-menu]",
			onUp: () => step(1),
			onDown: () => step(-1),
		});
	};
	const disable = () => {
		observer?.kill();
		observer = null;
		html.style.scrollBehavior = "";
	};
	const sync = () => {
		if (fits()) {
			if (!observer) enable();
		} else disable();
	};
	sync();
	let timer = 0;
	addEventListener("resize", () => {
		clearTimeout(timer);
		timer = window.setTimeout(sync, 150);
	});
	void root.fonts?.ready.then(sync);

	root.addEventListener("keydown", (event) => {
		if (
			!observer ||
			html.hasAttribute("data-menu-open") ||
			event.altKey ||
			event.ctrlKey ||
			event.metaKey
		)
			return;
		const target = event.target as HTMLElement;
		if (target.closest("input, textarea, select, [contenteditable]")) return;
		const down =
			event.key === "ArrowDown" ||
			event.key === "PageDown" ||
			(event.key === " " && !event.shiftKey);
		const up =
			event.key === "ArrowUp" || event.key === "PageUp" || (event.key === " " && event.shiftKey);
		if (!down && !up) return;
		event.preventDefault();
		step(down ? 1 : -1);
	});

	// In-page links (side nav, menu, hero buttons) glide to their section instead of jumping.
	root.addEventListener("click", (event) => {
		if (!observer) return;
		const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
		const section = link && sections.find((s) => `#${s.id}` === link.getAttribute("href"));
		if (!section) return;
		event.preventDefault();
		history.pushState(null, "", `#${section.id}`);
		// Let the menu close (and give scrolling back) first.
		requestAnimationFrame(() => glide(Math.min(section.offsetTop, maxScroll())));
	});

	return {
		get enabled() {
			return observer !== null;
		},
		step,
	};
}
