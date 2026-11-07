/**
 * The Work section's rows. Each row is a button (the project's name) and a panel under it (the
 * screenshot and details). On desktop, hovering a row opens it and moving off closes it. Clicking
 * (or tapping, or Enter/Space) pins a row open: it stays open when the pointer leaves, until it's
 * clicked again. One row is pinned at a time; pinning another closes the last. On touch screens,
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
}

export function setupRows(rows: HTMLElement[], { canHover, animate, onResize }: RowOptions) {
	const toggle = (row: HTMLElement) => row.querySelector<HTMLElement>("[data-work-toggle]")!;
	const panel = (row: HTMLElement) => row.querySelector<HTMLElement>("[data-work-panel]")!;
	const isOpen = (row: HTMLElement) => row.classList.contains("is-open");
	const isPinned = (row: HTMLElement) => row.classList.contains("is-pinned");

	const set = (row: HTMLElement, open: boolean) => {
		if (isOpen(row) === open) return;
		row.classList.toggle("is-open", open);
		toggle(row).setAttribute("aria-expanded", String(open));
		animate(panel(row), open, () => onResize?.());
	};

	const pin = (row: HTMLElement, pinned: boolean) => row.classList.toggle("is-pinned", pinned);

	for (const row of rows) {
		row.addEventListener("pointerenter", () => canHover() && set(row, true));
		row.addEventListener("pointerleave", () => canHover() && !isPinned(row) && set(row, false));
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

	setupRows(rows, {
		canHover: () => hover.matches,
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
