/**
 * Site settings: everything you might want to tweak lives here, so components never need editing for it.
 *
 *   1. Copy          what the site says about you
 *   2. Animation     every timing on the site (seconds)
 *   3. Colours       the DivineFlow palettes
 *   4. DivineFlow    the background and the underlines
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
	/** Opens in a new tab. */
	external?: boolean;
}

export const profile = {
	name: "Daniel Khojaste",
	role: "Software Developer",
	slogan: "temporary slogan",
	/** Hero: "Based in <location>". */
	location: "Canada",
	coaching: "Coaching soccer",
	currently: {
		/** Hero: "Currently building <name>". */
		name: "Lineup",
		/** Menu: "Currently: <label>". */
		label: "Building Lineup",
		description: "A tactical board for coaches",
		href: "https://github.com/DanielKhojaste/lineup",
		external: true,
	},
} as const;

/** Page sections, in order. Used by the menu. */
export const sections: readonly LinkItem[] = [
	{ label: "Work", href: "#work" },
	{ label: "Skills", href: "#skills" },
	{ label: "About", href: "#about" },
	{ label: "Contact", href: "#contact" },
];

export const socials: readonly LinkItem[] = [
	{ label: "GitHub", href: "https://github.com/DanielKhojaste", external: true },
];

/* ------------------------------------------------------------------------------------------------
 * 2. Animation (seconds). Eases are GSAP ease names: https://gsap.com/docs/v3/Eases
 *    Everything is skipped for visitors who prefer reduced motion.
 * --------------------------------------------------------------------------------------------- */

export const animation = {
	/** The DK signature in the header, written stroke by stroke. */
	logo: {
		delay: 0.2,
		/** Total writing time, shared between the strokes by length. */
		duration: 1.7,
		/** Pause between strokes, as if the pen lifts. */
		penLift: 0.08,
	},

	/** The red DivineFlow behind the hero, drawn out from the centre on load (alongside the logo). */
	background: {
		delay: 0.2,
		duration: 2.2,
		ease: "power2.out",
		/** Opacity fade-in of the whole canvas, under the draw-in. */
		fadeIn: 0.5,
	},

	/** The white DivineFlow underlines under the hero claims, drawn out from their outer edge. */
	underlines: {
		delay: 0.5,
		duration: 1.8,
		ease: "power2.inOut",
		fadeIn: 0.5,
	},

	/** The full-screen menu. */
	menu: {
		/** Fade of the whole overlay, in and out. */
		fade: 0.45,
		/** Each section link sliding up into place. */
		links: 0.75,
		/** Delay between one link and the next. */
		linkStagger: 0.06,
		/** The quick facts fading in, and how long after opening they start. */
		facts: 0.6,
		factsDelay: 0.35,
		/** The menu button's bars folding into an X, and its label swapping. */
		button: 0.4,
	},

	/** Hover and focus feedback: buttons, links, arrows, the menu button's spin. */
	hover: 0.2,
} as const;

/* ------------------------------------------------------------------------------------------------
 * 3. Colours: [red, green, blue], each 0–255.
 * --------------------------------------------------------------------------------------------- */

export const colors: { background: DivineFlowPalette; underlines: DivineFlowPalette } = {
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

	/** The DivineFlow underlines under the hero claims. */
	underlines: {
		bloom: [120, 120, 134],
		glow: [228, 228, 238],
		core: [255, 255, 255],
		shimmer: [255, 255, 255],
		sparkle: [255, 255, 255],
		sparkleHalo: [235, 235, 245],
		flare: [255, 255, 255],
		speck: [240, 240, 246],
		originInner: [255, 255, 255],
		originOuter: [150, 150, 164],
		ember: [255, 255, 255],
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

/** The underlines under the hero claims. */
export const underlineFlow = {
	/** Slant of the line in degrees: positive rises from bottom left to top right. */
	angle: 5,
	/** Strands per underline, and how far apart they fan (multiple of the default fan). */
	lineCount: 4,
	spread: 0.4,
	/** Wave height of the strands. */
	amplitude: 2.5,
	/** Animation speed: the same as the background unless you change it. */
	motion: backgroundFlow.desktop.motion,
	/** Sparkles sliding along, and dust specks beside, each underline. */
	sparkleCount: 2,
	speckCount: 4,
	/** Share of the underline (from the throne side) that fades out, 0–1. */
	fade: 0.28,
} as const;
