import { makePointBuffer, samplesForWidth, type FlowLayout } from "./geometry";
import { resolveOptions } from "./options";
import { buildRenderCache, drawFrame, type FrameState, type RenderCache } from "./renderer";
import { createScene, type Scene } from "./scene";
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
		canvas.dataset.divineFlowCanvas = "";
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

	// Layered mode: the low-res bloom gets its own canvas element that the browser scales on the GPU,
	// instead of being upscaled into the full-resolution canvas every frame. Both layers composite
	// normally: an additive CSS blend (plus-lighter) looked marginally brighter but cost ~25% more
	// per frame on a real page. Only possible when the engine owns the canvas.
	const layered = ownsCanvas;

	const bloomCanvas = document.createElement("canvas");
	if (layered) {
		bloomCanvas.setAttribute("aria-hidden", "true");
		bloomCanvas.dataset.divineFlowBloom = "";
		Object.assign(bloomCanvas.style, {
			position: "absolute",
			inset: "0",
			width: "100%",
			height: "100%",
			display: "block",
			pointerEvents: "none",
		});
		container.insertBefore(bloomCanvas, canvas);
	}

	const ctx = get2d(canvas, layered ? { alpha: true } : { alpha: true, desynchronized: true });
	const bloomCtx = get2d(bloomCanvas, { alpha: true });

	const motionQuery =
		typeof window.matchMedia === "function" ? window.matchMedia(REDUCED_MOTION_QUERY) : null;

	let scene: Scene = createScene(resolved);
	let buffers = scene.threads.map(makePointBuffer);
	let width = 1;
	let height = 1;
	let samples = samplesForWidth(width);
	let dpr = 1;
	let cache: RenderCache | null = null;
	let raf = 0;
	let lastFrame = -Infinity;
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

	const createCanvas = (w: number, h: number) => {
		const sprite = document.createElement("canvas");
		sprite.width = w;
		sprite.height = h;
		return sprite;
	};

	function frameState() {
		return {
			ctx,
			bloomCtx,
			scene,
			buffers,
			samples,
			layout: layout(),
			palette: resolved.palette,
			emberSpeed: resolved.emberSpeed,
			composeBloom: !layered,
		};
	}

	/** Gradients and sprites depend on size, DPR, palette and scene, so rebuild them only then. */
	function rebuildCache() {
		cache = buildRenderCache(frameState(), {
			variance: resolved.variance,
			dpr,
			createCanvas,
		});
	}

	function renderFrame(timeMs: number = performance.now()) {
		if (destroyed) return;
		if (!cache) rebuildCache();
		const state: FrameState = { ...frameState(), cache: cache! };
		drawFrame(state, timeMs / 1000);
	}

	function tick(now: number) {
		raf = 0;
		if (!shouldAnimate()) return;
		// Frame-rate cap with a 1ms tolerance so a 60Hz display never skips frames at maxFps 60.
		if (now - lastFrame >= 1000 / resolved.maxFps - 1) {
			lastFrame = now;
			renderFrame(now);
		}
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
		dpr = Math.min(window.devicePixelRatio || 1, resolved.maxDpr);
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
		rebuildCache();

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
			cache = null;
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
			if (layered) bloomCanvas.remove();
		},
	};
}
