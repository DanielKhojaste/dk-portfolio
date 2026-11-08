import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
	FORM_ENDPOINT,
	headersFile,
	inlineScriptHashes,
	policy,
	withPolicyMeta,
} from "../../../integrations/security-headers.mjs";

const page = `<!doctype html><html><head><meta charset="utf-8"><script>document.documentElement.classList.add("js");</script><script type="application/ld+json">{"a":1}</script><script type="module" src="/x.js"></script></head><body></body></html>`;

describe("security headers", () => {
	it("allows only the page's own inline script, by its hash", () => {
		const hash = createHash("sha256")
			.update('document.documentElement.classList.add("js");')
			.digest("base64");
		expect(inlineScriptHashes(page)).toEqual([`sha256-${hash}`]);
	});

	it("locks scripts, plugins, framing and requests down to this site and the form", () => {
		const csp = policy(["sha256-abc"], { header: true });
		expect(csp).toContain("default-src 'self'");
		expect(csp).toContain("script-src 'self' 'sha256-abc'");
		expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
		expect(csp).not.toContain("unsafe-eval");
		expect(csp).toContain("object-src 'none'");
		expect(csp).toContain("frame-ancestors 'none'");
		expect(csp).toContain(`connect-src 'self' ${FORM_ENDPOINT}`);
		expect(csp).toContain("base-uri 'self'");
	});

	it("puts the policy first in <head>, without the header-only rules", () => {
		const html = withPolicyMeta(page, policy(inlineScriptHashes(page)));
		expect(html).toMatch(/<meta charset="utf-8"><meta http-equiv="Content-Security-Policy"/);
		expect(html).not.toContain("frame-ancestors");
	});

	it("writes the headers file for the host", () => {
		const file = headersFile(policy([], { header: true }));
		expect(file.startsWith("/*\n")).toBe(true);
		for (const header of [
			"Content-Security-Policy:",
			"X-Frame-Options: DENY",
			"X-Content-Type-Options: nosniff",
			"Referrer-Policy:",
			"Permissions-Policy:",
			"Strict-Transport-Security:",
		]) {
			expect(file).toContain(header);
		}
	});
});
