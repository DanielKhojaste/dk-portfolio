/**
 * Phones and tablets (the menu-button layout): the header sits over the page and runs into the text
 * under it, so past the hero it gets out of the way.
 *
 *   - The logo only shows in the hero. Anywhere further down it stays hidden, whichever way you
 *     scroll.
 *   - The menu button shows in the hero, hides as you scroll down past it, and comes back as soon
 *     as you scroll up a little. It always shows while the menu is open.
 *
 * Reaching either with the keyboard brings it back. On wider screens both always stay.
 */
export interface HeaderHideOptions {
	/** Where it applies: a media query. Default: the menu-button layout (see Header.astro). */
	query?: string;
	/** Where the hero ends (px scrolled). Default: the hero's height, less the header's. */
	heroEnd?: () => number;
	/** How far (px) the page must move in one direction before the button reacts (ignores jitter). */
	tolerance?: number;
}

export interface HeaderParts {
	logo: HTMLElement;
	button: HTMLElement;
	hero: HTMLElement;
}

type Win = Pick<Window, "scrollY" | "addEventListener" | "matchMedia">;

export const HEADER_HIDE_QUERY = "(max-width: 1023px), (max-aspect-ratio: 115/100)";

export function setupHeaderHide(
	{ logo, button, hero }: HeaderParts,
	{
		query = HEADER_HIDE_QUERY,
		heroEnd = () => hero.offsetTop + hero.offsetHeight - 100,
		tolerance = 8,
	}: HeaderHideOptions = {},
	win: Win = window,
) {
	const small = win.matchMedia(query);
	let last = win.scrollY;
	let buttonTucked = false;
	const tuck = (el: HTMLElement, hidden: boolean) => el.classList.toggle("is-tucked", hidden);
	const menuOpen = () => button.getAttribute("aria-expanded") === "true";

	const update = () => {
		const y = win.scrollY;
		const inHero = y < heroEnd();
		if (!small.matches || inHero) {
			tuck(logo, false);
			tuck(button, (buttonTucked = false));
			last = y;
			return;
		}
		tuck(logo, logo !== document.activeElement);
		if (menuOpen()) {
			tuck(button, (buttonTucked = false));
			last = y;
			return;
		}
		if (Math.abs(y - last) < tolerance) {
			tuck(button, buttonTucked);
			return;
		}
		buttonTucked = y > last && button !== document.activeElement;
		tuck(button, buttonTucked);
		last = y;
	};

	win.addEventListener("scroll", update, { passive: true });
	small.addEventListener?.("change", update);
	logo.addEventListener("focus", () => tuck(logo, false));
	logo.addEventListener("blur", update);
	button.addEventListener("focus", () => tuck(button, (buttonTucked = false)));
	update();
	return { update };
}
