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
			className: "divine-flow__canvas",
		});
	} catch (error) {
		console.warn("divine-flow: could not start", error);
		return null;
	}

	query?.addEventListener("change", (event) =>
		flow.update(optionsFor(base, compact, event.matches)),
	);

	pauseWhileMenuOpen(flow);
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

const LOGO_DRAWN = "logo:drawn";

/** Resolve once the header logo has finished writing (or straight away if it already has). */
function logoDrawn(timeout: number): Promise<void> {
	if (document.documentElement.hasAttribute("data-logo-drawn")) return Promise.resolve();
	return new Promise((resolve) => {
		const done = () => {
			document.removeEventListener(LOGO_DRAWN, done);
			clearTimeout(timer);
			resolve();
		};
		const timer = setTimeout(done, timeout);
		document.addEventListener(LOGO_DRAWN, done);
	});
}

/** Run `task` when the browser is idle (with a short deadline), so it never lands mid-animation. */
function whenIdle(task: () => void) {
	if ("requestIdleCallback" in window) window.requestIdleCallback(task, { timeout: 400 });
	else setTimeout(task, 50);
}

/**
 * Mount every DivineFlow on the page. Elements marked `data-after-logo` wait for the logo to finish
 * writing (up to `data-start-timeout` ms) and then for an idle moment, so the logo animation gets the
 * main thread to itself during load.
 */
export function mountDivineFlows(root: ParentNode = document) {
	root.querySelectorAll<HTMLElement>("[data-divine-flow]").forEach((el) => {
		if (!el.hasAttribute("data-after-logo")) {
			mountDivineFlow(el);
			return;
		}
		const timeout = Number(el.dataset.startTimeout) || 2600;
		logoDrawn(timeout).then(() => whenIdle(() => mountDivineFlow(el)));
	});
}
