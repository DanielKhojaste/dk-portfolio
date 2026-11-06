/**
 * Site settings: everything you might want to tweak lives here, so components never need editing for it.
 *
 *   1. Copy          what the site says about you, and the page's sections
 *   2. Animation     every timing on the site (seconds)
 *   3. Colours       the DivineFlow palettes and the sections' background glow
 *   4. DivineFlow    the hero background and the underlines (menu and side nav)
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

/** Page sections, top to bottom. Used by the side nav (desktop) and the menu (phones and tablets). */
export const sections: readonly LinkItem[] = [
	{ label: "Intro", href: "#intro" },
	{ label: "About", href: "#about" },
	{ label: "Work", href: "#work" },
	{ label: "Skills", href: "#skills" },
	{ label: "Contact", href: "#contact" },
];

/** The section list down the left on desktop. */
export const sideNav = {
	/** Shown before each label; the current section's glows. Set to "" to drop it. */
	marker: "✦",
};

/** The About section, right under the hero. */
export const about = {
	/** Small label above the headline. */
	eyebrow: "About",
	/** Words in [brackets] are highlighted in red when the section comes into view. */
	headline: "I build web apps that are [fast], look [sharp] and hold up.",
	text: "I'm Daniel, a software developer based in Canada. I work across the stack, from the interface you touch to the systems behind it.",
	facts: [
		{ label: "Based in", value: profile.location },
		{ label: "Focus", value: "Web apps, end to end" },
		{ label: "Building", value: profile.currently.name, href: profile.currently.href },
	] as readonly { label: string; value: string; href?: string }[],
};

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
		underlineIn: 1.1,
		underlineOut: 0.7,
		/** GSAP ease for both: "inOut" starts and settles gently. */
		underlineEase: "power2.inOut",
	},

	/** The side nav's DivineFlow underline under the current section (desktop). */
	sideNav: {
		underlineIn: 1.1,
		underlineOut: 0.7,
		underlineEase: "power2.inOut",
		/** Hovering a label fills it (colors.sideNavHover), left to right, and empties it on leave. */
		fill: 0.9,
		/** CSS easing for the fill. */
		fillEase: "cubic-bezier(0.65, 0, 0.35, 1)",
	},

	/**
	 * Smooth scrolling (GSAP ScrollSmoother). The page still scrolls freely; it just glides to a stop
	 * instead of stopping dead. Off for reduced motion.
	 */
	scroll: {
		/** Seconds the page takes to catch up with the wheel or scrollbar. 0 turns it off. */
		smooth: 1.1,
		/** The same on touch screens. 0 keeps the phone's own scrolling, which already feels smooth. */
		smoothTouch: 0,
	},

	/** Hovering the logo: it changes colour and glows (colors.logoHover). */
	logoHover: {
		duration: 0.5,
		/** CSS easing. */
		ease: "cubic-bezier(0.22, 1, 0.36, 1)",
	},

	/** The About section, once it comes into view. */
	about: {
		delay: 0.25,
		/** The headline's words lighting up, one after another. */
		wordStagger: 0.05,
		word: 0.6,
		/** Each red word filling in, after the headline has lit up. */
		highlight: 0.9,
		highlightStagger: 0.3,
		/** The text and facts sliding in last. */
		rest: 0.8,
	},

	/** Hover and focus feedback: buttons, links, arrows, the menu button's spin. */
	hover: 0.2,
} as const;

/* ------------------------------------------------------------------------------------------------
 * 3. Colours: [red, green, blue], each 0–255.
 * --------------------------------------------------------------------------------------------- */

/** The site's red: the hero's DivineFlow filaments, glows, sparkles and embers. */
const crimson: DivineFlowPalette = {
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
};

/** A palette colour as CSS, optionally see-through. */
const rgb = ([r, g, b]: readonly [number, number, number], alpha = 1) =>
	alpha === 1 ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${alpha})`;

export const colors: {
	background: DivineFlowPalette;
	menuUnderline: DivineFlowPalette;
	sideNavUnderline: DivineFlowPalette;
	sideNavHover: string;
	logoHover: { color: string; glow: string; glowSize: number };
	sectionGlow: string;
} = {
	/** The hero's DivineFlow. */
	background: crimson,
	/**
	 * The underline under hovered menu links: the same red as the background, so it always matches.
	 * Replace `crimson` with your own palette (same shape as above) to give it a colour of its own.
	 */
	menuUnderline: crimson,
	/** The underline under the current section in the side nav. */
	sideNavUnderline: crimson,
	/** A side nav label's fill while hovered. Any CSS colour. */
	sideNavHover: "rgb(245 236 236 / 0.4)",
	/**
	 * The logo while hovered: DivineFlow's colours by default, a filament's light red core with the
	 * red glow around it. `glowSize` is the glow's blur in px.
	 */
	logoHover: {
		color: rgb(crimson.core),
		glow: rgb(crimson.glow, 0.9),
		glowSize: 8,
	},
	/**
	 * The dark red glow behind every section after the hero. It stays put while the page scrolls.
	 * Any CSS colour; the alpha sets how strong it is.
	 */
	sectionGlow: "rgb(72 8 16 / 0.62)",
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

/** Settings for a DivineFlow underline. */
export interface UnderlineFlow {
	/**
	 * Where the strand starts drawing from: "center" (out to both sides), "left" (across to the right)
	 * or "right" (across to the left).
	 */
	from: "center" | "left" | "right";
	/** Height of the "~" wave in px (0 for a straight line), and how many waves across the word. */
	wave: number;
	waves: number;
	/** Line thickness, as a multiple of the background's filaments. */
	thickness: number;
	/** Brightness of the strand, 0–1. */
	alpha: number;
	/** How far (px) the two tail ends slowly sway up and down. 0 keeps it still. */
	sway: number;
	/** Speed of the sparkle and light pulse gliding along the strand. */
	travelSpeed: number;
	/** Animation speed. */
	motion?: number;
	/** Sparkles sliding along the strand. */
	sparkleCount: number;
}

// TODO: The middle of the wave looks like the two gradients are overlapping.
/**
 * The underline that draws out under a hovered or focused menu link (phones and tablets): one strand
 * of the background's DivineFlow (same colours) with a gentle "~" wave.
 */
export const menuUnderlineFlow: UnderlineFlow = {
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
	/**
	 * How far (px) the two tail ends slowly sway up and down, like the background's filaments. The
	 * middle stays put and the line stays one smooth curve. 0 keeps it still.
	 */
	sway: 0,
	/** Speed of the sparkle and light pulse gliding along the strand. */
	travelSpeed: 6.0,
	/** Animation speed: the same as the background unless you change it. */
	motion: backgroundFlow.desktop.motion,
	/** Sparkles sliding along the strand. */
	// TODO: Measure performance on different devices and adjust the number of particles.
	// PENDING: Use different options based on device type and connection speed.
	sparkleCount: 30,
};

/**
 * The underline under the current section in the side nav (desktop). The labels are small and close
 * together, so the wave is much flatter than the menu's and stays clear of the labels above and below.
 */
export const sideNavUnderlineFlow: UnderlineFlow = {
	from: "center",
	wave: 1.5,
	waves: 1,
	thickness: 1.2,
	alpha: 1,
	sway: 0,
	travelSpeed: 6.0,
	motion: backgroundFlow.desktop.motion,
	sparkleCount: 14,
};
