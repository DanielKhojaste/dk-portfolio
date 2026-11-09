/**
 * On phones and tablets the logo sits over the page as you scroll, and runs into the text under
 * it. So there, it tucks away once you scroll down past the top of the page, and comes back as
 * soon as you scroll up (or reach the top again). On wider screens it always stays.
 */
export interface LogoHideOptions {
	/** Where it applies: a media query. Default: phones and tablets (the menu-button layout). */
	query?: string;
	/** How far down (px) before it can tuck away. */
	after?: number;
	/** How far (px) the page must move in one direction before it reacts, so jitter is ignored. */
	tolerance?: number;
}

type Win = Pick<Window, "scrollY" | "addEventListener" | "matchMedia">;

export function setupLogoHide(
	logo: HTMLElement,
	{ query = "(max-width: 1023px)", after = 80, tolerance = 8 }: LogoHideOptions = {},
	win: Win = window,
) {
	const small = win.matchMedia(query);
	let last = win.scrollY;
	const tuck = (hidden: boolean) => logo.classList.toggle("is-tucked", hidden);

	const update = () => {
		const y = win.scrollY;
		if (!small.matches || y < after) {
			tuck(false);
			last = y;
			return;
		}
		if (Math.abs(y - last) < tolerance) return;
		tuck(y > last);
		last = y;
	};

	win.addEventListener("scroll", update, { passive: true });
	small.addEventListener?.("change", update);
	// Reaching it with the keyboard always brings it back.
	logo.addEventListener("focus", () => tuck(false));
	update();
	return { update };
}
