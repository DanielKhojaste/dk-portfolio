import { makePointBuffer, samplesForWidth, type FlowLayout } from "./geometry";
import type { Point } from "./math";
import { resolveOptions } from "./options";
import { buildRenderCache, drawFrame, type FrameState, type RenderCache } from "./renderer";
import { createScene, type Scene } from "./scene";
import type { DivineFlowOptions, ResolvedDivineFlowOptions } from "./types";

/** A canvas on the page, or one transferred to a worker. */
export type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;
export type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
export type CanvasFactory = (width: number, height: number) => AnyCanvas;

/**
 * Everything needed to draw a DivineFlow into a pair of canvases, with no DOM access, so the same
 * code runs on the main thread or in a worker (on `OffscreenCanvas`es).
 */
export interface FlowCore {
	readonly options: Readonly<ResolvedDivineFlowOptions>;
	/** Replace the options (already merged by the caller) and rebuild the scene. */
	setOptions(input: DivineFlowOptions): void;
	/** Size the canvases for a `width` x `height` CSS px box at `dpr`. */
	resize(width: number, height: number, dpr: number): void;
	setReveal(progress: number): void;
	setStill(still: boolean): void;
	/** Draw one frame at `timeMs`. */
	render(timeMs: number): void;
}

export interface CoreSettings {
	/** Bloom on its own canvas (layered) rather than composited into the main one. */
	layered: boolean;
	createCanvas: CanvasFactory;
	/** Extra context settings for the main canvas (e.g. `desynchronized`). */
	contextSettings?: CanvasRenderingContext2DSettings;
}

export function get2d(canvas: AnyCanvas, settings?: CanvasRenderingContext2DSettings): Ctx2D {
	const ctx = canvas.getContext("2d", settings) as Ctx2D | null;
	if (!ctx) throw new Error("divine-flow: 2D canvas context is not available.");
	return ctx;
}

export function createFlowCore(
	canvas: AnyCanvas,
	bloomCanvas: AnyCanvas,
	input: DivineFlowOptions,
	{ layered, createCanvas, contextSettings }: CoreSettings,
): FlowCore {
	let resolved = resolveOptions(input);
	const ctx = get2d(canvas, { alpha: true, ...contextSettings });
	const bloomCtx = get2d(bloomCanvas, { alpha: true });

	let scene: Scene = createScene(resolved);
	let buffers: Point[][] = scene.threads.map(makePointBuffer);
	let width = 1;
	let height = 1;
	let dpr = 1;
	let samples = samplesForWidth(width);
	let cache: RenderCache | null = null;
	let reveal = resolved.reveal;
	let still = false;

	const layout = (): FlowLayout => ({
		width,
		height,
		originX: resolved.originX,
		originY: resolved.originY,
		innerGap: resolved.innerGap,
		spread: resolved.spread,
		amplitude: resolved.amplitude,
		tilt: resolved.tilt,
		motion: resolved.motion,
		still,
	});

	const frameState = (): Omit<FrameState, "cache"> => ({
		ctx,
		bloomCtx,
		scene,
		buffers,
		samples,
		layout: layout(),
		palette: resolved.palette,
		emberSpeed: resolved.emberSpeed,
		composeBloom: !layered,
		reveal,
		revealStagger: resolved.revealStagger,
	});

	/** Gradients and sprites depend on size, DPR, palette and scene, so rebuild them only then. */
	const rebuildCache = () => {
		cache = buildRenderCache(frameState(), {
			variance: resolved.variance,
			shadeRanges: { hue: resolved.hueRange, light: resolved.lightRange },
			dpr,
			createCanvas,
		});
	};

	return {
		get options() {
			return resolved;
		},
		setOptions(next) {
			resolved = resolveOptions(next);
			if (next.reveal !== undefined) reveal = resolved.reveal;
			scene = createScene(resolved);
			buffers = scene.threads.map(makePointBuffer);
			cache = null;
		},
		resize(w, h, devicePixelRatio) {
			width = Math.max(1, Math.round(w));
			height = Math.max(1, Math.round(h));
			dpr = Math.min(devicePixelRatio || 1, resolved.maxDpr);
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
		},
		setReveal(progress) {
			reveal = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 1));
		},
		setStill(value) {
			still = value;
		},
		render(timeMs) {
			if (!cache) rebuildCache();
			drawFrame({ ...frameState(), cache: cache! }, timeMs / 1000);
		},
	};
}
