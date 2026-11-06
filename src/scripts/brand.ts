/**
 * Every colour on the site, worked out from one main colour (`brand` in site.config.ts).
 *
 * The site was designed in red. Each shade below is that design's colour, and `brandShades()` moves
 * it the way the main colour moved: the same hue turn and saturation scaled by the same ratio. Each
 * shade keeps its own lightness, so the background stays near-black, the text near-white and the
 * glows as bright as designed, whatever the main colour. With the original red you get exactly the
 * original shades; with, say, a blue every glow, highlight and DivineFlow filament becomes the
 * matching blue.
 */
import { hslToRgb, rgbToHsl } from "../lib/divine-flow/palette";
import type { DivineFlowPalette, RGB } from "../lib/divine-flow";

/** The main colour the site was designed with. */
export const DESIGN_BRAND: RGB = [200, 32, 43];

/** The design's shades, in the original red. */
const DESIGN = {
	/* DivineFlow: the hero's filaments, the underlines. */
	bloom: [150, 14, 26],
	glow: [186, 24, 38],
	core: [255, 200, 200],
	shimmer: [230, 96, 104],
	sparkle: [255, 236, 236],
	sparkleHalo: [214, 60, 72],
	flare: [250, 160, 164],
	speck: [196, 44, 56],
	originInner: [214, 44, 56],
	originOuter: [100, 8, 18],
	ember: [230, 80, 86],

	/* Page. */
	/** Buttons, focus rings, link underlines: the main colour itself. */
	accent: DESIGN_BRAND,
	/** A button's hover. */
	accentHover: [176, 26, 36],
	/** Small labels (eyebrows, kickers). */
	accentSoft: [240, 122, 130],
	/** Highlighted words and the side nav's marker. */
	bright: [255, 77, 88],
	/** Glows around highlighted text and markers. */
	halo: [230, 40, 55],
	/** The hero's last name and its outline, and the glow behind the hero. */
	nameTop: [130, 16, 28],
	nameBottom: [60, 6, 12],
	nameFill: [110, 14, 24],
	nameStroke: [255, 70, 82],
	heroGlow: [190, 28, 40],
	heroGlowEdge: [120, 14, 22],
	/** The glow behind the sections, top and bottom. */
	sectionGlow: [72, 8, 16],
	sectionShadow: [40, 4, 9],

	/* Neutrals: barely tinted with the main colour, so they follow it too. */
	bg: [8, 4, 5],
	text: [245, 236, 236],
	textSoft: [217, 201, 202],
	textMuted: [168, 151, 154],
} satisfies Record<string, RGB>;

export type Shade = keyof typeof DESIGN;
export type Shades = Record<Shade, RGB>;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Move `color` the way `to` differs from `from`: hue turned and saturation scaled, lightness kept. */
export function follow(color: RGB, from: RGB, to: RGB): RGB {
	const [h0, s0] = rgbToHsl(from);
	const [h1, s1] = rgbToHsl(to);
	const [h, s, l] = rgbToHsl(color);
	const saturation = s0 === 0 ? s1 : s * (s1 / s0);
	return hslToRgb(h + (h1 - h0), clamp01(saturation), l);
}

/** Every shade on the site for this main colour. */
export function brandShades(brand: RGB): Shades {
	const out = {} as Shades;
	for (const [name, color] of Object.entries(DESIGN) as [Shade, RGB][]) {
		out[name] = follow(color, DESIGN_BRAND, brand);
	}
	out.accent = brand;
	return out;
}

/** The DivineFlow palette for this main colour. */
export function brandFlow(shades: Shades): DivineFlowPalette {
	const {
		bloom,
		glow,
		core,
		shimmer,
		sparkle,
		sparkleHalo,
		flare,
		speck,
		originInner,
		originOuter,
		ember,
	} = shades;
	return {
		bloom,
		glow,
		core,
		shimmer,
		sparkle,
		sparkleHalo,
		flare,
		speck,
		originInner,
		originOuter,
		ember,
	};
}

/** "r g b", for CSS like `rgb(var(--brand-bright) / 0.5)`. */
export const channels = ([r, g, b]: RGB) => `${r} ${g} ${b}`;

/** `#rrggbb`. */
export const hex = (color: RGB) => `#${color.map((c) => c.toString(16).padStart(2, "0")).join("")}`;

/** The CSS custom properties BaseLayout puts on the page: one `--shade-<name>` per shade, as "r g b". */
export function shadeVariables(shades: Shades): Record<string, string> {
	return Object.fromEntries(
		Object.entries(shades).map(([name, color]) => [
			`--shade-${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`,
			channels(color),
		]),
	);
}
