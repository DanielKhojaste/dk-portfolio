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

	instances.set(el, flow);
	el.dataset.flowReady = "true";
	return flow;
}

export function mountDivineFlows(root: ParentNode = document) {
	root.querySelectorAll<HTMLElement>("[data-divine-flow]").forEach((el) => mountDivineFlow(el));
}
