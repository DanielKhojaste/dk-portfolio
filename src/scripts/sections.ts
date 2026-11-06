/**
 * The one-pager's sections: `trackSections()` announces the one in view with a `section:change`
 * event (detail: its id). The side nav listens to it.
 */

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
