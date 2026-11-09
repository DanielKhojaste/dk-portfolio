/**
 * The hero's scroll prompt: fades in once you've been on the hero for a few seconds without
 * scrolling, and goes away as soon as you scroll. Back at the top, it comes back.
 */

/** The bits of `window` this needs (so tests can pass a fake). */
export interface HintWindow {
	readonly scrollY: number;
	addEventListener(type: "scroll", listener: () => void, options?: AddEventListenerOptions): void;
	setTimeout(handler: () => void, ms: number): unknown;
}

export function setupScrollHint(
	hint: HTMLElement,
	{ delay }: { delay: number },
	win: HintWindow = window,
) {
	const atTop = () => win.scrollY < 40;
	let waited = false;
	const update = () => hint.classList.toggle("is-shown", waited && atTop());
	win.setTimeout(() => {
		waited = true;
		update();
	}, delay * 1000);
	win.addEventListener("scroll", update, { passive: true });
	update();
	return { update };
}
