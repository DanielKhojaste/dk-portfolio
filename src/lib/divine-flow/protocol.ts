import type { DivineFlowOptions } from "./types";

/**
 * Messages from the page to the DivineFlow worker. One worker draws every flow on the page; each
 * flow is addressed by `id`.
 */
export type ToWorker =
	| {
			type: "init";
			id: number;
			canvas: OffscreenCanvas;
			bloom: OffscreenCanvas;
			options: DivineFlowOptions;
			width: number;
			height: number;
			dpr: number;
			reveal: number;
			still: boolean;
			animate: boolean;
	  }
	| { type: "resize"; id: number; width: number; height: number; dpr: number }
	| { type: "options"; id: number; options: DivineFlowOptions }
	| { type: "reveal"; id: number; value: number }
	| { type: "state"; id: number; animate: boolean; still: boolean }
	| { type: "render"; id: number }
	| { type: "destroy"; id: number };

/** Messages from the worker back to the page. */
export type FromWorker = { type: "error"; id: number; message: string };
