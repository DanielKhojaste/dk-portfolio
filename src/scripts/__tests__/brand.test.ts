import { describe, expect, it } from "vitest";
import { rgbToHsl } from "../../lib/divine-flow/palette";
import { brand, colors, shades } from "../../site.config";
import {
	brandFlow,
	brandShades,
	channels,
	ORIGINAL_RED,
	follow,
	hex,
	photoFilter,
	shadeVariables,
} from "../brand";

const close = (a: readonly number[], b: readonly number[], by = 2) =>
	a.every((v, i) => Math.abs(v - b[i]!) <= by);

describe("brand colours", () => {
	it("gives back exactly the original colours for the original red", () => {
		const s = brandShades([200, 32, 43]);
		expect(s.bright).toEqual([255, 77, 88]);
		expect(s.glow).toEqual([186, 24, 38]);
		expect(s.core).toEqual([255, 200, 200]);
		expect(s.bg).toEqual([8, 4, 5]);
		expect(photoFilter([200, 32, 43])).toBe("none");
	});

	it("gives back the original design with the original red", () => {
		const s = brandShades(ORIGINAL_RED);
		expect(s.accent).toEqual(ORIGINAL_RED);
		expect(close(s.bright, [255, 77, 88])).toBe(true);
		expect(close(s.glow, [186, 24, 38])).toBe(true);
		expect(close(s.core, [255, 200, 200])).toBe(true);
		expect(close(s.bg, [8, 4, 5])).toBe(true);
		expect(close(s.text, [245, 236, 236])).toBe(true);
	});

	it("turns every shade with the main colour", () => {
		const blue = brandShades([37, 99, 235]);
		const hue = (c: readonly [number, number, number]) => rgbToHsl(c)[0];
		for (const name of ["bright", "glow", "bloom", "halo", "accentSoft", "sectionGlow"] as const) {
			expect(Math.abs(hue(blue[name]) - hue([37, 99, 235]))).toBeLessThan(15);
		}
		// Light shades stay light and dark ones dark.
		expect(rgbToHsl(blue.core)[2]).toBeGreaterThan(0.8);
		expect(rgbToHsl(blue.bg)[2]).toBeLessThan(0.05);
	});

	it("follows saturation too, but keeps each shade's own lightness", () => {
		// A grey main colour gives greys, each as light or dark as the design's shade.
		expect(follow([200, 32, 43], ORIGINAL_RED, [128, 128, 128])).toEqual([116, 116, 116]);
		const grey = brandShades([128, 128, 128]);
		for (const c of Object.values(grey)) expect(new Set(c).size).toBe(1);
		for (const c of Object.values(brandShades([255, 255, 255]))) {
			for (const v of c) expect(v).toBeGreaterThanOrEqual(0);
		}
	});

	it("feeds the site: DivineFlow, the hovers and the CSS variables all come from `brand`", () => {
		expect(shades).toEqual(brandShades(brand));
		expect(colors.background).toEqual(brandFlow(shades));
		expect(colors.menuUnderline).toBe(colors.background);
		expect(colors.sideNavUnderline).toBe(colors.background);
		expect(colors.logoHover.glow).toBe(`rgb(${channels(shades.accent)})`);
		expect(colors.textHover.glow).toContain(channels(shades.halo));
		const vars = shadeVariables(shades);
		expect(vars["--shade-accent"]).toBe(channels(brand));
		expect(vars["--shade-accent-soft"]).toBe(channels(shades.accentSoft));
		expect(hex([8, 4, 5])).toBe("#080405");
	});

	it("regrades the hero photo to the main colour, and leaves it alone for the original red", () => {
		expect(photoFilter(ORIGINAL_RED)).toBe("none");
		const blue = photoFilter([37, 99, 235]);
		expect(blue).toMatch(/^hue-rotate\(-?\d+(\.\d)?deg\) saturate\([\d.]+\)$/);
		// The shortest way round the colour wheel.
		const turn = Number(blue.match(/hue-rotate\((-?[\d.]+)deg/)![1]);
		expect(Math.abs(turn)).toBeLessThanOrEqual(180);
		expect(photoFilter([128, 128, 128])).toContain("saturate(0)");
	});
});
