import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { splitSubpaths } from "./svg-path";

gsap.registerPlugin(DrawSVGPlugin);

const SVG_NS = "http://www.w3.org/2000/svg";

export interface LogoDrawOptions {
	/** Skip the animation and show the finished logo. Defaults to `prefers-reduced-motion`. */
	reducedMotion?: boolean;
	/** Seconds the outline takes to draw. */
	duration?: number;
	/** Seconds before the draw starts. */
	delay?: number;
}

/** Build one stroke-only path per subpath so DrawSVG can trace every outline in parallel. */
function createStrokes(svg: SVGSVGElement, fills: SVGPathElement[]): SVGPathElement[] {
	const group = document.createElementNS(SVG_NS, "g");
	group.setAttribute("class", "logo__strokes");
	group.setAttribute("fill", "none");

	const strokes = fills.flatMap((fill) =>
		splitSubpaths(fill.getAttribute("d") ?? "").map((d) => {
			const path = document.createElementNS(SVG_NS, "path");
			path.setAttribute("class", "logo__stroke");
			path.setAttribute("d", d);
			group.appendChild(path);
			return path;
		}),
	);

	svg.appendChild(group);
	return strokes;
}

function markDrawn(svg: SVGSVGElement) {
	svg.dataset.drawn = "true";
	svg.dispatchEvent(new CustomEvent("logo:drawn", { bubbles: true }));
}

/**
 * Trace the logo's outlines, then fade the solid fill in and the outlines out.
 * Returns the GSAP timeline, or `null` when reduced motion skips straight to the end state.
 */
export function drawLogo(
	svg: SVGSVGElement,
	{
		reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches,
		duration = 1.6,
		delay = 0.15,
	}: LogoDrawOptions = {},
): gsap.core.Timeline | null {
	if (svg.dataset.drawn) return null;

	const fills = Array.from(svg.querySelectorAll<SVGPathElement>(".logo__fill"));

	if (reducedMotion) {
		gsap.set(fills, { opacity: 1 });
		markDrawn(svg);
		return null;
	}

	const strokes = createStrokes(svg, fills);

	return gsap
		.timeline({
			delay,
			onComplete: () => {
				svg.querySelector(".logo__strokes")?.remove();
				markDrawn(svg);
			},
		})
		.set(fills, { opacity: 0 })
		.fromTo(
			strokes,
			{ drawSVG: "0%" },
			{ drawSVG: "100%", duration, ease: "power2.inOut", stagger: { each: 0.003 } },
		)
		.to(fills, { opacity: 1, duration: 0.6, ease: "power1.out" }, "-=0.45")
		.to(strokes, { opacity: 0, duration: 0.5, ease: "power1.out" }, "<0.15");
}

export function drawLogos(root: ParentNode = document) {
	root.querySelectorAll<SVGSVGElement>("svg[data-logo-draw]").forEach((svg) => drawLogo(svg));
}
