import { describe, expect, it } from "vitest";
import {
	about,
	colors,
	menuUnderlineFlow,
	sections,
	sideNavUnderlineFlow,
} from "../../site.config";
import { splitHighlights } from "../highlights";
import { nearestStop, pageStops, sectionAt } from "../sections";
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

	it("stops at every section, plus the bottom of the page when there's a footer below", () => {
		expect(pageStops([0, 900, 1800], 1800)).toEqual([0, 900, 1800]);
		expect(pageStops([0, 900, 1800], 2100)).toEqual([0, 900, 1800, 2100]);
		// A last section shorter than the screen can't scroll all the way to its top.
		expect(pageStops([0, 900, 1800], 1500)).toEqual([0, 900, 1500]);
	});

	it("picks the nearest stop", () => {
		const stops = [0, 900, 1800];
		expect(nearestStop(stops, 0)).toBe(0);
		expect(nearestStop(stops, 440)).toBe(0);
		expect(nearestStop(stops, 460)).toBe(1);
		expect(nearestStop(stops, 5000)).toBe(2);
	});
});
