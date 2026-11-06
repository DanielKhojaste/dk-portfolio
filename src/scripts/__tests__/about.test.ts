import { describe, expect, it } from "vitest";
import {
	about,
	animation,
	colors,
	menuUnderlineFlow,
	motion,
	sections,
	sideNavUnderlineFlow,
} from "../../site.config";
import { FILL_EMPTY, FILL_FULL } from "../about";
import { splitHighlights } from "../highlights";
import { sectionAt } from "../sections";
import { underlineHeight, underlineOptions } from "../underline-options";

describe("splitHighlights", () => {
	it("marks [bracketed] words and keeps punctuation after them separate", () => {
		expect(splitHighlights("apps that are [fast], look [sharp] and hold up.")).toEqual([
			{ text: "apps", highlight: false, tail: "" },
			{ text: "that", highlight: false, tail: "" },
			{ text: "are", highlight: false, tail: "" },
			{ text: "fast", highlight: true, tail: "," },
			{ text: "look", highlight: false, tail: "" },
			{ text: "sharp", highlight: true, tail: "" },
			{ text: "and", highlight: false, tail: "" },
			{ text: "hold", highlight: false, tail: "" },
			{ text: "up.", highlight: false, tail: "" },
		]);
	});

	it("handles copy with no highlights, multi-word highlights and empty brackets", () => {
		expect(splitHighlights("plain words")).toHaveLength(2);
		expect(splitHighlights("[web apps] rule")[0]).toEqual({
			text: "web apps",
			highlight: true,
			tail: "",
		});
		expect(splitHighlights("a [] b").map((w) => w.text)).toEqual(["a", "b"]);
	});

	it("says Canada, not a city", () => {
		expect(`${about.text} ${about.facts.map((f) => f.value).join(" ")}`).not.toMatch(/Ottawa/);
		expect(about.facts[0]).toEqual({ label: "Based in", value: "Canada" });
	});

	it("reads the About headline from the settings, with its red words", () => {
		const words = splitHighlights(about.headline);
		expect(words.filter((w) => w.highlight).map((w) => w.text)).toEqual(["fast", "sharp"]);
		expect(words.map((w) => w.text + w.tail).join(" ")).toBe(about.headline.replace(/[[\]]/g, ""));
	});
});

describe("underlineOptions", () => {
	it("draws one uniform strand from the configured side, moved only by the wave", () => {
		const options = underlineOptions({ ...menuUnderlineFlow, from: "left" }, colors.menuUnderline);
		expect(options).toMatchObject({
			theme: colors.menuUnderline,
			originX: 0,
			sides: "right",
			lineCount: 1,
			amplitude: 0,
			uniform: true,
			fadeFromOrigin: false,
			wave: menuUnderlineFlow.wave,
			wavePeriods: menuUnderlineFlow.waves,
			tailSway: menuUnderlineFlow.sway,
			thickness: menuUnderlineFlow.thickness,
			seed: 7100,
		});
		expect(options).not.toHaveProperty("from");
		expect(
			underlineOptions({ ...menuUnderlineFlow, from: "center" }, colors.menuUnderline),
		).toMatchObject({
			originX: 0.5,
			sides: "both",
		});
	});

	it("sizes the strip from the wave and sway, plus room for the glow", () => {
		expect(underlineHeight({ wave: 7, sway: 0 })).toBe(38);
		expect(underlineHeight({ wave: -1.5, sway: 2 })).toBe(32);
	});

	it("keeps the side nav's wave flatter than the menu's, so it stays clear of the next label", () => {
		expect(Math.abs(sideNavUnderlineFlow.wave)).toBeLessThan(Math.abs(menuUnderlineFlow.wave));
		expect(underlineHeight(sideNavUnderlineFlow)).toBeLessThanOrEqual(30);
	});
});

describe("sections", () => {
	it("lists the one-pager top to bottom, starting with the hero and About", () => {
		expect(sections.map((s) => s.href).slice(0, 2)).toEqual(["#intro", "#about"]);
	});

	it("finds the section whose top is above the middle of the screen", () => {
		const tops = [0, 900, 1800, 2700];
		expect(sectionAt(tops, 0, 900)).toBe(0);
		expect(sectionAt(tops, 449, 900)).toBe(0);
		expect(sectionAt(tops, 450, 900)).toBe(1);
		expect(sectionAt(tops, 2700, 900)).toBe(3);
	});
});

describe("motion", () => {
	it("goes quick, hover, draw, glide: each step slower than the last", () => {
		expect(motion.quick).toBeLessThan(motion.hover);
		expect(motion.hover).toBeLessThan(motion.draw);
		expect(motion.draw).toBeLessThan(motion.glide);
	});

	it("drives the hovers, fills and glides from the shared pace", () => {
		expect(animation.textHover.duration).toBe(motion.hover);
		expect(animation.logoHover.duration).toBe(motion.hover);
		expect(animation.about.highlight).toBe(motion.draw);
		expect(animation.scroll.smooth).toBe(motion.glide);
		expect(animation.hover).toBe(motion.quick);
		// Hovers answer the pointer straight away: an "out" ease, never one that starts slowly.
		expect(animation.textHover.ease).toBe(motion.ease.out.css);
		expect(animation.logoHover.ease).toBe(motion.ease.out.css);
	});

	it("fills the red words in 0.9s each, with a 0.2s pause between them", () => {
		expect(animation.about.highlight).toBe(0.9);
		expect(animation.about.highlightGap).toBe(0.2);
	});

	it("wipes the red words across the word itself, not empty space", () => {
		const right = (inset: string) => Number(inset.split(" ")[1]!.replace("%", ""));
		// Starts at the word's left edge (plus a little overhang) and ends just past its right edge.
		expect(right(FILL_EMPTY)).toBeLessThanOrEqual(110);
		expect(right(FILL_FULL)).toBeGreaterThanOrEqual(-10);
	});
});
