/**
 * DivineFlow underlines for the menu links: hovering, focusing or pressing a link draws a white
 * strand out from the middle of the word to both sides; leaving draws it back in. Each underline is
 * mounted the first time it is needed and only runs while it is showing.
 */
import { gsap } from "gsap";
import type { DivineFlowInstance } from "../lib/divine-flow";
import { mountDivineFlow } from "./divine-flow";

export interface UnderlineTiming {
	/** Seconds to draw out. */
	in: number;
	/** Seconds to draw back in. */
	out: number;
	/** GSAP ease for both directions. Default "power2.inOut". */
	ease?: string;
}

type Flow = Pick<DivineFlowInstance, "start" | "stop" | "setReveal">;

export interface UnderlineController {
	show(): void;
	hide(): void;
	readonly progress: number;
}

/** Drive one underline: mount on first show, tween the draw-in, stop the loop once hidden. */
export function underlineController(
	mount: () => Flow | null,
	timing: UnderlineTiming,
	reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches,
): UnderlineController {
	let flow: Flow | null = null;
	const state = { progress: 0 };
	let tween: gsap.core.Tween | null = null;
	const apply = () => flow?.setReveal(state.progress);

	return {
		get progress() {
			return state.progress;
		},
		show() {
			flow ??= mount();
			if (!flow) return;
			tween?.kill();
			flow.start();
			if (reducedMotion) {
				state.progress = 1;
				apply();
				return;
			}
			tween = gsap.to(state, {
				progress: 1,
				duration: timing.in * (1 - state.progress),
				ease: timing.ease ?? "power2.inOut",
				onUpdate: apply,
			});
		},
		hide() {
			if (!flow) return;
			tween?.kill();
			if (reducedMotion) {
				state.progress = 0;
				apply();
				flow.stop();
				return;
			}
			tween = gsap.to(state, {
				progress: 0,
				duration: timing.out * state.progress,
				ease: timing.ease ?? "power2.inOut",
				onUpdate: apply,
				onComplete: () => flow?.stop(),
			});
		},
	};
}

export function setupMenuUnderlines(root: Document, timing: UnderlineTiming) {
	const links = root.querySelectorAll<HTMLElement>("[data-menu] [data-menu-link]");
	const controllers: UnderlineController[] = [];

	links.forEach((link) => {
		const el = link.querySelector<HTMLElement>("[data-divine-flow]");
		if (!el) return;
		const underline = underlineController(() => mountDivineFlow(el), timing);
		controllers.push(underline);

		let hovered = false;
		let focused = false;
		const update = () => (hovered || focused ? underline.show() : underline.hide());

		link.addEventListener("pointerenter", () => {
			hovered = true;
			update();
		});
		link.addEventListener("pointerleave", () => {
			hovered = false;
			update();
		});
		// Touch has no hover: show it while the finger is down.
		link.addEventListener("pointerdown", () => underline.show());
		// Keyboard focus only: the menu focuses its first link on open, which shouldn't light it up for
		// someone using a mouse.
		link.addEventListener("focus", () => {
			focused = link.matches(":focus-visible");
			update();
		});
		link.addEventListener("blur", () => {
			focused = false;
			update();
		});
	});

	// Nothing stays drawn (or running) once the menu closes.
	root.addEventListener("menu:close", () => controllers.forEach((c) => c.hide()));
}
