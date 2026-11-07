// @vitest-environment jsdom
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
	it("open on hover and close on leave with a mouse, and a mouse click changes nothing", () => {
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

		click(list[1]!, 1);
		expect(open(list)).toEqual([false, true, false]);

		list[1]!.dispatchEvent(new Event("pointerleave"));
		expect(open(list)).toEqual([false, false, false]);
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

	it("toggle from the keyboard on desktop too", () => {
		const list = rows();
		setupRows(list, { canHover: () => true, animate: (_p, _o, done) => done() });
		click(list[0]!, 0);
		expect(open(list)).toEqual([true, false, false]);
		click(list[0]!, 0);
		expect(open(list)).toEqual([false, false, false]);
	});
});

describe("Work settings", () => {
	it("lists the projects with their links and screenshots, and a red word in the headline", () => {
		expect(work.projects.map((p) => p.name)).toEqual(["Lineup", "ApotheonAI", "ToDone"]);
		expect(work.projects.map((p) => p.link.href)).toEqual([
			"https://github.com/DanielKhojaste/lineup",
			"https://apotheon-ai.vercel.app/",
			"https://marketplace.visualstudio.com/items?itemName=danielkhojaste.todone-vscode",
		]);
		for (const p of work.projects) expect(p.image).toMatch(/^\/projects\/.+\.png$/);
		expect(work.headline).toMatch(/\[.+\]/);
		expect(animation.work.open).toBeGreaterThan(animation.work.close);
	});
});
