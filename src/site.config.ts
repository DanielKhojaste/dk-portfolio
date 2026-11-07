/**
 * Site settings: everything you might want to tweak lives here, so components never need editing for it.
 *
 *   1. Copy          what the site says about you, and the page's sections
 *   2. Animation     the site's shared pace (motion), then every timing that uses it (seconds)
 *   3. Colours       the main colour, and every colour worked out from it
 *   4. DivineFlow    the hero background and the underlines (menu and side nav)
 *
 * Save the file and `npm run dev` reloads the page.
 */
import type { DivineFlowOptions, DivineFlowPalette, RGB } from "./lib/divine-flow";
import { brandFlow, brandShades, type Shades } from "./scripts/brand";

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

/** The hero. */
export const hero = {
	/** The prompt that fades in at the bottom of the hero after a few seconds. */
	scrollHint: "Scroll to see more",
};

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

/**
 * The site's pace. Timings below pick from these, so hovers, fills and glides move as one system:
 * change one here and everything that uses it follows. Things that need their own timing still set
 * a number directly.
 */
export const motion = {
	/** Small, immediate feedback: buttons, icons, borders. */
	quick: 0.2,
	/** Hovering text and links: colour changes, fills, underlines, arrows. */
	hover: 0.45,
	/** Things that draw or fill in by themselves: the red words in About. */
	draw: 0.9,
	/** Big, slow moves: DivineFlow underlines drawing out, the page catching up as you scroll. */
	glide: 1.1,
	/**
	 * Eases, as CSS (for transitions) and GSAP (for tweens) pairs that match. "out" starts at full
	 * speed and settles, which suits anything answering the pointer; "inOut" eases in and out.
	 */
	ease: {
		out: { css: "cubic-bezier(0.22, 1, 0.36, 1)", gsap: "power3.out" },
		inOut: { css: "cubic-bezier(0.65, 0, 0.35, 1)", gsap: "power2.inOut" },
	},
} as const;

/**
 * The side nav's current-section change: the new section's underline draws out and its label fills
 * in; the old one's underline draws back and its label empties. Shared, so underline and label move
 * together; animation.sideNav has a setting for each in case you want them apart.
 */
const sideNavChange = { in: motion.glide, out: 0.7 };

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
		underlineIn: motion.glide,
		underlineOut: 0.7,
		/** GSAP ease for both. */
		underlineEase: motion.ease.inOut.gsap,
	},

	/** The side nav (desktop). */
	sideNav: {
		/** The DivineFlow underline drawing out under the current section, and back in when you leave. */
		underlineIn: sideNavChange.in,
		underlineOut: sideNavChange.out,
		underlineEase: motion.ease.inOut.gsap,
		/**
		 * The current section's label filling in (and its marker lighting up), and emptying when you
		 * leave. Same speed and ease as the underline by default.
		 */
		labelIn: sideNavChange.in,
		labelOut: sideNavChange.out,
		labelEase: motion.ease.inOut.css,
		/** How far (px) a hovered label slides to the right, on top of the glow (textHover). */
		nudge: 4,
	},

	/**
	 * Hovering text: side nav labels and text links (like Lineup ↗ in About). The text fills white and
	 * glows in the main colour (colors.textHover).
	 */
	textHover: {
		duration: motion.hover,
		/** CSS easing. */
		ease: motion.ease.out.css,
	},

	/**
	 * Smooth scrolling (GSAP ScrollSmoother). The page still scrolls freely; it just glides to a stop
	 * instead of stopping dead. Off for reduced motion.
	 */
	scroll: {
		/** Seconds the page takes to catch up with the wheel or scrollbar. 0 turns it off. */
		smooth: motion.glide,
		/** The same on touch screens. 0 keeps the phone's own scrolling, which already feels smooth. */
		smoothTouch: 0,
	},

	/** Hovering the logo: it glows in the main colour and grows a touch (colors.logoHover). */
	logoHover: {
		duration: motion.hover,
		/** CSS easing. */
		ease: motion.ease.out.css,
		/** How much it grows: 1 for not at all. */
		scale: 1.04,
	},

	/** The hero's scroll prompt. */
	scrollHint: {
		/** Seconds on the hero before it fades in. */
		delay: 4,
		/** Its fade in and out. */
		fade: 0.8,
	},

	/** The About section, once it comes into view. */
	about: {
		delay: 0.25,
		/** The headline's words lighting up, one after another. */
		wordStagger: 0.05,
		word: 0.6,
		/** Each red word filling in, after the headline has lit up. */
		highlight: motion.draw,
		/** Pause between one red word finishing and the next starting. */
		highlightGap: 0.2,
		/** The facts (based in, focus, building) sliding in last. The text above them is there from the start. */
		rest: 0.8,
	},

	/** Hover and focus feedback on buttons and icons: the hero buttons, the menu button's spin. */
	hover: motion.quick,
} as const;

/* ------------------------------------------------------------------------------------------------
 * 3. Colours
 * --------------------------------------------------------------------------------------------- */

/**
 * The site's main colour, as [red, green, blue] (each 0–255). Everything coloured is worked out from
 * it: buttons, highlighted words, glows, the hero's last name, the background glow and every
 * DivineFlow filament, sparkle and ember (scripts/brand.ts). Even the near-black background and the
 * off-white text carry a faint tint of it. Change it and the whole site follows; the hero photo is
 * the one thing that doesn't, as its red is in the picture.
 *
 * This is the only colour setting: [200, 32, 43] is the original red. Try [37, 99, 235] (blue),
 * [124, 58, 237] (violet), [5, 150, 105] (green) or [217, 119, 6] (amber).
 */
export const brand: RGB = [200, 32, 43];

/** Every shade, worked out from `brand`. */
export const shades: Shades = brandShades(brand);

/** The DivineFlow palette, worked out from `brand`. */
const flow: DivineFlowPalette = brandFlow(shades);

/** A shade as CSS, optionally see-through. */
const rgb = ([r, g, b]: RGB, alpha = 1) =>
	alpha === 1 ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${alpha})`;

export const colors: {
	background: DivineFlowPalette;
	menuUnderline: DivineFlowPalette;
	sideNavUnderline: DivineFlowPalette;
	textHover: { color: string; glow: string };
	logoHover: { color: string; glow: string; glowSize: number; core: string };
	sectionGlow: string;
} = {
	/**
	 * The hero's DivineFlow. Each of these can also be your own palette (see DivineFlowPalette), or
	 * one of DivineFlow's themes, if you want it to differ from the main colour.
	 */
	background: flow,
	/** The underline under hovered menu links. */
	menuUnderline: flow,
	/** The underline under the current section in the side nav. */
	sideNavUnderline: flow,
	/**
	 * Hovered text (side nav labels, text links): its colour, and the glow around it as a CSS
	 * text-shadow, in the main colour.
	 */
	textHover: {
		color: rgb(shades.text),
		glow: `0 0 14px ${rgb(shades.halo, 0.85)}, 0 0 2px ${rgb(shades.bright, 0.6)}`,
	},
	/**
	 * The logo while hovered: it stays white and glows in the main colour. `glowSize` is the wide
	 * glow's blur in px; `core` is a tight, brighter glow hugging the strokes.
	 */
	logoHover: {
		color: rgb(shades.text),
		glow: rgb(shades.halo),
		glowSize: 14,
		core: rgb(shades.bright, 0.9),
	},
	/**
	 * The glow behind every section after the hero. It stays put while the page scrolls. Any CSS
	 * colour; the alpha sets how strong it is.
	 */
	sectionGlow: rgb(shades.sectionGlow, 0.62),
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
