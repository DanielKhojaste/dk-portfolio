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

	for (const row of rows) {
		const caption = row.querySelector<HTMLElement>("[data-caption]");
		if (!caption) continue;
		for (const logo of row.querySelectorAll<HTMLElement>("[data-skill]")) {
			const show = () => (caption.textContent = logo.dataset.skill!);
			const hide = () => (caption.textContent = "");
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
