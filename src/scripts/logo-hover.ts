/**
 * Hovering (or keyboard-focusing) the DK logo writes the signature over it again in red, stroke by
 * stroke, like a pen going over it; leaving fades the red away. Waits until the logo has finished
 * writing itself on load. The red copy and its pens come from components/Logo.astro.
 */
import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { strokeDurations } from "./logo-draw";

gsap.registerPlugin(DrawSVGPlugin);

export interface LogoHoverTiming {
	duration: number;
	penLift: number;
	fadeOut: number;
}

export function setupLogoHover(
	link: HTMLElement,
	{ duration, penLift, fadeOut }: LogoHoverTiming,
	reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches,
) {
	const svg = link.querySelector<SVGSVGElement>("svg[data-logo-draw]");
	const red = svg?.querySelector<SVGGElement>(".logo__red");
	const pens = Array.from(svg?.querySelectorAll<SVGPathElement>(".logo__red-pen") ?? []);
	if (!svg || !red || pens.length === 0) return null;

	let tl: gsap.core.Timeline | null = null;

	const write = () => {
		if (!svg.dataset.drawn) return;
		tl?.kill();
		tl = gsap.timeline();
		tl.set(red, { opacity: 1 }).set(pens, { drawSVG: "0%", opacity: 0 });
		if (reducedMotion) {
			tl.set(pens, { drawSVG: "100%", opacity: 1 });
			return;
		}
		const durations = strokeDurations(
			pens.map((pen) => pen.getTotalLength()),
			duration,
		);
		pens.forEach((pen, i) => {
			// Hidden until its stroke starts: a zero-length dash with round caps still paints a dot.
			tl!.set(pen, { opacity: 1 }, i === 0 ? ">" : `>+${penLift}`);
			tl!.to(pen, { drawSVG: "100%", duration: durations[i], ease: "power1.inOut" }, "<");
		});
	};
	const clear = () => {
		tl?.kill();
		tl = gsap
			.timeline()
			.to(red, { opacity: 0, duration: reducedMotion ? 0 : fadeOut, ease: "power2.out" });
	};

	link.addEventListener("pointerenter", write);
	link.addEventListener("pointerleave", clear);
	link.addEventListener("focus", () => {
		if (link.matches(":focus-visible")) write();
	});
	link.addEventListener("blur", clear);
	return { write, clear };
}
