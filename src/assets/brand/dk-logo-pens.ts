/**
 * Hand-traced pen strokes for the DK logo (viewBox 0 0 62 53), in the order a person would write it:
 * D stem, D bowl (from the top-left flick, round the right side, out to the bottom-left curl),
 * K stem, then the K arm into the junction and out along the leg.
 *
 * `width` is the brush width that covers the letter at that point. Together the strokes cover
 * ~99.85% of the logo's ink; the mask is removed when the animation finishes, so the end state is exact.
 */
export interface PenStroke {
	d: string;
	width: number;
}

export const dkLogoPens: readonly PenStroke[] = [
	{ d: "M17.2 5.6 C15.6 12 11.4 27 7.4 38.6", width: 7 },
	{
		d: "M11.8 16 C10.8 11.6 9.4 8.6 9.4 6.8 C12 4.4 17 2.6 22 2.1 C27 1.6 31.2 3.6 33.6 8 C35.8 12.4 34.6 17.6 31.6 21.4 L24.6 29.8 C20 35 15 39 9 41.4 C5.2 42.8 1.8 41 0.9 36.4",
		width: 5.4,
	},
	{ d: "M45.3 11.2 C43.6 20 39.2 32 35.3 48.3", width: 7.2 },
	{ d: "M60.6 11.8 C57.2 15.4 49 22.4 39.8 31.6 L45 40.6 C48 44 52 47.4 58.6 51.8", width: 6.8 },
];
