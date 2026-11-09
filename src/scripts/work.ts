/**
 * The Work section's rows. Each row is a button (the project's name) and a panel under it (the
 * screenshot and details). On desktop, hovering a row opens it and moving off closes it. Clicking
 * (or tapping, or Enter/Space) pins a row open: it stays open when the pointer leaves, until it's
 * clicked again. Rows sliding under a still pointer while the page scrolls don't count as hovers. One row is pinned at a time; pinning another closes the last. On touch screens,
 * with no hover, that's the only way to open one. Opening and closing animate the panel's height
 * (GSAP), and the page is told it got taller or shorter so scrolling and the side nav stay right.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FILL_EMPTY, FILL_FULL } from "./about";

gsap.registerPlugin(ScrollTrigger);

export interface WorkTiming {
	open: number;
	close: number;
	highlight: number;
	rows: number;
	rowStagger: number;
}

/** How a panel opens or closes; GSAP in the page, a stub in tests. */
export type AnimatePanel = (panel: HTMLElement, open: boolean, done: () => void) => void;

export interface RowOptions {
	/** Whether the device hovers (a mouse); checked on every event, so it follows changes. */
	canHover: () => boolean;
	animate: AnimatePanel;
	/** Called once a panel has finished opening or closing. */
	onResize?: () => void;
	/**
	 * Whether the page is being scrolled right now. Rows moving under a still pointer while you
	 * scroll aren't hovers: they don't open or close until the pointer itself moves.
	 */
	isScrolling?: () => boolean;
	/** Where to listen for the pointer moving again (the document in the page). */
	pointerTarget?: Pick<Document, "addEventListener" | "removeEventListener">;
}

export function setupRows(
	rows: HTMLElement[],
	{ canHover, animate, onResize, isScrolling = () => false, pointerTarget = document }: RowOptions,
) {
	const toggle = (row: HTMLElement) => row.querySelector<HTMLElement>("[data-work-toggle]")!;
	const panel = (row: HTMLElement) => row.querySelector<HTMLElement>("[data-work-panel]")!;
	const isOpen = (row: HTMLElement) => row.classList.contains("is-open");
	const isPinned = (row: HTMLElement) => row.classList.contains("is-pinned");

	// A closed panel is out of reach: its links can't be tabbed to or read until it opens.
	for (const row of rows) panel(row).inert = !isOpen(row);

	const set = (row: HTMLElement, open: boolean) => {
		if (isOpen(row) === open) return;
		row.classList.toggle("is-open", open);
		toggle(row).setAttribute("aria-expanded", String(open));
		panel(row).inert = !open;
		animate(panel(row), open, () => onResize?.());
	};

	const pin = (row: HTMLElement, pinned: boolean) => row.classList.toggle("is-pinned", pinned);

	/**
	 * While scrolling, wait for the pointer to actually move before acting on a hover, then open the
	 * row if the pointer is over it and close it if not. Without this, scrolling past the last
	 * project closes it as it slides out from under the pointer; the page gets shorter under you
	 * and the scroll jumps.
	 */
	const waiting = new Map<HTMLElement, (event: Event) => void>();
	const stopWaiting = (row: HTMLElement) => {
		const handler = waiting.get(row);
		if (handler) pointerTarget.removeEventListener("pointermove", handler);
		waiting.delete(row);
	};
	const hover = (row: HTMLElement, over: boolean) => {
		stopWaiting(row);
		if (!canHover() || (!over && isPinned(row))) return;
		if (!isScrolling()) return set(row, over);
		const handler = (event: Event) => {
			stopWaiting(row);
			const inside = row.contains(event.target as Node);
			if (inside || !isPinned(row)) set(row, inside);
		};
		waiting.set(row, handler);
		pointerTarget.addEventListener("pointermove", handler);
	};

	for (const row of rows) {
		row.addEventListener("pointerenter", () => hover(row, true));
		row.addEventListener("pointerleave", () => hover(row, false));
		toggle(row).addEventListener("click", () => {
			if (isPinned(row)) {
				pin(row, false);
				set(row, false);
				return;
			}
			for (const other of rows) {
				if (other === row) continue;
				pin(other, false);
				set(other, false);
			}
			pin(row, true);
			set(row, true);
		});
	}

	return { set, pin };
}

export function setupWork(
	section: HTMLElement,
	timing: WorkTiming,
	reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches,
) {
	const hover = matchMedia("(hover: hover) and (pointer: fine)");
	const rows = [...section.querySelectorAll<HTMLElement>("[data-work-row]")];

	// The last time the page scrolled (wheel, keys, scrollbar or the smooth scroller).
	let lastScroll = -Infinity;
	const scrolled = () => (lastScroll = performance.now());
	addEventListener("wheel", scrolled, { passive: true });
	addEventListener("scroll", scrolled, { passive: true });

	setupRows(rows, {
		canHover: () => hover.matches,
		isScrolling: () => performance.now() - lastScroll < 200,
		animate: (panel, open, done) =>
			gsap.to(panel, {
				height: open ? "auto" : 0,
				duration: reducedMotion ? 0 : open ? timing.open : timing.close,
				ease: open ? "power3.out" : "power2.inOut",
				overwrite: true,
				onComplete: done,
			}),
		onResize: () => ScrollTrigger.refresh(),
	});

	if (reducedMotion) return;

	// On arrival: the headline's red word wipes in (like About's) and the rows rise in.
	const fills = section.querySelectorAll<HTMLElement>("[data-fill]");
	gsap.set(fills, { clipPath: FILL_EMPTY });
	const list = section.querySelector<HTMLElement>("[data-work-list]");
	gsap.set(rows, { opacity: 0, y: 30 });
	ScrollTrigger.create({
		trigger: section,
		start: "top 75%",
		once: true,
		onEnter: () => {
			gsap.to(fills, {
				clipPath: FILL_FULL,
				duration: timing.highlight,
				delay: 0.2,
				ease: "power3.inOut",
			});
			gsap.to(rows, {
				opacity: 1,
				y: 0,
				duration: timing.rows,
				stagger: timing.rowStagger,
				delay: 0.15,
				ease: "power3.out",
				clearProps: "transform",
			});
		},
	});
	return list;
}
