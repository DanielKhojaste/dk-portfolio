/**
 * The site's icons, made from the DK signature (assets/brand/dk-logo.svg) and the main colour, so
 * they follow `brand` like the rest of the site. Built by src/pages/favicon.svg.ts and the PNG
 * endpoints next to it.
 *
 * - favicon.svg: the signature alone on a clear background: white on dark browser tabs, the
 *   main colour on light ones.
 * - PNGs (for Apple devices and older browsers): white on the site's near-black, in a rounded
 *   square, since they can't follow the tab's colour.
 */
import type { RGB } from "../lib/divine-flow";

/** The signature's paths, from the logo file. Its viewBox is 0 0 62 53. */
export function logoPaths(svg: string) {
	return [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((match) => match[1]!);
}

const rgb = ([r, g, b]: RGB) => `rgb(${r} ${g} ${b})`;

/**
 * The signature, centred in a square `size` units across (it's 62 × 53): tight for the tab icon,
 * so it reads at 16 px, roomier on a solid tile.
 */
function square(paths: string[], size: number) {
	const x = (62 - size) / 2;
	const y = (53 - size) / 2;
	return {
		viewBox: `${x} ${y} ${size} ${size}`,
		box: { x, y, size },
		ink: paths.map((d) => `<path d="${d}"/>`).join(""),
	};
}

/** The tab icon: white on dark tabs, the main colour on light ones. */
export function faviconSvg(paths: string[], colors: { light: RGB; dark: RGB }) {
	const { viewBox, ink } = square(paths, 64);
	return [
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">`,
		"<style>",
		`g{fill:${rgb(colors.light)}}`,
		`@media (prefers-color-scheme:dark){g{fill:${rgb(colors.dark)}}}`,
		"</style>",
		`<g>${ink}</g>`,
		"</svg>",
	].join("");
}

/** A solid icon for the PNGs: the signature in `ink` on a rounded `bg` square. */
export function solidIconSvg(paths: string[], colors: { bg: RGB; ink: RGB }, rounded = true) {
	const { viewBox, box, ink } = square(paths, 80);
	const radius = rounded ? 18 : 0;
	return [
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">`,
		`<rect x="${box.x}" y="${box.y}" width="${box.size}" height="${box.size}" rx="${radius}" fill="${rgb(colors.bg)}"/>`,
		`<g fill="${rgb(colors.ink)}">${ink}</g>`,
		"</svg>",
	].join("");
}
