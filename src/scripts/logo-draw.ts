import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";

gsap.registerPlugin(DrawSVGPlugin);

export interface LogoDrawOptions {
	/** Skip the animation and show the finished logo. Defaults to `prefers-reduced-motion`. */
	reducedMotion?: boolean;
	/** Total seconds spent writing (split between strokes by length, like a steady pen). */
	duration?: number;
	/** Seconds before writing starts. */
	delay?: number;
	/** Seconds the pen is lifted between strokes. */
	penLift?: number;
}

/** Split `total` seconds across strokes in proportion to their lengths. */
export function strokeDurations(lengths: readonly number[], total: number): number[] {
	const sum = lengths.reduce((a, b) => a + b, 0);
	if (sum <= 0) return lengths.map(() => 0);
	return lengths.map((length) => (length / sum) * total);
}

function finish(svg: SVGSVGElement) {
	// Drop the mask so the finished logo is exactly the original artwork.
	svg.querySelector(".logo__ink")?.removeAttribute("mask");
	svg.dataset.drawn = "true";
	svg.dispatchEvent(new CustomEvent("logo:drawn", { bubbles: true }));
}

/**
 * Write the logo stroke by stroke by drawing the pen paths inside its mask.
 * Returns the GSAP timeline, or `null` when reduced motion skips straight to the finished logo.
 */
export function drawLogo(
	svg: SVGSVGElement,
	{
		reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches,
		duration = 1.7,
		delay = 0.2,
		penLift = 0.08,
	}: LogoDrawOptions = {},
): gsap.core.Timeline | null {
	if (svg.dataset.drawn) return null;

	const pens = Array.from(svg.querySelectorAll<SVGPathElement>(".logo__pen"));

	if (reducedMotion || pens.length === 0) {
		gsap.set(pens, { drawSVG: "100%", opacity: 1 });
		finish(svg);
		return null;
	}

	const durations = strokeDurations(
		pens.map((pen) => pen.getTotalLength()),
		duration,
	);

	const timeline = gsap.timeline({ delay, onComplete: () => finish(svg) });
	// Pens stay hidden until their stroke starts: round caps on a zero-length dash would show a dot.
	timeline.set(pens, { drawSVG: "0%", opacity: 0 });
	pens.forEach((pen, i) => {
		const at = i === 0 ? ">" : `>+${penLift}`;
		timeline.set(pen, { opacity: 1 }, at);
		timeline.to(pen, { drawSVG: "100%", duration: durations[i], ease: "power1.inOut" }, "<");
	});
	return timeline;
}

export function drawLogos(root: ParentNode = document) {
	root.querySelectorAll<SVGSVGElement>("svg[data-logo-draw]").forEach((svg) => drawLogo(svg));
}
