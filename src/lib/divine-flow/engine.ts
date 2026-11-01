import { createFlowCore, type FlowCore } from "./core";
import { resolveOptions } from "./options";
import type { FromWorker, ToWorker } from "./protocol";
import type { DivineFlowInstance, DivineFlowOptions, ResolvedDivineFlowOptions } from "./types";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** First box up the tree with a usable size; falls back to the viewport. */
function measure(el: HTMLElement): { width: number; height: number } {
	let node: HTMLElement | null = el;
	while (node) {
		const rect = node.getBoundingClientRect();
		if (rect.width >= 2 && rect.height >= 2) return rect;
		node = node.parentElement;
	}
	return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * Where the drawing happens: on the main thread with its own animation loop, or in the shared
 * worker. The engine tells it when to animate; everything else is the same either way.
 */
interface Backend {
	readonly offscreen: boolean;
	resize(width: number, height: number, dpr: number): void;
	setOptions(input: DivineFlowOptions): void;
	setReveal(progress: number): void;
	/** Whether the loop should run, and whether frames are still (reduced motion). */
	setState(animate: boolean, still: boolean): void;
	render(timeMs?: number): void;
	destroy(): void;
}

function mainThreadBackend(
	canvas: HTMLCanvasElement,
	bloomCanvas: HTMLCanvasElement,
	input: DivineFlowOptions,
	layered: boolean,
): Backend {
	const core: FlowCore = createFlowCore(canvas, bloomCanvas, input, {
		layered,
		contextSettings: layered ? {} : { desynchronized: true },
		createCanvas: (w, h) => {
			const sprite = document.createElement("canvas");
			sprite.width = w;
			sprite.height = h;
			return sprite;
		},
	});
	let raf = 0;
	let lastFrame = -Infinity;
	let animate = false;
	let isStill = false;

	const tick = (now: number) => {
		raf = 0;
		if (!animate) return;
		// Frame-rate cap with a 1ms tolerance so a 60Hz display never skips frames at maxFps 60.
		if (now - lastFrame >= 1000 / core.options.maxFps - 1) {
			lastFrame = now;
			core.render(now);
		}
		raf = requestAnimationFrame(tick);
	};
	const cancel = () => {
		if (raf) cancelAnimationFrame(raf);
		raf = 0;
	};
	// The running loop picks changes up on its next frame; a still canvas needs a redraw.
	const redrawIfIdle = () => {
		if (!animate) core.render(performance.now());
	};

	return {
		offscreen: false,
		resize(width, height, dpr) {
			core.resize(width, height, dpr);
			redrawIfIdle();
		},
		setOptions(next) {
			core.setOptions(next);
		},
		setReveal(progress) {
			core.setReveal(progress);
			redrawIfIdle();
		},
		setState(next, still) {
			const stillChanged = still !== isStill;
			isStill = still;
			animate = next;
			core.setStill(still);
			if (animate) {
				if (!raf) raf = requestAnimationFrame(tick);
				return;
			}
			cancel();
			// Switching to reduced motion settles the flow into its still shape.
			if (stillChanged) core.render(performance.now());
		},
		render(timeMs = performance.now()) {
			core.render(timeMs);
		},
		destroy: cancel,
	};
}

/* ---------------------------------------------------------------------------------------------- */

let sharedWorker: Worker | null | undefined;
let nextId = 1;
const errorHandlers = new Map<number, (message: string) => void>();

/** The one worker that draws every offscreen flow on the page, created on first use. */
function getWorker(): Worker | null {
	if (sharedWorker !== undefined) return sharedWorker;
	try {
		sharedWorker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
		sharedWorker.addEventListener("message", (event: MessageEvent<FromWorker>) => {
			if (event.data.type === "error") errorHandlers.get(event.data.id)?.(event.data.message);
		});
	} catch {
		sharedWorker = null;
	}
	return sharedWorker;
}

/** For tests: forget the shared worker so the next flow creates (or fails to create) a new one. */
export function resetSharedWorker() {
	sharedWorker = undefined;
	errorHandlers.clear();
}

function canDrawOffscreen(canvas: HTMLCanvasElement): boolean {
	return (
		typeof Worker === "function" &&
		typeof OffscreenCanvas === "function" &&
		typeof canvas.transferControlToOffscreen === "function"
	);
}

function workerBackend(
	worker: Worker,
	canvas: HTMLCanvasElement,
	bloomCanvas: HTMLCanvasElement,
	input: DivineFlowOptions,
	size: { width: number; height: number; dpr: number },
	state: { reveal: number; animate: boolean; still: boolean },
): Backend {
	const id = nextId++;
	const send = (message: ToWorker, transfer: Transferable[] = []) =>
		worker.postMessage(message, transfer);

	const offCanvas = canvas.transferControlToOffscreen();
	const offBloom = bloomCanvas.transferControlToOffscreen();
	send(
		{
			type: "init",
			id,
			canvas: offCanvas,
			bloom: offBloom,
			options: input,
			...size,
			...state,
		},
		[offCanvas, offBloom],
	);
	errorHandlers.set(id, (message) => console.warn("divine-flow: worker could not draw", message));

	return {
		offscreen: true,
		resize: (width, height, dpr) => send({ type: "resize", id, width, height, dpr }),
		setOptions: (options) => send({ type: "options", id, options }),
		setReveal: (value) => send({ type: "reveal", id, value }),
		setState: (animate, still) => send({ type: "state", id, animate, still }),
		render: () => send({ type: "render", id }),
		destroy: () => {
			errorHandlers.delete(id);
			send({ type: "destroy", id });
		},
	};
}

/* ---------------------------------------------------------------------------------------------- */

/**
 * Mount DivineFlow into `container`. The engine creates a canvas that fills the container (or uses
 * `options.canvas`), keeps it sized to the container, and animates it until `destroy()`. Where the
 * browser supports it, the drawing itself happens in a worker, off the main thread.
 *
 * ```ts
 * const flow = createDivineFlow(document.querySelector(".hero")!, { theme: "crimson", emberCount: 60 });
 * // later
 * flow.destroy();
 * ```
 */
export function createDivineFlow(
	container: HTMLElement,
	options: DivineFlowOptions = {},
): DivineFlowInstance {
	if (typeof window === "undefined" || typeof document === "undefined") {
		throw new Error("divine-flow: createDivineFlow() must run in a browser.");
	}

	const { canvas: providedCanvas, className, ...rest } = options;
	let input: DivineFlowOptions = { ...rest };
	let resolved: ResolvedDivineFlowOptions = resolveOptions(input);

	const ownsCanvas = !providedCanvas;
	const canvas = providedCanvas ?? document.createElement("canvas");
	const fill = {
		position: "absolute",
		inset: "0",
		width: "100%",
		height: "100%",
		display: "block",
		pointerEvents: "none",
	};
	if (ownsCanvas) {
		canvas.setAttribute("aria-hidden", "true");
		canvas.dataset.divineFlowCanvas = "";
		if (className) canvas.className = className;
		Object.assign(canvas.style, fill);
		container.appendChild(canvas);
	}

	// Layered mode: the low-res bloom gets its own canvas element that the browser scales on the GPU,
	// instead of being upscaled into the full-resolution canvas every frame. Both layers composite
	// normally: an additive CSS blend (plus-lighter) looked marginally brighter but cost ~25% more
	// per frame on a real page. Only possible when the engine owns the canvas.
	const layered = ownsCanvas;
	const bloomCanvas = document.createElement("canvas");
	if (layered) {
		bloomCanvas.setAttribute("aria-hidden", "true");
		bloomCanvas.dataset.divineFlowBloom = "";
		Object.assign(bloomCanvas.style, fill);
		container.insertBefore(bloomCanvas, canvas);
	}

	const motionQuery =
		typeof window.matchMedia === "function" ? window.matchMedia(REDUCED_MOTION_QUERY) : null;

	let running = true;
	let destroyed = false;
	let onScreen = true;
	let reveal = resolved.reveal;

	const isStill = () =>
		resolved.reducedMotion === "auto"
			? Boolean(motionQuery?.matches)
			: resolved.reducedMotion === true;

	const shouldAnimate = () =>
		running &&
		!destroyed &&
		!isStill() &&
		resolved.motion > 0 &&
		(!resolved.pauseWhenHidden || (!document.hidden && onScreen));

	const size = () => {
		const rect = measure(container);
		return { width: rect.width, height: rect.height, dpr: window.devicePixelRatio || 1 };
	};

	const worker = ownsCanvas && resolved.offscreen && canDrawOffscreen(canvas) ? getWorker() : null;
	const backend: Backend = worker
		? workerBackend(worker, canvas, bloomCanvas, input, size(), {
				reveal,
				animate: shouldAnimate(),
				still: isStill(),
			})
		: mainThreadBackend(canvas, bloomCanvas, input, layered);

	/** Tell the backend whether to animate, after anything that might change it. */
	const sync = () => {
		if (!destroyed) backend.setState(shouldAnimate(), isStill());
	};

	function resize() {
		if (destroyed) return;
		const { width, height, dpr } = size();
		backend.resize(width, height, dpr);
	}

	const resizeObserver =
		typeof ResizeObserver === "function" ? new ResizeObserver(() => resize()) : null;
	const intersectionObserver =
		typeof IntersectionObserver === "function"
			? new IntersectionObserver(
					(entries) => {
						const entry = entries[entries.length - 1];
						onScreen = Boolean(entry?.isIntersecting);
						sync();
					},
					{ threshold: 0.01 },
				)
			: null;

	const onWindowResize = () => resize();

	resizeObserver?.observe(container);
	intersectionObserver?.observe(container);
	if (!resizeObserver) window.addEventListener("resize", onWindowResize);
	document.addEventListener("visibilitychange", sync);
	motionQuery?.addEventListener?.("change", sync);

	if (!backend.offscreen) {
		resize();
		backend.render();
	}
	sync();

	return {
		canvas,
		get options() {
			return resolved;
		},
		get isRunning() {
			return running && !destroyed;
		},
		get offscreen() {
			return backend.offscreen;
		},
		get reveal() {
			return reveal;
		},
		setReveal(progress: number) {
			if (destroyed) return;
			reveal = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 1));
			backend.setReveal(reveal);
		},
		start() {
			if (destroyed) return;
			running = true;
			sync();
		},
		stop() {
			running = false;
			sync();
		},
		update(next: DivineFlowOptions) {
			if (destroyed) return;
			const { canvas: _canvas, className: _className, ...changes } = next;
			input = { ...input, ...changes };
			resolved = resolveOptions(input);
			if (next.reveal !== undefined) reveal = resolved.reveal;
			backend.setOptions({ ...input, reveal });
			resize();
			backend.render();
			sync();
		},
		resize,
		renderFrame(timeMs?: number) {
			if (!destroyed) backend.render(timeMs);
		},
		destroy() {
			if (destroyed) return;
			destroyed = true;
			running = false;
			backend.setState(false, isStill());
			backend.destroy();
			resizeObserver?.disconnect();
			intersectionObserver?.disconnect();
			window.removeEventListener("resize", onWindowResize);
			document.removeEventListener("visibilitychange", sync);
			motionQuery?.removeEventListener?.("change", sync);
			if (ownsCanvas) canvas.remove();
			if (layered) bloomCanvas.remove();
		},
	};
}
