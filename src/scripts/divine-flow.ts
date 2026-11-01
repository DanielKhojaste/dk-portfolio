import { gsap } from "gsap";
import {
	createDivineFlow,
	type DivineFlowInstance,
	type DivineFlowOptions,
} from "../lib/divine-flow";

type FlowOptions = Omit<DivineFlowOptions, "canvas">;

const instances = new WeakMap<HTMLElement, DivineFlowInstance>();

export function parseOptions(value: string | undefined): FlowOptions {
	if (!value) return {};
	try {
		const parsed: unknown = JSON.parse(value);
		return parsed && typeof parsed === "object" ? (parsed as FlowOptions) : {};
	} catch {
		console.warn("divine-flow: ignoring invalid data-options JSON");
		return {};
	}
}

/**
 * Options for the current breakpoint. Keys that only exist in `compact` are reset to `undefined`
 * (i.e. the library default) when leaving the compact layout, because `update()` merges.
 */
export function optionsFor(
	base: FlowOptions,
	compact: FlowOptions | null,
	isCompact: boolean,
): FlowOptions {
	if (!compact) return base;
	if (isCompact) return { ...base, ...compact };
	const reset = Object.fromEntries(Object.keys(compact).map((key) => [key, undefined]));
	return { ...reset, ...base };
}

/** Mount DivineFlow on an element rendered by components/DivineFlow.astro. Idempotent. */
export function mountDivineFlow(el: HTMLElement): DivineFlowInstance | null {
	const existing = instances.get(el);
	if (existing) return existing;

	const base = parseOptions(el.dataset.options);
	const compact = el.dataset.compactOptions ? parseOptions(el.dataset.compactOptions) : null;
	const query =
		compact && el.dataset.compactQuery ? window.matchMedia(el.dataset.compactQuery) : null;

	let flow: DivineFlowInstance;
	try {
		flow = createDivineFlow(el, {
			...optionsFor(base, compact, Boolean(query?.matches)),
			// Flows that draw in start empty, so nothing flashes before the tween begins.
			...(el.dataset.reveal !== undefined || el.hasAttribute("data-manual") ? { reveal: 0 } : {}),
			className: "divine-flow__canvas",
		});
	} catch (error) {
		console.warn("divine-flow: could not start", error);
		return null;
	}

	query?.addEventListener("change", (event) =>
		flow.update(optionsFor(base, compact, event.matches)),
	);

	// Flows outside the menu have nothing to show while it covers them. Manual flows (like the menu's
	// own underlines) are started and stopped by whoever mounted them.
	if (!el.hasAttribute("data-manual")) pauseWhileMenuOpen(flow);
	instances.set(el, flow);
	el.dataset.flowReady = "true";
	return flow;
}

/**
 * The menu covers the whole page, so there is no point drawing behind it; pausing also leaves the
 * main thread free for the menu's own transitions.
 */
export function pauseWhileMenuOpen(
	flow: Pick<DivineFlowInstance, "start" | "stop">,
	doc = document,
) {
	if (doc.documentElement.hasAttribute("data-menu-open")) flow.stop();
	doc.addEventListener("menu:open", () => flow.stop());
	doc.addEventListener("menu:close", () => flow.start());
}

export interface RevealSettings {
	/** Seconds before drawing starts. */
	delay?: number;
	/** Seconds to draw every filament out to its end. */
	duration?: number;
	/** GSAP ease. */
	ease?: string;
}

export function parseReveal(value: string | undefined): Required<RevealSettings> | null {
	if (value === undefined) return null;
	let parsed: RevealSettings = {};
	try {
		parsed = (JSON.parse(value || "{}") as RevealSettings) ?? {};
	} catch {
		parsed = {};
	}
	const seconds = (v: unknown, fallback: number) =>
		typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : fallback;
	return {
		delay: seconds(parsed.delay, 0.2),
		duration: seconds(parsed.duration, 2),
		ease: typeof parsed.ease === "string" ? parsed.ease : "power2.out",
	};
}

/**
 * Draw a flow in: every filament grows from the origin out towards the side. GSAP drives the
 * progress so it shares a ticker (and timing) with the logo animation. Reduced motion skips it.
 */
export function revealFlow(
	flow: Pick<DivineFlowInstance, "setReveal">,
	settings: Required<RevealSettings>,
	reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches,
): gsap.core.Tween | null {
	if (reducedMotion) {
		flow.setReveal(1);
		return null;
	}
	const progress = { value: 0 };
	flow.setReveal(0);
	return gsap.to(progress, {
		value: 1,
		delay: settings.delay,
		duration: settings.duration,
		ease: settings.ease,
		onUpdate: () => flow.setReveal(progress.value),
	});
}

/**
 * Mount every DivineFlow on the page. Elements with `data-reveal` draw in on load, alongside the
 * logo, instead of appearing all at once.
 */
export function mountDivineFlows(root: ParentNode = document) {
	root.querySelectorAll<HTMLElement>("[data-divine-flow]:not([data-manual])").forEach((el) => {
		const flow = mountDivineFlow(el);
		const reveal = parseReveal(el.dataset.reveal);
		if (flow && reveal) revealFlow(flow, reveal);
	});
}
