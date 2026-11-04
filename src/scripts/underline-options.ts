/**
 * Turns underline settings from site.config.ts into DivineFlow options: one uniform strand, drawn out
 * from `from`, with only the wave (and the tails' sway) moving it, so it stays one smooth curve.
 */
import type { DivineFlowOptions, DivineFlowPalette } from "../lib/divine-flow";
import type { UnderlineFlow } from "../site.config";

/** Where the strand starts, as DivineFlow's origin and the side(s) it flows towards. */
const ORIGINS = {
	center: { originX: 0.5, sides: "both" },
	left: { originX: 0, sides: "right" },
	right: { originX: 1, sides: "left" },
} as const;

export function underlineOptions(
	settings: UnderlineFlow,
	theme: DivineFlowPalette,
): Omit<DivineFlowOptions, "canvas"> {
	const { from, wave, waves, sway, ...strand } = settings;
	return {
		theme,
		...ORIGINS[from],
		originY: 0.5,
		innerGap: 0,
		wave,
		wavePeriods: waves,
		tailSway: sway,
		// Only the wave and tails move: no per-point wobble, so it stays one smooth curve.
		amplitude: 0,
		variance: 0,
		fadeFromOrigin: false,
		lineCount: 1,
		scatterCount: 0,
		spread: 0,
		speckCount: 0,
		emberCount: 0,
		revealStagger: 0,
		uniform: true,
		maxDpr: 2,
		// Same seed everywhere, so every underline is exactly the same strand.
		seed: 7100,
		...strand,
	};
}

/** Height (px) of the strip an underline is drawn in: room for the wave, the sway and the glow. */
export function underlineHeight({ wave, sway }: Pick<UnderlineFlow, "wave" | "sway">): number {
	return Math.ceil(Math.abs(wave) + Math.abs(sway)) * 2 + 24;
}
