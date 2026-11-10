/**
 * The Skills section: picking a project in the filter lights up the tools it uses (the rest fade
 * back) and fills the names of the groups those tools are in. Hovering or focusing a logo names it
 * in its row. On arrival the headline's red word wipes in and the rows rise in.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FILL_EMPTY, FILL_FULL } from "./about";

gsap.registerPlugin(ScrollTrigger);

export interface SkillsTiming {
	highlight: number;
	rows: number;
	rowStagger: number;
}

/**
 * Where a hovered logo's name shows (site.config.ts: `skills.captionAt`):
 *   - "under":  right under the logo, centred on it
 *   - "above":  right over the logo, centred on it
 *   - "beside": to the left of the row's logos, level with the row
 */
export type CaptionAt = "under" | "above" | "beside";

interface Box {
	left: number;
	top: number;
	right: number;
	bottom: number;
}

export interface CaptionPlace {
	/** Where it is, relative to `box` (the caption's positioned parent). */
	left: number;
	top: number;
	/** Where it ended up: "under" and "above" swap when there's no room, "beside" falls back. */
	at: CaptionAt;
}

/** Space (px) kept between the caption and the logo, and between the caption and the window's edge. */
const GAP = 8;
const EDGE = 8;

/**
 * Works out where the caption goes, so it's always fully in the window: centred on the logo but
 * pushed in from the sides, flipped above or under when it would leave the top or bottom, and
 * "beside" only when it fits between the row's name and its logos (otherwise under).
 * All boxes are in window coordinates (getBoundingClientRect).
 */
export function placeCaption(
	at: CaptionAt,
	{
		logo,
		logos,
		box = logos,
		name,
		caption,
		view,
	}: {
		/** The hovered logo. */
		logo: Box;
		/** Around all the row's logos. */
		logos: Box;
		/** The caption's positioned parent (default: `logos`). */
		box?: Box;
		/** The row's name. */
		name: Box | null;
		caption: { width: number; height: number };
		view: { width: number; height: number; top?: number };
	},
): CaptionPlace {
	const { width: w, height: h } = caption;
	const viewTop = view.top ?? 0;

	if (at === "beside") {
		const left = logos.left - GAP * 2 - w;
		const room = name ? left >= name.right + GAP * 2 : left >= EDGE;
		if (room) {
			const rowMiddle = (logos.top + logos.bottom) / 2;
			return { left: left - box.left, top: rowMiddle - h / 2 - box.top, at };
		}
		at = "under";
	}

	const centre = (logo.left + logo.right) / 2;
	const x = Math.min(Math.max(centre - w / 2, EDGE), view.width - EDGE - w);
	const under = logo.bottom + GAP;
	const above = logo.top - GAP - h;
	let place: "under" | "above" = at;
	if (place === "under" && under + h > view.height - EDGE && above >= viewTop + EDGE)
		place = "above";
	if (place === "above" && above < viewTop + EDGE && under + h <= view.height - EDGE)
		place = "under";
	const y = place === "under" ? under : above;
	return { left: x - box.left, top: y - box.top, at: place };
}

/** Picks a project ("" for all): returns the names of the tools that light up. */
export function setupFilter(section: HTMLElement) {
	const picks = [...section.querySelectorAll<HTMLButtonElement>("[data-pick]")];
	const logos = [...section.querySelectorAll<HTMLElement>("[data-skill]")];
	const rows = [...section.querySelectorAll<HTMLElement>("[data-skill-row]")];

	const pick = (project: string) => {
		section.dataset.filter = project;
		picks.forEach((p) => p.setAttribute("aria-pressed", String(p.dataset.pick === project)));
		const uses = (el: HTMLElement) => !!project && el.dataset.used!.split("|").includes(project);
		logos.forEach((logo) => logo.classList.toggle("is-lit", uses(logo)));
		rows.forEach((row) => row.classList.toggle("is-lit", uses(row)));
		return logos.filter(uses).map((l) => l.dataset.skill!);
	};

	picks.forEach((p) => p.addEventListener("click", () => pick(p.dataset.pick!)));

	const at = () => (section.dataset.captionAt as CaptionAt | undefined) ?? "beside";
	for (const row of rows) {
		const caption = row.querySelector<HTMLElement>("[data-caption]");
		const box = caption?.parentElement;
		if (!caption || !box) continue;
		const name = row.querySelector<HTMLElement>(".skills__name");
		const rowLogos = [...row.querySelectorAll<HTMLElement>("[data-skill]")];
		// The box around the logos themselves (they sit at the right of their column).
		const around = () => {
			const r = rowLogos.map((l) => l.getBoundingClientRect());
			return {
				left: Math.min(...r.map((b) => b.left)),
				top: Math.min(...r.map((b) => b.top)),
				right: Math.max(...r.map((b) => b.right)),
				bottom: Math.max(...r.map((b) => b.bottom)),
			};
		};
		for (const logo of rowLogos) {
			// The name fades in at the site's hover pace and out again (CSS, .is-shown), placed so
			// it's always fully on screen (placeCaption).
			const show = () => {
				caption.textContent = logo.dataset.skill!;
				const place = placeCaption(at(), {
					logo: logo.getBoundingClientRect(),
					logos: around(),
					box: box.getBoundingClientRect(),
					name: name?.getBoundingClientRect() ?? null,
					caption: { width: caption.offsetWidth, height: caption.offsetHeight },
					view: { width: document.documentElement.clientWidth, height: innerHeight },
				});
				caption.style.left = `${place.left}px`;
				caption.style.top = `${place.top}px`;
				caption.dataset.at = place.at;
				caption.classList.add("is-shown");
			};
			const hide = () => caption.classList.remove("is-shown");
			logo.addEventListener("pointerenter", show);
			logo.addEventListener("focus", show);
			logo.addEventListener("pointerleave", hide);
			logo.addEventListener("blur", hide);
		}
	}

	pick("");
	return { pick };
}

export function setupSkills(
	section: HTMLElement,
	timing: SkillsTiming,
	reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches,
) {
	const filter = setupFilter(section);
	if (reducedMotion) return filter;

	const fills = section.querySelectorAll<HTMLElement>("[data-fill]");
	const rows = section.querySelectorAll<HTMLElement>("[data-skill-row]");
	gsap.set(fills, { clipPath: FILL_EMPTY });
	gsap.set(rows, { opacity: 0, y: 24 });
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
	return filter;
}
