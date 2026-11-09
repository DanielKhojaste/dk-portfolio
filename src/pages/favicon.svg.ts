import type { APIRoute } from "astro";
import logo from "../assets/brand/dk-logo.svg?raw";
import { shades } from "../site.config";
import { faviconSvg, logoPaths } from "../scripts/favicon";

/** The tab icon, built from the signature and the main colour (scripts/favicon.ts). */
export const GET: APIRoute = () =>
	new Response(faviconSvg(logoPaths(logo), { light: shades.accent, dark: shades.text }), {
		headers: { "Content-Type": "image/svg+xml" },
	});
