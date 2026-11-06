/**
 * The side nav follows the section you're on: that link gets `aria-current` and its DivineFlow
 * underline draws out; the previous one draws back in. Underlines are mounted the first time they're
 * needed and only run while showing. On the first section (the hero) the whole nav is hidden.
 */
import { mountDivineFlow } from "./divine-flow";
import {
	underlineController,
	type UnderlineController,
	type UnderlineTiming,
} from "./menu-underlines";
import { trackSections } from "./sections";

export function setupSideNav(root: Document, timing: UnderlineTiming, labelOut = timing.out) {
	const nav = root.querySelector<HTMLElement>("[data-side-nav]");
	if (!nav) return null;
	const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>("[data-side-nav-link]"));
	const underlines = new Map<string, UnderlineController>();
	for (const link of links) {
		const el = link.querySelector<HTMLElement>("[data-divine-flow]");
		if (el)
			underlines.set(
				link.dataset.sideNavLink!,
				underlineController(() => mountDivineFlow(el), timing),
			);
	}

	// Nothing to draw while the nav is hidden (phones and tablets use the menu).
	const visible = () => nav.getClientRects().length > 0 && !nav.hasAttribute("data-on-hero");
	const first = links[0]?.dataset.sideNavLink;

	let active = "";
	const leaving = new Map<HTMLElement, number>();
	const select = (id: string) => {
		for (const link of links) {
			const current = link.dataset.sideNavLink === id;
			if (!current && link.hasAttribute("aria-current")) {
				// Empty the old label at the underline's pace, not the hover's (see SideNav.astro).
				link.setAttribute("data-leaving", "");
				clearTimeout(leaving.get(link));
				leaving.set(
					link,
					window.setTimeout(() => link.removeAttribute("data-leaving"), labelOut * 1000),
				);
			}
			if (current) {
				link.removeAttribute("data-leaving");
				link.setAttribute("aria-current", "true");
			} else link.removeAttribute("aria-current");
		}
		nav.toggleAttribute("data-on-hero", id === first);
		if (id === active) return;
		underlines.get(active)?.hide();
		active = id;
		if (visible()) underlines.get(id)?.show();
	};

	root.addEventListener("section:change", (event) => select((event as CustomEvent<string>).detail));
	// Coming back from the menu layout (resizing up to desktop): draw the current underline.
	addEventListener("resize", () => {
		if (visible()) underlines.get(active)?.show();
		else underlines.get(active)?.hide();
	});
	trackSections(root);
	return { select };
}
