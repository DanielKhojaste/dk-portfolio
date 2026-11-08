// @vitest-environment jsdom
import { readdirSync, readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { skills, work } from "../../site.config";

let setupFilter: typeof import("../skills").setupFilter;

beforeAll(async () => {
	// GSAP's ScrollTrigger asks for matchMedia when it loads; jsdom doesn't have it.
	window.matchMedia = ((query: string) => ({
		matches: false,
		media: query,
		addEventListener() {},
		removeEventListener() {},
		addListener() {},
		removeListener() {},
	})) as unknown as typeof window.matchMedia;
	({ setupFilter } = await import("../skills"));
});

function section() {
	document.body.innerHTML = `
		<section>
			<button data-pick="">All</button>
			<button data-pick="Lineup">Lineup</button>
			<button data-pick="ApotheonAI">ApotheonAI</button>
			<div data-skill-row data-used="Lineup|ApotheonAI">
				<span data-caption></span>
				<span data-skill="TypeScript" data-used="Lineup|ApotheonAI"></span>
				<span data-skill="Rust" data-used="Lineup"></span>
			</div>
			<div data-skill-row data-used="">
				<span data-caption></span>
				<span data-skill="Docker" data-used=""></span>
			</div>
		</section>`;
	return document.querySelector("section")!;
}

const lit = (root: HTMLElement) =>
	[...root.querySelectorAll<HTMLElement>("[data-skill].is-lit")].map((el) => el.dataset.skill);

describe("Skills filter", () => {
	it("starts on All, with nothing singled out", () => {
		const root = section();
		setupFilter(root);
		expect(root.dataset.filter).toBe("");
		expect(lit(root)).toEqual([]);
		expect(root.querySelector('[data-pick=""]')!.getAttribute("aria-pressed")).toBe("true");
	});

	it("lights a project's tools and the rows they're in", () => {
		const root = section();
		setupFilter(root);
		(root.querySelector('[data-pick="Lineup"]') as HTMLElement).click();
		expect(root.dataset.filter).toBe("Lineup");
		expect(lit(root)).toEqual(["TypeScript", "Rust"]);
		const rows = root.querySelectorAll("[data-skill-row]");
		expect(rows[0]!.classList.contains("is-lit")).toBe(true);
		expect(rows[1]!.classList.contains("is-lit")).toBe(false);
		expect(root.querySelector('[data-pick="Lineup"]')!.getAttribute("aria-pressed")).toBe("true");

		(root.querySelector('[data-pick="ApotheonAI"]') as HTMLElement).click();
		expect(lit(root)).toEqual(["TypeScript"]);
		(root.querySelector('[data-pick=""]') as HTMLElement).click();
		expect(lit(root)).toEqual([]);
	});

	it("names a hovered logo in its row", () => {
		const root = section();
		setupFilter(root);
		const rust = root.querySelector<HTMLElement>('[data-skill="Rust"]')!;
		const caption = root.querySelector("[data-caption]")!;
		rust.dispatchEvent(new Event("pointerenter"));
		expect(caption.textContent).toBe("Rust");
		expect(caption.classList.contains("is-shown")).toBe(true);
		rust.dispatchEvent(new Event("pointerleave"));
		expect(caption.classList.contains("is-shown")).toBe(false);
	});
});

describe("Skills settings", () => {
	const all = skills.groups.flatMap((g) => g.skills);

	it("filters by every Work project, plus this site", () => {
		expect(skills.projects).toEqual([...work.projects.map((p) => p.name), "This site"]);
		for (const s of all) for (const p of s.usedIn) expect(skills.projects).toContain(p);
	});

	it("leaves out Solace, Vitest, JUnit, Selenium and Postman", () => {
		const names = all.map((s) => s.name);
		for (const gone of ["Solace PubSub+", "Vitest", "JUnit", "Selenium", "Postman"]) {
			expect(names).not.toContain(gone);
		}
		expect(names).toContain("Playwright");
	});

	it("has a logo saved in the repo for every tool", () => {
		const files = readdirSync("src/assets/tech");
		const text = readFileSync("src/components/TechIcon.astro", "utf8");
		for (const s of all) {
			const match = text.match(new RegExp(`"?${s.name.replace(/[.+]/g, "\\$&")}"?: "([a-z0-9]+)"`));
			expect(match, s.name).not.toBeNull();
			expect(files).toContain(`${match![1]}.svg`);
		}
	});
});
