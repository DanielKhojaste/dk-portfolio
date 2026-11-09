import { describe, expect, it } from "vitest";
import logo from "../../assets/brand/dk-logo.svg?raw";
import { shades } from "../../site.config";
import { faviconSvg, logoPaths, solidIconSvg } from "../favicon";

const paths = logoPaths(logo);

describe("icons", () => {
	it("takes every path of the signature", () => {
		expect(paths.length).toBeGreaterThan(0);
		expect(paths.length).toBe((logo.match(/<path/g) ?? []).length);
	});

	it("the tab icon is clear, the main colour on light tabs and white on dark ones", () => {
		const svg = faviconSvg(paths, { light: shades.accent, dark: shades.text });
		expect(svg).not.toContain("<rect");
		expect(svg).toContain(`g{fill:rgb(${shades.accent.join(" ")})}`);
		expect(svg).toContain(
			`@media (prefers-color-scheme:dark){g{fill:rgb(${shades.text.join(" ")})}}`,
		);
		// Square, and centred on the 62 × 53 signature.
		expect(svg).toContain('viewBox="-1 -5.5 64 64"');
	});

	it("the PNG tiles are white on the site's near-black", () => {
		const svg = solidIconSvg(paths, { bg: shades.bg, ink: shades.text });
		expect(svg).toContain(`fill="rgb(${shades.bg.join(" ")})"`);
		expect(svg).toContain(`<g fill="rgb(${shades.text.join(" ")})">`);
		expect(svg).toContain('rx="18"');
		expect(solidIconSvg(paths, { bg: shades.bg, ink: shades.text }, false)).toContain('rx="0"');
	});
});
