import type { DivineFlowPalette, DivineFlowThemeName, RGB } from "./types.js";

/** The original ApotheonAI look: warm gold filaments on black. */
const gold: DivineFlowPalette = {
	bloom: [214, 154, 64],
	glow: [224, 170, 82],
	core: [255, 232, 186],
	shimmer: [255, 214, 148],
	sparkle: [255, 250, 236],
	sparkleHalo: [255, 214, 140],
	flare: [255, 230, 180],
	speck: [228, 178, 92],
	originInner: [255, 196, 110],
	originOuter: [196, 132, 48],
	ember: [255, 214, 148],
};

/** Deep red filaments with hot pink-white cores. */
const crimson: DivineFlowPalette = {
	bloom: [200, 28, 40],
	glow: [228, 52, 64],
	core: [255, 204, 198],
	shimmer: [255, 150, 140],
	sparkle: [255, 242, 238],
	sparkleHalo: [255, 120, 110],
	flare: [255, 182, 172],
	speck: [232, 84, 84],
	originInner: [255, 84, 84],
	originOuter: [150, 18, 28],
	ember: [255, 150, 120],
};

/** Purple filaments with lavender cores. */
const violet: DivineFlowPalette = {
	bloom: [120, 70, 220],
	glow: [150, 100, 245],
	core: [230, 214, 255],
	shimmer: [200, 170, 255],
	sparkle: [248, 244, 255],
	sparkleHalo: [190, 150, 255],
	flare: [210, 190, 255],
	speck: [170, 130, 240],
	originInner: [170, 120, 255],
	originOuter: [70, 20, 140],
	ember: [214, 190, 255],
};

export const themes: Readonly<Record<DivineFlowThemeName, Readonly<DivineFlowPalette>>> = {
	gold,
	crimson,
	violet,
};

export const PALETTE_KEYS = Object.keys(gold) as (keyof DivineFlowPalette)[];

export function isRGB(value: unknown): value is RGB {
	return (
		Array.isArray(value) &&
		value.length === 3 &&
		value.every((channel) => typeof channel === "number" && channel >= 0 && channel <= 255)
	);
}

/** Resolve a theme name or palette plus partial overrides into a complete, validated palette. */
export function resolvePalette(
	theme: DivineFlowThemeName | DivineFlowPalette = "gold",
	overrides: Partial<DivineFlowPalette> = {},
): DivineFlowPalette {
	let base: DivineFlowPalette;

	if (typeof theme === "string") {
		const named = themes[theme];
		if (!named) {
			throw new Error(
				`divine-flow: unknown theme "${theme}". Use one of: ${Object.keys(themes).join(", ")}.`,
			);
		}
		base = named;
	} else {
		base = theme;
	}

	const palette = { ...base, ...overrides };

	for (const key of PALETTE_KEYS) {
		if (!isRGB(palette[key])) {
			throw new Error(`divine-flow: palette.${key} must be an [r, g, b] array of 0–255 numbers.`);
		}
	}

	return palette;
}

/** `rgba(r, g, b, a)` string with alpha clamped to 0–1. */
export function rgba([r, g, b]: RGB, alpha: number): string {
	const a = Math.min(1, Math.max(0, alpha));
	return `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(4))})`;
}

/** RGB (0–255) → HSL (h in degrees, s and l in 0–1). */
export function rgbToHsl([r, g, b]: RGB): [number, number, number] {
	const rn = r / 255;
	const gn = g / 255;
	const bn = b / 255;
	const max = Math.max(rn, gn, bn);
	const min = Math.min(rn, gn, bn);
	const l = (max + min) / 2;
	if (max === min) return [0, 0, l];
	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	let h: number;
	if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
	else if (max === gn) h = (bn - rn) / d + 2;
	else h = (rn - gn) / d + 4;
	return [h * 60, s, l];
}

/** HSL (h in degrees, s and l in 0–1) → RGB (0–255, rounded). */
export function hslToRgb(h: number, s: number, l: number): RGB {
	const hue = (((h % 360) + 360) % 360) / 360;
	if (s === 0) {
		const v = Math.round(l * 255);
		return [v, v, v];
	}
	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;
	const channel = (t: number) => {
		let x = t;
		if (x < 0) x += 1;
		if (x > 1) x -= 1;
		if (x < 1 / 6) return p + (q - p) * 6 * x;
		if (x < 1 / 2) return q;
		if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
		return p;
	};
	return [
		Math.round(channel(hue + 1 / 3) * 255),
		Math.round(channel(hue) * 255),
		Math.round(channel(hue - 1 / 3) * 255),
	];
}

/** Shift a colour's hue (degrees) and lightness (−1–1), keeping saturation. */
export function shade(color: RGB, hueShift: number, lightnessShift: number): RGB {
	const [h, s, l] = rgbToHsl(color);
	return hslToRgb(h + hueShift, s, Math.min(1, Math.max(0, l + lightnessShift)));
}
