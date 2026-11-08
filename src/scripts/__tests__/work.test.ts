// @vitest-environment jsdom
import { existsSync } from "node:fs";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { animation, work } from "../../site.config";

let setupRows: typeof import("../work").setupRows;

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
	({ setupRows } = await import("../work"));
});

function rows(count = 3) {
	document.body.innerHTML = Array.from(
		{ length: count },
		(_, i) => `
		<li data-work-row>
			<button data-work-toggle aria-expanded="false">Project ${i}</button>
			<div data-work-panel></div>
		</li>`,
	).join("");
	return [...document.querySelectorAll<HTMLElement>("[data-work-row]")];
}

const click = (row: HTMLElement, detail: number) =>
	row
		.querySelector("[data-work-toggle]")!
		.dispatchEvent(new MouseEvent("click", { bubbles: true, detail }));
const open = (list: HTMLElement[]) => list.map((r) => r.classList.contains("is-open"));

describe("Work rows", () => {
	it("open on hover and close on leave with a mouse", () => {
		const list = rows();
		const animate = vi.fn((_p: HTMLElement, _o: boolean, done: () => void) => done());
		const onResize = vi.fn();
		setupRows(list, { canHover: () => true, animate, onResize });

		list[1]!.dispatchEvent(new Event("pointerenter"));
		expect(open(list)).toEqual([false, true, false]);
		expect(list[1]!.querySelector("[data-work-toggle]")!.getAttribute("aria-expanded")).toBe(
			"true",
		);
		expect(animate).toHaveBeenLastCalledWith(
			list[1]!.querySelector("[data-work-panel]"),
			true,
			expect.any(Function),
		);
		expect(onResize).toHaveBeenCalled();

		list[1]!.dispatchEvent(new Event("pointerleave"));
		expect(open(list)).toEqual([false, false, false]);
	});

	it("stay open after a click, even once the mouse leaves, until clicked again", () => {
		const list = rows();
		setupRows(list, { canHover: () => true, animate: (_p, _o, done) => done() });

		list[0]!.dispatchEvent(new Event("pointerenter"));
		click(list[0]!, 1);
		list[0]!.dispatchEvent(new Event("pointerleave"));
		expect(open(list)).toEqual([true, false, false]);

		// Hovering another row still opens (and closes) it; the pinned one stays.
		list[2]!.dispatchEvent(new Event("pointerenter"));
		expect(open(list)).toEqual([true, false, true]);
		list[2]!.dispatchEvent(new Event("pointerleave"));
		expect(open(list)).toEqual([true, false, false]);

		// Clicking it again lets it go.
		click(list[0]!, 1);
		expect(open(list)).toEqual([false, false, false]);
	});

	it("keep one row pinned at a time: pinning another closes the last", () => {
		const list = rows();
		setupRows(list, { canHover: () => true, animate: (_p, _o, done) => done() });
		click(list[0]!, 1);
		click(list[1]!, 1);
		list[1]!.dispatchEvent(new Event("pointerleave"));
		expect(open(list)).toEqual([false, true, false]);
	});

	it("open with a tap on touch screens, one at a time, and close with another tap", () => {
		const list = rows();
		setupRows(list, { canHover: () => false, animate: (_p, _o, done) => done() });

		list[0]!.dispatchEvent(new Event("pointerenter"));
		expect(open(list)).toEqual([false, false, false]);

		click(list[0]!, 1);
		expect(open(list)).toEqual([true, false, false]);
		click(list[2]!, 1);
		expect(open(list)).toEqual([false, false, true]);
		click(list[2]!, 1);
		expect(open(list)).toEqual([false, false, false]);
	});

	it("don't open or close while the page scrolls under a still pointer, only once it moves", () => {
		const list = rows();
		let scrolling = false;
		setupRows(list, {
			canHover: () => true,
			animate: (_p, _o, done) => done(),
			isScrolling: () => scrolling,
		});
		list[2]!.dispatchEvent(new Event("pointerenter"));
		expect(open(list)).toEqual([false, false, true]);

		// Scrolling down: the last row slides out from under the pointer, and the one above slides in.
		scrolling = true;
		list[2]!.dispatchEvent(new Event("pointerleave"));
		list[1]!.dispatchEvent(new Event("pointerenter"));
		expect(open(list)).toEqual([false, false, true]);

		// The pointer moves (outside every row): now the last one closes, and nothing else opens.
		scrolling = false;
		document.body.dispatchEvent(new Event("pointermove", { bubbles: true }));
		expect(open(list)).toEqual([false, false, false]);
	});

	it("open a row the pointer has come to rest over once it moves after scrolling", () => {
		const list = rows();
		let scrolling = true;
		setupRows(list, {
			canHover: () => true,
			animate: (_p, _o, done) => done(),
			isScrolling: () => scrolling,
		});
		list[0]!.dispatchEvent(new Event("pointerenter"));
		expect(open(list)).toEqual([false, false, false]);
		scrolling = false;
		list[0]!
			.querySelector("[data-work-panel]")!
			.dispatchEvent(new Event("pointermove", { bubbles: true }));
		expect(open(list)).toEqual([true, false, false]);
	});

	it("toggle from the keyboard too", () => {
		const list = rows();
		setupRows(list, { canHover: () => true, animate: (_p, _o, done) => done() });
		click(list[0]!, 0);
		expect(open(list)).toEqual([true, false, false]);
		click(list[0]!, 0);
		expect(open(list)).toEqual([false, false, false]);
	});
});

describe("Work settings", () => {
	it("lists the projects, each with its links, plain feature points and a screenshot", () => {
		expect(work.projects.map((p) => p.name)).toEqual([
			"Lineup",
			"Urlocker Consulting",
			"ApotheonAI",
			"ToDone",
		]);
		const link = (name: string, label: string) =>
			work.projects.find((p) => p.name === name)!.links.find((l) => l.label === label)?.href;
		expect(link("Lineup", "GitHub")).toBe("https://github.com/DanielKhojaste/lineup");
		expect(link("ApotheonAI", "GitHub")).toBe("https://github.com/DanielKhojaste/apotheon-ai");
		expect(link("ToDone", "GitHub")).toBe("https://github.com/DanielKhojaste/ToDone");
		expect(link("ApotheonAI", "Live site")).toBe("https://apotheon-ai.vercel.app/");
		expect(link("ToDone", "VS Code Marketplace")).toBe(
			"https://marketplace.visualstudio.com/items?itemName=danielkhojaste.todone-vscode",
		);
		// A client site: its live address, and no repo of its own.
		expect(link("Urlocker Consulting", "Live site")).toBe("https://www.urlockerconsulting.com/");
		expect(link("Urlocker Consulting", "GitHub")).toBeUndefined();
		for (const p of work.projects) {
			expect(existsSync(`src/assets/projects/${p.image}`), p.image).toBe(true);
			expect(p.features.length).toBeGreaterThanOrEqual(3);
			expect(p.summary.length).toBeGreaterThan(20);
		}
		expect(work.headline).toMatch(/\[.+\]/);
		expect(animation.work.open).toBeGreaterThan(animation.work.close);
	});
});
