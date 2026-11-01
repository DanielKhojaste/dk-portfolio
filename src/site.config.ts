/**
 * Site settings: everything you might want to tweak lives here, so components never need editing for it.
 *
 *   1. Copy          what the site says about you
 *   2. Animation     every timing on the site (seconds)
 *   3. Colours       the DivineFlow palettes
 *   4. DivineFlow    the background and the menu underline
 *
 * Save the file and `npm run dev` reloads the page.
 */
import type { DivineFlowOptions, DivineFlowPalette } from "./lib/divine-flow";

/* ------------------------------------------------------------------------------------------------
 * 1. Copy
 * --------------------------------------------------------------------------------------------- */

export interface LinkItem {
	label: string;
	href: string;
}

export const profile = {
	name: "Daniel Khojaste",
	/** Hero: the big claim on the left. */
	role: "Software Developer",
	/** Hero: "Based in <location>". */
	location: "Canada",
	/** Hero: "Currently building <name>", linking to `href` in a new tab. */
	currently: {
		name: "Lineup",
		href: "https://github.com/DanielKhojaste/lineup",
	},
} as const;

/** Page sections, in order. Used by the menu. */
export const sections: readonly LinkItem[] = [
	{ label: "Work", href: "#work" },
	{ label: "Skills", href: "#skills" },
	{ label: "About", href: "#about" },
	{ label: "Contact", href: "#contact" },
];

/* ------------------------------------------------------------------------------------------------
 * 2. Animation (seconds). Eases are GSAP ease names: https://gsap.com/docs/v3/Eases
 *    Everything is skipped for visitors who prefer reduced motion.
 * --------------------------------------------------------------------------------------------- */

/** The DK signature in the header, written stroke by stroke. */
const logo = {
	delay: 0.2,
	/** Total writing time, shared between the strokes by length. */
	duration: 1.7,
	/** Pause between strokes, as if the pen lifts. */
	penLift: 0.08,
};

export const animation = {
	logo,

	/** The red DivineFlow behind the hero, drawn out from the centre on load (alongside the logo). */
	background: {
		delay: 0.0,
		duration: 6.5,
		ease: "power1.out",
		/** Opacity fade-in of the whole canvas, under the draw-in. */
		fadeIn: 0.0,
	},

	/** The full-screen menu. */
	menu: {
		/** Fade of the whole overlay, in and out. */
		fade: 0.45,
		/** Each section link sliding up into place. */
		links: 0.75,
		/** Delay between one link and the next. */
		linkStagger: 0.06,
		/** The menu button's bars folding into an X, and its label swapping. */
		button: 0.4,
		/** The DivineFlow underline drawing out under a hovered or focused menu link, and back in. */
		underlineIn: 0.6,
		underlineOut: 0.35,
	},

	/** Hover and focus feedback: buttons, links, arrows, the menu button's spin. */
	hover: 0.2,
} as const;

/* ------------------------------------------------------------------------------------------------
 * 3. Colours: [red, green, blue], each 0–255.
 * --------------------------------------------------------------------------------------------- */

export const colors: { background: DivineFlowPalette } = {
	/** The hero's DivineFlow. */
	background: {
		/** Wide soft glow under each filament. */
		bloom: [150, 14, 26],
		/** Halo around each filament. */
		glow: [186, 24, 38],
		/** Thin bright core of each filament. */
		core: [255, 200, 200],
		/** Pulse of light travelling along the brighter filaments. */
		shimmer: [230, 96, 104],
		/** Sparkles sliding along filaments: centre and halo. */
		sparkle: [255, 236, 236],
		sparkleHalo: [214, 60, 72],
		/** Edges of the lens flare on bigger sparkles. */
		flare: [250, 160, 164],
		/** Dust specks beside the filaments. */
		speck: [196, 44, 56],
		/** Glow where the filaments start: centre and edge. */
		originInner: [214, 44, 56],
		originOuter: [100, 8, 18],
		/** Embers drifting up across the hero. */
		ember: [230, 80, 86],
	},
};

/* ------------------------------------------------------------------------------------------------
 * 4. DivineFlow. Every option is documented in src/lib/divine-flow/README.md.
 * --------------------------------------------------------------------------------------------- */

type FlowOptions = Omit<DivineFlowOptions, "canvas" | "theme" | "palette" | "reveal">;

/** The hero background. `compact` overrides it on phones, tablets and portrait screens. */
export const backgroundFlow: { desktop: FlowOptions; compact: FlowOptions } = {
	desktop: {
		/** Animation speed and wave size. */
		motion: 1.6,
		/** Filaments per side, plus a few strays above and below. */
		lineCount: 8,
		scatterCount: 3,
		/** Where the filaments start (fractions of the hero) and how far out they emerge (px). */
		originY: 0.46,
		innerGap: 130,
		/** Per-filament shade variation, 0–1, picked within these hue (degrees) and lightness ranges. */
		variance: 0.7,
		hueRange: [-9, 0],
		lightRange: [-0.21, 0.07],
		/** Embers drifting up, and their speed. */
		emberCount: 70,
		emberSpeed: 0.9,
		/** Pixel density cap: lower is cheaper to draw. */
		maxDpr: 1.5,
	},
	compact: {
		originY: 0.46,
		lineCount: 6,
		scatterCount: 2,
		innerGap: 70,
		emberCount: 36,
	},
};

/**
 * The underline that draws out under a hovered or focused menu link: one strand of the background's
 * DivineFlow (same colours) with a gentle "~" wave.
 */
export const menuUnderlineFlow: {
	from: "center" | "left" | "right";
	wave: number;
	waves: number;
	thickness: number;
	alpha: number;
	amplitude: number;
	motion?: number;
	sparkleCount: number;
} = {
	/**
	 * Where the strand starts drawing from: "center" (out to both sides), "left" (across to the right)
	 * or "right" (across to the left).
	 */
	from: "center",
	/** Height of the "~" wave in px (0 for a straight line), and how many waves across the word. */
	wave: 7,
	waves: 1,
	/** Line thickness, as a multiple of the background's filaments. */
	thickness: 1.6,
	/** Brightness of the strand, 0–1. */
	alpha: 1,
	/** The small DivineFlow wiggle that drifts along the strand. */
	amplitude: 1.2,
	/** Animation speed: the same as the background unless you change it. */
	motion: backgroundFlow.desktop.motion,
	/** Sparkles sliding along the strand. */
	sparkleCount: 1,
};
