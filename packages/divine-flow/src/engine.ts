import { makePointBuffer, samplesForWidth, type FlowLayout } from "./geometry.js";
import { resolveOptions } from "./options.js";
import { drawFrame, type FrameState } from "./renderer.js";
import { createScene, type Scene } from "./scene.js";
import type { DivineFlowInstance, DivineFlowOptions, ResolvedDivineFlowOptions } from "./types.js";

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

function get2d(canvas: HTMLCanvasElement, settings?: CanvasRenderingContext2DSettings) {
	const ctx = canvas.getContext("2d", settings);
	if (!ctx) throw new Error("divine-flow: 2D canvas context is not available.");
	return ctx;
}

/**
 * Mount DivineFlow into `container`. The engine creates a canvas that fills the container (or uses
 * `options.canvas`), keeps it sized to the container, and runs the animation loop until `destroy()`.
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

	let input: DivineFlowOptions = { ...options };
	let resolved: ResolvedDivineFlowOptions = resolveOptions(input);

	const ownsCanvas = !options.canvas;
	const canvas = options.canvas ?? document.createElement("canvas");
	if (ownsCanvas) {
		canvas.setAttribute("aria-hidden", "true");
		canvas.dataset.divineFlow = "";
		if (options.className) canvas.className = options.className;
		Object.assign(canvas.style, {
			position: "absolute",
			inset: "0",
			width: "100%",
			height: "100%",
			display: "block",
			pointerEvents: "none",
		});
		container.appendChild(canvas);
	}

	const ctx = get2d(canvas, { alpha: true, desynchronized: true });
	const bloomCanvas = document.createElement("canvas");
	const bloomCtx = get2d(bloomCanvas, { alpha: true });

	const motionQuery =
		typeof window.matchMedia === "function" ? window.matchMedia(REDUCED_MOTION_QUERY) : null;

	let scene: Scene = createScene(resolved);
	let buffers = scene.threads.map(makePointBuffer);
	let width = 1;
	let height = 1;
	let samples = samplesForWidth(width);
	let raf = 0;
	let running = true;
	let destroyed = false;
	let onScreen = true;

	const isStill = () =>
		resolved.reducedMotion === "auto"
			? Boolean(motionQuery?.matches)
			: resolved.reducedMotion === true;

	const layout = (): FlowLayout => ({
		width,
		height,
		originX: resolved.originX,
		originY: resolved.originY,
		innerGap: resolved.innerGap,
		motion: resolved.motion,
		still: isStill(),
	});

	const shouldAnimate = () =>
		running &&
		!destroyed &&
		!isStill() &&
		resolved.motion > 0 &&
		(!resolved.pauseWhenHidden || (!document.hidden && onScreen));

	function renderFrame(timeMs: number = performance.now()) {
		if (destroyed) return;
		const state: FrameState = {
			ctx,
			bloomCtx,
			scene,
			buffers,
			samples,
			layout: layout(),
			palette: resolved.palette,
			emberSpeed: resolved.emberSpeed,
		};
		drawFrame(state, timeMs / 1000);
	}

	function tick(now: number) {
		raf = 0;
		if (!shouldAnimate()) return;
		renderFrame(now);
		raf = requestAnimationFrame(tick);
	}

	function schedule() {
		if (raf || !shouldAnimate()) return;
		raf = requestAnimationFrame(tick);
	}

	function cancel() {
		if (raf) cancelAnimationFrame(raf);
		raf = 0;
	}

	function resize() {
		if (destroyed) return;
		const rect = measure(container);
		width = Math.max(1, Math.round(rect.width));
		height = Math.max(1, Math.round(rect.height));
		const dpr = Math.min(window.devicePixelRatio || 1, resolved.maxDpr);
		samples = samplesForWidth(width);

		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(height * dpr);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.lineCap = "round";
		ctx.lineJoin = "round";

		bloomCanvas.width = Math.max(1, Math.round(width * resolved.bloomScale));
		bloomCanvas.height = Math.max(1, Math.round(height * resolved.bloomScale));
		bloomCtx.setTransform(bloomCanvas.width / width, 0, 0, bloomCanvas.height / height, 0, 0);
		bloomCtx.lineCap = "round";
		bloomCtx.lineJoin = "round";

		// Animated frames redraw on the next tick; still frames need an explicit redraw.
		if (!shouldAnimate()) renderFrame();
	}

	const resizeObserver =
		typeof ResizeObserver === "function" ? new ResizeObserver(() => resize()) : null;
	const intersectionObserver =
		typeof IntersectionObserver === "function"
			? new IntersectionObserver(
					(entries) => {
						const entry = entries[entries.length - 1];
						onScreen = Boolean(entry?.isIntersecting);
						if (onScreen) schedule();
						else if (resolved.pauseWhenHidden) cancel();
					},
					{ threshold: 0.01 },
				)
			: null;

	const onVisibility = () => {
		if (document.hidden && resolved.pauseWhenHidden) cancel();
		else schedule();
	};
	const onWindowResize = () => resize();
	const onMotionChange = () => {
		if (isStill()) {
			cancel();
			renderFrame();
		} else {
			schedule();
		}
	};

	resizeObserver?.observe(container);
	intersectionObserver?.observe(container);
	if (!resizeObserver) window.addEventListener("resize", onWindowResize);
	document.addEventListener("visibilitychange", onVisibility);
	motionQuery?.addEventListener?.("change", onMotionChange);

	resize();
	renderFrame();
	schedule();

	return {
		canvas,
		get options() {
			return resolved;
		},
		get isRunning() {
			return running && !destroyed;
		},
		start() {
			if (destroyed) return;
			running = true;
			schedule();
		},
		stop() {
			running = false;
			cancel();
		},
		update(next: DivineFlowOptions) {
			if (destroyed) return;
			input = { ...input, ...next };
			resolved = resolveOptions(input);
			scene = createScene(resolved);
			buffers = scene.threads.map(makePointBuffer);
			resize();
			renderFrame();
			schedule();
		},
		resize,
		renderFrame,
		destroy() {
			if (destroyed) return;
			destroyed = true;
			running = false;
			cancel();
			resizeObserver?.disconnect();
			intersectionObserver?.disconnect();
			window.removeEventListener("resize", onWindowResize);
			document.removeEventListener("visibilitychange", onVisibility);
			motionQuery?.removeEventListener?.("change", onMotionChange);
			if (ownsCanvas) canvas.remove();
		},
	};
}
