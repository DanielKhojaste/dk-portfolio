// @vitest-environment jsdom
import { readdirSync, readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { skills, work } from "../../site.config";

let setupFilter: typeof import("../skills").setupFilter;
let placeCaption: typeof import("../skills").placeCaption;

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
	({ setupFilter, placeCaption } = await import("../skills"));
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
		expect(skills.projects).toEqual([...work.projects.map((p) => p.name), "Portfolio"]);
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

describe("placeCaption", () => {
	const view = { width: 1000, height: 800 };
	const caption = { width: 100, height: 20 };
	const logos = { left: 600, top: 300, right: 980, bottom: 330 };
	const name = { left: 100, top: 300, right: 400, bottom: 340 };
	const logoAt = (left: number, top = 300) => ({ left, top, right: left + 26, bottom: top + 26 });

	it("centres the name right under the logo", () => {
		const p = placeCaption("under", { logo: logoAt(700), logos, name, caption, view });
		expect(p).toEqual({ left: 713 - 50 - 600, top: 326 + 8 - 300, at: "under" });
	});

	it("centres the name right over the logo", () => {
		const p = placeCaption("above", { logo: logoAt(700), logos, name, caption, view });
		expect(p).toEqual({ left: 63, top: 300 - 8 - 20 - 300, at: "above" });
	});

	it("never runs off the left or right of the window", () => {
		const right = placeCaption("under", { logo: logoAt(960), logos, name, caption, view });
		expect(right.left + logos.left + caption.width).toBe(view.width - 8);
		const left = placeCaption("under", {
			logo: logoAt(0),
			logos: { ...logos, left: 0 },
			name: null,
			caption,
			view,
		});
		expect(left.left).toBe(8);
	});

	it("flips over or under when there's no room at the bottom or top", () => {
		const low = placeCaption("under", { logo: logoAt(700, 770), logos, name, caption, view });
		expect(low.at).toBe("above");
		const high = placeCaption("above", { logo: logoAt(700, 10), logos, name, caption, view });
		expect(high.at).toBe("under");
	});

	it("sits beside the row's logos when it fits, and falls back to under when it doesn't", () => {
		const beside = placeCaption("beside", { logo: logoAt(700), logos, name, caption, view });
		expect(beside).toEqual({ left: -16 - 100, top: 15 - 10, at: "beside" });
		const tight = placeCaption("beside", {
			logo: logoAt(700),
			logos,
			name: { ...name, right: 560 },
			caption,
			view,
		});
		expect(tight.at).toBe("under");
	});
});
