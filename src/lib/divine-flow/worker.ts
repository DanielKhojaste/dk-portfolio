/// <reference lib="webworker" />
/**
 * DivineFlow's drawing, off the main thread. The page transfers each flow's canvases here
 * (`transferControlToOffscreen`) and sends size, options and state changes; this worker draws every
 * running flow on one shared animation loop, so the page's own animations never wait on it.
 */
import { createFlowCore, type FlowCore } from "./core";
import type { FromWorker, ToWorker } from "./protocol";

interface Flow {
	core: FlowCore;
	animate: boolean;
	lastFrame: number;
}

export interface WorkerScope {
	postMessage(message: FromWorker): void;
	requestAnimationFrame?: (callback: FrameRequestCallback) => number;
	setTimeout: (callback: () => void, ms: number) => unknown;
	performance: { now(): number };
}

/** The worker's message handling and loop, separate from `self` so it can be tested. */
export function createFlowHost(scope: WorkerScope) {
	const flows = new Map<number, Flow>();
	let scheduled = false;

	// Dedicated workers have requestAnimationFrame for transferred canvases in modern browsers;
	// older ones fall back to a 60fps timer.
	const nextFrame = (callback: (now: number) => void) => {
		if (scope.requestAnimationFrame) scope.requestAnimationFrame(callback);
		else scope.setTimeout(() => callback(scope.performance.now()), 1000 / 60);
	};

	const draw = (id: number, flow: Flow, now: number) => {
		try {
			flow.core.render(now);
		} catch (error) {
			flows.delete(id);
			scope.postMessage({ type: "error", id, message: String(error) });
		}
	};

	const tick = (now: number) => {
		scheduled = false;
		let any = false;
		for (const [id, flow] of flows) {
			if (!flow.animate) continue;
			any = true;
			// Frame-rate cap with a 1ms tolerance so a 60Hz display never skips frames at maxFps 60.
			if (now - flow.lastFrame >= 1000 / flow.core.options.maxFps - 1) {
				flow.lastFrame = now;
				draw(id, flow, now);
			}
		}
		if (any) schedule();
	};

	const schedule = () => {
		if (scheduled) return;
		scheduled = true;
		nextFrame(tick);
	};

	/** Still (or paused) flows only redraw when something changes. */
	const redrawIfIdle = (id: number, flow: Flow) => {
		if (!flow.animate) draw(id, flow, scope.performance.now());
	};

	function handle(message: ToWorker) {
		if (message.type === "init") {
			const core = createFlowCore(message.canvas, message.bloom, message.options, {
				layered: true,
				createCanvas: (w, h) => new OffscreenCanvas(w, h),
			});
			core.setReveal(message.reveal);
			core.setStill(message.still);
			core.resize(message.width, message.height, message.dpr);
			const flow: Flow = { core, animate: message.animate, lastFrame: -Infinity };
			flows.set(message.id, flow);
			draw(message.id, flow, scope.performance.now());
			if (flow.animate) schedule();
			return;
		}

		const flow = flows.get(message.id);
		if (!flow) return;

		switch (message.type) {
			case "resize":
				flow.core.resize(message.width, message.height, message.dpr);
				redrawIfIdle(message.id, flow);
				break;
			case "options":
				flow.core.setOptions(message.options);
				redrawIfIdle(message.id, flow);
				break;
			case "reveal":
				flow.core.setReveal(message.value);
				redrawIfIdle(message.id, flow);
				break;
			case "state":
				flow.animate = message.animate;
				flow.core.setStill(message.still);
				if (flow.animate) schedule();
				else redrawIfIdle(message.id, flow);
				break;
			case "render":
				draw(message.id, flow, scope.performance.now());
				break;
			case "destroy":
				flows.delete(message.id);
				break;
		}
	}

	return { handle, flows };
}

// Only wire up `self` when actually running as a worker (not when imported by tests).
declare const self: DedicatedWorkerGlobalScope;
if (
	typeof self !== "undefined" &&
	typeof (self as { document?: unknown }).document === "undefined"
) {
	const host = createFlowHost(self as unknown as WorkerScope);
	self.onmessage = (event: MessageEvent<ToWorker>) => host.handle(event.data);
}
