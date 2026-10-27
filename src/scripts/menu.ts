/** Header menu: open/close, focus handling, scroll lock and Esc. Markup lives in Menu.astro. */

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Index to move focus to when tabbing past either end of `count` items (wraps around). */
export function wrapFocusIndex(current: number, count: number, backwards: boolean): number {
	if (count <= 0) return -1;
	if (current < 0) return backwards ? count - 1 : 0;
	return (current + (backwards ? -1 : 1) + count) % count;
}

export interface MenuController {
	readonly isOpen: boolean;
	open(): void;
	close(options?: { restoreFocus?: boolean }): void;
	toggle(): void;
}

export function setupMenu(root: Document = document): MenuController | null {
	const button = root.querySelector<HTMLButtonElement>("[data-menu-button]");
	const menu = root.querySelector<HTMLElement>("[data-menu]");
	if (!button || !menu) return null;

	const html = root.documentElement;
	let isOpen = false;

	/** Everything outside the header and menu is inert while the menu is open. */
	const outside = () =>
		Array.from(root.body.children).filter(
			(el): el is HTMLElement =>
				el instanceof HTMLElement && !el.contains(button) && !el.contains(menu) && el !== menu,
		);

	/** Focus order while open: the header (logo, button) then the menu's links. */
	const focusables = () => [
		...Array.from(button.closest("header")?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []),
		...Array.from(menu.querySelectorAll<HTMLElement>(FOCUSABLE)),
	];

	function set(next: boolean, restoreFocus = true) {
		if (next === isOpen) return;
		isOpen = next;

		button!.setAttribute("aria-expanded", String(next));
		button!.setAttribute("aria-label", next ? "Close menu" : "Open menu");
		menu!.toggleAttribute("data-open", next);
		html.toggleAttribute("data-menu-open", next);
		for (const el of outside()) el.inert = next;

		// Lock scrolling without a layout jump where the scrollbar was.
		const scrollbar = window.innerWidth - html.clientWidth;
		html.style.overflow = next ? "hidden" : "";
		html.style.paddingRight = next && scrollbar > 0 ? `${scrollbar}px` : "";

		root.dispatchEvent(new CustomEvent(next ? "menu:open" : "menu:close"));

		if (next) {
			requestAnimationFrame(() => menu!.querySelector<HTMLElement>("[data-menu-link]")?.focus());
		} else if (restoreFocus) {
			button!.focus();
		}
	}

	button.addEventListener("click", () => set(!isOpen));

	root.addEventListener("keydown", (event) => {
		if (!isOpen) return;
		if (event.key === "Escape") {
			event.preventDefault();
			set(false);
			return;
		}
		if (event.key !== "Tab") return;
		const items = focusables();
		const current = items.indexOf(root.activeElement as HTMLElement);
		const atEdge = event.shiftKey ? current <= 0 : current === items.length - 1;
		if (current === -1 || atEdge) {
			event.preventDefault();
			items[wrapFocusIndex(current, items.length, event.shiftKey)]?.focus();
		}
	});

	// Following a section link closes the menu first, so the page can scroll to it.
	menu.addEventListener("click", (event) => {
		const link = (event.target as Element).closest("a");
		if (link && link.getAttribute("href")?.startsWith("#")) set(false, false);
	});

	return {
		get isOpen() {
			return isOpen;
		},
		open: () => set(true),
		close: ({ restoreFocus = true } = {}) => set(false, restoreFocus),
		toggle: () => set(!isOpen),
	};
}
