// @ts-check
/**
 * Security headers for the built site. After `astro build`, this:
 *
 * 1. Works out a Content Security Policy for the page: scripts only from this site (plus the one
 *    small inline script, allowed by its hash), no plugins, no framing, and network requests only
 *    to this site and Web3Forms (the contact form). The hash is worked out from the built page, so
 *    it stays right when that script changes.
 * 2. Adds it to each page as a <meta> tag, so it works on any host and in `npm run preview`.
 * 3. Writes `dist/_headers` (read by Cloudflare Pages and Netlify) with the same policy plus the
 *    rules only a header can set: no framing by other sites (clickjacking), no MIME sniffing, a
 *    strict referrer policy, no camera/mic/location, and HTTPS only.
 */
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** Where the contact form posts (src/scripts/contact.ts). */
export const FORM_ENDPOINT = "https://api.web3forms.com";

/** The policy for a page whose inline scripts have these hashes. */
export function policy(hashes = /** @type {string[]} */ ([]), { header = false } = {}) {
	const directives = [
		"default-src 'self'",
		`script-src 'self' ${hashes.map((h) => `'${h}'`).join(" ")}`.trim(),
		// Inline style attributes and the page's colour variables.
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' data:",
		"font-src 'self'",
		"media-src 'self'",
		`connect-src 'self' ${FORM_ENDPOINT}`,
		"worker-src 'self'",
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		// Only honoured as a header, not in a <meta> tag.
		...(header ? ["frame-ancestors 'none'", "upgrade-insecure-requests"] : []),
	];
	return directives.join("; ");
}

/**
 * The sha256 hashes of a page's inline scripts (not JSON data blocks, which never run).
 * @param {string} html
 */
export function inlineScriptHashes(html) {
	const hashes = new Set();
	for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
		if (/\bsrc=/.test(attrs) || /type="application\/(ld\+)?json"/.test(attrs)) continue;
		hashes.add(`sha256-${createHash("sha256").update(body).digest("base64")}`);
	}
	return [...hashes];
}

/**
 * The page with its policy as a <meta> tag, first thing in <head>.
 * @param {string} html
 * @param {string} csp
 */
export function withPolicyMeta(html, csp) {
	const meta = `<meta http-equiv="Content-Security-Policy" content="${csp}">`;
	// Right after the charset (which must come first), or else at the top of <head>.
	const charset = /<meta charset="utf-8"\s*\/?>/i;
	return charset.test(html)
		? html.replace(charset, (m) => `${m}${meta}`)
		: html.replace(/<head>/i, (m) => `${m}${meta}`);
}

/** @param {string} csp */
export function headersFile(csp) {
	return [
		"/*",
		`  Content-Security-Policy: ${csp}`,
		"  X-Frame-Options: DENY",
		"  X-Content-Type-Options: nosniff",
		"  Referrer-Policy: strict-origin-when-cross-origin",
		"  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()",
		"  Strict-Transport-Security: max-age=31536000; includeSubDomains",
		"  Cross-Origin-Opener-Policy: same-origin",
		"",
	].join("\n");
}

/**
 * @param {string} dir
 * @returns {Promise<string[]>}
 */
async function htmlFiles(dir) {
	/** @type {string[]} */
	const out = [];
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) out.push(...(await htmlFiles(path)));
		else if (entry.name.endsWith(".html")) out.push(path);
	}
	return out;
}

/** @returns {import("astro").AstroIntegration} */
export default function securityHeaders() {
	return {
		name: "security-headers",
		hooks: {
			"astro:build:done": async ({ dir }) => {
				const root = fileURLToPath(dir);
				const all = new Set();
				for (const file of await htmlFiles(root)) {
					const html = await readFile(file, "utf8");
					const hashes = inlineScriptHashes(html);
					hashes.forEach((h) => all.add(h));
					await writeFile(file, withPolicyMeta(html, policy(hashes)));
				}
				await writeFile(join(root, "_headers"), headersFile(policy([...all], { header: true })));
			},
		},
	};
}
