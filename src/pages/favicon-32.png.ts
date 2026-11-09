import type { APIRoute } from "astro";
import sharp from "sharp";
import logo from "../assets/brand/dk-logo.svg?raw";
import { shades } from "../site.config";
import { logoPaths, solidIconSvg } from "../scripts/favicon";

/** A small PNG tab icon for browsers that don't take SVG icons. */
export const GET: APIRoute = async () => {
	const svg = solidIconSvg(logoPaths(logo), { bg: shades.bg, ink: shades.text });
	const png = await sharp(Buffer.from(svg), { density: 300 }).resize(32, 32).png().toBuffer();
	return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
};
