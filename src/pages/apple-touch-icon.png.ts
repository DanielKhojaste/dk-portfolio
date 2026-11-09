import type { APIRoute } from "astro";
import sharp from "sharp";
import logo from "../assets/brand/dk-logo.svg?raw";
import { shades } from "../site.config";
import { logoPaths, solidIconSvg } from "../scripts/favicon";

/** The home-screen icon for Apple devices: 180 px, square (iOS rounds the corners itself). */
export const GET: APIRoute = async () => {
	const svg = solidIconSvg(logoPaths(logo), { bg: shades.bg, ink: shades.text }, false);
	const png = await sharp(Buffer.from(svg)).resize(180, 180).png().toBuffer();
	return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
};
